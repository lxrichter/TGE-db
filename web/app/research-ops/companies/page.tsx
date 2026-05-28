"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import ActionButton from "@/components/ui/ActionButton";
import ResearchStatusBadge from "@/components/ui/ResearchStatusBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import { canEdit, type UserRole } from "@/lib/auth/roles";

type CompanyRow = {
  company_id: string;
  company_name: string | null;
  company_type_primary: string | null;
  secondary_types?: string | null;
  headquarters_country: string | null;
  company_group_name?: string | null;
  consolidation_method?: string | null;
  group_reporting_weight?: number | null;
  research_status: string | null;
  review_status: string | null;
  website_url?: string | null;
  linkedin_url?: string | null;
  parent_company_id?: string | null;
  ultimate_parent_company_id?: string | null;
  created_by_user_id?: string | null;
  last_updated_by_user_id?: string | null;
  approved_by_user_id?: string | null;
  created_by_name?: string | null;
  last_updated_by_name?: string | null;
  approved_by_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  related_companies_count: number | null;
  linked_projects_count: number | null;
  linked_plants_count: number | null;
};

type OpsPreset =
  | "all"
  | "pending_review"
  | "need_info"
  | "missing_primary_type"
  | "missing_country"
  | "missing_source"
  | "missing_links"
  | "missing_relationships"
  | "my_records";

function ReviewStatusBadge({ value }: { value: string | null | undefined }) {
  const raw = (value || "").trim();
  const normalized = raw.toLowerCase();

  if (!normalized) {
    return (
      <StatusBadge tone="neutralSoft">NA</StatusBadge>
    );
  }

  if (normalized === "approved") {
    return <StatusBadge tone="successSoft">Approved</StatusBadge>;
  }

  if (normalized === "pending_review" || normalized === "pending review") {
    return <StatusBadge tone="warningSoft">Pending Review</StatusBadge>;
  }

  return <StatusBadge tone="neutralSoft">{raw}</StatusBadge>;
}

function formatCount(value: number | null | undefined) {
  return Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
}

function isNeedInfo(row: CompanyRow) {
  return (row.research_status || "").toLowerCase().includes("need");
}

function isPendingReview(row: CompanyRow) {
  return (row.review_status || "").trim().toLowerCase() === "pending_review";
}

function isMissingPrimaryType(row: CompanyRow) {
  return !(row.company_type_primary || "").trim();
}

function isMissingCountry(row: CompanyRow) {
  return !(row.headquarters_country || "").trim();
}

function isMissingSource(row: CompanyRow) {
  return !(row.website_url || "").trim();
}

function isMissingLinks(row: CompanyRow) {
  return Number(row.linked_projects_count || 0) === 0 && Number(row.linked_plants_count || 0) === 0;
}

function isMissingRelationships(row: CompanyRow) {
  return Number(row.related_companies_count || 0) === 0;
}

function buildFlags(row: CompanyRow) {
  const flags: string[] = [];

  if (isMissingPrimaryType(row)) flags.push("Missing Primary Type");
  if (isMissingCountry(row)) flags.push("Missing Country");
  if (isMissingSource(row)) flags.push("Missing Source");
  if (isMissingLinks(row)) flags.push("No Project / Plant Links");
  if (isMissingRelationships(row)) flags.push("No Relationships");
  if (isNeedInfo(row)) flags.push("Need Info");
  if (isPendingReview(row)) flags.push("Pending Review");

  return flags;
}

const researchOpsCompanyClass = {
  panel:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]",
  hero:
    "border-l-4 border-l-[var(--tge-brand-green)] px-8 py-8",
  dangerHero:
    "border-l-4 border-l-[var(--tge-governance-danger-text)] px-8 py-8",
  strip:
    "border-t border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-8 py-5",
  title: "text-[var(--tge-text-primary)]",
  body: "text-[var(--tge-text-secondary)]",
  muted: "text-[var(--tge-governance-muted-text)]",
  kicker:
    "text-sm font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]",
  dangerKicker:
    "text-sm font-semibold uppercase tracking-[0.08em] text-[var(--tge-governance-danger-text)]",
  sectionHeader:
    "border-b border-[var(--tge-governance-neutral-border)] px-6 py-4",
  filterShell:
    "space-y-3 border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-6 py-3",
  label:
    "mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-neutral-text)]",
  input:
    "w-full border border-[var(--tge-border-strong)] bg-[var(--tge-surface-card)] px-4 py-2 text-sm text-[var(--tge-text-primary)] outline-none focus:border-[var(--tge-brand-green)]",
  tableHead:
    "bg-[var(--tge-governance-neutral-bg)] text-left text-xs uppercase tracking-wide text-[var(--tge-governance-neutral-text)]",
  tableHeaderCell:
    "border-b border-[var(--tge-governance-neutral-border)] px-4 py-2",
  tableRow:
    "hover:bg-[var(--tge-surface-subtle)]",
  tableCell:
    "border-b border-[var(--tge-governance-muted-border)] px-4 py-2.5 text-[var(--tge-governance-neutral-text)]",
  tableMutedCell:
    "border-b border-[var(--tge-governance-muted-border)] px-4 py-2.5 font-mono text-xs text-[var(--tge-governance-muted-text)]",
  link:
    "font-medium text-[var(--tge-text-primary)] underline decoration-[var(--tge-governance-muted-border)] underline-offset-4 hover:text-[var(--tge-brand-green-dark)]",
  editLink:
    "inline-flex min-h-[28px] items-center justify-center whitespace-nowrap border border-[var(--tge-brand-green)] bg-[var(--tge-brand-green)] px-3 py-1 text-[11px] font-semibold leading-none text-[var(--tge-surface-card)] hover:border-[var(--tge-brand-green-dark)] hover:bg-[var(--tge-brand-green-dark)]",
  activeCard:
    "border-[var(--tge-brand-green)] bg-[var(--tge-governance-success-bg)]",
  inactiveCard:
    "border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] hover:bg-[var(--tge-surface-subtle)]",
  activityButton:
    "inline-flex min-w-[32px] items-center justify-center border border-[var(--tge-border-strong)] bg-[var(--tge-surface-card)] px-2 py-1 text-xs font-semibold text-[var(--tge-text-primary)] hover:border-[var(--tge-brand-green)] hover:bg-[var(--tge-governance-success-bg)] hover:text-[var(--tge-brand-green-dark)]",
  flag:
    "inline-flex border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-2 py-0.5 text-[11px] font-semibold text-[var(--tge-governance-neutral-text)]",
};

function OpsStatCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer border p-3 text-left transition ${
        active ? researchOpsCompanyClass.activeCard : researchOpsCompanyClass.inactiveCard
      }`}
    >
      <div className={`text-[11px] font-semibold uppercase tracking-wide ${researchOpsCompanyClass.muted}`}>
        {label}
      </div>
      <div className={`mt-1 text-3xl font-bold ${researchOpsCompanyClass.title}`}>
        {formatCount(value)}
      </div>
    </button>
  );
}

type EditorActivityRow = {
  userKey: string;
  displayName: string;
  created: number;
  updated: number;
  approved: number;
  pendingReview: number;
  needInfo: number;
};

function buildEditorActivity(rows: Array<{
  created_by_user_id?: string | null;
  last_updated_by_user_id?: string | null;
  approved_by_user_id?: string | null;
  created_by_name?: string | null;
  last_updated_by_name?: string | null;
  approved_by_name?: string | null;
  review_status?: string | null;
  research_status?: string | null;
}>): EditorActivityRow[] {
  const map = new Map<string, EditorActivityRow>();

  function normalizeKey(value: string | null | undefined) {
    const trimmed = (value || "").trim();
    return trimmed || "__na__";
  }

  function normalizeDisplayName(
    userKey: string,
    value: string | null | undefined
  ) {
    const trimmed = (value || "").trim();

    if (trimmed) return trimmed;
    if (userKey === "__na__") return "NA";

    // fallback so real user activity never collapses into NA
    return userKey;
  }

  function ensure(userKey: string, displayName: string): EditorActivityRow {
    const existing = map.get(userKey);

    if (existing) {
      // if we previously had only a fallback value and now got a proper name, upgrade it
      if (
        existing.displayName === "NA" ||
        existing.displayName === userKey
      ) {
        if (displayName && displayName !== "NA") {
          existing.displayName = displayName;
        }
      }
      return existing;
    }

    const row: EditorActivityRow = {
      userKey,
      displayName,
      created: 0,
      updated: 0,
      approved: 0,
      pendingReview: 0,
      needInfo: 0,
    };

    map.set(userKey, row);
    return row;
  }

  for (const row of rows) {
    const createdKey = normalizeKey(row.created_by_user_id);
    const updatedKey = normalizeKey(row.last_updated_by_user_id);
    const approvedKey = normalizeKey(row.approved_by_user_id);

    const createdName = normalizeDisplayName(createdKey, row.created_by_name);
    const updatedName = normalizeDisplayName(updatedKey, row.last_updated_by_name);
    const approvedName = normalizeDisplayName(approvedKey, row.approved_by_name);

    const rowIsPendingReview =
      (row.review_status || "").trim().toLowerCase() === "pending_review";

    const rowIsNeedInfo =
      (row.research_status || "").toLowerCase().includes("need");

    ensure(createdKey, createdName).created += 1;
    ensure(updatedKey, updatedName).updated += 1;
    ensure(approvedKey, approvedName).approved += 1;

    if (rowIsPendingReview) ensure(createdKey, createdName).pendingReview += 1;
    if (rowIsNeedInfo) ensure(createdKey, createdName).needInfo += 1;
  }

  return Array.from(map.values()).sort((a, b) => {
    const scoreA = a.created + a.updated + a.approved;
    const scoreB = b.created + b.updated + b.approved;
    return scoreB - scoreA;
  });
}

export default function ResearchOpsCompaniesPage() {
  const { data: session } = useSession();
  const currentRole = ((session?.user as { role?: UserRole } | undefined)?.role ??
    null) as UserRole | null;

  const userCanAccessResearchOps = canEdit(currentRole);

  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("All Countries");
  const [typeFilter, setTypeFilter] = useState("All Primary Types");
  const [researchStatusFilter, setResearchStatusFilter] =
    useState("All Research Status");
  const [reviewStatusFilter, setReviewStatusFilter] =
    useState("All Review Status");
  const [opsPreset, setOpsPreset] = useState<OpsPreset>("all");
  const [editorFilter, setEditorFilter] = useState<{
    user: string;
    mode: "created" | "updated" | "approved" | "pending" | "need_info";
  } | null>(null);

  useEffect(() => {
    fetch("/api/companies")
      .then((res) => res.json())
      .then((data) => setCompanies(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error("Failed to load research ops companies:", error);
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

  const researchStatusOptions = [
    "All Research Status",
    "Done",
    "In Progress",
    "Need Info",
    "NA",
  ];

  const reviewStatusOptions = useMemo(() => {
    function normalizeReviewStatus(value: string | null | undefined) {
      const normalized = (value || "").trim().toLowerCase();

      if (!normalized) return "";
      if (normalized === "approved") return "Approved";
      if (normalized === "pending_review" || normalized === "pending review") {
        return "Pending Review";
      }

      return (value || "").trim();
    }

    const statuses = Array.from(
      new Set(
        companies
          .map((c) => normalizeReviewStatus(c.review_status))
          .filter((status) => status !== "")
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    return ["All Review Status", ...statuses];
  }, [companies]);

  const stats = useMemo(() => {
    return {
      total: companies.length,
      pendingReview: companies.filter(isPendingReview).length,
      needInfo: companies.filter(isNeedInfo).length,
      missingPrimaryType: companies.filter(isMissingPrimaryType).length,
      missingCountry: companies.filter(isMissingCountry).length,
      missingSource: companies.filter(isMissingSource).length,
      missingLinks: companies.filter(isMissingLinks).length,
      missingRelationships: companies.filter(isMissingRelationships).length,
    };
  }, [companies]);

  const editorActivity = useMemo(() => {
    if (!companies.length) return [];

    const activity = buildEditorActivity(companies);

    if (activity.length > 0) return activity;

    return [
      {
        userKey: "__na__",
        displayName: "NA",
        created: companies.length,
        updated: 0,
        approved: 0,
        pendingReview: companies.filter(
          (row) => (row.review_status || "").trim().toLowerCase() === "pending_review"
        ).length,
        needInfo: companies.filter((row) =>
          (row.research_status || "").toLowerCase().includes("need")
        ).length,
      },
    ];
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    const query = search.trim().toLowerCase();

    let filtered = companies.filter((row) => {
      if (!query) return true;

      return [
        row.company_id,
        row.company_name,
        row.company_type_primary,
        row.headquarters_country,
        row.company_group_name,
        row.research_status,
        row.review_status,
        row.website_url,
      ]
        .map((v) => (v ?? "").toString().toLowerCase())
        .some((v) => v.includes(query));
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
      filtered = filtered.filter((row) => {
        const normalized = (row.review_status || "").trim().toLowerCase();

        if (reviewStatusFilter === "Approved") {
          return normalized === "approved";
        }

        if (reviewStatusFilter === "Pending Review") {
          return normalized === "pending_review" || normalized === "pending review";
        }

        return (row.review_status || "").trim() === reviewStatusFilter;
      });
    }

    if (opsPreset === "pending_review") {
      filtered = filtered.filter(isPendingReview);
    } else if (opsPreset === "need_info") {
      filtered = filtered.filter(isNeedInfo);
    } else if (opsPreset === "missing_primary_type") {
      filtered = filtered.filter(isMissingPrimaryType);
    } else if (opsPreset === "missing_country") {
      filtered = filtered.filter(isMissingCountry);
    } else if (opsPreset === "missing_source") {
      filtered = filtered.filter(isMissingSource);
    } else if (opsPreset === "missing_links") {
      filtered = filtered.filter(isMissingLinks);
    } else if (opsPreset === "missing_relationships") {
      filtered = filtered.filter(isMissingRelationships);
    } else if (opsPreset === "my_records") {
      const myUserId = String((session?.user as { id?: string } | undefined)?.id || "").trim();
      filtered = filtered.filter(
        (row) => String(row.created_by_user_id || "").trim() === myUserId
      );
    }

    if (editorFilter) {
      filtered = filtered.filter((row) => {
        const createdKey = (row.created_by_user_id || "").trim();
        const updatedKey = (row.last_updated_by_user_id || "").trim();
        const approvedKey = (row.approved_by_user_id || "").trim();

        if (editorFilter.mode === "created") {
          return createdKey === editorFilter.user;
        }

        if (editorFilter.mode === "updated") {
          return updatedKey === editorFilter.user;
        }

        if (editorFilter.mode === "approved") {
          return approvedKey === editorFilter.user;
        }

        if (editorFilter.mode === "pending") {
          return (
            createdKey === editorFilter.user &&
            (row.review_status || "").trim().toLowerCase() === "pending_review"
          );
        }

        if (editorFilter.mode === "need_info") {
          return (
            createdKey === editorFilter.user &&
            (row.research_status || "").toLowerCase().includes("need")
          );
        }

        return true;
      });
    }

    return filtered.sort((a, b) =>
      String(a.company_name || "").localeCompare(String(b.company_name || ""), undefined, {
        sensitivity: "base",
        numeric: true,
      })
    );
  }, [
    companies,
    search,
    countryFilter,
    typeFilter,
    researchStatusFilter,
    reviewStatusFilter,
    opsPreset,
    editorFilter,
    session,
  ]);

  if (!userCanAccessResearchOps) {
    return (
      <main className="space-y-8">
        <section className={researchOpsCompanyClass.panel}>
          <div className={researchOpsCompanyClass.dangerHero}>
            <p className={researchOpsCompanyClass.dangerKicker}>
              Research Ops / Companies
            </p>
            <h1 className={`mt-3 text-5xl font-bold tracking-tight ${researchOpsCompanyClass.title}`}>
              Access Restricted
            </h1>
            <p className={`mt-4 max-w-3xl text-lg leading-8 ${researchOpsCompanyClass.body}`}>
              Companies Ops is available only to editors and administrators.
            </p>
            <div className="mt-6">
              <ActionButton href="/research-ops" variant="secondary">
                Back to Research Ops
              </ActionButton>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-8">
      <div className="px-2">
        <Link
          href="/research-ops"
          className="inline-flex items-center text-sm font-medium text-[var(--tge-brand-green-dark)] hover:underline"
        >
          ← Back to Research Ops Dashboard
        </Link>
      </div>

      <section className={researchOpsCompanyClass.panel}>
        <div className={researchOpsCompanyClass.hero}>
          <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl">
              <p className={researchOpsCompanyClass.kicker}>
                Research Ops / Companies
              </p>
              <h1 className={`mt-3 text-5xl font-bold tracking-tight ${researchOpsCompanyClass.title}`}>
                Company Research Operations
              </h1>
              <p className={`mt-4 max-w-4xl text-lg leading-8 ${researchOpsCompanyClass.body}`}>
                Operational queue for company data gaps, research follow-up,
                review workflow, and relationship/link completeness.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 xl:justify-end">
              <ActionButton href="/research-ops/projects" variant="secondary">
                Projects Ops
              </ActionButton>
              <ActionButton href="/research-ops/plants" variant="secondary">
                Plants Ops
              </ActionButton>
              <ActionButton href="/research-ops/companies" variant="primary">
                Companies Ops
              </ActionButton>
            </div>
          </div>
        </div>

        <div className={researchOpsCompanyClass.strip}>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <OpsStatCard label="Total Companies" value={stats.total} active={opsPreset === "all"} onClick={() => setOpsPreset("all")} />
            <OpsStatCard label="Pending Review" value={stats.pendingReview} active={opsPreset === "pending_review"} onClick={() => setOpsPreset("pending_review")} />
            <OpsStatCard label="Need Info" value={stats.needInfo} active={opsPreset === "need_info"} onClick={() => setOpsPreset("need_info")} />
            <OpsStatCard label="Missing Primary Type" value={stats.missingPrimaryType} active={opsPreset === "missing_primary_type"} onClick={() => setOpsPreset("missing_primary_type")} />
            <OpsStatCard label="Missing Country" value={stats.missingCountry} active={opsPreset === "missing_country"} onClick={() => setOpsPreset("missing_country")} />
            <OpsStatCard label="Missing Source" value={stats.missingSource} active={opsPreset === "missing_source"} onClick={() => setOpsPreset("missing_source")} />
            <OpsStatCard label="No Project / Plant Links" value={stats.missingLinks} active={opsPreset === "missing_links"} onClick={() => setOpsPreset("missing_links")} />
            <OpsStatCard label="No Relationships" value={stats.missingRelationships} active={opsPreset === "missing_relationships"} onClick={() => setOpsPreset("missing_relationships")} />
          </div>
        </div>
      </section>

      <section className={researchOpsCompanyClass.panel}>
        <div className={researchOpsCompanyClass.sectionHeader}>
          <h2 className={`text-xl font-bold ${researchOpsCompanyClass.title}`}>
            Editor Activity
          </h2>
          <p className={`mt-1 text-sm ${researchOpsCompanyClass.muted}`}>
            Overview of record creation, updates, approvals, and workflow concentration by user. Click a number to filter the table below.
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <table className="w-full text-left text-sm">
              <thead className={researchOpsCompanyClass.tableHead}>
                <tr>
                  <th className={researchOpsCompanyClass.tableHeaderCell}>User</th>
                  <th className={`${researchOpsCompanyClass.tableHeaderCell} text-center`}>Created</th>
                  <th className={`${researchOpsCompanyClass.tableHeaderCell} text-center`}>Updated</th>
                  <th className={`${researchOpsCompanyClass.tableHeaderCell} text-center`}>Approved</th>
                  <th className={`${researchOpsCompanyClass.tableHeaderCell} text-center`}>Pending</th>
                  <th className={`${researchOpsCompanyClass.tableHeaderCell} text-center`}>Need Info</th>
                </tr>
              </thead>

              <tbody>
                {editorActivity.map((row) => (
                  <tr key={row.userKey} className={researchOpsCompanyClass.tableRow}>
                    <td className={`${researchOpsCompanyClass.tableCell} text-sm`}>
                      {row.userKey === String((session?.user as { id?: string } | undefined)?.id || "").trim()
                        ? String((session?.user as { name?: string } | undefined)?.name || row.displayName || row.userKey || "NA")
                        : row.displayName || row.userKey || "NA"}
                    </td>

                    <td className={`${researchOpsCompanyClass.tableCell} text-center`}>
                      <button
                        type="button"
                        onClick={() => setEditorFilter({ user: row.userKey, mode: "created" })}
                        className={researchOpsCompanyClass.activityButton}
                      >
                        {row.created}
                      </button>
                    </td>

                    <td className={`${researchOpsCompanyClass.tableCell} text-center`}>
                      <button
                        type="button"
                        onClick={() => setEditorFilter({ user: row.userKey, mode: "updated" })}
                        className={researchOpsCompanyClass.activityButton}
                      >
                        {row.updated}
                      </button>
                    </td>

                    <td className={`${researchOpsCompanyClass.tableCell} text-center`}>
                      <button
                        type="button"
                        onClick={() => setEditorFilter({ user: row.userKey, mode: "approved" })}
                        className={researchOpsCompanyClass.activityButton}
                      >
                        {row.approved}
                      </button>
                    </td>

                    <td className={`${researchOpsCompanyClass.tableCell} text-center`}>
                      <button
                        type="button"
                        onClick={() => setEditorFilter({ user: row.userKey, mode: "pending" })}
                        className={researchOpsCompanyClass.activityButton}
                      >
                        {row.pendingReview}
                      </button>
                    </td>

                    <td className={`${researchOpsCompanyClass.tableCell} text-center`}>
                      <button
                        type="button"
                        onClick={() => setEditorFilter({ user: row.userKey, mode: "need_info" })}
                        className={researchOpsCompanyClass.activityButton}
                      >
                        {row.needInfo}
                      </button>
                    </td>
                  </tr>
                ))}

                {editorActivity.length === 0 && (
                  <tr>
                    <td colSpan={6} className={`px-4 py-8 text-center text-sm ${researchOpsCompanyClass.muted}`}>
                      No editor activity available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {editorFilter && (
        <div className="flex items-center justify-between border border-[var(--tge-brand-green)] bg-[var(--tge-governance-success-bg)] px-4 py-3 text-sm">
          <div className={researchOpsCompanyClass.title}>
            Editor filter active:
            <span className="ml-2 font-semibold">
              {editorFilter.user === String((session?.user as { id?: string } | undefined)?.id || "").trim()
                ? String((session?.user as { name?: string } | undefined)?.name || editorFilter.user || "NA")
                : editorActivity.find((x) => x.userKey === editorFilter.user)?.displayName || editorFilter.user || "NA"} / {editorFilter.mode}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setEditorFilter(null)}
            className="font-medium text-[var(--tge-text-primary)] underline"
          >
            Clear
          </button>
        </div>
      )}

      <section className={researchOpsCompanyClass.panel}>
        <div className={researchOpsCompanyClass.sectionHeader}>
          <h2 className={`text-xl font-bold ${researchOpsCompanyClass.title}`}>
            Company Ops Queue
          </h2>
          <p className={`mt-1 text-sm ${researchOpsCompanyClass.muted}`}>
            Filter operationally relevant companies and jump directly into editing.
          </p>
        </div>

        <div className={researchOpsCompanyClass.filterShell}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label className={researchOpsCompanyClass.label}>
                Ops Preset
              </label>
              <select
                value={opsPreset}
                onChange={(e) => setOpsPreset(e.target.value as OpsPreset)}
                className={researchOpsCompanyClass.input}
              >
                <option value="all">All</option>
                <option value="pending_review">Pending Review</option>
                <option value="need_info">Need Info</option>
                <option value="missing_primary_type">Missing Primary Type</option>
                <option value="missing_country">Missing Country</option>
                <option value="missing_source">Missing Source</option>
                <option value="missing_links">No Project / Plant Links</option>
                <option value="missing_relationships">No Relationships</option>
                <option value="my_records">My Records</option>
              </select>
            </div>

            <div>
              <label className={researchOpsCompanyClass.label}>
                Headquarters Country
              </label>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className={researchOpsCompanyClass.input}
              >
                {countryOptions.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={researchOpsCompanyClass.label}>
                Primary Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className={researchOpsCompanyClass.input}
              >
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={researchOpsCompanyClass.label}>
                Research Status
              </label>
              <select
                value={researchStatusFilter}
                onChange={(e) => setResearchStatusFilter(e.target.value)}
                className={researchOpsCompanyClass.input}
              >
                {researchStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={researchOpsCompanyClass.label}>
                Review Status
              </label>
              <select
                value={reviewStatusFilter}
                onChange={(e) => setReviewStatusFilter(e.target.value)}
                className={researchOpsCompanyClass.input}
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
            placeholder="Search by ID, company, type, country, source, status..."
            className={researchOpsCompanyClass.input}
          />
        </div>

        <div className="px-6 pt-3">
          <p className={`text-xs ${researchOpsCompanyClass.muted}`}>
            Scroll horizontally to view all columns.
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-max">
            <table className="min-w-[1700px] text-left text-sm">
              <colgroup>
                <col className="w-[120px]" />
                <col className="w-[260px]" />
                <col className="w-[180px]" />
                <col className="w-[160px]" />
                <col className="w-[110px]" />
                <col className="w-[110px]" />
                <col className="w-[110px]" />
                <col className="w-[150px]" />
                <col className="w-[150px]" />
                <col className="w-[320px]" />
                <col className="w-[100px]" />
              </colgroup>

              <thead className={researchOpsCompanyClass.tableHead}>
                <tr>
                  <th className={researchOpsCompanyClass.tableHeaderCell}>Company ID</th>
                  <th className={researchOpsCompanyClass.tableHeaderCell}>Name</th>
                  <th className={researchOpsCompanyClass.tableHeaderCell}>Primary Type</th>
                  <th className={researchOpsCompanyClass.tableHeaderCell}>Country</th>
                  <th className={`${researchOpsCompanyClass.tableHeaderCell} text-center`}>Related</th>
                  <th className={`${researchOpsCompanyClass.tableHeaderCell} text-center`}>Projects</th>
                  <th className={`${researchOpsCompanyClass.tableHeaderCell} text-center`}>Plants</th>
                  <th className={researchOpsCompanyClass.tableHeaderCell}>Research Status</th>
                  <th className={researchOpsCompanyClass.tableHeaderCell}>Review Status</th>
                  <th className={researchOpsCompanyClass.tableHeaderCell}>Ops Flags</th>
                  <th className={researchOpsCompanyClass.tableHeaderCell}>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredCompanies.map((company) => {
                  const flags = buildFlags(company);

                  return (
                    <tr key={company.company_id} className={researchOpsCompanyClass.tableRow}>
                      <td className={researchOpsCompanyClass.tableMutedCell}>
                        {company.company_id}
                      </td>

                      <td className={researchOpsCompanyClass.tableCell}>
                        <Link
                          href={`/companies/${company.company_id}`}
                          className={researchOpsCompanyClass.link}
                        >
                          {company.company_name || "NA"}
                        </Link>
                      </td>

                      <td className={researchOpsCompanyClass.tableCell}>
                        {company.company_type_primary || "NA"}
                      </td>

                      <td className={researchOpsCompanyClass.tableCell}>
                        {company.headquarters_country || "NA"}
                      </td>

                      <td className={`${researchOpsCompanyClass.tableCell} text-center font-medium`}>
                        {formatCount(company.related_companies_count)}
                      </td>

                      <td className={`${researchOpsCompanyClass.tableCell} text-center font-medium`}>
                        {formatCount(company.linked_projects_count)}
                      </td>

                      <td className={`${researchOpsCompanyClass.tableCell} text-center font-medium`}>
                        {formatCount(company.linked_plants_count)}
                      </td>

                      <td className={researchOpsCompanyClass.tableCell}>
                        <ResearchStatusBadge value={company.research_status} />
                      </td>

                      <td className={researchOpsCompanyClass.tableCell}>
                        <ReviewStatusBadge value={company.review_status} />
                      </td>

                      <td className={researchOpsCompanyClass.tableCell}>
                        <div className="flex flex-wrap gap-2">
                          {flags.length > 0 ? (
                            flags.map((flag) => (
                              <span
                                key={`${company.company_id}-${flag}`}
                                className={researchOpsCompanyClass.flag}
                              >
                                {flag}
                              </span>
                            ))
                          ) : (
                            <span className={`text-xs ${researchOpsCompanyClass.muted}`}>—</span>
                          )}
                        </div>
                      </td>

                      <td className={researchOpsCompanyClass.tableCell}>
                        <Link
                          href={`/companies/${company.company_id}/edit`}
                          className={researchOpsCompanyClass.editLink}
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}

                {filteredCompanies.length === 0 && (
                  <tr>
                    <td
                      colSpan={11}
                      className={`px-4 py-8 text-center text-sm ${researchOpsCompanyClass.muted}`}
                    >
                      No company records found for the current operational filters.
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
