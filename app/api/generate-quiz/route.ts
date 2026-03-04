import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface GenerateQuizRequest {
  courseId: string;
  count?: number;
}

export interface MCQQuestion {
  type: "mcq";
  id: string;
  question: string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  explanation: string;
}

export interface TextQuestion {
  type: "text";
  id: string;
  question: string;
  expected: string;
  keywords: string[];
  explanation: string;
}

export type QuizQuestion = MCQQuestion | TextQuestion;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY missing." }, { status: 500 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as GenerateQuizRequest;
  const { courseId, count = 8 } = body;
  if (!courseId?.trim()) return NextResponse.json({ error: "courseId required." }, { status: 400 });

  // Get course + captures
  const [{ data: course }, { data: captures }] = await Promise.all([
    supabase.from("courses").select("title").eq("id", courseId).eq("user_id", user.id).maybeSingle(),
    supabase.from("captures").select("mode, content").eq("course_id", courseId).eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(15),
  ]);

  if (!course) return NextResponse.json({ error: "Course not found." }, { status: 404 });

  const courseTitle = (course as { title: string }).title;
  const captureList = (captures ?? []);

  if (captureList.length === 0) {
    return NextResponse.json({ error: "No captures found. Add study notes first." }, { status: 400 });
  }

  const studyMaterial = captureList.map((c, i) => {
    const cap = c as { mode: string; content: Record<string, string> };
    if (cap.mode === "math") {
      const parts = [
        cap.content.concept && `Concept: ${cap.content.concept}`,
        cap.content.definition && `Definition: ${cap.content.definition}`,
        cap.content.formula && `Formula: ${cap.content.formula}`,
        cap.content.example && `Example: ${cap.content.example}`,
        cap.content.common_mistake && `Common mistake: ${cap.content.common_mistake}`,
      ].filter(Boolean).join(" | ");
      return `${i + 1}. [Math] ${parts}`;
    }
    return `${i + 1}. [Note] ${(cap.content.notes ?? "").slice(0, 300)}`;
  }).join("\n");

  const safeCount = Math.min(Math.max(count, 3), 15);
  const mcqCount = Math.ceil(safeCount * 0.6);
  const textCount = safeCount - mcqCount;
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const prompt = `You are a university exam question generator for the course "${courseTitle}".

Based on this study material, generate exactly ${mcqCount} multiple-choice questions AND ${textCount} free-text questions.

Rules:
- MCQ: 4 options (A/B/C/D), only one correct. Distractors must be plausible but clearly wrong.
- Text: open-ended questions requiring a written answer (1-3 sentences expected)
- Cover DIFFERENT topics — don't repeat the same concept
- Mix difficulty: easy (30%), medium (50%), hard (20%)
- Include a short explanation for each correct answer

Return ONLY a valid JSON object with key "questions" containing an array. Each item:
MCQ format: {"type":"mcq","question":"...","options":["A text","B text","C text","D text"],"correct":0,"explanation":"..."}
Text format: {"type":"text","question":"...","expected":"model answer here","keywords":["key","words"],"explanation":"..."}

correct = index 0-3 of the correct option.

Study material:
${studyMaterial.slice(0, 3000)}`;

  const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    }),
  });

  if (!openAiResponse.ok) {
    const detail = await openAiResponse.text();
    return NextResponse.json({ error: "OpenAI failed.", detail }, { status: 502 });
  }

  const payload = (await openAiResponse.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = payload.choices?.[0]?.message?.content ?? "";

  try {
    const parsed = JSON.parse(raw) as { questions?: unknown[] };
    const questions = (parsed.questions ?? []) as QuizQuestion[];

    // Add unique IDs
    const withIds = questions
      .filter((q) => q && q.type && q.question)
      .map((q, i) => ({ ...q, id: `q-${i}-${Date.now()}` }))
      .slice(0, safeCount);

    return NextResponse.json({ questions: withIds, courseTitle });
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response." }, { status: 502 });
  }
}
