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

  if (
    normalized === "prospect tbd" ||
    normalized === "prospect / tbd" ||
    normalized === "prospect_tbd"
  ) {
    return "Prospect";
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
    return "border-[var(--tge-lifecycle-operating-border)] bg-[var(--tge-status-bar-operating)] text-[var(--tge-surface-card)]";
  }

  if (normalized === "construction") {
    return "border-[var(--tge-lifecycle-construction-border)] bg-[var(--tge-status-bar-success)] text-[var(--tge-surface-card)]";
  }

  if (normalized === "feasibility") {
    return "border-[var(--tge-lifecycle-feasibility-border)] bg-[var(--tge-status-bar-feasibility)] text-[var(--tge-surface-card)]";
  }

  if (normalized === "pre-feasibility") {
    return "border-[var(--tge-lifecycle-pre-feasibility-border)] bg-[var(--tge-status-bar-pre-feasibility)] text-[var(--tge-surface-card)]";
  }

  if (normalized === "exploration") {
    return "border-[var(--tge-lifecycle-exploration-border)] bg-[var(--tge-status-bar-info)] text-[var(--tge-surface-card)]";
  }

  if (normalized === "prospect") {
    return "border-[var(--tge-lifecycle-prospect-border)] bg-[var(--tge-lifecycle-prospect-bg)] text-[var(--tge-lifecycle-prospect-text)]";
  }

  if (normalized === "stalled") {
    return "border-[var(--tge-governance-muted-border)] bg-[var(--tge-governance-muted-bg)] text-[var(--tge-governance-muted-text)]";
  }

  if (normalized === "tbd") {
    return "border-[var(--tge-lifecycle-prospect-border)] bg-[var(--tge-lifecycle-prospect-bg)] text-[var(--tge-lifecycle-prospect-text)]";
  }

  if (
    normalized === "cancelled" ||
    normalized === "suspended" ||
    normalized === "decommissioned"
  ) {
    return "border-[var(--tge-lifecycle-cancelled-border)] bg-[var(--tge-status-bar-danger)] text-[var(--tge-surface-card)]";
  }

  if (normalized === "na") {
    return "border-[var(--tge-governance-muted-border)] bg-[var(--tge-governance-muted-bg)] text-[var(--tge-governance-muted-text)]";
  }

  return "border-[var(--tge-governance-muted-border)] bg-[var(--tge-governance-muted-bg)] text-[var(--tge-governance-muted-text)]";
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
