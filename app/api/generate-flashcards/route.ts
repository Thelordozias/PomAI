import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface GenerateRequest {
  captureId?: string;
  deckId: string;
  count?: number;
}

interface GeneratedCard {
  front: string;
  back: string;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY missing." }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as GenerateRequest;
  const { captureId, deckId, count = 5 } = body;

  if (!deckId?.trim()) {
    return NextResponse.json({ error: "deckId is required." }, { status: 400 });
  }

  // Verify deck belongs to user
  const { data: deck } = await supabase
    .from("decks")
    .select("id, title, course_id")
    .eq("id", deckId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!deck) {
    return NextResponse.json({ error: "Deck not found." }, { status: 404 });
  }

  let studyText = "";

  if (captureId) {
    // Generate from a specific capture
    const { data: capture } = await supabase
      .from("captures")
      .select("mode, content")
      .eq("id", captureId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!capture) {
      return NextResponse.json({ error: "Capture not found." }, { status: 404 });
    }

    const c = capture as { mode: string; content: Record<string, unknown> };
    if (c.mode === "math") {
      const mc = c.content as { concept?: string; definition?: string; formula?: string; example?: string; common_mistake?: string };
      const parts = [
        mc.concept && `Concept: ${mc.concept}`,
        mc.definition && `Definition: ${mc.definition}`,
        mc.formula && `Formula: ${mc.formula}`,
        mc.example && `Example: ${mc.example}`,
        mc.common_mistake && `Common mistake: ${mc.common_mistake}`,
      ].filter(Boolean);
      studyText = parts.join("\n");
    } else {
      const gc = c.content as { notes?: string };
      studyText = gc.notes ?? "";
    }
  } else {
    // Generate from recent captures in the course
    const deckData = deck as { course_id: string };
    const { data: captures } = await supabase
      .from("captures")
      .select("mode, content")
      .eq("course_id", deckData.course_id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8);

    studyText = (captures ?? [])
      .map((c) => {
        const capture = c as { mode: string; content: Record<string, unknown> };
        if (capture.mode === "math") {
          const mc = capture.content as { concept?: string; formula?: string; definition?: string };
          return [mc.concept, mc.formula, mc.definition].filter(Boolean).join(" — ");
        }
        const gc = capture.content as { notes?: string };
        return gc.notes ?? "";
      })
      .join("\n\n");
  }

  if (!studyText.trim()) {
    return NextResponse.json({ error: "No study content found to generate flashcards from." }, { status: 400 });
  }

  const safeCount = Math.min(Math.max(count, 2), 10);
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const prompt = `You are a study card generator. Given the study material below, generate exactly ${safeCount} flashcards that test key understanding.

Rules:
- Front: a clear, focused question or prompt
- Back: a concise, accurate answer (1-3 sentences max)
- Cover different aspects: definitions, applications, formulas, common mistakes
- Make questions specific enough to be unambiguous
- Return ONLY a valid JSON array, no explanation, no markdown

Format:
[{"front":"...","back":"..."},{"front":"...","back":"..."}]

Study material:
${studyText.slice(0, 2000)}`;

  const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1200,
      response_format: { type: "json_object" },
    }),
  });

  if (!openAiResponse.ok) {
    const detail = await openAiResponse.text();
    return NextResponse.json({ error: "OpenAI request failed.", detail }, { status: 502 });
  }

  const payload = (await openAiResponse.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const raw = payload.choices?.[0]?.message?.content ?? "";

  let cards: GeneratedCard[] = [];
  try {
    // Try to parse as JSON object with array inside, or direct array
    const parsed = JSON.parse(raw) as Record<string, unknown> | GeneratedCard[];
    if (Array.isArray(parsed)) {
      cards = parsed as GeneratedCard[];
    } else {
      // Find the array in the object
      const arr = Object.values(parsed).find(Array.isArray);
      if (arr) cards = arr as GeneratedCard[];
    }
  } catch {
    // Fallback: try to extract JSON array from response
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        cards = JSON.parse(match[0]) as GeneratedCard[];
      } catch {
        return NextResponse.json({ error: "Failed to parse AI response." }, { status: 502 });
      }
    } else {
      return NextResponse.json({ error: "Failed to parse AI response." }, { status: 502 });
    }
  }

  // Filter valid cards
  cards = cards
    .filter((c) => c && typeof c.front === "string" && typeof c.back === "string")
    .filter((c) => c.front.trim() && c.back.trim())
    .slice(0, safeCount);

  if (cards.length === 0) {
    return NextResponse.json({ error: "No valid flashcards generated." }, { status: 502 });
  }

  // Insert flashcards into DB
  const toInsert = cards.map((c) => ({
    user_id: user.id,
    deck_id: deckId,
    type: "basic" as const,
    front: c.front.trim(),
    back: c.back.trim(),
    difficulty: 3,
    source: { kind: "ai" as const, capture_id: captureId ?? null },
  }));

  const { data: inserted, error: insertError } = await supabase
    .from("flashcards")
    .insert(toInsert)
    .select();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ cards: inserted, count: (inserted ?? []).length });
}
