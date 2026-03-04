"use client";

import { useState, useRef } from "react";
import type { Course } from "@/types";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/providers/LanguageProvider";

interface Props {
  courses: Course[];
}

type UploadStatus = "idle" | "reading" | "uploading" | "done" | "error";

export function DocumentUpload({ courses }: Props) {
  const t = useTranslation();
  const { toast } = useToast();
  const router = useRouter();

  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; total_chunks: number; capped: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isPdf = (file: File) =>
    file.name.endsWith(".pdf") || file.type === "application/pdf";

  async function handleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setError(t.study.uploadNoFile); return; }
    if (!courseId) { setError(t.study.uploadNoCourse); return; }

    setError(null);
    setResult(null);
    setStatus("reading");

    try {
      let res: Response;

      if (isPdf(file)) {
        // PDF: send file to server for parsing
        setStatus("uploading");
        const formData = new FormData();
        formData.append("courseId", courseId);
        formData.append("file", file);
        res = await fetch("/api/import-document", { method: "POST", body: formData });
      } else if (
        file.type === "text/plain" ||
        file.name.endsWith(".txt") ||
        file.name.endsWith(".md")
      ) {
        // TXT / MD: read client-side
        const text = await file.text();
        if (!text.trim()) throw new Error(t.study.uploadNoText);
        setStatus("uploading");
        res = await fetch("/api/import-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId, text, filename: file.name }),
        });
      } else {
        throw new Error(t.study.uploadUnsupported);
      }

      const data = await res.json() as { created?: number; total_chunks?: number; capped?: boolean; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? t.study.uploadServerError);

      setResult({ created: data.created ?? 0, total_chunks: data.total_chunks ?? 0, capped: data.capped ?? false });
      setStatus("done");
      toast(t.study.uploadSuccess(data.created ?? 0, file.name), "success");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.study.uploadServerError;
      setError(msg);
      setStatus("error");
    }
  }

  function reset() {
    setStatus("idle");
    setError(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {/* Course selector */}
        <div>
          <label className="block text-sand-500 text-xs font-medium mb-1.5">{t.study.course}</label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            disabled={status === "reading" || status === "uploading"}
            className="w-full bg-muted border border-warm rounded-lg px-3 py-2 text-sand-200 text-sm focus:outline-none focus:border-ember-500 focus:ring-1 focus:ring-ember-500/50"
          >
            {courses.length === 0 && <option value="">{t.study.uploadNoCourses}</option>}
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>

        {/* File input */}
        <div>
          <label className="block text-sand-500 text-xs font-medium mb-1.5">{t.study.uploadFile}</label>
          <div
            className="border border-dashed border-warm rounded-xl p-6 text-center cursor-pointer hover:border-ember-500/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,.md,text/plain,application/pdf"
              className="hidden"
              onChange={() => setStatus("idle")}
            />
            <p className="text-sand-500 text-sm">
              {fileRef.current?.files?.[0]?.name
                ? <span className="text-sand-200">{fileRef.current.files[0].name}</span>
                : t.study.uploadClick}
            </p>
            <p className="text-sand-600 text-xs mt-1">{t.study.uploadHint}</p>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">{error}</p>
        )}

        {result && (
          <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-lg px-3 py-2.5 space-y-0.5">
            <p className="text-emerald-400 text-sm font-medium">
              {t.study.uploadSuccess(result.created, "")}
            </p>
            {result.capped && (
              <p className="text-sand-500 text-xs">
                {t.study.uploadCapped(result.total_chunks)}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="primary"
          size="md"
          onClick={handleImport}
          loading={status === "reading" || status === "uploading"}
          disabled={courses.length === 0}
          className="flex-1"
        >
          {status === "uploading" ? t.study.uploadUploading : t.study.uploadImport}
        </Button>
        {(status === "done" || status === "error") && (
          <Button variant="ghost" size="md" onClick={reset}>{t.study.uploadNew}</Button>
        )}
      </div>
    </div>
  );
}
