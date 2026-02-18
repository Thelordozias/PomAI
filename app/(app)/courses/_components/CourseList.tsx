"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Course } from "@/types";
import { createCourse, deleteCourse } from "../actions";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Card, CardBody } from "@/components/ui/Card";

interface Props {
  courses: Course[];
}

export function CourseList({ courses: initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Delete confirmation state — stores the course pending deletion
  const [toDelete, setToDelete] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  function openCreate() {
    setTitle("");
    setDesc("");
    setCreateError(null);
    setShowCreate(true);
  }

  async function handleCreate() {
    if (!title.trim()) {
      setCreateError("Title is required.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    const result = await createCourse(title, desc);
    if (result.success) {
      setShowCreate(false);
      startTransition(() => router.refresh());
    } else {
      setCreateError(result.error);
    }
    setCreating(false);
  }

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const result = await deleteCourse(toDelete.id);
    if (result.success) {
      setToDelete(null);
      startTransition(() => router.refresh());
    }
    setDeleting(false);
  }

  const isEmpty = initial.length === 0;

  return (
    <>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-sand-200 text-xl font-semibold">Courses</h2>
          <p className="text-sand-500 text-sm mt-0.5">
            {isEmpty ? "No courses yet." : `${initial.length} course${initial.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreate}>
          + New Course
        </Button>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="border border-dashed border-warm rounded p-12 text-center">
          <p className="text-sand-500 text-sm mb-4">
            Create your first course to get started.
          </p>
          <Button variant="secondary" size="sm" onClick={openCreate}>
            + New Course
          </Button>
        </div>
      )}

      {/* Course grid */}
      {!isEmpty && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {initial.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onDelete={() => setToDelete(course)}
              disabled={isPending}
            />
          ))}
        </div>
      )}

      {/* ── Create modal ─────────────────────────────────────────────── */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Course"
        description="Give your course a name and an optional description."
      >
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="e.g. Linear Algebra, Organic Chemistry"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <Textarea
            label="Description"
            placeholder="What is this course about? (optional)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
          />
          {createError && (
            <p className="text-red-400 text-sm">{createError}</p>
          )}
          <ModalFooter
            onCancel={() => setShowCreate(false)}
            onConfirm={handleCreate}
            confirmLabel="Create course"
            loading={creating}
          />
        </div>
      </Modal>

      {/* ── Delete confirmation modal ─────────────────────────────────── */}
      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete course?"
        description={`"${toDelete?.title}" and all its chapters, concepts, and captures will be permanently deleted.`}
      >
        <ModalFooter
          onCancel={() => setToDelete(null)}
          onConfirm={handleDelete}
          confirmLabel="Delete"
          confirmVariant="danger"
          loading={deleting}
        />
      </Modal>
    </>
  );
}

/* ─── Course card ────────────────────────────────────────────────────── */

function CourseCard({
  course,
  onDelete,
  disabled,
}: {
  course: Course;
  onDelete: () => void;
  disabled: boolean;
}) {
  const date = new Date(course.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card hover padding="none" className="group flex flex-col">
      <Link
        href={`/courses/${course.id}`}
        className="flex-1 p-5 block"
      >
        <h3 className="text-sand-200 font-semibold text-sm mb-1 leading-snug">
          {course.title}
        </h3>
        {course.description && (
          <p className="text-sand-500 text-xs line-clamp-2 mb-3">
            {course.description}
          </p>
        )}
        <p className="text-sand-600 text-xs mt-auto">{date}</p>
      </Link>

      {/* Card footer with delete */}
      <div className="px-5 pb-4 flex items-center justify-end border-t border-warm pt-3">
        <button
          onClick={(e) => {
            e.preventDefault();
            onDelete();
          }}
          disabled={disabled}
          className="text-sand-600 text-xs hover:text-red-400 transition-colors disabled:opacity-40"
          aria-label={`Delete ${course.title}`}
        >
          Delete
        </button>
      </div>
    </Card>
  );
}
