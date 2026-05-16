import Link from "next/link";
import { getDb } from "@/lib/db";
import { formatCount, formatMw } from "@/lib/format";
import ActionButton from "@/components/ui/ActionButton";

async function getDashboardStats() {
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

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="border border-gray-200 bg-white px-4 py-4">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </div>
      <div className="mt-2 text-[24px] font-bold leading-none text-[#1f2937]">
        {value}
      </div>
      {subtitle ? (
        <div className="mt-1 text-[11px] leading-5 text-gray-500">{subtitle}</div>
      ) : null}
    </div>
  );
}

function ScopeCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="border border-gray-200 bg-[#f7f7f7] px-4 py-4">
      <h3 className="text-base font-bold text-[#1f2937]">{title}</h3>
      <p className="mt-2 text-[13px] leading-6 text-gray-600">{text}</p>
    </div>
  );
}

function BuildStep({
  number,
  text,
  isLast = false,
}: {
  number: number;
  text: string;
  isLast?: boolean;
}) {
  return (
    <div className={isLast ? "py-2" : "border-b border-gray-200 py-2"}>
      <span className="font-semibold text-[#1f2937]">{number}.</span> {text}
    </div>
  );
}

export default async function HomePage() {
  const stats = await getDashboardStats();

  return (
    <main className="space-y-8">
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-8 py-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
                ThinkGeoEnergy
              </p>
              <h1 className="mt-3 text-5xl font-bold tracking-tight text-[#1f2937]">
                Geothermal Intelligence Platform
              </h1>
              <p className="mt-4 max-w-4xl text-lg leading-8 text-gray-600">
                Central workspace for geothermal plants, projects, companies,
                and structured research operations, including data validation,
                review workflows, and analytics-ready intelligence.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 xl:justify-end">
              <ActionButton href="/research-ops" variant="primary">
                Open Research Ops
              </ActionButton>
              <ActionButton href="/postgres-preview" variant="secondary">
                Open PostgreSQL Preview
              </ActionButton>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-[#f7f7f7] px-8 py-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 xl:grid-cols-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Plant Records
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {formatCount(stats.plantCount)}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Operating plant entries
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Project Records
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {formatCount(stats.projectCount)}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Development pipeline entries
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Company Records
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {formatCount(stats.companyCount)}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Company profiles and links
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Countries Covered
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {formatCount(stats.countries)}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Plants and projects
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <StatCard
          title="Plant MW"
          value={formatMw(stats.plantCapacity)}
          subtitle="Installed"
        />
        <StatCard
          title="Project MW"
          value={formatMw(stats.projectCapacity)}
          subtitle="Planned"
        />
        <StatCard
          title="HQ Countries"
          value={formatCount(stats.companyCountries)}
          subtitle="Companies"
        />
        <StatCard
          title="Companies Done"
          value={formatCount(stats.companiesDone)}
          subtitle="Research status"
        />
        <StatCard
          title="Need Info"
          value={formatCount(stats.needInfo)}
          subtitle="Follow-up"
        />
        <StatCard
          title="Approved"
          value={formatCount(stats.approvedTotal)}
          subtitle="All datasets"
        />
        <StatCard
          title="Pending Review"
          value={formatCount(stats.pendingReviewTotal)}
          subtitle="All datasets"
        />
        <StatCard
          title="Coverage"
          value={formatCount(stats.plantCount + stats.projectCount + stats.companyCount)}
          subtitle="Total core records"
        />
      </section>

      <div className="px-2 text-sm text-gray-500">
        Use Research Ops to manage data gaps, review workflows, and editor activity across all datasets.
      </div>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="border border-gray-200 bg-white">
          <div className="flex min-h-[48px] items-center border-b border-gray-200 bg-[#f7f7f7] px-5">
            <h2 className="text-lg font-bold leading-none text-[#1f2937]">
              Platform Scope
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 px-5 py-5 md:grid-cols-2">
            <ScopeCard
              title="Plants"
              text="Operating geothermal plant records with overview tables, detail pages, aligned edit forms, metadata tracking, and approval workflows."
            />
            <ScopeCard
              title="Projects"
              text="Geothermal project and prospect records with pipeline visibility, planned capacity, linked company roles, aligned detail pages, and edit workflows."
            />
            <ScopeCard
              title="Companies"
              text="Company profiles with relationships, linked plants and projects, research tracking, approval logic, and overview tables replacing Excel-led editing."
            />
            <ScopeCard
              title="Markets"
              text="Country and regional market pages with capacity snapshots, maps, and structured overview tables for future research and reporting workflows."
            />
            <ScopeCard
              title="Map"
              text="Spatial intelligence layer for plants, projects, and later expanded company and country analysis views."
            />
            <ScopeCard
              title="Admin / QA"
              text="Internal workflows for import, user permissions, quality control, exports, review approvals, and later employee-only management tools."
            />
          </div>
        </div>

        <div className="space-y-6">
          <section className="border border-gray-200 bg-white">
            <div className="flex min-h-[48px] items-center border-b border-gray-200 bg-[#f7f7f7] px-5">
              <h2 className="text-lg font-bold leading-none text-[#1f2937]">
                Company Progress
              </h2>
            </div>

            <div className="px-5 py-5">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Records marked as Done
              </div>
              <div className="mt-2 text-[32px] font-bold leading-none text-[#1f2937]">
                {formatCount(stats.companiesDone)}
              </div>
              <div className="mt-2 text-[12px] text-gray-500">
                Company records currently marked as Done
              </div>
            </div>
          </section>
        </div>
      </section>

      <div className="h-4" />
    </main>
  );
}
