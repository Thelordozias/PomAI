import { HTMLAttributes } from "react";

type BadgeVariant = "default" | "accent" | "success" | "warning" | "danger" | "info";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-bark-800 text-sand-400 border-warm",
  accent:  "bg-ember-500/15 text-ember-400 border-ember-700/50",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-800/50",
  warning: "bg-amber-500/10 text-amber-400 border-amber-800/50",
  danger:  "bg-red-500/10 text-red-400 border-red-800/50",
  info:    "bg-sky-500/10 text-sky-400 border-sky-800/50",
};

export function Badge({ variant = "default", className = "", children, ...props }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center px-2 py-0.5",
        "text-xs font-medium rounded-md border",
        variantClasses[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}
