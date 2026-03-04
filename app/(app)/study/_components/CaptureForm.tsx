"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Chapter } from "@/types";
import { createCapture } from "../actions";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useTranslation } from "@/components/providers/LanguageProvider";

type Mode = "math" | "generic";

interface Props {
  courseId: string;
  courseTitle?: string;
  chapters: Chapter[];
}

const EMPTY_MATH = { concept: "", definition: "", formula: "", example: "", common_mistake: "" };
const EMPTY_GENERIC = { notes: "" };

export function CaptureForm({ courseId, courseTitle, chapters }: Props) {
  const t = useTranslation();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [mode, setMode] = useState<Mode>("math");
  const [chapterId, setChapterId] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [math, setMath] = useState(EMPTY_MATH);
  const [generic, setGeneric] = useState(EMPTY_GENERIC);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  function setMathField(key: keyof typeof EMPTY_MATH, value: string) {
    setMath((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setMath(EMPTY_MATH);
    setGeneric(EMPTY_GENERIC);
    setConfidence(3);
    setError(null);
    setAiError(null);
  }

  async function handleAIFill() {
    const concept = math.concept.trim();
    if (!concept) { setAiError(t.study.aiEnterConcept); return; }
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/explain-concept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept, courseTitle }),
      });
      const data = (await res.json()) as {
        definition?: string; formula?: string;
        example?: string; common_mistake?: string; error?: string;
      };
      if (!res.ok || data.error) { setAiError(data.error ?? t.study.aiFillFailed); return; }
      setMath((prev) => ({
        ...prev,
        definition: data.definition || prev.definition,
        formula: data.formula || prev.formula,
        example: data.example || prev.example,
        common_mistake: data.common_mistake || prev.common_mistake,
      }));
    } catch {
      setAiError(t.study.networkError);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit() {
    const content = mode === "math" ? math : generic;
    if (mode === "math" && !math.concept.trim() && !math.formula.trim()) {
      setError(t.study.fillConceptOrFormula); return;
    }
    if (mode === "generic" && !generic.notes.trim()) {
      setError(t.study.notesEmpty); return;
    }
    setSubmitting(true);
    setError(null);
    const result = await createCapture(courseId, mode, content, confidence, chapterId || undefined);
    if (result.success) {
      resetForm();
      startTransition(() => router.refresh());
    } else {
      setError(result.error);
    }
    setSubmitting(false);
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex rounded overflow-hidden border border-warm w-fit">
        {(["math", "generic"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={[
              "px-4 py-1.5 text-xs font-medium capitalize transition-colors",
              mode === m ? "bg-ember-400 text-white" : "text-sand-400 hover:text-sand-200 hover:bg-warm",
            ].join(" ")}
          >
            {m === "math" ? t.study.modeToggleMath : t.study.modeToggleGeneric}
          </button>
        ))}
      </div>

      {/* Chapter selector */}
      {chapters.length > 0 && (
        <div>
          <label className="block text-sand-400 text-xs mb-1">{t.study.chapterOptional}</label>
          <select
            value={chapterId}
            onChange={(e) => setChapterId(e.target.value)}
            className="w-full bg-card border border-warm rounded px-3 py-2 text-sand-200 text-sm focus:outline-none focus:border-ember-400"
          >
            <option value="">{t.study.noChapter}</option>
            {chapters.map((ch) => (
              <option key={ch.id} value={ch.id}>{ch.title}</option>
            ))}
          </select>
        </div>
      )}

      {/* Math fields */}
      {mode === "math" && (
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label={t.study.conceptTitle}
                  placeholder={t.study.conceptPlaceholder}
                  value={math.concept}
                  onChange={(e) => setMathField("concept", e.target.value)}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAIFill}
                loading={aiLoading}
                disabled={aiLoading || !math.concept.trim()}
                className="shrink-0 mb-0.5"
              >
                {t.study.aiFill}
              </Button>
            </div>
            {aiError && <p className="text-red-400 text-xs">{aiError}</p>}
            {aiLoading && <p className="text-sand-500 text-xs animate-pulse">{t.study.aiGenerating}</p>}
          </div>

          <Textarea label={t.study.definition} placeholder={t.study.definitionPlaceholder} value={math.definition} onChange={(e) => setMathField("definition", e.target.value)} rows={2} />
          <Input label={t.study.formula} placeholder="e.g. ∫ₐᵇ f(x) dx = F(b) − F(a)" value={math.formula} onChange={(e) => setMathField("formula", e.target.value)} className="font-mono" />
          <Textarea label={t.study.example} placeholder={t.study.examplePlaceholder} value={math.example} onChange={(e) => setMathField("example", e.target.value)} rows={2} />
          <Textarea label={t.study.commonMistake} placeholder={t.study.commonMistakePlaceholder} value={math.common_mistake} onChange={(e) => setMathField("common_mistake", e.target.value)} rows={2} />
        </div>
      )}

      {/* Generic fields */}
      {mode === "generic" && (
        <Textarea label={t.study.notes} placeholder={t.study.notesPlaceholder} value={generic.notes} onChange={(e) => setGeneric({ notes: e.target.value })} rows={6} />
      )}

      {/* Confidence */}
      <div>
        <p className="text-sand-400 text-xs mb-2">
          {t.study.confidence} — <span className="text-sand-500">{t.study.confidenceLabels[confidence]}</span>
        </p>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setConfidence(n)}
              className={[
                "w-8 h-8 rounded text-xs font-mono transition-colors",
                confidence === n
                  ? "bg-ember-400 text-white"
                  : "bg-card border border-warm text-sand-500 hover:border-ember-400 hover:text-sand-200",
              ].join(" ")}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <Button variant="primary" size="sm" onClick={handleSubmit} disabled={submitting || !courseId} className="w-full">
        {submitting ? t.study.saving : t.study.saveCapture}
      </Button>

      {!courseId && <p className="text-sand-600 text-xs text-center">{t.study.selectCourseFirst}</p>}
    </div>
  );
}
