import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  ShieldQuestion,
  ShieldX,
  PauseCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";

export { initials } from "@/lib/utils";

const HEALTH_VARIANT: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  healthy: {
    label: "Healthy",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    icon: ShieldCheck,
  },
  good: { label: "Good", color: "text-blue-700 bg-blue-50 border-blue-200", icon: ShieldCheck },
  needs_attention: {
    label: "Needs attention",
    color: "badge-warning",
    icon: ShieldQuestion,
  },
  incomplete: {
    label: "Incomplete",
    color: "badge-warning",
    icon: ShieldX,
  },
  inactive: {
    label: "Inactive",
    color: "badge-neutral",
    icon: PauseCircle,
  },
};

const STATUS_VARIANT: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "badge-warning", icon: Clock },
  approved: {
    label: "Approved",
    color: "badge-success",
    icon: CheckCircle2,
  },
  active: {
    label: "Active",
    color: "badge-success",
    icon: CheckCircle2,
  },
  rejected: { label: "Rejected", color: "badge-danger", icon: ShieldX },
  suspended: {
    label: "Suspended",
    color: "badge-danger",
    icon: PauseCircle,
  },
  inactive: {
    label: "Inactive",
    color: "badge-neutral",
    icon: PauseCircle,
  },
};

export function MentorHealthBadge({
  health,
  reasons,
  className,
}: {
  health: string;
  reasons?: string[];
  className?: string;
}) {
  const v = HEALTH_VARIANT[health] || HEALTH_VARIANT.needs_attention;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        v.color,
        className,
      )}
      title={reasons && reasons.length > 0 ? reasons.join(", ") : undefined}
    >
      <v.icon className="h-3 w-3" />
      {v.label}
    </span>
  );
}

export function MentorStatusBadge({ status, className }: { status: string; className?: string }) {
  const v = STATUS_VARIANT[status] || STATUS_VARIANT.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        v.color,
        className,
      )}
    >
      <v.icon className="h-3 w-3" />
      {v.label}
    </span>
  );
}

export function VerificationBadge({
  verified,
  className,
}: {
  verified: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        verified
          ? "badge-purple"
          : "badge-neutral",
        className,
      )}
    >
      <ShieldCheck className={cn("h-3 w-3", !verified && "text-muted-foreground")} />
      {verified ? "Verified" : "Unverified"}
    </span>
  );
}
