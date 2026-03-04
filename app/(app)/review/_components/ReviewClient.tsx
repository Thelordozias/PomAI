"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
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
import { useTranslation } from "@/components/providers/LanguageProvider";

type View =
  | { kind: "browse" }
  | { kind: "manage"; deckId: string }
  | {
      kind: "review";
      deckId: string;
      queue: Flashcard[];
      idx: number;
      flipped: boolean;
      stats: { know: number; hard: number; miss: number };
    }
  | { kind: "results"; deckId: string; know: number; hard: number; miss: number };

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

interface Props {
  courses: Course[];
  selectedCourseId: string;
  decks: Deck[];
  flashcardsByDeck: Record<string, Flashcard[]>;
}

export function ReviewClient({ courses, selectedCourseId, decks, flashcardsByDeck }: Props) {
  const t = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<View>({ kind: "browse" });

  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [deckTitle, setDeckTitle] = useState("");
  const [deckError, setDeckError] = useState<string | null>(null);
  const [creatingDeck, setCreatingDeck] = useState(false);

  const [toDeleteDeck, setToDeleteDeck] = useState<Deck | null>(null);
  const [deletingDeck, setDeletingDeck] = useState(false);

  const [showAddCard, setShowAddCard] = useState(false);
  const [cardFront, setCardFront] = useState("");
  const [cardBack, setCardBack] = useState("");
  const [cardError, setCardError] = useState<string | null>(null);
  const [addingCard, setAddingCard] = useState(false);

  const [toDeleteCard, setToDeleteCard] = useState<Flashcard | null>(null);
  const [deletingCard, setDeletingCard] = useState(false);

  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const [showAIModal, setShowAIModal] = useState(false);
  const [aiDeckId, setAiDeckId] = useState("");
  const [aiCount, setAiCount] = useState(5);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState<string | null>(null);

  function selectCourse(courseId: string) {
    const url = courseId ? `/review?courseId=${courseId}` : "/review";
    setView({ kind: "browse" });
    startTransition(() => router.push(url));
  }

  async function handleCreateDeck() {
    if (!deckTitle.trim()) { setDeckError(t.review.deckTitleRequired); return; }
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

  async function handleAddCard() {
    if (!cardFront.trim() || !cardBack.trim()) { setCardError(t.review.cardFieldsRequired); return; }
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

  async function handleGenerateAI() {
    if (!aiDeckId) return;
    setAiLoading(true);
    setAiError(null);
    setAiSuccess(null);
    try {
      const res = await fetch("/api/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId: aiDeckId, count: aiCount }),
      });
      const data = (await res.json()) as { count?: number; error?: string };
      if (!res.ok || data.error) {
        setAiError(data.error ?? t.review.generationFailed);
      } else {
        setAiSuccess(t.review.flashcardsAdded(data.count ?? 0));
        setShowAIModal(false);
        startTransition(() => router.refresh());
      }
    } catch {
      setAiError(t.review.networkError);
    } finally {
      setAiLoading(false);
    }
  }

  function openAIModal(deckId: string) {
    setAiDeckId(deckId);
    setAiCount(5);
    setAiError(null);
    setAiSuccess(null);
    setShowAIModal(true);
  }

  function startReview(deck: Deck) {
    const cards = flashcardsByDeck[deck.id] ?? [];
    if (cards.length === 0) return;
    setReviewError(null);
    setView({ kind: "review", deckId: deck.id, queue: shuffle(cards), idx: 0, flipped: false, stats: { know: 0, hard: 0, miss: 0 } });
  }

  async function handleRate(result: ReviewResult) {
    if (view.kind !== "review") return;
    const card = view.queue[view.idx];
    setSubmittingReview(true);
    setReviewError(null);
    const submitResult = await submitReview(card.id, card.concept_id, result);
    setSubmittingReview(false);
    if (!submitResult.success) { setReviewError(submitResult.error); return; }
    const nextStats = { ...view.stats, [result]: view.stats[result] + 1 };
    const isLast = view.idx === view.queue.length - 1;
    if (isLast) {
      setView({ kind: "results", deckId: view.deckId, ...nextStats });
    } else {
      setView({ ...view, idx: view.idx + 1, flipped: false, stats: nextStats });
    }
  }

  return (
    <>
      {view.kind === "review" && (
        <ReviewSession
          view={view}
          onFlip={() => setView({ ...view, flipped: true })}
          onRate={handleRate}
          onExit={() => setView({ kind: "browse" })}
          submitting={submittingReview}
          error={reviewError}
        />
      )}

      {view.kind === "results" && (
        <ResultsScreen
          view={view}
          onBack={() => setView({ kind: "browse" })}
          onReviewAgain={() => {
            const cards = flashcardsByDeck[view.deckId] ?? [];
            setView({ kind: "review", deckId: view.deckId, queue: shuffle(cards), idx: 0, flipped: false, stats: { know: 0, hard: 0, miss: 0 } });
          }}
        />
      )}

      {(view.kind === "browse" || view.kind === "manage") && (
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sand-200 text-xl font-semibold">{t.review.title}</h2>
              <p className="text-sand-500 text-sm mt-0.5">{t.review.subtitle}</p>
            </div>
          </div>

          <div className="w-full max-w-xs">
            <label className="block text-sand-400 text-xs mb-1">{t.review.course}</label>
            <select
              value={selectedCourseId}
              onChange={(e) => selectCourse(e.target.value)}
              disabled={isPending}
              className="w-full bg-card border border-warm rounded px-3 py-2 text-sand-200 text-sm focus:outline-none focus:border-ember-400 disabled:opacity-50"
            >
              <option value="">{t.review.selectCourse}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          {view.kind === "manage" && (
            <div className="flex items-center gap-3">
              <button onClick={() => setView({ kind: "browse" })} className="text-sand-500 text-xs hover:text-sand-200 transition-colors">
                {t.review.backToDecks}
              </button>
              <span className="text-sand-600 text-xs">·</span>
              <span className="text-sand-400 text-xs">{decks.find((d) => d.id === view.deckId)?.title}</span>
            </div>
          )}

          {!selectedCourseId && (
            <div className="border border-dashed border-warm rounded p-8 text-center">
              <p className="text-sand-500 text-sm">{t.review.selectCoursePrompt}</p>
            </div>
          )}

          {view.kind === "browse" && selectedCourseId && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sand-200 text-sm font-semibold">{t.review.decks}</h3>
                  <Badge variant="default">{decks.length}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  {decks.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => openAIModal(decks[0].id)} disabled={isPending}>
                      {t.review.aiGenerate}
                    </Button>
                  )}
                  <Button variant="secondary" size="sm" onClick={() => { setDeckTitle(""); setDeckError(null); setShowCreateDeck(true); }} disabled={isPending}>
                    {t.review.newDeck}
                  </Button>
                </div>
              </div>

              {aiSuccess && (
                <p className="text-green-400 text-sm bg-green-900/20 border border-green-800 rounded px-3 py-2">{aiSuccess}</p>
              )}

              {decks.length === 0 ? (
                <div className="border border-dashed border-warm rounded p-8 text-center">
                  <p className="text-sand-500 text-sm mb-4">{t.review.noDecks}</p>
                  <Button variant="secondary" size="sm" onClick={() => { setDeckTitle(""); setDeckError(null); setShowCreateDeck(true); }}>
                    {t.review.newDeck}
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
                        onManage={() => setView({ kind: "manage", deckId: deck.id })}
                        onDelete={() => setToDeleteDeck(deck)}
                        onGenerateAI={() => openAIModal(deck.id)}
                        disabled={isPending}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}

          {view.kind === "manage" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sand-200 text-sm font-semibold">{t.review.flashcards}</h3>
                  <Badge variant="default">{(flashcardsByDeck[view.deckId] ?? []).length}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openAIModal(view.deckId)} disabled={isPending}>
                    {t.review.aiGenerate}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => { setCardFront(""); setCardBack(""); setCardError(null); setShowAddCard(true); }} disabled={isPending}>
                    {t.review.addCard}
                  </Button>
                </div>
              </div>

              {aiSuccess && (
                <p className="text-green-400 text-sm bg-green-900/20 border border-green-800 rounded px-3 py-2 mb-3">{aiSuccess}</p>
              )}

              {(flashcardsByDeck[view.deckId] ?? []).length === 0 ? (
                <div className="border border-dashed border-warm rounded p-8 text-center">
                  <p className="text-sand-500 text-sm mb-4">{t.review.noFlashcards}</p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="ghost" size="sm" onClick={() => openAIModal(view.deckId)}>{t.review.aiGenerate}</Button>
                    <Button variant="secondary" size="sm" onClick={() => { setCardFront(""); setCardBack(""); setCardError(null); setShowAddCard(true); }}>{t.review.addCard}</Button>
                  </div>
                </div>
              ) : (
                <ul className="space-y-2">
                  {(flashcardsByDeck[view.deckId] ?? []).map((card, idx) => (
                    <FlashcardRow key={card.id} card={card} index={idx + 1} onDelete={() => setToDeleteCard(card)} disabled={isPending} />
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <Modal open={showCreateDeck} onClose={() => setShowCreateDeck(false)} title={t.review.newDeckTitle} description={t.review.newDeckDesc}>
        <div className="space-y-4">
          <Input label={t.review.deckTitleLabel} placeholder={t.review.deckTitlePlaceholder} value={deckTitle} onChange={(e) => setDeckTitle(e.target.value)} autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleCreateDeck(); }} />
          {deckError && <p className="text-red-400 text-sm">{deckError}</p>}
          <ModalFooter onCancel={() => setShowCreateDeck(false)} onConfirm={handleCreateDeck} confirmLabel={t.review.createDeck} loading={creatingDeck} />
        </div>
      </Modal>

      <Modal open={!!toDeleteDeck} onClose={() => setToDeleteDeck(null)} title={t.review.deleteDeckTitle} description={toDeleteDeck ? t.review.deleteDeckDesc(toDeleteDeck.title) : ""}>
        <ModalFooter onCancel={() => setToDeleteDeck(null)} onConfirm={handleDeleteDeck} confirmLabel={t.review.deleteBtn} confirmVariant="danger" loading={deletingDeck} />
      </Modal>

      <Modal open={showAddCard} onClose={() => setShowAddCard(false)} title={t.review.addCardTitle} description={t.review.addCardDesc}>
        <div className="space-y-4">
          <Textarea label={t.review.front} placeholder={t.review.frontPlaceholder} value={cardFront} onChange={(e) => setCardFront(e.target.value)} rows={3} autoFocus />
          <Textarea label={t.review.back} placeholder={t.review.backPlaceholder} value={cardBack} onChange={(e) => setCardBack(e.target.value)} rows={3} />
          {cardError && <p className="text-red-400 text-sm">{cardError}</p>}
          <ModalFooter onCancel={() => setShowAddCard(false)} onConfirm={handleAddCard} confirmLabel={t.review.addCardConfirm} loading={addingCard} />
        </div>
      </Modal>

      <Modal open={!!toDeleteCard} onClose={() => setToDeleteCard(null)} title={t.review.deleteCardTitle} description={t.review.deleteCardDesc}>
        <ModalFooter onCancel={() => setToDeleteCard(null)} onConfirm={handleDeleteCard} confirmLabel={t.review.deleteBtn} confirmVariant="danger" loading={deletingCard} />
      </Modal>

      <Modal open={showAIModal} onClose={() => setShowAIModal(false)} title={t.review.aiGeneratorTitle} description={t.review.aiGeneratorDesc}>
        <div className="space-y-4">
          <div>
            <label className="block text-sand-400 text-xs mb-1">{t.review.targetDeck}</label>
            <select value={aiDeckId} onChange={(e) => setAiDeckId(e.target.value)} className="w-full bg-card border border-warm rounded px-3 py-2 text-sand-200 text-sm focus:outline-none focus:border-ember-400">
              {decks.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sand-400 text-xs mb-1">{t.review.cardCount}</label>
            <input type="number" min={2} max={10} value={aiCount} onChange={(e) => setAiCount(Number(e.target.value))} className="w-full bg-card border border-warm rounded px-3 py-2 text-sand-200 text-sm focus:outline-none focus:border-ember-400" />
          </div>
          <p className="text-sand-600 text-xs">{t.review.aiHint}</p>
          {aiError && <p className="text-red-400 text-sm">{aiError}</p>}
          <ModalFooter onCancel={() => setShowAIModal(false)} onConfirm={handleGenerateAI} confirmLabel={aiLoading ? "…" : t.review.generateBtn} loading={aiLoading} />
        </div>
      </Modal>
    </>
  );
}

/* ─── Deck card ──────────────────────────────────────────────────────── */
function DeckCard({ deck, cardCount, onReview, onManage, onDelete, onGenerateAI, disabled }: {
  deck: Deck; cardCount: number; onReview: () => void; onManage: () => void;
  onDelete: () => void; onGenerateAI: () => void; disabled: boolean;
}) {
  const t = useTranslation();
  return (
    <Card padding="none">
      <div className="p-4">
        <h4 className="text-sand-200 text-sm font-semibold">{deck.title}</h4>
        <p className="text-sand-500 text-xs mt-1">{cardCount} {cardCount === 1 ? t.review.cardSingular : t.review.cardPlural}</p>
      </div>
      <div className="px-4 pb-4 flex items-center gap-2 flex-wrap">
        <Button variant="primary" size="sm" onClick={onReview} disabled={disabled || cardCount === 0}>{t.review.reviewBtn}</Button>
        <Button variant="secondary" size="sm" onClick={onManage} disabled={disabled}>{t.review.manageBtn}</Button>
        <Button variant="ghost" size="sm" onClick={onGenerateAI} disabled={disabled}>{t.review.aiBtn}</Button>
        <button onClick={onDelete} disabled={disabled} className="ml-auto text-sand-600 text-xs hover:text-red-400 transition-colors disabled:opacity-40">{t.review.deleteBtn}</button>
      </div>
    </Card>
  );
}

/* ─── Flashcard row ──────────────────────────────────────────────────── */
function FlashcardRow({ card, index, onDelete, disabled }: {
  card: Flashcard; index: number; onDelete: () => void; disabled: boolean;
}) {
  const t = useTranslation();
  const isAI = (card.source as { kind?: string } | null)?.kind === "ai";
  return (
    <li className="flex items-start gap-3 px-4 py-3 rounded bg-card border border-warm group">
      <span className="text-sand-600 text-xs font-mono w-5 text-right shrink-0 pt-0.5">{String(index).padStart(2, "0")}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sand-200 text-sm truncate">{card.front}</p>
          {isAI && <Badge variant="info">AI</Badge>}
        </div>
        <p className="text-sand-500 text-xs truncate">{card.back}</p>
      </div>
      <button onClick={onDelete} disabled={disabled} className="text-sand-600 text-xs hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-40 shrink-0">{t.review.deleteBtn}</button>
    </li>
  );
}

/* ─── Review session ─────────────────────────────────────────────────── */
function ReviewSession({ view, onFlip, onRate, onExit, submitting, error }: {
  view: Extract<View, { kind: "review" }>; onFlip: () => void;
  onRate: (r: ReviewResult) => void; onExit: () => void;
  submitting: boolean; error: string | null;
}) {
  const t = useTranslation();
  const card = view.queue[view.idx];
  const total = view.queue.length;
  const progressPct = (view.idx / total) * 100;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (submitting) return;
    if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)) return;
    if (!view.flipped) {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); onFlip(); }
    } else {
      if (e.key === "1") onRate("miss");
      else if (e.key === "2") onRate("hard");
      else if (e.key === "3") onRate("know");
    }
    if (e.key === "Escape") onExit();
  }, [view.flipped, submitting, onFlip, onRate, onExit]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sand-200 text-xl font-semibold">{t.review.reviewSession}</h2>
        <button onClick={onExit} className="text-sand-500 text-sm hover:text-sand-200 transition-colors">{t.review.exitSession}</button>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-sand-600 text-xs">
          <span>{t.review.cardProgress(view.idx + 1, total)}</span>
          <span>{Math.round(progressPct)}%</span>
        </div>
        <div className="h-1.5 bg-warm rounded-full overflow-hidden">
          <div className="h-full bg-ember-400 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div
        className="border border-warm rounded-lg bg-card min-h-[200px] flex flex-col items-center justify-center p-8 text-center cursor-pointer select-none hover:border-ember-400/50 transition-colors"
        onClick={!view.flipped ? onFlip : undefined}
      >
        <p className="text-sand-400 text-xs uppercase tracking-widest mb-4">{view.flipped ? t.review.answer : t.review.question}</p>
        <p className="text-sand-200 text-lg leading-relaxed whitespace-pre-wrap">{view.flipped ? card.back : card.front}</p>
        {!view.flipped && <p className="text-sand-600 text-xs mt-6">{t.review.flipHint}</p>}
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded px-3 py-2 text-center">{error}</p>
      )}

      {view.flipped ? (
        <div className="space-y-2">
          <div className="flex gap-3 justify-center">
            {([
              { label: t.review.miss, key: "1", result: "miss" as ReviewResult, variant: "danger" as const },
              { label: t.review.hard, key: "2", result: "hard" as ReviewResult, variant: "secondary" as const },
              { label: t.review.know, key: "3", result: "know" as ReviewResult, variant: "primary" as const },
            ]).map(({ label, key, result, variant }) => (
              <Button key={result} variant={variant} size="sm" onClick={() => onRate(result)} disabled={submitting} className="flex-1 max-w-[110px]">
                <span className="flex flex-col items-center gap-0.5">
                  <span>{label}</span>
                  <span className="text-[10px] opacity-50 font-normal">{key}</span>
                </span>
              </Button>
            ))}
          </div>
          <p className="text-sand-600 text-xs text-center">{t.review.rateHint}</p>
        </div>
      ) : (
        <Button variant="secondary" size="sm" onClick={onFlip} className="mx-auto block">{t.review.showAnswer}</Button>
      )}
    </div>
  );
}

/* ─── Results screen ─────────────────────────────────────────────────── */
function ResultsScreen({ view, onBack, onReviewAgain }: {
  view: Extract<View, { kind: "results" }>; onBack: () => void; onReviewAgain: () => void;
}) {
  const t = useTranslation();
  const total = view.know + view.hard + view.miss;
  const pct = total > 0 ? Math.round((view.know / total) * 100) : 0;
  const scoreColor = pct >= 80 ? "#4ade80" : pct >= 50 ? "#fbbf24" : "#f87171";
  const rm = t.review.resultMessages;
  const message = pct >= 90 ? rm.excellent : pct >= 70 ? rm.great : pct >= 50 ? rm.good : rm.keepGoing;

  return (
    <div className="space-y-8 text-center max-w-sm mx-auto">
      <div>
        <div className="text-6xl font-bold tabular-nums mb-3" style={{ color: scoreColor }}>{pct}%</div>
        <h2 className="text-sand-200 text-xl font-semibold">{t.review.sessionComplete}</h2>
        <p className="text-sand-500 text-sm mt-1">{message}</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t.review.know, value: view.know, color: "text-green-400" },
          { label: t.review.hard, value: view.hard, color: "text-amber-400" },
          { label: t.review.miss, value: view.miss, color: "text-red-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-warm rounded p-4">
            <p className={`text-2xl font-semibold ${color}`}>{value}</p>
            <p className="text-sand-500 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-3 justify-center">
        <Button variant="secondary" size="sm" onClick={onBack}>{t.review.backToDecksBtn}</Button>
        <Button variant="primary" size="sm" onClick={onReviewAgain}>{t.review.reviewAgain}</Button>
      </div>
    </div>
  );
}
