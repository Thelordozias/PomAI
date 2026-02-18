import { HTMLAttributes } from "react";

type BadgeVariant = "default" | "accent" | "success" | "warning" | "danger" | "info";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-muted text-sand-400 border-warm",
  accent:  "bg-ember-500/15 text-ember-400 border-ember-700",
  success: "bg-green-900/30 text-green-400 border-green-800",
  warning: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
  danger:  "bg-red-900/30 text-red-400 border-red-800",
  info:    "bg-blue-900/30 text-blue-300 border-blue-800",
};

export function Badge({
  variant = "default",
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center px-2 py-0.5",
        "text-xs font-medium rounded",
        "border",
        variantClasses[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}
