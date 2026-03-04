"use client";

import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

const baseInput = [
  "w-full rounded-lg px-3 py-2 text-sm",
  "bg-muted border border-warm",
  "text-sand-200 placeholder:text-sand-600",
  "transition-all duration-150",
  "focus:outline-none focus:border-ember-500 focus:ring-1 focus:ring-ember-500/50 focus:bg-bark-850",
  "disabled:opacity-40 disabled:cursor-not-allowed",
].join(" ");

const labelClass = "block text-sand-500 text-xs font-medium mb-1.5";

/* ─── Input ─────────────────────────────────────────────────────────── */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col">
        {label && <label htmlFor={inputId} className={labelClass}>{label}</label>}
        <input
          ref={ref}
          id={inputId}
          className={[
            baseInput,
            error ? "border-red-700 focus:border-red-500 focus:ring-red-500/50" : "",
            className,
          ].join(" ")}
          {...props}
        />
        {hint && !error && <p className="text-sand-600 text-xs mt-1">{hint}</p>}
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
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
      <div className="flex flex-col">
        {label && <label htmlFor={inputId} className={labelClass}>{label}</label>}
        <textarea
          ref={ref}
          id={inputId}
          rows={4}
          className={[
            baseInput,
            "resize-y",
            error ? "border-red-700 focus:border-red-500 focus:ring-red-500/50" : "",
            className,
          ].join(" ")}
          {...props}
        />
        {hint && !error && <p className="text-sand-600 text-xs mt-1">{hint}</p>}
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

/* ─── Select ─────────────────────────────────────────────────────────── */

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = "", id, children, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col">
        {label && <label htmlFor={inputId} className={labelClass}>{label}</label>}
        <select
          ref={ref}
          id={inputId}
          className={[
            baseInput,
            error ? "border-red-700" : "",
            className,
          ].join(" ")}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
