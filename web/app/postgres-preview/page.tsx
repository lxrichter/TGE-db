import Link from "next/link";
import {
  getPostgresPreviewSummary,
  listPostgresPreviewCompanies,
  listPostgresPreviewOperatingAssets,
  listPostgresPreviewProjects,
  type PostgresPreviewCompany,
  type PostgresPreviewOperatingAsset,
  type PostgresPreviewProject,
  type PostgresPreviewSummary,
} from "@/lib/postgres-preview";
import { formatCount, formatMw } from "@/lib/format";
import { DetailPriorityMarker } from "@/components/postgres-preview/PostgresEntityDetail";
import PostgresStatusBadge from "@/components/postgres-preview/PostgresStatusBadge";

export const dynamic = "force-dynamic";

type PreviewData =
  | {
      ok: true;
      summary: PostgresPreviewSummary;
      projects: PostgresPreviewProject[];
      operatingAssets: PostgresPreviewOperatingAsset[];
      companies: PostgresPreviewCompany[];
    }
  | {
      ok: false;
      error: string;
    };

async function getPreviewData(): Promise<PreviewData> {
  try {
    const [summary, projects, operatingAssets, companies] = await Promise.all([
      getPostgresPreviewSummary(),
      listPostgresPreviewProjects(),
      listPostgresPreviewOperatingAssets(),
      listPostgresPreviewCompanies(),
    ]);

    return {
      ok: true,
      summary,
      projects,
      operatingAssets,
      companies,
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
      <div className="mt-2 text-3xl font-bold leading-none text-[#1f2937]">
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
    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
      <h2 className="text-lg font-bold text-[#1f2937]">{title}</h2>
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {formatCount(count)} records
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
      className="border border-gray-200 bg-white px-5 py-5 transition hover:border-[#8dc63f] hover:bg-[#fbfdf8]"
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
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 marker:hidden">
        <div>
          <div className="text-sm font-bold text-[#1f2937]">{title}</div>
          <div className="mt-1 text-xs text-gray-500">
            {formatCount(count)} preview records
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
        <table className="min-w-full table-fixed text-left text-sm">
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
      <SectionHeader title="Operating Assets" count={operatingAssets.length} />
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed text-left text-sm">
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
        <table className="min-w-full table-fixed text-left text-sm">
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
    <main className="space-y-8">
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-8 py-8">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
            PostgreSQL Staging
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-[#1f2937]">
                Future Platform Preview
              </h1>
              <p className="mt-4 max-w-4xl text-base leading-7 text-gray-600">
                Staging view of the new Railway PostgreSQL schema using the
                transformed Hetzner SQLite backup plus PostgreSQL-native preview
                records.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex h-10 items-center justify-center border border-[#8dc63f] bg-white px-4 text-sm font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec]"
                href="/postgres-preview/research-ops"
              >
                Open Research Ops
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
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
          <DetailPriorityMarker
            label="Core"
            title="Staging Snapshot"
            description="Entity counts, use components, relationship links."
            tone="core"
          />

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            <StatTile
              label="Projects"
              value={formatCount(data.summary.projectCount)}
              note="Development records"
            />
            <StatTile
              label="Assets"
              value={formatCount(data.summary.operatingAssetCount)}
              note="Plants and facilities"
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
              label="Asset Links"
              value={formatCount(data.summary.companyAssetLinkCount)}
              note="Company roles"
            />
          </section>

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
              description="Create, edit, filter, export, and review development pipeline records."
              href="/postgres-preview/projects"
              label="Entity Worklist"
              title="Projects"
            />
            <WorkAreaCard
              description="Review plants, facilities, operating status, capacity, company roles, and source evidence."
              href="/postgres-preview/operating-assets"
              label="Entity Worklist"
              title="Plants / Facilities"
            />
            <WorkAreaCard
              description="Review company profiles, business identity, relationships, ownership, roles, and evidence."
              href="/postgres-preview/companies"
              label="Entity Worklist"
              title="Companies"
            />
            <WorkAreaCard
              description="Country aggregation, market worklists, validation coverage, and source-gap signals."
              href="/postgres-preview/countries"
              label="Market Layer"
              title="Countries / Markets"
            />
            <WorkAreaCard
              description="Spatial view for projects and operating assets with map-based navigation."
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

          <DetailPriorityMarker
            label="Governance"
            title="Create And Inspect"
            description="Quick creation plus expandable record samples."
            tone="governance"
          />

          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <WorkAreaCard
              description="Start a draft pipeline/development record with readiness checks and evidence workflow."
              href="/postgres-preview/projects/new"
              label="Quick Add"
              title="New Project"
            />
            <WorkAreaCard
              description="Start a draft operating asset, plant, facility, unit, or direct-use record."
              href="/postgres-preview/operating-assets/new"
              label="Quick Add"
              title="New Plant / Facility"
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

          <section className="space-y-3">
            <RecordPreview title="Project Preview Rows" count={data.projects.length}>
              <ProjectsTable projects={data.projects} />
            </RecordPreview>
            <RecordPreview
              title="Plant / Facility Preview Rows"
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
