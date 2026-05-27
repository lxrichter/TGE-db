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

function getExecutiveKpiToneClass(tone: ExecutiveKpiTone) {
  switch (tone) {
    case "operating":
      return "border-l-[#3f8f2f] bg-[#fbfdf8]";
    case "pipeline":
      return "border-l-[#2f6f9f] bg-[#f8fbfd]";
    case "market":
      return "border-l-[#b58900] bg-[#fffdf5]";
    case "ecosystem":
      return "border-l-[#5b6b7f] bg-[#fafafa]";
    case "direct-use":
      return "border-l-[#8a6f2a] bg-[#fffdf6]";
    case "governance":
      return "border-l-[#b45309] bg-[#fffaf4]";
    case "evidence":
      return "border-l-[#4f7f1f] bg-[#fbfdf8]";
    case "neutral":
    default:
      return "border-l-gray-200 bg-white";
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
      ? `border border-l-4 border-gray-200 ${toneClass} px-5 py-5 sm:min-h-[148px] sm:px-6 sm:py-6`
      : `border border-l-4 border-gray-200 ${toneClass} px-4 py-4`;
  const valueClass =
    prominence === "executive"
      ? "mt-4 text-4xl font-bold leading-none text-[#1f2937] sm:text-[2.85rem]"
      : "mt-3 text-2xl font-bold leading-none text-[#1f2937] sm:text-3xl";
  const noteClass =
    prominence === "executive"
      ? "mt-3 text-sm leading-6 text-gray-600"
      : "mt-2 text-xs leading-5 text-gray-500";

  const content = (
    <>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
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
        className={`${frameClass} transition hover:border-[#8dc63f] hover:bg-[#fbfdf8]`}
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
      className="border border-gray-200 bg-white px-5 py-5 transition hover:border-[#8dc63f] hover:bg-[#fbfdf8]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {label}
          </div>
          <h3 className="mt-2 text-lg font-bold text-[#1f2937]">{title}</h3>
        </div>
        <span className="shrink-0 border border-gray-200 bg-[#f7f7f7] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          {meta}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-gray-600">{description}</p>
      <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#4f7f1f]">
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
    <section className="border border-gray-200 bg-white">
      <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1f2937]">Top Market Signals</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Highest-capacity market signals from PostgreSQL staging.
          </p>
        </div>
        <Link
          href="/postgres-preview/markets"
          className="inline-flex h-9 items-center justify-center border border-[#8dc63f] bg-white px-3 text-xs font-semibold uppercase tracking-wide text-[#4f7f1f] hover:bg-[#f3f8ec]"
        >
          Open Markets
        </Link>
      </div>

      <div className="divide-y divide-gray-100 md:hidden">
        {analysis.topCountries.slice(0, 5).map((country) => (
          <Link
            key={country.country}
            href={`/postgres-preview/markets?country=${encodeURIComponent(
              country.country
            )}`}
            className="block px-5 py-4"
          >
            <div className="font-semibold text-[#1f2937]">{country.country}</div>
            <div className="mt-2 grid grid-cols-2 gap-3 text-xs text-gray-600">
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
          <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-[24%] px-5 py-3 font-semibold">Market</th>
              <th className="w-[18%] px-5 py-3 font-semibold">Operating MWe</th>
              <th className="w-[18%] px-5 py-3 font-semibold">Pipeline MWe</th>
              <th className="w-[18%] px-5 py-3 font-semibold">Active Projects</th>
              <th className="w-[22%] px-5 py-3 font-semibold">Evidence Signal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {analysis.topCountries.slice(0, 5).map((country) => (
              <tr key={country.country} className="align-top">
                <td className="px-5 py-4">
                  <Link
                    className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                    href={`/postgres-preview/markets?country=${encodeURIComponent(
                      country.country
                    )}`}
                  >
                    {country.country}
                  </Link>
                </td>
                <td className="px-5 py-4 text-gray-700">
                  {formatMw(country.operating_installed_mwe)} MWe
                </td>
                <td className="px-5 py-4 text-gray-700">
                  {formatMw(country.project_pipeline_mwe)} MWe
                </td>
                <td className="px-5 py-4 text-gray-700">
                  {formatCount(country.active_project_count)}
                </td>
                <td className="px-5 py-4 text-gray-700">
                  <div>{formatCount(country.missing_source_count)} source gaps</div>
                  <Link
                    className="mt-2 inline-flex text-xs font-semibold uppercase tracking-wide text-[#4f7f1f] hover:underline"
                    href={`/postgres-preview/markets?country=${encodeURIComponent(
                      country.country
                    )}`}
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
    <section className="border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-bold text-[#1f2937]">{title}</h2>
        <Link
          href={href}
          className="text-xs font-semibold uppercase tracking-wide text-[#4f7f1f]"
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
            : "bg-[#8dc63f]";

          return (
            <div key={bucket.bucket_code}>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-semibold text-[#1f2937]">
                  {formatBucketLabel(bucket.bucket_code)}
                </span>
                <span className="text-xs text-gray-500">
                  {formatCount(bucket.record_count)} records
                </span>
              </div>
              <div className="mt-2 h-2 bg-gray-100">
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
      href: "/postgres-preview/markets",
    },
    {
      category: "Plant activity",
      title: "Commissioning, shutdowns, and operating changes",
      detail: "Future feed for plant updates, source evidence, and review queues.",
      href: "/postgres-preview/operating-assets",
    },
  ];

  return (
    <section className="border border-gray-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1f2937]">
            Recent Intelligence Signals
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Compact placeholder for future source-backed market pulse items.
          </p>
        </div>
        <Link
          href="/sources"
          className="inline-flex h-9 items-center justify-center border border-gray-300 bg-white px-3 text-xs font-semibold uppercase tracking-wide text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
        >
          Evidence Backbone
        </Link>
      </div>

      <div className="grid gap-3 px-5 py-5 xl:grid-cols-5">
        {signals.map((signal) => (
          <Link
            key={signal.category}
            href={signal.href}
            className="border border-gray-200 bg-[#f7f7f7] px-4 py-4 transition hover:border-[#8dc63f] hover:bg-[#fbfdf8]"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[#4f7f1f]">
              {signal.category}
            </div>
            <h3 className="mt-2 text-sm font-bold leading-5 text-[#1f2937]">
              {signal.title}
            </h3>
            <p className="mt-2 text-xs leading-5 text-gray-600">{signal.detail}</p>
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
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-bold text-[#1f2937]">Operational Pulse</h2>
        <p className="mt-1 text-sm leading-6 text-gray-600">
          High-level research and governance health without turning the dashboard
          into the work queue.
        </p>
      </div>

      <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 xl:grid-cols-4">
        <ExecutiveKpi
          href="/postgres-preview/research-ops"
          label="Research Issues"
          note={staging.ok ? "Open PostgreSQL staging issues" : "Legacy need-info follow-up"}
          value={formatCount(staging.ok ? openIssues : legacy.needInfo)}
        />
        <ExecutiveKpi
          href="/postgres-preview/research-ops"
          label="Critical Issues"
          note={staging.ok ? "Blocking or high-risk records" : "Pending review records"}
          value={formatCount(staging.ok ? criticalIssues : legacy.pendingReviewTotal)}
        />
        <ExecutiveKpi
          href="/sources"
          label="Source Gaps"
          note={staging.ok ? "Records missing source evidence" : "Evidence layer pending"}
          value={staging.ok ? formatCount(missingSources) : "-"}
        />
        <ExecutiveKpi
          href="/postgres-preview/readiness"
          label="Export-Ready"
          note={staging.ok ? "Approved/export-ready staging records" : "Legacy approved records"}
          value={formatCount(staging.ok ? exportReady : legacy.approvedTotal)}
        />
      </div>

      {!staging.ok ? (
        <div className="border-t border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
          PostgreSQL staging signals are unavailable right now. The dashboard is
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
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-5xl">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
                ThinkGeoEnergy Intelligence
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#1f2937] sm:text-5xl">
                Geothermal Intelligence Dashboard
              </h1>
              <p className="mt-4 max-w-4xl text-base leading-7 text-gray-600 sm:text-lg sm:leading-8">
                Executive view of global geothermal market signals, pipeline
                momentum, evidence health, and operational readiness across the
                evolving PostgreSQL intelligence platform.
              </p>
            </div>

            <div className="grid gap-2 sm:flex sm:flex-wrap xl:justify-end">
              <ActionButton href="/postgres-preview/analysis" variant="primary">
                Open Analysis
              </ActionButton>
              <ActionButton href="/postgres-preview" variant="secondary">
                Command Center
              </ActionButton>
              <ActionButton href="/postgres-preview/research-ops" variant="secondary">
                Research Ops
              </ActionButton>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-[#f7f7f7] px-5 py-4 sm:px-8">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-700">
            <span className="font-semibold uppercase tracking-wide text-gray-500">
              Dashboard Scope
            </span>
            <span>
              <span className="font-medium text-[#1f2937]">Market signals</span>
              <span className="mx-2 text-gray-300">|</span>
              operating, pipeline, direct-use
            </span>
            <span>
              <span className="font-medium text-[#1f2937]">Evidence</span>
              <span className="mx-2 text-gray-300">|</span>
              source-aware governance
            </span>
            <span>
              <span className="font-medium text-[#1f2937]">Operational work</span>
              <span className="mx-2 text-gray-300">|</span>
              routed to Research Ops
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
            href="/postgres-preview/analysis"
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
            note="Project records in staging scope"
            prominence="executive"
            tone="pipeline"
            value={formatCount(projectRecords)}
          />
          <ExecutiveKpi
            href="/postgres-preview/operating-assets"
            label="Plants"
            note="Plant records in staging scope"
            prominence="executive"
            tone="operating"
            value={formatCount(plantRecords)}
          />
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ExecutiveKpi
            href="/postgres-preview/markets"
            label="Markets"
            note={staging.ok ? "Top market profiles loaded" : "Legacy countries covered"}
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
            href="/postgres-preview/analysis"
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
            description="Country and regional market views with operating capacity, pipeline, evidence gaps, and source-aware market signals."
            href="/postgres-preview/markets"
            label="Market Intelligence"
            meta="Markets"
            title="Markets"
          />
          <IntelligenceCard
            description="Spatial view of coordinate-confirmed projects and plants, with Research Ops handling missing coordinates."
            href="/postgres-preview/map"
            label="Spatial Intelligence"
            meta="Map"
            title="Geothermal Map"
          />
          <IntelligenceCard
            description="Cross-database benchmarking for lifecycle, operating status, use type, and country comparison."
            href="/postgres-preview/analysis"
            label="Analytical Layer"
            meta="BI"
            title="Analysis"
          />
          <IntelligenceCard
            description="Governed source records, article matches, and fact candidates that underpin future AI-assisted research."
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
          description="A controlled shell for the future market pulse feed from TGE articles, source records, and confirmed evidence."
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
            description="Use this for operational navigation across PostgreSQL staging modules and preview records."
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
            } records.`}
            href="/postgres-preview/analysis"
            label="Emerging Sectors"
            meta="Future"
            title="Hybrid / Mineral Signal"
          />
        </section>
      </section>
    </main>
  );
}
