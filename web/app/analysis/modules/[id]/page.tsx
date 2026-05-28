import Link from "next/link";
import { notFound } from "next/navigation";

import {
  analysisCategoryLabels,
  analysisDefinitionProtocol,
  analysisGovernanceQaCategories,
  analysisModules,
  analysisStatusDescriptions,
  analysisStatusLabels,
  getAnalysisModule,
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

function DetailPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={panelClass}>
      <div className={`${panelHeaderClass} px-5 py-3`}>
        <h2 className={`text-lg font-semibold ${titleTextClass}`}>{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function DetailList({ items }: { items?: string[] }) {
  if (!items?.length) {
    return (
      <div className={`${subtleCardClass} px-4 py-3 text-sm text-[var(--tge-governance-muted-text)]`}>
        No specific items defined yet.
      </div>
    );
  }

  return (
    <ul className={`space-y-2 text-sm leading-6 ${bodyTextClass}`}>
      {items.map((item) => (
        <li key={item} className={`${subtleCardClass} px-4 py-3`}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function GovernanceQaChecklist() {
  return (
    <section className="border border-[var(--tge-governance-attention-border)] bg-[var(--tge-surface-card)]">
      <div className="border-b border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] px-5 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-attention-text)]">
          Governance QA
        </div>
        <h2 className={`mt-1 text-lg font-semibold ${titleTextClass}`}>
          QA Checks To Define
        </h2>
        <p className="mt-1 text-[13px] leading-5 text-[var(--tge-governance-attention-text)]">
          Confirm which quality warnings this module must expose before it is
          treated as market-grade analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
        {analysisGovernanceQaCategories.map((category) => (
          <div
            key={category.title}
            className={`${subtleCardClass} p-4`}
          >
            <h3 className={`text-sm font-bold ${titleTextClass}`}>
              {category.title}
            </h3>
            <p className={`mt-2 text-[13px] leading-5 ${bodyTextClass}`}>
              {category.description}
            </p>
            <ul className="mt-3 space-y-1.5 text-xs leading-5 text-[var(--tge-governance-muted-text)]">
              {category.examples.map((example) => (
                <li key={example}>{example}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export function generateStaticParams() {
  return analysisModules.map((module) => ({ id: module.id }));
}

export default async function AnalysisModuleDefinitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const module = getAnalysisModule(id);

  if (!module) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <div>
        <Link
          href="/analysis"
          className="text-sm font-semibold text-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)] hover:underline"
        >
          ← Back to Analysis Workspace
        </Link>
      </div>

      <section className={panelClass}>
        <div className="border-l-4 border-l-[var(--tge-brand-green)] px-6 py-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-5xl">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]">
                  Analysis Definition
                </p>
                <span
                  className={`inline-flex min-h-[24px] items-center border px-2 text-xs font-semibold ${statusTone[module.status]}`}
                >
                  {analysisStatusLabels[module.status]}
                </span>
              </div>

              <h1 className={`mt-3 text-4xl font-bold tracking-tight xl:text-5xl ${titleTextClass}`}>
                {module.title}
              </h1>
              <p className={`mt-4 max-w-5xl text-base leading-7 ${bodyTextClass}`}>
                {module.description}
              </p>
            </div>

            {module.href ? (
              <Link
                href={module.href}
                className="inline-flex min-h-[38px] w-fit items-center border border-[var(--tge-brand-green)] bg-[var(--tge-brand-green)] px-4 text-sm font-semibold text-[var(--tge-surface-card)] transition hover:bg-[var(--tge-brand-green-dark)]"
              >
                Open Live Analysis
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 border-t border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] md:grid-cols-3">
          <div className="border-b border-[var(--tge-governance-neutral-border)] px-5 py-4 md:border-b-0 md:border-r">
            <div className={eyebrowClass}>
              Domain
            </div>
            <div className={`mt-1 text-sm font-bold ${titleTextClass}`}>
              {analysisCategoryLabels[module.category]}
            </div>
          </div>
          <div className="border-b border-[var(--tge-governance-neutral-border)] px-5 py-4 md:border-b-0 md:border-r">
            <div className={eyebrowClass}>
              Status Meaning
            </div>
            <div className={`mt-1 text-sm font-bold ${titleTextClass}`}>
              {analysisStatusDescriptions[module.status]}
            </div>
          </div>
          <div className="px-5 py-4">
            <div className={eyebrowClass}>
              Source Basis
            </div>
            <div className={`mt-1 text-sm font-bold ${titleTextClass}`}>
              {module.sourceBasis}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <DetailPanel title="Primary Measures">
          <div className="flex flex-wrap gap-2">
            {module.primaryMeasures.map((measure) => (
              <span
                key={measure}
                className="inline-flex min-h-[28px] items-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-3 text-xs font-semibold text-[var(--tge-governance-neutral-text)]"
              >
                {measure}
              </span>
            ))}
          </div>
          {module.nextDefinition ? (
            <div className="mt-4 border border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] px-4 py-3 text-sm leading-6 text-[var(--tge-governance-attention-text)]">
              {module.nextDefinition}
            </div>
          ) : null}
        </DetailPanel>

        <DetailPanel title="Release Logic">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className={`${subtleCardClass} px-4 py-3`}>
              <div className={eyebrowClass}>
                Definition
              </div>
              <div className={`mt-1 text-sm font-bold ${titleTextClass}`}>
                Scope and measures confirmed
              </div>
            </div>
            <div className={`${subtleCardClass} px-4 py-3`}>
              <div className={eyebrowClass}>
                Data
              </div>
              <div className={`mt-1 text-sm font-bold ${titleTextClass}`}>
                Source fields and joins validated
              </div>
            </div>
            <div className={`${subtleCardClass} px-4 py-3`}>
              <div className={eyebrowClass}>
                Governance
              </div>
              <div className={`mt-1 text-sm font-bold ${titleTextClass}`}>
                Evidence and warning rules visible
              </div>
            </div>
          </div>
        </DetailPanel>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <DetailPanel title="Questions To Resolve">
          <DetailList items={module.definitionQuestions} />
        </DetailPanel>

        <DetailPanel title="Data Prerequisites">
          <DetailList items={module.dataPrerequisites} />
        </DetailPanel>
      </div>

      <GovernanceQaChecklist />

      <DetailPanel title="Standard Definition Protocol">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {analysisDefinitionProtocol.map((item) => (
            <div key={item.step} className={`${subtleCardClass} p-4`}>
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center border border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] text-sm font-bold text-[var(--tge-governance-success-text)]">
                  {item.step}
                </div>
                <h3 className={`text-sm font-bold ${titleTextClass}`}>
                  {item.title}
                </h3>
              </div>
              <p className={`mt-3 text-xs leading-5 ${bodyTextClass}`}>
                {item.description}
              </p>
              <div className="mt-3 border-t border-[var(--tge-governance-neutral-border)] pt-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
                {item.output}
              </div>
            </div>
          ))}
        </div>
      </DetailPanel>
    </main>
  );
}
