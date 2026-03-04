import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  message?: string;
  history?: ChatMessage[];
  courseId?: string;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is missing on server." },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as ChatRequestBody;
  const message = body.message?.trim() ?? "";
  const history = (body.history ?? []).filter(
    (msg) => (msg.role === "user" || msg.role === "assistant") && msg.content?.trim()
  );

  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  // Build RAG context from user's captures if a course is selected
  let contextBlock = "";
  const courseId = body.courseId?.trim();

  if (courseId) {
    const [{ data: course }, { data: captures }] = await Promise.all([
      supabase.from("courses").select("id,title").eq("id", courseId).maybeSingle(),
      supabase
        .from("captures")
        .select("mode,content,created_at")
        .eq("course_id", courseId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    if (course) {
      const courseData = course as { title: string };
      const captureSummary = (captures ?? [])
        .map((capture, index) => {
          const c = capture as { mode: string; content: Record<string, unknown> };
          if (c.mode === "math") {
            const mc = c.content as { concept?: string; formula?: string; definition?: string; example?: string };
            const parts = [
              mc.concept && `Concept: ${mc.concept}`,
              mc.formula && `Formula: ${mc.formula}`,
              mc.definition && `Definition: ${mc.definition}`,
              mc.example && `Example: ${mc.example}`,
            ].filter(Boolean).join(" | ");
            return `${index + 1}. [Math] ${parts}`;
          } else {
            const gc = c.content as { notes?: string };
            return `${index + 1}. [Note] ${(gc.notes ?? "").slice(0, 200)}`;
          }
        })
        .join("\n");

      contextBlock = `The student is studying: "${courseData.title}"\n\nTheir recent notes:\n${captureSummary || "No captures yet."}`;
    }
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  // Build messages array for Chat Completions API
  const messages: Array<{ role: string; content: string }> = [
    {
      role: "system",
      content:
        "You are PomAI, a focused and practical study coach. Give clear, structured answers. Use bullet points and numbered lists for clarity. Include a short \"Next step\" at the end when giving explanations. Keep responses concise and actionable — students are studying, not reading essays.",
    },
  ];

  if (contextBlock) {
    messages.push({
      role: "system",
      content: `Student context:\n${contextBlock}`,
    });
  }

  // Add conversation history (last 10 turns)
  for (const entry of history.slice(-10)) {
    messages.push({ role: entry.role, content: entry.content });
  }

  // Add the new user message
  messages.push({ role: "user", content: message });

  const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      max_tokens: 800,
    }),
  });

  if (!openAiResponse.ok) {
    const detail = await openAiResponse.text();
    return NextResponse.json(
      { error: "OpenAI request failed.", detail },
      { status: 502 }
    );
  }

  const payload = (await openAiResponse.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const reply = payload.choices?.[0]?.message?.content?.trim() ?? "";

  if (!reply) {
    return NextResponse.json(
      { error: "OpenAI returned an empty response." },
      { status: 502 }
    );
  }

  return NextResponse.json({ reply, model });
}
