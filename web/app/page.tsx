import Link from "next/link";
import { getDb } from "@/lib/db";
import { getPrismaClient } from "@/lib/db/prisma";
import { formatCount, formatMw } from "@/lib/format";
import {
  getPostgresPreviewAnalysisSummary,
  getPostgresPreviewSummary,
  getPostgresReplacementReadiness,
  listPostgresCountryMarketSummaries,
  type PostgresPreviewAnalysisBucket,
  type PostgresPreviewAnalysisSummary,
  type PostgresPreviewSummary,
  type PostgresReplacementReadiness,
  type PostgresCountryMarketSummary,
} from "@/lib/postgres-preview";
import {
  SectionHeader,
} from "@/components/design-system/TgeDesignSystem";
import {
  tgeChartLanguageV2,
} from "@/lib/design-system";

export const dynamic = "force-dynamic";

type LegacyDashboardStats = {
  plantCount: number;
  plantCapacity: number;
  projectCount: number;
  projectCapacity: number;
  companyCount: number;
  companyCountries: number;
  countries: number;
  companiesDone: number;
  needInfo: number;
  approvedTotal: number;
  pendingReviewTotal: number;
};

type StagingDashboardData =
  | {
      ok: true;
      summary: PostgresPreviewSummary;
      analysis: PostgresPreviewAnalysisSummary;
      readiness: PostgresReplacementReadiness;
      countries: PostgresCountryMarketSummary[];
    }
  | {
      ok: false;
      error: string;
    };

type DashboardTechnologyMixRow = {
  label: string;
  installedMwe: number;
  color: string;
};

async function getLegacyDashboardStats(): Promise<LegacyDashboardStats> {
  const db = await getDb();

  const plantCountRow = await db.get("SELECT COUNT(*) as count FROM plants");
  const plantCapacityRow = await db.get(
    "SELECT SUM(installed_capacity_mw) as total FROM plants"
  );

  const projectCountRow = await db.get("SELECT COUNT(*) as count FROM projects");
  const projectCapacityRow = await db.get(
    "SELECT SUM(installed_capacity_mw) as total FROM projects"
  );

  const companyCountRow = await db.get("SELECT COUNT(*) as count FROM companies");
  const companyCountriesRow = await db.get(
    `
    SELECT COUNT(DISTINCT headquarters_country) as count
    FROM companies
    WHERE headquarters_country IS NOT NULL AND TRIM(headquarters_country) != ''
    `
  );

  const countriesRow = await db.get(`
    SELECT COUNT(DISTINCT country) as count
    FROM (
      SELECT country FROM plants
      UNION
      SELECT country FROM projects
    )
    WHERE country IS NOT NULL AND TRIM(country) != ''
  `);

  const needInfoPlantsRow = await db.get(
    "SELECT COUNT(*) as count FROM plants WHERE LOWER(research_status) LIKE '%need%'"
  );
  const needInfoProjectsRow = await db.get(
    "SELECT COUNT(*) as count FROM projects WHERE LOWER(research_status) LIKE '%need%'"
  );
  const needInfoCompaniesRow = await db.get(
    "SELECT COUNT(*) as count FROM companies WHERE LOWER(research_status) LIKE '%need%'"
  );

  const doneCompaniesRow = await db.get(
    "SELECT COUNT(*) as count FROM companies WHERE LOWER(research_status) LIKE '%done%'"
  );

  const approvedPlantsRow = await db.get(
    "SELECT COUNT(*) as count FROM plants WHERE review_status = 'Approved'"
  );
  const approvedProjectsRow = await db.get(
    "SELECT COUNT(*) as count FROM projects WHERE review_status = 'Approved'"
  );
  const approvedCompaniesRow = await db.get(
    "SELECT COUNT(*) as count FROM companies WHERE review_status = 'Approved'"
  );

  const pendingPlantsRow = await db.get(
    "SELECT COUNT(*) as count FROM plants WHERE review_status = 'Pending Review'"
  );
  const pendingProjectsRow = await db.get(
    "SELECT COUNT(*) as count FROM projects WHERE review_status = 'Pending Review'"
  );
  const pendingCompaniesRow = await db.get(
    "SELECT COUNT(*) as count FROM companies WHERE review_status = 'Pending Review'"
  );

  return {
    plantCount: plantCountRow?.count ?? 0,
    plantCapacity: plantCapacityRow?.total ?? 0,
    projectCount: projectCountRow?.count ?? 0,
    projectCapacity: projectCapacityRow?.total ?? 0,
    companyCount: companyCountRow?.count ?? 0,
    companyCountries: companyCountriesRow?.count ?? 0,
    countries: countriesRow?.count ?? 0,
    companiesDone: doneCompaniesRow?.count ?? 0,
    needInfo:
      (needInfoPlantsRow?.count ?? 0) +
      (needInfoProjectsRow?.count ?? 0) +
      (needInfoCompaniesRow?.count ?? 0),
    approvedTotal:
      (approvedPlantsRow?.count ?? 0) +
      (approvedProjectsRow?.count ?? 0) +
      (approvedCompaniesRow?.count ?? 0),
    pendingReviewTotal:
      (pendingPlantsRow?.count ?? 0) +
      (pendingProjectsRow?.count ?? 0) +
      (pendingCompaniesRow?.count ?? 0),
  };
}

function normalizeTechnologyBucket(raw: unknown) {
  const text = String(raw ?? "").trim().toLowerCase();

  if (text.includes("back pressure") || text.includes("backpressure")) {
    return "Back Pressure";
  }
  if (text.includes("b-orc") || text === "orc" || text.includes("binary")) {
    return "Binary ORC";
  }
  if (
    text.includes("single flash") ||
    text.includes("double flash") ||
    text.includes("triple flash") ||
    text === "flash"
  ) {
    return "Flash";
  }
  if (text.includes("dry steam")) return "Dry Steam";

  return "Other";
}

function getTechnologyColor(label: string) {
  switch (label) {
    case "Back Pressure":
      return "var(--tge-chart-technology-back-pressure)";
    case "Binary ORC":
      return "var(--tge-chart-technology-binary-orc)";
    case "Flash":
      return "var(--tge-chart-technology-flash)";
    case "Dry Steam":
      return "var(--tge-chart-technology-dry-steam)";
    default:
      return "var(--tge-chart-technology-other)";
  }
}

async function getDashboardTechnologyMix(): Promise<DashboardTechnologyMixRow[]> {
  try {
    const prisma = getPrismaClient();
    const rows = await prisma.$queryRawUnsafe<
      Array<{ plant_technology: string | null; installed_mwe: number | bigint | string | null }>
    >(`
      SELECT
        plant_technology,
        COALESCE(SUM(electric_capacity_mwe), 0)::float8 AS installed_mwe
      FROM operating_assets
      WHERE electric_capacity_mwe IS NOT NULL
      GROUP BY plant_technology
    `);

    const totals = new Map<string, number>();

    rows.forEach((row) => {
      const label = normalizeTechnologyBucket(row.plant_technology);
      const value = Number(row.installed_mwe ?? 0);
      totals.set(label, (totals.get(label) ?? 0) + (Number.isFinite(value) ? value : 0));
    });

    const technologyOrder = [
      "Flash",
      "Binary ORC",
      "Dry Steam",
      "Back Pressure",
      "Other",
    ];

    return technologyOrder
      .map((label) => ({
        label,
        installedMwe: totals.get(label) ?? 0,
        color: getTechnologyColor(label),
      }));
  } catch {
    return [];
  }
}

async function getStagingDashboardData(): Promise<StagingDashboardData> {
  try {
    const [summary, analysis, readiness, countries] = await Promise.all([
      getPostgresPreviewSummary(),
      getPostgresPreviewAnalysisSummary(),
      getPostgresReplacementReadiness(),
      listPostgresCountryMarketSummaries(),
    ]);

    return {
      ok: true,
      summary,
      analysis,
      readiness,
      countries,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown PostgreSQL error",
    };
  }
}

function sumElectricCapacity(buckets: PostgresPreviewAnalysisBucket[]) {
  return buckets.reduce((total, bucket) => total + bucket.electric_capacity_mwe, 0);
}

function sumRecordCount(buckets: PostgresPreviewAnalysisBucket[]) {
  return buckets.reduce((total, bucket) => total + bucket.record_count, 0);
}

function formatBucketLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\bmwe\b/gi, "MWe")
    .replace(/\bmwth\b/gi, "MWth")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

type ExecutiveKpiTone =
  | "neutral"
  | "market-metric"
  | "asset-metric"
  | "coverage-metric"
  | "governance";

const panelClass =
  "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]";
const panelHeaderClass =
  "border-b border-[var(--tge-governance-neutral-border)]";
const eyebrowClass =
  "text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]";
const titleTextClass = "text-[var(--tge-text-primary)]";
const bodyTextClass = "text-[var(--tge-text-secondary)]";
const linkActionClass =
  "text-[var(--tge-brand-green-dark)] hover:text-[var(--tge-brand-green-dark)]";
const dashboardHoverClass =
  "transition hover:border-[var(--tge-brand-green)] hover:bg-[var(--tge-governance-success-bg)]";

function getExecutiveKpiToneClass(tone: ExecutiveKpiTone) {
  switch (tone) {
    case "market-metric":
      return "border-l-[var(--tge-brand-green-dark)] bg-[var(--tge-surface-card)]";
    case "asset-metric":
      return "border-l-[var(--tge-chart-ranking-pipeline-capacity)] bg-[var(--tge-surface-card)]";
    case "coverage-metric":
      return "border-l-[var(--tge-chart-ranking-market-count)] bg-[var(--tge-surface-card)]";
    case "governance":
      return "border-l-[var(--tge-chart-governance-needs-review)] bg-[var(--tge-surface-card)]";
    case "neutral":
    default:
      return "border-l-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]";
  }
}

function ExecutiveKpi({
  label,
  value,
  note,
  href,
  tone = "neutral",
  prominence = "standard",
}: {
  label: string;
  value: string;
  note: string;
  href?: string;
  tone?: ExecutiveKpiTone;
  prominence?: "standard" | "executive";
}) {
  const toneClass = getExecutiveKpiToneClass(tone);
  const frameClass =
    prominence === "executive"
      ? `border border-l-4 border-[var(--tge-governance-neutral-border)] ${toneClass} px-4 py-3.5 sm:px-5`
      : `border border-l-4 border-[var(--tge-governance-neutral-border)] ${toneClass} px-4 py-3`;
  const valueClass =
    prominence === "executive"
      ? `mt-2 text-2xl font-bold leading-none ${titleTextClass} sm:text-[1.9rem]`
      : `mt-2 text-xl font-bold leading-none ${titleTextClass} sm:text-2xl`;
  const noteClass =
    prominence === "executive"
      ? `mt-2 text-sm leading-5 ${bodyTextClass}`
      : "mt-2 text-sm leading-5 text-[var(--tge-governance-muted-text)]";

  const content = (
    <>
      <div className={eyebrowClass}>
        {label}
      </div>
      <div className={valueClass}>{value}</div>
      <div className={noteClass}>{note}</div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`${frameClass} ${dashboardHoverClass}`}
      >
        {content}
      </Link>
    );
  }

  return <div className={frameClass}>{content}</div>;
}

function lifecycleChartColor(bucketCode: string) {
  const normalized = bucketCode.toLowerCase().replaceAll("_", " ");
  const lifecycle = tgeChartLanguageV2.lifecycle;
  const match =
    normalized.includes("cancel")
      ? lifecycle.find((entry) => entry.key === "cancelled")
      : normalized.includes("operat")
        ? lifecycle.find((entry) => entry.key === "operating")
        : normalized.includes("construct")
          ? lifecycle.find((entry) => entry.key === "construction")
          : normalized.includes("feasibility") && !normalized.includes("pre")
            ? lifecycle.find((entry) => entry.key === "feasibility")
            : normalized.includes("pre")
              ? lifecycle.find((entry) => entry.key === "pre_feasibility")
              : normalized.includes("explor")
                ? lifecycle.find((entry) => entry.key === "exploration")
                : lifecycle.find((entry) => entry.key === "prospect");

  return match?.cssVar ?? "var(--tge-chart-lifecycle-prospect)";
}

function GatewayCard({
  title,
  href,
  meta,
}: {
  title: string;
  href: string;
  meta: string;
}) {
  return (
    <Link
      href={href}
      className={`${panelClass} flex items-center justify-between gap-4 px-4 py-3.5 shadow-sm ${dashboardHoverClass}`}
    >
      <div>
        <div className={`text-sm font-bold ${titleTextClass}`}>{title}</div>
        <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
          {meta}
        </div>
      </div>
      <span className={`text-xs font-semibold uppercase tracking-wide ${linkActionClass}`}>
        Open
      </span>
    </Link>
  );
}

function MarketSignalTable({
  analysis,
}: {
  analysis: PostgresPreviewAnalysisSummary;
}) {
  return (
    <section className={panelClass}>
      <div className={`flex flex-col gap-2 px-5 py-4 md:flex-row md:items-center md:justify-between ${panelHeaderClass}`}>
        <div>
          <h2 className={`text-lg font-bold ${titleTextClass}`}>Top Markets</h2>
          <p className={`mt-1 text-sm leading-6 ${bodyTextClass}`}>
            Highest-capacity markets from the current intelligence layer.
          </p>
        </div>
        <Link
          href="/markets"
          className="inline-flex h-9 items-center justify-center border border-[var(--tge-brand-green)] bg-[var(--tge-surface-card)] px-3 text-xs font-semibold uppercase tracking-wide text-[var(--tge-brand-green-dark)] hover:bg-[var(--tge-governance-success-bg)]"
        >
          Open Markets
        </Link>
      </div>

      <div className="divide-y divide-[var(--tge-governance-muted-border)] md:hidden">
        {analysis.topCountries.slice(0, 5).map((country) => {
          const ratio =
            country.operating_installed_mwe > 0
              ? country.project_pipeline_mwe / country.operating_installed_mwe
              : null;
          const ratioLabel =
            ratio === null ? "Pipeline-led" : `${ratio.toFixed(ratio >= 10 ? 0 : 1)}x`;

          return (
            <Link
              key={country.country}
              href={`/postgres-preview/markets?country=${encodeURIComponent(
                country.country
              )}#market-rankings`}
              className="block px-5 py-4"
            >
              <div className={`font-semibold ${titleTextClass}`}>{country.country}</div>
              <div className={`mt-2 grid grid-cols-2 gap-3 text-xs ${bodyTextClass}`}>
                <span>{formatMw(country.operating_installed_mwe)} MWe operating</span>
                <span>{formatMw(country.project_pipeline_mwe)} MWe pipeline</span>
                <span>{formatCount(country.active_project_count)} active projects</span>
                <span>{ratioLabel} pipeline / operating</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-[760px] table-fixed text-left text-sm">
          <thead className="bg-[var(--tge-governance-neutral-bg)] text-[11px] uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
            <tr>
              <th className="w-[24%] px-5 py-3 font-semibold">Market</th>
              <th className="w-[18%] px-5 py-3 font-semibold">Operating MWe</th>
              <th className="w-[18%] px-5 py-3 font-semibold">Pipeline MWe</th>
              <th className="w-[18%] px-5 py-3 font-semibold">Active Projects</th>
              <th className="w-[22%] px-5 py-3 font-semibold">Pipeline / Operating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--tge-governance-muted-border)]">
            {analysis.topCountries.slice(0, 5).map((country) => {
              const ratio =
                country.operating_installed_mwe > 0
                  ? country.project_pipeline_mwe / country.operating_installed_mwe
                  : null;
              const ratioLabel =
                ratio === null
                  ? "Pipeline-led"
                  : `${ratio.toFixed(ratio >= 10 ? 0 : 1)}x`;

              return (
                <tr key={country.country} className="align-top">
                  <td className="px-5 py-4">
                    <Link
                      className={`font-semibold ${titleTextClass} hover:text-[var(--tge-brand-green-dark)] hover:underline`}
                      href={`/postgres-preview/markets?country=${encodeURIComponent(
                        country.country
                      )}#market-rankings`}
                    >
                      {country.country}
                    </Link>
                  </td>
                  <td className={`px-5 py-4 ${bodyTextClass}`}>
                    {formatMw(country.operating_installed_mwe)} MWe
                  </td>
                  <td className={`px-5 py-4 ${bodyTextClass}`}>
                    {formatMw(country.project_pipeline_mwe)} MWe
                  </td>
                  <td className={`px-5 py-4 ${bodyTextClass}`}>
                    {formatCount(country.active_project_count)}
                  </td>
                  <td className="px-5 py-4">
                    <div className={`text-sm font-bold ${titleTextClass}`}>
                      {ratioLabel}
                    </div>
                    <div className={`mt-1 text-xs leading-5 ${bodyTextClass}`}>
                      {ratio === null
                        ? "No operating base in current view"
                        : "Pipeline capacity vs operating base"}
                    </div>
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

type RegionCapacityRow = {
  region: string;
  operatingMwe: number;
  pipelineMwe: number;
  markets: number;
};

function getRegionCapacityRows(countries: PostgresCountryMarketSummary[]) {
  const rows = new Map<string, RegionCapacityRow>();

  countries.forEach((country) => {
    const region = country.tge_region ?? "Unassigned";
    const current = rows.get(region) ?? {
      region,
      operatingMwe: 0,
      pipelineMwe: 0,
      markets: 0,
    };

    current.operatingMwe += country.operating_installed_mwe;
    current.pipelineMwe += country.project_pipeline_mwe;
    current.markets += 1;
    rows.set(region, current);
  });

  return Array.from(rows.values())
    .sort((a, b) => b.operatingMwe - a.operatingMwe)
    .slice(0, 6);
}

function RegionalCapacityDistribution({
  countries,
}: {
  countries: PostgresCountryMarketSummary[];
}) {
  const rows = getRegionCapacityRows(countries);
  const maxCapacity = Math.max(
    ...rows.map((row) => Math.max(row.operatingMwe, row.pipelineMwe)),
    1
  );

  return (
    <section className={panelClass}>
      <div className={`flex items-center justify-between px-5 py-4 ${panelHeaderClass}`}>
        <div>
          <h2 className={`text-lg font-bold ${titleTextClass}`}>
            Regional Capacity Distribution
          </h2>
          <p className={`mt-1 text-sm leading-6 ${bodyTextClass}`}>
            Operating capacity and pipeline context by TGE region.
          </p>
        </div>
        <Link
          href="/markets/regions"
          className={`text-xs font-semibold uppercase tracking-wide ${linkActionClass}`}
        >
          Regions
        </Link>
      </div>

      <div className="space-y-3 px-5 py-4">
        {rows.map((row) => {
          const operatingWidth = Math.max(4, (row.operatingMwe / maxCapacity) * 100);
          const pipelineWidth = Math.max(4, (row.pipelineMwe / maxCapacity) * 100);
          return (
            <div key={row.region}>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className={`font-semibold ${titleTextClass}`}>{row.region}</span>
                <span className="text-xs font-semibold text-[var(--tge-governance-muted-text)]">
                  {formatMw(row.operatingMwe)} MWe operating
                </span>
              </div>
              <div className="mt-1.5 h-4 overflow-hidden bg-[var(--tge-governance-neutral-bg)]">
                <div
                  className="h-4 bg-[var(--tge-chart-ranking-installed-capacity)]"
                  style={{ width: `${operatingWidth}%` }}
                />
              </div>
              <div className="mt-1 h-2 overflow-hidden bg-[var(--tge-governance-neutral-bg)]">
                <div
                  className="h-2 bg-[var(--tge-chart-ranking-pipeline-capacity)]"
                  style={{ width: `${pipelineWidth}%` }}
                />
              </div>
              <div className={`mt-1 text-xs ${bodyTextClass}`}>
                {formatMw(row.pipelineMwe)} MWe pipeline · {formatCount(row.markets)} markets
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PipelineCompositionModule({
  buckets,
}: {
  buckets: PostgresPreviewAnalysisBucket[];
}) {
  const visibleBuckets = buckets.slice(0, 6);
  const totalMwe = sumElectricCapacity(buckets);
  const totalRecords = sumRecordCount(buckets);
  const maxMwe = Math.max(...visibleBuckets.map((bucket) => bucket.electric_capacity_mwe), 1);

  return (
    <section className={panelClass}>
      <div className={`flex items-center justify-between gap-4 px-5 py-4 ${panelHeaderClass}`}>
        <div>
          <h2 className={`text-lg font-bold ${titleTextClass}`}>
            Global Development Pipeline
          </h2>
          <p className={`mt-1 text-sm leading-6 ${bodyTextClass}`}>
            Pipeline capacity and project count by lifecycle phase.
          </p>
        </div>
        <Link
          href="/postgres-preview/analysis#benchmark-views"
          className={`text-xs font-semibold uppercase tracking-wide ${linkActionClass}`}
        >
          Analysis
        </Link>
      </div>

      <div className="px-5 py-4">
        <div className="flex h-9 overflow-hidden bg-[var(--tge-governance-neutral-bg)]">
          {visibleBuckets.map((bucket) => {
            const width =
              totalMwe > 0 ? (bucket.electric_capacity_mwe / totalMwe) * 100 : 0;
            if (width <= 0) return null;
            return (
              <div
                key={bucket.bucket_code}
                className="h-9"
                style={{
                  width: `${width}%`,
                  backgroundColor: lifecycleChartColor(bucket.bucket_code),
                }}
                title={`${formatBucketLabel(bucket.bucket_code)}: ${formatMw(
                  bucket.electric_capacity_mwe
                )} MWe`}
              />
            );
          })}
        </div>

        <div className="mt-4 space-y-3">
        {visibleBuckets.map((bucket) => {
          const barWidth = Math.max(
            8,
            (bucket.electric_capacity_mwe / maxMwe) * 100
          );

          return (
            <div key={bucket.bucket_code}>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className={`font-semibold ${titleTextClass}`}>
                  {formatBucketLabel(bucket.bucket_code)}
                </span>
                <span className="text-xs text-[var(--tge-governance-muted-text)]">
                  {formatMw(bucket.electric_capacity_mwe)} MWe ·{" "}
                  {formatCount(bucket.record_count)} projects
                </span>
              </div>
              <div className="mt-1.5 h-5 overflow-hidden bg-[var(--tge-governance-neutral-bg)]">
                <div
                  className="h-5"
                  style={{
                    backgroundColor: lifecycleChartColor(bucket.bucket_code),
                    width: `${barWidth}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
        </div>

        <div className={`mt-4 border-t border-[var(--tge-governance-muted-border)] pt-3 text-xs leading-5 ${bodyTextClass}`}>
          {formatMw(totalMwe)} MWe across {formatCount(totalRecords)} tracked projects.
        </div>
      </div>
    </section>
  );
}

function KeyMarketInsight({
  analysis,
  pipelineMwe,
}: {
  analysis: PostgresPreviewAnalysisSummary;
  pipelineMwe: number;
}) {
  const leadingCountry = analysis.topCountries[0];
  const pipelineShare =
    leadingCountry && pipelineMwe > 0
      ? Math.round((leadingCountry.project_pipeline_mwe / pipelineMwe) * 100)
      : null;

  return (
    <section className="border border-[var(--tge-brand-green)] bg-[var(--tge-surface-card)] shadow-sm">
      <div className="border-b border-[var(--tge-governance-success-border)] px-5 py-4">
        <div>
          <h2 className={`text-lg font-bold ${titleTextClass}`}>
            Key Market Insight
          </h2>
          <p className={`mt-1 text-sm leading-6 ${bodyTextClass}`}>
            One interpreted read from the current market structure.
          </p>
        </div>
      </div>

      <div className="grid gap-5 px-5 py-6 lg:grid-cols-[0.72fr_0.28fr] lg:items-center">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--tge-brand-green-dark)]">
            Pipeline concentration
          </div>
          <h3 className={`mt-2 text-2xl font-bold leading-8 ${titleTextClass}`}>
            {leadingCountry
              ? `${leadingCountry.country} represents ${
                  pipelineShare ?? 0
                }% of tracked global pipeline capacity.`
              : "Pipeline concentration will appear once market data is available."}
          </h3>
          <p className={`mt-3 text-sm leading-6 ${bodyTextClass}`}>
            Pipeline concentration signals where development attention is clustering
            before it becomes operating capacity.
          </p>
        </div>
        <Link
          href="/analysis"
          className="inline-flex h-10 items-center justify-center border border-[var(--tge-brand-green)] bg-[var(--tge-surface-card)] px-4 text-xs font-semibold uppercase tracking-wide text-[var(--tge-brand-green-dark)] hover:bg-[var(--tge-governance-success-bg)]"
        >
          View Analysis
        </Link>
      </div>
    </section>
  );
}

function InstalledCapacityTechnologyMix({
  rows,
}: {
  rows: DashboardTechnologyMixRow[];
}) {
  if (rows.length === 0) return null;

  const totalMwe = rows.reduce((total, row) => total + row.installedMwe, 0);

  return (
    <section className={panelClass}>
      <div className={`flex items-center justify-between gap-4 px-5 py-4 ${panelHeaderClass}`}>
        <div>
          <h2 className={`text-lg font-bold ${titleTextClass}`}>
            Installed Capacity by Technology
          </h2>
          <p className={`mt-1 text-sm leading-6 ${bodyTextClass}`}>
            Current operating fleet technology mix by installed MWe.
          </p>
        </div>
        <Link
          href="/analysis/turbine-technology"
          className={`text-xs font-semibold uppercase tracking-wide ${linkActionClass}`}
        >
          Technology
        </Link>
      </div>

      <div className="px-5 py-4">
        <div className="flex h-9 overflow-hidden bg-[var(--tge-governance-neutral-bg)]">
          {rows.map((row) => {
            const width = totalMwe > 0 ? (row.installedMwe / totalMwe) * 100 : 0;
            if (width <= 0) return null;
            return (
              <div
                key={row.label}
                className="h-9"
                style={{ width: `${width}%`, backgroundColor: row.color }}
                title={`${row.label}: ${formatMw(row.installedMwe)} MWe`}
              />
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          {rows.map((row) => {
            const share = totalMwe > 0 ? Math.round((row.installedMwe / totalMwe) * 100) : 0;
            return (
              <div key={row.label} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2.5 w-2.5 shrink-0"
                  style={{ backgroundColor: row.color }}
                />
                <span className={`font-semibold ${titleTextClass}`}>
                  {row.label}
                </span>
                <span className="font-semibold text-[var(--tge-governance-muted-text)]">
                  {formatMw(row.installedMwe)} MWe · {share}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function OperationalPulse({
  staging,
  legacy,
}: {
  staging: StagingDashboardData;
  legacy: LegacyDashboardStats;
}) {
  const readinessEntities = staging.ok ? staging.readiness.entities : [];
  const openIssues = readinessEntities.reduce(
    (total, entity) => total + entity.open_issue_count,
    0
  );
  const criticalIssues = readinessEntities.reduce(
    (total, entity) => total + entity.critical_issue_count,
    0
  );
  const missingSources = readinessEntities.reduce(
    (total, entity) => total + entity.missing_source_count,
    0
  );
  const exportReady = readinessEntities.reduce(
    (total, entity) => total + entity.approved_or_export_ready_count,
    0
  );

  return (
    <section className={panelClass}>
      <div className={`${panelHeaderClass} px-5 py-4`}>
        <h2 className={`text-lg font-bold ${titleTextClass}`}>Operational Pulse</h2>
        <p className={`mt-1 text-sm leading-6 ${bodyTextClass}`}>
          High-level research and governance health without turning the dashboard
          into the work queue.
        </p>
      </div>

      <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 xl:grid-cols-4">
        <ExecutiveKpi
          href="/postgres-preview/research-ops"
          label="Research Issues"
          note={staging.ok ? "Open governance issues" : "Legacy need-info follow-up"}
          value={formatCount(staging.ok ? openIssues : legacy.needInfo)}
        />
        <ExecutiveKpi
          href="/postgres-preview/research-ops"
          label="Critical Issues"
          note={staging.ok ? "Blocking or high-risk items" : "Pending review items"}
          value={formatCount(staging.ok ? criticalIssues : legacy.pendingReviewTotal)}
        />
        <ExecutiveKpi
          href="/sources"
          label="Source Gaps"
          note={staging.ok ? "Projects, plants, or companies missing evidence" : "Evidence layer pending"}
          value={staging.ok ? formatCount(missingSources) : "-"}
        />
        <ExecutiveKpi
          href="/postgres-preview/readiness"
          label="Export-Ready"
          note={staging.ok ? "Approved or export-ready items" : "Legacy approved items"}
          value={formatCount(staging.ok ? exportReady : legacy.approvedTotal)}
        />
      </div>

      {!staging.ok ? (
        <div className="border-t border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] px-5 py-4 text-sm leading-6 text-[var(--tge-governance-attention-text)]">
          Platform intelligence signals are unavailable right now. The dashboard is
          showing legacy SQLite counters where possible. Error: {staging.error}
        </div>
      ) : null}
    </section>
  );
}

export default async function HomePage() {
  const [legacy, staging, technologyMix] = await Promise.all([
    getLegacyDashboardStats(),
    getStagingDashboardData(),
    getDashboardTechnologyMix(),
  ]);

  const operatingMwe = staging.ok
    ? sumElectricCapacity(staging.analysis.operatingAssetStatus)
    : legacy.plantCapacity;
  const pipelineMwe = staging.ok
    ? sumElectricCapacity(staging.analysis.projectLifecycle)
    : legacy.projectCapacity;
  const projectRecords = staging.ok
    ? staging.summary.projectCount
    : legacy.projectCount;
  const plantRecords = staging.ok
    ? staging.summary.operatingAssetCount
    : legacy.plantCount;
  const countriesCovered = staging.ok
    ? staging.analysis.topCountries.length
    : legacy.countries;
  const companiesTracked = staging.ok
    ? staging.summary.companyCount
    : legacy.companyCount;
  const readinessEntities = staging.ok ? staging.readiness.entities : [];
  const readinessRecordCount = readinessEntities.reduce(
    (total, entity) => total + entity.record_count,
    0
  );
  const readinessMissingSources = readinessEntities.reduce(
    (total, entity) => total + entity.missing_source_count,
    0
  );
  const evidenceCoverage =
    staging.ok && readinessRecordCount > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              ((readinessRecordCount - readinessMissingSources) / readinessRecordCount) * 100
            )
          )
        )
      : null;

  return (
    <main className="space-y-6 sm:space-y-7">
      <section className="max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]">
          ThinkGeoEnergy Intelligence
        </p>
        <h1 className={`mt-1 text-2xl font-bold tracking-tight ${titleTextClass}`}>
          Global Geothermal Dashboard
        </h1>
        <p className={`mt-2 text-sm leading-6 ${bodyTextClass}`}>
          Current-state overview of the geothermal market and the main paths for
          drilling into market, entity, spatial, and analytical intelligence.
        </p>
      </section>

      <section id="market-snapshot" className="space-y-3 scroll-mt-24">
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          <ExecutiveKpi
            href="/analysis"
            label="Operating Capacity"
            note="Installed operating capacity signal"
            tone="market-metric"
            value={`${formatMw(operatingMwe)} MWe`}
          />
          <ExecutiveKpi
            href="/postgres-preview/projects"
            label="Pipeline Capacity"
            note="Development pipeline capacity signal"
            tone="market-metric"
            value={`${formatMw(pipelineMwe)} MWe`}
          />
          <ExecutiveKpi
            href="/postgres-preview/projects"
            label="Projects"
            note="Development project universe"
            tone="asset-metric"
            value={formatCount(projectRecords)}
          />
          <ExecutiveKpi
            href="/postgres-preview/operating-assets"
            label="Plants"
            note="Operating fleet intelligence"
            tone="asset-metric"
            value={formatCount(plantRecords)}
          />
          <ExecutiveKpi
            href="/markets"
            label="Markets"
            note={staging.ok ? "Top markets loaded" : "Legacy markets covered"}
            tone="coverage-metric"
            value={formatCount(countriesCovered)}
          />
          <ExecutiveKpi
            href="/postgres-preview/companies"
            label="Companies"
            note="Tracked ecosystem participants"
            tone="asset-metric"
            value={formatCount(companiesTracked)}
          />
          <ExecutiveKpi
            href="/sources"
            label="Evidence Coverage"
            note={
              staging.ok
                ? `${formatCount(readinessMissingSources)} source gaps`
                : "PostgreSQL signal pending"
            }
            tone="coverage-metric"
            value={evidenceCoverage === null ? "-" : `${evidenceCoverage}%`}
          />
        </section>
      </section>

      {staging.ok ? (
        <section id="market-overview" className="space-y-4 scroll-mt-24">
          <SectionHeader
            title="Market Overview"
            description="Where geothermal operating capacity, pipeline activity, and market concentration currently sit."
          />

          <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <div className="space-y-5">
              <MarketSignalTable analysis={staging.analysis} />
              <KeyMarketInsight analysis={staging.analysis} pipelineMwe={pipelineMwe} />
              <InstalledCapacityTechnologyMix rows={technologyMix} />
            </div>
            <div className="space-y-5">
              <RegionalCapacityDistribution countries={staging.countries} />
              <PipelineCompositionModule buckets={staging.analysis.projectLifecycle} />
            </div>
          </section>
        </section>
      ) : null}

      <section id="intelligence-navigation" className="space-y-4 scroll-mt-24">
        <SectionHeader
          title="Drill Into Intelligence"
          description="Primary workspaces for market, entity, spatial, and analytical exploration."
        />

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <GatewayCard href="/markets" meta="Market layer" title="Markets" />
          <GatewayCard href="/postgres-preview/projects" meta="Pipeline" title="Projects" />
          <GatewayCard href="/postgres-preview/operating-assets" meta="Fleet" title="Plants" />
          <GatewayCard href="/postgres-preview/companies" meta="Ecosystem" title="Companies" />
          <GatewayCard href="/analysis" meta="Benchmarks" title="Analysis" />
          <GatewayCard href="/map" meta="Spatial" title="Map Explorer" />
        </section>
      </section>

      <section id="operational-pulse" className="space-y-4 scroll-mt-24">
        <SectionHeader
          title="Internal Operations"
          description="Internal governance and validation signals remain secondary to the market overview."
        />

        <OperationalPulse legacy={legacy} staging={staging} />
      </section>
    </main>
  );
}
