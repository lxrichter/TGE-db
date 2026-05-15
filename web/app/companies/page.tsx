"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import ActionButton from "@/components/ui/ActionButton";
import ResearchStatusBadge from "@/components/ui/ResearchStatusBadge";
import { canEdit, type UserRole } from "@/lib/auth/roles";

type CompanyRow = {
  company_id: string;
  company_name: string | null;
  company_type_primary: string | null;
  headquarters_country: string | null;
  related_companies_count: number | null;
  linked_projects_count: number | null;
  linked_plants_count: number | null;
  research_status: string | null;
  review_status: string | null;
};

type SortKey =
  | "company_name"
  | "company_type_primary"
  | "headquarters_country"
  | "related_companies_count"
  | "linked_projects_count"
  | "linked_plants_count"
  | "research_status"
  | "review_status";

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

function formatCount(value: number | null | undefined) {
  return Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
}

function ReviewStatusBadge({ value }: { value: string | null | undefined }) {
  const raw = (value || "").trim();
  const normalized = raw.toLowerCase();

  if (!normalized) {
    return (
      <span className="inline-flex border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
        NA
      </span>
    );
  }

  if (normalized === "approved") {
    return (
      <span className="inline-flex border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
        Approved
      </span>
    );
  }

  if (normalized === "pending_review" || normalized === "pending review") {
    return (
      <span className="inline-flex border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
        Pending Review
      </span>
    );
  }

  return (
    <span className="inline-flex border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
      {raw}
    </span>
  );
}

export default function CompaniesPage() {
  const { data: session } = useSession();
  const currentRole = ((session?.user as { role?: UserRole } | undefined)?.role ??
    null) as UserRole | null;
  const userCanEdit = canEdit(currentRole);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("company_name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [countryFilter, setCountryFilter] = useState("All Countries");
  const [typeFilter, setTypeFilter] = useState("All Primary Types");
  const [researchStatusFilter, setResearchStatusFilter] =
    useState("All Research Status");
  const [reviewStatusFilter, setReviewStatusFilter] =
    useState("All Review Status");

  useEffect(() => {
    fetch("/api/companies")
      .then((res) => res.json())
      .then((data) => setCompanies(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error("Failed to load companies:", error);
        setCompanies([]);
      });
  }, []);

  const countryOptions = useMemo(() => {
    const countries = Array.from(
      new Set(
        companies
          .map((c) => (c.headquarters_country || "").trim())
          .filter((c) => c !== "")
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    return ["All Countries", ...countries];
  }, [companies]);

  const typeOptions = useMemo(() => {
    const types = Array.from(
      new Set(
        companies
          .map((c) => (c.company_type_primary || "").trim())
          .filter((t) => t !== "")
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    return ["All Primary Types", ...types];
  }, [companies]);

  const researchStatusOptions = useMemo(() => {
    const statuses = Array.from(
      new Set(
        companies
          .map((c) => (c.research_status || "").trim())
          .filter((status) => status !== "")
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    return ["All Research Status", ...statuses];
  }, [companies]);

  const reviewStatusOptions = useMemo(() => {
    const statuses = Array.from(
      new Set(
        companies
          .map((c) => (c.review_status || "").trim())
          .filter((status) => status !== "")
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    return ["All Review Status", ...statuses];
  }, [companies]);

  const stats = useMemo(() => {
    const count = companies.length;
    const countries = new Set(
      companies
        .map((c) => c.headquarters_country)
        .filter((v) => v && v.trim() !== "")
    ).size;
    const done = companies.filter((c) =>
      (c.research_status || "").toLowerCase().includes("done")
    ).length;
    const needInfo = companies.filter((c) =>
      (c.research_status || "").toLowerCase().includes("need")
    ).length;

    return { count, countries, done, needInfo };
  }, [companies]);

  const filteredAndSorted = useMemo(() => {
    const query = search.trim().toLowerCase();

    let filtered = companies.filter((row) => {
      const searchableValues = [
        row.company_id,
        row.company_name,
        row.company_type_primary,
        row.headquarters_country,
        row.research_status,
        row.review_status,
      ]
        .map((v) => (v ?? "").toString().toLowerCase())
        .some((v) => v.includes(query));

      return query ? searchableValues : true;
    });

    if (countryFilter !== "All Countries") {
      filtered = filtered.filter(
        (row) => (row.headquarters_country || "").trim() === countryFilter
      );
    }

    if (typeFilter !== "All Primary Types") {
      filtered = filtered.filter(
        (row) => (row.company_type_primary || "").trim() === typeFilter
      );
    }

    if (researchStatusFilter !== "All Research Status") {
      filtered = filtered.filter(
        (row) => (row.research_status || "").trim() === researchStatusFilter
      );
    }

    if (reviewStatusFilter !== "All Review Status") {
      filtered = filtered.filter(
        (row) => (row.review_status || "").trim() === reviewStatusFilter
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (
        sortKey === "related_companies_count" ||
        sortKey === "linked_projects_count" ||
        sortKey === "linked_plants_count"
      ) {
        const aNum = Number(aVal || 0);
        const bNum = Number(bVal || 0);
        return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
      }

      const result = String(aVal ?? "").localeCompare(String(bVal ?? ""), undefined, {
        sensitivity: "base",
        numeric: true,
      });

      return sortDirection === "asc" ? result : -result;
    });

    return sorted;
  }, [
    companies,
    search,
    countryFilter,
    typeFilter,
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

  return (
    <main className="space-y-8">
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-8 py-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
                Companies
              </p>
              <h1 className="mt-3 text-5xl font-bold tracking-tight text-[#1f2937]">
                Geothermal Companies Database
              </h1>
              <p className="mt-4 max-w-4xl text-lg leading-8 text-gray-600">
                Internal overview of geothermal companies with linked detail pages,
                roles, relationships, and plant/project involvement.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 xl:justify-end">
              {userCanEdit && (
                <ActionButton href="/research-ops" variant="secondary">
                  Research Ops
                </ActionButton>
              )}

              {userCanEdit && (
                <ActionButton href="/companies/new" variant="primary">
                  + New Company
                </ActionButton>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-[#f7f7f7] px-8 py-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 xl:grid-cols-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Company Records
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {formatCount(stats.count)}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Current company entries
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
                Distinct headquarters countries
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Done
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {formatCount(stats.done)}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Records marked complete
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
                Records flagged for follow-up
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-[#1f2937]">
            Company Overview Table
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Search records, filter by country, primary type, research status, and review status, and click a column header to sort.
          </p>
        </div>

        <div className="space-y-3 border-b border-gray-200 bg-[#f7f7f7] px-6 py-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                Headquarters Country
              </label>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="w-full rounded-none border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#8dc63f]"
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
                Primary Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-none border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#8dc63f]"
              >
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
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
                className="w-full rounded-none border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#8dc63f]"
              >
                {researchStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                Review Status
              </label>
              <select
                value={reviewStatusFilter}
                onChange={(e) => setReviewStatusFilter(e.target.value)}
                className="w-full rounded-none border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#8dc63f]"
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
            placeholder="Search by ID, company, primary type, country, research status, review status..."
            className="w-full rounded-none border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#8dc63f]"
          />
        </div>

        <div className="px-6 pt-3">
          <p className="text-xs text-gray-500">
            Scroll horizontally to view all columns.
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[1250px]">
            <table className="w-full table-fixed text-left text-sm">
            <thead className="bg-gray-100 text-left text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="border-b border-gray-200 px-4 py-2">Company ID</th>
                <th className="border-b border-gray-200 px-4 py-2">
                  <SortableHeader
                    label="Name"
                    column="company_name"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="border-b border-gray-200 px-4 py-2">
                  <SortableHeader
                    label="Primary Type"
                    column="company_type_primary"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="border-b border-gray-200 px-4 py-2">
                  <SortableHeader
                    label="Country"
                    column="headquarters_country"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="border-b border-gray-200 px-4 py-2 text-center">
                  <SortableHeader
                    label="Related Companies"
                    column="related_companies_count"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="border-b border-gray-200 px-4 py-2 text-center">
                  <SortableHeader
                    label="Linked Projects"
                    column="linked_projects_count"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="border-b border-gray-200 px-4 py-2 text-center">
                  <SortableHeader
                    label="Linked Plants"
                    column="linked_plants_count"
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
              {filteredAndSorted.map((company) => (
                <tr key={company.company_id} className="hover:bg-gray-50">
                  <td className="border-b border-gray-100 px-4 py-2.5 font-mono text-xs text-gray-500">
                    {company.company_id}
                  </td>

                  <td className="border-b border-gray-100 px-4 py-2.5">
                    <Link
                      href={`/companies/${company.company_id}`}
                      className="font-medium text-[#1f2937] underline decoration-gray-300 underline-offset-4 hover:text-[#8dc63f]"
                    >
                      {company.company_name || "NA"}
                    </Link>
                  </td>

                  <td className="border-b border-gray-100 px-4 py-2.5 text-gray-700">
                    {company.company_type_primary || "NA"}
                  </td>

                  <td className="border-b border-gray-100 px-4 py-2.5 text-gray-700">
                    {company.headquarters_country || "NA"}
                  </td>

                  <td className="border-b border-gray-100 px-4 py-2.5 text-center font-medium text-gray-700">
                    {formatCount(company.related_companies_count)}
                  </td>

                  <td className="border-b border-gray-100 px-4 py-2.5 text-center font-medium text-gray-700">
                    {formatCount(company.linked_projects_count)}
                  </td>

                  <td className="border-b border-gray-100 px-4 py-2.5 text-center font-medium text-gray-700">
                    {formatCount(company.linked_plants_count)}
                  </td>

                  <td className="border-b border-gray-100 px-4 py-2.5">
                    <ResearchStatusBadge value={company.research_status} />
                  </td>

                  <td className="border-b border-gray-100 px-4 py-2.5">
                    <ReviewStatusBadge value={company.review_status} />
                  </td>

                  {userCanEdit && (
                    <td className="border-b border-gray-100 px-4 py-2.5">
                      <Link
                        href={`/companies/${company.company_id}/edit`}
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
                    No matching company records found.
                  </td>
                </tr>
              )}
            </tbody>
            </table>
        </div>
      </div>
    </section>
    </main>
  );
}