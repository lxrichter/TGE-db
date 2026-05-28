import Link from "next/link";
import type { ReactNode } from "react";

import {
  analysisStatusLabels,
  type AnalysisModule,
  type AnalysisModuleStatus,
} from "@/lib/analysis/modules";

const statusTone: Record<AnalysisModuleStatus, string> = {
  live: "border-[#b9d98b] bg-[#f1f8e8] text-[#3f6f19]",
  definition_next: "border-amber-200 bg-amber-50 text-amber-800",
  planned: "border-gray-200 bg-[#f7f7f7] text-gray-600",
};

type ScopeItem = {
  label: string;
  value: string | number;
};

export function AnalysisModuleHero({
  module,
  scopeItems,
  children,
  loading,
}: {
  module: AnalysisModule;
  scopeItems?: ScopeItem[];
  children?: ReactNode;
  loading?: boolean;
}) {
  return (
    <>
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
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
                Analysis
              </p>
              <span
                className={`inline-flex min-h-[24px] items-center border px-2 text-xs font-semibold ${statusTone[module.status]}`}
              >
                {analysisStatusLabels[module.status]}
              </span>
            </div>

            <h1 className="mt-3 text-5xl font-bold tracking-tight text-[#1f2937]">
              {module.title}
            </h1>

            <p className="mt-4 max-w-5xl text-lg leading-8 text-gray-600">
              {loading ? "Loading analysis..." : module.description}
            </p>
          </div>
        </div>

        {scopeItems && scopeItems.length > 0 ? (
          <div className="border-t border-gray-200 bg-[#f7f7f7] px-8 py-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-700">
              <span className="font-semibold uppercase tracking-wide text-gray-500">
                Scope
              </span>
              {scopeItems.map((item, index) => (
                <span key={`${item.label}-${item.value}`} className="contents">
                  {index > 0 ? <span className="text-gray-300">|</span> : null}
                  <span>
                    {item.value} {item.label}
                  </span>
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="border-t border-gray-200 bg-[#fafafa] px-8 py-5">
          <div className="grid grid-cols-1 gap-4 text-sm text-gray-700 md:grid-cols-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Source basis
              </div>
              <p className="mt-1 leading-5 text-[#1f2937]">
                {module.sourceBasis}
              </p>
            </div>
            <div className="md:col-span-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Primary measures
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {module.primaryMeasures.map((measure) => (
                  <span
                    key={measure}
                    className="inline-flex min-h-[24px] items-center border border-gray-200 bg-white px-2 text-xs font-semibold text-gray-700"
                  >
                    {measure}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {children ? (
          <div className="border-t border-gray-200 bg-[#fafafa] px-8 py-5">
            {children}
          </div>
        ) : null}
      </section>
    </>
  );
}
