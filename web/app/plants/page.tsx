"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { slugify } from "@/lib/slug";
import ActionButton from "@/components/ui/ActionButton";
import PhaseBadge from "@/components/ui/PhaseBadge";
import BaseResearchStatusBadge from "@/components/ui/ResearchStatusBadge";
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

const plantsClass = {
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
    "border-b border-[var(--tge-governance-muted-border)] px-4 py-2.5 align-middle",
  link:
    "font-medium text-[var(--tge-text-primary)] underline decoration-[var(--tge-governance-muted-border)] underline-offset-4 hover:text-[var(--tge-brand-green-dark)]",
  primaryPill:
    "inline-flex min-h-[28px] items-center justify-center whitespace-nowrap border border-[var(--tge-brand-green)] bg-[var(--tge-brand-green)] px-3 py-1 text-[11px] font-semibold leading-none text-[var(--tge-surface-card)] hover:border-[var(--tge-brand-green-dark)] hover:bg-[var(--tge-brand-green-dark)]",
};

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
    return <MissingValue />;
  }

  if (normalized === "approved") {
    return <StatusBadge tone="successSoft">Approved</StatusBadge>;
  }

  if (normalized === "pending_review") {
    return <StatusBadge tone="warningSoft">Pending Review</StatusBadge>;
  }

  return value ? (
    <StatusBadge tone="neutralSoft">{value}</StatusBadge>
  ) : (
    <MissingValue />
  );
}

function ResearchStatusBadge({ value }: { value: string | null }) {
  const normalized = (value || "").trim().toLowerCase();

  if (!normalized || normalized === "na" || normalized === "n/a") {
    return <MissingValue />;
  }

  return <BaseResearchStatusBadge value={value} />;
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
      <span className={`text-[10px] ${plantsClass.muted}`}>
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
const [phaseFilter, setPhaseFilter] = useState("All Statuses");
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

    return ["All Statuses", ...phases];
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

    const statusGroups = [
      {
        label: "Operating",
        badgeValue: "Operating",
        phases: ["Operating"],
      },
      {
        label: "Construction / Commissioning",
        badgeValue: "Construction",
        phases: ["Construction"],
      },
      {
        label: "Early / Unconfirmed",
        badgeValue: "Exploration",
        phases: ["Exploration", "Pre-Feasibility", "Feasibility", "TBD"],
      },
      {
        label: "Cancelled / Stalled",
        badgeValue: "Cancelled",
        phases: ["Cancelled", "Stalled"],
      },
    ];

    const statusOverview = statusGroups
      .map((group) => {
        const matching = plants.filter((plant) =>
          group.phases.includes(normalizePlantPhase(plant.project_phase))
        );

        return {
          ...group,
          count: matching.length,
          mw: matching.reduce(
            (sum, row) => sum + Number(row.installed_capacity_mw || 0),
            0
          ),
        };
      })
      .filter((item) => item.count > 0 || item.mw > 0);

    return { count, totalCapacity, countries, pendingReview, statusOverview };
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

    if (phaseFilter !== "All Statuses") {
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
    <main className="space-y-7">
      <section className={plantsClass.panel}>
        <div className="px-6 py-4 xl:px-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]">
                Plants
              </p>
              <h1 className={`mt-2 text-2xl font-bold tracking-tight ${plantsClass.title} xl:text-[2.2rem]`}>
                Geothermal Operating Fleet
              </h1>
              <p className={`mt-2 max-w-4xl text-base leading-7 ${plantsClass.body}`}>
                Operating-asset intelligence for geothermal plants, installed
                capacity, technology, operating status, operator signals, and
                country-level fleet comparisons.
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
                <ActionButton href="/plants/new" variant="primary">
                  + New Plant
                </ActionButton>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-6 py-4 xl:px-8">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 xl:grid-cols-4">
            <div>
              <div className={plantsClass.metricLabel}>
                Plants
              </div>
              <div className={`mt-1 text-2xl font-bold ${plantsClass.title}`}>
                {formatCount(stats.count)}
              </div>
              <div className={`mt-1 text-xs ${plantsClass.muted}`}>
                Current plants
              </div>
            </div>

            <div>
              <div className={plantsClass.metricLabel}>
                Installed Capacity (MWe)
              </div>
              <div className={`mt-1 text-2xl font-bold ${plantsClass.title}`}>
                {formatMw(stats.totalCapacity, 1)}
              </div>
              <div className={`mt-1 text-xs ${plantsClass.muted}`}>
                Sum of installed capacity
              </div>
            </div>

            <div>
              <div className={plantsClass.metricLabel}>
                Countries Covered
              </div>
              <div className={`mt-1 text-2xl font-bold ${plantsClass.title}`}>
                {formatCount(stats.countries)}
              </div>
              <div className={`mt-1 text-xs ${plantsClass.muted}`}>
                Distinct countries
              </div>
            </div>

            <div>
              <div className={plantsClass.metricLabel}>
                Pending Review
              </div>
              <div className={`mt-1 text-2xl font-bold ${plantsClass.title}`}>
                {formatCount(stats.pendingReview)}
              </div>
              <div className={`mt-1 text-xs ${plantsClass.muted}`}>
                Plants awaiting approval
              </div>
            </div>
          </div>
        </div>

        {stats.statusOverview.length > 0 && (
          <div className="border-t border-[var(--tge-governance-neutral-border)] px-5 py-3">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <h2 className={`text-lg font-bold ${plantsClass.title}`}>
                Operating Status Overview
              </h2>
              <p className={`text-sm ${plantsClass.muted}`}>
                Capacity-led fleet status distribution
              </p>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {stats.statusOverview.map((item) => (
                <div
                  key={item.label}
                  className="min-w-[176px] flex-1 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-3.5 py-2.5"
                >
                  <div className="mb-1.5">
                    <PhaseBadge value={item.badgeValue} />
                  </div>
                  <div className={`text-xl font-bold leading-none ${plantsClass.title}`}>
                    {formatMw(item.mw, 1)} <span className="text-sm font-semibold">MWe</span>
                  </div>
                  <div className={`mt-1.5 text-sm leading-5 ${plantsClass.body}`}>
                    {formatCount(item.count)} plants
                  </div>
                  <div className={`mt-1 text-xs font-semibold ${plantsClass.muted}`}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className={plantsClass.panel}>
        <div className={`${plantsClass.sectionHeader} px-5 py-3`}>
          <h2 className={`text-lg font-bold ${plantsClass.title}`}>
            Plant Overview Table
          </h2>
          <p className={`mt-1 text-sm ${plantsClass.muted}`}>
            Search plants, filter by country, status, research status, and review status,
            and click a column header to sort.
          </p>
        </div>

        <div className="space-y-3 border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-5 py-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
                Country
              </label>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className={`w-full px-3 py-2 text-sm ${plantsClass.input}`}
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
                Plant Status
              </label>
              <select
                value={phaseFilter}
                onChange={(e) => setPhaseFilter(e.target.value)}
                className={`w-full px-3 py-2 text-sm ${plantsClass.input}`}
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
                className={`w-full px-3 py-2 text-sm ${plantsClass.input}`}
              >
                {researchStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
                Review Status
              </label>
              <select
                value={reviewStatusFilter}
                onChange={(e) => setReviewStatusFilter(e.target.value)}
                className={`w-full px-3 py-2 text-sm ${plantsClass.input}`}
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
            placeholder="Search plants by name, country, operator, status, technology, or review state..."
            className={`w-full px-3 py-2 text-sm ${plantsClass.input}`}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-3">
          <p className={`text-sm ${plantsClass.muted}`}>
            Showing {formatCount(filteredAndSorted.length)} of{" "}
            {formatCount(plants.length)} plants. Scroll horizontally for
            secondary fields.
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-max">
            <table className="min-w-[1500px] table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[95px]" />
                <col className="w-[300px]" />
                <col className="w-[150px]" />
                <col className="w-[240px]" />
                <col className="w-[150px]" />
                <col className="w-[150px]" />
                <col className="w-[130px]" />
                <col className="w-[140px]" />
                <col className="w-[140px]" />
                <col className="w-[90px]" />
              </colgroup>

            <thead className="bg-[var(--tge-governance-neutral-bg)] text-left text-[11px] uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
              <tr>
                <th className={plantsClass.tableHead}>Plant ID</th>
                <th className={`${plantsClass.tableHead} min-w-[220px]`}>
                  <SortableHeader
                    label="Name"
                    column="plant_name"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className={`${plantsClass.tableHead} min-w-[120px]`}>
                  <SortableHeader
                    label="Country"
                    column="country"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className={`${plantsClass.tableHead} min-w-[190px]`}>
                  <SortableHeader
                    label="Operator"
                    column="owner_operator"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className={`${plantsClass.tableHead} min-w-[110px]`}>
                  <SortableHeader
                    label="Installed MWe"
                    column="installed_capacity_mw"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className={`${plantsClass.tableHead} min-w-[150px]`}>
                  <SortableHeader
                    label="Plant Status"
                    column="project_phase"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className={`${plantsClass.tableHead} min-w-[110px]`}>
                  <SortableHeader
                    label="Technology"
                    column="plant_technology"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className={`${plantsClass.tableHead} min-w-[140px]`}>
                  <SortableHeader
                    label="Research Status"
                    column="research_status"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className={`${plantsClass.tableHead} min-w-[140px]`}>
                  <SortableHeader
                    label="Review Status"
                    column="review_status"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className={`${plantsClass.tableHead} min-w-[72px]`}>
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--tge-governance-muted-border)]">
              {filteredAndSorted.map((plant) => (
                <tr key={plant.plant_id} className="transition hover:bg-[var(--tge-surface-subtle)]">
                  <td className={`${plantsClass.tableCell} font-mono text-xs ${plantsClass.muted}`}>
                    {plant.plant_id}
                  </td>

                  <td className={`${plantsClass.tableCell} align-top`}>
                    <Link
                      href={`/plants/${plant.plant_id}`}
                      className={`${plantsClass.link} line-clamp-2 text-[15px] font-semibold leading-5`}
                    >
                      {plant.plant_name || <MissingValue />}
                    </Link>
                  </td>

                  <td className={`${plantsClass.tableCell} align-top ${plantsClass.body}`}>
                    {plant.country ? (
                      <Link
                        href={`/markets/countries/${slugify(plant.country)}`}
                        className="underline decoration-[var(--tge-governance-muted-border)] underline-offset-4 hover:text-[var(--tge-brand-green-dark)]"
                      >
                        {plant.country}
                      </Link>
                    ) : (
                      <MissingValue />
                    )}
                  </td>

                  <td className={`${plantsClass.tableCell} align-top ${plantsClass.body}`}>
                    <div className="line-clamp-2 max-w-[220px] leading-5">
                      {plant.owner_operator || <MissingValue />}
                    </div>
                  </td>

                  <td className={`${plantsClass.tableCell} font-semibold ${plantsClass.title}`}>
                    {plant.installed_capacity_mw !== null && plant.installed_capacity_mw !== undefined
                      ? `${formatMw(plant.installed_capacity_mw, 1)} MWe`
                      : <MissingValue />}
                  </td>

                  <td className={plantsClass.tableCell}>
                    <PhaseBadge value={normalizePlantPhase(plant.project_phase)} />
                  </td>

                  <td className={`${plantsClass.tableCell} ${plantsClass.body}`}>
                    <span className="line-clamp-2">
                      {plant.plant_technology || <MissingValue />}
                    </span>
                  </td>

                  <td className={plantsClass.tableCell}>
                    <ResearchStatusBadge value={plant.research_status} />
                  </td>

                  <td className={plantsClass.tableCell}>
                    <ReviewStatusBadge value={plant.review_status} />
                  </td>

                  <td className="border-b border-[var(--tge-governance-muted-border)] px-3 py-2.5 text-center">
                    {userCanEdit ? (
                      <Link
                        href={`/plants/${plant.plant_id}/edit`}
                        className={plantsClass.primaryPill}
                      >
                        Edit
                      </Link>
                    ) : (
                      <span className={`text-xs ${plantsClass.muted}`}>—</span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredAndSorted.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className={`px-4 py-8 text-center text-sm ${plantsClass.muted}`}
                  >
                    No matching plants found.
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
