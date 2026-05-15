type PhaseBadgeProps = {
  value: string | null | undefined;
  className?: string;
};

export function normalizePhaseName(value: string | null | undefined) {
  const raw = (value || "").trim();

  if (!raw) return "NA";

  const normalized = raw.toLowerCase();

  if (
    normalized === "pre feasibility" ||
    normalized === "pre-feasibility" ||
    normalized === "pre feasibility (current)"
  ) {
    return "Pre-Feasibility";
  }

  if (normalized === "tbd") return "TBD";

  if (
    normalized === "operating" ||
    normalized === "operational" ||
    normalized === "operating (current)" ||
    normalized.includes("operat")
  ) {
    return "Operating";
  }

  if (normalized.includes("decommission")) {
    return "Decommissioned";
  }

  if (normalized === "na" || normalized === "n/a") {
    return "NA";
  }

  return raw
    .split(/[\s_-]+/)
    .map((part) =>
      part.length ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : ""
    )
    .join(" ");
}

function getPhaseClasses(phase: string) {
  const normalized = phase.toLowerCase();

  if (normalized === "operating") {
    return "border-green-700 bg-green-700 text-white";
  }

  if (normalized === "construction") {
    return "border-green-600 bg-green-600 text-white";
  }

  if (normalized === "feasibility") {
    return "border-teal-500 bg-teal-500 text-white";
  }

  if (normalized === "pre-feasibility") {
    return "border-indigo-500 bg-indigo-500 text-white";
  }

  if (normalized === "exploration") {
    return "border-blue-500 bg-blue-500 text-white";
  }

  if (normalized === "prospect") {
    return "border-slate-300 bg-slate-200 text-slate-700";
  }

  if (normalized === "stalled") {
    return "border-stone-400 bg-stone-400 text-white";
  }

  if (normalized === "tbd") {
    return "border-slate-400 bg-slate-300 text-slate-800";
  }

  if (normalized === "cancelled" || normalized === "decommissioned") {
    return "border-rose-600 bg-rose-600 text-white";
  }

  if (normalized === "na") {
    return "border-slate-300 bg-slate-200 text-slate-700";
  }

  return "border-slate-300 bg-slate-200 text-slate-700";
}

export default function PhaseBadge({
  value,
  className = "",
}: PhaseBadgeProps) {
  const phase = normalizePhaseName(value);

  return (
    <span
      className={`inline-flex min-h-[28px] min-w-[72px] items-center justify-center whitespace-nowrap border px-3 py-1 text-[11px] font-semibold leading-none ${getPhaseClasses(
        phase
      )} ${className}`}
    >
      {phase}
    </span>
  );
}