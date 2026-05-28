"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AnalysisModuleHero } from "@/components/analysis/AnalysisModuleHero";
import { getRequiredAnalysisModule } from "@/lib/analysis/modules";

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
  weighted_link_count: number;
  equal_split_link_count: number;
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

function MethodCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="border border-[#d7e8bf] bg-[#f5faef] px-4 py-3">
      <div className="text-sm font-bold text-[#1f2937]">{title}</div>
      <div className="mt-1 text-xs leading-5 text-gray-600">{text}</div>
    </div>
  );
}

export default function DeveloperAnalysisPage() {
  const [rows, setRows] = useState<DeveloperRow[]>([]);
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

          <section className="border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-[#f7f7f7] px-6 py-4">
              <h2 className="text-xl font-bold text-[#1f2937]">
                Top Developers by Attributed MWe
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Project MWe is attributed to developer-role companies using
                project link weights where available; otherwise it is split
                equally among developer links on the project.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100 text-left uppercase tracking-wide text-gray-600">
                  <tr>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">#</th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">Company</th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">Attributed MWe</th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">Linked Projects</th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">Countries</th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">Weighted</th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">Equal Split</th>
                    <th className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold">Roles</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
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
                      <td className="border-b border-gray-100 px-4 py-2 text-[13px] font-semibold text-[#1f2937]">
                        {formatNumber(row.attributed_mw)}
                      </td>
                      <td className="border-b border-gray-100 px-4 py-2 text-[13px]">{row.project_count}</td>
                      <td className="border-b border-gray-100 px-4 py-2 text-[13px]">{row.country_count}</td>
                      <td className="border-b border-gray-100 px-4 py-2 text-[13px]">{row.weighted_project_count}</td>
                      <td className="border-b border-gray-100 px-4 py-2 text-[13px]">{row.equal_split_project_count}</td>
                      <td className="border-b border-gray-100 px-4 py-2 text-[13px]">
                        <div className="flex flex-wrap gap-1">
                          {row.roles.map((role) => (
                            <span
                              key={role}
                              className="inline-flex min-h-[22px] items-center border border-gray-200 bg-[#fafafa] px-2 text-[11px] font-semibold text-gray-600"
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
                      <td colSpan={8} className="px-4 py-8 text-center text-[13px] text-gray-500">
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
