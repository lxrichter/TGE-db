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
    return "border-[var(--tge-chart-lifecycle-operating)] bg-[var(--tge-chart-lifecycle-operating)] text-[var(--tge-surface-card)]";
  }

  if (normalized === "construction") {
    return "border-[var(--tge-chart-lifecycle-construction)] bg-[var(--tge-chart-lifecycle-construction)] text-[var(--tge-surface-card)]";
  }

  if (normalized === "feasibility") {
    return "border-[var(--tge-chart-lifecycle-feasibility)] bg-[var(--tge-chart-lifecycle-feasibility)] text-[var(--tge-surface-card)]";
  }

  if (normalized === "pre-feasibility") {
    return "border-[var(--tge-chart-lifecycle-pre-feasibility)] bg-[var(--tge-chart-lifecycle-pre-feasibility)] text-[var(--tge-text-primary)]";
  }

  if (normalized === "exploration") {
    return "border-[var(--tge-chart-lifecycle-exploration)] bg-[var(--tge-chart-lifecycle-exploration)] text-[var(--tge-text-primary)]";
  }

  if (normalized === "prospect") {
    return "border-[var(--tge-chart-lifecycle-prospect)] bg-[var(--tge-chart-lifecycle-prospect)] text-[var(--tge-text-primary)]";
  }

  if (normalized === "stalled") {
    return "border-[var(--tge-governance-muted-border)] bg-[var(--tge-governance-muted-bg)] text-[var(--tge-governance-muted-text)]";
  }

  if (normalized === "tbd") {
    return "border-[var(--tge-chart-lifecycle-prospect)] bg-[var(--tge-chart-lifecycle-prospect)] text-[var(--tge-text-primary)]";
  }

  if (
    normalized === "cancelled" ||
    normalized === "suspended" ||
    normalized === "decommissioned"
  ) {
    return "border-[var(--tge-chart-lifecycle-cancelled)] bg-[var(--tge-chart-lifecycle-cancelled)] text-[var(--tge-surface-card)]";
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
