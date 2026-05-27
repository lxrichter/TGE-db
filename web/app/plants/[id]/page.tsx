import { getDb } from "@/lib/db";
import Link from "@/node_modules/next/link";
import { isValidElement, type ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import DetailMap from "@/components/DetailMap";
import RelatedNewsCard from "@/components/detail/RelatedNewsCard";
import ActionButton from "@/components/ui/ActionButton";
import PhaseBadge from "@/components/ui/PhaseBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import ApprovePlantButton from "@/components/plants/ApprovePlantButton";
import {
  canEdit,
  canApprove,
  type UserRole,
} from "@/lib/auth/roles";
import PrintButton from "@/components/PrintButton";

function extractLinks(value: any): string[] {
  const text = value ? String(value).trim() : "";

  if (!text || text === "NA") return [];

  const normalized = text
    .replace(/\r/g, "\n")
    .replace(/,\s*(https?:\/\/)/g, "\n$1")
    .replace(/;\s*(https?:\/\/)/g, "\n$1")
    .replace(/\s+(https?:\/\/)/g, "\n$1");

  const candidates = normalized
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  const urls = candidates.filter((item) => /^https?:\/\//i.test(item));

  return Array.from(new Set(urls));
}

function renderLinkedText(value: any) {
  const text = value ? String(value).trim() : "";

  if (!text || text === "NA") {
    return <span>NA</span>;
  }

  const urls = extractLinks(text);

  if (!urls.length) {
    return <span>{text}</span>;
  }

  return (
    <ul className="space-y-1">
      {urls.map((url, index) => (
        <li key={index}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8dc63f] underline hover:text-[#6aa32f]"
          >
            {url}
          </a>
        </li>
      ))}
    </ul>
  );
}

function Row({
  label,
  value,
  labelWidth = "160px",
}: {
  label: string;
  value: ReactNode;
  labelWidth?: string;
}) {
  return (
    <div
      className="grid grid-cols-1 gap-1 border-b border-gray-200 py-1.5 md:gap-3"
      style={{ gridTemplateColumns: `minmax(0, ${labelWidth}) minmax(0, 1fr)` }}
    >
      <div className="text-[12px] font-semibold text-gray-700">{label}</div>
      <div className="break-words text-[12px] text-gray-600">
        {isValidElement(value) ? value : renderLinkedText(value)}
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  className = "",
}: {
  label: string;
  value: any;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-1 text-[17px] font-semibold leading-snug text-[#1f2937]">
        {value ?? "NA"}
      </div>
    </div>
  );
}

function ResearchBadge({ value }: { value: string | null }) {
  const normalized = (value || "").trim().toLowerCase();

  if (!normalized || normalized === "na" || normalized === "n/a") {
    return <StatusBadge tone="neutralSoft">NA</StatusBadge>;
  }

  if (normalized.includes("done")) {
    return <StatusBadge tone="success">Done</StatusBadge>;
  }

  if (normalized.includes("progress")) {
    return <StatusBadge tone="info">In Progress</StatusBadge>;
  }

  if (normalized.includes("need")) {
    return <StatusBadge tone="danger">Need Info</StatusBadge>;
  }

  return <StatusBadge tone="neutralSoft">{value || "NA"}</StatusBadge>;
}

function ReviewStatusBadge({
  value,
}: {
  value: string | null | undefined;
}) {
  const normalized = (value || "").trim().toLowerCase();

  if (!normalized) {
    return <StatusBadge tone="neutralSoft">NA</StatusBadge>;
  }

  if (normalized === "approved") {
    return <StatusBadge tone="successSoft">Approved</StatusBadge>;
  }

  if (normalized === "pending_review") {
    return <StatusBadge tone="warningSoft">Pending Review</StatusBadge>;
  }

  return <StatusBadge tone="neutralSoft">{value}</StatusBadge>;
}

function toNumber(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function displayValue(value: any) {
  return value ?? "NA";
}

function displayUserName(name: string | null, fallbackId: string | null) {
  if (name && name.trim()) return name;
  if (fallbackId && fallbackId.trim()) return fallbackId;
  return "NA";
}

function formatDisplayDate(value: string | null | undefined) {
  if (!value || !value.trim()) return "NA";
  return value.slice(0, 10);
}

function TabSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="flex min-h-[48px] items-center border-b border-gray-200 bg-[#f7f7f7] px-5">
        <h2 className="text-lg font-bold leading-none text-[#1f2937]">
          {title}
        </h2>
      </div>
      <div className="px-5 py-3">{children}</div>
    </section>
  );
}

type PlantCompanyRow = {
  company_plant_link_id: string;
  company_id: string;
  company_name: string | null;
  role: string | null;
  role_detail: string | null;
  ownership_share: number | null;
  is_primary: number | null;
  notes: string | null;
};

type PlantDetailRow = {
  plant_id: string;
  plant_name: string | null;
  project_group: string | null;
  other_name: string | null;
  owner_operator: string | null;
  developer: string | null;
  location_text: string | null;
  country: string | null;
  region: string | null;
  wb_region: string | null;
  potential_min_mw: number | null;
  potential_max_mw: number | null;
  installed_capacity_mw: number | null;
  capacity_running_mw: number | null;
  gross_production_gwh: number | null;
  start_dev_year: string | null;
  cod: string | null;
  resource_type: string | null;
  resource_temp_c: number | null;
  project_phase: string | null;
  phase_historical: string | null;
  field_name: string | null;
  wells_total: number | null;
  wells_prod_active: number | null;
  wells_reinj_active: number | null;
  wells_inactive_standby: number | null;
  wells_other_exploration: number | null;
  well_depth_prod_m: number | null;
  temp_prod_well_c: number | null;
  flow_rate_ls: number | null;
  number_of_unit: string | null;
  plant_technology: string | null;
  turbine_supplier: string | null;
  epc_suppliers: string | null;
  investor: string | null;
  ppa_usd_kwh: string | null;
  total_investment_cost: string | null;
  notes: string | null;
  location_x: number | null;
  location_y: number | null;
  website_information: string | null;
  date_created: string | null;
  date_edited: string | null;
  edited_description: string | null;
  research_status: string | null;
  review_status: string | null;
  created_by_user_id: string | null;
  last_updated_by_user_id: string | null;
  approved_by_user_id: string | null;
  approved_at: string | null;
  promoted_from_project_id: string | null;
  promoted_at: string | null;
  created_by_name: string | null;
  last_updated_by_name: string | null;
  approved_by_name: string | null;
};

function normalizeRole(value: string | null | undefined) {
  return (value || "")
    .toLowerCase()
    .replace(/[/_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function classifyCompanyRow(row: PlantCompanyRow) {
  const role = normalizeRole(row.role);
  const hasOwnership =
    row.ownership_share !== null && row.ownership_share !== undefined;

  if (
    row.is_primary ||
    hasOwnership ||
    role.includes("owner") ||
    role.includes("developer") ||
    role.includes("operator") ||
    role.includes("investor") ||
    role.includes("finance") ||
    role.includes("resource partner")
  ) {
    return "Primary";
  }

  if (
    role.includes("epc") ||
    role.includes("drilling") ||
    role.includes("engineering") ||
    role.includes("consult") ||
    role.includes("supplier") ||
    role.includes("technology") ||
    role.includes("equipment") ||
    role.includes("o&m") ||
    role.includes("operation") ||
    role.includes("maintenance") ||
    role.includes("service")
  ) {
    return "Secondary";
  }

  return "Other";
}

function getGroupName(row: PlantCompanyRow) {
  const role = normalizeRole(row.role);

  if (
    role.includes("owner") ||
    role.includes("operator") ||
    role.includes("developer") ||
    role.includes("resource partner")
  ) {
    return "Ownership & Leadership";
  }

  if (role.includes("investor") || role.includes("finance")) {
    return "Finance & Commercial";
  }

  if (role.includes("drilling")) {
    return "Drilling & Wells";
  }

  if (role.includes("epc") || role.includes("construction")) {
    return "EPC & Construction";
  }

  if (role.includes("engineering") || role.includes("consult")) {
    return "Engineering & Consulting";
  }

  if (
    role.includes("supplier") ||
    role.includes("technology") ||
    role.includes("equipment") ||
    role.includes("turbine")
  ) {
    return "Equipment & Technology";
  }

  if (
    role.includes("o&m") ||
    role.includes("operation") ||
    role.includes("maintenance") ||
    role.includes("service")
  ) {
    return "Operations & Maintenance";
  }

  return "Other";
}

function groupPrimaryCompanies(rows: PlantCompanyRow[]) {
  const grouped = new Map<
    string,
    {
      roleName: string;
      items: {
        company_id: string;
        company_name: string;
        role_detail: string | null;
      }[];
    }
  >();

  for (const row of rows) {
    const roleName = row.role || "Other";
    if (!grouped.has(roleName)) {
      grouped.set(roleName, { roleName, items: [] });
    }
    grouped.get(roleName)!.items.push({
      company_id: row.company_id,
      company_name: row.company_name || "NA",
      role_detail: row.role_detail,
    });
  }

  return Array.from(grouped.values());
}

function groupSecondaryCompanies(rows: PlantCompanyRow[]) {
  const grouped = new Map<string, PlantCompanyRow[]>();

  for (const row of rows) {
    const groupName = getGroupName(row);
    if (!grouped.has(groupName)) {
      grouped.set(groupName, []);
    }
    grouped.get(groupName)!.push(row);
  }

  return Array.from(grouped.entries()).map(([groupName, items]) => ({
    groupName,
    items,
  }));
}

function PrimaryCompaniesCompact({ rows }: { rows: PlantCompanyRow[] }) {
  if (!rows.length) return null;

  const grouped = groupPrimaryCompanies(rows);

  return (
    <div className="border border-gray-200 bg-[#fafafa]">
      <div className="border-b border-gray-200 px-5 py-2.5">
        <h3 className="text-[14px] font-bold text-[#1f2937]">
          Primary Companies
        </h3>
      </div>

      <div className="px-5 py-2">
        <div className="space-y-1">
          {grouped.map((group) => (
            <div
              key={group.roleName}
              className="grid items-start border-b border-gray-200 py-1.5"
              style={{ gridTemplateColumns: "140px minmax(0,1fr)" }}
            >
              <div className="text-[11px] font-semibold uppercase text-gray-500">
                {group.roleName}
              </div>

              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                {group.items.map((item, idx) => (
                  <span key={`${item.company_id}-${idx}`} className="text-[13px]">
                    <Link
                      href={`/companies/${item.company_id}`}
                      className="font-medium text-[#1f2937] hover:text-[#8dc63f] hover:underline"
                    >
                      {item.company_name}
                    </Link>

                    {item.role_detail && (
                      <span className="ml-1 text-[11px] text-gray-500">
                        ({item.role_detail})
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SecondaryCompaniesCompact({
  groups,
}: {
  groups: { groupName: string; items: PlantCompanyRow[] }[];
}) {
  if (!groups.length) return null;

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <section key={group.groupName} className="border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 bg-[#f7f7f7] px-5 py-3">
            <h3 className="text-[15px] font-bold text-[#1f2937]">
              {group.groupName}
            </h3>
            <span className="text-xs font-semibold text-gray-500">
              {group.items.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed text-left text-[12px]">
              <colgroup>
                <col className="w-[30%]" />
                <col className="w-[20%]" />
                <col className="w-[18%]" />
                <col className="w-[32%]" />
              </colgroup>
              <thead className="bg-white">
                <tr className="border-b border-gray-200">
                  <th className="px-5 py-2.5 font-semibold text-gray-700">Company</th>
                  <th className="px-5 py-2.5 font-semibold text-gray-700">Role</th>
                  <th className="px-5 py-2.5 font-semibold text-gray-700">Share %</th>
                  <th className="px-5 py-2.5 font-semibold text-gray-700">Role Detail</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((row) => (
                  <tr key={row.company_plant_link_id} className="border-b border-gray-200">
                    <td className="px-5 py-2.5 text-gray-700 align-top">
                      <Link
                        href={`/companies/${row.company_id}`}
                        className="font-medium text-[#1f2937] hover:text-[#8dc63f] hover:underline"
                      >
                        {row.company_name || "NA"}
                      </Link>
                    </td>
                    <td className="px-5 py-2.5 text-gray-600 align-top">
                      {row.role || "NA"}
                    </td>
                    <td className="px-5 py-2.5 text-gray-600 align-top">
                      {row.ownership_share ?? "NA"}
                    </td>
                    <td className="px-5 py-2.5 text-gray-600 align-top">
                      {row.role_detail || "NA"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

function OtherCompaniesCompact({ rows }: { rows: PlantCompanyRow[] }) {
  if (!rows.length) return null;

  return (
    <details className="border border-gray-200 bg-[#fafafa]">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3">
        <span className="text-[15px] font-bold text-[#1f2937]">
          Other Companies
        </span>
        <span className="text-xs font-semibold text-gray-500">
          {rows.length}
        </span>
      </summary>

      <div className="overflow-x-auto border-t border-gray-200">
        <table className="min-w-full table-fixed text-left text-[12px]">
          <colgroup>
            <col className="w-[30%]" />
            <col className="w-[20%]" />
            <col className="w-[18%]" />
            <col className="w-[32%]" />
          </colgroup>
          <thead className="bg-white">
            <tr className="border-b border-gray-200">
              <th className="px-5 py-2.5 font-semibold text-gray-700">Company</th>
              <th className="px-5 py-2.5 font-semibold text-gray-700">Role</th>
              <th className="px-5 py-2.5 font-semibold text-gray-700">Share %</th>
              <th className="px-5 py-2.5 font-semibold text-gray-700">Role Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.company_plant_link_id} className="border-b border-gray-200">
                <td className="px-5 py-2.5 text-gray-700 align-top">
                  <Link
                    href={`/companies/${row.company_id}`}
                    className="font-medium text-[#1f2937] hover:text-[#8dc63f] hover:underline"
                  >
                    {row.company_name || "NA"}
                  </Link>
                </td>
                <td className="px-5 py-2.5 text-gray-600 align-top">
                  {row.role || "NA"}
                </td>
                <td className="px-5 py-2.5 text-gray-600 align-top">
                  {row.ownership_share ?? "NA"}
                </td>
                <td className="px-5 py-2.5 text-gray-600 align-top">
                  {row.role_detail || "NA"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export default async function PlantDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const currentRole = ((session?.user as { role?: UserRole } | undefined)?.role ??
    null) as UserRole | null;

  const userCanEdit = canEdit(currentRole);
  const userCanApprove = canApprove(currentRole);

  const utilityButtonClass =
    "inline-flex min-h-[32px] items-center justify-center whitespace-nowrap border border-gray-300 bg-white px-3 py-1 text-[11px] font-semibold leading-none text-gray-700 transition hover:bg-gray-50";

  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const activeTab = resolvedSearchParams?.tab || "ownership-location";

  const db = await getDb();
  const plant = (await db.get(
    `
    SELECT
      p.*,
      uc.name AS created_by_name,
      uu.name AS last_updated_by_name,
      ua.name AS approved_by_name
    FROM plants p
    LEFT JOIN users uc
      ON uc.user_id = p.created_by_user_id
    LEFT JOIN users uu
      ON uu.user_id = p.last_updated_by_user_id
    LEFT JOIN users ua
      ON ua.user_id = p.approved_by_user_id
    WHERE p.plant_id = ?
    `,
    id
  )) as PlantDetailRow | undefined;

  const plantCompanies = (await db.all(
    `
    SELECT
      l.company_plant_link_id,
      l.company_id,
      c.company_name,
      l.role,
      l.role_detail,
      l.ownership_share,
      l.is_primary,
      l.notes
    FROM company_plant_links l
    LEFT JOIN companies c
      ON c.company_id = l.company_id
    WHERE l.plant_id = ?
    ORDER BY
      l.is_primary DESC,
      CASE
        WHEN l.ownership_share IS NOT NULL THEN 1
        ELSE 2
      END,
      l.role,
      c.company_name
    `,
    id
  )) as PlantCompanyRow[];

  if (!plant) {
    return (
      <>
        <main className="screen-only space-y-6">
          <div className="border border-gray-200 bg-white p-8">
            <p className="text-base text-gray-700">Plant not found.</p>
            <Link
              href="/plants"
              className="mt-4 inline-block text-sm text-[#8dc63f]"
            >
              ← Back to plants
            </Link>
          </div>
        </main>

        <main className="print-only">
          <div className="print-doc">
            <div className="print-header">
              <div className="print-header-main">
                <div className="print-brand-block">
                  <img src="/tge_logo.png" className="print-logo" alt="ThinkGeoEnergy" />
                  <div className="print-brand-copy">
                    <div className="print-brand-line">Internal</div>
                    <div className="print-brand-line">Database</div>
                    <div className="print-brand-line">Platform</div>
                  </div>
                </div>

                <div className="print-header-divider" />

                <div className="print-title-block">
                  <div className="print-type">Plant Overview</div>
                  <h1 className="print-title">Plant not found</h1>
                </div>
              </div>
            </div>

            <footer className="print-footer">
              © {new Date().getFullYear()} ThinkGeoEnergy ehf. All rights reserved.
            </footer>
          </div>
        </main>
      </>
    );
  }

  const primaryCompanies = plantCompanies.filter(
    (row) => classifyCompanyRow(row) === "Primary"
  );

  const secondaryCompanies = plantCompanies.filter(
    (row) => classifyCompanyRow(row) === "Secondary"
  );

  const otherCompanies = plantCompanies.filter(
    (row) => classifyCompanyRow(row) === "Other"
  );

  const secondaryGroups = groupSecondaryCompanies(secondaryCompanies);

  const latitude = toNumber(plant.location_x);
  const longitude = toNumber(plant.location_y);

  const coordinatesText =
    latitude !== null && longitude !== null
      ? `${latitude}, ${longitude}`
      : "NA";

  const googleMapsUrl =
    latitude !== null && longitude !== null
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : null;

  const tabs = [
    { key: "ownership-location", label: "Location & Legacy Fields" },
    { key: "capacity-timeline", label: "Capacity & Timeline" },
    { key: "resource-status", label: "Resource & Plant Status" },
    { key: "wellfield", label: "Wellfield Data" },
    { key: "plant-commercial", label: "Plant / Technology / Commercial" },
  ];

  return (
    <>
      <main className="screen-only space-y-6">
        <div>
          <Link
            href="/plants"
            className="text-sm font-medium text-[#8dc63f] hover:underline"
          >
            ← Back to plants
          </Link>
        </div>

        <section className="border border-gray-200 bg-white">
          <div className="border-l-4 border-l-[#8dc63f] px-6 py-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-5xl">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
                  Plant Profile
                </p>

                <h1 className="mt-2 text-4xl font-bold tracking-tight text-[#1f2937] xl:text-5xl">
                  {plant.plant_name || "NA"}
                </h1>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <span>{plant.country || "NA"}</span>
                  <span className="text-gray-300">|</span>
                  <span>{plant.region || "NA"}</span>
                  <span className="text-gray-300">|</span>
                  <span>{plant.location_text || "NA"}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <PhaseBadge value={plant.project_phase} />
                  <ResearchBadge value={plant.research_status} />
                  <ReviewStatusBadge value={plant.review_status} />
                </div>
              </div>

              <div className="flex w-full max-w-[880px] flex-col gap-3 xl:w-auto xl:min-w-[640px] xl:items-end">
                <div className="flex flex-wrap gap-2 xl:justify-end">
                  <PrintButton className={utilityButtonClass} />

                  {userCanApprove ? (
                    <ApprovePlantButton plantId={plant.plant_id} />
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-3 xl:justify-end">
                  {userCanEdit && (
                    <ActionButton
                      href={`/plants/${plant.plant_id}/edit`}
                      variant="primary"
                    >
                      Edit Plant
                    </ActionButton>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 bg-[#fafafa] px-6 py-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 xl:grid-cols-[120px_140px_180px_minmax(240px,1.4fr)_120px]">
              <SummaryItem label="Plant ID" value={displayValue(plant.plant_id)} />
              <SummaryItem
                label="Installed MWe"
                value={displayValue(plant.installed_capacity_mw)}
              />
              <SummaryItem
                label="Technology"
                value={displayValue(plant.plant_technology)}
              />
              <SummaryItem
                label="Operator"
                value={displayValue(plant.owner_operator)}
              />
              <SummaryItem label="COD" value={displayValue(plant.cod)} />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_460px]">
          <section className="border border-gray-200 bg-white">
            <div className="flex min-h-[48px] items-center border-b border-gray-200 bg-[#f7f7f7] px-5">
              <h2 className="text-lg font-bold leading-none text-[#1f2937]">
                Description
              </h2>
            </div>
            <div className="px-5 py-4 text-[13px] leading-6 text-gray-600">
              {plant.edited_description ? (
                <p>{plant.edited_description}</p>
              ) : (
                <p>
                  No editorial summary added yet. This space can later hold a
                  short plant description, internal summary, or validated market
                  narrative for quick understanding and future edit workflows.
                </p>
              )}
            </div>
          </section>

          <div className="space-y-6">
            <section className="bg-white">
              <DetailMap
                title={plant.plant_name || "Plant"}
                latitude={latitude}
                longitude={longitude}
                type="plant"
                zoom={7}
                className="h-[320px] w-full"
              />
            </section>
          </div>
        </section>

        {(primaryCompanies.length > 0 ||
          secondaryGroups.length > 0 ||
          otherCompanies.length > 0) && (
          <section className="border border-gray-200 bg-white">
            <div className="flex min-h-[48px] items-center border-b border-gray-200 bg-[#f7f7f7] px-5">
              <h2 className="text-lg font-bold leading-none text-[#1f2937]">
                Companies
              </h2>
            </div>

            <div className="space-y-3 px-5 py-4">
              <PrimaryCompaniesCompact rows={primaryCompanies} />
              <SecondaryCompaniesCompact groups={secondaryGroups} />
              <OtherCompaniesCompact rows={otherCompanies} />
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_460px]">
          <div className="space-y-6">
            <section className="border border-gray-200 bg-white">
              <div className="border-b border-gray-200 bg-[#f7f7f7] px-5 py-1">
                <div className="flex flex-wrap">
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                      <Link
                        key={tab.key}
                        href={`/plants/${id}?tab=${tab.key}`}
                        scroll={false}
                        className={`border-r border-gray-200 px-3 py-2.5 text-[12px] font-semibold ${
                          isActive
                            ? "bg-white text-[#1f2937]"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {tab.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="p-0">
                {activeTab === "ownership-location" && (
                  <TabSection title="Location & Legacy Fields">
                    <p className="mb-4 text-sm text-gray-600">
                      Structured company participation is shown in the Companies section above.
                      The fields below are legacy text fields kept during transition and should
                      not be treated as the long-term source of truth.
                    </p>
                    <Row label="Plant ID" value={plant.plant_id} />
                    <Row label="Plant name" value={plant.plant_name} />
                    <Row label="Project group" value={plant.project_group} />
                    <Row label="Other name" value={plant.other_name} />
                    <Row label="Legacy owner / operator" value={plant.owner_operator} />
                    <Row label="Legacy developer" value={plant.developer} />
                    <Row label="Location (city/province)" value={plant.location_text} />
                    <Row label="Country" value={plant.country} />
                    <Row label="Region" value={plant.region} />
                    <Row label="WB region" value={plant.wb_region} />
                  </TabSection>
                )}

                {activeTab === "capacity-timeline" && (
                  <TabSection title="Capacity & Timeline">
                    <Row label="Potential min (MWe)" value={plant.potential_min_mw} />
                    <Row label="Potential max (MWe)" value={plant.potential_max_mw} />
                    <Row
                      label="Installed capacity"
                      value={plant.installed_capacity_mw}
                    />
                    <Row label="Capacity running" value={plant.capacity_running_mw} />
                    <Row
                      label="Gross production (GWh)"
                      value={plant.gross_production_gwh}
                    />
                    <Row
                      label="Start of dev. (year)"
                      value={plant.start_dev_year}
                    />
                    <Row label="COD" value={plant.cod} />
                  </TabSection>
                )}

                {activeTab === "resource-status" && (
                  <TabSection title="Resource & Plant Status">
                    <Row label="Resource type" value={plant.resource_type} />
                    <Row
                      label="Resource temp. (°C)"
                      value={plant.resource_temp_c}
                    />
                    <Row
                      label="Plant status"
                      value={<PhaseBadge value={plant.project_phase} />}
                    />
                    <Row
                      label="Historical phase/status"
                      value={<PhaseBadge value={plant.phase_historical} />}
                    />
                    <Row label="Field name" value={plant.field_name} />
                  </TabSection>
                )}

                {activeTab === "wellfield" && (
                  <TabSection title="Wellfield Data">
                    <Row label="# Wells total" value={plant.wells_total} />
                    <Row
                      label="# Wells prod. active"
                      value={plant.wells_prod_active}
                    />
                    <Row
                      label="# Wells reinj active"
                      value={plant.wells_reinj_active}
                    />
                    <Row
                      label="# Wells inactive / standby"
                      value={plant.wells_inactive_standby}
                    />
                    <Row
                      label="# Wells other / explor."
                      value={plant.wells_other_exploration}
                    />
                    <Row
                      label="Well depth prod. (m)"
                      value={plant.well_depth_prod_m}
                    />
                    <Row
                      label="Temp. prod. well (°C)"
                      value={plant.temp_prod_well_c}
                    />
                    <Row label="Flow rate (l/s)" value={plant.flow_rate_ls} />
                  </TabSection>
                )}

                {activeTab === "plant-commercial" && (
                  <TabSection title="Plant / Technology / Commercial">
                    <Row label="Number of unit" value={plant.number_of_unit} />
                    <Row
                      label="Plant technology"
                      value={plant.plant_technology}
                    />
                    <Row
                      label="Turbine supplier"
                      value={plant.turbine_supplier}
                    />
                    <Row label="EPC / suppliers" value={plant.epc_suppliers} />
                    <Row label="Legacy investor" value={plant.investor} />
                    <Row label="PPA, USD / kWh" value={plant.ppa_usd_kwh} />
                    <Row
                      label="Total investment cost"
                      value={plant.total_investment_cost}
                    />
                  </TabSection>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="border border-gray-200 bg-white">
              <div className="flex min-h-[48px] items-center border-b border-gray-200 bg-[#f7f7f7] px-5">
                <h2 className="text-lg font-bold leading-none text-[#1f2937]">
                  Metadata & Review
                </h2>
              </div>
              <div className="px-5 py-3">
                <Row
                  label="Review status"
                  value={<ReviewStatusBadge value={plant.review_status} />}
                />
                <Row
                  label="Research status"
                  value={<ResearchBadge value={plant.research_status} />}
                />
                <Row label="Location X" value={plant.location_x} />
                <Row label="Location Y" value={plant.location_y} />
                <Row
                  label="Created by"
                  value={displayUserName(
                    plant.created_by_name,
                    plant.created_by_user_id
                  )}
                />
                <Row
                  label="Last updated by"
                  value={displayUserName(
                    plant.last_updated_by_name,
                    plant.last_updated_by_user_id
                  )}
                />
                <Row
                  label="Date created"
                  value={formatDisplayDate(plant.date_created)}
                />
                <Row
                  label="Date edited"
                  value={formatDisplayDate(plant.date_edited)}
                />
                <Row
                  label="Approved by"
                  value={displayUserName(
                    plant.approved_by_name,
                    plant.approved_by_user_id
                  )}
                />
                <Row
                  label="Approved on"
                  value={formatDisplayDate(plant.approved_at)}
                />
              </div>
            </section>
          </div>
        </section>

        <RelatedNewsCard
          name={plant.plant_name}
          group={plant.project_group}
          country={plant.country}
          owner={plant.owner_operator}
        />

        <section className="border border-gray-200 bg-white">
          <div className="flex min-h-[48px] items-center border-b border-gray-200 bg-[#f7f7f7] px-5">
            <h2 className="text-lg font-bold leading-none text-[#1f2937]">
              Sources & Notes
            </h2>
          </div>
          <div className="px-5 py-3">
            <Row label="Notes" value={plant.notes} labelWidth="170px" />
            <Row
              label="Website / information"
              value={plant.website_information}
              labelWidth="170px"
            />
          </div>
        </section>
      </main>

      <main className="print-only">
        <div className="print-doc">
          <div className="print-header">
            <div className="print-header-main">
              <div className="print-brand-block">
                <img src="/tge_logo.png" className="print-logo" alt="ThinkGeoEnergy" />
                <div className="print-brand-copy">
                  <div className="print-brand-line">Internal</div>
                  <div className="print-brand-line">Database</div>
                  <div className="print-brand-line">Platform</div>
                </div>
              </div>

              <div className="print-header-divider" />

              <div className="print-title-block">
                <div className="print-type">Plant Overview</div>
                <h1 className="print-title">{plant.plant_name || "NA"}</h1>
                <p className="print-subtitle">
                  {plant.country || "NA"} | {plant.region || "NA"} | {plant.location_text || "NA"}
                </p>
              </div>
            </div>

            <div className="print-summary-grid">
              <div className="print-summary-item">
                <div className="print-summary-label">Plant ID</div>
                <div className="print-summary-value">{plant.plant_id || "NA"}</div>
              </div>

              <div className="print-summary-item">
                <div className="print-summary-label">Installed MWe</div>
                <div className="print-summary-value">{plant.installed_capacity_mw ?? "NA"}</div>
              </div>

              <div className="print-summary-item">
                <div className="print-summary-label">Technology</div>
                <div className="print-summary-value">{plant.plant_technology || "NA"}</div>
              </div>

              <div className="print-summary-item">
                <div className="print-summary-label">Operator</div>
                <div className="print-summary-value">{plant.owner_operator || "NA"}</div>
              </div>

              <div className="print-summary-item">
                <div className="print-summary-label">COD</div>
                <div className="print-summary-value">{plant.cod || "NA"}</div>
              </div>

              <div className="print-summary-item">
                <div className="print-summary-label">Coordinates</div>
                <div className="print-summary-value">
                  {googleMapsUrl ? (
                    <a href={googleMapsUrl} target="_blank" rel="noreferrer">
                      {coordinatesText}
                    </a>
                  ) : (
                    "NA"
                  )}
                </div>
              </div>
            </div>
          </div>

          <section className="print-section">
            <h2 className="print-section-title">Description</h2>
            <p className="print-paragraph">
              {plant.edited_description ||
                "No editorial summary added yet. This space can later hold a short plant description, internal summary, or validated market narrative for quick understanding and future edit workflows."}
            </p>
          </section>

          <section className="print-section">
            <h2 className="print-section-title">Companies</h2>

            {plantCompanies.length === 0 ? (
              <p className="print-paragraph">No linked companies.</p>
            ) : (
              <div className="space-y-3">
                {primaryCompanies.length > 0 && (
                  <div>
                    <p className="print-paragraph">
                      <strong>Primary Companies</strong>
                    </p>
                    <div className="space-y-2">
                      {primaryCompanies.map((row) => (
                        <div key={row.company_plant_link_id} className="print-paragraph">
                          <strong>{row.company_name || "NA"}</strong>
                          {" | "}Role: {row.role || "NA"}
                          {row.role_detail ? ` | ${row.role_detail}` : ""}
                          {row.ownership_share !== null && row.ownership_share !== undefined
                            ? ` | Ownership: ${row.ownership_share}%`
                            : ""}
                          {row.is_primary ? " | Primary link" : ""}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {secondaryGroups.length > 0 && (
                  <div>
                    <p className="print-paragraph">
                      <strong>Secondary Companies</strong>
                    </p>
                    <div className="space-y-3">
                      {secondaryGroups.map((group) => (
                        <div key={group.groupName}>
                          <p className="print-paragraph">
                            <strong>{group.groupName}</strong>
                          </p>
                          <div className="space-y-2">
                            {group.items.map((row) => (
                              <div key={row.company_plant_link_id} className="print-paragraph">
                                <strong>{row.company_name || "NA"}</strong>
                                {" | "}Role: {row.role || "NA"}
                                {row.role_detail ? ` | ${row.role_detail}` : ""}
                                {row.ownership_share !== null && row.ownership_share !== undefined
                                  ? ` | Ownership: ${row.ownership_share}%`
                                  : ""}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {otherCompanies.length > 0 && (
                  <div>
                    <p className="print-paragraph">
                      <strong>Other Companies</strong>
                    </p>
                    <div className="space-y-2">
                      {otherCompanies.map((row) => (
                        <div key={row.company_plant_link_id} className="print-paragraph">
                          <strong>{row.company_name || "NA"}</strong>
                          {" | "}Role: {row.role || "NA"}
                          {row.role_detail ? ` | ${row.role_detail}` : ""}
                          {row.ownership_share !== null && row.ownership_share !== undefined
                            ? ` | Ownership: ${row.ownership_share}%`
                            : ""}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="print-section">
            <h2 className="print-section-title">Location & Legacy Fields</h2>
            <div className="print-grid">
              <div className="print-row"><span>Plant ID</span><strong>{plant.plant_id || "NA"}</strong></div>
              <div className="print-row"><span>Plant name</span><strong>{plant.plant_name || "NA"}</strong></div>
              <div className="print-row"><span>Project group</span><strong>{plant.project_group || "NA"}</strong></div>
              <div className="print-row"><span>Other name</span><strong>{plant.other_name || "NA"}</strong></div>
              <div className="print-row"><span>Legacy owner / operator</span><strong>{plant.owner_operator || "NA"}</strong></div>
              <div className="print-row"><span>Legacy developer</span><strong>{plant.developer || "NA"}</strong></div>
              <div className="print-row"><span>Location</span><strong>{plant.location_text || "NA"}</strong></div>
              <div className="print-row"><span>Country</span><strong>{plant.country || "NA"}</strong></div>
              <div className="print-row"><span>Region</span><strong>{plant.region || "NA"}</strong></div>
              <div className="print-row"><span>WB region</span><strong>{plant.wb_region || "NA"}</strong></div>
            </div>
          </section>

          <section className="print-section">
            <h2 className="print-section-title">Capacity & Timeline</h2>
            <div className="print-grid">
              <div className="print-row"><span>Potential min (MWe)</span><strong>{plant.potential_min_mw ?? "NA"}</strong></div>
              <div className="print-row"><span>Potential max (MWe)</span><strong>{plant.potential_max_mw ?? "NA"}</strong></div>
              <div className="print-row"><span>Installed capacity</span><strong>{plant.installed_capacity_mw ?? "NA"}</strong></div>
              <div className="print-row"><span>Capacity running</span><strong>{plant.capacity_running_mw ?? "NA"}</strong></div>
              <div className="print-row"><span>Gross production (GWh)</span><strong>{plant.gross_production_gwh ?? "NA"}</strong></div>
              <div className="print-row"><span>Start of dev. (year)</span><strong>{plant.start_dev_year || "NA"}</strong></div>
              <div className="print-row"><span>COD</span><strong>{plant.cod || "NA"}</strong></div>
            </div>
          </section>

          <section className="print-section">
            <h2 className="print-section-title">Resource & Plant Status</h2>
            <div className="print-grid">
              <div className="print-row"><span>Resource type</span><strong>{plant.resource_type || "NA"}</strong></div>
              <div className="print-row"><span>Resource temp. (°C)</span><strong>{plant.resource_temp_c ?? "NA"}</strong></div>
              <div className="print-row"><span>Plant status</span><strong>{plant.project_phase || "NA"}</strong></div>
              <div className="print-row"><span>Historical phase/status</span><strong>{plant.phase_historical || "NA"}</strong></div>
              <div className="print-row"><span>Field name</span><strong>{plant.field_name || "NA"}</strong></div>
            </div>
          </section>

          <section className="print-section">
            <h2 className="print-section-title">Plant / Technology / Commercial</h2>
            <div className="print-grid">
              <div className="print-row"><span>Number of unit</span><strong>{plant.number_of_unit || "NA"}</strong></div>
              <div className="print-row"><span>Plant technology</span><strong>{plant.plant_technology || "NA"}</strong></div>
              <div className="print-row"><span>Turbine supplier</span><strong>{plant.turbine_supplier || "NA"}</strong></div>
              <div className="print-row"><span>EPC / suppliers</span><strong>{plant.epc_suppliers || "NA"}</strong></div>
              <div className="print-row"><span>Legacy investor</span><strong>{plant.investor || "NA"}</strong></div>
              <div className="print-row"><span>PPA, USD / kWh</span><strong>{plant.ppa_usd_kwh || "NA"}</strong></div>
              <div className="print-row"><span>Total investment cost</span><strong>{plant.total_investment_cost || "NA"}</strong></div>
            </div>
          </section>

          <section className="print-section">
            <h2 className="print-section-title">Notes & Sources</h2>
            <div className="print-grid">
              <div className="print-row"><span>Notes</span><strong>{plant.notes || "NA"}</strong></div>
              <div className="print-row"><span>Website / information</span><strong>{plant.website_information || "NA"}</strong></div>
            </div>
          </section>

          <footer className="print-footer">
            © {new Date().getFullYear()} ThinkGeoEnergy ehf. All rights reserved.
          </footer>
        </div>
      </main>
    </>
  );
}
