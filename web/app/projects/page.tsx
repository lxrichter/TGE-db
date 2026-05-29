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

const projectsClass = {
  panel:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]",
  sectionHeader:
    "border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)]",
  title: "text-[var(--tge-text-primary)]",
  body: "text-[var(--tge-text-secondary)]",
  muted: "text-[var(--tge-governance-muted-text)]",
  metricLabel:
    "text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]",
  input:
    "rounded-none border border-[var(--tge-border-strong)] bg-[var(--tge-surface-card)] text-[var(--tge-text-primary)] outline-none focus:border-[var(--tge-brand-green)]",
  tableHead:
    "border-b border-[var(--tge-governance-neutral-border)] px-4 py-2.5",
  tableCell:
    "border-b border-[var(--tge-governance-muted-border)] px-4 py-3 align-middle",
  link:
    "font-medium text-[var(--tge-text-primary)] underline decoration-[var(--tge-governance-muted-border)] underline-offset-4 hover:text-[var(--tge-brand-green-dark)]",
  primaryPill:
    "inline-flex min-h-[28px] items-center justify-center whitespace-nowrap border border-[var(--tge-brand-green)] bg-[var(--tge-brand-green)] px-3 py-1 text-[11px] font-semibold leading-none text-[var(--tge-surface-card)] hover:border-[var(--tge-brand-green-dark)] hover:bg-[var(--tge-brand-green-dark)]",
};

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
        className="inline-flex min-h-[28px] items-center justify-center whitespace-nowrap border border-[var(--tge-governance-info-border)] bg-[var(--tge-governance-info-bg)] px-3 py-1 text-[11px] font-semibold leading-none text-[var(--tge-governance-info-text)] hover:underline"
      >
        Promoted → {promotedPlantId}
      </Link>
    ) : (
      <span className="inline-flex min-h-[28px] items-center justify-center whitespace-nowrap border border-[var(--tge-governance-info-border)] bg-[var(--tge-governance-info-bg)] px-3 py-1 text-[11px] font-semibold leading-none text-[var(--tge-governance-info-text)]">
        Promoted
      </span>
    );
  }

  return <span className={projectsClass.muted}>Active</span>;
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
      <span className={`text-[10px] ${projectsClass.muted}`}>
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

  if (normalized === "prospect" || normalized === "prospect / tbd") return 1;
  if (normalized === "tbd") return 1;
  if (normalized === "exploration") return 2;
  if (normalized === "pre-feasibility") return 3;
  if (normalized === "feasibility") return 4;
  if (normalized === "construction") return 5;
  if (normalized === "operating") return 6;
  if (normalized === "cancelled") return 7;
  if (normalized === "suspended") return 8;
  if (normalized === "stalled") return 9;

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
      "TBD",
      "Exploration",
      "Pre-Feasibility",
      "Feasibility",
      "Construction",
      "Operating",
      "Cancelled",
      "Suspended",
      "Stalled",
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
    <main className="space-y-7">
      <section className={projectsClass.panel}>
        <div className="px-6 py-4 xl:px-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]">
                Projects
              </p>
              <h1 className={`mt-2 text-2xl font-bold tracking-tight ${projectsClass.title} xl:text-[2.2rem]`}>
                Geothermal Project Pipeline
              </h1>
              <p className={`mt-2 max-w-4xl text-base leading-7 ${projectsClass.body}`}>
                Pipeline intelligence for geothermal prospects and development
                projects, with capacity signals, lifecycle state, research
                readiness, and record-level drilldowns.
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
                  className="inline-flex min-h-[38px] items-center justify-center whitespace-nowrap border border-[var(--tge-border-strong)] bg-[var(--tge-surface-card)] px-4 py-2 text-sm font-medium text-[var(--tge-governance-neutral-text)] hover:bg-[var(--tge-surface-subtle)]"
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

        <div className="border-t border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-6 py-4 xl:px-8">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 xl:grid-cols-4">
            <div>
              <div className={projectsClass.metricLabel}>
                Projects
              </div>
              <div className={`mt-1 text-2xl font-bold ${projectsClass.title}`}>
                {formatCount(stats.count)}
              </div>
              <div className={`mt-1 text-xs ${projectsClass.muted}`}>
                Current project entries in selected view
              </div>
            </div>

            <div>
              <div className={projectsClass.metricLabel}>
                Planned Installed Capacity
              </div>
              <div className={`mt-1 text-2xl font-bold ${projectsClass.title}`}>
                {formatMw(stats.totalCapacity, 1)}
              </div>
              <div className={`mt-1 text-xs ${projectsClass.muted}`}>
                Sum of planned installed capacity in selected view
              </div>
            </div>

            <div>
              <div className={projectsClass.metricLabel}>
                Countries Covered
              </div>
              <div className={`mt-1 text-2xl font-bold ${projectsClass.title}`}>
                {formatCount(stats.countries)}
              </div>
              <div className={`mt-1 text-xs ${projectsClass.muted}`}>
                Distinct countries
              </div>
            </div>

            <div>
              <div className={projectsClass.metricLabel}>
                Need Info
              </div>
              <div className={`mt-1 text-2xl font-bold ${projectsClass.title}`}>
                {formatCount(stats.needInfo)}
              </div>
              <div className={`mt-1 text-xs ${projectsClass.muted}`}>
                Projects still flagged for research follow-up
              </div>
            </div>
          </div>
        </div>
      </section>

      {stats.phaseOverview.length > 0 && (
        <section className={projectsClass.panel}>
          <div className={`${projectsClass.sectionHeader} px-6 py-4`}>
            <h2 className={`text-xl font-bold ${projectsClass.title}`}>
              Phase Overview
            </h2>
            <p className={`mt-1 text-sm ${projectsClass.muted}`}>
              Distribution of projects and associated planned MWe by development phase.
            </p>
          </div>

          <div className="px-5 py-4">
            <div className="flex gap-3 overflow-x-auto pb-1">
              {stats.phaseOverview.map((item) => (
                <div
                  key={item.phase}
                  className="min-w-[190px] flex-1 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-4 py-3"
                >
                  <div className="mb-2">
                    <PhaseBadge value={item.phase} />
                  </div>
                  <div className={`text-2xl font-bold leading-none ${projectsClass.title}`}>
                    {formatMw(item.mw, 1)} <span className="text-sm font-semibold">MWe</span>
                  </div>
                  <div className={`mt-2 text-sm leading-5 ${projectsClass.body}`}>
                    {formatCount(item.count)} projects
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className={projectsClass.panel}>
        <div className={`${projectsClass.sectionHeader} px-6 py-4`}>
          <h2 className={`text-xl font-bold ${projectsClass.title}`}>
            Project Overview Table
          </h2>
          <p className={`mt-1 text-sm ${projectsClass.muted}`}>
            Search projects, filter by view and country, and click a column header to sort.
          </p>
        </div>

        <div className="space-y-3 border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-5 py-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
                View
              </label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
                className={`w-full px-3 py-2 text-sm ${projectsClass.input}`}
              >
                <option value="active">Active Projects</option>
                <option value="promoted">Promoted / Archived Projects</option>
                <option value="all">All Projects</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
                Country
              </label>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className={`w-full px-3 py-2 text-sm ${projectsClass.input}`}
              >
                {countryOptions.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
                Project Phase
              </label>
              <select
                value={phaseFilter}
                onChange={(e) => setPhaseFilter(e.target.value)}
                className={`w-full px-3 py-2 text-sm ${projectsClass.input}`}
              >
                {phaseOptions.map((phase) => (
                  <option key={phase} value={phase}>
                    {phase}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
                Research Status
              </label>
              <select
                value={researchStatusFilter}
                onChange={(e) => setResearchStatusFilter(e.target.value)}
                className={`w-full px-3 py-2 text-sm ${projectsClass.input}`}
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
            placeholder="Search projects by name, country, owner/operator, phase, technology, or review state..."
            className={`w-full px-3 py-2 text-sm ${projectsClass.input}`}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-3">
          <p className={`text-sm ${projectsClass.muted}`}>
            Showing {formatCount(filteredAndSorted.length)} of{" "}
            {formatCount(projects.length)} projects. Scroll horizontally for
            secondary fields.
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-max">
            <table className="min-w-[1500px] table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[100px]" />
                <col className="w-[300px]" />
                <col className="w-[150px]" />
                <col className="w-[220px]" />
                <col className="w-[150px]" />
                <col className="w-[150px]" />
                <col className="w-[130px]" />
                <col className="w-[140px]" />
                <col className="w-[140px]" />
                {userCanEdit && <col className="w-[90px]" />}
              </colgroup>

              <thead className="bg-[var(--tge-governance-neutral-bg)] text-left text-[11px] uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
                <tr>
                  <th className={projectsClass.tableHead}>Project ID</th>
                  <th className={projectsClass.tableHead}>
                    <SortableHeader
                      label="Name"
                      column="project_name"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className={projectsClass.tableHead}>
                    <SortableHeader
                      label="Country"
                      column="country"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className={projectsClass.tableHead}>
                    <SortableHeader
                      label="Owner / Operator"
                      column="owner_operator"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className={projectsClass.tableHead}>
                    <SortableHeader
                      label="Planned MWe"
                      column="installed_capacity_mw"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className={projectsClass.tableHead}>
                    <SortableHeader
                      label="Phase"
                      column="project_phase"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className={projectsClass.tableHead}>
                    <SortableHeader
                      label="Technology"
                      column="plant_technology"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className={projectsClass.tableHead}>
                    <SortableHeader
                      label="Research Status"
                      column="research_status"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className={projectsClass.tableHead}>
                    <SortableHeader
                      label="Review Status"
                      column="review_status"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  {userCanEdit && (
                    <th className={projectsClass.tableHead}>Action</th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--tge-governance-muted-border)]">
                {filteredAndSorted.map((project) => (
                  <tr key={project.project_id} className="transition hover:bg-[var(--tge-surface-subtle)]">
                    <td className={`${projectsClass.tableCell} font-mono text-xs ${projectsClass.muted}`}>
                      {project.project_id}
                    </td>

                    <td className={projectsClass.tableCell}>
                      <Link
                        href={`/projects/${project.project_id}`}
                        className={`${projectsClass.link} line-clamp-2 text-[15px] font-semibold leading-5`}
                      >
                        {project.project_name || "NA"}
                      </Link>
                    </td>

                    <td className={`${projectsClass.tableCell} ${projectsClass.body}`}>
                      {project.country ? (
                        <Link
                          href={`/markets/countries/${slugify(project.country)}`}
                          className="underline decoration-[var(--tge-governance-muted-border)] underline-offset-4 hover:text-[var(--tge-brand-green-dark)]"
                        >
                          {project.country}
                        </Link>
                      ) : (
                        "NA"
                      )}
                    </td>

                    <td className={`${projectsClass.tableCell} ${projectsClass.body}`}>
                      <div className="line-clamp-2 max-w-[220px]">
                        {project.owner_operator || "NA"}
                      </div>
                    </td>

                    <td className={`${projectsClass.tableCell} font-semibold ${projectsClass.title}`}>
                      {project.installed_capacity_mw !== null &&
                      project.installed_capacity_mw !== undefined
                        ? `${formatMw(project.installed_capacity_mw, 1)} MWe`
                        : "NA"}
                    </td>

                    <td className={projectsClass.tableCell}>
                      <PhaseBadge value={project.project_phase} />
                    </td>

                    <td className={`${projectsClass.tableCell} ${projectsClass.body}`}>
                      <span className="line-clamp-2">
                        {project.plant_technology || "NA"}
                      </span>
                    </td>

                    <td className={projectsClass.tableCell}>
                      <ResearchStatusBadge value={project.research_status} />
                    </td>

                    <td className={projectsClass.tableCell}>
                      <ReviewStatusBadge value={project.review_status} />
                    </td>

                    {userCanEdit && (
                      <td className={projectsClass.tableCell}>
                        <Link
                          href={`/projects/${project.project_id}/edit`}
                          className={projectsClass.primaryPill}
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
                      className={`px-4 py-8 text-center text-sm ${projectsClass.muted}`}
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
