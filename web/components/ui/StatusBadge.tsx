import { ReactNode } from "react";

export type StatusBadgeTone =
  | "neutral"
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "successSoft"
  | "warningSoft"
  | "neutralSoft";

const toneClasses: Record<StatusBadgeTone, string> = {
  neutral:
    "border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] text-[var(--tge-governance-neutral-text)]",
  success:
    "border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] text-[var(--tge-governance-success-text)]",
  info:
    "border-[var(--tge-governance-info-border)] bg-[var(--tge-governance-info-bg)] text-[var(--tge-governance-info-text)]",
  warning:
    "border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] text-[var(--tge-governance-attention-text)]",
  danger:
    "border-[var(--tge-governance-danger-border)] bg-[var(--tge-governance-danger-bg)] text-[var(--tge-governance-danger-text)]",

  successSoft:
    "border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] text-[var(--tge-governance-success-text)]",
  warningSoft:
    "border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] text-[var(--tge-governance-attention-text)]",
  neutralSoft:
    "border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] text-[var(--tge-governance-neutral-text)]",
};

type StatusBadgeProps = {
  children: ReactNode;
  tone: StatusBadgeTone;
  className?: string;
};

export default function StatusBadge({
  children,
  tone,
  className = "",
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex min-h-[28px] items-center justify-center whitespace-nowrap border px-3 py-1 text-[11px] font-semibold leading-none ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
