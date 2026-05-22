import Link from "next/link";
import type { ReactNode } from "react";
import {
  getPostgresPreviewAnalysisSummary,
  type PostgresPreviewAnalysisBucket,
  type PostgresPreviewAnalysisSummary,
} from "@/lib/postgres-preview";
import { formatCount, formatMw } from "@/lib/format";
import { DetailPriorityMarker } from "@/components/postgres-preview/PostgresEntityDetail";
import {
  formatPreviewFilterLabel,
  PostgresPreviewSetupNotice,
} from "@/components/postgres-preview/PostgresPreviewListTables";
import PostgresSectionJumpNav from "@/components/postgres-preview/PostgresSectionJumpNav";
import NextActionStrip from "@/components/ui/NextActionStrip";

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

async function getAnalysisData(): Promise<AnalysisData> {
  try {
    const summary = await getPostgresPreviewAnalysisSummary();

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
    <div className="border border-gray-200 bg-white px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold leading-none text-[#1f2937]">
        {value}
      </div>
      <div className="mt-2 text-xs leading-5 text-gray-500">{note}</div>
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
      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-1 min-w-0 text-sm text-gray-700">{children}</div>
    </div>
  );
}

function BucketTable({
  title,
  description,
  buckets,
  defaultOpen = true,
}: {
  title: string;
  description: string;
  buckets: PostgresPreviewAnalysisBucket[];
  defaultOpen?: boolean;
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
    <details className="border border-gray-200 bg-white" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none flex-col gap-3 px-5 py-4 marker:hidden md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1f2937]">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">{description}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap md:justify-end">
          <span className="inline-flex min-h-8 items-center justify-center border border-gray-200 bg-[#f7f7f7] px-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
            {formatCount(recordCount)} records
          </span>
          <span className="inline-flex min-h-8 items-center justify-center border border-gray-200 bg-white px-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
            {formatMw(electricCapacity)} MWe
          </span>
          <span className="inline-flex min-h-8 items-center justify-center border border-gray-200 bg-white px-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
            {defaultOpen ? "Open" : "Expand"}
          </span>
        </div>
      </summary>
      <div className="divide-y divide-gray-100 border-t border-gray-200 md:hidden">
        {buckets.map((bucket) => {
          const share = Math.round(
            (bucket.electric_capacity_mwe / maxElectric) * 100
          );

          return (
            <article key={bucket.bucket_code} className="px-4 py-4">
              <div className="font-semibold text-[#1f2937]">
                {formatPreviewFilterLabel(bucket.bucket_code)}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <MobileAnalysisField label="Records">
                  {formatCount(bucket.record_count)}
                </MobileAnalysisField>
                <MobileAnalysisField label="Electric">
                  {formatMw(bucket.electric_capacity_mwe)} MWe
                </MobileAnalysisField>
                <MobileAnalysisField label="Thermal">
                  {formatMw(bucket.thermal_capacity_mwth)} MWth
                </MobileAnalysisField>
                <MobileAnalysisField label="Relative Share">
                  <div className="h-1.5 overflow-hidden bg-gray-100">
                    <div
                      className="h-full bg-[#8dc63f]"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </MobileAnalysisField>
              </div>
            </article>
          );
        })}
      </div>
      <div className="hidden overflow-x-auto border-t border-gray-200 md:block">
        <table className="min-w-[820px] table-fixed text-left text-sm">
          <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-[34%] px-5 py-3 font-semibold">Segment</th>
              <th className="w-[14%] px-5 py-3 font-semibold">Records</th>
              <th className="w-[18%] px-5 py-3 font-semibold">MWe</th>
              <th className="w-[18%] px-5 py-3 font-semibold">MWth</th>
              <th className="w-[16%] px-5 py-3 font-semibold">Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {buckets.map((bucket) => {
              const share = Math.round(
                (bucket.electric_capacity_mwe / maxElectric) * 100
              );

              return (
                <tr key={bucket.bucket_code}>
                  <td className="px-5 py-4 font-semibold text-[#1f2937]">
                    {formatPreviewFilterLabel(bucket.bucket_code)}
                  </td>
                  <td className="px-5 py-4 text-gray-700">
                    {formatCount(bucket.record_count)}
                  </td>
                  <td className="px-5 py-4 text-gray-700">
                    {formatMw(bucket.electric_capacity_mwe)} MWe
                  </td>
                  <td className="px-5 py-4 text-gray-700">
                    {formatMw(bucket.thermal_capacity_mwth)} MWth
                  </td>
                  <td className="px-5 py-4">
                    <div className="h-1.5 overflow-hidden bg-gray-100">
                      <div
                        className="h-full bg-[#8dc63f]"
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

export default async function PostgresAnalysisPreviewPage() {
  const data = await getAnalysisData();
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
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-8 py-8">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
            PostgreSQL Staging
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-[#1f2937]">
                Analysis Preview
              </h1>
              <p className="mt-4 max-w-4xl text-base leading-7 text-gray-600">
                First PostgreSQL-backed analytical overview for replacement
                readiness: country capacity, lifecycle, operating status, and
                use-type distribution.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                href="/postgres-preview"
              >
                Back to Preview
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                href="/postgres-preview/countries"
              >
                Countries / Markets
              </Link>
            </div>
          </div>
        </div>
      </section>

      <NextActionStrip
        description="From analysis, the next step should be a market drilldown, a filtered worklist, or a spatial view of the pattern."
        actions={[
          {
            label: "Market Drilldown",
            title: "Open Countries / Markets",
            description: "Move from benchmark signals into country-level market intelligence and worklists.",
            href: "/postgres-preview/countries",
          },
          {
            label: "Filtered Work",
            title: "Open project pipeline",
            description: "Use lifecycle and capacity patterns to inspect the underlying project records.",
            href: "/postgres-preview/projects",
          },
          {
            label: "Spatial Pattern",
            title: "Open Map",
            description: "View coordinate-confirmed project and operating asset groups spatially.",
            href: "/postgres-preview/map",
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
                href: "#country-drilldown",
                label: "Countries",
                note: "Drilldown",
              },
            ]}
          />

          <section id="analysis-snapshot" className="space-y-4 scroll-mt-24">
            <DetailPriorityMarker
              label="Core"
              title="Analysis Snapshot"
              description="Record counts and capacity signals."
              tone="core"
            />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile
                label="Project Records"
                note="PostgreSQL staging pipeline records"
                value={formatCount(totals.projectRecords)}
              />
              <StatTile
                label="Asset Records"
                note="PostgreSQL staging operating asset records"
                value={formatCount(totals.assetRecords)}
              />
              <StatTile
                label="Top-10 Operating"
                note="Installed MWe across top countries in this preview"
                value={`${formatMw(totals.topCountryOperating)} MWe`}
              />
              <StatTile
                label="Top-10 Pipeline"
                note="Pipeline MWe across top countries in this preview"
                value={`${formatMw(totals.topCountryPipeline)} MWe`}
              />
            </div>
          </section>

          <section id="benchmark-views" className="space-y-5 scroll-mt-24">
            <DetailPriorityMarker
              label="Workflow"
              title="Benchmark Views"
              description="Lifecycle, status, use type, country comparison."
              tone="workflow"
            />

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <BucketTable
                buckets={summary.projectLifecycle}
                description="Project records grouped by lifecycle phase, including electric and thermal capacity signals where available."
                title="Project Lifecycle"
              />
              <BucketTable
                buckets={summary.operatingAssetStatus}
                description="Plant/facility records grouped by operating status or lifecycle-style asset state."
                title="Plants / Facilities Status"
              />
            </div>

            <BucketTable
              buckets={summary.useTypeBreakdown}
              defaultOpen={false}
              description="Combined project and operating asset distribution by geothermal use type."
              title="Use-Type Distribution"
            />
          </section>

          <section id="country-drilldown" className="space-y-4 scroll-mt-24">
            <DetailPriorityMarker
              label="Governance"
              title="Country Drilldown"
              description="Connect analysis back to filtered worklists."
              tone="governance"
            />

            <details className="border border-gray-200 bg-white">
            <summary className="flex cursor-pointer list-none flex-col gap-3 px-5 py-4 marker:hidden md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#1f2937]">
                  Top Countries
                </h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  Highest combined operating plus pipeline MWe from the
                  PostgreSQL country/market aggregation.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap md:justify-end">
                <span className="inline-flex min-h-8 items-center justify-center border border-gray-200 bg-[#f7f7f7] px-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  {formatCount(summary.topCountries.length)} countries
                </span>
                <span className="inline-flex min-h-8 items-center justify-center border border-gray-200 bg-white px-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Expand
                </span>
              </div>
            </summary>
            <div className="border-t border-gray-200">
              <div className="divide-y divide-gray-100 md:hidden">
                {summary.topCountries.map((country) => (
                  <article key={country.country} className="px-4 py-4">
                    <div className="font-semibold text-[#1f2937]">
                      {country.country}
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <MobileAnalysisField label="Operating">
                        {formatMw(country.operating_installed_mwe)} MWe
                      </MobileAnalysisField>
                      <MobileAnalysisField label="Pipeline">
                        {formatMw(country.project_pipeline_mwe)} MWe
                      </MobileAnalysisField>
                      <MobileAnalysisField label="Records">
                        {formatCount(
                          country.project_count +
                            country.operating_asset_count +
                            country.company_count
                        )}
                      </MobileAnalysisField>
                      <MobileAnalysisField label="Open">
                        <Link
                          className="text-xs font-semibold text-[#4f7f1f] hover:underline"
                          href={`/postgres-preview/projects?country=${encodeURIComponent(
                            country.country
                          )}`}
                        >
                          Project worklist
                        </Link>
                      </MobileAnalysisField>
                    </div>
                  </article>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-[820px] table-fixed text-left text-sm">
                <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="w-[28%] px-5 py-3 font-semibold">Country</th>
                    <th className="w-[18%] px-5 py-3 font-semibold">
                      Operating
                    </th>
                    <th className="w-[18%] px-5 py-3 font-semibold">
                      Pipeline
                    </th>
                    <th className="w-[18%] px-5 py-3 font-semibold">Records</th>
                    <th className="w-[18%] px-5 py-3 font-semibold">Open</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summary.topCountries.map((country) => (
                    <tr key={country.country}>
                      <td className="px-5 py-4 font-semibold text-[#1f2937]">
                        {country.country}
                      </td>
                      <td className="px-5 py-4 text-gray-700">
                        {formatMw(country.operating_installed_mwe)} MWe
                      </td>
                      <td className="px-5 py-4 text-gray-700">
                        {formatMw(country.project_pipeline_mwe)} MWe
                      </td>
                      <td className="px-5 py-4 text-gray-700">
                        {formatCount(
                          country.project_count +
                            country.operating_asset_count +
                            country.company_count
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          className="text-xs font-semibold text-[#4f7f1f] hover:underline"
                          href={`/postgres-preview/projects?country=${encodeURIComponent(
                            country.country
                          )}`}
                        >
                          Project worklist
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
