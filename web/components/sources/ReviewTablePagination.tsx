import { formatCount } from "@/lib/format";

export default function ReviewTablePagination({
  noun,
  page,
  pageCount,
  pageStart,
  pageEnd,
  total,
  onPageChange,
}: {
  noun: string;
  page: number;
  pageCount: number;
  pageStart: number;
  pageEnd: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) {
    return (
      <div className="border-b border-[var(--tge-governance-muted-border)] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
        Showing {formatCount(total)} {noun}
        {total === 1 ? "" : "s"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 border-b border-[var(--tge-governance-muted-border)] px-5 py-3 text-sm text-[var(--tge-text-secondary)] md:flex-row md:items-center md:justify-between">
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
        Showing {formatCount(pageStart)}-{formatCount(pageEnd)} of{" "}
        {formatCount(total)} {noun}
        {total === 1 ? "" : "s"}
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <button
          className="h-8 flex-1 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 text-xs font-semibold text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
          disabled={page <= 1}
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Previous
        </button>
        <span className="inline-flex h-8 items-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] px-3 text-xs font-semibold text-[var(--tge-governance-neutral-text)]">
          Page {formatCount(page)} / {formatCount(pageCount)}
        </span>
        <button
          className="h-8 flex-1 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 text-xs font-semibold text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
          disabled={page >= pageCount}
          type="button"
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}
