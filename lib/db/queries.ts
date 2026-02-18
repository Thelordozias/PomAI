// Pure query functions — accept a Supabase client, return typed results.
// RLS on all tables means the client's session automatically scopes to the
// authenticated user; no manual user_id filtering needed on reads.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Course, Chapter, Concept, Capture, Deck, Flashcard } from "@/types";

/* ─── Courses ────────────────────────────────────────────────────────── */

export async function getCourses(supabase: SupabaseClient): Promise<Course[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Course[];
}

export async function getCourse(
  supabase: SupabaseClient,
  courseId: string
): Promise<Course | null> {
  const { data } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();
  return (data as Course) ?? null;
}

/* ─── Chapters ───────────────────────────────────────────────────────── */

export async function getChapters(
  supabase: SupabaseClient,
  courseId: string
): Promise<Chapter[]> {
  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("course_id", courseId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Chapter[];
}

/* ─── Concepts ───────────────────────────────────────────────────────── */

export async function getConcepts(
  supabase: SupabaseClient,
  courseId: string
): Promise<Concept[]> {
  const { data, error } = await supabase
    .from("concepts")
    .select("*")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Concept[];
}

export async function getConcept(
  supabase: SupabaseClient,
  conceptId: string
): Promise<Concept | null> {
  const { data } = await supabase
    .from("concepts")
    .select("*")
    .eq("id", conceptId)
    .single();
  return (data as Concept) ?? null;
}

/* ─── Captures ───────────────────────────────────────────────────────── */

export async function getCaptures(
  supabase: SupabaseClient,
  courseId: string
): Promise<Capture[]> {
  const { data, error } = await supabase
    .from("captures")
    .select("*")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Capture[];
}

/* ─── Decks ──────────────────────────────────────────────────────────── */

export async function getDecks(
  supabase: SupabaseClient,
  courseId: string
): Promise<Deck[]> {
  const { data, error } = await supabase
    .from("decks")
    .select("*")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Deck[];
}

/* ─── Flashcards ─────────────────────────────────────────────────────── */

export async function getFlashcardsByDeck(
  supabase: SupabaseClient,
  deckId: string
): Promise<Flashcard[]> {
  const { data, error } = await supabase
    .from("flashcards")
    .select("*")
    .eq("deck_id", deckId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Flashcard[];
}

/** Returns all flashcards due today for the current user (used by review queue). */
export async function getDueFlashcards(
  supabase: SupabaseClient
): Promise<Flashcard[]> {
  const { data, error } = await supabase
    .from("flashcards")
    .select(`
      *,
      concept_progress!inner (
        next_review_at
      )
    `)
    .lte("concept_progress.next_review_at", new Date().toISOString())
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Flashcard[];
}
