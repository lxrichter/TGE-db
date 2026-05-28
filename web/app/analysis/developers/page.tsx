"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  AnalysisGovernanceQaSection,
  AnalysisQaTable,
} from "@/components/analysis/AnalysisGovernanceQa";
import { AnalysisModuleHero } from "@/components/analysis/AnalysisModuleHero";
import {
  analysisGovernanceCleanupRoutes,
  getRequiredAnalysisModule,
} from "@/lib/analysis/modules";

const developerModule = getRequiredAnalysisModule("developer-analysis");

type DeveloperRow = {
  rank: number;
  company_id: string;
  company_name: string;
  project_count: number;
  country_count: number;
  roles: string[];
  attributed_mw: number;
  full_project_mw: number;
  weighted_project_count: number;
  equal_split_project_count: number;
  primary_link_count: number;
};

type DeveloperSummary = {
  roles_counted: string[];
  attribution_rule: string;
  developer_link_count: number;
  excluded_non_developer_role_count: number;
  linked_project_count: number;
  included_project_count: number;
  projects_missing_mw: number;
  weighted_project_count: number;
  equal_split_project_count: number;
  single_developer_project_count: number;
  multi_developer_weighted_project_count: number;
  multi_developer_equal_split_project_count: number;
  weighted_link_count: number;
  equal_split_link_count: number;
};

type ExcludedRoleRow = {
  role: string;
  link_count: number;
  project_count: number;
  company_count: number;
};

type ProjectQaRow = {
  project_id: string;
  project_name: string;
  country: string | null;
  phase: string | null;
  project_mw: number | null;
  developer_count: number;
  developer_names: string[];
  roles: string[];
};

type SegmentRow = {
  label: string;
  project_count: number;
  developer_count: number;
  attributed_mw: number;
};

const panelClass =
  "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]";
const panelHeaderClass =
  "border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)]";
const subtleCardClass =
  "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)]";
const eyebrowClass =
  "text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]";
const titleTextClass = "text-[var(--tge-text-primary)]";
const bodyTextClass = "text-[var(--tge-text-secondary)]";
const tableHeadClass =
  "bg-[var(--tge-governance-neutral-bg)] text-left uppercase tracking-wide text-[var(--tge-governance-neutral-text)]";
const tableHeadCellClass =
  "border-b border-[var(--tge-governance-neutral-border)] px-4 py-2 text-[12px] font-semibold";
const tableRowClass = "hover:bg-[var(--tge-surface-subtle)]";
const tableCellClass =
  "border-b border-[var(--tge-governance-muted-border)] px-4 py-2 text-[13px]";
const tablePrimaryCellClass = `${tableCellClass} font-semibold text-[var(--tge-text-primary)]`;
const emptyCellClass =
  "px-4 py-8 text-center text-[13px] text-[var(--tge-governance-muted-text)]";
const linkClass =
  "underline decoration-[var(--tge-governance-muted-border)] underline-offset-4 hover:text-[var(--tge-brand-green-dark)]";
const tagClass =
  "inline-flex min-h-[22px] items-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-2 text-[11px] font-semibold text-[var(--tge-governance-neutral-text)]";

function formatNumber(value: number, digits = 1) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function StatCard({
  label,
  value,
  help,
}: {
  label: string;
  value: string | number;
  help: string;
}) {
  return (
    <div className={`${subtleCardClass} px-5 py-4`}>
      <div className={eyebrowClass}>
        {label}
      </div>
      <div className={`mt-1 text-3xl font-bold ${titleTextClass}`}>
        {value}
      </div>
      <div className="mt-1 text-xs text-[var(--tge-governance-muted-text)]">
        {help}
      </div>
    </div>
  );
}

function CoverageCard({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: string | number; tone?: "default" | "warning" }[];
}) {
  return (
    <div className={panelClass}>
      <div className={`${panelHeaderClass} px-4 py-3`}>
        <h3 className={`text-sm font-bold ${titleTextClass}`}>{title}</h3>
      </div>
      <div className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className={eyebrowClass}>
              {item.label}
            </div>
            <div
              className={`mt-1 text-lg font-bold ${
                item.tone === "warning"
                  ? "text-[var(--tge-governance-attention-text)]"
                  : titleTextClass
              }`}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MethodCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="border border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] px-4 py-3">
      <div className={`text-sm font-bold ${titleTextClass}`}>{title}</div>
      <div className={`mt-1 text-xs leading-5 ${bodyTextClass}`}>{text}</div>
    </div>
  );
}

function SegmentTable({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: SegmentRow[];
}) {
  return (
    <section className={panelClass}>
      <div className={`${panelHeaderClass} px-6 py-4`}>
        <h2 className={`text-xl font-bold ${titleTextClass}`}>{title}</h2>
        <p className="mt-1 text-sm text-[var(--tge-governance-muted-text)]">
          {description}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className={tableHeadClass}>
            <tr>
              <th className={tableHeadCellClass}>Segment</th>
              <th className={tableHeadCellClass}>Attributed MWe</th>
              <th className={tableHeadCellClass}>Projects</th>
              <th className={tableHeadCellClass}>Developers</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className={tableRowClass}>
                <td className={tablePrimaryCellClass}>
                  {row.label}
                </td>
                <td className={tableCellClass}>
                  {formatNumber(row.attributed_mw)}
                </td>
                <td className={tableCellClass}>
                  {row.project_count}
                </td>
                <td className={tableCellClass}>
                  {row.developer_count}
                </td>
              </tr>
            ))}

            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className={emptyCellClass}>
                  No segment data found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function QaCleanupRoutes() {
  const routes = [
    {
      ...analysisGovernanceCleanupRoutes.research_ops,
      description:
        "Route missing MWe, equal-split attribution, and role cleanup into operational review.",
    },
    {
      ...analysisGovernanceCleanupRoutes.projects,
      description:
        "Open project profiles to fix project MWe, phase, and source-backed capacity fields.",
    },
    {
      ...analysisGovernanceCleanupRoutes.companies,
      description:
        "Review developer roles separately from ownership, operator, investor, and supplier links.",
    },
  ];

  return (
    <section className="border border-[var(--tge-governance-attention-border)] bg-[var(--tge-surface-card)]">
      <div className="border-b border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] px-5 py-3">
        <h3 className={`text-sm font-bold ${titleTextClass}`}>
          Cleanup Routing
        </h3>
        <p className="mt-1 text-[13px] leading-5 text-[var(--tge-governance-attention-text)]">
          QA findings should become researcher work, not silent caveats in the
          ranking output.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
        {routes.map((route) => (
          <Link
            key={route.label}
            href={route.href}
            className="block border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-4 py-3 transition hover:border-[var(--tge-brand-green)] hover:bg-[var(--tge-governance-success-bg)]"
          >
            <div className={`text-sm font-bold ${titleTextClass}`}>
              {route.label}
            </div>
            <p className={`mt-1 text-xs leading-5 ${bodyTextClass}`}>
              {route.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RoleDistributionTable({ rows }: { rows: ExcludedRoleRow[] }) {
  return (
    <AnalysisQaTable
      title="Excluded Role Distribution"
      description="Relationship roles intentionally excluded from developer attribution."
      headers={["Role", "Links", "Projects", "Companies"]}
      emptyMessage="No excluded role rows found."
      colSpan={4}
      isEmpty={rows.length === 0}
    >
      {rows.map((row) => (
        <tr key={row.role} className={tableRowClass}>
          <td className={tablePrimaryCellClass}>
            {row.role}
          </td>
          <td className={tableCellClass}>
            {row.link_count}
          </td>
          <td className={tableCellClass}>
            {row.project_count}
          </td>
          <td className={tableCellClass}>
            {row.company_count}
          </td>
        </tr>
      ))}
    </AnalysisQaTable>
  );
}

function ProjectQaTable({
  title,
  description,
  rows,
  showMw,
}: {
  title: string;
  description: string;
  rows: ProjectQaRow[];
  showMw?: boolean;
}) {
  const headers = showMw
    ? ["Project", "Country", "Phase", "Project MWe", "Developers", "Roles"]
    : ["Project", "Country", "Phase", "Developers", "Roles"];

  return (
    <AnalysisQaTable
      title={title}
      description={description}
      headers={headers}
      emptyMessage="No project QA rows found."
      colSpan={headers.length}
      isEmpty={rows.length === 0}
    >
      {rows.map((row) => (
        <tr key={row.project_id} className={tableRowClass}>
          <td className={tablePrimaryCellClass}>
            <Link
              href={`/projects/${row.project_id}`}
              className={linkClass}
            >
              {row.project_name}
            </Link>
          </td>
          <td className={tableCellClass}>
            {row.country || "-"}
          </td>
          <td className={tableCellClass}>
            {row.phase || "-"}
          </td>
          {showMw ? (
            <td className={tableCellClass}>
              {row.project_mw === null ? "-" : formatNumber(row.project_mw)}
            </td>
          ) : null}
          <td className={tableCellClass}>
            {row.developer_names.join(", ")}
          </td>
          <td className={tableCellClass}>
            {row.roles.join(", ")}
          </td>
        </tr>
      ))}
    </AnalysisQaTable>
  );
}

export default function DeveloperAnalysisPage() {
  const [rows, setRows] = useState<DeveloperRow[]>([]);
  const [countryRows, setCountryRows] = useState<SegmentRow[]>([]);
  const [phaseRows, setPhaseRows] = useState<SegmentRow[]>([]);
  const [excludedRoleRows, setExcludedRoleRows] = useState<ExcludedRoleRow[]>([]);
  const [equalSplitProjects, setEqualSplitProjects] = useState<ProjectQaRow[]>([]);
  const [missingMwProjects, setMissingMwProjects] = useState<ProjectQaRow[]>([]);
  const [summary, setSummary] = useState<DeveloperSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/analysis/developers", {
          cache: "no-store",
        });
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || "Failed to load developer analysis.");
        }

        setRows(Array.isArray(json.rows) ? json.rows : []);
        setCountryRows(Array.isArray(json.countryRows) ? json.countryRows : []);
        setPhaseRows(Array.isArray(json.phaseRows) ? json.phaseRows : []);
        setExcludedRoleRows(
          Array.isArray(json.qa?.excludedRoleRows)
            ? json.qa.excludedRoleRows
            : []
        );
        setEqualSplitProjects(
          Array.isArray(json.qa?.equalSplitProjects)
            ? json.qa.equalSplitProjects
            : []
        );
        setMissingMwProjects(
          Array.isArray(json.qa?.missingMwProjects)
            ? json.qa.missingMwProjects
            : []
        );
        setSummary(json.summary || null);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load developer analysis.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const totalAttributedMw = rows.reduce(
    (sum, row) => sum + row.attributed_mw,
    0
  );
  const totalLinkedProjects = summary?.linked_project_count ?? 0;

  return (
    <main className="space-y-8">
      <AnalysisModuleHero
        loading={loading}
        module={developerModule}
        scopeItems={[
          { value: rows.length, label: "Developer rows" },
          { value: formatNumber(totalAttributedMw), label: "Attributed MWe" },
          { value: totalLinkedProjects, label: "Linked projects" },
          {
            value: summary?.weighted_project_count ?? 0,
            label: "Weighted projects",
          },
        ]}
      >
        <div className="grid grid-cols-2 gap-x-8 gap-y-6 xl:grid-cols-4">
          <StatCard
            label="Developers"
            value={rows.length}
            help="Companies with attributed developer MWe"
          />
          <StatCard
            label="Attributed MWe"
            value={formatNumber(totalAttributedMw)}
            help="Weighted or equal-split project MWe"
          />
          <StatCard
            label="Linked Projects"
            value={totalLinkedProjects}
            help="Projects with developer-role links"
          />
          <StatCard
            label="Missing MWe"
            value={summary?.projects_missing_mw ?? 0}
            help="Linked projects excluded until capacity is known"
          />
        </div>
      </AnalysisModuleHero>

      {loading ? (
        <section className={`${panelClass} px-6 py-8`}>
          <p className={`text-sm ${bodyTextClass}`}>Loading analysis...</p>
        </section>
      ) : null}

      {error ? (
        <section className="border border-[var(--tge-governance-danger-border)] bg-[var(--tge-governance-danger-bg)] px-6 py-4">
          <p className="text-sm text-[var(--tge-governance-danger-text)]">
            {error}
          </p>
        </section>
      ) : null}

      {!loading && !error ? (
        <>
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <CoverageCard
              title="Developer Attribution Coverage"
              items={[
                {
                  label: "Roles counted",
                  value: summary?.roles_counted.join(", ") || "Developer",
                },
                {
                  label: "Developer links",
                  value: summary?.developer_link_count ?? 0,
                },
                {
                  label: "Projects included",
                  value: summary?.included_project_count ?? 0,
                },
                {
                  label: "Weighted projects",
                  value: summary?.weighted_project_count ?? 0,
                },
                {
                  label: "Equal-split projects",
                  value: summary?.equal_split_project_count ?? 0,
                },
                {
                  label: "Multi-dev equal split",
                  value: summary?.multi_developer_equal_split_project_count ?? 0,
                  tone: summary?.multi_developer_equal_split_project_count
                    ? "warning"
                    : "default",
                },
                {
                  label: "Missing project MWe",
                  value: summary?.projects_missing_mw ?? 0,
                  tone: summary?.projects_missing_mw ? "warning" : "default",
                },
              ]}
            />

            <div className="space-y-3">
              <MethodCard
                title="Narrow role logic"
                text="Only Developer, Co-Developer, Project Sponsor, and Lead Developer count here. Resource owners, investors, operators, EPCs, suppliers, and contractors stay out of this ranking."
              />
              <MethodCard
                title="Weighted attribution"
                text={
                  summary?.attribution_rule ||
                  "Single developer receives 100%. Multiple developers use valid weights where all are present; otherwise equal split."
                }
              />
              <MethodCard
                title="Separation of meaning"
                text="Development attribution is intentionally separate from ownership attribution and operating attribution."
              />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <SegmentTable
              title="Developer Exposure by Country"
              description="Attributed project MWe grouped by country market."
              rows={countryRows.slice(0, 12)}
            />
            <SegmentTable
              title="Developer Exposure by Project Phase"
              description="Attributed project MWe grouped by current project phase."
              rows={phaseRows}
            />
          </section>

          <AnalysisGovernanceQaSection
            title="Developer Attribution Readiness"
            description="These checks keep the current output in logic-validation mode. Rankings should not be treated as market-complete until project MWe, developer-role links, and co-developer attribution weights are normalized."
          >
            <QaCleanupRoutes />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <RoleDistributionTable rows={excludedRoleRows} />
              <ProjectQaTable
                title="Multi-Developer Equal-Split Projects"
                description="Projects using equal split because complete positive attribution weights are not yet available."
                rows={equalSplitProjects}
                showMw
              />
            </div>

            <ProjectQaTable
              title="Developer-Linked Projects Missing MWe"
              description="Developer-linked projects excluded from MWe attribution until a project capacity value is available."
              rows={missingMwProjects}
            />
          </AnalysisGovernanceQaSection>

          <section className={panelClass}>
            <div className={`${panelHeaderClass} px-6 py-4`}>
              <h2 className={`text-xl font-bold ${titleTextClass}`}>
                Top Developers by Attributed MWe
              </h2>
              <p className="mt-1 text-sm text-[var(--tge-governance-muted-text)]">
                Project MWe is attributed to developer-role companies using
                project link weights where available; otherwise it is split
                equally among developer links on the project.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className={tableHeadClass}>
                  <tr>
                    <th className={tableHeadCellClass}>#</th>
                    <th className={tableHeadCellClass}>Company</th>
                    <th className={tableHeadCellClass}>Attributed MWe</th>
                    <th className={tableHeadCellClass}>Linked Projects</th>
                    <th className={tableHeadCellClass}>Countries</th>
                    <th className={tableHeadCellClass}>Weighted</th>
                    <th className={tableHeadCellClass}>Equal Split</th>
                    <th className={tableHeadCellClass}>Roles</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.company_id} className={tableRowClass}>
                      <td className={tableCellClass}>{row.rank}</td>
                      <td className={tableCellClass}>
                        <Link
                          href={`/companies/${row.company_id}`}
                          className={`font-medium text-[var(--tge-text-primary)] ${linkClass}`}
                        >
                          {row.company_name}
                        </Link>
                      </td>
                      <td className={tablePrimaryCellClass}>
                        {formatNumber(row.attributed_mw)}
                      </td>
                      <td className={tableCellClass}>{row.project_count}</td>
                      <td className={tableCellClass}>{row.country_count}</td>
                      <td className={tableCellClass}>
                        {row.weighted_project_count}
                      </td>
                      <td className={tableCellClass}>
                        {row.equal_split_project_count}
                      </td>
                      <td className={tableCellClass}>
                        <div className="flex flex-wrap gap-1">
                          {row.roles.map((role) => (
                            <span
                              key={role}
                              className={tagClass}
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className={emptyCellClass}>
                        No developer analysis found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
