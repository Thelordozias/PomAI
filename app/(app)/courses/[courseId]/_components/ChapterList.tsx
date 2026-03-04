"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Course, Chapter } from "@/types";
import { createChapter, deleteChapter, updateCourse } from "../../actions";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useTranslation } from "@/components/providers/LanguageProvider";

interface Props {
  course: Course;
  chapters: Chapter[];
  captureCounts: Record<string, number>;
  masteredCounts: Record<string, number>;
  totalCaptures: number;
}

export function ChapterList({ course, chapters: initial, captureCounts, masteredCounts, totalCaptures }: Props) {
  const t = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [showAdd, setShowAdd] = useState(false);
  const [chapterTitle, setChapterTitle] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const [toDelete, setToDelete] = useState<Chapter | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [editTitle, setEditTitle] = useState(course.title);
  const [editDesc, setEditDesc] = useState(course.description ?? "");
  const [editError, setEditError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  async function handleAddChapter() {
    if (!chapterTitle.trim()) {
      setAddError(t.courses.titleRequired);
      return;
    }
    setAdding(true);
    setAddError(null);
    const result = await createChapter(course.id, chapterTitle);
    if (result.success) {
      setShowAdd(false);
      setChapterTitle("");
      startTransition(() => router.refresh());
    } else {
      setAddError(result.error);
    }
    setAdding(false);
  }

  async function handleDeleteChapter() {
    if (!toDelete) return;
    setDeleting(true);
    const result = await deleteChapter(toDelete.id, course.id);
    if (result.success) {
      setToDelete(null);
      startTransition(() => router.refresh());
    }
    setDeleting(false);
  }

  async function handleEditCourse() {
    if (!editTitle.trim()) {
      setEditError(t.courses.courseTitleRequired);
      return;
    }
    setEditing(true);
    setEditError(null);
    const result = await updateCourse(course.id, editTitle, editDesc);
    if (result.success) {
      setShowEdit(false);
      startTransition(() => router.refresh());
    } else {
      setEditError(result.error);
    }
    setEditing(false);
  }

  return (
    <>
      {/* Course header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-sand-200 text-xl font-semibold leading-snug">{course.title}</h2>
            {course.description && (
              <p className="text-sand-500 text-sm mt-1">{course.description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditTitle(course.title);
              setEditDesc(course.description ?? "");
              setEditError(null);
              setShowEdit(true);
            }}
            className="shrink-0"
          >
            {t.courses.editBtn}
          </Button>
        </div>

        {totalCaptures > 0 && (
          <div className="mt-4 flex items-center gap-4 text-xs text-sand-500">
            <span>{t.courses.captureCount(totalCaptures)}</span>
            <span>{t.courses.chapterCount(initial.length)}</span>
          </div>
        )}
      </div>

      {/* Chapters section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sand-200 font-semibold text-sm">{t.courses.chaptersLabel}</h3>
          <Badge variant="default">{initial.length}</Badge>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setChapterTitle("");
            setAddError(null);
            setShowAdd(true);
          }}
          disabled={isPending}
        >
          {t.courses.addChapter}
        </Button>
      </div>

      {/* Chapter list */}
      {initial.length === 0 ? (
        <div className="border border-dashed border-warm rounded-xl p-8 text-center">
          <p className="text-sand-500 text-sm">{t.courses.noChapters}</p>
        </div>
      ) : (
        <ol className="space-y-2">
          {initial.map((chapter, idx) => (
            <ChapterRow
              key={chapter.id}
              chapter={chapter}
              index={idx + 1}
              captures={captureCounts[chapter.id] ?? 0}
              mastered={masteredCounts[chapter.id] ?? 0}
              onDelete={() => setToDelete(chapter)}
              disabled={isPending}
            />
          ))}
        </ol>
      )}

      {/* Add chapter modal */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title={t.courses.addChapterTitle}
        description={t.courses.addChapterDesc}
      >
        <div className="space-y-4">
          <Input
            label={t.courses.chapterTitleLabel}
            placeholder={t.courses.chapterTitlePlaceholder}
            value={chapterTitle}
            onChange={(e) => setChapterTitle(e.target.value)}
            autoFocus
          />
          {addError && <p className="text-red-400 text-sm">{addError}</p>}
          <ModalFooter
            onCancel={() => setShowAdd(false)}
            onConfirm={handleAddChapter}
            confirmLabel={t.courses.addChapterConfirm}
            loading={adding}
          />
        </div>
      </Modal>

      {/* Delete chapter modal */}
      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title={t.courses.deleteChapterTitle}
        description={toDelete ? t.courses.deleteChapterDesc(toDelete.title) : ""}
      >
        <ModalFooter
          onCancel={() => setToDelete(null)}
          onConfirm={handleDeleteChapter}
          confirmLabel={t.courses.deleteChapterBtn}
          confirmVariant="danger"
          loading={deleting}
        />
      </Modal>

      {/* Edit course modal */}
      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title={t.courses.editCourseTitle}
      >
        <div className="space-y-4">
          <Input
            label={t.courses.chapterTitleLabel}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            autoFocus
          />
          <Textarea
            label={t.courses.descriptionLabel}
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            rows={3}
          />
          {editError && <p className="text-red-400 text-sm">{editError}</p>}
          <ModalFooter
            onCancel={() => setShowEdit(false)}
            onConfirm={handleEditCourse}
            confirmLabel={t.courses.saveChanges}
            loading={editing}
          />
        </div>
      </Modal>
    </>
  );
}

/* ─── Chapter row ────────────────────────────────────────────────────── */

function ChapterRow({
  chapter,
  index,
  captures,
  mastered,
  onDelete,
  disabled,
}: {
  chapter: Chapter;
  index: number;
  captures: number;
  mastered: number;
  onDelete: () => void;
  disabled: boolean;
}) {
  const t = useTranslation();
  const progress = captures > 0 ? Math.round((mastered / captures) * 100) : 0;

  return (
    <li className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-warm group">
      <span className="text-sand-600 text-xs font-mono w-5 shrink-0 text-right">
        {String(index).padStart(2, "0")}
      </span>

      <div className="flex-1 min-w-0">
        <span className="text-sand-200 text-sm">{chapter.title}</span>
        {captures > 0 && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-1 bg-bark-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-ember-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sand-600 text-[10px] shrink-0">
              {captures} cap · {progress}%
            </span>
          </div>
        )}
      </div>

      <button
        onClick={onDelete}
        disabled={disabled}
        className="text-sand-600 text-xs hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-40"
        aria-label={`Delete ${chapter.title}`}
      >
        {t.courses.deleteChapterBtn}
      </button>
    </li>
  );
}
