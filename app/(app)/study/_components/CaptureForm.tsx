"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Chapter } from "@/types";
import { createCapture } from "../actions";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";

type Mode = "math" | "generic";

interface Props {
  courseId: string;
  chapters: Chapter[];
}

const EMPTY_MATH = {
  concept: "",
  definition: "",
  formula: "",
  example: "",
  common_mistake: "",
};

const EMPTY_GENERIC = { notes: "" };

export function CaptureForm({ courseId, chapters }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [mode, setMode] = useState<Mode>("math");
  const [chapterId, setChapterId] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [math, setMath] = useState(EMPTY_MATH);
  const [generic, setGeneric] = useState(EMPTY_GENERIC);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setMathField(key: keyof typeof EMPTY_MATH, value: string) {
    setMath((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setMath(EMPTY_MATH);
    setGeneric(EMPTY_GENERIC);
    setConfidence(3);
    setError(null);
  }

  async function handleSubmit() {
    const content = mode === "math" ? math : generic;

    // Minimal validation
    if (mode === "math" && !math.concept.trim() && !math.formula.trim()) {
      setError("Fill in at least Concept or Formula.");
      return;
    }
    if (mode === "generic" && !generic.notes.trim()) {
      setError("Notes cannot be empty.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const result = await createCapture(
      courseId,
      mode,
      content,
      confidence,
      chapterId || undefined
    );
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
              mode === m
                ? "bg-ember-400 text-white"
                : "text-sand-400 hover:text-sand-200 hover:bg-warm",
            ].join(" ")}
          >
            {m === "math" ? "Math" : "Generic"}
          </button>
        ))}
      </div>

      {/* Chapter selector */}
      {chapters.length > 0 && (
        <div>
          <label className="block text-sand-400 text-xs mb-1">Chapter (optional)</label>
          <select
            value={chapterId}
            onChange={(e) => setChapterId(e.target.value)}
            className="w-full bg-card border border-warm rounded px-3 py-2 text-sand-200 text-sm focus:outline-none focus:border-ember-400"
          >
            <option value="">— No chapter —</option>
            {chapters.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Math fields */}
      {mode === "math" && (
        <div className="space-y-3">
          <Input
            label="Concept / Title"
            placeholder="e.g. Fundamental Theorem of Calculus"
            value={math.concept}
            onChange={(e) => setMathField("concept", e.target.value)}
          />
          <Textarea
            label="Definition"
            placeholder="Formal definition…"
            value={math.definition}
            onChange={(e) => setMathField("definition", e.target.value)}
            rows={2}
          />
          <Input
            label="Formula / Expression"
            placeholder="e.g. ∫ₐᵇ f(x) dx = F(b) − F(a)"
            value={math.formula}
            onChange={(e) => setMathField("formula", e.target.value)}
            className="font-mono"
          />
          <Textarea
            label="Example"
            placeholder="Worked example…"
            value={math.example}
            onChange={(e) => setMathField("example", e.target.value)}
            rows={2}
          />
          <Textarea
            label="Common Mistake"
            placeholder="What do students often get wrong?"
            value={math.common_mistake}
            onChange={(e) => setMathField("common_mistake", e.target.value)}
            rows={2}
          />
        </div>
      )}

      {/* Generic fields */}
      {mode === "generic" && (
        <Textarea
          label="Notes"
          placeholder="Write anything…"
          value={generic.notes}
          onChange={(e) => setGeneric({ notes: e.target.value })}
          rows={6}
        />
      )}

      {/* Confidence selector */}
      <div>
        <p className="text-sand-400 text-xs mb-2">Confidence</p>
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

      {/* Error */}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Submit */}
      <Button
        variant="primary"
        size="sm"
        onClick={handleSubmit}
        disabled={submitting || !courseId}
        className="w-full"
      >
        {submitting ? "Saving…" : "Save Capture"}
      </Button>

      {!courseId && (
        <p className="text-sand-600 text-xs text-center">
          Select a course above to save captures.
        </p>
      )}
    </div>
  );
}
