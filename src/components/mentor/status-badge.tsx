import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatusVariant = "default" | "success" | "warning" | "danger" | "info" | "muted";

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  dot?: boolean;
  className?: string;
}

const variantClasses: Record<StatusVariant, string> = {
  default: "bg-muted text-muted-foreground border-border",
  success: "badge-success border",
  warning: "badge-warning border",
  danger: "badge-danger border",
  info: "badge-info border",
  muted: "bg-muted/50 text-muted-foreground border-border",
};

const dotColors: Record<StatusVariant, string> = {
  default: "bg-muted-foreground",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
  muted: "bg-muted-foreground",
};

export function StatusBadge({
  label,
  variant = "default",
  dot = false,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[variant])} />}
      {label}
    </span>
  );
}
