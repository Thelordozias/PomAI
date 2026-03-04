"use client";

import { useEffect, useRef } from "react";
import { Button } from "./Button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  /** Width class — default "max-w-lg" */
  width?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  width = "max-w-lg",
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    /* Backdrop */
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(20, 14, 9, 0.75)" }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      {/* Panel */}
      <div
        className={[
          "w-full rounded-xl bg-bark-850 border border-warm shadow-lift",
          "flex flex-col gap-0 slide-up",
          width,
        ].join(" ")}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between p-5 border-b border-warm">
            <div>
              {title && (
                <h2
                  id="modal-title"
                  className="text-sand-200 font-semibold text-base"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-sand-500 text-sm mt-1">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="text-sand-500 hover:text-sand-200 transition-colors ml-4 mt-0.5"
            >
              {/* Simple X icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ─── Convenience footer for modal action buttons ─────────────────────── */

interface ModalFooterProps {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger";
  loading?: boolean;
}

export function ModalFooter({
  onCancel,
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "primary",
  loading = false,
}: ModalFooterProps) {
  return (
    <div className="flex justify-end gap-3 pt-4 border-t border-warm mt-2">
      <Button variant="ghost" size="sm" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button
        variant={confirmVariant}
        size="sm"
        onClick={onConfirm}
        loading={loading}
      >
        {confirmLabel}
      </Button>
    </div>
  );
}
