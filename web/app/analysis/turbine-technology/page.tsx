"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AnalysisGovernanceQaSection } from "@/components/analysis/AnalysisGovernanceQa";
import { AnalysisModuleHero } from "@/components/analysis/AnalysisModuleHero";
import { getRequiredAnalysisModule } from "@/lib/analysis/modules";
import { slugify } from "@/lib/slug";

const turbineTechnologyModule = getRequiredAnalysisModule("turbine-technology");

type TechnologySummaryRow = {
  technology: string;
  installed_mw: number;
  operating_mw: number;
  units: number;
  avg_size_installed_mw: number;
  share_installed_pct: number;
};

type SupplierSummaryRow = {
  turbine_supplier: string;
  installed_capacity_mw: number;
  units: number;
  avg_size_turbine_mw: number;
};

type SupplierByCountryRow = {
  country: string;
  turbine_supplier: string;
  installed_capacity_mw: number;
};

type CountryRow = {
  country: string;
  total_mw: number;
  [key: string]: string | number;
};

type CoverageSummary = {
  plant_count: number;
  plants_with_installed_mwe: number;
  plants_missing_installed_mwe: number;
  plants_with_running_mwe: number;
  plants_missing_running_mwe: number;
  plants_with_unit_count: number;
  plants_missing_unit_count: number;
  plants_with_technology: number;
  plants_missing_technology: number;
  plants_unmapped_technology: number;
  plants_with_supplier: number;
  plants_missing_supplier: number;
  technology_values_seen: number;
  supplier_values_seen: number;
};

type TurbineApiResponse = {
  coverage: CoverageSummary;
  technologyOrder: string[];
  technologySummary: TechnologySummaryRow[];
  supplierSummary: SupplierSummaryRow[];
  supplierByCountryMw: SupplierByCountryRow[];
  technologyByCountryMw: CountryRow[];
  technologyByCountryPct: CountryRow[];
};

type SortDirection = "asc" | "desc";

type TechChartKey =
  | "Back Pressure"
  | "B-ORC"
  | "Flash"
  | "Dry Steam"
  | "Other";

type TechChartItem = {
  key: TechChartKey;
  label: string;
  mw: number;
  pct: number;
  color: string;
};

type SupplierChartItem = {
  label: string;
  mw: number;
  pct: number;
  color: string;
};

const TECH_COLORS: Record<TechChartKey, string> = {
  "Back Pressure": "#1f4e79",
  "B-ORC": "#4aa34a",
  Flash: "#7cc95f",
  "Dry Steam": "#c6dfb8",
  Other: "#c9c9c9",
};

const SUPPLIER_CHART_COLORS = [
  "#1f4e79",
  "#4aa34a",
  "#7cc95f",
  "#c6dfb8",
  "#c9c9c9",
];

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-[#f7f7f7] px-6 py-4">
        <h2 className="text-xl font-bold text-[#1f2937]">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        ) : null}
      </div>
      <div>{children}</div>
    </section>
  );
}

function formatNumber(value: number, digits = 1) {
  return Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function coveragePct(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function CoveragePanel({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: {
    label: string;
    value: number;
    total?: number;
    tone?: "default" | "warning";
  }[];
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-[#f7f7f7] px-5 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#6b8f2a]">
          Analysis Coverage
        </div>
        <h2 className="mt-1 text-base font-bold text-[#1f2937]">{title}</h2>
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      </div>
      <div className="grid grid-cols-1 divide-y divide-gray-100 md:grid-cols-2 md:divide-x md:divide-y-0">
        {items.map((item) => {
          const percent =
            typeof item.total === "number"
              ? coveragePct(item.value, item.total)
              : null;

          return (
            <div key={item.label} className="px-5 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                {item.label}
              </div>
              <div
                className={
                  item.tone === "warning"
                    ? "mt-1 text-2xl font-bold text-[#b45309]"
                    : "mt-1 text-2xl font-bold text-[#1f2937]"
                }
              >
                {formatNumber(item.value, 0)}
              </div>
              {percent !== null ? (
                <div className="mt-2 h-1.5 overflow-hidden bg-gray-100">
                  <div
                    className={
                      item.tone === "warning"
                        ? "h-full bg-[#f59e0b]"
                        : "h-full bg-[#8dc63f]"
                    }
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
              ) : null}
              {percent !== null ? (
                <div className="mt-1 text-xs text-gray-500">
                  {percent}% of plant rows
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function GovernanceMetric({
  label,
  value,
  note,
  tone = "default",
}: {
  label: string;
  value: string | number;
  note: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className="border border-gray-200 bg-white px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div
        className={`mt-1 text-xl font-bold ${
          tone === "warning" ? "text-amber-700" : "text-[#1f2937]"
        }`}
      >
        {value}
      </div>
      <p className="mt-1 text-xs leading-5 text-gray-600">{note}</p>
    </div>
  );
}

function TechnologyGovernanceReadiness({
  coverage,
}: {
  coverage: CoverageSummary;
}) {
  return (
    <AnalysisGovernanceQaSection
      title="Technology Analysis Readiness"
      description="These checks keep turbine technology and supplier benchmarks transparent. Missing capacity weakens MWe shares, missing units weakens average-size calculations, and unmapped values need taxonomy cleanup before subscriber-grade use."
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_0.8fr]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <GovernanceMetric
            label="Missing installed MWe"
            value={coverage.plants_missing_installed_mwe}
            note="Plant rows excluded or underweighted in installed-capacity shares."
            tone={coverage.plants_missing_installed_mwe ? "warning" : "default"}
          />
          <GovernanceMetric
            label="Missing unit count"
            value={coverage.plants_missing_unit_count}
            note="Rows weaken unit totals and average turbine-size calculations."
            tone={coverage.plants_missing_unit_count ? "warning" : "default"}
          />
          <GovernanceMetric
            label="Unmapped technology"
            value={coverage.plants_unmapped_technology}
            note="Technology values currently fall into tbd/other taxonomy buckets."
            tone={coverage.plants_unmapped_technology ? "warning" : "default"}
          />
          <GovernanceMetric
            label="Missing supplier"
            value={coverage.plants_missing_supplier}
            note="Supplier rankings include unknown/NA exposure until plant records are cleaned."
            tone={coverage.plants_missing_supplier ? "warning" : "default"}
          />
        </div>

        <div className="border border-amber-200 bg-white">
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3">
            <h3 className="text-sm font-bold text-[#1f2937]">
              Cleanup Routing
            </h3>
            <p className="mt-1 text-xs leading-5 text-amber-900">
              Resolve plant capacity, unit counts, technology taxonomy, and
              turbine supplier values in the operational workspaces.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-3 xl:grid-cols-1">
            {[
              { label: "Research Ops", href: "/postgres-preview/research-ops" },
              { label: "Plant Records", href: "/plants" },
              { label: "Technology Module", href: "/analysis/modules/turbine-technology" },
            ].map((route) => (
              <Link
                key={route.label}
                href={route.href}
                className="border border-gray-200 bg-[#fafafa] px-3 py-2 text-xs font-semibold text-[#1f2937] transition hover:border-[#8dc63f] hover:bg-[#f5faef]"
              >
                {route.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AnalysisGovernanceQaSection>
  );
}

function SortableHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 text-left font-semibold"
    >
      <span>{label}</span>
      <span className="text-[10px] text-gray-400">
        {active ? (direction === "asc" ? "▲" : "▼") : "↕"}
      </span>
    </button>
  );
}

function sortRows<T extends Record<string, any>>(
  rows: T[],
  key: string,
  direction: SortDirection
) {
  const sorted = [...rows].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    const aNum = Number(aVal);
    const bNum = Number(bVal);

    const bothNumeric = !Number.isNaN(aNum) && !Number.isNaN(bNum);

    let result = 0;

    if (bothNumeric) {
      result = aNum - bNum;
    } else {
      result = String(aVal ?? "").localeCompare(String(bVal ?? ""), undefined, {
        sensitivity: "base",
        numeric: true,
      });
    }

    return direction === "asc" ? result : -result;
  });

  return sorted;
}

function normalizeTechnologyBucket(raw: string): TechChartKey {
  const text = (raw || "").trim().toLowerCase();

  if (text.includes("back pressure")) return "Back Pressure";
  if (text.includes("b-orc") || text === "orc" || text.includes("binary")) {
    return "B-ORC";
  }
  if (
    text.includes("single flash") ||
    text.includes("double flash") ||
    text.includes("triple flash") ||
    text === "flash"
  ) {
    return "Flash";
  }
  if (text.includes("dry steam")) return "Dry Steam";

  return "Other";
}

function buildChartItemsFromTechnologyRows(
  rows: TechnologySummaryRow[]
): TechChartItem[] {
  const totals: Record<TechChartKey, number> = {
    "Back Pressure": 0,
    "B-ORC": 0,
    Flash: 0,
    "Dry Steam": 0,
    Other: 0,
  };

  rows.forEach((row) => {
    const bucket = normalizeTechnologyBucket(row.technology);
    totals[bucket] += Number(row.installed_mw || 0);
  });

  const totalMw = Object.values(totals).reduce((sum, value) => sum + value, 0);

  return (Object.keys(totals) as TechChartKey[]).map((key) => ({
    key,
    label: key,
    mw: totals[key],
    pct: totalMw > 0 ? (totals[key] / totalMw) * 100 : 0,
    color: TECH_COLORS[key],
  }));
}

function buildChartItemsFromCountryRows(rows: CountryRow[]): TechChartItem[] {
  const totals: Record<TechChartKey, number> = {
    "Back Pressure": 0,
    "B-ORC": 0,
    Flash: 0,
    "Dry Steam": 0,
    Other: 0,
  };

  rows.forEach((row) => {
    Object.entries(row).forEach(([key, value]) => {
      if (key === "country" || key === "total_mw") return;
      const bucket = normalizeTechnologyBucket(key);
      totals[bucket] += Number(value || 0);
    });
  });

  const totalMw = Object.values(totals).reduce((sum, value) => sum + value, 0);

  return (Object.keys(totals) as TechChartKey[]).map((key) => ({
    key,
    label: key,
    mw: totals[key],
    pct: totalMw > 0 ? (totals[key] / totalMw) * 100 : 0,
    color: TECH_COLORS[key],
  }));
}

function buildSupplierChartItems(rows: SupplierSummaryRow[]): SupplierChartItem[] {
  const sorted = [...rows].sort(
    (a, b) =>
      Number(b.installed_capacity_mw || 0) - Number(a.installed_capacity_mw || 0)
  );

  const top4 = sorted.slice(0, 4);
  const otherMw = sorted
    .slice(4)
    .reduce((sum, row) => sum + Number(row.installed_capacity_mw || 0), 0);

  const combined = [
    ...top4.map((row) => ({
      label: row.turbine_supplier || "NA",
      mw: Number(row.installed_capacity_mw || 0),
    })),
    ...(otherMw > 0 ? [{ label: "Other", mw: otherMw }] : []),
  ];

  const totalMw = combined.reduce((sum, item) => sum + item.mw, 0);

  return combined.map((item, index) => ({
    label: item.label,
    mw: item.mw,
    pct: totalMw > 0 ? (item.mw / totalMw) * 100 : 0,
    color:
      SUPPLIER_CHART_COLORS[
        Math.min(index, SUPPLIER_CHART_COLORS.length - 1)
      ],
  }));
}

function buildSupplierChartItemsFromCountryRows(
  rows: SupplierByCountryRow[]
): SupplierChartItem[] {
  const grouped = new Map<string, number>();

  rows.forEach((row) => {
    const key = (row.turbine_supplier || "NA").trim() || "NA";
    grouped.set(key, (grouped.get(key) || 0) + Number(row.installed_capacity_mw || 0));
  });

  const sorted = Array.from(grouped.entries())
    .map(([label, mw]) => ({ label, mw }))
    .sort((a, b) => b.mw - a.mw);

  const top4 = sorted.slice(0, 4);
  const otherMw = sorted.slice(4).reduce((sum, row) => sum + row.mw, 0);

  const combined = [
    ...top4,
    ...(otherMw > 0 ? [{ label: "Other", mw: otherMw }] : []),
  ];

  const totalMw = combined.reduce((sum, item) => sum + item.mw, 0);

  return combined.map((item, index) => ({
    label: item.label,
    mw: item.mw,
    pct: totalMw > 0 ? (item.mw / totalMw) * 100 : 0,
    color:
      SUPPLIER_CHART_COLORS[
        Math.min(index, SUPPLIER_CHART_COLORS.length - 1)
      ],
  }));
}

function CapacityShareBar({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: TechChartItem[];
}) {
  const totalMw = items.reduce((sum, item) => sum + item.mw, 0);

  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-[#f7f7f7] px-6 py-4">
        <h2 className="text-xl font-bold text-[#1f2937]">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>

      <div className="px-6 py-5">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm">
          {items.map((item) => (
            <div key={item.key} className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[#1f2937]">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t-2 border-t-[#4aa34a] pt-3">
          <div className="overflow-hidden border border-gray-200 bg-white">
            <div className="flex h-11 w-full">
              {items
                .filter((item) => item.mw > 0)
                .map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-center text-sm font-semibold text-[#111827]"
                    style={{
                      width: `${item.pct}%`,
                      backgroundColor: item.color,
                      color:
                        item.key === "Dry Steam" || item.key === "Other"
                          ? "#111827"
                          : "#ffffff",
                      minWidth: item.pct > 0 ? "36px" : "0",
                    }}
                    title={`${item.label}: ${formatNumber(item.mw, 0)} MWe (${formatNumber(
                      item.pct,
                      1
                    )}%)`}
                  >
                    {item.pct >= 6 ? formatNumber(item.mw, 0) : ""}
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {items.map((item) => (
            <div key={item.key} className="border border-gray-200 bg-[#fafafa] p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                {item.label}
              </div>
              <div className="mt-1 text-xl font-bold text-[#1f2937]">
                {formatNumber(item.mw, 0)} MWe
              </div>
              <div className="mt-1 text-sm text-gray-600">
                {formatNumber(item.pct, 1)}%
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Total installed capacity shown: {formatNumber(totalMw, 0)} MWe
        </div>
      </div>
    </section>
  );
}

function SupplierShareBar({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: SupplierChartItem[];
}) {
  const totalMw = items.reduce((sum, item) => sum + item.mw, 0);

  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-[#f7f7f7] px-6 py-4">
        <h2 className="text-xl font-bold text-[#1f2937]">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>

      <div className="px-6 py-5">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[#1f2937]">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t-2 border-t-[#4aa34a] pt-3">
          <div className="overflow-hidden border border-gray-200 bg-white">
            <div className="flex h-11 w-full">
              {items
                .filter((item) => item.mw > 0)
                .map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-center text-sm font-semibold"
                    style={{
                      width: `${item.pct}%`,
                      backgroundColor: item.color,
                      color:
                        item.label === "Other" || item.color === "#c6dfb8"
                          ? "#111827"
                          : "#ffffff",
                      minWidth: item.pct > 0 ? "36px" : "0",
                    }}
                    title={`${item.label}: ${formatNumber(item.mw, 0)} MWe (${formatNumber(
                      item.pct,
                      1
                    )}%)`}
                  >
                    {item.pct >= 8 ? formatNumber(item.mw, 0) : ""}
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {items.map((item) => (
            <div key={item.label} className="border border-gray-200 bg-[#fafafa] p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                {item.label}
              </div>
              <div className="mt-1 text-xl font-bold text-[#1f2937]">
                {formatNumber(item.mw, 0)} MWe
              </div>
              <div className="mt-1 text-sm text-gray-600">
                {formatNumber(item.pct, 1)}%
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Total installed capacity shown: {formatNumber(totalMw, 0)} MWe
        </div>
      </div>
    </section>
  );
}

export default function TurbineTechnologyPage() {
  const [data, setData] = useState<TurbineApiResponse | null>(null);
  const [search, setSearch] = useState("");

  const [techSortKey, setTechSortKey] = useState("technology");
  const [techSortDirection, setTechSortDirection] =
    useState<SortDirection>("asc");

  const [supplierSortKey, setSupplierSortKey] = useState("installed_capacity_mw");
  const [supplierSortDirection, setSupplierSortDirection] =
    useState<SortDirection>("desc");

  const [countryMwSortKey, setCountryMwSortKey] = useState("total_mw");
  const [countryMwSortDirection, setCountryMwSortDirection] =
    useState<SortDirection>("desc");

  const [countryPctSortKey, setCountryPctSortKey] = useState("total_mw");
  const [countryPctSortDirection, setCountryPctSortDirection] =
    useState<SortDirection>("desc");

  useEffect(() => {
    fetch("/api/analysis/turbine-technology")
      .then((res) => res.json())
      .then((json) => setData(json));
  }, []);

  function toggleSort(
    currentKey: string,
    currentDirection: SortDirection,
    nextKey: string,
    setKey: (key: string) => void,
    setDirection: (direction: SortDirection) => void
  ) {
    if (currentKey === nextKey) {
      setDirection(currentDirection === "asc" ? "desc" : "asc");
    } else {
      setKey(nextKey);
      setDirection("asc");
    }
  }

  const query = search.trim().toLowerCase();

  const technologyRows = useMemo(() => {
    if (!data) return [];
    let rows = [...data.technologySummary];

    if (query) {
      rows = rows.filter((row) =>
        [
          row.technology,
          row.installed_mw,
          row.operating_mw,
          row.units,
          row.avg_size_installed_mw,
          row.share_installed_pct,
        ]
          .map((v) => String(v ?? "").toLowerCase())
          .some((v) => v.includes(query))
      );
    }

    return sortRows(rows, techSortKey, techSortDirection);
  }, [data, query, techSortKey, techSortDirection]);

  const supplierRows = useMemo(() => {
    if (!data) return [];
    let rows = [...data.supplierSummary];

    if (query) {
      rows = rows.filter((row) =>
        [
          row.turbine_supplier,
          row.installed_capacity_mw,
          row.units,
          row.avg_size_turbine_mw,
        ]
          .map((v) => String(v ?? "").toLowerCase())
          .some((v) => v.includes(query))
      );
    }

    return sortRows(rows, supplierSortKey, supplierSortDirection);
  }, [data, query, supplierSortKey, supplierSortDirection]);

  const countryMwRows = useMemo(() => {
    if (!data) return [];
    let rows = [...data.technologyByCountryMw];

    if (query) {
      rows = rows.filter((row) =>
        Object.values(row)
          .map((v) => String(v ?? "").toLowerCase())
          .some((v) => v.includes(query))
      );
    }

    return sortRows(rows, countryMwSortKey, countryMwSortDirection);
  }, [data, query, countryMwSortKey, countryMwSortDirection]);

  const countryPctRows = useMemo(() => {
    if (!data) return [];
    let rows = [...data.technologyByCountryPct];

    if (query) {
      rows = rows.filter((row) =>
        Object.values(row)
          .map((v) => String(v ?? "").toLowerCase())
          .some((v) => v.includes(query))
      );
    }

    return sortRows(rows, countryPctSortKey, countryPctSortDirection);
  }, [data, query, countryPctSortKey, countryPctSortDirection]);

  const filteredSupplierByCountryRows = useMemo(() => {
    if (!data) return [];

    if (!query) return [];

    return data.supplierByCountryMw.filter((row) =>
      [row.country, row.turbine_supplier, row.installed_capacity_mw]
        .map((v) => String(v ?? "").toLowerCase())
        .some((v) => v.includes(query))
    );
  }, [data, query]);

  const matchedSupplierCountries = useMemo(() => {
    return Array.from(
      new Set(filteredSupplierByCountryRows.map((row) => row.country))
    );
  }, [filteredSupplierByCountryRows]);

  const kpis = useMemo(() => {
    if (!data) {
      return {
        plants: 0,
        technologies: 0,
        suppliers: 0,
        countries: 0,
        installed: 0,
      };
    }

    return {
      plants: data.coverage.plant_count,
      technologies: data.technologySummary.length,
      suppliers: data.supplierSummary.length,
      countries: data.technologyByCountryMw.length,
      installed: data.technologySummary.reduce(
        (sum, row) => sum + Number(row.installed_mw || 0),
        0
      ),
    };
  }, [data]);

  const chartItems = useMemo(() => {
    if (!data) return [];

    const countryMatches = query ? countryMwRows : [];

    if (countryMatches.length > 0) {
      return buildChartItemsFromCountryRows(countryMatches);
    }

    return buildChartItemsFromTechnologyRows(data.technologySummary);
  }, [data, query, countryMwRows]);

  const chartTitle = useMemo(() => {
    if (!data) return "Installed Capacity Share by Technology - Global";

    if (query && countryMwRows.length > 0) {
      if (countryMwRows.length === 1) {
        return `Installed Capacity Share by Technology - ${String(
          countryMwRows[0].country
        )}`;
      }

      return "Installed Capacity Share by Technology - Filtered Markets";
    }

    return "Installed Capacity Share by Technology - Global";
  }, [data, query, countryMwRows]);

  const chartSubtitle = useMemo(() => {
    if (!data) return "";

    if (query && countryMwRows.length > 0) {
      const countryNames = countryMwRows.map((row) => String(row.country));
      const preview =
        countryNames.length <= 3
          ? countryNames.join(", ")
          : `${countryNames.slice(0, 3).join(", ")} +${countryNames.length - 3} more`;

      return `Based on the currently filtered country-market data: ${preview}. Flash combines single, double, and triple flash. All remaining technologies are grouped as Other.`;
    }

    return "Global installed capacity split by technology bucket. Flash combines single, double, and triple flash. All remaining technologies are grouped as Other.";
  }, [data, query, countryMwRows]);

  const supplierChartItems = useMemo(() => {
    if (!data) return [];

    if (query && filteredSupplierByCountryRows.length > 0) {
      return buildSupplierChartItemsFromCountryRows(filteredSupplierByCountryRows);
    }

    return buildSupplierChartItems(data.supplierSummary);
  }, [data, query, filteredSupplierByCountryRows]);

  const supplierChartTitle = useMemo(() => {
    if (!data) return "Turbine Supplier Share - Global";

    if (query && matchedSupplierCountries.length > 0) {
      if (matchedSupplierCountries.length === 1) {
        return `Turbine Supplier Share - ${matchedSupplierCountries[0]}`;
      }

      return "Turbine Supplier Share - Filtered Markets";
    }

    return "Turbine Supplier Share - Global";
  }, [data, query, matchedSupplierCountries]);

  const supplierChartSubtitle = useMemo(() => {
    if (!data) return "";

    if (query && matchedSupplierCountries.length > 0) {
      const preview =
        matchedSupplierCountries.length <= 3
          ? matchedSupplierCountries.join(", ")
          : `${matchedSupplierCountries.slice(0, 3).join(", ")} +${
              matchedSupplierCountries.length - 3
            } more`;

      return `Installed capacity share by turbine supplier for: ${preview}. Shows top 4 suppliers individually, with all remaining suppliers grouped as Other.`;
    }

    return "Installed capacity share by turbine supplier at global level. Shows top 4 suppliers individually, with all remaining suppliers grouped as Other.";
  }, [data, query, matchedSupplierCountries]);

  if (!data) {
    return (
      <main className="space-y-8">
        <AnalysisModuleHero
          loading
          module={turbineTechnologyModule}
        />
      </main>
    );
  }

  return (
    <main className="space-y-8">
      <AnalysisModuleHero
        module={turbineTechnologyModule}
        scopeItems={[
          { value: kpis.plants, label: "Plants Analyzed" },
          { value: kpis.technologies, label: "Technologies" },
          { value: kpis.suppliers, label: "Suppliers" },
          { value: kpis.countries, label: "Country Markets" },
          { value: `${formatNumber(kpis.installed)} MWe`, label: "Installed" },
        ]}
      >
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 xl:grid-cols-5">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Plants Analyzed
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {kpis.plants}
              </div>
              <div className="mt-1 text-xs text-gray-500">Plant profiles in scope</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Technologies
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {kpis.technologies}
              </div>
              <div className="mt-1 text-xs text-gray-500">Technology categories</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Suppliers
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {kpis.suppliers}
              </div>
              <div className="mt-1 text-xs text-gray-500">Supplier profiles</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Country Markets
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {kpis.countries}
              </div>
              <div className="mt-1 text-xs text-gray-500">Market comparisons</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Installed MWe
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {formatNumber(kpis.installed)}
              </div>
              <div className="mt-1 text-xs text-gray-500">Installed capacity covered</div>
            </div>
          </div>
      </AnalysisModuleHero>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CoveragePanel
          title="Capacity & Unit Coverage"
          description="Shows whether the plant fields needed for installed MWe, operating MWe, and unit-based averages are complete enough for analysis."
          items={[
            {
              label: "With Installed MWe",
              value: data.coverage.plants_with_installed_mwe,
              total: data.coverage.plant_count,
            },
            {
              label: "Missing Installed MWe",
              value: data.coverage.plants_missing_installed_mwe,
              total: data.coverage.plant_count,
              tone: "warning",
            },
            {
              label: "With Unit Count",
              value: data.coverage.plants_with_unit_count,
              total: data.coverage.plant_count,
            },
            {
              label: "With Running MWe",
              value: data.coverage.plants_with_running_mwe,
              total: data.coverage.plant_count,
            },
            {
              label: "Missing Running MWe",
              value: data.coverage.plants_missing_running_mwe,
              total: data.coverage.plant_count,
              tone: "warning",
            },
            {
              label: "Missing Unit Count",
              value: data.coverage.plants_missing_unit_count,
              total: data.coverage.plant_count,
              tone: "warning",
            },
          ]}
        />

        <CoveragePanel
          title="Technology & Supplier Coverage"
          description="Flags where turbine technology and supplier fields still need cleanup before deeper benchmarking."
          items={[
            {
              label: "With Technology",
              value: data.coverage.plants_with_technology,
              total: data.coverage.plant_count,
            },
            {
              label: "Unmapped Technology",
              value: data.coverage.plants_unmapped_technology,
              total: data.coverage.plant_count,
              tone: "warning",
            },
            {
              label: "With Supplier",
              value: data.coverage.plants_with_supplier,
              total: data.coverage.plant_count,
            },
            {
              label: "Missing Supplier",
              value: data.coverage.plants_missing_supplier,
              total: data.coverage.plant_count,
              tone: "warning",
            },
          ]}
        />
      </section>

      <TechnologyGovernanceReadiness coverage={data.coverage} />

      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-[#f7f7f7] px-6 py-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search technology, supplier, country, MWe, units..."
            className="w-full border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#8dc63f]"
          />
        </div>
      </section>

      <CapacityShareBar
        title={chartTitle}
        subtitle={chartSubtitle}
        items={chartItems}
      />

      <SectionCard
        title="Technology Summary"
        description="Installed MWe, operating MWe, unit counts, average size, and installed share by technology."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="border-b border-gray-200 px-4 py-2">
                  <SortableHeader
                    label="Technology"
                    active={techSortKey === "technology"}
                    direction={techSortDirection}
                    onClick={() =>
                      toggleSort(
                        techSortKey,
                        techSortDirection,
                        "technology",
                        setTechSortKey,
                        setTechSortDirection
                      )
                    }
                  />
                </th>
                <th className="border-b border-gray-200 px-4 py-2">
                  <SortableHeader
                    label="MWe Installed"
                    active={techSortKey === "installed_mw"}
                    direction={techSortDirection}
                    onClick={() =>
                      toggleSort(
                        techSortKey,
                        techSortDirection,
                        "installed_mw",
                        setTechSortKey,
                        setTechSortDirection
                      )
                    }
                  />
                </th>
                <th className="border-b border-gray-200 px-4 py-2">
                  <SortableHeader
                    label="MWe Operating"
                    active={techSortKey === "operating_mw"}
                    direction={techSortDirection}
                    onClick={() =>
                      toggleSort(
                        techSortKey,
                        techSortDirection,
                        "operating_mw",
                        setTechSortKey,
                        setTechSortDirection
                      )
                    }
                  />
                </th>
                <th className="border-b border-gray-200 px-4 py-2">
                  <SortableHeader
                    label="# Units"
                    active={techSortKey === "units"}
                    direction={techSortDirection}
                    onClick={() =>
                      toggleSort(
                        techSortKey,
                        techSortDirection,
                        "units",
                        setTechSortKey,
                        setTechSortDirection
                      )
                    }
                  />
                </th>
                <th className="border-b border-gray-200 px-4 py-2">
                  <SortableHeader
                    label="Avg Size Installed MWe"
                    active={techSortKey === "avg_size_installed_mw"}
                    direction={techSortDirection}
                    onClick={() =>
                      toggleSort(
                        techSortKey,
                        techSortDirection,
                        "avg_size_installed_mw",
                        setTechSortKey,
                        setTechSortDirection
                      )
                    }
                  />
                </th>
                <th className="border-b border-gray-200 px-4 py-2">
                  <SortableHeader
                    label="Share Installed %"
                    active={techSortKey === "share_installed_pct"}
                    direction={techSortDirection}
                    onClick={() =>
                      toggleSort(
                        techSortKey,
                        techSortDirection,
                        "share_installed_pct",
                        setTechSortKey,
                        setTechSortDirection
                      )
                    }
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {technologyRows.map((row) => (
                <tr key={row.technology} className="hover:bg-gray-50">
                  <td className="border-b border-gray-100 px-4 py-2.5 font-medium">
                    {row.technology}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-2.5">
                    {formatNumber(row.installed_mw)}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-2.5">
                    {formatNumber(row.operating_mw)}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-2.5">
                    {formatNumber(row.units, 0)}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-2.5">
                    {formatNumber(row.avg_size_installed_mw)}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-2.5">
                    {formatNumber(row.share_installed_pct)}%
                  </td>
                </tr>
              ))}

              {technologyRows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No matching technology categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SupplierShareBar
        title={supplierChartTitle}
        subtitle={supplierChartSubtitle}
        items={supplierChartItems}
      />

      <SectionCard
        title="Turbine Supplier Summary"
        description="Installed MWe, unit counts, and average turbine size by supplier."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="border-b border-gray-200 px-4 py-2">
                  <SortableHeader
                    label="Turbine Supplier"
                    active={supplierSortKey === "turbine_supplier"}
                    direction={supplierSortDirection}
                    onClick={() =>
                      toggleSort(
                        supplierSortKey,
                        supplierSortDirection,
                        "turbine_supplier",
                        setSupplierSortKey,
                        setSupplierSortDirection
                      )
                    }
                  />
                </th>
                <th className="border-b border-gray-200 px-4 py-2">
                  <SortableHeader
                    label="Installed Capacity MWe"
                    active={supplierSortKey === "installed_capacity_mw"}
                    direction={supplierSortDirection}
                    onClick={() =>
                      toggleSort(
                        supplierSortKey,
                        supplierSortDirection,
                        "installed_capacity_mw",
                        setSupplierSortKey,
                        setSupplierSortDirection
                      )
                    }
                  />
                </th>
                <th className="border-b border-gray-200 px-4 py-2">
                  <SortableHeader
                    label="# Units"
                    active={supplierSortKey === "units"}
                    direction={supplierSortDirection}
                    onClick={() =>
                      toggleSort(
                        supplierSortKey,
                        supplierSortDirection,
                        "units",
                        setSupplierSortKey,
                        setSupplierSortDirection
                      )
                    }
                  />
                </th>
                <th className="border-b border-gray-200 px-4 py-2">
                  <SortableHeader
                    label="Avg Size Turbine MWe"
                    active={supplierSortKey === "avg_size_turbine_mw"}
                    direction={supplierSortDirection}
                    onClick={() =>
                      toggleSort(
                        supplierSortKey,
                        supplierSortDirection,
                        "avg_size_turbine_mw",
                        setSupplierSortKey,
                        setSupplierSortDirection
                      )
                    }
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {supplierRows.map((row) => (
                <tr key={row.turbine_supplier} className="hover:bg-gray-50">
                  <td className="border-b border-gray-100 px-4 py-2.5 font-medium">
                    {row.turbine_supplier}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-2.5">
                    {formatNumber(row.installed_capacity_mw)}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-2.5">
                    {formatNumber(row.units, 0)}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-2.5">
                    {formatNumber(row.avg_size_turbine_mw, 2)}
                  </td>
                </tr>
              ))}

              {supplierRows.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No matching suppliers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Technology by Country Market — MWe"
        description="Installed MWe by technology across country markets."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="border-b border-gray-200 px-4 py-2">
                  <SortableHeader
                    label="Market"
                    active={countryMwSortKey === "country"}
                    direction={countryMwSortDirection}
                    onClick={() =>
                      toggleSort(
                        countryMwSortKey,
                        countryMwSortDirection,
                        "country",
                        setCountryMwSortKey,
                        setCountryMwSortDirection
                      )
                    }
                  />
                </th>
                {data.technologyOrder.map((tech) => (
                  <th key={tech} className="border-b border-gray-200 px-4 py-2">
                    <SortableHeader
                      label={tech}
                      active={countryMwSortKey === tech}
                      direction={countryMwSortDirection}
                      onClick={() =>
                        toggleSort(
                          countryMwSortKey,
                          countryMwSortDirection,
                          tech,
                          setCountryMwSortKey,
                          setCountryMwSortDirection
                        )
                      }
                    />
                  </th>
                ))}
                <th className="border-b border-gray-200 px-4 py-2">
                  <SortableHeader
                    label="Total MWe"
                    active={countryMwSortKey === "total_mw"}
                    direction={countryMwSortDirection}
                    onClick={() =>
                      toggleSort(
                        countryMwSortKey,
                        countryMwSortDirection,
                        "total_mw",
                        setCountryMwSortKey,
                        setCountryMwSortDirection
                      )
                    }
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {countryMwRows.map((row) => (
                <tr key={row.country} className="hover:bg-gray-50">
                  <td className="border-b border-gray-100 px-4 py-2.5 font-medium">
                    <Link
                      href={`/markets/countries/${slugify(String(row.country))}`}
                      className="text-[#1f2937] underline decoration-gray-300 underline-offset-4 hover:text-[#8dc63f]"
                    >
                      {row.country}
                    </Link>
                  </td>
                  {data.technologyOrder.map((tech) => (
                    <td key={tech} className="border-b border-gray-100 px-4 py-2.5">
                      {formatNumber(Number(row[tech] || 0))}
                    </td>
                  ))}
                  <td className="border-b border-gray-100 px-4 py-2.5 font-semibold">
                    {formatNumber(Number(row.total_mw || 0))}
                  </td>
                </tr>
              ))}

              {countryMwRows.length === 0 && (
                <tr>
                  <td
                    colSpan={data.technologyOrder.length + 2}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No matching country-market MWe results found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Technology by Country Market — % Share"
        description="Installed share by technology across country markets."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="border-b border-gray-200 px-4 py-2">
                  <SortableHeader
                    label="Market"
                    active={countryPctSortKey === "country"}
                    direction={countryPctSortDirection}
                    onClick={() =>
                      toggleSort(
                        countryPctSortKey,
                        countryPctSortDirection,
                        "country",
                        setCountryPctSortKey,
                        setCountryPctSortDirection
                      )
                    }
                  />
                </th>
                {data.technologyOrder.map((tech) => (
                  <th key={tech} className="border-b border-gray-200 px-4 py-2">
                    <SortableHeader
                      label={tech}
                      active={countryPctSortKey === tech}
                      direction={countryPctSortDirection}
                      onClick={() =>
                        toggleSort(
                          countryPctSortKey,
                          countryPctSortDirection,
                          tech,
                          setCountryPctSortKey,
                          setCountryPctSortDirection
                        )
                      }
                    />
                  </th>
                ))}
                <th className="border-b border-gray-200 px-4 py-2">
                  <SortableHeader
                    label="Total MWe"
                    active={countryPctSortKey === "total_mw"}
                    direction={countryPctSortDirection}
                    onClick={() =>
                      toggleSort(
                        countryPctSortKey,
                        countryPctSortDirection,
                        "total_mw",
                        setCountryPctSortKey,
                        setCountryPctSortDirection
                      )
                    }
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {countryPctRows.map((row) => (
                <tr key={row.country} className="hover:bg-gray-50">
                  <td className="border-b border-gray-100 px-4 py-2.5 font-medium">
                    <Link
                      href={`/markets/countries/${slugify(String(row.country))}`}
                      className="text-[#1f2937] underline decoration-gray-300 underline-offset-4 hover:text-[#8dc63f]"
                    >
                      {row.country}
                    </Link>
                  </td>
                  {data.technologyOrder.map((tech) => (
                    <td key={tech} className="border-b border-gray-100 px-4 py-2.5">
                      {formatNumber(Number(row[tech] || 0))}%
                    </td>
                  ))}
                  <td className="border-b border-gray-100 px-4 py-2.5 font-semibold">
                    {formatNumber(Number(row.total_mw || 0))}
                  </td>
                </tr>
              ))}

              {countryPctRows.length === 0 && (
                <tr>
                  <td
                    colSpan={data.technologyOrder.length + 2}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No matching country-market percentage results found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </main>
  );
}
