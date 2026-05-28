import Link from "next/link";
import type { ReactNode } from "react";
import { formatCount, formatMw } from "@/lib/format";
import {
  formatStatusLabel,
  type PostgresStatusTone,
} from "@/components/postgres-preview/PostgresStatusBadge";

type OverviewTone =
  | PostgresStatusTone
  | "pipeline"
  | "ecosystem"
  | "market";

export type OverviewMetric = {
  label: string;
  value: string;
  note: string;
  href?: string;
  tone?: OverviewTone;
};

export type OverviewBucket = {
  label: string;
  count: number;
  capacityMwe?: number;
  href?: string;
  tone?: OverviewTone;
};

function toneClass(tone: OverviewTone = "neutral") {
  switch (tone) {
    case "operating":
    case "success":
      return "border-l-[var(--tge-lifecycle-operating-border)] bg-[var(--tge-lifecycle-operating-bg)]";
    case "pipeline":
      return "border-l-[var(--tge-governance-info-border)] bg-[var(--tge-governance-info-bg)]";
    case "ecosystem":
      return "border-l-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)]";
    case "market":
      return "border-l-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)]";
    case "prospect":
      return "border-l-[var(--tge-lifecycle-prospect-border)] bg-[var(--tge-lifecycle-prospect-bg)]";
    case "exploration":
      return "border-l-[var(--tge-lifecycle-exploration-border)] bg-[var(--tge-lifecycle-exploration-bg)]";
    case "pre_feasibility":
      return "border-l-[var(--tge-lifecycle-pre-feasibility-border)] bg-[var(--tge-lifecycle-pre-feasibility-bg)]";
    case "feasibility":
      return "border-l-[var(--tge-lifecycle-feasibility-border)] bg-[var(--tge-lifecycle-feasibility-bg)]";
    case "construction":
      return "border-l-[var(--tge-lifecycle-construction-border)] bg-[var(--tge-lifecycle-construction-bg)]";
    case "danger":
    case "cancelled":
      return "border-l-[var(--tge-governance-danger-border)] bg-[var(--tge-governance-danger-bg)]";
    case "muted":
    case "retired":
      return "border-l-[var(--tge-governance-muted-border)] bg-[var(--tge-governance-muted-bg)]";
    case "attention":
    case "pilot":
      return "border-l-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)]";
    case "info":
      return "border-l-[var(--tge-governance-info-border)] bg-[var(--tge-governance-info-bg)]";
    case "neutral":
    default:
      return "border-l-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]";
  }
}

function overviewItemClass(tone?: OverviewTone) {
  return `border border-l-4 border-[var(--tge-governance-neutral-border)] ${toneClass(
    tone
  )} px-3 py-3 transition hover:border-[var(--tge-brand-green)] hover:bg-[var(--tge-governance-success-bg)]`;
}

function MaybeLink({
  href,
  className,
  children,
}: {
  href?: string;
  className: string;
  children: ReactNode;
}) {
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return <div className={className}>{children}</div>;
}

export function normalizeOverviewLabel(value: string) {
  return formatStatusLabel(value);
}

export function formatOverviewCount(value: number) {
  return formatCount(value);
}

export function formatOverviewMwe(value: number) {
  return `${formatMw(value)} MWe`;
}

export default function PostgresEntityOverview({
  label,
  title,
  description,
  metrics,
  bucketsTitle,
  buckets,
  bucketEntityLabel = "records",
  bucketValuePriority = "count",
  bucketLayout = "wrap",
}: {
  label: string;
  title: string;
  description: string;
  metrics: OverviewMetric[];
  bucketsTitle: string;
  buckets: OverviewBucket[];
  bucketEntityLabel?: string;
  bucketValuePriority?: "count" | "capacity";
  bucketLayout?: "wrap" | "single-line";
}) {
  const bucketContainerClass =
    bucketLayout === "single-line"
      ? "flex gap-2 overflow-x-auto pb-1"
      : "grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6";

  return (
    <section className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]">
      <div className="flex flex-col gap-2 border-b border-[var(--tge-governance-neutral-border)] px-4 py-3 sm:flex-row sm:items-end sm:justify-between sm:px-5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-brand-green-dark)]">
            {label}
          </div>
          <h2 className="mt-1 text-lg font-bold text-[var(--tge-text-primary)]">{title}</h2>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--tge-text-secondary)]">
            {description}
          </p>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-text-secondary)]">
          {bucketsTitle}
        </span>
      </div>

      <div className="grid gap-3 px-4 py-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MaybeLink
            key={metric.label}
            href={metric.href}
            className={overviewItemClass(metric.tone)}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--tge-text-secondary)]">
              {metric.label}
            </div>
            <div className="mt-2 text-2xl font-bold leading-none text-[var(--tge-text-primary)]">
              {metric.value}
            </div>
            <div className="mt-2 text-xs leading-5 text-[var(--tge-text-secondary)]">
              {metric.note}
            </div>
          </MaybeLink>
        ))}
      </div>

      <div className="border-t border-[var(--tge-governance-neutral-border)] px-4 py-3 sm:px-5">
        <div className={bucketContainerClass}>
          {buckets.map((bucket) => (
            <MaybeLink
              key={bucket.label}
              href={bucket.href}
              className={`${overviewItemClass(bucket.tone)} ${
                bucketLayout === "single-line"
                  ? "min-w-[145px] flex-1"
                  : ""
              }`}
            >
              <div className="line-clamp-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--tge-text-secondary)]">
                {bucket.label}
              </div>
              {bucketValuePriority === "capacity" &&
              bucket.capacityMwe !== undefined ? (
                <>
                  <div className="mt-2 text-2xl font-bold leading-none text-[var(--tge-text-primary)]">
                    {formatMw(bucket.capacityMwe)}
                    <span className="ml-1 text-sm font-semibold text-[var(--tge-text-secondary)]">
                      MWe
                    </span>
                  </div>
                  <div className="mt-2 text-xs leading-5 text-[var(--tge-text-secondary)]">
                    {formatCount(bucket.count)} {bucketEntityLabel}
                  </div>
                </>
              ) : (
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-xl font-bold leading-none text-[var(--tge-text-primary)]">
                    {formatCount(bucket.count)}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-text-secondary)]">
                    {bucketEntityLabel}
                  </span>
                </div>
              )}
              {bucketValuePriority === "count" &&
              bucket.capacityMwe !== undefined ? (
                <div className="mt-1 text-xs leading-5 text-[var(--tge-text-secondary)]">
                  {formatMw(bucket.capacityMwe)} MWe
                </div>
              ) : null}
            </MaybeLink>
          ))}
        </div>
      </div>
    </section>
  );
}
