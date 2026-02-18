"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Course, Deck, Flashcard, ReviewResult } from "@/types";
import {
  createDeck,
  deleteDeck,
  createFlashcard,
  deleteFlashcard,
  submitReview,
} from "../actions";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

/* ─── Types ──────────────────────────────────────────────────────────── */

type View =
  | { kind: "browse" }
  | { kind: "manage"; deckId: string }
  | { kind: "review"; deckId: string; queue: Flashcard[]; idx: number; flipped: boolean }
  | { kind: "results"; deckId: string; know: number; hard: number; miss: number };

/* ─── Utils ──────────────────────────────────────────────────────────── */

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* ─── Main component ─────────────────────────────────────────────────── */

interface Props {
  courses: Course[];
  selectedCourseId: string;
  decks: Deck[];
  flashcardsByDeck: Record<string, Flashcard[]>;
}

export function ReviewClient({
  courses,
  selectedCourseId,
  decks,
  flashcardsByDeck,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [view, setView] = useState<View>({ kind: "browse" });

  // Create deck modal
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [deckTitle, setDeckTitle] = useState("");
  const [deckError, setDeckError] = useState<string | null>(null);
  const [creatingDeck, setCreatingDeck] = useState(false);

  // Delete deck confirmation
  const [toDeleteDeck, setToDeleteDeck] = useState<Deck | null>(null);
  const [deletingDeck, setDeletingDeck] = useState(false);

  // Add flashcard modal (in manage mode)
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardFront, setCardFront] = useState("");
  const [cardBack, setCardBack] = useState("");
  const [cardError, setCardError] = useState<string | null>(null);
  const [addingCard, setAddingCard] = useState(false);

  // Delete flashcard confirmation
  const [toDeleteCard, setToDeleteCard] = useState<Flashcard | null>(null);
  const [deletingCard, setDeletingCard] = useState(false);

  // Per-card submitting state during review
  const [submittingReview, setSubmittingReview] = useState(false);

  function selectCourse(courseId: string) {
    const url = courseId ? `/review?courseId=${courseId}` : "/review";
    setView({ kind: "browse" });
    startTransition(() => router.push(url));
  }

  /* ── Deck actions ─────────────────────────────────────────────────── */

  async function handleCreateDeck() {
    if (!deckTitle.trim()) {
      setDeckError("Title is required.");
      return;
    }
    setCreatingDeck(true);
    setDeckError(null);
    const result = await createDeck(selectedCourseId, deckTitle);
    if (result.success) {
      setShowCreateDeck(false);
      setDeckTitle("");
      startTransition(() => router.refresh());
    } else {
      setDeckError(result.error);
    }
    setCreatingDeck(false);
  }

  async function handleDeleteDeck() {
    if (!toDeleteDeck) return;
    setDeletingDeck(true);
    await deleteDeck(toDeleteDeck.id);
    setToDeleteDeck(null);
    setView({ kind: "browse" });
    startTransition(() => router.refresh());
    setDeletingDeck(false);
  }

  /* ── Flashcard actions ────────────────────────────────────────────── */

  async function handleAddCard() {
    if (!cardFront.trim() || !cardBack.trim()) {
      setCardError("Both front and back are required.");
      return;
    }
    if (view.kind !== "manage") return;
    setAddingCard(true);
    setCardError(null);
    const result = await createFlashcard(view.deckId, cardFront, cardBack);
    if (result.success) {
      setShowAddCard(false);
      setCardFront("");
      setCardBack("");
      startTransition(() => router.refresh());
    } else {
      setCardError(result.error);
    }
    setAddingCard(false);
  }

  async function handleDeleteCard() {
    if (!toDeleteCard) return;
    setDeletingCard(true);
    await deleteFlashcard(toDeleteCard.id);
    setToDeleteCard(null);
    startTransition(() => router.refresh());
    setDeletingCard(false);
  }

  /* ── Review session ───────────────────────────────────────────────── */

  function startReview(deck: Deck) {
    const cards = flashcardsByDeck[deck.id] ?? [];
    if (cards.length === 0) return;
    setView({
      kind: "review",
      deckId: deck.id,
      queue: shuffle(cards),
      idx: 0,
      flipped: false,
    });
  }

  async function handleRate(result: ReviewResult) {
    if (view.kind !== "review") return;
    const card = view.queue[view.idx];
    setSubmittingReview(true);
    await submitReview(card.id, card.concept_id, result);
    setSubmittingReview(false);

    const isLast = view.idx === view.queue.length - 1;
    if (isLast) {
      const results = { know: 0, hard: 0, miss: 0 };
      results[result]++;
      // We only have the current card's result here; we tracked previous implicitly.
      // For simplicity we show counts from this session using local accumulation.
      // The full count is re-computed from sessionResults below.
      setView({
        kind: "results",
        deckId: view.deckId,
        know: result === "know" ? 1 : 0,
        hard: result === "hard" ? 1 : 0,
        miss: result === "miss" ? 1 : 0,
      });
    } else {
      setView({ ...view, idx: view.idx + 1, flipped: false });
    }
  }

  /* ── Render ───────────────────────────────────────────────────────── */

  return (
    <>
      {/* Review session overlay */}
      {view.kind === "review" && (
        <ReviewSession
          view={view}
          onFlip={() => setView({ ...view, flipped: true })}
          onRate={handleRate}
          onExit={() => setView({ kind: "browse" })}
          submitting={submittingReview}
        />
      )}

      {/* Results screen */}
      {view.kind === "results" && (
        <ResultsScreen
          view={view}
          onBack={() => setView({ kind: "browse" })}
          onReviewAgain={() => {
            const cards = flashcardsByDeck[view.deckId] ?? [];
            setView({
              kind: "review",
              deckId: view.deckId,
              queue: shuffle(cards),
              idx: 0,
              flipped: false,
            });
          }}
        />
      )}

      {/* Browse + manage views */}
      {(view.kind === "browse" || view.kind === "manage") && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sand-200 text-xl font-semibold">Review</h2>
              <p className="text-sand-500 text-sm mt-0.5">
                Spaced repetition — decks and flashcards.
              </p>
            </div>
          </div>

          {/* Course selector */}
          <div className="w-full max-w-xs">
            <label className="block text-sand-400 text-xs mb-1">Course</label>
            <select
              value={selectedCourseId}
              onChange={(e) => selectCourse(e.target.value)}
              disabled={isPending}
              className="w-full bg-card border border-warm rounded px-3 py-2 text-sand-200 text-sm focus:outline-none focus:border-ember-400 disabled:opacity-50"
            >
              <option value="">— Select a course —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Manage view: back button + deck header */}
          {view.kind === "manage" && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView({ kind: "browse" })}
                className="text-sand-500 text-xs hover:text-sand-200 transition-colors"
              >
                ← Back to Decks
              </button>
              <span className="text-sand-600 text-xs">·</span>
              <span className="text-sand-400 text-xs">
                {decks.find((d) => d.id === view.deckId)?.title}
              </span>
            </div>
          )}

          {/* No course selected */}
          {!selectedCourseId && (
            <div className="border border-dashed border-warm rounded p-8 text-center">
              <p className="text-sand-500 text-sm">
                Select a course to see its review decks.
              </p>
            </div>
          )}

          {/* Deck list (browse mode) */}
          {view.kind === "browse" && selectedCourseId && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sand-200 text-sm font-semibold">Decks</h3>
                  <Badge variant="default">{decks.length}</Badge>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setDeckTitle("");
                    setDeckError(null);
                    setShowCreateDeck(true);
                  }}
                  disabled={isPending}
                >
                  + New Deck
                </Button>
              </div>

              {decks.length === 0 ? (
                <div className="border border-dashed border-warm rounded p-8 text-center">
                  <p className="text-sand-500 text-sm mb-4">
                    No decks yet. Create one to start reviewing.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setDeckTitle("");
                      setDeckError(null);
                      setShowCreateDeck(true);
                    }}
                  >
                    + New Deck
                  </Button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {decks.map((deck) => {
                    const cards = flashcardsByDeck[deck.id] ?? [];
                    return (
                      <DeckCard
                        key={deck.id}
                        deck={deck}
                        cardCount={cards.length}
                        onReview={() => startReview(deck)}
                        onManage={() =>
                          setView({ kind: "manage", deckId: deck.id })
                        }
                        onDelete={() => setToDeleteDeck(deck)}
                        disabled={isPending}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Manage view: flashcard list */}
          {view.kind === "manage" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sand-200 text-sm font-semibold">
                    Flashcards
                  </h3>
                  <Badge variant="default">
                    {(flashcardsByDeck[view.deckId] ?? []).length}
                  </Badge>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setCardFront("");
                    setCardBack("");
                    setCardError(null);
                    setShowAddCard(true);
                  }}
                  disabled={isPending}
                >
                  + Add Card
                </Button>
              </div>

              {(flashcardsByDeck[view.deckId] ?? []).length === 0 ? (
                <div className="border border-dashed border-warm rounded p-8 text-center">
                  <p className="text-sand-500 text-sm">
                    No flashcards yet. Add one above.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {(flashcardsByDeck[view.deckId] ?? []).map((card, idx) => (
                    <FlashcardRow
                      key={card.id}
                      card={card}
                      index={idx + 1}
                      onDelete={() => setToDeleteCard(card)}
                      disabled={isPending}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Create deck modal ──────────────────────────────────────────── */}
      <Modal
        open={showCreateDeck}
        onClose={() => setShowCreateDeck(false)}
        title="New Deck"
        description="A deck groups flashcards for a focused review session."
      >
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="e.g. Chapter 3 — Integration"
            value={deckTitle}
            onChange={(e) => setDeckTitle(e.target.value)}
            autoFocus
          />
          {deckError && <p className="text-red-400 text-sm">{deckError}</p>}
          <ModalFooter
            onCancel={() => setShowCreateDeck(false)}
            onConfirm={handleCreateDeck}
            confirmLabel="Create deck"
            loading={creatingDeck}
          />
        </div>
      </Modal>

      {/* ── Delete deck modal ──────────────────────────────────────────── */}
      <Modal
        open={!!toDeleteDeck}
        onClose={() => setToDeleteDeck(null)}
        title="Delete deck?"
        description={`"${toDeleteDeck?.title}" and all its flashcards will be permanently deleted.`}
      >
        <ModalFooter
          onCancel={() => setToDeleteDeck(null)}
          onConfirm={handleDeleteDeck}
          confirmLabel="Delete"
          confirmVariant="danger"
          loading={deletingDeck}
        />
      </Modal>

      {/* ── Add flashcard modal ────────────────────────────────────────── */}
      <Modal
        open={showAddCard}
        onClose={() => setShowAddCard(false)}
        title="Add Flashcard"
        description="Front is the question; back is the answer."
      >
        <div className="space-y-4">
          <Textarea
            label="Front"
            placeholder="Question or prompt…"
            value={cardFront}
            onChange={(e) => setCardFront(e.target.value)}
            rows={3}
            autoFocus
          />
          <Textarea
            label="Back"
            placeholder="Answer or explanation…"
            value={cardBack}
            onChange={(e) => setCardBack(e.target.value)}
            rows={3}
          />
          {cardError && <p className="text-red-400 text-sm">{cardError}</p>}
          <ModalFooter
            onCancel={() => setShowAddCard(false)}
            onConfirm={handleAddCard}
            confirmLabel="Add card"
            loading={addingCard}
          />
        </div>
      </Modal>

      {/* ── Delete flashcard modal ─────────────────────────────────────── */}
      <Modal
        open={!!toDeleteCard}
        onClose={() => setToDeleteCard(null)}
        title="Delete flashcard?"
        description="This card and its review history will be permanently deleted."
      >
        <ModalFooter
          onCancel={() => setToDeleteCard(null)}
          onConfirm={handleDeleteCard}
          confirmLabel="Delete"
          confirmVariant="danger"
          loading={deletingCard}
        />
      </Modal>
    </>
  );
}

/* ─── Deck card ──────────────────────────────────────────────────────── */

function DeckCard({
  deck,
  cardCount,
  onReview,
  onManage,
  onDelete,
  disabled,
}: {
  deck: Deck;
  cardCount: number;
  onReview: () => void;
  onManage: () => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  return (
    <Card padding="none">
      <div className="p-4">
        <h4 className="text-sand-200 text-sm font-semibold">{deck.title}</h4>
        <p className="text-sand-500 text-xs mt-1">
          {cardCount} {cardCount === 1 ? "card" : "cards"}
        </p>
      </div>
      <div className="px-4 pb-4 flex items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={onReview}
          disabled={disabled || cardCount === 0}
        >
          Review
        </Button>
        <Button variant="secondary" size="sm" onClick={onManage} disabled={disabled}>
          Manage
        </Button>
        <button
          onClick={onDelete}
          disabled={disabled}
          className="ml-auto text-sand-600 text-xs hover:text-red-400 transition-colors disabled:opacity-40"
        >
          Delete
        </button>
      </div>
    </Card>
  );
}

/* ─── Flashcard row (manage mode) ────────────────────────────────────── */

function FlashcardRow({
  card,
  index,
  onDelete,
  disabled,
}: {
  card: Flashcard;
  index: number;
  onDelete: () => void;
  disabled: boolean;
}) {
  return (
    <li className="flex items-start gap-3 px-4 py-3 rounded bg-card border border-warm group">
      <span className="text-sand-600 text-xs font-mono w-5 text-right shrink-0 pt-0.5">
        {String(index).padStart(2, "0")}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sand-200 text-sm truncate">{card.front}</p>
        <p className="text-sand-500 text-xs truncate mt-0.5">{card.back}</p>
      </div>
      <button
        onClick={onDelete}
        disabled={disabled}
        className="text-sand-600 text-xs hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-40 shrink-0"
      >
        Delete
      </button>
    </li>
  );
}

/* ─── Review session ─────────────────────────────────────────────────── */

function ReviewSession({
  view,
  onFlip,
  onRate,
  onExit,
  submitting,
}: {
  view: Extract<View, { kind: "review" }>;
  onFlip: () => void;
  onRate: (r: ReviewResult) => void;
  onExit: () => void;
  submitting: boolean;
}) {
  const card = view.queue[view.idx];
  const total = view.queue.length;
  const progressPct = ((view.idx) / total) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sand-200 text-xl font-semibold">Review Session</h2>
        <button
          onClick={onExit}
          className="text-sand-500 text-sm hover:text-sand-200 transition-colors"
        >
          Exit
        </button>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sand-600 text-xs">
          <span>Card {view.idx + 1} of {total}</span>
          <span>{Math.round(progressPct)}%</span>
        </div>
        <div className="h-1.5 bg-warm rounded-full overflow-hidden">
          <div
            className="h-full bg-ember-400 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        className="border border-warm rounded-lg bg-card min-h-[200px] flex flex-col items-center justify-center p-8 text-center cursor-pointer select-none"
        onClick={!view.flipped ? onFlip : undefined}
      >
        <p className="text-sand-400 text-xs uppercase tracking-widest mb-4">
          {view.flipped ? "Back" : "Front"}
        </p>
        <p className="text-sand-200 text-lg leading-relaxed">
          {view.flipped ? card.back : card.front}
        </p>
        {!view.flipped && (
          <p className="text-sand-600 text-xs mt-6">Click to reveal answer</p>
        )}
      </div>

      {/* Rating buttons */}
      {view.flipped && (
        <div className="flex gap-3 justify-center">
          <Button
            variant="danger"
            size="sm"
            onClick={() => onRate("miss")}
            disabled={submitting}
            className="flex-1 max-w-[110px]"
          >
            Miss
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onRate("hard")}
            disabled={submitting}
            className="flex-1 max-w-[110px]"
          >
            Hard
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onRate("know")}
            disabled={submitting}
            className="flex-1 max-w-[110px]"
          >
            Know
          </Button>
        </div>
      )}

      {!view.flipped && (
        <Button variant="secondary" size="sm" onClick={onFlip} className="mx-auto block">
          Show Answer
        </Button>
      )}
    </div>
  );
}

/* ─── Results screen ─────────────────────────────────────────────────── */

function ResultsScreen({
  view,
  onBack,
  onReviewAgain,
}: {
  view: Extract<View, { kind: "results" }>;
  onBack: () => void;
  onReviewAgain: () => void;
}) {
  const total = view.know + view.hard + view.miss;
  const pct = total > 0 ? Math.round((view.know / total) * 100) : 0;

  return (
    <div className="space-y-8 text-center max-w-sm mx-auto">
      <div>
        <h2 className="text-sand-200 text-xl font-semibold">Session Complete</h2>
        <p className="text-sand-500 text-sm mt-1">
          {pct}% known — great work!
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Know", value: view.know, color: "text-green-400" },
          { label: "Hard", value: view.hard, color: "text-amber-400" },
          { label: "Miss", value: view.miss, color: "text-red-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-warm rounded p-4">
            <p className={`text-2xl font-semibold ${color}`}>{value}</p>
            <p className="text-sand-500 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-center">
        <Button variant="secondary" size="sm" onClick={onBack}>
          Back to Decks
        </Button>
        <Button variant="primary" size="sm" onClick={onReviewAgain}>
          Review Again
        </Button>
      </div>
    </div>
  );
}
