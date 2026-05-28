"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AnalysisGovernanceQaSection } from "@/components/analysis/AnalysisGovernanceQa";
import { AnalysisModuleHero } from "@/components/analysis/AnalysisModuleHero";
import {
  analysisGovernanceCleanupRoutes,
  getRequiredAnalysisModule,
} from "@/lib/analysis/modules";

const ownersOperatorsModule = getRequiredAnalysisModule("owners-operators");

type OwnerRow = {
  rank: number;
  company_id: string;
  company_name: string;
  plant_count: number;
  attributed_mw: number;
  summed_ownership_share: number;
};

type OwnerSummary = {
  roles_counted: string[];
  owner_link_count: number;
  links_with_ownership_share: number;
  links_missing_ownership_share: number;
  links_missing_installed_mw: number;
  included_plant_count: number;
};

type OperatorRow = {
  rank: number;
  company_id: string;
  company_name: string;
  plant_count: number;
  operated_mw: number;
};

type OperatorSummary = {
  roles_counted: string[];
  operator_link_count: number;
  linked_plant_count: number;
  links_missing_installed_mw: number;
  included_plant_count: number;
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
const emptyCellClass =
  "px-4 py-8 text-center text-[13px] text-[var(--tge-governance-muted-text)]";
const linkClass =
  "font-medium text-[var(--tge-text-primary)] underline decoration-[var(--tge-governance-muted-border)] underline-offset-4 hover:text-[var(--tge-brand-green-dark)]";

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
      <div className={`mt-1 text-3xl font-bold ${titleTextClass}`}>{value}</div>
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
    <div className={`${panelClass} px-4 py-3`}>
      <div className={eyebrowClass}>
        {label}
      </div>
      <div
        className={`mt-1 text-xl font-bold ${
          tone === "warning"
            ? "text-[var(--tge-governance-attention-text)]"
            : titleTextClass
        }`}
      >
        {value}
      </div>
      <p className={`mt-1 text-xs leading-5 ${bodyTextClass}`}>{note}</p>
    </div>
  );
}

function GovernanceReadinessPanel({
  ownerSummary,
  operatorSummary,
}: {
  ownerSummary: OwnerSummary | null;
  operatorSummary: OperatorSummary | null;
}) {
  const ownerMissingShare = ownerSummary?.links_missing_ownership_share ?? 0;
  const ownerMissingMw = ownerSummary?.links_missing_installed_mw ?? 0;
  const operatorMissingMw = operatorSummary?.links_missing_installed_mw ?? 0;

  return (
    <AnalysisGovernanceQaSection
      title="Ownership And Operator Readiness"
      description="These checks keep owner and operator rankings transparent. Ownership attribution depends on explicit ownership share and plant MWe; operator attribution remains a separate full-plant-MWe view."
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_0.8fr]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <GovernanceMetric
            label="Missing ownership %"
            value={ownerMissingShare}
            note="Owner links excluded from weighted MW until ownership share is available."
            tone={ownerMissingShare ? "warning" : "default"}
          />
          <GovernanceMetric
            label="Owner links missing MWe"
            value={ownerMissingMw}
            note="Owner links excluded until the linked plant has installed MWe."
            tone={ownerMissingMw ? "warning" : "default"}
          />
          <GovernanceMetric
            label="Operator links missing MWe"
            value={operatorMissingMw}
            note="Operator links excluded from operated MWe until plant capacity is known."
            tone={operatorMissingMw ? "warning" : "default"}
          />
        </div>

        <div className="border border-[var(--tge-governance-attention-border)] bg-[var(--tge-surface-card)]">
          <div className="border-b border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] px-4 py-3">
            <h3 className={`text-sm font-bold ${titleTextClass}`}>
              Cleanup Routing
            </h3>
            <p className="mt-1 text-xs leading-5 text-[var(--tge-governance-attention-text)]">
              Resolve ownership shares, plant capacity, and role separation in
              the operational workspaces.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-3 xl:grid-cols-1">
            {[
              analysisGovernanceCleanupRoutes.research_ops,
              analysisGovernanceCleanupRoutes.plants,
              analysisGovernanceCleanupRoutes.companies,
            ].map((route) => (
              <Link
                key={route.label}
                href={route.href}
                className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-3 py-2 text-xs font-semibold text-[var(--tge-text-primary)] transition hover:border-[var(--tge-brand-green)] hover:bg-[var(--tge-governance-success-bg)]"
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

export default function OperatorAnalysisPage() {
  const [owners, setOwners] = useState<OwnerRow[]>([]);
  const [ownerSummary, setOwnerSummary] = useState<OwnerSummary | null>(null);
  const [operators, setOperators] = useState<OperatorRow[]>([]);
  const [operatorSummary, setOperatorSummary] = useState<OperatorSummary | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [ownersRes, operatorsRes] = await Promise.all([
          fetch("/api/analysis/owners", { cache: "no-store" }),
          fetch("/api/analysis/operators", { cache: "no-store" }),
        ]);

        const ownersJson = await ownersRes.json();
        const operatorsJson = await operatorsRes.json();

        if (!ownersRes.ok) {
          throw new Error(ownersJson?.error || "Failed to load owner analysis.");
        }

        if (!operatorsRes.ok) {
          throw new Error(operatorsJson?.error || "Failed to load operator analysis.");
        }

        setOwners(Array.isArray(ownersJson.rows) ? ownersJson.rows : []);
        setOwnerSummary(ownersJson.summary || null);
        setOperators(Array.isArray(operatorsJson.rows) ? operatorsJson.rows : []);
        setOperatorSummary(operatorsJson.summary || null);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load analysis.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const totalOwnerMw = owners.reduce((sum, row) => sum + row.attributed_mw, 0);
  const totalOperatorMw = operators.reduce((sum, row) => sum + row.operated_mw, 0);

  return (
    <main className="space-y-8">
      <AnalysisModuleHero
        loading={loading}
        module={ownersOperatorsModule}
        scopeItems={[
          { value: owners.length, label: "Owner rows" },
          { value: formatNumber(totalOwnerMw), label: "Owner MWe" },
          { value: operators.length, label: "Operator rows" },
          { value: formatNumber(totalOperatorMw), label: "Operator MWe" },
        ]}
      >
        <div className="grid grid-cols-2 gap-x-8 gap-y-6 xl:grid-cols-4">
          <StatCard
            label="Owners"
            value={owners.length}
            help="Companies with weighted owner MWe"
          />
          <StatCard
            label="Owner MWe"
            value={formatNumber(totalOwnerMw)}
            help="Weighted by ownership share"
          />
          <StatCard
            label="Operators"
            value={operators.length}
            help="Companies linked as operator"
          />
          <StatCard
            label="Operator MWe"
            value={formatNumber(totalOperatorMw)}
            help="Role-attributed installed MWe"
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
          <p className="text-sm text-[var(--tge-governance-danger-text)]">{error}</p>
        </section>
      ) : null}

      {!loading && !error ? (
        <>
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <CoverageCard
              title="Owner Data Coverage"
              items={[
                {
                  label: "Roles counted",
                  value: ownerSummary?.roles_counted.join(", ") || "Owner",
                },
                {
                  label: "Owner links",
                  value: ownerSummary?.owner_link_count ?? 0,
                },
                {
                  label: "Weighted links",
                  value: ownerSummary?.links_with_ownership_share ?? 0,
                },
                {
                  label: "Missing ownership %",
                  value: ownerSummary?.links_missing_ownership_share ?? 0,
                  tone: ownerSummary?.links_missing_ownership_share
                    ? "warning"
                    : "default",
                },
                {
                  label: "Missing plant MWe",
                  value: ownerSummary?.links_missing_installed_mw ?? 0,
                  tone: ownerSummary?.links_missing_installed_mw
                    ? "warning"
                    : "default",
                },
                {
                  label: "Plants included",
                  value: ownerSummary?.included_plant_count ?? 0,
                },
              ]}
            />

            <CoverageCard
              title="Operator Data Coverage"
              items={[
                {
                  label: "Roles counted",
                  value:
                    operatorSummary?.roles_counted.join(", ") ||
                    "Operator, Operator Power, Operator Steam",
                },
                {
                  label: "Operator links",
                  value: operatorSummary?.operator_link_count ?? 0,
                },
                {
                  label: "Linked plants",
                  value: operatorSummary?.linked_plant_count ?? 0,
                },
                {
                  label: "Missing plant MWe",
                  value: operatorSummary?.links_missing_installed_mw ?? 0,
                  tone: operatorSummary?.links_missing_installed_mw
                    ? "warning"
                    : "default",
                },
                {
                  label: "Plants included",
                  value: operatorSummary?.included_plant_count ?? 0,
                },
                {
                  label: "Attribution rule",
                  value: "Full plant MWe",
                },
              ]}
            />
          </section>

          <GovernanceReadinessPanel
            ownerSummary={ownerSummary}
            operatorSummary={operatorSummary}
          />

          <section className={panelClass}>
            <div className={`${panelHeaderClass} px-6 py-4`}>
              <h2 className={`text-xl font-bold ${titleTextClass}`}>
                Top Owners by MWe
              </h2>
              <p className="mt-1 text-sm text-[var(--tge-governance-muted-text)]">
                Weighted owner ranking using installed MWe × ownership share.
                Only links with an ownership share and plant installed MWe are
                included.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className={tableHeadClass}>
                  <tr>
                    <th className={tableHeadCellClass}>#</th>
                    <th className={tableHeadCellClass}>Company</th>
                    <th className={tableHeadCellClass}>Linked Plants</th>
                    <th className={tableHeadCellClass}>Attributed MWe</th>
                    <th className={tableHeadCellClass}>Owner Share % Sum</th>
                  </tr>
                </thead>
                <tbody>
                  {owners.map((row) => (
                    <tr key={row.company_id} className={tableRowClass}>
                      <td className={tableCellClass}>{row.rank}</td>
                      <td className={tableCellClass}>
                        <Link
                          href={`/companies/${row.company_id}`}
                          className={linkClass}
                        >
                          {row.company_name}
                        </Link>
                      </td>
                      <td className={tableCellClass}>{row.plant_count}</td>
                      <td className={tableCellClass}>{formatNumber(row.attributed_mw)}</td>
                      <td className={tableCellClass}>{formatNumber(row.summed_ownership_share, 1)}</td>
                    </tr>
                  ))}

                  {owners.length === 0 && (
                    <tr>
                      <td colSpan={5} className={emptyCellClass}>
                        No owner analysis found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className={panelClass}>
            <div className={`${panelHeaderClass} px-6 py-4`}>
              <h2 className={`text-xl font-bold ${titleTextClass}`}>
                Top Operators by MWe
              </h2>
              <p className="mt-1 text-sm text-[var(--tge-governance-muted-text)]">
                Operator ranking based on full installed MWe for plants linked
                as Operator, Operator Power, or Operator Steam.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className={tableHeadClass}>
                  <tr>
                    <th className={tableHeadCellClass}>#</th>
                    <th className={tableHeadCellClass}>Company</th>
                    <th className={tableHeadCellClass}>Linked Plants</th>
                    <th className={tableHeadCellClass}>Operated MWe</th>
                  </tr>
                </thead>
                <tbody>
                  {operators.map((row) => (
                    <tr key={row.company_id} className={tableRowClass}>
                      <td className={tableCellClass}>{row.rank}</td>
                      <td className={tableCellClass}>
                        <Link
                          href={`/companies/${row.company_id}`}
                          className={linkClass}
                        >
                          {row.company_name}
                        </Link>
                      </td>
                      <td className={tableCellClass}>{row.plant_count}</td>
                      <td className={tableCellClass}>{formatNumber(row.operated_mw)}</td>
                    </tr>
                  ))}

                  {operators.length === 0 && (
                    <tr>
                      <td colSpan={4} className={emptyCellClass}>
                        No operator analysis found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
