import Link from "next/link";

import {
  KPIStat,
  PageHeader,
  SectionHeader,
} from "@/components/design-system/TgeDesignSystem";
import { getPrismaClient } from "@/lib/db/prisma";
import { tgeChartLanguageV2 } from "@/lib/design-system";
import { formatCount, formatMw } from "@/lib/format";
import {
  listPostgresCountryMarketSummaries,
  type PostgresCountryMarketSummary,
} from "@/lib/postgres-preview";

export const dynamic = "force-dynamic";

const panelClass =
  "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] shadow-sm";
const panelHeaderClass =
  "border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)]";
const titleTextClass = "text-[var(--tge-text-primary)]";
const bodyTextClass = "text-[var(--tge-text-secondary)]";
const mutedTextClass = "text-[var(--tge-governance-muted-text)]";
const linkActionClass = "text-[var(--tge-brand-green-dark)]";

type RegionSummary = {
  region: string;
  countryCount: number;
  operatingMwe: number;
  pipelineMwe: number;
  activeProjects: number;
};

type MarketLifecycleRow = {
  country: string;
  phase: string;
  projectCount: number;
  pipelineMwe: number;
};

const lifecycleOrder = [
  "Prospect / TBD",
  "Exploration",
  "Pre-Feasibility",
  "Feasibility",
  "Construction",
  "Operating",
  "Cancelled",
];

async function getMarketRows() {
  try {
    const [rows, lifecycleRows] = await Promise.all([
      listPostgresCountryMarketSummaries(250),
      listMarketLifecycleRows(),
    ]);

    return {
      ok: true as const,
      lifecycleRows,
      rows,
    };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Unknown PostgreSQL error",
      lifecycleRows: [],
      rows: [],
    };
  }
}

async function listMarketLifecycleRows(): Promise<MarketLifecycleRow[]> {
  const rows = await getPrismaClient().$queryRawUnsafe<
    Array<{
      country: string | null;
      phase: string | null;
      project_count: number | bigint | string | null;
      pipeline_mwe: number | bigint | string | null;
    }>
  >(`
    SELECT
      COALESCE(cr.country_name, NULLIF(trim(p.country), '')) AS country,
      COALESCE(NULLIF(trim(p.lifecycle_phase_code), ''), 'prospect_tbd') AS phase,
      count(*)::int AS project_count,
      COALESCE(sum(COALESCE(p.electric_capacity_mwe, 0)), 0)::float8 AS pipeline_mwe
    FROM projects p
    LEFT JOIN countries_reference cr
      ON cr.country_id = p.country_id
    WHERE COALESCE(cr.country_name, NULLIF(trim(p.country), '')) IS NOT NULL
    GROUP BY
      COALESCE(cr.country_name, NULLIF(trim(p.country), '')),
      COALESCE(NULLIF(trim(p.lifecycle_phase_code), ''), 'prospect_tbd')
  `);

  return rows.map((row) => ({
    country: row.country ?? "Unclassified",
    phase: formatLifecyclePhase(row.phase),
    projectCount: Number(row.project_count ?? 0),
    pipelineMwe: Number(row.pipeline_mwe ?? 0),
  }));
}

function summarizeRegions(rows: PostgresCountryMarketSummary[]) {
  const regions = new Map<string, RegionSummary>();

  rows.forEach((row) => {
    const region = row.tge_region || "Unclassified";
    const current = regions.get(region) ?? {
      region,
      countryCount: 0,
      operatingMwe: 0,
      pipelineMwe: 0,
      activeProjects: 0,
    };

    current.countryCount += 1;
    current.operatingMwe += row.operating_installed_mwe;
    current.pipelineMwe += row.project_pipeline_mwe;
    current.activeProjects += row.active_project_count;
    regions.set(region, current);
  });

  return [...regions.values()].sort(
    (a, b) => b.operatingMwe + b.pipelineMwe - (a.operatingMwe + a.pipelineMwe)
  );
}

function countrySlug(country: string) {
  return encodeURIComponent(country.toLowerCase().replaceAll(" ", "-"));
}

function regionSlug(region: string) {
  return encodeURIComponent(
    region.toLowerCase().replaceAll(" ", "-").replaceAll("&", "and")
  );
}

function formatRatio(value: number) {
  if (!Number.isFinite(value)) return "-";
  if (value >= 10) return `${Math.round(value)}x`;
  return `${value.toFixed(1)}x`;
}

function barValueLabel(value: number) {
  return `${formatMw(value)} MWe`;
}

function pipelineOperatingRatio(row: PostgresCountryMarketSummary) {
  if (row.operating_installed_mwe > 0) {
    return row.project_pipeline_mwe / row.operating_installed_mwe;
  }
  return row.project_pipeline_mwe > 0 ? Infinity : 0;
}

function formatLifecyclePhase(value: string | null | undefined) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

  if (
    normalized.includes("pre_feas") ||
    normalized.includes("prefeas")
  ) {
    return "Pre-Feasibility";
  }
  if (normalized.includes("feas")) return "Feasibility";
  if (normalized.includes("construct")) return "Construction";
  if (normalized.includes("operat")) return "Operating";
  if (
    normalized.includes("cancel") ||
    normalized.includes("suspend") ||
    normalized.includes("archive")
  ) {
    return "Cancelled";
  }
  if (normalized.includes("explor")) return "Exploration";
  return "Prospect / TBD";
}

function lifecycleColor(phase: string | undefined) {
  const entry = tgeChartLanguageV2.lifecycle.find(
    (item) => item.label === phase
  );
  return entry?.cssVar ?? "var(--tge-chart-lifecycle-prospect)";
}

function phaseMapForCountry(lifecycleRows: MarketLifecycleRow[], country: string) {
  const rows = lifecycleRows.filter((row) => row.country === country);
  const phases = new Map<string, { projectCount: number; pipelineMwe: number }>();

  rows.forEach((row) => {
    const current = phases.get(row.phase) ?? { projectCount: 0, pipelineMwe: 0 };
    current.projectCount += row.projectCount;
    current.pipelineMwe += row.pipelineMwe;
    phases.set(row.phase, current);
  });

  return phases;
}

function MarketPathCard({
  title,
  text,
  href,
}: {
  title: string;
  text: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`${panelClass} block transition hover:border-[var(--tge-brand-green)] hover:bg-[var(--tge-governance-success-bg)]`}
    >
      <div className="px-5 py-4">
        <h2 className={`text-base font-bold ${titleTextClass}`}>{title}</h2>
        <p className={`mt-2 text-sm leading-6 ${bodyTextClass}`}>{text}</p>
      </div>
    </Link>
  );
}

function RegionalMarketComparison({ regions }: { regions: RegionSummary[] }) {
  const maxCapacity = Math.max(
    ...regions.map((region) => Math.max(region.operatingMwe, region.pipelineMwe)),
    1
  );

  return (
    <section className={panelClass}>
      <div className={`${panelHeaderClass} px-5 py-4`}>
        <SectionHeader
          title="Regional Market Comparison"
          description="Operating capacity and pipeline capacity by TGE region in one comparison view."
          action={
            <Link
              href="/markets/regions"
              className={`text-xs font-semibold uppercase tracking-wide ${linkActionClass}`}
            >
              Regions
            </Link>
          }
        />
      </div>

      <div className="space-y-4 px-5 py-4">
        {regions.slice(0, 7).map((region) => {
          const operatingWidth = Math.max(3, (region.operatingMwe / maxCapacity) * 100);
          const pipelineWidth = Math.max(3, (region.pipelineMwe / maxCapacity) * 100);
          const operatingInside = operatingWidth >= 32;
          const pipelineInside = pipelineWidth >= 32;

          return (
            <Link
              key={region.region}
              href={`/markets/regions/${regionSlug(region.region)}`}
              className="block"
            >
              <div className="grid gap-3 md:grid-cols-[160px_1fr] md:items-center">
                <div>
                  <div className={`text-sm font-semibold ${titleTextClass}`}>
                    {region.region}
                  </div>
                  <div className={`mt-1 text-xs ${mutedTextClass}`}>
                    {formatCount(region.countryCount)} markets ·{" "}
                    {formatCount(region.activeProjects)} projects
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-[68px_1fr] items-center gap-2">
                    <span className={`w-16 text-[11px] font-semibold uppercase ${mutedTextClass}`}>
                      Operating
                    </span>
                    <div className="relative h-5 bg-[var(--tge-governance-neutral-bg)]">
                      <div
                        className="flex h-5 items-center justify-end bg-[var(--tge-chart-ranking-installed-capacity)] pr-2"
                        style={{ width: `${operatingWidth}%` }}
                      >
                        {operatingInside ? (
                          <span className="text-[10px] font-bold text-[var(--tge-surface-card)]">
                            {barValueLabel(region.operatingMwe)}
                          </span>
                        ) : null}
                      </div>
                      {!operatingInside ? (
                        <span
                          className={`absolute inset-y-0 flex items-center text-xs font-semibold ${titleTextClass}`}
                          style={{ left: `calc(${operatingWidth}% + 8px)` }}
                        >
                          {barValueLabel(region.operatingMwe)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="grid grid-cols-[68px_1fr] items-center gap-2">
                    <span className={`w-16 text-[11px] font-semibold uppercase ${mutedTextClass}`}>
                      Pipeline
                    </span>
                    <div className="relative h-5 bg-[var(--tge-governance-neutral-bg)]">
                      <div
                        className="flex h-5 items-center justify-end bg-[var(--tge-chart-ranking-pipeline-capacity)] pr-2"
                        style={{ width: `${pipelineWidth}%` }}
                      >
                        {pipelineInside ? (
                          <span className="text-[10px] font-bold text-[var(--tge-surface-card)]">
                            {barValueLabel(region.pipelineMwe)}
                          </span>
                        ) : null}
                      </div>
                      {!pipelineInside ? (
                        <span
                          className={`absolute inset-y-0 flex items-center text-xs font-semibold ${titleTextClass}`}
                          style={{ left: `calc(${pipelineWidth}% + 8px)` }}
                        >
                          {barValueLabel(region.pipelineMwe)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function TopMarketsTable({
  rows,
}: {
  rows: PostgresCountryMarketSummary[];
}) {
  const topRows = [...rows]
    .sort(
      (a, b) =>
        b.operating_installed_mwe +
        b.project_pipeline_mwe -
        (a.operating_installed_mwe + a.project_pipeline_mwe)
    )
    .slice(0, 8);

  return (
    <section className={panelClass}>
      <div className={`${panelHeaderClass} px-5 py-4`}>
        <SectionHeader
          title="Top Markets"
          description="Leading geothermal markets by operating and pipeline capacity."
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[760px] table-fixed text-left text-[13px]">
          <thead className="bg-[var(--tge-governance-neutral-bg)] text-[11px] uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
            <tr>
              <th className="w-[25%] px-3 py-2.5 font-semibold">Country</th>
              <th className="w-[18%] px-3 py-2.5 font-semibold">Region</th>
              <th className="w-[15%] px-3 py-2.5 text-right font-semibold">Operating MWe</th>
              <th className="w-[15%] px-3 py-2.5 text-right font-semibold">Pipeline MWe</th>
              <th className="w-[15%] px-3 py-2.5 text-right font-semibold">Pipeline / Operating</th>
              <th className="w-[12%] px-3 py-2.5 text-right font-semibold">Projects</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--tge-governance-muted-border)]">
            {topRows.map((row) => {
              const ratio = pipelineOperatingRatio(row);
              return (
                <tr
                  key={`${row.country}-${row.iso3}`}
                  className="align-top hover:bg-[var(--tge-surface-subtle)]"
                >
                  <td className="px-3 py-3">
                    <Link
                      href={`/markets/countries/${countrySlug(row.country)}`}
                      className={`font-semibold ${titleTextClass} hover:text-[var(--tge-brand-green-dark)] hover:underline`}
                    >
                      {row.country}
                    </Link>
                    {row.iso3 ? (
                      <div className={`mt-1 text-xs ${mutedTextClass}`}>
                        {row.iso3}
                      </div>
                    ) : null}
                  </td>
                  <td className={`px-3 py-3 ${bodyTextClass}`}>
                    {row.tge_region || "-"}
                  </td>
                  <td className={`px-3 py-3 text-right font-semibold ${titleTextClass}`}>
                    {formatMw(row.operating_installed_mwe)}
                  </td>
                  <td className={`px-3 py-3 text-right font-semibold ${titleTextClass}`}>
                    {formatMw(row.project_pipeline_mwe)}
                  </td>
                  <td className={`px-3 py-3 text-right ${bodyTextClass}`}>
                    {ratio === Infinity ? "Pipeline only" : formatRatio(ratio)}
                  </td>
                  <td className={`px-3 py-3 text-right ${bodyTextClass}`}>
                    {formatCount(row.active_project_count)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TopPipelineMarkets({
  rows,
}: {
  rows: PostgresCountryMarketSummary[];
}) {
  const topRows = [...rows]
    .filter((row) => row.project_pipeline_mwe > 0)
    .sort((a, b) => b.project_pipeline_mwe - a.project_pipeline_mwe)
    .slice(0, 8);
  const maxPipeline = Math.max(
    ...topRows.map((row) => row.project_pipeline_mwe),
    1
  );
  const totalPipeline = rows.reduce(
    (total, row) => total + row.project_pipeline_mwe,
    0
  );

  return (
    <section className={panelClass}>
      <div className={`${panelHeaderClass} px-5 py-4`}>
        <SectionHeader
          title="Top Pipeline Markets"
          description="Where future geothermal capacity is concentrated in the tracked development pipeline."
        />
      </div>

      <div className="space-y-3 px-5 py-4">
        {topRows.map((row) => {
          const width = Math.max(4, (row.project_pipeline_mwe / maxPipeline) * 100);
          const share =
            totalPipeline > 0
              ? Math.round((row.project_pipeline_mwe / totalPipeline) * 100)
              : 0;
          const valueInside = width >= 34;

          return (
            <Link
              key={`pipeline-${row.country}`}
              href={`/markets/countries/${countrySlug(row.country)}`}
              className="block"
            >
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className={`font-semibold ${titleTextClass}`}>{row.country}</span>
                <span className={`text-xs font-semibold ${mutedTextClass}`}>
                  {share}% of tracked pipeline
                </span>
              </div>
              <div className="relative mt-1.5 h-5 bg-[var(--tge-governance-neutral-bg)]">
                <div
                  className="flex h-5 items-center justify-end bg-[var(--tge-chart-ranking-pipeline-capacity)] pr-2"
                  style={{ width: `${width}%` }}
                >
                  {valueInside ? (
                    <span className="text-[10px] font-bold text-[var(--tge-surface-card)]">
                      {barValueLabel(row.project_pipeline_mwe)}
                    </span>
                  ) : null}
                </div>
                {!valueInside ? (
                  <span
                    className={`absolute inset-y-0 flex items-center text-xs font-semibold ${titleTextClass}`}
                    style={{ left: `calc(${width}% + 8px)` }}
                  >
                    {barValueLabel(row.project_pipeline_mwe)}
                  </span>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function LifecycleMixByMarket({
  rows,
  lifecycleRows,
}: {
  rows: PostgresCountryMarketSummary[];
  lifecycleRows: MarketLifecycleRow[];
}) {
  const topPipelineRows = [...rows]
    .filter((row) => row.project_pipeline_mwe > 0)
    .sort((a, b) => b.project_pipeline_mwe - a.project_pipeline_mwe)
    .slice(0, 10);

  return (
    <section className={panelClass}>
      <div className={`${panelHeaderClass} px-5 py-4`}>
        <SectionHeader
          title="Lifecycle Mix by Market"
          description="Development maturity across major pipeline markets using the approved lifecycle palette."
        />
      </div>

      <div className="space-y-4 px-5 py-4">
        {topPipelineRows.map((row) => {
          const phaseMap = phaseMapForCountry(lifecycleRows, row.country);
          const totalMwe =
            [...phaseMap.values()].reduce(
              (total, phase) => total + phase.pipelineMwe,
              0
            ) || row.project_pipeline_mwe;

          return (
            <Link
              key={`lifecycle-${row.country}`}
              href={`/markets/countries/${countrySlug(row.country)}`}
              className="block"
            >
              <div className="mb-1.5 grid gap-2 text-sm sm:grid-cols-[minmax(120px,0.45fr)_1fr] sm:items-end">
                <span className={`font-semibold ${titleTextClass}`}>{row.country}</span>
                <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs font-semibold">
                  <span className={titleTextClass}>
                    {barValueLabel(row.project_pipeline_mwe)}
                  </span>
                  <span className={mutedTextClass}>
                    {formatCount(row.active_project_count)} projects
                  </span>
                </div>
              </div>
              <div className="flex h-6 overflow-hidden bg-[var(--tge-governance-neutral-bg)]">
                {lifecycleOrder.map((phase) => {
                  const phaseValue = phaseMap.get(phase)?.pipelineMwe ?? 0;
                  const width = totalMwe > 0 ? (phaseValue / totalMwe) * 100 : 0;
                  if (width <= 0) return null;
                  return (
                    <div
                      key={`${row.country}-${phase}`}
                      className="flex h-6 items-center justify-center"
                      style={{
                        backgroundColor: lifecycleColor(phase),
                        width: `${width}%`,
                      }}
                      title={`${phase}: ${formatMw(phaseValue)} MWe`}
                    >
                      {width >= 20 ? (
                        <span className="px-1 text-[10px] font-bold text-[var(--tge-surface-card)]">
                          {formatMw(phaseValue)}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </Link>
          );
        })}

        <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-[var(--tge-governance-muted-border)] pt-3">
          {lifecycleOrder.map((phase) => (
            <div key={phase} className="flex items-center gap-2 text-xs">
              <span
                className="h-2.5 w-2.5"
                style={{ backgroundColor: lifecycleColor(phase) }}
              />
              <span className={mutedTextClass}>{phase}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MarketsToWatch({
  rows,
  lifecycleRows,
}: {
  rows: PostgresCountryMarketSummary[];
  lifecycleRows: MarketLifecycleRow[];
}) {
  const watchRows = [...rows]
    .filter((row) => row.project_pipeline_mwe > 0 || row.active_project_count > 0)
    .sort((a, b) => {
      const aRatio = pipelineOperatingRatio(a);
      const bRatio = pipelineOperatingRatio(b);
      const aScore =
        a.project_pipeline_mwe * 0.7 +
        a.active_project_count * 50 +
        (aRatio === Infinity ? 300 : Math.min(aRatio, 8) * 70);
      const bScore =
        b.project_pipeline_mwe * 0.7 +
        b.active_project_count * 50 +
        (bRatio === Infinity ? 300 : Math.min(bRatio, 8) * 70);
      return bScore - aScore;
    })
    .slice(0, 4);

  return (
    <section className="border border-[var(--tge-brand-green)] bg-[var(--tge-surface-card)] shadow-sm">
      <div className="border-b border-[var(--tge-governance-success-border)] px-5 py-4">
        <SectionHeader
          title="Markets to Watch"
          description="Priority markets based on pipeline scale, pipeline ratio, and lifecycle composition."
        />
      </div>

      <div className="grid gap-3 px-5 py-4 md:grid-cols-2">
        {watchRows.map((row) => {
          const ratio = pipelineOperatingRatio(row);
          const phaseMap = phaseMapForCountry(lifecycleRows, row.country);
          const leadingPhaseEntry = lifecycleOrder
            .map((phase) => ({
              phase,
              value: phaseMap.get(phase)?.pipelineMwe ?? 0,
            }))
            .sort((a, b) => b.value - a.value)[0];
          const leadingPhase = leadingPhaseEntry?.phase;

          return (
            <Link
              key={`watch-${row.country}`}
              href={`/markets/countries/${countrySlug(row.country)}`}
              className="border border-[var(--tge-governance-muted-border)] bg-[var(--tge-surface-card)] p-4 transition hover:border-[var(--tge-brand-green)] hover:bg-[var(--tge-governance-success-bg)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className={`text-base font-bold ${titleTextClass}`}>
                    {row.country}
                  </h3>
                  <p className={`mt-1 text-xs ${mutedTextClass}`}>
                    {row.tge_region || "Unclassified"}
                  </p>
                </div>
                <span
                  className="border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide"
                  style={{
                    borderColor: lifecycleColor(leadingPhase),
                    color: lifecycleColor(leadingPhase),
                  }}
                >
                  {leadingPhase}
                </span>
              </div>
              <div className={`mt-4 text-sm leading-6 ${bodyTextClass}`}>
                <div>
                  <span className={`font-semibold ${titleTextClass}`}>
                    {barValueLabel(row.project_pipeline_mwe)}
                  </span>{" "}
                  pipeline
                </div>
                <div>
                  <span className={`font-semibold ${titleTextClass}`}>
                    {ratio === Infinity ? "Pipeline only" : formatRatio(ratio)}
                  </span>{" "}
                  pipeline / operating
                </div>
                <div>
                  Dominant phase:{" "}
                  <span className={`font-semibold ${titleTextClass}`}>
                    {leadingPhase}
                  </span>
                  {leadingPhaseEntry?.value ? (
                    <span className={mutedTextClass}>
                      {" "}
                      ({barValueLabel(leadingPhaseEntry.value)})
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default async function MarketsPage() {
  const data = await getMarketRows();
  const rows = data.rows;
  const regions = summarizeRegions(rows);
  const operatingMwe = rows.reduce(
    (total, row) => total + row.operating_installed_mwe,
    0
  );
  const pipelineMwe = rows.reduce(
    (total, row) => total + row.project_pipeline_mwe,
    0
  );
  const activeProjects = rows.reduce(
    (total, row) => total + row.active_project_count,
    0
  );
  const activeMarkets = rows.filter(
    (row) =>
      row.operating_installed_mwe > 0 ||
      row.project_pipeline_mwe > 0 ||
      row.active_project_count > 0
  ).length;

  return (
    <main className="space-y-6">
      <PageHeader
        label="Markets"
        title="Global Geothermal Market Intelligence"
        description="Regional and country intelligence for geothermal market size, development pipeline, lifecycle maturity, and market concentration."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/markets/countries"
              className="inline-flex h-9 items-center justify-center border border-[var(--tge-brand-green)] bg-[var(--tge-brand-green)] px-3 text-xs font-semibold uppercase tracking-wide text-[var(--tge-text-primary)] hover:bg-[var(--tge-governance-success-bg)]"
            >
              Countries
            </Link>
            <Link
              href="/markets/regions"
              className="inline-flex h-9 items-center justify-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 text-xs font-semibold uppercase tracking-wide text-[var(--tge-text-primary)] hover:border-[var(--tge-brand-green)]"
            >
              Regions
            </Link>
          </div>
        }
      />

      {!data.ok ? (
        <section className="border border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] px-5 py-4 text-sm leading-6 text-[var(--tge-governance-attention-text)]">
          Market intelligence is unavailable until PostgreSQL is connected.
          Error: {data.error}
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <KPIStat
          label="Operating Capacity"
          value={formatMw(operatingMwe)}
          unit="MWe"
          context="Installed market base"
          tone="operating"
          size="small"
        />
        <KPIStat
          label="Pipeline Capacity"
          value={formatMw(pipelineMwe)}
          unit="MWe"
          context="Development market signal"
          tone="pipeline"
          size="small"
        />
        <KPIStat
          label="Active Markets"
          value={formatCount(activeMarkets)}
          context="Markets with capacity or project activity"
          tone="neutral"
          size="small"
        />
        <KPIStat
          label="Active Projects"
          value={formatCount(activeProjects)}
          context="Development activity tracked"
          tone="neutral"
          size="small"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {rows.length > 0 ? <TopMarketsTable rows={rows} /> : null}
        {regions.length > 0 ? <RegionalMarketComparison regions={regions} /> : null}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_1.15fr]">
        {rows.length > 0 ? <TopPipelineMarkets rows={rows} /> : null}
        {rows.length > 0 ? (
          <LifecycleMixByMarket
            lifecycleRows={data.lifecycleRows}
            rows={rows}
          />
        ) : null}
      </section>

      {rows.length > 0 ? (
        <MarketsToWatch lifecycleRows={data.lifecycleRows} rows={rows} />
      ) : null}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <MarketPathCard
          title="Country Markets"
          text="Drill into country-level market profiles, project pipelines, plants, and linked entities."
          href="/markets/countries"
        />
        <MarketPathCard
          title="Regional Markets"
          text="Compare TGE regions and move from regional structure into country market detail."
          href="/markets/regions"
        />
        <MarketPathCard
          title="Map Explorer"
          text="Open the spatial intelligence layer for market concentration and project/plant geography."
          href="/map"
        />
      </section>
    </main>
  );
}
