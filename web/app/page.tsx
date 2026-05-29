import Link from "next/link";
import { getDb } from "@/lib/db";
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
import PostgresRegionalWorklistRoutes from "@/components/postgres-preview/PostgresRegionalWorklistRoutes";
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

function formatBucketLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\bmwe\b/gi, "MWe")
    .replace(/\bmwth\b/gi, "MWth")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

type ExecutiveKpiTone =
  | "neutral"
  | "operating"
  | "pipeline"
  | "market"
  | "ecosystem"
  | "governance"
  | "evidence";

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
    case "operating":
      return "border-l-[var(--tge-chart-ranking-installed-capacity)] bg-[var(--tge-surface-card)]";
    case "pipeline":
      return "border-l-[var(--tge-chart-ranking-pipeline-capacity)] bg-[var(--tge-surface-card)]";
    case "market":
      return "border-l-[var(--tge-chart-ranking-market-count)] bg-[var(--tge-surface-card)]";
    case "ecosystem":
      return "border-l-[var(--tge-chart-ranking-attributed-mw)] bg-[var(--tge-surface-card)]";
    case "governance":
      return "border-l-[var(--tge-chart-governance-needs-review)] bg-[var(--tge-surface-card)]";
    case "evidence":
      return "border-l-[var(--tge-brand-green-dark)] bg-[var(--tge-surface-card)]";
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
        {analysis.topCountries.slice(0, 5).map((country) => (
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
              <span>{formatCount(country.missing_source_count)} source gaps</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-[760px] table-fixed text-left text-sm">
          <thead className="bg-[var(--tge-governance-neutral-bg)] text-[11px] uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
            <tr>
              <th className="w-[24%] px-5 py-3 font-semibold">Market</th>
              <th className="w-[18%] px-5 py-3 font-semibold">Operating MWe</th>
              <th className="w-[18%] px-5 py-3 font-semibold">Pipeline MWe</th>
              <th className="w-[18%] px-5 py-3 font-semibold">Active Projects</th>
              <th className="w-[22%] px-5 py-3 font-semibold">Evidence Signal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--tge-governance-muted-border)]">
            {analysis.topCountries.slice(0, 5).map((country) => (
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
                <td className={`px-5 py-4 ${bodyTextClass}`}>
                  <div>{formatCount(country.missing_source_count)} source gaps</div>
                  <Link
                    className={`mt-2 inline-flex text-xs font-semibold uppercase tracking-wide ${linkActionClass} hover:underline`}
                    href={`/postgres-preview/markets?country=${encodeURIComponent(
                      country.country
                    )}#market-rankings`}
                  >
                    Open Market
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BucketOverview({
  title,
  buckets,
  href,
  useLifecycleColors = false,
}: {
  title: string;
  buckets: PostgresPreviewAnalysisBucket[];
  href: string;
  useLifecycleColors?: boolean;
}) {
  const visibleBuckets = buckets.slice(0, 5);
  const maxCount = Math.max(...visibleBuckets.map((bucket) => bucket.record_count), 1);

  return (
    <section className={panelClass}>
      <div className={`flex items-center justify-between px-5 py-4 ${panelHeaderClass}`}>
        <h2 className={`text-lg font-bold ${titleTextClass}`}>{title}</h2>
        <Link
          href={href}
          className={`text-xs font-semibold uppercase tracking-wide ${linkActionClass}`}
        >
          Analysis
        </Link>
      </div>
      <div className="space-y-3 px-5 py-4">
        {visibleBuckets.map((bucket) => {
          const barColor = useLifecycleColors
            ? lifecycleChartColor(bucket.bucket_code)
            : "var(--tge-chart-ranking-installed-capacity)";
          const barWidth = Math.max(
            8,
            (bucket.record_count / maxCount) * 100
          );

          return (
            <div key={bucket.bucket_code}>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className={`font-semibold ${titleTextClass}`}>
                  {formatBucketLabel(bucket.bucket_code)}
                </span>
                <span className="text-xs text-[var(--tge-governance-muted-text)]">
                  {formatCount(bucket.record_count)} items
                </span>
              </div>
              <div className="mt-1.5 h-5 overflow-hidden bg-[var(--tge-governance-neutral-bg)]">
                <div
                  className="flex h-5 items-center justify-end pr-2"
                  style={{
                    backgroundColor: barColor,
                    width: `${barWidth}%`,
                  }}
                >
                  {barWidth >= 34 ? (
                    <span className="text-[10px] font-bold text-[var(--tge-surface-card)]">
                      {formatCount(bucket.record_count)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function IntelligenceSummary() {
  const signals = [
    {
      category: "Featured Analysis",
      title: "Developer attribution logic is now live for validation.",
      detail: "Relationship-based developer ranking is available as an internal analysis module.",
      href: "/analysis/developers",
    },
    {
      category: "Market Context",
      title: "Markets and regions now use TGE geography as the primary taxonomy.",
      detail: "Country and regional drilldowns are structured around geothermal market intelligence.",
      href: "/markets",
    },
    {
      category: "Evidence Context",
      title: "Source-backed article matching and fact review support future signals.",
      detail: "Evidence workflows remain governed below the subscriber-facing intelligence layer.",
      href: "/sources",
    },
  ];

  return (
    <section className={panelClass}>
      <div className={`px-5 py-4 ${panelHeaderClass}`}>
        <div>
          <h2 className={`text-lg font-bold ${titleTextClass}`}>
            Intelligence Summary
          </h2>
          <p className={`mt-1 text-sm leading-6 ${bodyTextClass}`}>
            Small current-context layer. Market overview remains the dashboard focus.
          </p>
        </div>
      </div>

      <div className="divide-y divide-[var(--tge-governance-muted-border)]">
        {signals.map((signal) => (
          <Link
            key={signal.category}
            href={signal.href}
            className={`grid gap-2 px-5 py-4 md:grid-cols-[0.22fr_0.36fr_0.42fr] ${dashboardHoverClass}`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--tge-brand-green-dark)]">
              {signal.category}
            </div>
            <h3 className={`text-sm font-bold leading-5 ${titleTextClass}`}>
              {signal.title}
            </h3>
            <p className={`text-xs leading-5 ${bodyTextClass}`}>
              {signal.detail}
            </p>
          </Link>
        ))}
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
  const [legacy, staging] = await Promise.all([
    getLegacyDashboardStats(),
    getStagingDashboardData(),
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
            tone="operating"
            value={`${formatMw(operatingMwe)} MWe`}
          />
          <ExecutiveKpi
            href="/postgres-preview/projects"
            label="Pipeline Capacity"
            note="Development pipeline capacity signal"
            tone="pipeline"
            value={`${formatMw(pipelineMwe)} MWe`}
          />
          <ExecutiveKpi
            href="/postgres-preview/projects"
            label="Projects"
            note="Development project universe"
            tone="pipeline"
            value={formatCount(projectRecords)}
          />
          <ExecutiveKpi
            href="/postgres-preview/operating-assets"
            label="Plants"
            note="Operating fleet intelligence"
            tone="operating"
            value={formatCount(plantRecords)}
          />
          <ExecutiveKpi
            href="/markets"
            label="Markets"
            note={staging.ok ? "Top markets loaded" : "Legacy markets covered"}
            tone="market"
            value={formatCount(countriesCovered)}
          />
          <ExecutiveKpi
            href="/postgres-preview/companies"
            label="Companies"
            note="Tracked ecosystem participants"
            tone="ecosystem"
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
            tone="evidence"
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
            <MarketSignalTable analysis={staging.analysis} />
            <div className="space-y-5">
              <PostgresRegionalWorklistRoutes
                countries={staging.countries}
                description="Top regional paths into market context and filtered entity worklists."
                limit={3}
                title="Regional Drilldowns"
              />
              <BucketOverview
                buckets={staging.analysis.projectLifecycle}
                href="/postgres-preview/analysis#benchmark-views"
                title="Pipeline Composition"
                useLifecycleColors
              />
              <BucketOverview
                buckets={staging.analysis.operatingAssetStatus}
                href="/postgres-preview/analysis#benchmark-views"
                title="Operating Fleet Status"
                useLifecycleColors
              />
            </div>
          </section>
        </section>
      ) : null}

      <section id="intelligence-summary" className="space-y-4 scroll-mt-24">
        <SectionHeader
          title="Intelligence Summary"
          description="Limited context layer below the market overview. This should not become a news feed."
        />

        <IntelligenceSummary />
      </section>

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
