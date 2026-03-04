"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

/* ─── Types ──────────────────────────────────────────────────────────── */

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

/* ─── Context ─────────────────────────────────────────────────────────── */

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

/* ─── Provider ────────────────────────────────────────────────────────── */

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast stack — fixed bottom-right */}
      <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ─── Individual Toast ────────────────────────────────────────────────── */

const variantStyles: Record<ToastVariant, string> = {
  success: "bg-emerald-950 border-emerald-800/60 text-emerald-300",
  error:   "bg-red-950 border-red-800/60 text-red-300",
  info:    "bg-bark-850 border-warm text-sand-200",
};

const variantIcon: Record<ToastVariant, string> = {
  success: "✓",
  error:   "✗",
  info:    "ℹ",
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={[
        "pointer-events-auto max-w-xs w-full",
        "border rounded-xl px-4 py-3 shadow-lift",
        "flex items-center gap-3",
        "transition-all duration-300",
        variantStyles[toast.variant],
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
      ].join(" ")}
    >
      <span className="text-sm font-semibold shrink-0">{variantIcon[toast.variant]}</span>
      <p className="text-sm flex-1">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-xs opacity-50 hover:opacity-100 transition-opacity shrink-0"
      >
        ✕
      </button>
    </div>
  );
}
