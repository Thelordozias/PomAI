import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface ExplainRequest {
  concept: string;
  courseTitle?: string;
}

interface ExplainResult {
  definition: string;
  formula: string;
  example: string;
  common_mistake: string;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY missing." }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as ExplainRequest;
  const concept = body.concept?.trim();
  if (!concept) return NextResponse.json({ error: "concept is required." }, { status: 400 });

  const contextHint = body.courseTitle ? ` in the context of ${body.courseTitle}` : "";
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const prompt = `You are a university-level academic tutor${contextHint}. Explain the concept "${concept}" with structured academic precision.

Return ONLY a valid JSON object with these exact keys:
- "definition": a clear, concise formal definition (1-3 sentences)
- "formula": the key formula, equation or expression if applicable (use LaTeX-style notation, empty string if not applicable)
- "example": a concrete worked example (2-4 sentences)
- "common_mistake": the most common misconception or error students make (1-2 sentences)

JSON only, no markdown, no extra text.`;

  const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 600,
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

  try {
    const result = JSON.parse(raw) as ExplainResult;
    return NextResponse.json({
      definition: result.definition ?? "",
      formula: result.formula ?? "",
      example: result.example ?? "",
      common_mistake: result.common_mistake ?? "",
    });
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response." }, { status: 502 });
  }
}
