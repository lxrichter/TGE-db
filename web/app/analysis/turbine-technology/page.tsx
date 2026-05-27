"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { slugify } from "@/lib/slug";

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

type TurbineApiResponse = {
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
                    title={`${item.label}: ${formatNumber(item.mw, 0)} MW (${formatNumber(
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
                {formatNumber(item.mw, 0)} MW
              </div>
              <div className="mt-1 text-sm text-gray-600">
                {formatNumber(item.pct, 1)}%
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Total installed capacity shown: {formatNumber(totalMw, 0)} MW
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
                    title={`${item.label}: ${formatNumber(item.mw, 0)} MW (${formatNumber(
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
                {formatNumber(item.mw, 0)} MW
              </div>
              <div className="mt-1 text-sm text-gray-600">
                {formatNumber(item.pct, 1)}%
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Total installed capacity shown: {formatNumber(totalMw, 0)} MW
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
        technologies: 0,
        suppliers: 0,
        countries: 0,
        installed: 0,
      };
    }

    return {
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
        <div className="mb-4">
          <Link
            href="/analysis"
            className="text-sm font-semibold text-[#8dc63f] hover:underline"
          >
            ← Back to Analysis Workspace
          </Link>
          </div>
        <section className="border border-gray-200 bg-white">
          <div className="border-l-4 border-l-[#8dc63f] px-8 py-8">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
              Analysis
            </p>
            <h1 className="mt-3 text-5xl font-bold tracking-tight text-[#1f2937]">
              Turbine Technology Analysis
            </h1>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Loading analysis…
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-8">
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-8 py-8">
          <div className="max-w-5xl">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
              Analysis
            </p>
            <h1 className="mt-3 text-5xl font-bold tracking-tight text-[#1f2937]">
              Turbine Technology Analysis
            </h1>
            <p className="mt-4 max-w-5xl text-lg leading-8 text-gray-600">
              Installed and operating geothermal capacity by plant technology and
              turbine supplier, derived from the plants database.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-[#f7f7f7] px-8 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-700">
            <span className="font-semibold uppercase tracking-wide text-gray-500">
              Scope
            </span>
            <span>{kpis.technologies} Technologies</span>
            <span className="text-gray-300">|</span>
            <span>{kpis.suppliers} Suppliers</span>
            <span className="text-gray-300">|</span>
            <span>{kpis.countries} Country Markets</span>
            <span className="text-gray-300">|</span>
            <span>{formatNumber(kpis.installed)} MW Installed</span>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-[#fafafa] px-8 py-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 xl:grid-cols-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Technologies
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {kpis.technologies}
              </div>
              <div className="mt-1 text-xs text-gray-500">Technology rows</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Suppliers
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {kpis.suppliers}
              </div>
              <div className="mt-1 text-xs text-gray-500">Supplier rows</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Country Markets
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {kpis.countries}
              </div>
              <div className="mt-1 text-xs text-gray-500">Market comparison rows</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Installed MW
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {formatNumber(kpis.installed)}
              </div>
              <div className="mt-1 text-xs text-gray-500">Installed capacity covered</div>
            </div>
          </div>
        </div>
      </section>

      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-[#f7f7f7] px-6 py-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search technology, supplier, country, MW, units..."
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
        description="Installed MW, operating MW, unit counts, average size, and installed share by technology."
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
                    label="MW Installed"
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
                    label="MW Operating"
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
                    label="Avg Size Installed MW"
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
                    No matching technology records found.
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
        description="Installed MW, unit counts, and average turbine size by supplier."
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
                    label="Installed Capacity MW"
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
                    label="Avg Size Turbine MW"
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
                    No matching supplier records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Technology by Country Market — MW"
        description="Installed MW by technology across country markets."
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
                    label="Total MW"
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
                    No matching country-market MW records found.
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
                    label="Total MW"
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
                    No matching country-market percentage records found.
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
