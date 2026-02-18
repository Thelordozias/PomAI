"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Course, Chapter, Capture, MathCaptureContent, GenericCaptureContent } from "@/types";
import { deleteCapture } from "../actions";
import { PomodoroTimer } from "./PomodoroTimer";
import { CaptureForm } from "./CaptureForm";
import { Badge } from "@/components/ui/Badge";

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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
      {/* Page header */}
      <div>
        <h2 className="text-sand-200 text-xl font-semibold">Study</h2>
        <p className="text-sand-500 text-sm mt-0.5">
          Focus timer + structured knowledge captures.
        </p>
      </div>

      {/* Two-column layout on md+ */}
      <div className="flex flex-col md:flex-row gap-8 md:items-start">
        {/* Left: Timer */}
        <div className="shrink-0 flex flex-col items-center md:items-start gap-6">
          <PomodoroTimer />

          {/* Course selector */}
          <div className="w-full md:w-48">
            <label className="block text-sand-400 text-xs mb-1">Course</label>
            <select
              value={selectedCourseId}
              onChange={(e) => handleCourseChange(e.target.value)}
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

          {selectedCourse && (
            <p className="text-sand-600 text-xs hidden md:block">
              Captures are saved to{" "}
              <span className="text-sand-400">{selectedCourse.title}</span>
            </p>
          )}
        </div>

        {/* Right: Capture form */}
        <div className="flex-1 min-w-0">
          {selectedCourseId ? (
            <CaptureForm
              courseId={selectedCourseId}
              chapters={chapters}
            />
          ) : (
            <div className="border border-dashed border-warm rounded p-8 text-center">
              <p className="text-sand-500 text-sm">
                Select a course to start capturing.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Captures for this session */}
      {selectedCourseId && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sand-200 text-sm font-semibold">
              Recent Captures
            </h3>
            <Badge variant="default">{captures.length}</Badge>
          </div>

          {captures.length === 0 ? (
            <p className="text-sand-600 text-xs">
              No captures yet for this course. Start typing above!
            </p>
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

/* ─── Capture row ────────────────────────────────────────────────────── */

function CaptureRow({
  capture,
  onDelete,
  disabled,
}: {
  capture: Capture;
  onDelete: () => void;
  disabled: boolean;
}) {
  const date = new Date(capture.created_at).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <li className="flex items-start gap-3 px-4 py-3 rounded bg-card border border-warm group">
      {/* Mode badge */}
      <Badge variant={capture.mode === "math" ? "accent" : "default"}>
        {capture.mode === "math" ? "Math" : "Note"}
      </Badge>

      {/* Content preview */}
      <div className="flex-1 min-w-0">
        {capture.mode === "math" ? (
          <MathPreview content={capture.content as MathCaptureContent} />
        ) : (
          <GenericPreview content={capture.content as GenericCaptureContent} />
        )}
      </div>

      {/* Meta + delete */}
      <div className="shrink-0 flex flex-col items-end gap-1">
        <span className="text-sand-600 text-xs">{date}</span>
        <button
          onClick={onDelete}
          disabled={disabled}
          className="text-sand-600 text-xs hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-40"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

function MathPreview({ content }: { content: MathCaptureContent }) {
  return (
    <div>
      {content.concept && (
        <p className="text-sand-200 text-sm font-medium truncate">
          {content.concept}
        </p>
      )}
      {content.formula && (
        <p className="text-sand-500 text-xs font-mono truncate mt-0.5">
          {content.formula}
        </p>
      )}
    </div>
  );
}

function GenericPreview({ content }: { content: GenericCaptureContent }) {
  return (
    <p className="text-sand-400 text-sm line-clamp-2">{content.notes}</p>
  );
}
