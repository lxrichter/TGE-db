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

const tableHeadClass =
  "bg-[var(--tge-governance-neutral-bg)] text-left uppercase tracking-wide text-[var(--tge-governance-neutral-text)]";
const tableHeadCellClass =
  "border-b border-[var(--tge-governance-neutral-border)] px-4 py-2 text-[12px] font-semibold";
const tableRowClass = "hover:bg-[var(--tge-surface-subtle)]";
const tableCellClass =
  "border-b border-[var(--tge-governance-muted-border)] px-4 py-2 text-[13px]";
const emptyCellClass =
  "px-4 py-8 text-center text-[13px] text-[var(--tge-governance-muted-text)]";
const linkClass =
  "text-[var(--tge-text-primary)] underline decoration-[var(--tge-governance-muted-border)] underline-offset-4 hover:text-[var(--tge-brand-green-dark)]";

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
      className="inline-flex items-center gap-1 font-semibold text-[var(--tge-governance-neutral-text)] hover:text-[var(--tge-brand-green-dark)]"
    >
      <span>{label}</span>
      <span className="text-[11px] text-[var(--tge-governance-muted-text)]">
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
        <thead className={tableHeadClass}>
          <tr>
            <th className={tableHeadCellClass}>
              <SortableHeader
                label="Market"
                column="country"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </th>
            <th className={tableHeadCellClass}>
              <SortableHeader
                label="Region"
                column="region"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </th>
            <th className={tableHeadCellClass}>
              <SortableHeader
                label="Installed MWe"
                column="installed_mw"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </th>
            <th className={tableHeadCellClass}>
              <SortableHeader
                label="Operating MWe"
                column="operating_mw"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </th>
            <th className={tableHeadCellClass}>
              <SortableHeader
                label="# Plants"
                column="plant_count"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </th>
            <th className={tableHeadCellClass}>
              <SortableHeader
                label="Planned MWe"
                column="planned_mw"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </th>
            <th className={tableHeadCellClass}>
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
            <tr key={row.country} className={tableRowClass}>
              <td className={tableCellClass}>
                <Link
                  href={`/markets/countries/${slugify(row.country)}`}
                  className={`font-medium ${linkClass}`}
                >
                  {row.country}
                </Link>
              </td>

              <td className={tableCellClass}>
                <Link
                  href={`/markets/regions/${slugify(row.region)}`}
                  className={linkClass}
                >
                  {row.region || "NA"}
                </Link>
              </td>

              <td className={tableCellClass}>
                {formatNumber(row.installed_mw)}
              </td>

              <td className={tableCellClass}>
                {formatNumber(row.operating_mw)}
              </td>

              <td className={tableCellClass}>
                {row.plant_count}
              </td>

              <td className={tableCellClass}>
                {formatNumber(row.planned_mw)}
              </td>

              <td className={tableCellClass}>
                {row.project_count}
              </td>
            </tr>
          ))}

          {countries.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className={emptyCellClass}
              >
                No country markets found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
