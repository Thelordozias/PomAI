"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

/* ─── Text Input ─────────────────────────────────────────────────────── */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sand-500 text-xs font-medium uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            "w-full rounded px-3 py-2 text-sm",
            "bg-muted border border-warm",
            "text-sand-200 placeholder:text-sand-600",
            "transition-colors duration-150",
            "focus:outline-none focus:border-ember-500 focus:ring-1 focus:ring-ember-500",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            error ? "border-red-600 focus:border-red-500 focus:ring-red-500" : "",
            className,
          ].join(" ")}
          {...props}
        />
        {hint && !error && (
          <p className="text-sand-600 text-xs">{hint}</p>
        )}
        {error && (
          <p className="text-red-400 text-xs">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

/* ─── Textarea ───────────────────────────────────────────────────────── */

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sand-500 text-xs font-medium uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={4}
          className={[
            "w-full rounded px-3 py-2 text-sm",
            "bg-muted border border-warm",
            "text-sand-200 placeholder:text-sand-600",
            "resize-y transition-colors duration-150",
            "focus:outline-none focus:border-ember-500 focus:ring-1 focus:ring-ember-500",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            error ? "border-red-600 focus:border-red-500 focus:ring-red-500" : "",
            className,
          ].join(" ")}
          {...props}
        />
        {hint && !error && (
          <p className="text-sand-600 text-xs">{hint}</p>
        )}
        {error && (
          <p className="text-red-400 text-xs">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

/* ─── Select ─────────────────────────────────────────────────────────── */

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = "", id, children, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sand-500 text-xs font-medium uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={[
            "w-full rounded px-3 py-2 text-sm",
            "bg-muted border border-warm",
            "text-sand-200",
            "focus:outline-none focus:border-ember-500 focus:ring-1 focus:ring-ember-500",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            error ? "border-red-600" : "",
            className,
          ].join(" ")}
          {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
        >
          {children}
        </select>
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
