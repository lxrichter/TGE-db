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
type ProjectColumnKey =
  | "project_id"
  | "project_name"
  | "country"
  | "owner_operator"
  | "installed_capacity_mw"
  | "project_phase"
  | "plant_technology"
  | "research_status"
  | "review_status";

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const projectColumnOptions: Array<{ key: ProjectColumnKey; label: string }> = [
  { key: "project_id", label: "Project ID" },
  { key: "project_name", label: "Project Name" },
  { key: "country", label: "Country" },
  { key: "owner_operator", label: "Owner / Operator" },
  { key: "installed_capacity_mw", label: "Planned MWe" },
  { key: "project_phase", label: "Phase" },
  { key: "plant_technology", label: "Technology" },
  { key: "research_status", label: "Research Status" },
  { key: "review_status", label: "Review Status" },
];

const defaultVisibleColumns: Record<ProjectColumnKey, boolean> = {
  project_id: true,
  project_name: true,
  country: true,
  owner_operator: true,
  installed_capacity_mw: true,
  project_phase: true,
  plant_technology: true,
  research_status: true,
  review_status: true,
};

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
    "border-b border-[var(--tge-governance-neutral-border)] px-2.5 py-2",
  tableCell:
    "border-b border-[var(--tge-governance-muted-border)] px-2.5 py-2 align-middle",
  link:
    "font-medium text-[var(--tge-text-primary)] underline decoration-[var(--tge-governance-muted-border)] underline-offset-4 hover:text-[var(--tge-brand-green-dark)]",
  primaryPill:
    "inline-flex min-h-[28px] items-center justify-center whitespace-nowrap border border-[var(--tge-brand-green)] bg-[var(--tge-brand-green)] px-3 py-1 text-[11px] font-semibold leading-none text-[var(--tge-surface-card)] hover:border-[var(--tge-brand-green-dark)] hover:bg-[var(--tge-brand-green-dark)]",
};

function ResearchStatusBadge({ value }: { value: string | null }) {
  const raw = (value || "").trim();
  const normalized = raw.toLowerCase();

  if (!normalized || normalized === "na" || normalized === "n/a") {
    return <MissingValue />;
  }

  if (normalized.includes("done")) {
    return <StatusBadge tone="neutralSoft">Done</StatusBadge>;
  }

  if (normalized.includes("progress")) {
    return <StatusBadge tone="neutralSoft">In Progress</StatusBadge>;
  }

  if (normalized.includes("need")) {
    return <StatusBadge tone="neutralSoft">Need Info</StatusBadge>;
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
    return <MissingValue />;
  }

  if (normalized === "approved") {
    return <StatusBadge tone="neutralSoft">Approved</StatusBadge>;
  }

  if (normalized === "pending_review") {
    return <StatusBadge tone="neutralSoft">Pending Review</StatusBadge>;
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

function MissingValue() {
  return (
    <span className="text-sm text-[var(--tge-governance-muted-text)]">-</span>
  );
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

function phaseChartColor(phase: string) {
  const normalized = phase.toLowerCase();

  if (normalized.includes("operating")) return "var(--tge-chart-lifecycle-operating)";
  if (normalized.includes("construction")) return "var(--tge-chart-lifecycle-construction)";
  if (normalized.includes("feasibility") && !normalized.includes("pre")) {
    return "var(--tge-chart-lifecycle-feasibility)";
  }
  if (normalized.includes("pre-feasibility")) {
    return "var(--tge-chart-lifecycle-pre-feasibility)";
  }
  if (normalized.includes("exploration")) return "var(--tge-chart-lifecycle-exploration)";
  if (normalized.includes("cancelled") || normalized.includes("suspended")) {
    return "var(--tge-chart-lifecycle-cancelled)";
  }
  return "var(--tge-chart-lifecycle-prospect)";
}

function normalizeTechnologyBucket(value: string | null | undefined) {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (!normalized || normalized === "na" || normalized === "n/a") return "Other";
  if (normalized.includes("binary") || normalized.includes("orc")) return "Binary ORC";
  if (normalized.includes("dry steam")) return "Dry Steam";
  if (normalized.includes("back pressure") || normalized.includes("backpressure")) {
    return "Back Pressure";
  }
  if (normalized.includes("flash")) return "Flash";

  return "Other";
}

function technologyChartColor(label: string) {
  if (label === "Back Pressure") return "var(--tge-chart-tech-back-pressure)";
  if (label === "Binary ORC") return "var(--tge-chart-tech-binary-orc)";
  if (label === "Dry Steam") return "var(--tge-chart-tech-dry-steam)";
  if (label === "Flash") return "var(--tge-chart-tech-single-flash)";
  return "var(--tge-chart-tech-other)";
}

function PipelineRankingBars({
  title,
  description,
  rows,
  color,
}: {
  title: string;
  description: string;
  rows: Array<{ label: string; count: number; mw: number }>;
  color: string;
}) {
  const maxMw = Math.max(...rows.map((row) => row.mw), 1);

  return (
    <section className={projectsClass.panel}>
      <div className={`${projectsClass.sectionHeader} px-5 py-3`}>
        <h2 className={`text-lg font-bold ${projectsClass.title}`}>{title}</h2>
        <p className={`mt-1 text-sm ${projectsClass.muted}`}>{description}</p>
      </div>
      <div className="space-y-3 px-5 py-4">
        {rows.map((row) => {
          const width = Math.max(4, (row.mw / maxMw) * 100);
          const labelInside = width >= 38;

          return (
            <div key={row.label}>
              <div className="mb-1 flex items-center justify-between gap-4 text-sm">
                <span className={`truncate font-semibold ${projectsClass.title}`}>
                  {row.label}
                </span>
                <span className={`shrink-0 text-xs font-semibold ${projectsClass.muted}`}>
                  {formatCount(row.count)} projects
                </span>
              </div>
              <div className="relative h-5 bg-[var(--tge-governance-neutral-bg)]">
                <div
                  className="flex h-5 items-center justify-end pr-2"
                  style={{ width: `${width}%`, backgroundColor: color }}
                >
                  {labelInside ? (
                    <span className="text-[10px] font-bold text-[var(--tge-surface-card)]">
                      {formatMw(row.mw, 1)} MWe
                    </span>
                  ) : null}
                </div>
                {!labelInside ? (
                  <span
                    className={`absolute inset-y-0 flex items-center text-xs font-semibold ${projectsClass.title}`}
                    style={{ left: `calc(${width}% + 8px)` }}
                  >
                    {formatMw(row.mw, 1)} MWe
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PipelineByTechnology({
  rows,
}: {
  rows: Array<{ label: string; count: number; mw: number; color: string }>;
}) {
  const totalMw = rows.reduce((total, row) => total + row.mw, 0);

  return (
    <section className={projectsClass.panel}>
      <div className={`${projectsClass.sectionHeader} px-5 py-3`}>
        <h2 className={`text-lg font-bold ${projectsClass.title}`}>
          Pipeline by Technology
        </h2>
        <p className={`mt-1 text-sm ${projectsClass.muted}`}>
          Project pipeline capacity by declared geothermal technology.
        </p>
      </div>
      <div className="px-5 py-4">
        <div className="flex h-7 overflow-hidden bg-[var(--tge-governance-neutral-bg)]">
          {rows.map((row) => {
            const width = totalMw > 0 ? (row.mw / totalMw) * 100 : 0;
            if (width <= 0) return null;

            return (
              <div
                key={row.label}
                className="h-7"
                style={{ width: `${width}%`, backgroundColor: row.color }}
                title={`${row.label}: ${formatMw(row.mw, 1)} MWe`}
              />
            );
          })}
        </div>

        <div className="mt-4 space-y-2">
          {rows.map((row) => {
            const share = totalMw > 0 ? Math.round((row.mw / totalMw) * 100) : 0;

            return (
              <div key={row.label} className="flex items-center justify-between gap-3 text-xs">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0"
                    style={{ backgroundColor: row.color }}
                  />
                  <span className={`truncate font-semibold ${projectsClass.title}`}>
                    {row.label}
                  </span>
                </div>
                <span className={`shrink-0 font-semibold ${projectsClass.muted}`}>
                  {formatMw(row.mw, 1)} MWe · {share}% · {formatCount(row.count)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
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
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] =
    useState<Record<ProjectColumnKey, boolean>>(defaultVisibleColumns);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    countryFilter,
    phaseFilter,
    researchStatusFilter,
    viewMode,
    pageSize,
  ]);

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

    const phaseGroups = [
      {
        label: "Prospect / TBD",
        badgeValue: "Prospect",
        phases: ["Prospect", "TBD"],
      },
      {
        label: "Exploration",
        badgeValue: "Exploration",
        phases: ["Exploration"],
      },
      {
        label: "Pre-Feasibility",
        badgeValue: "Pre-Feasibility",
        phases: ["Pre-Feasibility"],
      },
      {
        label: "Feasibility",
        badgeValue: "Feasibility",
        phases: ["Feasibility"],
      },
      {
        label: "Construction",
        badgeValue: "Construction",
        phases: ["Construction"],
      },
      {
        label: "Operating",
        badgeValue: "Operating",
        phases: ["Operating"],
      },
      {
        label: "Cancelled / Suspended",
        badgeValue: "Cancelled",
        phases: ["Cancelled", "Suspended"],
      },
      {
        label: "Stalled",
        badgeValue: "Stalled",
        phases: ["Stalled"],
      },
    ];

    const phaseOverview = phaseGroups
      .map((group) => {
        const totals = group.phases.reduce(
          (acc, phase) => {
            acc.count += phaseMap[phase]?.count || 0;
            acc.mw += phaseMap[phase]?.mw || 0;
            return acc;
          },
          { count: 0, mw: 0 }
        );

        return {
          ...group,
          count: totals.count,
          mw: totals.mw,
        };
      })
      .filter((group) => group.count > 0 || group.mw > 0);

    const topProjectMarkets = Array.from(
      projects.reduce<Map<string, { label: string; count: number; mw: number }>>(
        (acc, row) => {
          const country = (row.country || "").trim();
          if (!country) return acc;

          const current = acc.get(country) ?? { label: country, count: 0, mw: 0 };
          current.count += 1;
          current.mw += getPhaseMw(row);
          acc.set(country, current);
          return acc;
        },
        new Map()
      ).values()
    )
      .filter((row) => row.mw > 0 || row.count > 0)
      .sort((a, b) => b.mw - a.mw)
      .slice(0, 5);

    const pipelineByTechnology = Array.from(
      projects.reduce<Map<string, { label: string; count: number; mw: number; color: string }>>(
        (acc, row) => {
          const label = normalizeTechnologyBucket(row.plant_technology);
          const current = acc.get(label) ?? {
            label,
            count: 0,
            mw: 0,
            color: technologyChartColor(label),
          };
          current.count += 1;
          current.mw += getPhaseMw(row);
          acc.set(label, current);
          return acc;
        },
        new Map()
      ).values()
    )
      .filter((row) => row.mw > 0 || row.count > 0)
      .sort((a, b) => b.mw - a.mw)
      .slice(0, 5);

    return {
      count,
      totalCapacity,
      countries,
      needInfo,
      phaseOverview,
      pipelineByTechnology,
      topProjectMarkets,
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

  const pageCount = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, pageCount);
  const pageStartIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedProjects = filteredAndSorted.slice(
    pageStartIndex,
    pageStartIndex + pageSize
  );
  const pageEndIndex = Math.min(pageStartIndex + pageSize, filteredAndSorted.length);

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [currentPage, pageCount]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  function applySavedView(view: "active" | "pipeline" | "needsResearch" | "all") {
    if (view === "active") {
      setViewMode("active");
      setPhaseFilter("All Phases");
      setResearchStatusFilter("All Research Status");
    }

    if (view === "pipeline") {
      setViewMode("active");
      setPhaseFilter("Construction");
      setResearchStatusFilter("All Research Status");
    }

    if (view === "needsResearch") {
      setViewMode("active");
      setPhaseFilter("All Phases");
      setResearchStatusFilter("Need Info");
    }

    if (view === "all") {
      setViewMode("all");
      setPhaseFilter("All Phases");
      setResearchStatusFilter("All Research Status");
    }
  }

  function isColumnVisible(key: ProjectColumnKey) {
    return visibleColumns[key];
  }

  function toggleColumn(key: ProjectColumnKey) {
    if (key === "project_name") return;
    setVisibleColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
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

  const totalPipelineMw = stats.phaseOverview.reduce(
    (total, item) => total + item.mw,
    0
  );
  const visibleTableColumnCount =
    projectColumnOptions.filter((column) => isColumnVisible(column.key)).length +
    (userCanEdit ? 1 : 0);

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
        <section className="grid gap-5 xl:grid-cols-[1.25fr_0.9fr_0.9fr]">
          <section className={projectsClass.panel}>
            <div className={`${projectsClass.sectionHeader} px-5 py-3`}>
              <h2 className={`text-lg font-bold ${projectsClass.title}`}>
                Project Lifecycle Distribution
              </h2>
              <p className={`mt-1 text-sm ${projectsClass.muted}`}>
                Pipeline capacity and project count by development phase.
              </p>
            </div>

            <div className="px-5 py-4">
              <div className="flex h-8 overflow-hidden bg-[var(--tge-governance-neutral-bg)]">
                {stats.phaseOverview.map((item) => {
                  const width =
                    totalPipelineMw > 0 ? (item.mw / totalPipelineMw) * 100 : 0;
                  if (width <= 0) return null;

                  return (
                    <div
                      key={item.label}
                      className="h-8"
                      style={{
                        width: `${width}%`,
                        backgroundColor: phaseChartColor(item.label),
                      }}
                      title={`${item.label}: ${formatMw(item.mw, 1)} MWe`}
                    />
                  );
                })}
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {stats.phaseOverview.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 border border-[var(--tge-governance-muted-border)] bg-[var(--tge-surface-card)] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <PhaseBadge value={item.badgeValue} />
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${projectsClass.title}`}>
                        {formatMw(item.mw, 1)} MWe
                      </div>
                      <div className={`text-xs ${projectsClass.muted}`}>
                        {formatCount(item.count)} projects
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <PipelineRankingBars
            title="Top Project Markets"
            description="Countries with the largest tracked project pipeline."
            rows={stats.topProjectMarkets}
            color="var(--tge-chart-ranking-pipeline-capacity)"
          />

          <PipelineByTechnology rows={stats.pipelineByTechnology} />
        </section>
      )}

      <section className={projectsClass.panel}>
          <div className={`${projectsClass.sectionHeader} px-5 py-3`}>
          <h2 className={`text-lg font-bold ${projectsClass.title}`}>
            Project Overview Table
          </h2>
          <p className={`mt-1 text-sm ${projectsClass.muted}`}>
            Search projects, filter by view and country, and click a column header to sort.
          </p>
        </div>

        <div className="space-y-3 border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-5 py-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applySavedView("active")}
              className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--tge-text-primary)] hover:border-[var(--tge-brand-green)]"
            >
              Active Projects
            </button>
            <button
              type="button"
              onClick={() => applySavedView("pipeline")}
              className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--tge-text-primary)] hover:border-[var(--tge-brand-green)]"
            >
              Construction Pipeline
            </button>
            <button
              type="button"
              onClick={() => applySavedView("needsResearch")}
              className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--tge-text-primary)] hover:border-[var(--tge-brand-green)]"
            >
              Needs Research
            </button>
            <button
              type="button"
              onClick={() => applySavedView("all")}
              className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--tge-text-primary)] hover:border-[var(--tge-brand-green)]"
            >
              All Projects
            </button>
          </div>

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

          <div className="flex flex-wrap items-center justify-between gap-3">
            <details className="relative">
              <summary className="inline-flex h-9 cursor-pointer items-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 text-xs font-semibold uppercase tracking-wide text-[var(--tge-text-primary)] hover:border-[var(--tge-brand-green)]">
                Columns
              </summary>
              <div className="absolute left-0 z-20 mt-2 w-64 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] p-3 shadow-lg">
                <div className={`mb-2 text-xs font-semibold uppercase tracking-wide ${projectsClass.muted}`}>
                  Default table columns
                </div>
                <div className="space-y-2">
                  {projectColumnOptions.map((column) => (
                    <label
                      key={column.key}
                      className="flex items-center gap-2 text-sm text-[var(--tge-text-primary)]"
                    >
                      <input
                        type="checkbox"
                        checked={isColumnVisible(column.key)}
                        disabled={column.key === "project_name"}
                        onChange={() => toggleColumn(column.key)}
                      />
                      <span>{column.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </details>

            <label className="flex items-center gap-2 text-sm text-[var(--tge-text-secondary)]">
              Rows per page
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className={`h-9 px-2 text-sm ${projectsClass.input}`}
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-3">
          <p className={`text-sm ${projectsClass.muted}`}>
            Showing {formatCount(filteredAndSorted.length === 0 ? 0 : pageStartIndex + 1)}
            -{formatCount(pageEndIndex)} of {formatCount(filteredAndSorted.length)}
            {" "}projects in this view.
          </p>
        </div>

        <div className="hidden px-5 py-3 xl:block">
            <table className="w-full table-fixed text-left text-[13px]">
              <colgroup>
                {isColumnVisible("project_id") && <col className="w-[5%]" />}
                {isColumnVisible("project_name") && <col className="w-[25%]" />}
                {isColumnVisible("country") && <col className="w-[10%]" />}
                {isColumnVisible("owner_operator") && <col className="w-[14%]" />}
                {isColumnVisible("installed_capacity_mw") && <col className="w-[8%]" />}
                {isColumnVisible("project_phase") && <col className="w-[9%]" />}
                {isColumnVisible("plant_technology") && <col className="w-[9%]" />}
                {isColumnVisible("research_status") && <col className="w-[8%]" />}
                {isColumnVisible("review_status") && <col className="w-[8%]" />}
                {userCanEdit && <col className="w-[5%]" />}
              </colgroup>

              <thead className="bg-[var(--tge-governance-neutral-bg)] text-left text-[11px] uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
                <tr>
                  {isColumnVisible("project_id") && (
                    <th className={projectsClass.tableHead}>Project ID</th>
                  )}
                  {isColumnVisible("project_name") && (
                    <th className={projectsClass.tableHead}>
                    <SortableHeader
                      label="Name"
                      column="project_name"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  )}
                  {isColumnVisible("country") && (
                    <th className={projectsClass.tableHead}>
                    <SortableHeader
                      label="Country"
                      column="country"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  )}
                  {isColumnVisible("owner_operator") && (
                    <th className={projectsClass.tableHead}>
                    <SortableHeader
                      label="Owner / Operator"
                      column="owner_operator"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  )}
                  {isColumnVisible("installed_capacity_mw") && (
                    <th className={projectsClass.tableHead}>
                    <SortableHeader
                      label="Planned MWe"
                      column="installed_capacity_mw"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  )}
                  {isColumnVisible("project_phase") && (
                    <th className={projectsClass.tableHead}>
                    <SortableHeader
                      label="Phase"
                      column="project_phase"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  )}
                  {isColumnVisible("plant_technology") && (
                    <th className={projectsClass.tableHead}>
                    <SortableHeader
                      label="Technology"
                      column="plant_technology"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  )}
                  {isColumnVisible("research_status") && (
                    <th className={projectsClass.tableHead}>
                    <SortableHeader
                      label="Research Status"
                      column="research_status"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  )}
                  {isColumnVisible("review_status") && (
                    <th className={projectsClass.tableHead}>
                    <SortableHeader
                      label="Review Status"
                      column="review_status"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  )}
                  {userCanEdit && (
                    <th className={projectsClass.tableHead}>Action</th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--tge-governance-muted-border)]">
                {paginatedProjects.map((project) => (
                  <tr key={project.project_id} className="transition hover:bg-[var(--tge-surface-subtle)]">
                    {isColumnVisible("project_id") && (
                      <td
                        className={`${projectsClass.tableCell} truncate font-mono text-[10px] ${projectsClass.muted}`}
                        title={project.project_id}
                      >
                      {project.project_id.slice(0, 8)}
                    </td>
                    )}

                    {isColumnVisible("project_name") && (
                      <td className={projectsClass.tableCell}>
                      <Link
                        href={`/projects/${project.project_id}`}
                        className={`${projectsClass.link} line-clamp-2 text-[15px] font-bold leading-5`}
                      >
                        {project.project_name || "NA"}
                      </Link>
                    </td>
                    )}

                    {isColumnVisible("country") && (
                      <td className={`${projectsClass.tableCell} ${projectsClass.body}`}>
                      {project.country ? (
                        <Link
                          href={`/markets/countries/${slugify(project.country)}`}
                          className="underline decoration-[var(--tge-governance-muted-border)] underline-offset-4 hover:text-[var(--tge-brand-green-dark)]"
                        >
                          {project.country}
                        </Link>
                      ) : (
                        <MissingValue />
                      )}
                    </td>
                    )}

                    {isColumnVisible("owner_operator") && (
                      <td className={`${projectsClass.tableCell} ${projectsClass.body}`}>
                      <div className="line-clamp-2">
                        {project.owner_operator || <MissingValue />}
                      </div>
                    </td>
                    )}

                    {isColumnVisible("installed_capacity_mw") && (
                      <td className={`${projectsClass.tableCell} font-semibold ${projectsClass.title}`}>
                      {project.installed_capacity_mw !== null &&
                      project.installed_capacity_mw !== undefined
                        ? `${formatMw(project.installed_capacity_mw, 1)} MWe`
                        : <MissingValue />}
                    </td>
                    )}

                    {isColumnVisible("project_phase") && (
                      <td className={projectsClass.tableCell}>
                      <PhaseBadge value={project.project_phase} />
                    </td>
                    )}

                    {isColumnVisible("plant_technology") && (
                      <td className={`${projectsClass.tableCell} ${projectsClass.body}`}>
                      <span className="line-clamp-2">
                        {project.plant_technology || <MissingValue />}
                      </span>
                    </td>
                    )}

                    {isColumnVisible("research_status") && (
                      <td className={projectsClass.tableCell}>
                      <ResearchStatusBadge value={project.research_status} />
                    </td>
                    )}

                    {isColumnVisible("review_status") && (
                      <td className={projectsClass.tableCell}>
                      <ReviewStatusBadge value={project.review_status} />
                    </td>
                    )}

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
                      colSpan={visibleTableColumnCount}
                      className={`px-4 py-8 text-center text-sm ${projectsClass.muted}`}
                    >
                      No projects found for the current search / filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
        </div>

        <div className="space-y-3 px-5 py-3 xl:hidden">
          {paginatedProjects.map((project) => (
            <article
              key={`card-${project.project_id}`}
              className="border border-[var(--tge-governance-muted-border)] bg-[var(--tge-surface-card)] p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className={`font-mono text-[11px] ${projectsClass.muted}`}>
                    {project.project_id}
                  </div>
                  <Link
                    href={`/projects/${project.project_id}`}
                    className={`${projectsClass.link} mt-1 block line-clamp-2 text-sm font-semibold leading-5`}
                  >
                    {project.project_name || "NA"}
                  </Link>
                </div>
                <PhaseBadge value={project.project_phase} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className={projectsClass.muted}>Country</div>
                  <div className={projectsClass.title}>{project.country || "-"}</div>
                </div>
                <div>
                  <div className={projectsClass.muted}>Planned MWe</div>
                  <div className={`font-semibold ${projectsClass.title}`}>
                    {project.installed_capacity_mw !== null &&
                    project.installed_capacity_mw !== undefined
                      ? `${formatMw(project.installed_capacity_mw, 1)} MWe`
                      : "-"}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className={projectsClass.muted}>Owner / Operator</div>
                  <div className={`${projectsClass.title} line-clamp-2`}>
                    {project.owner_operator || "-"}
                  </div>
                </div>
                <div>
                  <div className={projectsClass.muted}>Research</div>
                  <ResearchStatusBadge value={project.research_status} />
                </div>
                <div>
                  <div className={projectsClass.muted}>Review</div>
                  <ReviewStatusBadge value={project.review_status} />
                </div>
              </div>
              {userCanEdit && (
                <div className="mt-3">
                  <Link
                    href={`/projects/${project.project_id}/edit`}
                    className={projectsClass.primaryPill}
                  >
                    Edit
                  </Link>
                </div>
              )}
            </article>
          ))}
          {filteredAndSorted.length === 0 && (
            <div className={`border border-[var(--tge-governance-muted-border)] bg-[var(--tge-surface-card)] px-4 py-6 text-center text-sm ${projectsClass.muted}`}>
              No projects found for the current search / filters.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-[var(--tge-governance-neutral-border)] px-5 py-3 md:flex-row md:items-center md:justify-between">
          <div className={`text-sm ${projectsClass.muted}`}>
            Page {formatCount(safeCurrentPage)} of {formatCount(pageCount)}
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--tge-text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={safeCurrentPage >= pageCount}
              onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
              className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--tge-text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
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
