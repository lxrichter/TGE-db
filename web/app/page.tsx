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
import ActionButton from "@/components/ui/ActionButton";
import { DetailPriorityMarker } from "@/components/postgres-preview/PostgresEntityDetail";
import PostgresSectionJumpNav from "@/components/postgres-preview/PostgresSectionJumpNav";
import PostgresRegionalWorklistRoutes from "@/components/postgres-preview/PostgresRegionalWorklistRoutes";
import {
  postgresStatusBarClass,
  postgresStatusTone,
} from "@/components/postgres-preview/PostgresStatusBadge";

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

function sumThermalCapacity(buckets: PostgresPreviewAnalysisBucket[]) {
  return buckets.reduce((total, bucket) => total + bucket.thermal_capacity_mwth, 0);
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

function isDirectUseBucket(bucket: PostgresPreviewAnalysisBucket) {
  return bucket.bucket_code.toLowerCase().includes("direct");
}

function isHybridOrMineralBucket(bucket: PostgresPreviewAnalysisBucket) {
  const value = bucket.bucket_code.toLowerCase();
  return (
    value.includes("hybrid") ||
    value.includes("mineral") ||
    value.includes("lithium")
  );
}

type ExecutiveKpiTone =
  | "neutral"
  | "operating"
  | "pipeline"
  | "market"
  | "ecosystem"
  | "direct-use"
  | "governance"
  | "evidence";

const panelClass =
  "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]";
const panelHeaderClass =
  "border-b border-[var(--tge-governance-neutral-border)]";
const subtleCardClass =
  "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)]";
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
      return "border-l-[var(--tge-status-bar-operating)] bg-[var(--tge-governance-success-bg)]";
    case "pipeline":
      return "border-l-[var(--tge-governance-info-text)] bg-[var(--tge-governance-info-bg)]";
    case "market":
      return "border-l-[var(--tge-status-bar-attention)] bg-[var(--tge-governance-attention-bg)]";
    case "ecosystem":
      return "border-l-[var(--tge-governance-neutral-text)] bg-[var(--tge-surface-subtle)]";
    case "direct-use":
      return "border-l-[var(--tge-ai-suggested-text)] bg-[var(--tge-ai-suggested-bg)]";
    case "governance":
      return "border-l-[var(--tge-governance-attention-text)] bg-[var(--tge-governance-attention-bg)]";
    case "evidence":
      return "border-l-[var(--tge-brand-green-dark)] bg-[var(--tge-governance-success-bg)]";
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
      ? `border border-l-4 border-[var(--tge-governance-neutral-border)] ${toneClass} px-5 py-5 sm:min-h-[148px] sm:px-6 sm:py-6`
      : `border border-l-4 border-[var(--tge-governance-neutral-border)] ${toneClass} px-4 py-4`;
  const valueClass =
    prominence === "executive"
      ? `mt-4 text-4xl font-bold leading-none ${titleTextClass} sm:text-[2.85rem]`
      : `mt-3 text-2xl font-bold leading-none ${titleTextClass} sm:text-3xl`;
  const noteClass =
    prominence === "executive"
      ? `mt-3 text-sm leading-6 ${bodyTextClass}`
      : "mt-2 text-xs leading-5 text-[var(--tge-governance-muted-text)]";

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

function IntelligenceCard({
  label,
  title,
  description,
  href,
  meta,
}: {
  label: string;
  title: string;
  description: string;
  href: string;
  meta: string;
}) {
  return (
    <Link
      href={href}
      className={`${panelClass} px-5 py-5 ${dashboardHoverClass}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className={eyebrowClass}>
            {label}
          </div>
          <h3 className={`mt-2 text-lg font-bold ${titleTextClass}`}>{title}</h3>
        </div>
        <span className="shrink-0 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
          {meta}
        </span>
      </div>
      <p className={`mt-3 text-sm leading-6 ${bodyTextClass}`}>{description}</p>
      <div className={`mt-4 text-xs font-semibold uppercase tracking-wide ${linkActionClass}`}>
        Open
      </div>
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
          <h2 className={`text-lg font-bold ${titleTextClass}`}>Top Market Signals</h2>
          <p className={`mt-1 text-sm leading-6 ${bodyTextClass}`}>
            Highest-capacity market signals from the current intelligence layer.
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
      <div className="space-y-4 px-5 py-5">
        {visibleBuckets.map((bucket) => {
          const barClass = useLifecycleColors
            ? postgresStatusBarClass(
                postgresStatusTone(bucket.bucket_code, "lifecycle")
              )
            : "bg-[var(--tge-status-bar-success)]";

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
              <div className="mt-2 h-2 bg-[var(--tge-governance-neutral-bg)]">
                <div
                  className={`h-2 ${barClass}`}
                  style={{
                    width: `${Math.max(
                      8,
                      (bucket.record_count / maxCount) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RecentIntelligenceSignals() {
  const signals = [
    {
      category: "Project announcement",
      title: "New project or expansion signals",
      detail: "Future feed from TGE articles and confirmed project/source links.",
      href: "/sources/matches",
    },
    {
      category: "Drilling / construction",
      title: "Field activity and construction progress",
      detail: "Future feed for drilling campaigns, construction starts, and status changes.",
      href: "/postgres-preview/projects?review=needs_update",
    },
    {
      category: "Financing / funding",
      title: "Capital raises, grants, and public funding",
      detail: "Future feed from article fact candidates and source-backed financing signals.",
      href: "/sources/facts",
    },
    {
      category: "Policy / tender",
      title: "Policy, tenders, incentives, and market support",
      detail: "Future feed connected to Markets and related news.",
      href: "/markets",
    },
    {
      category: "Plant activity",
      title: "Commissioning, shutdowns, and operating changes",
      detail: "Future feed for plant updates, source evidence, and review queues.",
      href: "/postgres-preview/operating-assets",
    },
  ];

  return (
    <section className={panelClass}>
      <div className={`flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between ${panelHeaderClass}`}>
        <div>
          <h2 className={`text-lg font-bold ${titleTextClass}`}>
            Recent Intelligence Signals
          </h2>
          <p className={`mt-1 text-sm leading-6 ${bodyTextClass}`}>
            Compact placeholder for future source-backed market pulse items.
          </p>
        </div>
        <Link
          href="/sources"
          className="inline-flex h-9 items-center justify-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)]"
        >
          Evidence Backbone
        </Link>
      </div>

      <div className="grid gap-3 px-5 py-5 xl:grid-cols-5">
        {signals.map((signal) => (
          <Link
            key={signal.category}
            href={signal.href}
            className={`${subtleCardClass} px-4 py-4 ${dashboardHoverClass}`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--tge-brand-green-dark)]">
              {signal.category}
            </div>
            <h3 className={`mt-2 text-sm font-bold leading-5 ${titleTextClass}`}>
              {signal.title}
            </h3>
            <p className={`mt-2 text-xs leading-5 ${bodyTextClass}`}>
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
  const directUseBuckets = staging.ok
    ? staging.analysis.useTypeBreakdown.filter(isDirectUseBucket)
    : [];
  const hybridBuckets = staging.ok
    ? staging.analysis.useTypeBreakdown.filter(isHybridOrMineralBucket)
    : [];
  const directUseRecords = sumRecordCount(directUseBuckets);
  const directUseThermal = sumThermalCapacity(directUseBuckets);
  const hybridRecords = sumRecordCount(hybridBuckets);
  const countriesCovered = staging.ok
    ? staging.analysis.topCountries.length
    : legacy.countries;
  const companiesTracked = staging.ok
    ? staging.summary.companyCount
    : legacy.companyCount;

  return (
    <main className="space-y-7 sm:space-y-8">
      <section className={panelClass}>
        <div className="border-l-4 border-l-[var(--tge-brand-green)] px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-5xl">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]">
                ThinkGeoEnergy Intelligence
              </p>
              <h1 className={`mt-3 text-3xl font-bold tracking-tight ${titleTextClass} xl:text-[2.75rem]`}>
                Global Geothermal Intelligence Dashboard
              </h1>
              <p className={`mt-3 max-w-5xl text-base leading-7 ${bodyTextClass}`}>
                Executive view of global geothermal market scale, pipeline
                momentum, regional signals, spatial intelligence, and
                evidence-backed confidence across the evolving TGE intelligence
                platform.
              </p>
            </div>

            <div className="grid gap-2 sm:flex sm:flex-wrap xl:justify-end">
              <ActionButton href="/markets" variant="primary">
                Open Markets
              </ActionButton>
              <ActionButton href="/analysis" variant="primary">
                Open Analysis
              </ActionButton>
              <ActionButton href="/map" variant="secondary">
                Map Explorer
              </ActionButton>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-5 py-4 sm:px-8">
          <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 text-sm ${bodyTextClass}`}>
            <span className="font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
              Dashboard Scope
            </span>
            <span>
              <span className={`font-medium ${titleTextClass}`}>Market signals</span>
              <span className="mx-2 text-[var(--tge-governance-muted-border)]">|</span>
              operating, pipeline, direct-use
            </span>
            <span>
              <span className={`font-medium ${titleTextClass}`}>Evidence</span>
              <span className="mx-2 text-[var(--tge-governance-muted-border)]">|</span>
              source-aware governance
            </span>
            <span>
              <span className={`font-medium ${titleTextClass}`}>Spatial intelligence</span>
              <span className="mx-2 text-[var(--tge-governance-muted-border)]">|</span>
              map-first exploration
            </span>
          </div>
        </div>
      </section>

      <PostgresSectionJumpNav
        items={[
          { href: "#market-snapshot", label: "Snapshot", note: "KPIs" },
          { href: "#intelligence-layers", label: "Layers", note: "Views" },
          { href: "#market-signals", label: "Signals", note: "Markets" },
          { href: "#recent-intelligence", label: "Recent", note: "Pulse" },
          { href: "#operational-pulse", label: "Pulse", note: "Readiness" },
        ]}
      />

      <section id="market-snapshot" className="space-y-4 scroll-mt-24">
        <DetailPriorityMarker
          label="Core"
          title="Global Market Snapshot"
          description="Executive-level geothermal capacity, market, and ecosystem signals."
          tone="core"
        />

        <section className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <ExecutiveKpi
            href="/analysis"
            label="Operating MWe"
            note="Installed operating capacity signal"
            prominence="executive"
            tone="operating"
            value={`${formatMw(operatingMwe)} MWe`}
          />
          <ExecutiveKpi
            href="/postgres-preview/projects"
            label="Pipeline MWe"
            note="Development pipeline capacity signal"
            prominence="executive"
            tone="pipeline"
            value={`${formatMw(pipelineMwe)} MWe`}
          />
          <ExecutiveKpi
            href="/postgres-preview/projects"
            label="Projects"
            note="Projects in platform scope"
            prominence="executive"
            tone="pipeline"
            value={formatCount(projectRecords)}
          />
          <ExecutiveKpi
            href="/postgres-preview/operating-assets"
            label="Plants"
            note="Plants in platform scope"
            prominence="executive"
            tone="operating"
            value={formatCount(plantRecords)}
          />
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
            href="/analysis"
            label="Direct Use"
            note={
              staging.ok
                ? `${formatMw(directUseThermal)} MWth signal`
                : "PostgreSQL signal pending"
            }
            tone="direct-use"
            value={staging.ok ? formatCount(directUseRecords) : "-"}
          />
        </section>
      </section>

      <section id="intelligence-layers" className="space-y-4 scroll-mt-24">
        <DetailPriorityMarker
          label="Intelligence"
          title="Intelligence Layers"
          description="Dashboard highlights the market layer; operational work stays routed to deeper modules."
          tone="workflow"
        />

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <IntelligenceCard
            description="Regional and market views with operating capacity, pipeline, evidence gaps, and source-aware market signals."
            href="/markets"
            label="Market Intelligence"
            meta="Markets"
            title="Markets"
          />
          <IntelligenceCard
            description="Spatial view of coordinate-confirmed projects and plants, with Research Ops handling missing coordinates."
            href="/map"
            label="Spatial Intelligence"
            meta="Map"
            title="Map Explorer"
          />
          <IntelligenceCard
            description="Cross-database benchmarking for lifecycle, operating status, use type, and market comparison."
            href="/analysis"
            label="Analytical Layer"
            meta="BI"
            title="Analysis"
          />
          <IntelligenceCard
            description="Governed sources, article matches, and fact candidates that underpin future AI-assisted research."
            href="/sources"
            label="Evidence Layer"
            meta="Sources"
            title="Evidence Backbone"
          />
        </section>
      </section>

      {staging.ok ? (
        <section id="market-signals" className="space-y-4 scroll-mt-24">
          <DetailPriorityMarker
            label="Signals"
            title="Market And Pipeline Signals"
            description="Readable high-level slices before users drill into Analysis or Markets."
            tone="core"
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
                title="Project Lifecycle"
                useLifecycleColors
              />
              <BucketOverview
                buckets={staging.analysis.operatingAssetStatus}
                href="/postgres-preview/analysis#benchmark-views"
                title="Operating Status"
                useLifecycleColors
              />
            </div>
          </section>
        </section>
      ) : null}

      <section id="recent-intelligence" className="space-y-4 scroll-mt-24">
        <DetailPriorityMarker
          label="Intelligence"
          title="Recent Intelligence Signals"
          description="A controlled shell for the future market pulse feed from TGE articles, governed sources, and confirmed evidence."
          tone="workflow"
        />

        <RecentIntelligenceSignals />
      </section>

      <section id="operational-pulse" className="space-y-4 scroll-mt-24">
        <DetailPriorityMarker
          label="Governance"
          title="Operational Pulse"
          description="The dashboard shows attention signals; Research Ops remains the command center for action."
          tone="governance"
        />

        <OperationalPulse legacy={legacy} staging={staging} />

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <IntelligenceCard
            description="Use this for queues, assignments, validation work, source gaps, AI review, and export blockers."
            href="/postgres-preview/research-ops"
            label="Operations"
            meta="Action"
            title="Research Ops"
          />
          <IntelligenceCard
            description="Use this for operational navigation across platform work areas and preview samples."
            href="/postgres-preview"
            label="Navigation"
            meta="Control"
            title="Command Center"
          />
          <IntelligenceCard
            description="Use this for cutover signals, data quality gates, migration checks, and replacement readiness."
            href="/postgres-preview/readiness"
            label="Governance"
            meta="Cutover"
            title="Replacement Readiness"
          />
          <IntelligenceCard
            description={`Hybrid/mineral activity signal: ${
              staging.ok ? formatCount(hybridRecords) : "PostgreSQL pending"
            } items.`}
            href="/analysis"
            label="Emerging Sectors"
            meta="Future"
            title="Hybrid / Mineral Signal"
          />
        </section>
      </section>
    </main>
  );
}
