import Link from "next/link";

export type SourceReviewFilterChip = {
  key: string;
  label: string;
  value: string;
  href: string;
};

export default function SourceReviewFilterChips({
  chips,
  resetHref,
  emptyLabel = "All review candidates",
}: {
  chips: SourceReviewFilterChip[];
  resetHref: string;
  emptyLabel?: string;
}) {
  return (
    <div className="border-t border-[var(--tge-governance-neutral-border)] pt-4">
      {chips.length > 0 ? (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <span className="inline-flex min-h-8 items-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] px-3 text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
              Active filters
            </span>
            {chips.map((chip) => (
              <Link
                className="inline-flex min-h-8 items-center justify-center border border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] px-3 text-xs font-semibold text-[var(--tge-governance-success-text)] hover:border-[var(--tge-brand-green)] sm:justify-start"
                href={chip.href}
                key={chip.key}
              >
                <span className="text-[var(--tge-governance-muted-text)]">
                  {chip.label}:
                </span>
                <span className="ml-1">{chip.value}</span>
                <span className="ml-2 text-[var(--tge-governance-muted-text)]">
                  x
                </span>
              </Link>
            ))}
          </div>
          <Link
            className="inline-flex h-8 w-full items-center justify-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 text-xs font-semibold text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)] lg:w-auto"
            href={resetHref}
          >
            Clear Filters
          </Link>
        </div>
      ) : (
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}
