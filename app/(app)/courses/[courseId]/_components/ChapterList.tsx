"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Course, Chapter } from "@/types";
import { createChapter, deleteChapter, updateCourse } from "../../actions";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";

interface Props {
  course: Course;
  chapters: Chapter[];
}

export function ChapterList({ course, chapters: initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Add chapter modal
  const [showAdd, setShowAdd] = useState(false);
  const [chapterTitle, setChapterTitle] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // Delete chapter confirmation
  const [toDelete, setToDelete] = useState<Chapter | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Edit course modal
  const [showEdit, setShowEdit] = useState(false);
  const [editTitle, setEditTitle] = useState(course.title);
  const [editDesc, setEditDesc] = useState(course.description ?? "");
  const [editError, setEditError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  async function handleAddChapter() {
    if (!chapterTitle.trim()) {
      setAddError("Chapter title is required.");
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
      setEditError("Title is required.");
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
            <h2 className="text-sand-200 text-xl font-semibold leading-snug">
              {course.title}
            </h2>
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
            Edit
          </Button>
        </div>
      </div>

      {/* Chapters section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sand-200 font-semibold text-sm">Chapters</h3>
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
          + Add Chapter
        </Button>
      </div>

      {/* Chapter list */}
      {initial.length === 0 ? (
        <div className="border border-dashed border-warm rounded p-8 text-center">
          <p className="text-sand-500 text-sm">
            No chapters yet. Add one to organise your material.
          </p>
        </div>
      ) : (
        <ol className="space-y-2">
          {initial.map((chapter, idx) => (
            <ChapterRow
              key={chapter.id}
              chapter={chapter}
              index={idx + 1}
              onDelete={() => setToDelete(chapter)}
              disabled={isPending}
            />
          ))}
        </ol>
      )}

      {/* ── Add chapter modal ─────────────────────────────────────────── */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Chapter"
        description="Chapters help you organise concepts within a course."
      >
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="e.g. Chapter 1: Limits and Continuity"
            value={chapterTitle}
            onChange={(e) => setChapterTitle(e.target.value)}
            autoFocus
          />
          {addError && <p className="text-red-400 text-sm">{addError}</p>}
          <ModalFooter
            onCancel={() => setShowAdd(false)}
            onConfirm={handleAddChapter}
            confirmLabel="Add chapter"
            loading={adding}
          />
        </div>
      </Modal>

      {/* ── Delete chapter confirmation ───────────────────────────────── */}
      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete chapter?"
        description={`"${toDelete?.title}" will be deleted. Concepts linked to this chapter will be unlinked but not deleted.`}
      >
        <ModalFooter
          onCancel={() => setToDelete(null)}
          onConfirm={handleDeleteChapter}
          confirmLabel="Delete"
          confirmVariant="danger"
          loading={deleting}
        />
      </Modal>

      {/* ── Edit course modal ─────────────────────────────────────────── */}
      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit Course"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            autoFocus
          />
          <Textarea
            label="Description"
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            rows={3}
          />
          {editError && <p className="text-red-400 text-sm">{editError}</p>}
          <ModalFooter
            onCancel={() => setShowEdit(false)}
            onConfirm={handleEditCourse}
            confirmLabel="Save changes"
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
  onDelete,
  disabled,
}: {
  chapter: Chapter;
  index: number;
  onDelete: () => void;
  disabled: boolean;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3 rounded bg-card border border-warm group">
      {/* Position number */}
      <span className="text-sand-600 text-xs font-mono w-5 shrink-0 text-right">
        {String(index).padStart(2, "0")}
      </span>

      {/* Title */}
      <span className="flex-1 text-sand-200 text-sm">{chapter.title}</span>

      {/* Delete — visible on hover */}
      <button
        onClick={onDelete}
        disabled={disabled}
        className="text-sand-600 text-xs hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-40"
        aria-label={`Delete ${chapter.title}`}
      >
        Delete
      </button>
    </li>
  );
}
