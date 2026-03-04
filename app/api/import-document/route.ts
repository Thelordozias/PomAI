import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface ImportJsonBody {
  courseId: string;
  text: string;
  filename: string;
  chapterId?: string;
}

/** Chunk text into ~300-word blocks */
function chunkText(text: string): string[] {
  const words = text.trim().split(/\s+/);
  const chunks: string[] = [];
  const CHUNK_SIZE = 300;

  for (let i = 0; i < words.length; i += CHUNK_SIZE) {
    const chunk = words.slice(i, i + CHUNK_SIZE).join(" ");
    if (chunk.trim().length > 20) chunks.push(chunk.trim());
  }
  return chunks;
}

const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string }>; // eslint-disable-line

async function extractPdfText(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = request.headers.get("content-type") ?? "";

  let courseId: string;
  let text: string;
  let filename: string;
  let chapterId: string | undefined;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    courseId = (formData.get("courseId") as string) ?? "";
    chapterId = (formData.get("chapterId") as string) || undefined;
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    filename = file.name;

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      text = await extractPdfText(buffer);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[import-document] PDF parse error:", msg);
      return NextResponse.json({ error: `Failed to read PDF: ${msg}` }, { status: 400 });
    }
  } else {
    const body = (await request.json()) as ImportJsonBody;
    courseId = body.courseId;
    text = body.text;
    filename = body.filename;
    chapterId = body.chapterId;
  }

  if (!courseId?.trim()) return NextResponse.json({ error: "courseId required" }, { status: 400 });
  if (!text?.trim()) return NextResponse.json({ error: "text required" }, { status: 400 });

  // Verify course belongs to user
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const chunks = chunkText(text);
  if (chunks.length === 0) return NextResponse.json({ error: "No readable text found" }, { status: 400 });

  // Cap at 20 captures per import
  const toInsert = chunks.slice(0, 20).map((chunk, i) => ({
    user_id: user.id,
    course_id: courseId,
    chapter_id: chapterId ?? null,
    concept_id: null,
    mode: "generic" as const,
    content: {
      notes: `[${filename} — bloc ${i + 1}/${chunks.length}]\n\n${chunk}`,
    },
    confidence: 0,
  }));

  const { error, data } = await supabase
    .from("captures")
    .insert(toInsert)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    created: data?.length ?? 0,
    total_chunks: chunks.length,
    capped: chunks.length > 20,
  });
}
