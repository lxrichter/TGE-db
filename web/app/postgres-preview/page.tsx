import Link from "next/link";
import {
  getPostgresPreviewSummary,
  listPostgresCountryMarketSummaries,
  listPostgresPreviewCompanies,
  listPostgresPreviewOperatingAssets,
  listPostgresPreviewProjects,
  type PostgresCountryMarketSummary,
  type PostgresPreviewCompany,
  type PostgresPreviewOperatingAsset,
  type PostgresPreviewProject,
  type PostgresPreviewSummary,
} from "@/lib/postgres-preview";
import { formatCount, formatMw } from "@/lib/format";
import { DetailPriorityMarker } from "@/components/postgres-preview/PostgresEntityDetail";
import PostgresSectionJumpNav from "@/components/postgres-preview/PostgresSectionJumpNav";
import PostgresRegionalWorklistRoutes from "@/components/postgres-preview/PostgresRegionalWorklistRoutes";
import PostgresStatusBadge from "@/components/postgres-preview/PostgresStatusBadge";

export const dynamic = "force-dynamic";

type PreviewData =
  | {
      ok: true;
      summary: PostgresPreviewSummary;
      projects: PostgresPreviewProject[];
      operatingAssets: PostgresPreviewOperatingAsset[];
      companies: PostgresPreviewCompany[];
      countries: PostgresCountryMarketSummary[];
    }
  | {
      ok: false;
      error: string;
    };

async function getPreviewData(): Promise<PreviewData> {
  try {
    const [summary, projects, operatingAssets, companies, countries] =
      await Promise.all([
        getPostgresPreviewSummary(),
        listPostgresPreviewProjects(),
        listPostgresPreviewOperatingAssets(),
        listPostgresPreviewCompanies(),
        listPostgresCountryMarketSummaries(),
      ]);

    return {
      ok: true,
      summary,
      projects,
      operatingAssets,
      companies,
      countries,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      ok: false,
      error: message,
    };
  }
}

function StatTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note: string;
}) {
  return (
    <div className="border border-gray-200 bg-white px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold leading-none text-[#1f2937] sm:text-3xl">
        {value}
      </div>
      <div className="mt-2 text-xs leading-5 text-gray-500">{note}</div>
    </div>
  );
}

function StatusBadge({ value }: { value: string | null }) {
  return <PostgresStatusBadge domain="review" value={value} />;
}

function EmptyValue() {
  return <span className="text-gray-400">-</span>;
}

function MetricValue({
  value,
  suffix,
}: {
  value: number | null;
  suffix: string;
}) {
  if (value === null || value === undefined) {
    return <EmptyValue />;
  }

  return (
    <span>
      {formatMw(value)} {suffix}
    </span>
  );
}

function SectionHeader({
  title,
  count,
}: {
  title: string;
  count: number;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <h2 className="text-lg font-bold text-[#1f2937]">{title}</h2>
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {formatCount(count)} {title.toLowerCase()}
      </span>
    </div>
  );
}

function WorkAreaCard({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description: string;
  href: string;
  label: string;
}) {
  return (
    <Link
      className="border border-gray-200 bg-white px-4 py-4 transition hover:border-[#8dc63f] hover:bg-[#fbfdf8] sm:px-5 sm:py-5"
      href={href}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-2 text-lg font-bold text-[#1f2937]">{title}</div>
      <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
      <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#4f7f1f]">
        Open
      </div>
    </Link>
  );
}

function EntryPathCard({
  step,
  title,
  description,
  href,
}: {
  step: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      className="group border border-gray-200 bg-white px-4 py-4 transition hover:border-[#8dc63f] hover:bg-[#fbfdf8]"
      href={href}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center border border-[#8dc63f] bg-[#f3f8ec] text-xs font-bold text-[#4f7f1f]">
          {step}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 group-hover:text-[#4f7f1f]">
          Open
        </span>
      </div>
      <div className="mt-4 text-base font-bold text-[#1f2937]">{title}</div>
      <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
    </Link>
  );
}

function RecordPreview({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <details className="border border-gray-200 bg-white">
      <summary className="flex cursor-pointer list-none flex-col gap-3 px-4 py-4 marker:hidden sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <div className="text-sm font-bold text-[#1f2937]">{title}</div>
          <div className="mt-1 text-xs text-gray-500">
            {formatCount(count)} preview rows
          </div>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide text-[#4f7f1f]">
          Expand
        </span>
      </summary>
      <div className="border-t border-gray-200">{children}</div>
    </details>
  );
}

function ProjectsTable({ projects }: { projects: PostgresPreviewProject[] }) {
  return (
    <section className="bg-white">
      <SectionHeader title="Projects" count={projects.length} />
      <div className="overflow-x-auto">
        <table className="min-w-[860px] table-fixed text-left text-sm">
          <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-[30%] px-5 py-3 font-semibold">Name</th>
              <th className="w-[12%] px-5 py-3 font-semibold">Use</th>
              <th className="w-[14%] px-5 py-3 font-semibold">Phase</th>
              <th className="w-[16%] px-5 py-3 font-semibold">Location</th>
              <th className="w-[12%] px-5 py-3 font-semibold">Power</th>
              <th className="w-[12%] px-5 py-3 font-semibold">Thermal</th>
              <th className="w-[12%] px-5 py-3 font-semibold">Review</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.map((project) => (
              <tr key={project.project_id} className="align-top">
                <td className="px-5 py-4">
                  <Link
                    href={`/postgres-preview/projects/${project.project_id}`}
                    className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                  >
                    {project.project_name}
                  </Link>
                  <div className="mt-1 text-xs text-gray-500">
                    {project.legacy_project_id || "new-postgres-record"}
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-700">
                  {project.primary_use_type_code}
                </td>
                <td className="px-5 py-4">
                  <PostgresStatusBadge
                    domain="lifecycle"
                    value={project.lifecycle_phase_code}
                  />
                </td>
                <td className="px-5 py-4 text-gray-700">
                  {project.country || <EmptyValue />}
                  <div className="mt-1 text-xs text-gray-500">
                    {project.region || <EmptyValue />}
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-700">
                  <MetricValue value={project.electric_capacity_mwe} suffix="MWe" />
                </td>
                <td className="px-5 py-4 text-gray-700">
                  <MetricValue value={project.thermal_capacity_mwth} suffix="MWth" />
                </td>
                <td className="px-5 py-4">
                  <StatusBadge value={project.review_status_code} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function OperatingAssetsTable({
  operatingAssets,
}: {
  operatingAssets: PostgresPreviewOperatingAsset[];
}) {
  return (
    <section className="bg-white">
      <SectionHeader title="Plants" count={operatingAssets.length} />
      <div className="overflow-x-auto">
        <table className="min-w-[860px] table-fixed text-left text-sm">
          <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-[30%] px-5 py-3 font-semibold">Name</th>
              <th className="w-[12%] px-5 py-3 font-semibold">Use</th>
              <th className="w-[14%] px-5 py-3 font-semibold">Phase</th>
              <th className="w-[16%] px-5 py-3 font-semibold">Location</th>
              <th className="w-[12%] px-5 py-3 font-semibold">Power</th>
              <th className="w-[12%] px-5 py-3 font-semibold">Thermal</th>
              <th className="w-[12%] px-5 py-3 font-semibold">Review</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {operatingAssets.map((asset) => (
              <tr key={asset.operating_asset_id} className="align-top">
                <td className="px-5 py-4">
                  <Link
                    href={`/postgres-preview/operating-assets/${asset.operating_asset_id}`}
                    className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                  >
                    {asset.asset_name}
                  </Link>
                  <div className="mt-1 text-xs text-gray-500">
                    {asset.legacy_plant_id || "new-postgres-record"}
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-700">
                  {asset.primary_use_type_code}
                </td>
                <td className="px-5 py-4">
                  <PostgresStatusBadge
                    domain="lifecycle"
                    value={asset.lifecycle_phase_code}
                  />
                </td>
                <td className="px-5 py-4 text-gray-700">
                  {asset.country || <EmptyValue />}
                  <div className="mt-1 text-xs text-gray-500">
                    {asset.region || <EmptyValue />}
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-700">
                  <MetricValue value={asset.electric_capacity_mwe} suffix="MWe" />
                </td>
                <td className="px-5 py-4 text-gray-700">
                  <MetricValue value={asset.thermal_capacity_mwth} suffix="MWth" />
                </td>
                <td className="px-5 py-4">
                  <StatusBadge value={asset.review_status_code} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CompaniesTable({ companies }: { companies: PostgresPreviewCompany[] }) {
  return (
    <section className="bg-white">
      <SectionHeader title="Companies" count={companies.length} />
      <div className="overflow-x-auto">
        <table className="min-w-[760px] table-fixed text-left text-sm">
          <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-[34%] px-5 py-3 font-semibold">Name</th>
              <th className="w-[18%] px-5 py-3 font-semibold">Type</th>
              <th className="w-[18%] px-5 py-3 font-semibold">HQ</th>
              <th className="w-[18%] px-5 py-3 font-semibold">Focus</th>
              <th className="w-[12%] px-5 py-3 font-semibold">Review</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {companies.map((company) => (
              <tr key={company.company_id} className="align-top">
                <td className="px-5 py-4">
                  <Link
                    href={`/postgres-preview/companies/${company.company_id}`}
                    className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                  >
                    {company.company_name}
                  </Link>
                  <div className="mt-1 text-xs text-gray-500">
                    {company.legacy_company_id || "new-postgres-record"}
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-700">
                  {company.company_type_primary_code || <EmptyValue />}
                  <div className="mt-1 text-xs text-gray-500">
                    {company.entity_type_code || <EmptyValue />}
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-700">
                  {company.headquarters_country || <EmptyValue />}
                </td>
                <td className="px-5 py-4 text-gray-700">
                  {company.geothermal_focus || <EmptyValue />}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge value={company.review_status_code} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SetupNotice({ error }: { error: string }) {
  return (
    <section className="border border-amber-200 bg-amber-50 px-5 py-5">
      <h2 className="text-lg font-bold text-amber-900">PostgreSQL Not Connected</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
        This preview reads from the Railway PostgreSQL database. Run the app
        through Railway variables or set `DATABASE_URL` locally.
      </p>
      <pre className="mt-4 overflow-x-auto bg-white px-4 py-3 text-xs text-gray-700">
        railway run --service Postgres -- npm --prefix web run dev
      </pre>
      <p className="mt-3 text-xs text-amber-900">Error: {error}</p>
    </section>
  );
}

export default async function PostgresPreviewPage() {
  const data = await getPreviewData();

  return (
    <main className="space-y-6 sm:space-y-8">
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-5 py-6 sm:px-8 sm:py-8">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
            PostgreSQL Staging
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#1f2937] sm:text-4xl">
                PostgreSQL Staging Command Center
              </h1>
              <p className="mt-4 max-w-4xl text-sm leading-6 text-gray-600 sm:text-base sm:leading-7">
                Operational front door for the PostgreSQL replacement platform:
                route into Research Ops, governed evidence review, entity
                worklists, market intelligence, map navigation, and cutover
                readiness.
              </p>
            </div>
            <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap">
              <Link
                className="inline-flex h-10 w-full items-center justify-center border border-[#8dc63f] bg-white px-4 text-sm font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec] sm:w-auto"
                href="/postgres-preview/research-ops"
              >
                Open Research Ops
              </Link>
              <Link
                className="inline-flex h-10 w-full items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f] sm:w-auto"
                href="/postgres-preview/readiness"
              >
                Replacement Readiness
              </Link>
            </div>
          </div>
        </div>
      </section>

      {!data.ok ? (
        <SetupNotice error={data.error} />
      ) : (
        <>
          <PostgresSectionJumpNav
            items={[
              { href: "#staging-snapshot", label: "Snapshot", note: "Counts" },
              { href: "#entry-path", label: "Entry Path", note: "Where to start" },
              { href: "#work-areas", label: "Work Areas", note: "Modules" },
              { href: "#regional-routes", label: "Regions", note: "Worklists" },
              { href: "#evidence-review", label: "Evidence", note: "Sources / AI" },
              { href: "#create-inspect", label: "Create", note: "Drafts" },
              { href: "#preview-rows", label: "Preview Rows", note: "Samples" },
            ]}
          />

          <section id="staging-snapshot" className="space-y-4 scroll-mt-24">
            <DetailPriorityMarker
              label="Core"
              title="Staging Snapshot"
              description="Entity counts, use components, relationship links."
              tone="core"
            />

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <StatTile
                label="Projects"
                value={formatCount(data.summary.projectCount)}
                note="Development pipeline"
              />
              <StatTile
                label="Plants"
                value={formatCount(data.summary.operatingAssetCount)}
                note="Plant fleet"
              />
              <StatTile
                label="Companies"
                value={formatCount(data.summary.companyCount)}
                note="Company profiles"
              />
              <StatTile
                label="Use Components"
                value={formatCount(data.summary.directUseComponentCount)}
                note="Hybrid/direct-use tags"
              />
              <StatTile
                label="Project Links"
                value={formatCount(data.summary.companyProjectLinkCount)}
                note="Company roles"
              />
              <StatTile
                label="Plant Links"
                value={formatCount(data.summary.companyAssetLinkCount)}
                note="Company roles"
              />
            </section>
          </section>

          <section id="entry-path" className="space-y-4 scroll-mt-24">
            <DetailPriorityMarker
              label="Workflow"
              title="Operational Entry Path"
              description="Start from the layer that matches the work in front of you."
              tone="workflow"
            />

            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <EntryPathCard
                description="Find assignments, blockers, source gaps, AI review queues, and export issues."
                href="/postgres-preview/research-ops"
                step="01"
                title="See What Needs Work"
              />
              <EntryPathCard
                description="Review sources, article matches, and fact candidates before they become evidence."
                href="/sources"
                step="02"
                title="Govern Evidence"
              />
              <EntryPathCard
                description="Open projects, plants, or companies to fix fields and relationships."
                href="/postgres-preview/projects"
                step="03"
                title="Edit Entity Profiles"
              />
              <EntryPathCard
                description="Use countries, map, and analysis to interpret market and spatial patterns."
                href="/postgres-preview/analysis"
                step="04"
                title="Interpret Intelligence"
              />
              <EntryPathCard
                description="Check unresolved blockers before replacing the current database platform."
                href="/postgres-preview/readiness"
                step="05"
                title="Check Cutover"
              />
            </section>
          </section>

          <section id="work-areas" className="space-y-4 scroll-mt-24">
            <DetailPriorityMarker
              label="Workflow"
              title="Work Areas"
              description="Daily operations, entity worklists, intelligence views."
              tone="workflow"
            />

            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <WorkAreaCard
                description="Queue-driven validation, source gaps, missing data, assignments, AI review, and export-blocking issues."
                href="/postgres-preview/research-ops"
                label="Operations"
                title="Research Ops"
              />
              <WorkAreaCard
                description="Create, edit, filter, export, and review the development pipeline."
                href="/postgres-preview/projects"
                label="Entity Worklist"
                title="Projects"
              />
              <WorkAreaCard
                description="Review plants, operating status, capacity, company roles, and source evidence."
                href="/postgres-preview/operating-assets"
                label="Entity Worklist"
                title="Plants"
              />
              <WorkAreaCard
                description="Review company profiles, business identity, relationships, ownership, roles, and evidence."
                href="/postgres-preview/companies"
                label="Entity Worklist"
                title="Companies"
              />
              <WorkAreaCard
                description="Country aggregation, market worklists, validation coverage, and source-gap signals."
                href="/postgres-preview/markets"
                label="Market Layer"
                title="Markets"
              />
              <WorkAreaCard
                description="Spatial view for projects and plants with map-based navigation."
                href="/postgres-preview/map"
                label="Spatial View"
                title="Map"
              />
              <WorkAreaCard
                description="Cross-database analytical snapshot for capacity, lifecycle, use type, and country comparison."
                href="/postgres-preview/analysis"
                label="Intelligence View"
                title="Analysis"
              />
              <WorkAreaCard
                description="Cutover signals for migration rehearsal, data quality, unresolved gaps, and replacement readiness."
                href="/postgres-preview/readiness"
                label="Governance"
                title="Replacement Readiness"
              />
            </section>
          </section>

          <section id="regional-routes" className="space-y-4 scroll-mt-24">
            <DetailPriorityMarker
              label="Intelligence"
              title="Regional Worklist Routes"
              description="Use canonical geography to move from regional market context into filtered operational worklists."
              tone="workflow"
            />

            <PostgresRegionalWorklistRoutes
              countries={data.countries}
              description="Regional entry points for market context, project queues, plant queues, and company ecosystem review."
              limit={4}
            />
          </section>

          <section id="evidence-review" className="space-y-4 scroll-mt-24">
            <DetailPriorityMarker
              label="Governance"
              title="Evidence And AI Review"
              description="Sources, article/entity matching, and fact extraction remain governed review layers."
              tone="governance"
            />

            <section className="grid gap-3 md:grid-cols-3">
              <WorkAreaCard
                description="Manage sources, credibility states, visibility, evidence links, and source review queues."
                href="/sources"
                label="Evidence Backbone"
                title="Sources / Documents"
              />
              <WorkAreaCard
                description="Review article-to-entity match candidates before creating governed evidence links."
                href="/sources/matches"
                label="Review Queue"
                title="Article Match Review"
              />
              <WorkAreaCard
                description="Review extracted article fact candidates before field suggestions or audited application."
                href="/sources/facts"
                label="Review Queue"
                title="Article Fact Review"
              />
            </section>
          </section>

          <section id="create-inspect" className="space-y-4 scroll-mt-24">
            <DetailPriorityMarker
              label="Governance"
              title="Create And Inspect"
              description="Quick creation plus expandable profile samples."
              tone="governance"
            />

            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <WorkAreaCard
                description="Start a draft project with readiness checks and evidence workflow."
                href="/postgres-preview/projects/new"
                label="Quick Add"
                title="New Project"
              />
              <WorkAreaCard
                description="Start a draft plant, unit, or direct-use profile."
                href="/postgres-preview/operating-assets/new"
                label="Quick Add"
                title="New Plant"
              />
              <WorkAreaCard
                description="Start a draft company profile with business identity, roles, and relationship workflows."
                href="/postgres-preview/companies/new"
                label="Quick Add"
                title="New Company"
              />
              <WorkAreaCard
                description="Step through the replacement workflow acceptance path before internal cutover."
                href="/postgres-preview/pilot"
                label="Acceptance"
                title="Pilot Workflow"
              />
            </section>
          </section>

          <section id="preview-rows" className="space-y-3 scroll-mt-24">
            <RecordPreview title="Project Preview Rows" count={data.projects.length}>
              <ProjectsTable projects={data.projects} />
            </RecordPreview>
            <RecordPreview
              title="Plant Preview Rows"
              count={data.operatingAssets.length}
            >
              <OperatingAssetsTable operatingAssets={data.operatingAssets} />
            </RecordPreview>
            <RecordPreview title="Company Preview Rows" count={data.companies.length}>
              <CompaniesTable companies={data.companies} />
            </RecordPreview>
          </section>
        </>
      )}
    </main>
  );
}
