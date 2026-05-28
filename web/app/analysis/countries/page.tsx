"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AnalysisModuleHero } from "@/components/analysis/AnalysisModuleHero";
import { getRequiredAnalysisModule } from "@/lib/analysis/modules";
import { slugify } from "@/lib/slug";

const countryMarketsModule = getRequiredAnalysisModule("country-markets");

type CountrySummaryRow = {
  country: string;
  region: string;
  installed_mw: number;
  planned_mw: number;
  plant_count: number;
  project_count: number;
};

type RegionSummaryRow = {
  region: string;
  installed_mw: number;
  plant_count: number;
  country_count: number;
};

type ProjectPhaseRow = {
  country: string;
  region: string;
  exploration_mw: number;
  feasibility_mw: number;
  construction_mw: number;
  other_mw: number;
  total_planned_mw: number;
};

type CountriesApiResponse = {
  countrySummary: CountrySummaryRow[];
  regionSummary: RegionSummaryRow[];
  projectPhaseByCountry: ProjectPhaseRow[];
};

type SortDirection = "asc" | "desc";

const panelClass =
  "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]";
const panelHeaderClass =
  "border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)]";
const eyebrowClass =
  "text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]";
const titleTextClass = "text-[var(--tge-text-primary)]";
const bodyTextClass = "text-[var(--tge-text-secondary)]";
const tableHeadClass =
  "bg-[var(--tge-governance-neutral-bg)] text-left text-xs uppercase tracking-wide text-[var(--tge-governance-neutral-text)]";
const tableHeadCellClass =
  "border-b border-[var(--tge-governance-neutral-border)] px-4 py-2";
const tableRowClass = "hover:bg-[var(--tge-surface-subtle)]";
const tableCellClass =
  "border-b border-[var(--tge-governance-muted-border)] px-4 py-2.5";
const tablePrimaryCellClass = `${tableCellClass} font-medium`;
const tableStrongCellClass = `${tableCellClass} font-semibold`;
const emptyCellClass =
  "px-4 py-8 text-center text-sm text-[var(--tge-governance-muted-text)]";
const linkClass =
  "text-[var(--tge-text-primary)] underline decoration-[var(--tge-governance-muted-border)] underline-offset-4 hover:text-[var(--tge-brand-green-dark)]";

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
    <section className={panelClass}>
      <div className={`${panelHeaderClass} px-6 py-4`}>
        <h2 className={`text-xl font-bold ${titleTextClass}`}>{title}</h2>
        {description ? (
          <p className={`mt-1 text-sm ${bodyTextClass}`}>
            {description}
          </p>
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
      <span className="text-[10px] text-[var(--tge-governance-muted-text)]">
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

function HeroMetric({
  label,
  value,
  help,
}: {
  label: string;
  value: string | number;
  help: string;
}) {
  return (
    <div>
      <div className={eyebrowClass}>{label}</div>
      <div className={`mt-1 text-3xl font-bold ${titleTextClass}`}>{value}</div>
      <div className="mt-1 text-xs text-[var(--tge-governance-muted-text)]">
        {help}
      </div>
    </div>
  );
}

export default function CountriesAnalysisPage() {
  const [data, setData] = useState<CountriesApiResponse | null>(null);
  const [search, setSearch] = useState("");

  const [countrySortKey, setCountrySortKey] = useState("installed_mw");
  const [countrySortDirection, setCountrySortDirection] =
    useState<SortDirection>("desc");

  const [regionSortKey, setRegionSortKey] = useState("installed_mw");
  const [regionSortDirection, setRegionSortDirection] =
    useState<SortDirection>("desc");

  const [phaseSortKey, setPhaseSortKey] = useState("total_planned_mw");
  const [phaseSortDirection, setPhaseSortDirection] =
    useState<SortDirection>("desc");

  useEffect(() => {
    fetch("/api/analysis/countries")
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

  const countryRows = useMemo(() => {
    if (!data) return [];
    let rows = [...data.countrySummary];

    if (query) {
      rows = rows.filter((row) =>
        Object.values(row)
          .map((v) => String(v ?? "").toLowerCase())
          .some((v) => v.includes(query))
      );
    }

    return sortRows(rows, countrySortKey, countrySortDirection);
  }, [data, query, countrySortKey, countrySortDirection]);

  const regionRows = useMemo(() => {
    if (!data) return [];
    let rows = [...data.regionSummary];

    if (query) {
      rows = rows.filter((row) =>
        Object.values(row)
          .map((v) => String(v ?? "").toLowerCase())
          .some((v) => v.includes(query))
      );
    }

    return sortRows(rows, regionSortKey, regionSortDirection);
  }, [data, query, regionSortKey, regionSortDirection]);

  const phaseRows = useMemo(() => {
    if (!data) return [];
    let rows = [...data.projectPhaseByCountry];

    if (query) {
      rows = rows.filter((row) =>
        Object.values(row)
          .map((v) => String(v ?? "").toLowerCase())
          .some((v) => v.includes(query))
      );
    }

    return sortRows(rows, phaseSortKey, phaseSortDirection);
  }, [data, query, phaseSortKey, phaseSortDirection]);

  const kpis = useMemo(() => {
    if (!data) {
      return {
        countries: 0,
        regions: 0,
        installed: 0,
        planned: 0,
        plants: 0,
        projects: 0,
      };
    }

    return {
      countries: data.countrySummary.length,
      regions: data.regionSummary.length,
      installed: data.countrySummary.reduce((sum, row) => sum + Number(row.installed_mw || 0), 0),
      planned: data.countrySummary.reduce((sum, row) => sum + Number(row.planned_mw || 0), 0),
      plants: data.countrySummary.reduce((sum, row) => sum + Number(row.plant_count || 0), 0),
      projects: data.countrySummary.reduce((sum, row) => sum + Number(row.project_count || 0), 0),
    };
  }, [data]);

  if (!data) {
    return (
      <main className="space-y-8">
        <AnalysisModuleHero loading module={countryMarketsModule} />
      </main>
    );
  }

  return (
    <main className="space-y-8">
      <AnalysisModuleHero
        module={countryMarketsModule}
        scopeItems={[
          { value: kpis.countries, label: "Country Markets" },
          { value: kpis.regions, label: "Regions" },
          { value: `${formatNumber(kpis.installed)} MWe`, label: "Installed" },
          { value: `${formatNumber(kpis.planned)} MWe`, label: "Planned" },
        ]}
      >
        <div className="grid grid-cols-2 gap-x-8 gap-y-6 xl:grid-cols-6">
          <HeroMetric
            label="Country Markets"
            value={kpis.countries}
            help="Country markets in analysis"
          />
          <HeroMetric
            label="Regions"
            value={kpis.regions}
            help="TGE regional groups"
          />
          <HeroMetric
            label="Installed MWe"
            value={formatNumber(kpis.installed)}
            help="Plant installed capacity"
          />
          <HeroMetric
            label="Planned MWe"
            value={formatNumber(kpis.planned)}
            help="Project planned capacity"
          />
          <HeroMetric
            label="Plants"
            value={kpis.plants}
            help="Plants included"
          />
          <HeroMetric
            label="Projects"
            value={kpis.projects}
            help="Projects included"
          />
        </div>
      </AnalysisModuleHero>

      <section className={panelClass}>
        <div className={`${panelHeaderClass} px-6 py-3`}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search country, region, MWe, plants, projects, phases..."
            className="w-full border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-4 py-2 text-sm text-[var(--tge-text-primary)] outline-none focus:border-[var(--tge-brand-green)]"
          />
        </div>
      </section>

      <SectionCard
        title="Country Market Summary"
        description="Installed MWe, planned MWe, plant counts, and project counts by country market."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className={tableHeadClass}>
              <tr>
                <th className={tableHeadCellClass}>
                  <SortableHeader
                    label="Market"
                    active={countrySortKey === "country"}
                    direction={countrySortDirection}
                    onClick={() =>
                      toggleSort(
                        countrySortKey,
                        countrySortDirection,
                        "country",
                        setCountrySortKey,
                        setCountrySortDirection
                      )
                    }
                  />
                </th>
                <th className={tableHeadCellClass}>
                  <SortableHeader
                    label="TGE Region"
                    active={countrySortKey === "region"}
                    direction={countrySortDirection}
                    onClick={() =>
                      toggleSort(
                        countrySortKey,
                        countrySortDirection,
                        "region",
                        setCountrySortKey,
                        setCountrySortDirection
                      )
                    }
                  />
                </th>
                <th className={tableHeadCellClass}>
                  <SortableHeader
                    label="Installed MWe"
                    active={countrySortKey === "installed_mw"}
                    direction={countrySortDirection}
                    onClick={() =>
                      toggleSort(
                        countrySortKey,
                        countrySortDirection,
                        "installed_mw",
                        setCountrySortKey,
                        setCountrySortDirection
                      )
                    }
                  />
                </th>
                <th className={tableHeadCellClass}>
                  <SortableHeader
                    label="Planned MWe"
                    active={countrySortKey === "planned_mw"}
                    direction={countrySortDirection}
                    onClick={() =>
                      toggleSort(
                        countrySortKey,
                        countrySortDirection,
                        "planned_mw",
                        setCountrySortKey,
                        setCountrySortDirection
                      )
                    }
                  />
                </th>
                <th className={tableHeadCellClass}>
                  <SortableHeader
                    label="# Plants"
                    active={countrySortKey === "plant_count"}
                    direction={countrySortDirection}
                    onClick={() =>
                      toggleSort(
                        countrySortKey,
                        countrySortDirection,
                        "plant_count",
                        setCountrySortKey,
                        setCountrySortDirection
                      )
                    }
                  />
                </th>
                <th className={tableHeadCellClass}>
                  <SortableHeader
                    label="# Projects"
                    active={countrySortKey === "project_count"}
                    direction={countrySortDirection}
                    onClick={() =>
                      toggleSort(
                        countrySortKey,
                        countrySortDirection,
                        "project_count",
                        setCountrySortKey,
                        setCountrySortDirection
                      )
                    }
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {countryRows.map((row) => (
                <tr key={row.country} className={tableRowClass}>
                  <td className={tablePrimaryCellClass}>
                    <Link
                      href={`/markets/countries/${slugify(row.country)}`}
                      className={linkClass}
                    >
                      {row.country}
                    </Link>
                  </td>
                  <td className={tableCellClass}>
                    <Link
                      href={`/markets/regions/${slugify(row.region)}`}
                      className={linkClass}
                    >
                      {row.region}
                    </Link>
                  </td>
                  <td className={tableCellClass}>
                    {formatNumber(row.installed_mw)}
                  </td>
                  <td className={tableCellClass}>
                    {formatNumber(row.planned_mw)}
                  </td>
                  <td className={tableCellClass}>
                    {formatNumber(row.plant_count, 0)}
                  </td>
                  <td className={tableCellClass}>
                    {formatNumber(row.project_count, 0)}
                  </td>
                </tr>
              ))}

              {countryRows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className={emptyCellClass}
                  >
                    No matching country markets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Installed Capacity by TGE Region"
        description="Installed MWe, plant counts, and country-market counts by TGE region."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className={tableHeadClass}>
              <tr>
                <th className={tableHeadCellClass}>
                  <SortableHeader
                    label="TGE Region"
                    active={regionSortKey === "region"}
                    direction={regionSortDirection}
                    onClick={() =>
                      toggleSort(
                        regionSortKey,
                        regionSortDirection,
                        "region",
                        setRegionSortKey,
                        setRegionSortDirection
                      )
                    }
                  />
                </th>
                <th className={tableHeadCellClass}>
                  <SortableHeader
                    label="Installed MWe"
                    active={regionSortKey === "installed_mw"}
                    direction={regionSortDirection}
                    onClick={() =>
                      toggleSort(
                        regionSortKey,
                        regionSortDirection,
                        "installed_mw",
                        setRegionSortKey,
                        setRegionSortDirection
                      )
                    }
                  />
                </th>
                <th className={tableHeadCellClass}>
                  <SortableHeader
                    label="# Plants"
                    active={regionSortKey === "plant_count"}
                    direction={regionSortDirection}
                    onClick={() =>
                      toggleSort(
                        regionSortKey,
                        regionSortDirection,
                        "plant_count",
                        setRegionSortKey,
                        setRegionSortDirection
                      )
                    }
                  />
                </th>
                <th className={tableHeadCellClass}>
                  <SortableHeader
                    label="# Markets"
                    active={regionSortKey === "country_count"}
                    direction={regionSortDirection}
                    onClick={() =>
                      toggleSort(
                        regionSortKey,
                        regionSortDirection,
                        "country_count",
                        setRegionSortKey,
                        setRegionSortDirection
                      )
                    }
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {regionRows.map((row) => (
                <tr key={row.region} className={tableRowClass}>
                  <td className={tablePrimaryCellClass}>
                    <Link
                      href={`/markets/regions/${slugify(row.region)}`}
                      className={linkClass}
                    >
                      {row.region}
                    </Link>
                  </td>
                  <td className={tableCellClass}>
                    {formatNumber(row.installed_mw)}
                  </td>
                  <td className={tableCellClass}>
                    {formatNumber(row.plant_count, 0)}
                  </td>
                  <td className={tableCellClass}>
                    {formatNumber(row.country_count, 0)}
                  </td>
                </tr>
              ))}

              {regionRows.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className={emptyCellClass}
                  >
                    No matching regions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Projects in Development by Country Market and Phase"
        description="Pipeline view showing planned MWe split by phase group at country-market level."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className={tableHeadClass}>
              <tr>
                <th className={tableHeadCellClass}>
                  <SortableHeader
                    label="Market"
                    active={phaseSortKey === "country"}
                    direction={phaseSortDirection}
                    onClick={() =>
                      toggleSort(
                        phaseSortKey,
                        phaseSortDirection,
                        "country",
                        setPhaseSortKey,
                        setPhaseSortDirection
                      )
                    }
                  />
                </th>
                <th className={tableHeadCellClass}>
                  <SortableHeader
                    label="TGE Region"
                    active={phaseSortKey === "region"}
                    direction={phaseSortDirection}
                    onClick={() =>
                      toggleSort(
                        phaseSortKey,
                        phaseSortDirection,
                        "region",
                        setPhaseSortKey,
                        setPhaseSortDirection
                      )
                    }
                  />
                </th>
                <th className={tableHeadCellClass}>
                  <SortableHeader
                    label="Exploration MWe"
                    active={phaseSortKey === "exploration_mw"}
                    direction={phaseSortDirection}
                    onClick={() =>
                      toggleSort(
                        phaseSortKey,
                        phaseSortDirection,
                        "exploration_mw",
                        setPhaseSortKey,
                        setPhaseSortDirection
                      )
                    }
                  />
                </th>
                <th className={tableHeadCellClass}>
                  <SortableHeader
                    label="Feasibility MWe"
                    active={phaseSortKey === "feasibility_mw"}
                    direction={phaseSortDirection}
                    onClick={() =>
                      toggleSort(
                        phaseSortKey,
                        phaseSortDirection,
                        "feasibility_mw",
                        setPhaseSortKey,
                        setPhaseSortDirection
                      )
                    }
                  />
                </th>
                <th className={tableHeadCellClass}>
                  <SortableHeader
                    label="Construction MWe"
                    active={phaseSortKey === "construction_mw"}
                    direction={phaseSortDirection}
                    onClick={() =>
                      toggleSort(
                        phaseSortKey,
                        phaseSortDirection,
                        "construction_mw",
                        setPhaseSortKey,
                        setPhaseSortDirection
                      )
                    }
                  />
                </th>
                <th className={tableHeadCellClass}>
                  <SortableHeader
                    label="Other / TBD MWe"
                    active={phaseSortKey === "other_mw"}
                    direction={phaseSortDirection}
                    onClick={() =>
                      toggleSort(
                        phaseSortKey,
                        phaseSortDirection,
                        "other_mw",
                        setPhaseSortKey,
                        setPhaseSortDirection
                      )
                    }
                  />
                </th>
                <th className={tableHeadCellClass}>
                  <SortableHeader
                    label="Total Planned MWe"
                    active={phaseSortKey === "total_planned_mw"}
                    direction={phaseSortDirection}
                    onClick={() =>
                      toggleSort(
                        phaseSortKey,
                        phaseSortDirection,
                        "total_planned_mw",
                        setPhaseSortKey,
                        setPhaseSortDirection
                      )
                    }
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {phaseRows.map((row) => (
                <tr key={row.country} className={tableRowClass}>
                  <td className={tablePrimaryCellClass}>
                    <Link
                      href={`/markets/countries/${slugify(row.country)}`}
                      className={linkClass}
                    >
                      {row.country}
                    </Link>
                  </td>
                  <td className={tableCellClass}>
                    <Link
                      href={`/markets/regions/${slugify(row.region)}`}
                      className={linkClass}
                    >
                      {row.region}
                    </Link>
                  </td>
                  <td className={tableCellClass}>
                    {formatNumber(row.exploration_mw)}
                  </td>
                  <td className={tableCellClass}>
                    {formatNumber(row.feasibility_mw)}
                  </td>
                  <td className={tableCellClass}>
                    {formatNumber(row.construction_mw)}
                  </td>
                  <td className={tableCellClass}>
                    {formatNumber(row.other_mw)}
                  </td>
                  <td className={tableStrongCellClass}>
                    {formatNumber(row.total_planned_mw)}
                  </td>
                </tr>
              ))}

              {phaseRows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className={emptyCellClass}
                  >
                    No matching phase results found.
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
