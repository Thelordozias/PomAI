"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { Course, Chapter, Capture, MathCaptureContent, GenericCaptureContent } from "@/types";
import { deleteCapture } from "../actions";
import { PomodoroTimer } from "./PomodoroTimer";
import { CaptureForm } from "./CaptureForm";
import { DocumentUpload } from "./DocumentUpload";
import { Badge } from "@/components/ui/Badge";
import { useTranslation } from "@/components/providers/LanguageProvider";

interface Props {
  courses: Course[];
  chapters: Chapter[];
  captures: Capture[];
  selectedCourseId: string;
}

export function StudyClient({
  courses,
  chapters,
  captures,
  selectedCourseId,
}: Props) {
  const t = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<"capture" | "import">("capture");

  function handleCourseChange(courseId: string) {
    const url = courseId ? `/study?courseId=${courseId}` : "/study";
    startTransition(() => router.push(url));
  }

  async function handleDeleteCapture(captureId: string) {
    await deleteCapture(captureId);
    startTransition(() => router.refresh());
  }

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-sand-200 text-xl font-semibold">{t.study.title}</h2>
        <p className="text-sand-500 text-sm mt-0.5">{t.study.subtitle}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 md:items-start">
        <div className="shrink-0 flex flex-col items-center md:items-start gap-6">
          <PomodoroTimer />

          <div className="w-full md:w-48">
            <label className="block text-sand-500 text-xs font-medium mb-1.5">{t.study.course}</label>
            <select
              value={selectedCourseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              disabled={isPending}
              className="w-full bg-muted border border-warm rounded-lg px-3 py-2 text-sand-200 text-sm focus:outline-none focus:border-ember-500 focus:ring-1 focus:ring-ember-500/50 disabled:opacity-50"
            >
              <option value="">{t.study.selectCourse}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex gap-1 p-1 bg-bark-800 rounded-lg mb-4 w-fit">
            {(["capture", "import"] as const).map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => setTab(tabKey)}
                className={[
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                  tab === tabKey
                    ? "bg-bark-850 text-sand-200 shadow-card"
                    : "text-sand-500 hover:text-sand-200",
                ].join(" ")}
              >
                {tabKey === "capture" ? t.study.tabCapture : t.study.tabImport}
              </button>
            ))}
          </div>

          {tab === "capture" ? (
            selectedCourseId ? (
              <CaptureForm
                courseId={selectedCourseId}
                courseTitle={selectedCourse?.title}
                chapters={chapters}
              />
            ) : (
              <div className="border border-dashed border-warm rounded-xl p-8 text-center">
                <p className="text-sand-500 text-sm">{t.study.selectCoursePrompt}</p>
              </div>
            )
          ) : (
            <div className="bg-card border border-warm rounded-xl p-5">
              <h3 className="text-sand-200 text-sm font-semibold mb-1">{t.study.importTitle}</h3>
              <p className="text-sand-500 text-xs mb-4">{t.study.importDesc}</p>
              <DocumentUpload courses={courses} />
            </div>
          )}
        </div>
      </div>

      {selectedCourseId && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sand-200 text-sm font-semibold">{t.study.recentCaptures}</h3>
            <Badge variant="default">{captures.length}</Badge>
          </div>

          {captures.length === 0 ? (
            <p className="text-sand-600 text-xs">{t.study.noCaptures}</p>
          ) : (
            <ul className="space-y-2">
              {captures.map((capture) => (
                <CaptureRow
                  key={capture.id}
                  capture={capture}
                  onDelete={() => handleDeleteCapture(capture.id)}
                  disabled={isPending}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function CaptureRow({
  capture,
  onDelete,
  disabled,
}: {
  capture: Capture;
  onDelete: () => void;
  disabled: boolean;
}) {
  const t = useTranslation();
  const date = new Date(capture.created_at).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <li className="flex items-start gap-3 px-4 py-3 rounded bg-card border border-warm group">
      <Badge variant={capture.mode === "math" ? "accent" : "default"}>
        {capture.mode === "math" ? "Math" : "Note"}
      </Badge>

      <div className="flex-1 min-w-0">
        {capture.mode === "math" ? (
          <MathPreview content={capture.content as MathCaptureContent} />
        ) : (
          <GenericPreview content={capture.content as GenericCaptureContent} />
        )}
      </div>

      <div className="shrink-0 flex flex-col items-end gap-1">
        <span className="text-sand-600 text-xs">{date}</span>
        <button
          onClick={onDelete}
          disabled={disabled}
          className="text-sand-600 text-xs hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-40"
        >
          {t.courses.deleteChapterBtn}
        </button>
      </div>
    </li>
  );
}

function MathPreview({ content }: { content: MathCaptureContent }) {
  return (
    <div>
      {content.concept && (
        <p className="text-sand-200 text-sm font-medium truncate">{content.concept}</p>
      )}
      {content.formula && (
        <p className="text-sand-500 text-xs font-mono truncate mt-0.5">{content.formula}</p>
      )}
    </div>
  );
}

function GenericPreview({ content }: { content: GenericCaptureContent }) {
  return <p className="text-sand-400 text-sm line-clamp-2">{content.notes}</p>;
}
