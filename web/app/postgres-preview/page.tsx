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
  return (
    <span className="inline-flex h-7 items-center border border-gray-200 bg-[#f7f7f7] px-2 text-xs font-semibold text-gray-700">
      {value || "unknown"}
    </span>
  );
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

function ProjectsTable({ projects }: { projects: PostgresPreviewProject[] }) {
  return (
    <section className="border border-gray-200 bg-white">
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
                <td className="px-5 py-4 text-gray-700">
                  {project.lifecycle_phase_code}
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
    <section className="border border-gray-200 bg-white">
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
                <td className="px-5 py-4 text-gray-700">
                  {asset.lifecycle_phase_code}
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
    <section className="border border-gray-200 bg-white">
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
                className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                href="/postgres-preview/research-ops"
              >
                Open Research Ops
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                href="/postgres-preview/projects"
              >
                All Projects
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                href="/postgres-preview/operating-assets"
              >
                All Plants / Facilities
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                href="/postgres-preview/companies"
              >
                All Companies
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                href="/postgres-preview/countries"
              >
                Countries / Markets
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center border border-[#8dc63f] bg-white px-4 text-sm font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec]"
                href="/postgres-preview/projects/new"
              >
                New Project
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center border border-[#8dc63f] bg-white px-4 text-sm font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec]"
                href="/postgres-preview/operating-assets/new"
              >
                New Plant / Facility
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center border border-[#8dc63f] bg-white px-4 text-sm font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec]"
                href="/postgres-preview/companies/new"
              >
                New Company
              </Link>
            </div>
          </div>
        </div>
      </section>

      {!data.ok ? (
        <SetupNotice error={data.error} />
      ) : (
        <>
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

          <ProjectsTable projects={data.projects} />
          <OperatingAssetsTable operatingAssets={data.operatingAssets} />
          <CompaniesTable companies={data.companies} />
        </>
      )}
    </main>
  );
}
