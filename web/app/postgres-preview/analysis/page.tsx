import Link from "next/link";
import type { ReactNode } from "react";
import {
  getPostgresPreviewAnalysisSummary,
  type PostgresPreviewAnalysisBucket,
  type PostgresPreviewAnalysisSummary,
  type PostgresPreviewGeographyFilters,
} from "@/lib/postgres-preview";
import { formatCount, formatMw } from "@/lib/format";
import { DetailPriorityMarker } from "@/components/postgres-preview/PostgresEntityDetail";
import {
  formatPreviewFilterLabel,
  PostgresPreviewSetupNotice,
} from "@/components/postgres-preview/PostgresPreviewListTables";
import PostgresSectionJumpNav from "@/components/postgres-preview/PostgresSectionJumpNav";
import NextActionStrip from "@/components/ui/NextActionStrip";
import {
  postgresStatusBarClass,
  postgresStatusTone,
} from "@/components/postgres-preview/PostgresStatusBadge";

export const dynamic = "force-dynamic";

type AnalysisData =
  | {
      ok: true;
      summary: PostgresPreviewAnalysisSummary;
    }
  | {
      ok: false;
      error: string;
    };

type AnalysisSearchParams = {
  country?: string;
  tge_region?: string;
  wb_region?: string;
};

function cleanParam(value: string | undefined) {
  return value?.trim() || undefined;
}

function getAnalysisFilters(
  params: AnalysisSearchParams
): PostgresPreviewGeographyFilters {
  return {
    country: cleanParam(params.country),
    tgeRegion: cleanParam(params.tge_region),
    wbRegion: cleanParam(params.wb_region),
  };
}

function geographyQuery(filters: PostgresPreviewGeographyFilters) {
  const params = new URLSearchParams();

  if (filters.country) params.set("country", filters.country);
  if (filters.tgeRegion) params.set("tge_region", filters.tgeRegion);
  if (filters.wbRegion) params.set("wb_region", filters.wbRegion);

  return params;
}

function geographyHref(path: string, filters: PostgresPreviewGeographyFilters) {
  const query = geographyQuery(filters).toString();

  return `${path}${query ? `?${query}` : ""}`;
}

function geographyLabel(filters: PostgresPreviewGeographyFilters) {
  if (filters.country) return `Market: ${filters.country}`;
  if (filters.tgeRegion) return `TGE region: ${filters.tgeRegion}`;
  if (filters.wbRegion) return `World Bank region: ${filters.wbRegion}`;

  return null;
}

async function getAnalysisData(
  filters: PostgresPreviewGeographyFilters
): Promise<AnalysisData> {
  try {
    const summary = await getPostgresPreviewAnalysisSummary(filters);

    return {
      ok: true,
      summary,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

const analysisClass = {
  panel:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]",
  hero:
    "border-l-4 border-l-[var(--tge-brand-green)] px-8 py-8",
  title: "text-[var(--tge-text-primary)]",
  body: "text-[var(--tge-text-secondary)]",
  muted: "text-[var(--tge-governance-muted-text)]",
  neutral: "text-[var(--tge-governance-neutral-text)]",
  kicker:
    "text-sm font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]",
  label:
    "text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]",
  smallLabel:
    "text-[10px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]",
  statTile:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-4 py-4",
  metaBadge:
    "inline-flex min-h-6 items-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] px-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]",
  details:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]",
  neutralBadge:
    "inline-flex min-h-8 items-center justify-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] px-3 text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-neutral-text)]",
  neutralBadgeSolid:
    "inline-flex min-h-8 items-center justify-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-neutral-text)]",
  dividerMobile:
    "divide-y divide-[var(--tge-governance-muted-border)] border-t border-[var(--tge-governance-neutral-border)] md:hidden",
  desktopTable:
    "hidden overflow-x-auto border-t border-[var(--tge-governance-neutral-border)] md:block",
  tableHead:
    "bg-[var(--tge-governance-neutral-bg)] text-[11px] tracking-wide text-[var(--tge-governance-muted-text)]",
  tableHeadUpper:
    "bg-[var(--tge-governance-neutral-bg)] text-[11px] uppercase tracking-wide text-[var(--tge-governance-muted-text)]",
  tableDivider: "divide-y divide-[var(--tge-governance-muted-border)]",
  tableCell: "px-5 py-4 text-[var(--tge-governance-neutral-text)]",
  tableStrong:
    "px-5 py-4 font-semibold text-[var(--tge-text-primary)]",
  track:
    "h-1.5 overflow-hidden bg-[var(--tge-governance-neutral-bg)]",
  defaultBar: "bg-[var(--tge-brand-green)]",
  activeContext:
    "mt-4 inline-flex min-h-8 items-center border border-[var(--tge-brand-green)] bg-[var(--tge-governance-success-bg)] px-3 text-xs font-semibold uppercase tracking-wide text-[var(--tge-brand-green-dark)]",
  filteredPanel:
    "border border-[var(--tge-brand-green)] bg-[var(--tge-governance-success-bg)] px-5 py-4",
  filteredKicker:
    "text-xs font-semibold uppercase tracking-wide text-[var(--tge-brand-green-dark)]",
  action:
    "inline-flex h-10 items-center justify-center border border-[var(--tge-border-strong)] bg-[var(--tge-surface-card)] px-4 text-sm font-semibold text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)]",
  smallAction:
    "inline-flex min-h-9 items-center justify-center border border-[var(--tge-border-strong)] bg-[var(--tge-surface-card)] px-3 text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)]",
  inlineLink:
    "text-xs font-semibold text-[var(--tge-brand-green-dark)] hover:underline",
};

function StatTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className={analysisClass.statTile}>
      <div className={analysisClass.label}>
        {label}
      </div>
      <div className={`mt-2 text-2xl font-bold leading-none ${analysisClass.title}`}>
        {value}
      </div>
      <div className={`mt-2 text-xs leading-5 ${analysisClass.muted}`}>{note}</div>
    </div>
  );
}

function MobileAnalysisField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className={analysisClass.smallLabel}>
        {label}
      </div>
      <div className={`mt-1 min-w-0 text-sm ${analysisClass.neutral}`}>{children}</div>
    </div>
  );
}

function AnalysisCountryMeta({
  iso3,
  tgeRegion,
  wbRegion,
}: {
  iso3?: string | null;
  tgeRegion?: string | null;
  wbRegion?: string | null;
}) {
  const values = [iso3, tgeRegion, wbRegion].filter(
    (value): value is string => Boolean(value)
  );

  if (values.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {values.map((value) => (
        <span
          key={value}
          className={analysisClass.metaBadge}
        >
          {value}
        </span>
      ))}
    </div>
  );
}

const projectStagePlantStatusCodes = new Set([
  "prospect_tbd",
  "prospect",
  "exploration",
  "pre_feasibility",
  "feasibility",
  "construction",
  "under_construction",
]);

function plantStatusBarClass(bucketCode: string) {
  if (projectStagePlantStatusCodes.has(bucketCode)) {
    return postgresStatusBarClass("attention");
  }

  return postgresStatusBarClass(postgresStatusTone(bucketCode, "lifecycle"));
}

function BucketTable({
  title,
  description,
  buckets,
  defaultOpen = true,
  useLifecycleColors = false,
  segmentHeader = "Segment",
  countHeader = "Items",
  countSummaryLabel = "items",
  formatBucketLabel = (bucket) => formatPreviewFilterLabel(bucket.bucket_code),
  getBucketBarClass,
}: {
  title: string;
  description: string;
  buckets: PostgresPreviewAnalysisBucket[];
  defaultOpen?: boolean;
  useLifecycleColors?: boolean;
  segmentHeader?: string;
  countHeader?: string;
  countSummaryLabel?: string;
  formatBucketLabel?: (bucket: PostgresPreviewAnalysisBucket) => string;
  getBucketBarClass?: (bucket: PostgresPreviewAnalysisBucket) => string;
}) {
  const maxElectric = Math.max(
    1,
    ...buckets.map((bucket) => bucket.electric_capacity_mwe)
  );
  const recordCount = buckets.reduce((sum, bucket) => sum + bucket.record_count, 0);
  const electricCapacity = buckets.reduce(
    (sum, bucket) => sum + bucket.electric_capacity_mwe,
    0
  );

  return (
    <details className={analysisClass.details} open={defaultOpen}>
      <summary className="flex cursor-pointer list-none flex-col gap-3 px-5 py-4 marker:hidden md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className={`text-lg font-bold ${analysisClass.title}`}>
            {title}
          </h2>
          <p className={`mt-1 text-sm leading-6 ${analysisClass.body}`}>
            {description}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap md:justify-end">
          <span className={analysisClass.neutralBadge}>
            {formatCount(recordCount)} {countSummaryLabel}
          </span>
          <span className={analysisClass.neutralBadgeSolid}>
            {formatMw(electricCapacity)} MWe
          </span>
          <span className={analysisClass.neutralBadgeSolid}>
            {defaultOpen ? "Open" : "Expand"}
          </span>
        </div>
      </summary>
      <div className={analysisClass.dividerMobile}>
        {buckets.map((bucket) => {
          const share = Math.round(
            (bucket.electric_capacity_mwe / maxElectric) * 100
          );
          const barClass =
            getBucketBarClass?.(bucket) ||
            (useLifecycleColors
              ? postgresStatusBarClass(
                  postgresStatusTone(bucket.bucket_code, "lifecycle")
                )
              : analysisClass.defaultBar);

          return (
            <article key={bucket.bucket_code} className="px-4 py-4">
              <div className={`font-semibold ${analysisClass.title}`}>
                {formatBucketLabel(bucket)}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <MobileAnalysisField label={countHeader}>
                  {formatCount(bucket.record_count)}
                </MobileAnalysisField>
                <MobileAnalysisField label="Electric">
                  {formatMw(bucket.electric_capacity_mwe)} MWe
                </MobileAnalysisField>
                <MobileAnalysisField label="Thermal">
                  {formatMw(bucket.thermal_capacity_mwth)} MWth
                </MobileAnalysisField>
                <MobileAnalysisField label="Relative Share">
                  <div className={analysisClass.track}>
                    <div
                      className={`h-full ${barClass}`}
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </MobileAnalysisField>
              </div>
            </article>
          );
        })}
      </div>
      <div className={analysisClass.desktopTable}>
        <table className="min-w-[820px] table-fixed text-left text-sm">
          <thead className={analysisClass.tableHead}>
            <tr>
              <th className="w-[26%] px-5 py-3 font-semibold">
                {segmentHeader}
              </th>
              <th className="w-[13%] px-5 py-3 font-semibold">
                {countHeader}
              </th>
              <th className="w-[16%] px-5 py-3 font-semibold">MWe</th>
              <th className="w-[11%] px-5 py-3 font-semibold">MWth</th>
              <th className="w-[34%] px-5 py-3 font-semibold">Share</th>
            </tr>
          </thead>
          <tbody className={analysisClass.tableDivider}>
            {buckets.map((bucket) => {
              const share = Math.round(
                (bucket.electric_capacity_mwe / maxElectric) * 100
              );
              const barClass =
                getBucketBarClass?.(bucket) ||
                (useLifecycleColors
                  ? postgresStatusBarClass(
                      postgresStatusTone(bucket.bucket_code, "lifecycle")
                    )
                  : analysisClass.defaultBar);

              return (
                <tr key={bucket.bucket_code}>
                  <td className={analysisClass.tableStrong}>
                    {formatBucketLabel(bucket)}
                  </td>
                  <td className={analysisClass.tableCell}>
                    {formatCount(bucket.record_count)}
                  </td>
                  <td className={analysisClass.tableCell}>
                    {formatMw(bucket.electric_capacity_mwe)} MWe
                  </td>
                  <td className={analysisClass.tableCell}>
                    {formatMw(bucket.thermal_capacity_mwth)} MWth
                  </td>
                  <td className="px-5 py-4">
                    <div className={analysisClass.track}>
                      <div
                        className={`h-full ${barClass}`}
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export default async function PostgresAnalysisPreviewPage({
  searchParams,
}: {
  searchParams?: Promise<AnalysisSearchParams>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const filters = getAnalysisFilters(resolvedSearchParams);
  const activeGeographyLabel = geographyLabel(filters);
  const data = await getAnalysisData(filters);
  const summary = data.ok ? data.summary : null;
  const totals = summary
    ? {
        topCountryOperating: summary.topCountries.reduce(
          (sum, country) => sum + country.operating_installed_mwe,
          0
        ),
        topCountryPipeline: summary.topCountries.reduce(
          (sum, country) => sum + country.project_pipeline_mwe,
          0
        ),
        projectRecords: summary.projectLifecycle.reduce(
          (sum, bucket) => sum + bucket.record_count,
          0
        ),
        assetRecords: summary.operatingAssetStatus.reduce(
          (sum, bucket) => sum + bucket.record_count,
          0
        ),
      }
    : null;

  return (
    <main className="space-y-8">
      <section className={analysisClass.panel}>
        <div className={analysisClass.hero}>
          <p className={analysisClass.kicker}>
            Intelligence Preview
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className={`text-4xl font-bold tracking-tight ${analysisClass.title}`}>
                Analysis
              </h1>
              <p className={`mt-4 max-w-4xl text-base leading-7 ${analysisClass.body}`}>
                First PostgreSQL-backed analytical overview for replacement
                readiness: market capacity, lifecycle, operating status, and
                use-type distribution.
              </p>
              {activeGeographyLabel ? (
                <div className={analysisClass.activeContext}>
                  Active analysis view: {activeGeographyLabel}
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className={analysisClass.action}
                href="/postgres-preview"
              >
                Back to Command Center
              </Link>
              <Link
                className={analysisClass.action}
                href={geographyHref("/postgres-preview/markets", filters)}
              >
                Markets
              </Link>
            </div>
          </div>
        </div>
      </section>

      <NextActionStrip
        title="Primary Work Paths"
        description="Use these routes for the three main analysis workflows: markets, entity worklists, and spatial patterns."
        actions={[
          {
            label: "Markets",
            title: "Open Markets",
            description: "Move from benchmark signals into regional and market intelligence.",
            href: `${geographyHref("/postgres-preview/markets", filters)}#region-drilldown`,
          },
          {
            label: "Worklists",
            title: "Open project pipeline",
            description: "Inspect the underlying projects and plants behind lifecycle and capacity signals.",
            href: geographyHref("/postgres-preview/projects", filters),
          },
          {
            label: "Map",
            title: "Open Map",
            description: "View coordinate-confirmed project and plant groups spatially.",
            href: geographyHref("/postgres-preview/map", filters),
          },
        ]}
      />

      {!data.ok || !summary || !totals ? (
        <PostgresPreviewSetupNotice error={data.ok ? "No data" : data.error} />
      ) : (
        <>
          <PostgresSectionJumpNav
            items={[
              {
                href: "#analysis-snapshot",
                label: "Snapshot",
                note: "KPIs",
              },
              {
                href: "#benchmark-views",
                label: "Benchmarks",
                note: "Buckets",
              },
              {
                href: "#market-drilldown",
                label: "Markets",
                note: "Drilldown",
              },
            ]}
          />

          {activeGeographyLabel ? (
            <section className={analysisClass.filteredPanel}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className={analysisClass.filteredKicker}>
                    Filtered Analysis Context
                  </div>
                  <p className={`mt-1 text-sm leading-6 ${analysisClass.neutral}`}>
                    {activeGeographyLabel} is applied to benchmark buckets,
                    market rows, and downstream worklist routes.
                  </p>
                </div>
                <Link
                  className={analysisClass.smallAction}
                  href="/postgres-preview/analysis"
                >
                  Clear Filter
                </Link>
              </div>
            </section>
          ) : null}

          <section id="analysis-snapshot" className="space-y-4 scroll-mt-24">
            <DetailPriorityMarker
              label="Core"
              title="Analysis Snapshot"
              description="Project and plant counts with capacity signals."
              tone="core"
            />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile
                label="Projects"
                note="Current project pipeline"
                value={formatCount(totals.projectRecords)}
              />
              <StatTile
                label="Plants"
                note="Current plant layer"
                value={formatCount(totals.assetRecords)}
              />
              <StatTile
                label="Top-10 Operating"
                note="Installed MWe across top markets in this preview"
                value={`${formatMw(totals.topCountryOperating)} MWe`}
              />
              <StatTile
                label="Top-10 Pipeline"
                note="Pipeline MWe across top markets in this preview"
                value={`${formatMw(totals.topCountryPipeline)} MWe`}
              />
            </div>
          </section>

          <section id="benchmark-views" className="space-y-5 scroll-mt-24">
            <DetailPriorityMarker
              label="Workflow"
              title="Benchmark Views"
              description="Lifecycle, status, use type, market comparison."
              tone="workflow"
            />

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <BucketTable
                buckets={summary.projectLifecycle}
                countHeader="No. of Projects"
                countSummaryLabel="projects"
                description="Projects grouped by lifecycle phase, including electric and thermal capacity signals where available."
                segmentHeader="Phase"
                title="Project Lifecycle"
                useLifecycleColors
              />
              <BucketTable
                buckets={summary.operatingAssetStatus}
                countHeader="No. of Plants"
                countSummaryLabel="plants"
                description="Plants grouped through an operating-status lens. Project-stage values are flagged as plant-status normalization work."
                getBucketBarClass={(bucket) =>
                  plantStatusBarClass(bucket.bucket_code)
                }
                segmentHeader="Phase"
                title="Plant Operating Status"
              />
            </div>

            <BucketTable
              buckets={summary.useTypeBreakdown}
              countHeader="Items"
              defaultOpen={false}
              description="Combined project and plant distribution by geothermal use type."
              segmentHeader="Use Type"
              title="Use-Type Distribution"
            />
          </section>

          <section id="market-drilldown" className="space-y-4 scroll-mt-24">
            <DetailPriorityMarker
              label="Governance"
              title="Market Drilldown"
              description="Connect analysis back to filtered worklists."
              tone="governance"
            />

            <details className={analysisClass.details}>
              <summary className="flex cursor-pointer list-none flex-col gap-3 px-5 py-4 marker:hidden md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className={`text-lg font-bold ${analysisClass.title}`}>
                    Top Markets
                  </h2>
                  <p className={`mt-1 text-sm leading-6 ${analysisClass.body}`}>
                    Highest combined operating plus pipeline MWe from the
                    PostgreSQL market aggregation.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap md:justify-end">
                  <span className={analysisClass.neutralBadge}>
                    {formatCount(summary.topCountries.length)} markets
                  </span>
                  <span className={analysisClass.neutralBadgeSolid}>
                    Expand
                  </span>
                </div>
              </summary>
              <div className={`border-t border-[var(--tge-governance-neutral-border)]`}>
                <div className={`${analysisClass.tableDivider} md:hidden`}>
                  {summary.topCountries.map((country) => (
                    <article key={country.country} className="px-4 py-4">
                      <div className={`font-semibold ${analysisClass.title}`}>
                        {country.country}
                      </div>
                      <AnalysisCountryMeta
                        iso3={country.iso3}
                        tgeRegion={country.tge_region}
                        wbRegion={country.wb_region}
                      />
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <MobileAnalysisField label="Operating">
                          {formatMw(country.operating_installed_mwe)} MWe
                        </MobileAnalysisField>
                        <MobileAnalysisField label="Pipeline">
                          {formatMw(country.project_pipeline_mwe)} MWe
                        </MobileAnalysisField>
                        <MobileAnalysisField label="Linked Work">
                          {formatCount(
                            country.project_count +
                              country.operating_asset_count +
                              country.company_count
                          )}
                        </MobileAnalysisField>
                        <MobileAnalysisField label="Open">
                          <Link
                            className={analysisClass.inlineLink}
                            href={`/postgres-preview/projects?country=${encodeURIComponent(
                              country.country
                            )}`}
                          >
                            Project worklist
                          </Link>
                          <Link
                            className={analysisClass.inlineLink}
                            href={`/postgres-preview/map?country=${encodeURIComponent(
                              country.country
                            )}`}
                          >
                            Map
                          </Link>
                        </MobileAnalysisField>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-[820px] table-fixed text-left text-sm">
                    <thead className={analysisClass.tableHeadUpper}>
                      <tr>
                        <th className="w-[28%] px-5 py-3 font-semibold">
                          Market
                        </th>
                        <th className="w-[18%] px-5 py-3 font-semibold">
                          Operating
                        </th>
                        <th className="w-[18%] px-5 py-3 font-semibold">
                          Pipeline
                        </th>
                        <th className="w-[18%] px-5 py-3 font-semibold">
                          Linked Work
                        </th>
                        <th className="w-[18%] px-5 py-3 font-semibold">
                          Open
                        </th>
                      </tr>
                    </thead>
                    <tbody className={analysisClass.tableDivider}>
                      {summary.topCountries.map((country) => (
                        <tr key={country.country}>
                          <td className={analysisClass.tableStrong}>
                            <div>{country.country}</div>
                            <AnalysisCountryMeta
                              iso3={country.iso3}
                              tgeRegion={country.tge_region}
                              wbRegion={country.wb_region}
                            />
                          </td>
                          <td className={analysisClass.tableCell}>
                            {formatMw(country.operating_installed_mwe)} MWe
                          </td>
                          <td className={analysisClass.tableCell}>
                            {formatMw(country.project_pipeline_mwe)} MWe
                          </td>
                          <td className={analysisClass.tableCell}>
                            {formatCount(
                              country.project_count +
                                country.operating_asset_count +
                                country.company_count
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <Link
                              className={analysisClass.inlineLink}
                              href={`/postgres-preview/projects?country=${encodeURIComponent(
                                country.country
                              )}`}
                            >
                              Project worklist
                            </Link>
                            <Link
                              className={`${analysisClass.inlineLink} mt-2 block`}
                              href={`/postgres-preview/map?country=${encodeURIComponent(
                                country.country
                              )}`}
                            >
                              Map
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </details>
          </section>
        </>
      )}
    </main>
  );
}
