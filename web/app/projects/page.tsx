"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { slugify } from "@/lib/slug";
import ActionButton from "@/components/ui/ActionButton";
import PhaseBadge, { normalizePhaseName } from "@/components/ui/PhaseBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import { canEdit, canExport, type UserRole } from "@/lib/auth/roles";
import ExportExcelModal from "@/components/export/ExportExcelModal";
import {
  PROJECT_EXPORT_COLUMNS,
  type ExportColumn,
} from "@/lib/export/projectsExportColumns";
import { downloadWorkbookFromRows } from "@/lib/export/exportWorkbook";

type ProjectRow = {
  project_id: string;
  project_name: string | null;
  country: string | null;
  region: string | null;
  owner_operator: string | null;
  installed_capacity_mw: number | null;
  potential_min_mw: number | null;
  project_phase: string | null;
  plant_technology: string | null;
  research_status: string | null;
  review_status?: string | null;
  is_promoted_to_plant?: number | null;
  promoted_plant_id?: string | null;
  promoted_at?: string | null;
};

type SortKey =
  | "project_name"
  | "country"
  | "owner_operator"
  | "installed_capacity_mw"
  | "project_phase"
  | "plant_technology"
  | "research_status"
  | "review_status";

type ViewMode = "active" | "promoted" | "all";

function ResearchStatusBadge({ value }: { value: string | null }) {
  const raw = (value || "").trim();
  const normalized = raw.toLowerCase();

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

  return <StatusBadge tone="neutralSoft">{raw}</StatusBadge>;
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

function LifecycleBadge({
  isPromoted,
  promotedPlantId,
}: {
  isPromoted?: number | null;
  promotedPlantId?: string | null;
}) {
  const promoted =
    Number(isPromoted ?? 0) === 1 || Boolean((promotedPlantId || "").trim());

  if (promoted) {
    return promotedPlantId ? (
      <Link
        href={`/plants/${promotedPlantId}`}
        className="inline-flex min-h-[28px] items-center justify-center whitespace-nowrap border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold leading-none text-blue-700 hover:underline"
      >
        Promoted → {promotedPlantId}
      </Link>
    ) : (
      <span className="inline-flex min-h-[28px] items-center justify-center whitespace-nowrap border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold leading-none text-blue-700">
        Promoted
      </span>
    );
  }

  return <span className="text-gray-400">Active</span>;
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

function getPhaseOrder(phase: string) {
  const normalized = phase.toLowerCase();

  if (normalized === "prospect") return 1;
  if (normalized === "exploration") return 2;
  if (normalized === "pre-feasibility") return 3;
  if (normalized === "feasibility") return 4;
  if (normalized === "construction") return 5;
  if (normalized === "stalled") return 6;
  if (normalized === "tbd") return 7;
  if (normalized === "cancelled") return 8;

  return 999;
}

function getPhaseMw(row: ProjectRow) {
  const phase = normalizePhaseName(row.project_phase).toLowerCase();

  if (phase === "prospect") {
    return Number(row.potential_min_mw || 0);
  }

  return Number(row.installed_capacity_mw || 0);
}

function todayStamp() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

export default function ProjectsPage() {
  const { data: session } = useSession();
  const currentRole = ((session?.user as { role?: UserRole } | undefined)?.role ??
    null) as UserRole | null;

const userCanEdit = canEdit(currentRole);
const userCanExport = canExport(currentRole);

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("project_name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [countryFilter, setCountryFilter] = useState("All Countries");
  const [phaseFilter, setPhaseFilter] = useState("All Phases");
  const [researchStatusFilter, setResearchStatusFilter] =
    useState("All Research Status");
  const [viewMode, setViewMode] = useState<ViewMode>("active");

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch(`/api/projects?view=${viewMode}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProjects(data);
        } else {
          console.error("Projects API did not return an array:", data);
          setProjects([]);
        }
      })
      .catch((error) => {
        console.error("Failed to load projects:", error);
        setProjects([]);
      });
  }, [viewMode]);

  const countryOptions = useMemo(() => {
    const countries = Array.from(
      new Set(
        projects
          .map((p) => (p.country || "").trim())
          .filter((c) => c !== "")
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    return ["All Countries", ...countries];
  }, [projects]);

  const phaseOptions = useMemo(() => {
    const phases = Array.from(
      new Set(
        projects
          .map((p) => normalizePhaseName(p.project_phase))
          .filter((phase) => phase !== "NA")
      )
    ).sort((a, b) => getPhaseOrder(a) - getPhaseOrder(b));

    return ["All Phases", ...phases];
  }, [projects]);

  const researchStatusOptions = [
    "All Research Status",
    "Done",
    "In Progress",
    "Need Info",
    "NA",
  ];

  const stats = useMemo(() => {
    const count = projects.length;
    const totalCapacity = projects.reduce(
      (sum, row) => sum + Number(row.installed_capacity_mw || 0),
      0
    );
    const countries = new Set(
      projects.map((p) => p.country).filter((v) => v && v.trim() !== "")
    ).size;
    const needInfo = projects.filter((p) =>
      (p.research_status || "").toLowerCase().includes("need")
    ).length;

    const phaseMap = projects.reduce<Record<string, { count: number; mw: number }>>(
      (acc, row) => {
        const phase = normalizePhaseName(row.project_phase);

        if (!acc[phase]) {
          acc[phase] = { count: 0, mw: 0 };
        }

        acc[phase].count += 1;
        acc[phase].mw += getPhaseMw(row);

        return acc;
      },
      {}
    );

    const preferredPhaseOrder = [
      "Prospect",
      "Exploration",
      "Pre-Feasibility",
      "Feasibility",
      "Construction",
      "Stalled",
      "TBD",
      "Cancelled",
    ];

    const phaseOverview = preferredPhaseOrder
      .filter((phase) => phaseMap[phase])
      .map((phase) => ({
        phase,
        count: phaseMap[phase].count,
        mw: phaseMap[phase].mw,
      }))
      .sort((a, b) => getPhaseOrder(a.phase) - getPhaseOrder(b.phase));

    return {
      count,
      totalCapacity,
      countries,
      needInfo,
      phaseOverview,
    };
  }, [projects]);

  const filteredAndSorted = useMemo(() => {
    const query = search.trim().toLowerCase();

    let filtered = projects.filter((row) => {
      if (!query) return true;

      return [
        row.project_id,
        row.project_name,
        row.country,
        row.owner_operator,
        row.region,
        row.project_phase,
        row.plant_technology,
        row.research_status,
        row.review_status,
        row.promoted_plant_id,
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
        (row) => normalizePhaseName(row.project_phase) === phaseFilter
      );
    }

    function normalizeResearchStatus(value: string | null | undefined) {
      const v = (value || "").toLowerCase();

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

    const sorted = [...filtered].sort((a, b) => {
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
    projects,
    search,
    countryFilter,
    phaseFilter,
    researchStatusFilter,
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

      const res = await fetch("/api/projects/export", {
        method: "GET",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Failed to export projects");
      }

      const selectedColumns: ExportColumn[] = PROJECT_EXPORT_COLUMNS.filter((column) =>
        selectedKeys.includes(column.key)
      );

      downloadWorkbookFromRows({
        fileName: `${todayStamp()}_TGE_Projects_Export.xlsx`,
        sheetName: "Projects",
        columns: selectedColumns,
        rows: Array.isArray(json?.rows) ? json.rows : [],
      });

      setIsExportModalOpen(false);
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "Failed to export projects."
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
                Projects
              </p>
              <h1 className="mt-3 text-5xl font-bold tracking-tight text-[#1f2937]">
                Geothermal Projects Database
              </h1>
              <p className="mt-4 max-w-4xl text-lg leading-8 text-gray-600">
                Internal overview of geothermal projects and prospects with linked detail
                pages, development status, research tracking, and future edit/review workflows.
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
                <ActionButton href="/projects/new" variant="primary">
                  + New Project
                </ActionButton>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-[#f7f7f7] px-8 py-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 xl:grid-cols-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Project Records
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {formatCount(stats.count)}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Current project entries in selected view
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Planned Installed Capacity
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {formatMw(stats.totalCapacity, 1)}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Sum of planned installed capacity in selected view
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
                Need Info
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {formatCount(stats.needInfo)}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Records still flagged for research follow-up
              </div>
            </div>
          </div>
        </div>
      </section>

      {stats.phaseOverview.length > 0 && (
        <section className="border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-bold text-[#1f2937]">
              Phase Overview
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Distribution of project records and associated MW by development phase.
            </p>
          </div>

          <div className="px-6 py-4">
            <div className="flex flex-wrap gap-3">
              {stats.phaseOverview.map((item) => (
                <div
                  key={item.phase}
                  className="min-w-[170px] border border-gray-200 bg-[#fafafa] px-4 py-3"
                >
                  <div className="mb-2">
                    <PhaseBadge value={item.phase} />
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    No of projects
                  </div>
                  <div className="text-lg font-bold text-[#1f2937]">
                    {formatCount(item.count)}
                  </div>
                  <div className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    MW Planned
                  </div>
                  <div className="text-base font-semibold text-[#1f2937]">
                    {formatMw(item.mw, 1)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-[#1f2937]">
            Project Overview Table
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Search records, filter by view and country, and click a column header to sort.
          </p>
        </div>

        <div className="space-y-3 border-b border-gray-200 bg-[#f7f7f7] px-6 py-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                View
              </label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
                className="w-full border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#8dc63f]"
              >
                <option value="active">Active Projects</option>
                <option value="promoted">Promoted / Archived Projects</option>
                <option value="all">All Projects</option>
              </select>
            </div>

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
                Project Phase
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
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, name, country, owner/operator, phase, technology, research status, review status, promoted plant..."
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
            <table className="min-w-[1750px] text-left text-sm">
              <colgroup>
                <col className="w-[120px]" />
                <col className="w-[260px]" />
                <col className="w-[150px]" />
                <col className="w-[220px]" />
                <col className="w-[170px]" />
                <col className="w-[140px]" />
                <col className="w-[130px]" />
                <col className="w-[140px]" />
                <col className="w-[150px]" />
                {userCanEdit && <col className="w-[100px]" />}
              </colgroup>

              <thead className="bg-gray-100 text-left text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="border-b border-gray-200 px-4 py-2">Project ID</th>
                  <th className="border-b border-gray-200 px-4 py-2">
                    <SortableHeader
                      label="Name"
                      column="project_name"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="border-b border-gray-200 px-4 py-2">
                    <SortableHeader
                      label="Country"
                      column="country"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="border-b border-gray-200 px-4 py-2">
                    <SortableHeader
                      label="Owner / Operator"
                      column="owner_operator"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="border-b border-gray-200 px-4 py-2">
                    <SortableHeader
                      label="Planned Installed Capacity"
                      column="installed_capacity_mw"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="border-b border-gray-200 px-4 py-2">
                    <SortableHeader
                      label="Phase"
                      column="project_phase"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="border-b border-gray-200 px-4 py-2">
                    <SortableHeader
                      label="Technology"
                      column="plant_technology"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="border-b border-gray-200 px-4 py-2">
                    <SortableHeader
                      label="Research Status"
                      column="research_status"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="border-b border-gray-200 px-4 py-2">
                    <SortableHeader
                      label="Review Status"
                      column="review_status"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  {userCanEdit && (
                    <th className="border-b border-gray-200 px-4 py-2">Action</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredAndSorted.map((project) => (
                  <tr key={project.project_id} className="hover:bg-gray-50">
                    <td className="border-b border-gray-100 px-4 py-2.5 font-mono text-xs text-gray-500">
                      {project.project_id}
                    </td>

                    <td className="border-b border-gray-100 px-4 py-2.5">
                      <Link
                        href={`/projects/${project.project_id}`}
                        className="font-medium text-[#1f2937] underline decoration-gray-300 underline-offset-4 hover:text-[#8dc63f]"
                      >
                        {project.project_name || "NA"}
                      </Link>
                    </td>

                    <td className="border-b border-gray-100 px-4 py-2.5 text-gray-700">
                      {project.country ? (
                        <Link
                          href={`/markets/countries/${slugify(project.country)}`}
                          className="underline decoration-gray-300 underline-offset-4 hover:text-[#8dc63f]"
                        >
                          {project.country}
                        </Link>
                      ) : (
                        "NA"
                      )}
                    </td>

                    <td className="border-b border-gray-100 px-4 py-2.5 text-gray-700">
                      <div className="max-w-[220px] break-words">
                        {project.owner_operator || "NA"}
                      </div>
                    </td>

                    <td className="border-b border-gray-100 px-4 py-2.5 text-gray-700">
                      {project.installed_capacity_mw !== null &&
                      project.installed_capacity_mw !== undefined
                        ? formatMw(project.installed_capacity_mw, 1)
                        : "NA"}
                    </td>

                    <td className="border-b border-gray-100 px-4 py-2.5">
                      <PhaseBadge value={project.project_phase} />
                    </td>

                    <td className="border-b border-gray-100 px-4 py-2.5 text-gray-700">
                      {project.plant_technology || "NA"}
                    </td>

                    <td className="border-b border-gray-100 px-4 py-2.5">
                      <ResearchStatusBadge value={project.research_status} />
                    </td>

                    <td className="border-b border-gray-100 px-4 py-2.5">
                      <ReviewStatusBadge value={project.review_status} />
                    </td>

                    {userCanEdit && (
                      <td className="border-b border-gray-100 px-4 py-2.5">
                        <Link
                          href={`/projects/${project.project_id}/edit`}
                          className="inline-flex min-h-[28px] items-center justify-center whitespace-nowrap border border-[#8dc63f] bg-[#8dc63f] px-3 py-1 text-[11px] font-semibold leading-none text-white hover:border-[#79b12f] hover:bg-[#79b12f]"
                        >
                          Edit
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}

                {filteredAndSorted.length === 0 && (
                  <tr>
                    <td
                      colSpan={userCanEdit ? 10 : 9}
                      className="px-4 py-8 text-center text-sm text-gray-500"
                    >
                      No projects found for the current search / filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </section>

      <ExportExcelModal
        title="Export Projects to Excel"
        columns={PROJECT_EXPORT_COLUMNS}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        exporting={exporting}
      />
    </main>
  );
}