"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import ActionButton from "@/components/ui/ActionButton";
import BaseResearchStatusBadge from "@/components/ui/ResearchStatusBadge";
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

const companiesClass = {
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

function MissingValue() {
  return (
    <span className="text-sm text-[var(--tge-governance-muted-text)]">-</span>
  );
}

function categoryLabel(value: string | null | undefined) {
  const raw = (value || "").trim();
  return raw || "Unclassified";
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
      <span className="text-[10px] text-[var(--tge-governance-muted-text)]">
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
    return <MissingValue />;
  }

  if (normalized === "approved") {
    return (
      <span className="inline-flex border border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--tge-governance-success-text)]">
        Approved
      </span>
    );
  }

  if (normalized === "pending_review" || normalized === "pending review") {
    return (
      <span className="inline-flex border border-[var(--tge-governance-danger-border)] bg-[var(--tge-governance-danger-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--tge-governance-danger-text)]">
        Pending Review
      </span>
    );
  }

  return (
    <span className="inline-flex border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-2 py-0.5 text-[11px] font-semibold text-[var(--tge-governance-neutral-text)]">
      {raw}
    </span>
  );
}

function ResearchStatusBadge({ value }: { value: string | null }) {
  const normalized = (value || "").trim().toLowerCase();

  if (!normalized || normalized === "na" || normalized === "n/a") {
    return <MissingValue />;
  }

  return <BaseResearchStatusBadge value={value} />;
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
    const needInfo = companies.filter((c) =>
      (c.research_status || "").toLowerCase().includes("need")
    ).length;
    const linkedProjects = companies.reduce(
      (sum, company) => sum + Number(company.linked_projects_count || 0),
      0
    );
    const linkedPlants = companies.reduce(
      (sum, company) => sum + Number(company.linked_plants_count || 0),
      0
    );

    const categoryMap = companies.reduce<
      Record<string, { count: number; projects: number; plants: number }>
    >((acc, company) => {
      const label = categoryLabel(company.company_type_primary);

      if (!acc[label]) {
        acc[label] = { count: 0, projects: 0, plants: 0 };
      }

      acc[label].count += 1;
      acc[label].projects += Number(company.linked_projects_count || 0);
      acc[label].plants += Number(company.linked_plants_count || 0);

      return acc;
    }, {});

    const categoryOverview = Object.entries(categoryMap)
      .map(([label, values]) => ({
        label,
        ...values,
        signal: values.projects + values.plants,
      }))
      .sort((a, b) => b.count - a.count || b.signal - a.signal)
      .slice(0, 6);

    return {
      count,
      needInfo,
      linkedProjects,
      linkedPlants,
      categoryOverview,
    };
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
    <main className="space-y-7">
      <section className={companiesClass.panel}>
        <div className="px-6 py-4 xl:px-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]">
                Companies
              </p>
              <h1 className={`mt-2 text-2xl font-bold tracking-tight ${companiesClass.title} xl:text-[2.2rem]`}>
                Geothermal Companies
              </h1>
              <p className={`mt-2 max-w-4xl text-base leading-7 ${companiesClass.body}`}>
                Ecosystem intelligence for geothermal developers, operators,
                suppliers, investors, utilities, and relationship-linked market
                participants.
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

        <div className="border-t border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-6 py-3.5 xl:px-8">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 xl:grid-cols-4">
            <div>
              <div className={companiesClass.metricLabel}>
                Companies
              </div>
              <div className={`mt-0.5 text-xl font-bold ${companiesClass.title}`}>
                {formatCount(stats.count)}
              </div>
              <div className={`mt-1 text-xs ${companiesClass.muted}`}>
                Current company entries
              </div>
            </div>

            <div>
              <div className={companiesClass.metricLabel}>
                Linked Projects
              </div>
              <div className={`mt-0.5 text-xl font-bold ${companiesClass.title}`}>
                {formatCount(stats.linkedProjects)}
              </div>
              <div className={`mt-1 text-xs ${companiesClass.muted}`}>
                Structured project relationships
              </div>
            </div>

            <div>
              <div className={companiesClass.metricLabel}>
                Linked Plants
              </div>
              <div className={`mt-0.5 text-xl font-bold ${companiesClass.title}`}>
                {formatCount(stats.linkedPlants)}
              </div>
              <div className={`mt-1 text-xs ${companiesClass.muted}`}>
                Structured plant relationships
              </div>
            </div>

            <div>
              <div className={companiesClass.metricLabel}>
                Need Info
              </div>
              <div className={`mt-0.5 text-xl font-bold ${companiesClass.title}`}>
                {formatCount(stats.needInfo)}
              </div>
              <div className={`mt-1 text-xs ${companiesClass.muted}`}>
                Companies flagged for follow-up
              </div>
            </div>
          </div>
        </div>

        {stats.categoryOverview.length > 0 && (
          <div className="border-t border-[var(--tge-governance-neutral-border)] px-5 py-3">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <h2 className={`text-lg font-bold ${companiesClass.title}`}>
                Ecosystem Category Overview
              </h2>
              <p className={`text-sm ${companiesClass.muted}`}>
                Company identity and relationship signal
              </p>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {stats.categoryOverview.map((item) => (
                <div
                  key={item.label}
                  className="min-w-[176px] flex-1 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-3.5 py-2.5"
                >
                  <div className={`line-clamp-1 text-xs font-semibold uppercase tracking-wide ${companiesClass.muted}`}>
                    {item.label}
                  </div>
                  <div className={`mt-1 text-xl font-bold leading-none ${companiesClass.title}`}>
                    {formatCount(item.count)}
                  </div>
                  <div className={`mt-1.5 text-sm leading-5 ${companiesClass.body}`}>
                    {formatCount(item.projects)} project links ·{" "}
                    {formatCount(item.plants)} plant links
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className={companiesClass.panel}>
        <div className={`${companiesClass.sectionHeader} px-5 py-3`}>
          <h2 className={`text-lg font-bold ${companiesClass.title}`}>
            Company Overview Table
          </h2>
          <p className={`mt-1 text-sm ${companiesClass.muted}`}>
            Search companies, filter by country, primary type, research status, and review status, and click a column header to sort.
          </p>
        </div>

        <div className="space-y-3 border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-5 py-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
                Headquarters Country
              </label>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className={`w-full px-3 py-2 text-sm ${companiesClass.input}`}
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
                Primary Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className={`w-full px-3 py-2 text-sm ${companiesClass.input}`}
              >
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
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
                className={`w-full px-3 py-2 text-sm ${companiesClass.input}`}
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
                className={`w-full px-3 py-2 text-sm ${companiesClass.input}`}
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
            placeholder="Search companies by name, type, country, or review state..."
            className={`w-full px-3 py-2 text-sm ${companiesClass.input}`}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-3">
          <p className={`text-sm ${companiesClass.muted}`}>
            Showing {formatCount(filteredAndSorted.length)} of{" "}
            {formatCount(companies.length)} companies. Scroll horizontally for
            relationship fields.
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-max">
            <table className="min-w-[1450px] table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[110px]" />
                <col className="w-[320px]" />
                <col className="w-[190px]" />
                <col className="w-[160px]" />
                <col className="w-[150px]" />
                <col className="w-[140px]" />
                <col className="w-[130px]" />
                <col className="w-[140px]" />
                <col className="w-[140px]" />
                {userCanEdit && <col className="w-[90px]" />}
              </colgroup>
              <thead className="bg-[var(--tge-governance-neutral-bg)] text-left text-[11px] uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
                <tr>
                  <th className={companiesClass.tableHead}>Company ID</th>
                  <th className={companiesClass.tableHead}>
                    <SortableHeader
                      label="Name"
                      column="company_name"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className={companiesClass.tableHead}>
                    <SortableHeader
                      label="Primary Type"
                      column="company_type_primary"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className={companiesClass.tableHead}>
                    <SortableHeader
                      label="Country"
                      column="headquarters_country"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className={companiesClass.tableHead}>
                    <SortableHeader
                      label="Related Companies"
                      column="related_companies_count"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className={companiesClass.tableHead}>
                    <SortableHeader
                      label="Linked Projects"
                      column="linked_projects_count"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className={companiesClass.tableHead}>
                    <SortableHeader
                      label="Linked Plants"
                      column="linked_plants_count"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className={companiesClass.tableHead}>
                    <SortableHeader
                      label="Research Status"
                      column="research_status"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className={companiesClass.tableHead}>
                    <SortableHeader
                      label="Review Status"
                      column="review_status"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  {userCanEdit && (
                    <th className={companiesClass.tableHead}>Action</th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--tge-governance-muted-border)]">
                {filteredAndSorted.map((company) => (
                  <tr
                    key={company.company_id}
                    className="transition hover:bg-[var(--tge-surface-subtle)]"
                  >
                    <td
                      className={`${companiesClass.tableCell} font-mono text-xs ${companiesClass.muted}`}
                    >
                      {company.company_id}
                    </td>

                    <td className={companiesClass.tableCell}>
                      <Link
                        href={`/companies/${company.company_id}`}
                        className={`${companiesClass.link} line-clamp-2 text-[15px] font-semibold leading-5`}
                      >
                        {company.company_name || <MissingValue />}
                      </Link>
                    </td>

                    <td
                      className={`${companiesClass.tableCell} ${companiesClass.body}`}
                    >
                      <span className="line-clamp-2">
                        {company.company_type_primary || <MissingValue />}
                      </span>
                    </td>

                    <td
                      className={`${companiesClass.tableCell} ${companiesClass.body}`}
                    >
                      {company.headquarters_country || <MissingValue />}
                    </td>

                    <td
                      className={`${companiesClass.tableCell} font-semibold ${companiesClass.title}`}
                    >
                      {formatCount(company.related_companies_count)}
                    </td>

                    <td
                      className={`${companiesClass.tableCell} font-semibold ${companiesClass.title}`}
                    >
                      {formatCount(company.linked_projects_count)}
                    </td>

                    <td
                      className={`${companiesClass.tableCell} font-semibold ${companiesClass.title}`}
                    >
                      {formatCount(company.linked_plants_count)}
                    </td>

                    <td className={companiesClass.tableCell}>
                      <ResearchStatusBadge value={company.research_status} />
                    </td>

                    <td className={companiesClass.tableCell}>
                      <ReviewStatusBadge value={company.review_status} />
                    </td>

                    {userCanEdit && (
                      <td className={companiesClass.tableCell}>
                        <Link
                          href={`/companies/${company.company_id}/edit`}
                          className={companiesClass.primaryPill}
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
                      className={`px-4 py-8 text-center text-sm ${companiesClass.muted}`}
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
