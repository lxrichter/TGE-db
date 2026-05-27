"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type OwnerRow = {
  rank: number;
  company_id: string;
  company_name: string;
  plant_count: number;
  attributed_mw: number;
  summed_ownership_share: number;
};

type OperatorRow = {
  rank: number;
  company_id: string;
  company_name: string;
  plant_count: number;
  operated_mw: number;
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

export default function OperatorAnalysisPage() {
  const [owners, setOwners] = useState<OwnerRow[]>([]);
  const [operators, setOperators] = useState<OperatorRow[]>([]);
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
        setOperators(Array.isArray(operatorsJson.rows) ? operatorsJson.rows : []);
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
          <div className="max-w-5xl">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
              Analysis
            </p>

            <h1 className="mt-3 text-5xl font-bold tracking-tight text-[#1f2937]">
              Owners & Operators
            </h1>

            <p className="mt-4 max-w-5xl text-lg leading-8 text-gray-600">
              First internal ranking view based on structured company-to-plant links.
              Owners are weighted by ownership share. Operators are counted on full
              installed MWe where the company is linked as Operator.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-[#fafafa] px-8 py-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 xl:grid-cols-4">
            <StatCard
              label="Owner Rows"
              value={owners.length}
              help="Companies with weighted owner MWe"
            />
            <StatCard
              label="Owner MWe"
              value={formatNumber(totalOwnerMw)}
              help="Weighted by ownership share"
            />
            <StatCard
              label="Operator Rows"
              value={operators.length}
              help="Companies linked as operator"
            />
            <StatCard
              label="Operator MWe"
              value={formatNumber(totalOperatorMw)}
              help="Full installed MWe attributed"
            />
          </div>
        </div>
      </section>

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
          <section className="border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-[#f7f7f7] px-6 py-4">
              <h2 className="text-xl font-bold text-[#1f2937]">
                Top Owners by MWe
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Weighted owner ranking using installed MWe × ownership share.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100 text-left uppercase tracking-wide text-gray-600">
                  <tr>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">#</th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">Company</th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold"># Plants</th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">Attributed MWe</th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">Ownership % Sum</th>
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
                        No owner analysis rows found.
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
                Operator ranking based on full installed MWe for plants linked as Operator.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100 text-left uppercase tracking-wide text-gray-600">
                  <tr>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">#</th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">Company</th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold"># Plants</th>
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
                        No operator analysis rows found.
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
