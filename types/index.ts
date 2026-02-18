// Central type definitions for PomAI.
// All DB entities map 1-to-1 with the Supabase schema described in the spec.
// Extend here as new tables are added.

/* ─── Shared ─────────────────────────────────────────────────────────── */

export type UUID = string;

export interface BaseRow {
  id: UUID;
  user_id: UUID;
  created_at: string; // ISO timestamp
  updated_at: string;
}

/* ─── Courses ────────────────────────────────────────────────────────── */

export interface Course extends BaseRow {
  title: string;
  description: string | null;
}

export interface Chapter extends BaseRow {
  course_id: UUID;
  title: string;
  position: number;
}

/* ─── Concepts ───────────────────────────────────────────────────────── */

export interface Concept extends BaseRow {
  course_id: UUID;
  chapter_id: UUID | null;
  title: string;
  summary: string | null;
  tags: string[];       // stored as jsonb
  confidence: number;   // 0–5
}

/* ─── Captures ───────────────────────────────────────────────────────── */

export type CaptureMode = "math" | "generic";

// Math mode fields
export interface MathCaptureContent {
  concept: string;
  definition: string;
  formula: string;
  example: string;
  common_mistake: string;
}

// Generic mode fields
export interface GenericCaptureContent {
  notes: string;
}

export type CaptureContent = MathCaptureContent | GenericCaptureContent;

export interface Capture extends BaseRow {
  course_id: UUID;
  chapter_id: UUID | null;
  concept_id: UUID | null;
  mode: CaptureMode;
  content: CaptureContent; // stored as jsonb
  confidence: number;       // 0–5
}

/* ─── Flashcards & Decks ─────────────────────────────────────────────── */

export interface Deck extends BaseRow {
  course_id: UUID;
  title: string;
}

export type FlashcardType = "basic" | "cloze" | "image";

export interface Flashcard extends BaseRow {
  deck_id: UUID;
  concept_id: UUID | null;
  type: FlashcardType;
  front: string;
  back: string;
  difficulty: number;   // 1–5
  source: FlashcardSource;
}

export interface FlashcardSource {
  kind: "manual" | "ai" | "capture";
  capture_id?: UUID;
  document_chunk_id?: UUID;
}

/* ─── Review ─────────────────────────────────────────────────────────── */

export type ReviewResult = "know" | "hard" | "miss";

export interface ReviewLog extends BaseRow {
  flashcard_id: UUID;
  result: ReviewResult;
  reviewed_at: string;
}

export interface ConceptProgress extends BaseRow {
  concept_id: UUID;
  mastery_score: number;    // cumulative
  next_review_at: string;   // ISO timestamp
  interval_days: number;
  ease_factor: number;      // for future SM-2 upgrade
}

/* ─── Documents (V2 — defined now so schema is stable) ──────────────── */

export type DocumentStatus = "pending" | "processing" | "ready" | "error";

export interface Document extends BaseRow {
  course_id: UUID;
  chapter_id: UUID | null;
  title: string;
  storage_path: string;
  status: DocumentStatus;
}

export interface DocumentChunk extends BaseRow {
  document_id: UUID;
  chunk_index: number;
  content_text: string;
}

/* ─── UI helpers ─────────────────────────────────────────────────────── */

/** Generic select option used across dropdowns */
export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

/** Result wrapper for server actions / API calls */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
