"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { slugify } from "@/lib/slug";

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
              Country Market Analysis
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
              Country Market Analysis
            </h1>
            <p className="mt-4 max-w-5xl text-lg leading-8 text-gray-600">
              Country-market geothermal analysis derived from the plants and
              projects database, including installed MWe, planned MWe, TGE region,
              and project phase distribution.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-[#f7f7f7] px-8 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-700">
            <span className="font-semibold uppercase tracking-wide text-gray-500">
              Scope
            </span>
            <span>{kpis.countries} Country Markets</span>
            <span className="text-gray-300">|</span>
            <span>{kpis.regions} Regions</span>
            <span className="text-gray-300">|</span>
            <span>{formatNumber(kpis.installed)} MWe Installed</span>
            <span className="text-gray-300">|</span>
            <span>{formatNumber(kpis.planned)} MWe Planned</span>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-[#fafafa] px-8 py-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 xl:grid-cols-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Country Markets
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {kpis.countries}
              </div>
              <div className="mt-1 text-xs text-gray-500">Country markets in analysis</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Regions
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {kpis.regions}
              </div>
              <div className="mt-1 text-xs text-gray-500">TGE regional groups</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Installed MWe
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {formatNumber(kpis.installed)}
              </div>
              <div className="mt-1 text-xs text-gray-500">Plant installed capacity</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Planned MWe
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {formatNumber(kpis.planned)}
              </div>
              <div className="mt-1 text-xs text-gray-500">Project planned capacity</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Plants
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {kpis.plants}
              </div>
              <div className="mt-1 text-xs text-gray-500">Plants included</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Projects
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {kpis.projects}
              </div>
              <div className="mt-1 text-xs text-gray-500">Projects included</div>
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
            placeholder="Search country, region, MWe, plants, projects, phases..."
            className="w-full border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#8dc63f]"
          />
        </div>
      </section>

      <SectionCard
        title="Country Market Summary"
        description="Installed MWe, planned MWe, plant counts, and project counts by country market."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="border-b border-gray-200 px-4 py-2">
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
                <th className="border-b border-gray-200 px-4 py-2">
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
                <th className="border-b border-gray-200 px-4 py-2">
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
                <th className="border-b border-gray-200 px-4 py-2">
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
                <th className="border-b border-gray-200 px-4 py-2">
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
                <th className="border-b border-gray-200 px-4 py-2">
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
                <tr key={row.country} className="hover:bg-gray-50">
                  <td className="border-b border-gray-100 px-4 py-2.5 font-medium">
                    <Link
                      href={`/markets/countries/${slugify(row.country)}`}
                      className="text-[#1f2937] underline decoration-gray-300 underline-offset-4 hover:text-[#8dc63f]"
                    >
                      {row.country}
                    </Link>
                  </td>
                  <td className="border-b border-gray-100 px-4 py-2.5">
                    <Link
                      href={`/markets/regions/${slugify(row.region)}`}
                      className="text-[#1f2937] underline decoration-gray-300 underline-offset-4 hover:text-[#8dc63f]"
                    >
                      {row.region}
                    </Link>
                  </td>
                  <td className="border-b border-gray-100 px-4 py-2.5">
                    {formatNumber(row.installed_mw)}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-2.5">
                    {formatNumber(row.planned_mw)}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-2.5">
                    {formatNumber(row.plant_count, 0)}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-2.5">
                    {formatNumber(row.project_count, 0)}
                  </td>
                </tr>
              ))}

              {countryRows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-gray-500"
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
            <thead className="bg-gray-100 text-left text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="border-b border-gray-200 px-4 py-2">
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
                <th className="border-b border-gray-200 px-4 py-2">
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
                <th className="border-b border-gray-200 px-4 py-2">
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
                <th className="border-b border-gray-200 px-4 py-2">
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
                <tr key={row.region} className="hover:bg-gray-50">
                  <td className="border-b border-gray-100 px-4 py-2.5 font-medium">
                    <Link
                      href={`/markets/regions/${slugify(row.region)}`}
                      className="text-[#1f2937] underline decoration-gray-300 underline-offset-4 hover:text-[#8dc63f]"
                    >
                      {row.region}
                    </Link>
                  </td>
                  <td className="border-b border-gray-100 px-4 py-2.5">
                    {formatNumber(row.installed_mw)}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-2.5">
                    {formatNumber(row.plant_count, 0)}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-2.5">
                    {formatNumber(row.country_count, 0)}
                  </td>
                </tr>
              ))}

              {regionRows.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-sm text-gray-500"
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
            <thead className="bg-gray-100 text-left text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="border-b border-gray-200 px-4 py-2">
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
                <th className="border-b border-gray-200 px-4 py-2">
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
                <th className="border-b border-gray-200 px-4 py-2">
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
                <th className="border-b border-gray-200 px-4 py-2">
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
                <th className="border-b border-gray-200 px-4 py-2">
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
                <th className="border-b border-gray-200 px-4 py-2">
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
                <th className="border-b border-gray-200 px-4 py-2">
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
                <tr key={row.country} className="hover:bg-gray-50">
                  <td className="border-b border-gray-100 px-4 py-2.5 font-medium">
                    <Link
                      href={`/markets/countries/${slugify(row.country)}`}
                      className="text-[#1f2937] underline decoration-gray-300 underline-offset-4 hover:text-[#8dc63f]"
                    >
                      {row.country}
                    </Link>
                  </td>
                  <td className="border-b border-gray-100 px-4 py-2.5">
                    <Link
                      href={`/markets/regions/${slugify(row.region)}`}
                      className="text-[#1f2937] underline decoration-gray-300 underline-offset-4 hover:text-[#8dc63f]"
                    >
                      {row.region}
                    </Link>
                  </td>
                  <td className="border-b border-gray-100 px-4 py-2.5">
                    {formatNumber(row.exploration_mw)}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-2.5">
                    {formatNumber(row.feasibility_mw)}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-2.5">
                    {formatNumber(row.construction_mw)}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-2.5">
                    {formatNumber(row.other_mw)}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-2.5 font-semibold">
                    {formatNumber(row.total_planned_mw)}
                  </td>
                </tr>
              ))}

              {phaseRows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-gray-500"
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
