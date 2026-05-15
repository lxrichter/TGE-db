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
  neutral: "border-slate-300 bg-slate-200 text-slate-700",
  success: "border-green-600 bg-green-600 text-white",
  info: "border-blue-500 bg-blue-500 text-white",
  warning: "border-amber-500 bg-amber-500 text-white",
  danger: "border-rose-500 bg-rose-500 text-white",

  // softer workflow badges, but a bit darker / clearer than before
  successSoft: "border-green-300 bg-green-100 text-green-800",
  warningSoft: "border-rose-300 bg-rose-100 text-rose-800",
  neutralSoft: "border-slate-200 bg-slate-100 text-slate-600",
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