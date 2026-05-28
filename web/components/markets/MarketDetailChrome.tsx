import PhaseBadge from "@/components/ui/PhaseBadge";

export const marketDetailClass = {
  backLink:
    "text-sm font-medium text-[var(--tge-brand-green-dark)] hover:underline",
  panel:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]",
  heroAccent: "border-l-4 border-l-[var(--tge-brand-green)] px-8 py-8",
  eyebrow:
    "text-sm font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]",
  heroTitle:
    "mt-3 text-5xl font-bold tracking-tight text-[var(--tge-text-primary)]",
  bodyText: "text-[var(--tge-text-secondary)]",
  summaryBar:
    "border-t border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-8 py-4",
  summaryItems:
    "flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--tge-governance-neutral-text)]",
  summaryLabel:
    "font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]",
  divider: "text-[var(--tge-governance-muted-border)]",
  statStrip:
    "border-t border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-muted-bg)] px-8 py-5",
  sectionHeader: "border-b border-[var(--tge-governance-neutral-border)] px-6 py-4",
  sectionHeaderMuted:
    "border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-6 py-4",
  sectionTitle: "text-xl font-bold text-[var(--tge-text-primary)]",
  helperText: "mt-1 text-sm text-[var(--tge-governance-muted-text)]",
  tableHead:
    "bg-[var(--tge-governance-neutral-bg)] text-left uppercase tracking-wide text-[var(--tge-governance-neutral-text)]",
  th:
    "border-b border-[var(--tge-governance-neutral-border)] px-4 py-2 text-[12px] font-semibold",
  row: "hover:bg-[var(--tge-surface-subtle)]",
  td:
    "border-b border-[var(--tge-governance-muted-border)] px-4 py-2 text-[13px]",
  linkStrong:
    "font-medium text-[var(--tge-text-primary)] underline decoration-[var(--tge-governance-muted-border)] underline-offset-4 hover:text-[var(--tge-brand-green-dark)]",
  link:
    "text-[var(--tge-text-primary)] underline decoration-[var(--tge-governance-muted-border)] underline-offset-4 hover:text-[var(--tge-brand-green-dark)]",
  emptyText: "text-sm text-[var(--tge-governance-muted-text)]",
  listRow:
    "border-b border-[var(--tge-governance-neutral-border)] pb-3 text-[13px]",
  listTitle: "font-semibold text-[var(--tge-text-primary)]",
  listMeta: "mt-1 text-[var(--tge-text-secondary)]",
  noteBody: "p-6 text-[13px] text-[var(--tge-text-secondary)]",
};

export function MarketStatBlock({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
        {title}
      </div>
      <div className="mt-1 text-3xl font-bold text-[var(--tge-text-primary)]">
        {value}
      </div>
      {subtitle ? (
        <div className="mt-1 text-xs text-[var(--tge-governance-muted-text)]">
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

export function MarketPhaseOverviewCard({
  phase,
  count,
  mw,
  mwLabel,
}: {
  phase: string;
  count: number;
  mw: number;
  mwLabel: string;
}) {
  return (
    <div className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] p-4">
      <div>
        <PhaseBadge value={phase} />
      </div>

      <div className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
        Projects
      </div>
      <div className="mt-1 text-[22px] font-bold leading-none text-[var(--tge-text-primary)]">
        {Number(count || 0).toLocaleString()}
      </div>

      <div className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
        {mwLabel}
      </div>
      <div className="mt-1 text-[18px] font-bold leading-none text-[var(--tge-text-primary)]">
        {Number(mw || 0).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>
    </div>
  );
}
