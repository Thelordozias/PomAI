"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, Course, Chapter } from "@/types";

/* ─── Courses ────────────────────────────────────────────────────────── */

export async function createCourse(
  title: string,
  description: string
): Promise<ActionResult<Course>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("courses")
    .insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/courses");
  return { success: true, data: data as Course };
}

export async function updateCourse(
  courseId: string,
  title: string,
  description: string
): Promise<ActionResult<Course>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("courses")
    .update({
      title: title.trim(),
      description: description.trim() || null,
    })
    .eq("id", courseId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
  return { success: true, data: data as Course };
}

export async function deleteCourse(
  courseId: string
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", courseId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/courses");
  return { success: true, data: null };
}

/* ─── Chapters ───────────────────────────────────────────────────────── */

export async function createChapter(
  courseId: string,
  title: string
): Promise<ActionResult<Chapter>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Determine next position
  const { data: existing } = await supabase
    .from("chapters")
    .select("position")
    .eq("course_id", courseId)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = ((existing?.[0] as { position: number } | undefined)?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("chapters")
    .insert({
      user_id: user.id,
      course_id: courseId,
      title: title.trim(),
      position: nextPosition,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath(`/courses/${courseId}`);
  return { success: true, data: data as Chapter };
}

export async function updateChapter(
  chapterId: string,
  courseId: string,
  title: string
): Promise<ActionResult<Chapter>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("chapters")
    .update({ title: title.trim() })
    .eq("id", chapterId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath(`/courses/${courseId}`);
  return { success: true, data: data as Chapter };
}

export async function deleteChapter(
  chapterId: string,
  courseId: string
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("chapters")
    .delete()
    .eq("id", chapterId);

  if (error) return { success: false, error: error.message };
  revalidatePath(`/courses/${courseId}`);
  return { success: true, data: null };
}
