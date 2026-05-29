import Link from "next/link";
import type { ReactNode } from "react";

import {
  analysisStatusLabels,
  type AnalysisModule,
  type AnalysisModuleStatus,
} from "@/lib/analysis/modules";

const statusTone: Record<AnalysisModuleStatus, string> = {
  live:
    "border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] text-[var(--tge-governance-success-text)]",
  definition_next:
    "border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] text-[var(--tge-governance-attention-text)]",
  planned:
    "border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] text-[var(--tge-governance-neutral-text)]",
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
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link
          href="/analysis"
          className="text-sm font-semibold text-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)] hover:underline"
        >
          ← Back to Analysis Workspace
        </Link>
        <span className="text-[var(--tge-governance-muted-border)]">|</span>
        <Link
          href={`/analysis/modules/${module.id}`}
          className="text-sm font-semibold text-[var(--tge-governance-muted-text)] hover:text-[var(--tge-brand-green-dark)] hover:underline"
        >
          View module definition
        </Link>
      </div>

      <section className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]">
        <div className="border-l-4 border-l-[var(--tge-brand-green)] px-6 py-6 xl:px-8">
          <div className="max-w-5xl">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]">
                Analysis
              </p>
              <span
                className={`inline-flex min-h-[24px] items-center border px-2 text-xs font-semibold ${statusTone[module.status]}`}
              >
                {analysisStatusLabels[module.status]}
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--tge-text-primary)] xl:text-[2.75rem]">
              {module.title}
            </h1>

            <p className="mt-3 max-w-5xl text-base leading-7 text-[var(--tge-text-secondary)]">
              {loading ? "Loading analysis..." : module.description}
            </p>
          </div>
        </div>

        {scopeItems && scopeItems.length > 0 ? (
          <div className="border-t border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-8 py-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--tge-governance-neutral-text)]">
              <span className="font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
                Scope
              </span>
              {scopeItems.map((item, index) => (
                <span key={`${item.label}-${item.value}`} className="contents">
                  {index > 0 ? (
                    <span className="text-[var(--tge-governance-muted-border)]">
                      |
                    </span>
                  ) : null}
                  <span>
                    {item.value} {item.label}
                  </span>
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="border-t border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-8 py-5">
          <div className="grid grid-cols-1 gap-4 text-sm text-[var(--tge-governance-neutral-text)] md:grid-cols-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
                Source basis
              </div>
              <p className="mt-1 leading-5 text-[var(--tge-text-primary)]">
                {module.sourceBasis}
              </p>
            </div>
            <div className="md:col-span-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
                Primary measures
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {module.primaryMeasures.map((measure) => (
                  <span
                    key={measure}
                    className="inline-flex min-h-[24px] items-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-2 text-xs font-semibold text-[var(--tge-governance-neutral-text)]"
                  >
                    {measure}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {children ? (
          <div className="border-t border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-8 py-5">
            {children}
          </div>
        ) : null}
      </section>
    </>
  );
}
