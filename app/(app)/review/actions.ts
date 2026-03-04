"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, Deck, Flashcard, ReviewResult, ConceptProgress } from "@/types";

const DeckSchema = z.object({
  courseId: z.string().uuid("Cours invalide"),
  title:    z.string().min(1, "Le titre du deck est requis").max(100, "Titre trop long"),
});

const FlashcardSchema = z.object({
  deckId: z.string().uuid("Deck invalide"),
  front:  z.string().min(1, "La question est requise").max(500, "Question trop longue"),
  back:   z.string().min(1, "La réponse est requise").max(1000, "Réponse trop longue"),
});

/* ─── SM-2 scheduler ─────────────────────────────────────────────────── */

function calcNextReview(
  result: ReviewResult,
  intervalDays: number,
  easeFactor: number
): { intervalDays: number; easeFactor: number; nextReviewAt: Date } {
  let newInterval: number;
  let newEase: number;

  if (result === "miss") {
    newInterval = 1;
    newEase = Math.max(1.3, easeFactor - 0.3);
  } else if (result === "hard") {
    newInterval = Math.max(1, Math.floor(intervalDays * 1.2));
    newEase = Math.max(1.3, easeFactor - 0.15);
  } else {
    // know
    newInterval = Math.max(1, Math.floor(intervalDays * easeFactor));
    newEase = Math.min(3.0, easeFactor + 0.1);
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);
  return { intervalDays: newInterval, easeFactor: newEase, nextReviewAt };
}

/* ─── Decks ──────────────────────────────────────────────────────────── */

export async function createDeck(
  courseId: string,
  title: string
): Promise<ActionResult<Deck>> {
  const parsed = DeckSchema.safeParse({ courseId, title: title.trim() });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const cleanTitle = parsed.data.title;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("decks")
    .insert({ user_id: user.id, course_id: courseId, title: cleanTitle })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/review");
  return { success: true, data: data as Deck };
}

export async function deleteDeck(deckId: string): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.from("decks").delete().eq("id", deckId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/review");
  return { success: true, data: null };
}

/* ─── Flashcards ─────────────────────────────────────────────────────── */

export async function createFlashcard(
  deckId: string,
  front: string,
  back: string,
  conceptId?: string
): Promise<ActionResult<Flashcard>> {
  const parsed = FlashcardSchema.safeParse({ deckId, front: front.trim(), back: back.trim() });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const cleanFront = parsed.data.front;
  const cleanBack = parsed.data.back;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("flashcards")
    .insert({
      user_id: user.id,
      deck_id: deckId,
      concept_id: conceptId ?? null,
      type: "basic",
      front: cleanFront,
      back: cleanBack,
      difficulty: 3,
      source: { kind: "manual" },
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/review");
  return { success: true, data: data as Flashcard };
}

export async function deleteFlashcard(
  flashcardId: string
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("flashcards")
    .delete()
    .eq("id", flashcardId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/review");
  return { success: true, data: null };
}

/* ─── Review ─────────────────────────────────────────────────────────── */

export async function submitReview(
  flashcardId: string,
  conceptId: string | null,
  result: ReviewResult
): Promise<ActionResult<null>> {
  if (!flashcardId.trim()) {
    return { success: false, error: "Flashcard is required" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // 1. Insert review log
  const { error: logError } = await supabase.from("review_logs").insert({
    user_id: user.id,
    flashcard_id: flashcardId,
    result,
  });
  if (logError) return { success: false, error: logError.message };

  // 2. Update concept progress if concept is linked
  if (conceptId) {
    const { data: existing } = await supabase
      .from("concept_progress")
      .select("*")
      .eq("concept_id", conceptId)
      .eq("user_id", user.id)
      .maybeSingle();

    const prev = existing as ConceptProgress | null;
    const intervalDays = prev?.interval_days ?? 1;
    const easeFactor = prev?.ease_factor ?? 2.5;
    const masteryScore = prev?.mastery_score ?? 0;

    const next = calcNextReview(result, intervalDays, easeFactor);

    const delta =
      result === "know" ? 10 : result === "hard" ? -2 : -10;
    const newMastery = Math.min(100, Math.max(0, masteryScore + delta));

    const { error: progressError } = await supabase.from("concept_progress").upsert(
      {
        user_id: user.id,
        concept_id: conceptId,
        mastery_score: newMastery,
        next_review_at: next.nextReviewAt.toISOString(),
        interval_days: next.intervalDays,
        ease_factor: next.easeFactor,
      },
      { onConflict: "user_id,concept_id" }
    );

    if (progressError) {
      return { success: false, error: progressError.message };
    }
  }

  revalidatePath("/dashboard");
  return { success: true, data: null };
}
