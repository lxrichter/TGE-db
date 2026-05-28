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
    <div className="border border-gray-200 bg-[#fafafa] px-5 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-1 text-3xl font-bold text-[#1f2937]">{value}</div>
      <div className="mt-1 text-xs text-gray-500">{help}</div>
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
    <div className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-[#f7f7f7] px-4 py-3">
        <h3 className="text-sm font-bold text-[#1f2937]">{title}</h3>
      </div>
      <div className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              {item.label}
            </div>
            <div
              className={`mt-1 text-lg font-bold ${
                item.tone === "warning" ? "text-amber-700" : "text-[#1f2937]"
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
    <div className="border border-gray-200 bg-white px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div
        className={`mt-1 text-xl font-bold ${
          tone === "warning" ? "text-amber-700" : "text-[#1f2937]"
        }`}
      >
        {value}
      </div>
      <p className="mt-1 text-xs leading-5 text-gray-600">{note}</p>
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

        <div className="border border-amber-200 bg-white">
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3">
            <h3 className="text-sm font-bold text-[#1f2937]">
              Cleanup Routing
            </h3>
            <p className="mt-1 text-xs leading-5 text-amber-900">
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
                className="border border-gray-200 bg-[#fafafa] px-3 py-2 text-xs font-semibold text-[#1f2937] transition hover:border-[#8dc63f] hover:bg-[#f5faef]"
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
        <section className="border border-gray-200 bg-white px-6 py-8">
          <p className="text-sm text-gray-600">Loading analysis...</p>
        </section>
      ) : null}

      {error ? (
        <section className="border border-red-200 bg-red-50 px-6 py-4">
          <p className="text-sm text-red-700">{error}</p>
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

          <section className="border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-[#f7f7f7] px-6 py-4">
              <h2 className="text-xl font-bold text-[#1f2937]">
                Top Owners by MWe
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Weighted owner ranking using installed MWe × ownership share.
                Only links with an ownership share and plant installed MWe are
                included.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100 text-left uppercase tracking-wide text-gray-600">
                  <tr>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">#</th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">Company</th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">Linked Plants</th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">Attributed MWe</th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">Owner Share % Sum</th>
                  </tr>
                </thead>
                <tbody>
                  {owners.map((row) => (
                    <tr key={row.company_id} className="hover:bg-gray-50">
                      <td className="border-b border-gray-100 px-4 py-2 text-[13px]">{row.rank}</td>
                      <td className="border-b border-gray-100 px-4 py-2 text-[13px]">
                        <Link
                          href={`/companies/${row.company_id}`}
                          className="font-medium text-[#1f2937] underline decoration-gray-300 underline-offset-4 hover:text-[#8dc63f]"
                        >
                          {row.company_name}
                        </Link>
                      </td>
                      <td className="border-b border-gray-100 px-4 py-2 text-[13px]">{row.plant_count}</td>
                      <td className="border-b border-gray-100 px-4 py-2 text-[13px]">{formatNumber(row.attributed_mw)}</td>
                      <td className="border-b border-gray-100 px-4 py-2 text-[13px]">{formatNumber(row.summed_ownership_share, 1)}</td>
                    </tr>
                  ))}

                  {owners.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[13px] text-gray-500">
                        No owner analysis found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-[#f7f7f7] px-6 py-4">
              <h2 className="text-xl font-bold text-[#1f2937]">
                Top Operators by MWe
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Operator ranking based on full installed MWe for plants linked
                as Operator, Operator Power, or Operator Steam.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100 text-left uppercase tracking-wide text-gray-600">
                  <tr>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">#</th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">Company</th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">Linked Plants</th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">Operated MWe</th>
                  </tr>
                </thead>
                <tbody>
                  {operators.map((row) => (
                    <tr key={row.company_id} className="hover:bg-gray-50">
                      <td className="border-b border-gray-100 px-4 py-2 text-[13px]">{row.rank}</td>
                      <td className="border-b border-gray-100 px-4 py-2 text-[13px]">
                        <Link
                          href={`/companies/${row.company_id}`}
                          className="font-medium text-[#1f2937] underline decoration-gray-300 underline-offset-4 hover:text-[#8dc63f]"
                        >
                          {row.company_name}
                        </Link>
                      </td>
                      <td className="border-b border-gray-100 px-4 py-2 text-[13px]">{row.plant_count}</td>
                      <td className="border-b border-gray-100 px-4 py-2 text-[13px]">{formatNumber(row.operated_mw)}</td>
                    </tr>
                  ))}

                  {operators.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-[13px] text-gray-500">
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
