"use client";

import { useState, useRef, useEffect } from "react";
import type { Course } from "@/types";
import type { QuizQuestion, MCQQuestion, TextQuestion } from "@/app/api/generate-quiz/route";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/components/providers/LanguageProvider";

interface Props { courses: Course[]; }

type QuizState =
  | { phase: "setup" }
  | { phase: "loading" }
  | { phase: "active"; questions: QuizQuestion[]; idx: number; answers: AnswerRecord; courseTitle: string }
  | { phase: "results"; questions: QuizQuestion[]; answers: AnswerRecord; courseTitle: string };

type AnswerRecord = Record<string, { value: string | number; correct: boolean; skipped?: boolean }>;

export function QuizClient({ courses }: Props) {
  const t = useTranslation();
  const { toast } = useToast();
  const [state, setState] = useState<QuizState>({ phase: "setup" });
  const [courseId, setCourseId] = useState("");
  const [count, setCount] = useState(8);
  const [error, setError] = useState<string | null>(null);

  async function startQuiz() {
    if (!courseId) { setError(t.quiz.selectCourseFirst); return; }
    setError(null);
    setState({ phase: "loading" });
    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, count }),
      });
      const data = (await res.json()) as { questions?: QuizQuestion[]; courseTitle?: string; error?: string };
      if (!res.ok || data.error || !data.questions?.length) {
        setError(data.error ?? t.quiz.generateFailed);
        setState({ phase: "setup" });
        return;
      }
      setState({ phase: "active", questions: data.questions, idx: 0, answers: {}, courseTitle: data.courseTitle ?? "" });
    } catch {
      setError(t.quiz.networkError);
      setState({ phase: "setup" });
    }
  }

  function recordAnswer(questionId: string, value: string | number, correct: boolean) {
    if (state.phase !== "active") return;
    const newAnswers = { ...state.answers, [questionId]: { value, correct } };
    setState({ ...state, answers: newAnswers });
  }

  function nextQuestion() {
    if (state.phase !== "active") return;
    const isLast = state.idx === state.questions.length - 1;
    if (isLast) {
      const correct = Object.values(state.answers).filter((a) => a.correct).length;
      const pct = Math.round((correct / state.questions.length) * 100);
      const msg = pct >= 80
        ? t.quiz.toastSuccess(pct, correct, state.questions.length)
        : t.quiz.toastDone(pct, correct, state.questions.length);
      toast(msg, pct >= 80 ? "success" : "info");
      setState({ phase: "results", questions: state.questions, answers: state.answers, courseTitle: state.courseTitle });
    } else {
      setState({ ...state, idx: state.idx + 1 });
    }
  }

  function skipQuestion() {
    if (state.phase !== "active") return;
    const q = state.questions[state.idx];
    const newAnswers = { ...state.answers, [q.id]: { value: "", correct: false, skipped: true } };
    const isLast = state.idx === state.questions.length - 1;
    if (isLast) {
      setState({ phase: "results", questions: state.questions, answers: newAnswers, courseTitle: state.courseTitle });
    } else {
      setState({ ...state, idx: state.idx + 1, answers: newAnswers });
    }
  }

  function restart() {
    setState({ phase: "setup" });
    setError(null);
  }

  if (state.phase === "setup" || state.phase === "loading") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-sand-200 text-xl font-semibold tracking-tight">{t.quiz.title}</h2>
          <p className="text-sand-500 text-sm mt-1">{t.quiz.subtitle}</p>
        </div>

        <Card padding="md" className="space-y-4">
          <div>
            <label className="block text-sand-500 text-xs font-medium mb-1.5">{t.quiz.course}</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              disabled={state.phase === "loading"}
              className="w-full bg-muted border border-warm rounded-lg px-3 py-2 text-sand-200 text-sm focus:outline-none focus:border-ember-500 focus:ring-1 focus:ring-ember-500/50"
            >
              <option value="">{t.quiz.selectCourse}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sand-500 text-xs font-medium mb-1.5">{t.quiz.numberOfQuestions}</label>
            <div className="flex gap-2">
              {[5, 8, 10, 15].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={[
                    "flex-1 py-2 rounded-lg text-sm font-medium border transition-all",
                    count === n
                      ? "bg-ember-500/15 border-ember-500/50 text-ember-400"
                      : "bg-muted border-warm text-sand-500 hover:border-sand-600 hover:text-sand-200",
                  ].join(" ")}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <p className="text-sand-600 text-xs">{t.quiz.aiHint}</p>

          {error && (
            <p className="text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button variant="primary" size="md" onClick={startQuiz} loading={state.phase === "loading"} disabled={!courseId} className="w-full">
            {state.phase === "loading" ? t.quiz.generating : t.quiz.generateBtn}
          </Button>
        </Card>
      </div>
    );
  }

  if (state.phase === "active") {
    const q = state.questions[state.idx];
    const total = state.questions.length;
    const pct = (state.idx / total) * 100;

    return (
      <div className="space-y-5 slide-up">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sand-200 text-xl font-semibold tracking-tight">{t.quiz.title}</h2>
            <p className="text-sand-500 text-xs mt-0.5">{state.courseTitle}</p>
          </div>
          <button onClick={restart} className="text-sand-600 text-xs hover:text-sand-400 transition-colors">{t.quiz.exit}</button>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-sand-600 text-xs">
            <span>{t.quiz.questionOf(state.idx + 1, total)}</span>
            <span>{t.quiz.answered(Object.keys(state.answers).length)}</span>
          </div>
          <div className="h-1 bg-bark-800 rounded-full overflow-hidden">
            <div className="h-full bg-ember-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {q.type === "mcq" ? (
          <MCQCard
            question={q}
            answer={state.answers[q.id]}
            onAnswer={(val, correct) => recordAnswer(q.id, val, correct)}
            onNext={nextQuestion}
            onSkip={skipQuestion}
            isLast={state.idx === total - 1}
          />
        ) : (
          <TextCard
            question={q}
            answer={state.answers[q.id]}
            onAnswer={(val, correct) => recordAnswer(q.id, val, correct)}
            onNext={nextQuestion}
            onSkip={skipQuestion}
            isLast={state.idx === total - 1}
          />
        )}
      </div>
    );
  }

  if (state.phase === "results") {
    const total = state.questions.length;
    const correct = Object.values(state.answers).filter((a) => a.correct).length;
    const skipped = Object.values(state.answers).filter((a) => a.skipped).length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const scoreColor = pct >= 80 ? "#34d399" : pct >= 50 ? "#fbbf24" : "#f87171";
    const message = pct >= 90 ? t.quiz.outstanding : pct >= 70 ? t.quiz.greatWork : pct >= 50 ? t.quiz.goodEffort : t.quiz.keepStudying;

    return (
      <div className="space-y-6 slide-up">
        <div className="text-center py-4">
          <div className="text-7xl font-bold tabular-nums mb-2" style={{ color: scoreColor }}>{pct}%</div>
          <h2 className="text-sand-200 text-2xl font-semibold tracking-tight">{message}</h2>
          <p className="text-sand-500 text-sm mt-1">{state.courseTitle}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: t.quiz.correctStat, value: correct, color: "text-emerald-400" },
            { label: t.quiz.wrongStat, value: total - correct - skipped, color: "text-red-400" },
            { label: t.quiz.skippedStat, value: skipped, color: "text-sand-500" },
          ].map(({ label, value, color }) => (
            <Card key={label} padding="md" className="text-center">
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-sand-500 text-xs mt-1">{label}</p>
            </Card>
          ))}
        </div>

        <div>
          <h3 className="text-sand-200 text-sm font-semibold mb-3">{t.quiz.reviewTitle}</h3>
          <div className="space-y-3">
            {state.questions.map((q, i) => {
              const ans = state.answers[q.id];
              const isCorrect = ans?.correct;
              const isSkipped = ans?.skipped;
              return (
                <div key={q.id} className={[
                  "rounded-xl border p-4",
                  isCorrect ? "border-emerald-800/50 bg-emerald-950/20" :
                  isSkipped ? "border-warm bg-bark-850" :
                  "border-red-900/50 bg-red-950/20",
                ].join(" ")}>
                  <div className="flex items-start gap-3">
                    <span className={[
                      "shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5",
                      isCorrect ? "bg-emerald-500/20 text-emerald-400" :
                      isSkipped ? "bg-sand-700 text-sand-500" :
                      "bg-red-500/20 text-red-400",
                    ].join(" ")}>
                      {isCorrect ? "✓" : isSkipped ? "—" : "✗"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sand-200 text-sm font-medium mb-1">
                        <span className="text-sand-600 mr-1">{i + 1}.</span> {q.question}
                      </p>
                      {q.type === "mcq" && !isSkipped && (
                        <p className="text-sand-400 text-xs">
                          {t.quiz.yourAnswer} <span className={isCorrect ? "text-emerald-400" : "text-red-400"}>{q.options[ans?.value as number] ?? "—"}</span>
                          {!isCorrect && <> {t.quiz.correctLabel(q.options[q.correct])}</>}
                        </p>
                      )}
                      {q.type === "text" && !isSkipped && (
                        <p className="text-sand-400 text-xs">
                          {t.quiz.yourAnswer} <span className="text-sand-300 italic">&quot;{(ans?.value as string) || "—"}&quot;</span>
                        </p>
                      )}
                      <p className="text-sand-600 text-xs mt-1.5 italic">{q.explanation}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" size="md" onClick={restart} className="flex-1">{t.quiz.newQuiz}</Button>
        </div>
      </div>
    );
  }

  return null;
}

/* ─── MCQ Card ───────────────────────────────────────────────────────── */
function MCQCard({ question, answer, onAnswer, onNext, onSkip, isLast }: {
  question: MCQQuestion;
  answer: AnswerRecord[string] | undefined;
  onAnswer: (val: number, correct: boolean) => void;
  onNext: () => void;
  onSkip: () => void;
  isLast: boolean;
}) {
  const t = useTranslation();
  const answered = answer !== undefined;

  return (
    <Card padding="md" className="space-y-4">
      <div className="flex items-start gap-2">
        <Badge variant="info">MCQ</Badge>
        <p className="text-sand-200 text-base font-medium leading-relaxed">{question.question}</p>
      </div>

      <div className="space-y-2">
        {question.options.map((opt, i) => {
          let style = "border-warm bg-muted text-sand-400 hover:border-sand-600 hover:text-sand-200";
          if (answered) {
            if (i === question.correct) style = "border-emerald-600 bg-emerald-950/30 text-emerald-300";
            else if (i === answer?.value) style = "border-red-700 bg-red-950/30 text-red-400";
            else style = "border-warm bg-muted text-sand-600 opacity-50";
          }
          return (
            <button
              key={i}
              onClick={() => !answered && onAnswer(i, i === question.correct)}
              disabled={answered}
              className={[
                "w-full text-left px-4 py-3 rounded-xl border text-sm font-medium",
                "transition-all duration-150",
                !answered && "cursor-pointer",
                style,
              ].join(" ")}
            >
              <span className="font-mono text-xs opacity-50 mr-2">{["A","B","C","D"][i]}</span>
              {opt}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="bg-bark-850 border border-warm rounded-lg px-3 py-2.5">
          <p className="text-sand-400 text-xs italic">{question.explanation}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        {!answered ? (
          <button onClick={onSkip} className="text-sand-600 text-xs hover:text-sand-400 transition-colors">{t.quiz.skip}</button>
        ) : (
          <div />
        )}
        {answered && (
          <Button variant="primary" size="sm" onClick={onNext}>
            {isLast ? t.quiz.seeResults : t.quiz.nextBtn}
          </Button>
        )}
      </div>
    </Card>
  );
}

/* ─── Text Answer Card ───────────────────────────────────────────────── */
function TextCard({ question, answer, onAnswer, onNext, onSkip, isLast }: {
  question: TextQuestion;
  answer: AnswerRecord[string] | undefined;
  onAnswer: (val: string, correct: boolean) => void;
  onNext: () => void;
  onSkip: () => void;
  isLast: boolean;
}) {
  const t = useTranslation();
  const [input, setInput] = useState("");
  const [, setRevealed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const answered = answer !== undefined;

  useEffect(() => {
    if (!answered) textareaRef.current?.focus();
  }, [answered]);

  function checkAnswer() {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return;

    const kw = question.keywords.map((k) => k.toLowerCase());
    const matched = kw.filter((k) => trimmed.includes(k)).length;
    const correct = matched >= Math.ceil(kw.length * 0.4) || trimmed.includes(question.expected.toLowerCase().slice(0, 20));

    onAnswer(input.trim(), correct);
    setRevealed(true);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!answered) checkAnswer(); }
  }

  return (
    <Card padding="md" className="space-y-4">
      <div className="flex items-start gap-2">
        <Badge variant="accent">Text</Badge>
        <p className="text-sand-200 text-base font-medium leading-relaxed">{question.question}</p>
      </div>

      <div className="space-y-2">
        <textarea
          ref={textareaRef}
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={answered}
          placeholder={t.quiz.typeAnswer}
          className={[
            "w-full bg-muted border rounded-lg px-3 py-2.5 text-sm text-sand-200 placeholder:text-sand-600",
            "focus:outline-none focus:ring-1 resize-none transition-all",
            !answered ? "border-warm focus:border-ember-500 focus:ring-ember-500/50" : "border-warm opacity-70",
          ].join(" ")}
        />
        {!answered && (
          <p className="text-sand-600 text-xs">{t.quiz.enterHint}</p>
        )}
      </div>

      {answered && (
        <div className="space-y-2">
          <div className={["rounded-lg border px-3 py-2.5", answer.correct ? "border-emerald-800/50 bg-emerald-950/20" : "border-amber-800/50 bg-amber-950/20"].join(" ")}>
            <p className={["text-xs font-semibold mb-1", answer.correct ? "text-emerald-400" : "text-amber-400"].join(" ")}>
              {answer.correct ? t.quiz.goodAnswer : t.quiz.partialIncorrect}
            </p>
            <p className="text-sand-400 text-xs">{t.quiz.modelAnswer(question.expected)}</p>
          </div>
          <div className="bg-bark-850 border border-warm rounded-lg px-3 py-2">
            <p className="text-sand-500 text-xs italic">{question.explanation}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        {!answered ? (
          <div className="flex items-center gap-3">
            <Button variant="primary" size="sm" onClick={checkAnswer} disabled={!input.trim()}>{t.quiz.submit}</Button>
            <button onClick={onSkip} className="text-sand-600 text-xs hover:text-sand-400 transition-colors">{t.quiz.skip}</button>
          </div>
        ) : (
          <div />
        )}
        {answered && (
          <Button variant="primary" size="sm" onClick={onNext}>
            {isLast ? t.quiz.seeResults : t.quiz.nextBtn}
          </Button>
        )}
      </div>
    </Card>
  );
}
