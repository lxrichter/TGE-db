"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { slugify } from "@/lib/slug";
import type { CountryRow } from "@/app/markets/countries/page";

type SortKey =
  | "country"
  | "region"
  | "installed_mw"
  | "operating_mw"
  | "plant_count"
  | "planned_mw"
  | "project_count";

type SortDirection = "asc" | "desc";

function formatNumber(value: number, digits = 1) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
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
  sortDirection: SortDirection;
  onSort: (column: SortKey) => void;
}) {
  const isActive = sortKey === column;

  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className="inline-flex items-center gap-1 font-semibold text-gray-700 hover:text-[#8dc63f]"
    >
      <span>{label}</span>
      <span className="text-[11px] text-gray-400">
        {isActive ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </button>
  );
}

export default function CountriesTable({
  countries,
}: {
  countries: CountryRow[];
}) {
  const [sortKey, setSortKey] = useState<SortKey>("country");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  function handleSort(column: SortKey) {
    if (sortKey === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(column);
    setSortDirection("asc");
  }

  const sortedCountries = useMemo(() => {
    const rows = [...countries];

    rows.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aText = String(aVal || "");
      const bText = String(bVal || "");

      return sortDirection === "asc"
        ? aText.localeCompare(bText)
        : bText.localeCompare(aText);
    });

    return rows;
  }, [countries, sortKey, sortDirection]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gray-100 text-left uppercase tracking-wide text-gray-600">
          <tr>
            <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">
              <SortableHeader
                label="Market"
                column="country"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </th>
            <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">
              <SortableHeader
                label="Region"
                column="region"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </th>
            <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">
              <SortableHeader
                label="Installed MW"
                column="installed_mw"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </th>
            <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">
              <SortableHeader
                label="Operating MW"
                column="operating_mw"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </th>
            <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">
              <SortableHeader
                label="# Plants"
                column="plant_count"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </th>
            <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">
              <SortableHeader
                label="Planned MW"
                column="planned_mw"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </th>
            <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">
              <SortableHeader
                label="# Projects"
                column="project_count"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </th>
          </tr>
        </thead>

        <tbody>
          {sortedCountries.map((row) => (
            <tr key={row.country} className="hover:bg-gray-50">
              <td className="border-b border-gray-100 px-4 py-2 text-[13px]">
                <Link
                  href={`/markets/countries/${slugify(row.country)}`}
                  className="font-medium text-[#1f2937] underline decoration-gray-300 underline-offset-4 hover:text-[#8dc63f]"
                >
                  {row.country}
                </Link>
              </td>

              <td className="border-b border-gray-100 px-4 py-2 text-[13px]">
                <Link
                  href={`/markets/regions/${slugify(row.region)}`}
                  className="text-[#1f2937] underline decoration-gray-300 underline-offset-4 hover:text-[#8dc63f]"
                >
                  {row.region || "NA"}
                </Link>
              </td>

              <td className="border-b border-gray-100 px-4 py-2 text-[13px]">
                {formatNumber(row.installed_mw)}
              </td>

              <td className="border-b border-gray-100 px-4 py-2 text-[13px]">
                {formatNumber(row.operating_mw)}
              </td>

              <td className="border-b border-gray-100 px-4 py-2 text-[13px]">
                {row.plant_count}
              </td>

              <td className="border-b border-gray-100 px-4 py-2 text-[13px]">
                {formatNumber(row.planned_mw)}
              </td>

              <td className="border-b border-gray-100 px-4 py-2 text-[13px]">
                {row.project_count}
              </td>
            </tr>
          ))}

          {countries.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-8 text-center text-[13px] text-gray-500"
              >
                No country market records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
