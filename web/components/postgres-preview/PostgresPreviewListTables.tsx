import Link from "next/link";
import { formatCount, formatMw } from "@/lib/format";
import type {
  PostgresPreviewCompany,
  PostgresPreviewOperatingAsset,
  PostgresPreviewProject,
} from "@/lib/postgres-preview";

type HeaderAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

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

function StatusBadge({ value }: { value: string | null }) {
  return (
    <span className="inline-flex h-7 items-center border border-gray-200 bg-[#f7f7f7] px-2 text-xs font-semibold text-gray-700">
      {value || "unknown"}
    </span>
  );
}

function SectionHeader({
  title,
  count,
  total,
}: {
  title: string;
  count: number;
  total?: number;
}) {
  const countLabel =
    total && total > count
      ? `Showing ${formatCount(count)} of ${formatCount(total)} records`
      : `${formatCount(count)} records`;

  return (
    <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
      <h2 className="text-lg font-bold text-[#1f2937]">{title}</h2>
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {countLabel}
      </span>
    </div>
  );
}

export function PostgresPreviewSetupNotice({ error }: { error: string }) {
  return (
    <section className="border border-amber-200 bg-amber-50 px-5 py-5">
      <h2 className="text-lg font-bold text-amber-900">PostgreSQL Not Connected</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
        This preview reads from the Railway PostgreSQL database. Run the app
        through Railway variables or set `DATABASE_PUBLIC_URL` / `DATABASE_URL`
        locally.
      </p>
      <pre className="mt-4 overflow-x-auto bg-white px-4 py-3 text-xs text-gray-700">
        railway run --service Postgres -- npm --prefix web run dev
      </pre>
      <p className="mt-3 text-xs text-amber-900">Error: {error}</p>
    </section>
  );
}

export function PostgresPreviewListHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions: HeaderAction[];
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-l-4 border-l-[#8dc63f] px-8 py-8">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
          {eyebrow}
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-[#1f2937]">
              {title}
            </h1>
            <p className="mt-4 max-w-4xl text-base leading-7 text-gray-600">
              {description}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => {
              const isPrimary = action.variant === "primary";

              return (
                <Link
                  key={`${action.href}-${action.label}`}
                  className={
                    isPrimary
                      ? "inline-flex h-10 items-center justify-center border border-[#8dc63f] bg-white px-4 text-sm font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec]"
                      : "inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                  }
                  href={action.href}
                >
                  {action.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProjectsPreviewTable({
  projects,
  total,
}: {
  projects: PostgresPreviewProject[];
  total?: number;
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <SectionHeader title="Projects" count={projects.length} total={total} />
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

export function OperatingAssetsPreviewTable({
  operatingAssets,
  total,
}: {
  operatingAssets: PostgresPreviewOperatingAsset[];
  total?: number;
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <SectionHeader
        title="Plants / Facilities"
        count={operatingAssets.length}
        total={total}
      />
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed text-left text-sm">
          <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-[30%] px-5 py-3 font-semibold">Name</th>
              <th className="w-[12%] px-5 py-3 font-semibold">Use</th>
              <th className="w-[14%] px-5 py-3 font-semibold">Status</th>
              <th className="w-[16%] px-5 py-3 font-semibold">Location</th>
              <th className="w-[12%] px-5 py-3 font-semibold">Installed</th>
              <th className="w-[12%] px-5 py-3 font-semibold">Running</th>
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
                  <MetricValue
                    value={asset.electric_capacity_running_mwe}
                    suffix="MWe"
                  />
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

export function CompaniesPreviewTable({
  companies,
  total,
}: {
  companies: PostgresPreviewCompany[];
  total?: number;
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <SectionHeader title="Companies" count={companies.length} total={total} />
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
