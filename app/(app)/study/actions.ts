"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  ActionResult,
  Capture,
  MathCaptureContent,
  GenericCaptureContent,
} from "@/types";

/**
 * Creates a capture and, for math mode, auto-creates or links an existing
 * Concept from the capture's `concept` field.
 */
export async function createCapture(
  courseId: string,
  mode: "math" | "generic",
  content: MathCaptureContent | GenericCaptureContent,
  confidence: number,
  chapterId?: string
): Promise<ActionResult<Capture>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  let conceptId: string | null = null;

  // Auto-create / link a Concept from math captures
  if (mode === "math") {
    const mathContent = content as MathCaptureContent;
    const conceptTitle = mathContent.concept.trim();
    if (conceptTitle) {
      const { data: existing } = await supabase
        .from("concepts")
        .select("id")
        .eq("course_id", courseId)
        .eq("title", conceptTitle)
        .maybeSingle();

      if (existing) {
        conceptId = (existing as { id: string }).id;
      } else {
        const { data: newConcept } = await supabase
          .from("concepts")
          .insert({
            user_id: user.id,
            course_id: courseId,
            title: conceptTitle,
            chapter_id: chapterId ?? null,
            tags: [],
            confidence,
          })
          .select("id")
          .single();
        conceptId = (newConcept as { id: string } | null)?.id ?? null;
      }
    }
  }

  const { data, error } = await supabase
    .from("captures")
    .insert({
      user_id: user.id,
      course_id: courseId,
      chapter_id: chapterId ?? null,
      concept_id: conceptId,
      mode,
      content,
      confidence,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/study");
  return { success: true, data: data as Capture };
}

export async function deleteCapture(
  captureId: string
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("captures")
    .delete()
    .eq("id", captureId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/study");
  return { success: true, data: null };
}
