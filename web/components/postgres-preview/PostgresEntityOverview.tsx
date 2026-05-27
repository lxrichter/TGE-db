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
      return "border-l-[#3f8f2f] bg-[#fbfdf8]";
    case "pipeline":
      return "border-l-[#2f6f9f] bg-[#f8fbfd]";
    case "ecosystem":
      return "border-l-[#5b6b7f] bg-[#fafafa]";
    case "market":
      return "border-l-[#b58900] bg-[#fffdf5]";
    case "prospect":
      return "border-l-slate-300 bg-slate-50";
    case "exploration":
      return "border-l-blue-300 bg-blue-50";
    case "pre_feasibility":
      return "border-l-violet-300 bg-violet-50";
    case "feasibility":
      return "border-l-teal-300 bg-teal-50";
    case "construction":
      return "border-l-[#4f7f1f] bg-[#fbfdf8]";
    case "danger":
    case "cancelled":
      return "border-l-red-300 bg-red-50";
    case "muted":
    case "retired":
      return "border-l-gray-300 bg-gray-50";
    case "attention":
    case "pilot":
      return "border-l-amber-300 bg-amber-50";
    case "info":
      return "border-l-blue-300 bg-blue-50";
    case "neutral":
    default:
      return "border-l-gray-200 bg-white";
  }
}

function overviewItemClass(tone?: OverviewTone) {
  return `border border-l-4 border-gray-200 ${toneClass(
    tone
  )} px-3 py-3 transition hover:border-[#8dc63f] hover:bg-[#fbfdf8]`;
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
    <section className="border border-gray-200 bg-white">
      <div className="flex flex-col gap-2 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-end sm:justify-between sm:px-5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#4f7f1f]">
            {label}
          </div>
          <h2 className="mt-1 text-lg font-bold text-[#1f2937]">{title}</h2>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-gray-600">
            {description}
          </p>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
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
            <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              {metric.label}
            </div>
            <div className="mt-2 text-2xl font-bold leading-none text-[#1f2937]">
              {metric.value}
            </div>
            <div className="mt-2 text-xs leading-5 text-gray-500">
              {metric.note}
            </div>
          </MaybeLink>
        ))}
      </div>

      <div className="border-t border-gray-100 px-4 py-3 sm:px-5">
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
              <div className="line-clamp-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                {bucket.label}
              </div>
              {bucketValuePriority === "capacity" &&
              bucket.capacityMwe !== undefined ? (
                <>
                  <div className="mt-2 text-2xl font-bold leading-none text-[#1f2937]">
                    {formatMw(bucket.capacityMwe)}
                    <span className="ml-1 text-sm font-semibold text-gray-500">
                      MWe
                    </span>
                  </div>
                  <div className="mt-2 text-xs leading-5 text-gray-600">
                    {formatCount(bucket.count)} {bucketEntityLabel}
                  </div>
                </>
              ) : (
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-xl font-bold leading-none text-[#1f2937]">
                    {formatCount(bucket.count)}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    {bucketEntityLabel}
                  </span>
                </div>
              )}
              {bucketValuePriority === "count" &&
              bucket.capacityMwe !== undefined ? (
                <div className="mt-1 text-xs leading-5 text-gray-600">
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
