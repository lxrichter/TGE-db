"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { slugify } from "@/lib/slug";
import ActionButton from "@/components/ui/ActionButton";
import PhaseBadge from "@/components/ui/PhaseBadge";
import ResearchStatusBadge from "@/components/ui/ResearchStatusBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import { canEdit, canExport, type UserRole } from "@/lib/auth/roles";
import ExportExcelModal from "@/components/export/ExportExcelModal";
import {
  PLANT_EXPORT_COLUMNS,
  type ExportColumn,
} from "@/lib/export/plantsExportColumns";
import { downloadWorkbookFromRows } from "@/lib/export/exportWorkbook";

type PlantRow = {
  plant_id: string;
  plant_name: string | null;
  country: string | null;
  region: string | null;
  owner_operator: string | null;
  installed_capacity_mw: number | null;
  project_phase: string | null;
  plant_technology: string | null;
  research_status: string | null;
  review_status: string | null;
};

type SortKey =
  | "plant_name"
  | "country"
  | "owner_operator"
  | "installed_capacity_mw"
  | "project_phase"
  | "plant_technology"
  | "research_status"
  | "review_status";

function normalizePlantPhase(value: string | null) {
  const raw = (value || "").trim();
  const normalized = raw.toLowerCase();

  if (!normalized) return "NA";
  if (normalized.includes("operat")) return "Operating";
  if (normalized.includes("construct")) return "Construction";
  if (normalized.includes("explor")) return "Exploration";
  if (normalized.includes("pre-feas")) return "Pre-Feasibility";
  if (normalized === "feasibility" || normalized.includes("feas")) return "Feasibility";
  if (normalized.includes("stall")) return "Stalled";
  if (normalized.includes("tbd")) return "TBD";
  if (normalized.includes("cancel")) return "Cancelled";

  return raw;
}

function getPlantPhaseOrder(phase: string) {
  const normalized = phase.toLowerCase();

  if (normalized === "operating") return 1;
  if (normalized === "construction") return 2;
  if (normalized === "exploration") return 3;
  if (normalized === "pre-feasibility") return 4;
  if (normalized === "feasibility") return 5;
  if (normalized === "stalled") return 6;
  if (normalized === "tbd") return 7;
  if (normalized === "cancelled") return 8;

  return 999;
}

function normalizeReviewStatus(value: string | null) {
  const normalized = (value || "").trim().toLowerCase();

  if (!normalized) return "NA";
  if (normalized === "approved") return "Approved";
  if (normalized === "pending_review") return "Pending Review";

  return value || "NA";
}

function getReviewStatusOrder(value: string) {
  const normalized = value.toLowerCase();

  if (normalized === "pending review") return 1;
  if (normalized === "approved") return 2;
  if (normalized === "na") return 3;

  return 999;
}

function ReviewStatusBadge({ value }: { value: string | null }) {
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

  return <StatusBadge tone="neutralSoft">{value || "NA"}</StatusBadge>;
}

function SortableHeader({
  label,
  column,
  sortKey,
  sortDirection,
  onSort,
}: {
  label: string;
  column: SortKey;
  sortKey: SortKey;
  sortDirection: "asc" | "desc";
  onSort: (key: SortKey) => void;
}) {
  const active = sortKey === column;

  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className="flex items-center gap-1 text-left font-semibold"
    >
      <span>{label}</span>
      <span className="text-[10px] text-gray-400">
        {active ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
      </span>
    </button>
  );
}

function formatCount(value: number) {
  return Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
}

function formatMw(value: number, digits = 1) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function todayStamp() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

export default function PlantsPage() {
  const { data: session } = useSession();
const currentRole = ((session?.user as { role?: UserRole } | undefined)?.role ??
  null) as UserRole | null;
const userCanEdit = canEdit(currentRole);
const userCanExport = canExport(currentRole);

const [plants, setPlants] = useState<PlantRow[]>([]);
const [search, setSearch] = useState("");
const [sortKey, setSortKey] = useState<SortKey>("plant_name");
const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
const [countryFilter, setCountryFilter] = useState("All Countries");
const [phaseFilter, setPhaseFilter] = useState("All Phases");
const [researchStatusFilter, setResearchStatusFilter] = useState("All Research Status");
const [reviewStatusFilter, setReviewStatusFilter] = useState("All Review Status");

const [isExportModalOpen, setIsExportModalOpen] = useState(false);
const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch("/api/plants")
      .then((res) => res.json())
      .then((data) => setPlants(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error("Failed to load plants:", error);
        setPlants([]);
      });
  }, []);

  const countryOptions = useMemo(() => {
    const countries = Array.from(
      new Set(
        plants
          .map((p) => (p.country || "").trim())
          .filter((c) => c !== "")
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    return ["All Countries", ...countries];
  }, [plants]);

  const phaseOptions = useMemo(() => {
    const phases = Array.from(
      new Set(
        plants
          .map((p) => normalizePlantPhase(p.project_phase))
          .filter((phase) => phase !== "NA")
      )
    ).sort((a, b) => getPlantPhaseOrder(a) - getPlantPhaseOrder(b));

    return ["All Phases", ...phases];
  }, [plants]);

  const researchStatusOptions = [
    "All Research Status",
    "Done",
    "In Progress",
    "Need Info",
    "NA",
  ];

  const reviewStatusOptions = useMemo(() => {
    const statuses = Array.from(
      new Set(
        plants
          .map((p) => normalizeReviewStatus(p.review_status))
          .filter((status) => status !== "NA")
      )
    ).sort((a, b) => getReviewStatusOrder(a) - getReviewStatusOrder(b));

    return ["All Review Status", ...statuses];
  }, [plants]);

  const stats = useMemo(() => {
    const count = plants.length;
    const totalCapacity = plants.reduce(
      (sum, row) => sum + Number(row.installed_capacity_mw || 0),
      0
    );
    const countries = new Set(
      plants.map((p) => p.country).filter((v) => v && v.trim() !== "")
    ).size;
    const pendingReview = plants.filter(
      (p) => (p.review_status || "").trim().toLowerCase() === "pending_review"
    ).length;

    const orderedPhases = [
      "Operating",
      "Construction",
      "Exploration",
      "Pre-Feasibility",
      "Feasibility",
      "Stalled",
      "TBD",
      "Cancelled",
    ];

    const phaseCounts = orderedPhases
      .map((phase) => ({
        phase,
        count: plants.filter(
          (p) => normalizePlantPhase(p.project_phase) === phase
        ).length,
      }))
      .filter((item) => item.count > 0);

    return { count, totalCapacity, countries, pendingReview, phaseCounts };
  }, [plants]);

  const filteredAndSorted = useMemo(() => {
    const query = search.trim().toLowerCase();

    let filtered = plants.filter((row) => {
      if (!query) return true;

      return [
        row.plant_id,
        row.plant_name,
        row.country,
        row.region,
        row.owner_operator,
        row.project_phase,
        row.plant_technology,
        row.research_status,
        row.review_status,
      ]
        .map((v) => (v ?? "").toString().toLowerCase())
        .some((v) => v.includes(query));
    });

    if (countryFilter !== "All Countries") {
      filtered = filtered.filter(
        (row) => (row.country || "").trim() === countryFilter
      );
    }

    if (phaseFilter !== "All Phases") {
      filtered = filtered.filter(
        (row) => normalizePlantPhase(row.project_phase) === phaseFilter
      );
    }

    function normalizeResearchStatus(value: string | null) {
      const v = (value || "").trim().toLowerCase();

      if (!v || v === "na" || v === "n/a") return "NA";
      if (v.includes("done")) return "Done";
      if (v.includes("progress")) return "In Progress";
      if (v.includes("need")) return "Need Info";

      return "NA";
    }

if (researchStatusFilter !== "All Research Status") {
  filtered = filtered.filter(
    (row) => normalizeResearchStatus(row.research_status) === researchStatusFilter
  );
}

    if (reviewStatusFilter !== "All Review Status") {
      filtered = filtered.filter(
        (row) => normalizeReviewStatus(row.review_status) === reviewStatusFilter
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === "project_phase") {
        const aPhase = normalizePlantPhase(a.project_phase);
        const bPhase = normalizePlantPhase(b.project_phase);
        const result = getPlantPhaseOrder(aPhase) - getPlantPhaseOrder(bPhase);
        return sortDirection === "asc" ? result : -result;
      }

      if (sortKey === "review_status") {
        const aStatus = normalizeReviewStatus(a.review_status);
        const bStatus = normalizeReviewStatus(b.review_status);
        const result = getReviewStatusOrder(aStatus) - getReviewStatusOrder(bStatus);
        return sortDirection === "asc" ? result : -result;
      }

      const aVal = a[sortKey];
      const bVal = b[sortKey];

      const aNum = typeof aVal === "number" ? aVal : Number(aVal);
      const bNum = typeof bVal === "number" ? bVal : Number(bVal);

      const bothNumeric =
        !Number.isNaN(aNum) &&
        !Number.isNaN(bNum) &&
        sortKey === "installed_capacity_mw";

      let result = 0;

      if (bothNumeric) {
        result = aNum - bNum;
      } else {
        result = String(aVal ?? "").localeCompare(String(bVal ?? ""), undefined, {
          sensitivity: "base",
          numeric: true,
        });
      }

      return sortDirection === "asc" ? result : -result;
    });

    return sorted;
  }, [
    plants,
    search,
    countryFilter,
    phaseFilter,
    researchStatusFilter,
    reviewStatusFilter,
    sortKey,
    sortDirection,
  ]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  async function handleExport(selectedKeys: string[]) {
  try {
    setExporting(true);

    const res = await fetch("/api/plants/export", {
      method: "GET",
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json?.error || "Failed to export plants");
    }

    const selectedColumns: ExportColumn[] = PLANT_EXPORT_COLUMNS.filter((column) =>
      selectedKeys.includes(column.key)
    );

    downloadWorkbookFromRows({
      fileName: `${todayStamp()}_TGE_Plants_Export.xlsx`,
      sheetName: "Plants",
      columns: selectedColumns,
      rows: Array.isArray(json?.rows) ? json.rows : [],
    });

    setIsExportModalOpen(false);
  } catch (error) {
    console.error(error);
    alert(
      error instanceof Error ? error.message : "Failed to export plants."
    );
  } finally {
    setExporting(false);
  }
}

  return (
    <main className="space-y-8">
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-8 py-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
                Plants
              </p>
              <h1 className="mt-3 text-5xl font-bold tracking-tight text-[#1f2937]">
                Geothermal Plants Database
              </h1>
              <p className="mt-4 max-w-4xl text-lg leading-8 text-gray-600">
                Internal overview of geothermal power plants with linked detail pages,
                plant operating data, technical and commercial fields, research status,
                review workflow, and future edit/import workflows.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 xl:justify-end">
              {userCanEdit && (
                <ActionButton href="/research-ops" variant="secondary">
                  Research Ops
                </ActionButton>
              )}

              {userCanExport && (
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(true)}
                  className="inline-flex min-h-[38px] items-center justify-center whitespace-nowrap border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Export Excel
                </button>
              )}

              {userCanEdit && (
                <ActionButton href="/plants/new" variant="primary">
                  + New Plant
                </ActionButton>
              )}
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
                {formatCount(stats.count)}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Current plant entries
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Installed Capacity (MW)
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {formatMw(stats.totalCapacity, 1)}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Sum of installed capacity
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
                Distinct countries
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Pending Review
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {formatCount(stats.pendingReview)}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Records awaiting approval
              </div>
            </div>
          </div>
        </div>

        {stats.phaseCounts.length > 0 && (
          <div className="border-t border-gray-200 bg-[#fafafa] px-8 py-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span className="font-semibold uppercase tracking-wide text-gray-500">
                Plant Phases
              </span>
              {stats.phaseCounts.map((item) => (
                <span key={item.phase} className="text-gray-700">
                  <span className="font-medium text-[#1f2937]">{item.phase}</span>
                  <span className="mx-2 text-gray-300">|</span>
                  <span>{formatCount(item.count)}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-[#1f2937]">
            Plant Overview Table
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Search records, filter by country, phase, research status, and review status,
            and click a column header to sort.
          </p>
        </div>

        <div className="space-y-3 border-b border-gray-200 bg-[#f7f7f7] px-6 py-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                Country
              </label>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="w-full border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#8dc63f]"
              >
                {countryOptions.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                Plant Phase
              </label>
              <select
                value={phaseFilter}
                onChange={(e) => setPhaseFilter(e.target.value)}
                className="w-full border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#8dc63f]"
              >
                {phaseOptions.map((phase) => (
                  <option key={phase} value={phase}>
                    {phase}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                Research Status
              </label>
              <select
                value={researchStatusFilter}
                onChange={(e) => setResearchStatusFilter(e.target.value)}
                className="w-full border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#8dc63f]"
              >
                {researchStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                Review Status
              </label>
              <select
                value={reviewStatusFilter}
                onChange={(e) => setReviewStatusFilter(e.target.value)}
                className="w-full border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#8dc63f]"
              >
                {reviewStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, name, country, region, operator, phase, technology, research status..."
            className="w-full border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#8dc63f]"
          />
        </div>

        <div className="px-6 pt-3">
          <p className="text-xs text-gray-500">
            Scroll horizontally to view all columns.
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-max">
            <table className="min-w-[1550px] text-sm">
              <colgroup>
                <col className="w-[95px]" />
                <col className="w-[220px]" />
                <col className="w-[95px]" />
                <col className="w-[240px]" />
                <col className="w-[95px]" />
                <col className="w-[135px]" />
                <col className="w-[110px]" />
                <col className="w-[115px]" />
                <col className="w-[125px]" />
                <col className="w-[88px]" />
              </colgroup>

            <thead className="bg-gray-100 text-left text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="border-b border-gray-200 px-4 py-2">Plant ID</th>
                <th className="border-b border-gray-200 px-4 py-2 min-w-[220px]">
                  <SortableHeader
                    label="Name"
                    column="plant_name"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="border-b border-gray-200 px-4 py-2 min-w-[120px]">
                  <SortableHeader
                    label="Country"
                    column="country"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="border-b border-gray-200 px-4 py-2 min-w-[190px]">
                  <SortableHeader
                    label="Operator"
                    column="owner_operator"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="border-b border-gray-200 px-4 py-2 min-w-[110px]">
                  <SortableHeader
                    label="Installed MW"
                    column="installed_capacity_mw"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="border-b border-gray-200 px-4 py-2 min-w-[150px]">
                  <SortableHeader
                    label="Plant Phase"
                    column="project_phase"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="border-b border-gray-200 px-4 py-2 min-w-[110px]">
                  <SortableHeader
                    label="Technology"
                    column="plant_technology"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="border-b border-gray-200 px-4 py-2 min-w-[140px]">
                  <SortableHeader
                    label="Research Status"
                    column="research_status"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="border-b border-gray-200 px-4 py-2 min-w-[140px]">
                  <SortableHeader
                    label="Review Status"
                    column="review_status"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="border-b border-gray-200 px-4 py-2 min-w-[72px]">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredAndSorted.map((plant) => (
                <tr key={plant.plant_id} className="hover:bg-gray-50">
                  <td className="border-b border-gray-100 px-4 py-2.5 font-mono text-xs text-gray-500">
                    {plant.plant_id}
                  </td>

                  <td className="border-b border-gray-100 px-4 py-2.5 align-top">
                    <Link
                      href={`/plants/${plant.plant_id}`}
                      className="font-medium text-[#1f2937] underline decoration-gray-300 underline-offset-4 hover:text-[#8dc63f]"
                    >
                      {plant.plant_name || "NA"}
                    </Link>
                  </td>

                  <td className="border-b border-gray-100 px-4 py-2.5 text-gray-700 align-top">
                    {plant.country ? (
                      <Link
                        href={`/markets/countries/${slugify(plant.country)}`}
                        className="underline decoration-gray-300 underline-offset-4 hover:text-[#8dc63f]"
                      >
                        {plant.country}
                      </Link>
                    ) : (
                      "NA"
                    )}
                  </td>

                  <td className="border-b border-gray-100 px-4 py-2.5 text-gray-700 align-top">
                    <div className="max-w-[220px] line-clamp-2 break-words leading-5">{plant.owner_operator || "NA"}</div>
                  </td>

                  <td className="border-b border-gray-100 px-4 py-2.5 text-gray-700">
                    {plant.installed_capacity_mw !== null && plant.installed_capacity_mw !== undefined
                      ? formatMw(plant.installed_capacity_mw, 1)
                      : "NA"}
                  </td>

                  <td className="border-b border-gray-100 px-4 py-2.5">
                    <PhaseBadge value={normalizePlantPhase(plant.project_phase)} />
                  </td>

                  <td className="border-b border-gray-100 px-4 py-2.5 text-gray-700">
                    {plant.plant_technology || "NA"}
                  </td>

                  <td className="border-b border-gray-100 px-4 py-2.5">
                    <ResearchStatusBadge value={plant.research_status} />
                  </td>

                  <td className="border-b border-gray-100 px-4 py-2.5">
                    <ReviewStatusBadge value={plant.review_status} />
                  </td>

                  <td className="border-b border-gray-100 px-3 py-2.5 text-center">
                    {userCanEdit ? (
                      <Link
                        href={`/plants/${plant.plant_id}/edit`}
                        className="inline-flex min-h-[28px] items-center justify-center whitespace-nowrap border border-[#8dc63f] bg-[#8dc63f] px-3 py-1 text-[11px] font-semibold leading-none text-white hover:border-[#79b12f] hover:bg-[#79b12f]"
                      >
                        Edit
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredAndSorted.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No matching plant records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
            </div>
        </div>
      </section>

      <ExportExcelModal
        title="Export Plants to Excel"
        columns={PLANT_EXPORT_COLUMNS}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        exporting={exporting}
      />
    </main>
  );
}
