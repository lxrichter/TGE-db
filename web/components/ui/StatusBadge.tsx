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
  neutral: "border-gray-200 bg-[#f7f7f7] text-gray-700",
  success: "border-[#b9d98b] bg-[#f1f8e8] text-[#3f6f19]",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-700",

  successSoft: "border-[#b9d98b] bg-[#f1f8e8] text-[#3f6f19]",
  warningSoft: "border-amber-200 bg-amber-50 text-amber-800",
  neutralSoft: "border-gray-200 bg-[#f7f7f7] text-gray-700",
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
