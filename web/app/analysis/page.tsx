import Link from "next/link";

import {
  analysisCategoryDescriptions,
  analysisCategoryLabels,
  analysisCategoryOrder,
  analysisDefinitionProtocol,
  analysisGovernanceQaCategories,
  analysisModules,
  analysisModulesByCategory,
  analysisModulesByStatus,
  analysisStatusLabels,
  analysisVisibilityDescriptions,
  analysisVisibilityLabels,
  type AnalysisModule,
  type AnalysisModuleCategory,
  type AnalysisModuleStatus,
} from "@/lib/analysis/modules";

const statusTone: Record<AnalysisModuleStatus, string> = {
  live: "border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] text-[var(--tge-governance-success-text)]",
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
const linkActionClass =
  "text-sm font-semibold text-[var(--tge-brand-green-dark)]";
const inactiveActionClass =
  "text-sm font-semibold text-[var(--tge-governance-muted-text)]";
const chipClass =
  "inline-flex min-h-[24px] items-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-2 text-xs font-semibold text-[var(--tge-governance-neutral-text)]";

function formatCount(value: number) {
  return value.toLocaleString();
}

function ModuleCard({ module }: { module: AnalysisModule }) {
  const isLive = module.status === "live" && module.href;
  const href = isLive ? module.href! : `/analysis/modules/${module.id}`;
  const cardContent = (
    <>
      <div className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between ${panelHeaderClass}`}>
        <div>
          <div className={eyebrowClass}>
            {module.category.replaceAll("_", " ")}
          </div>
          <h3 className={`mt-1 text-lg font-semibold ${titleTextClass}`}>
            {module.title}
          </h3>
        </div>
        <span
          className={`inline-flex min-h-[26px] w-fit items-center border px-2 text-xs font-semibold ${statusTone[module.status]}`}
        >
          {analysisStatusLabels[module.status]}
        </span>
      </div>

      <div className="space-y-4 px-5 py-4">
        <p className={`text-[13px] leading-6 ${bodyTextClass}`}>
          {module.description}
        </p>

        <div>
          <div className={eyebrowClass}>
            Visibility
          </div>
          <p
            className={`mt-1 text-[13px] leading-5 ${titleTextClass}`}
            title={analysisVisibilityDescriptions[module.visibility]}
          >
            {analysisVisibilityLabels[module.visibility]}
          </p>
        </div>

        <div>
          <div className={eyebrowClass}>
            Source basis
          </div>
          <p className={`mt-1 text-[13px] leading-5 ${titleTextClass}`}>
            {module.sourceBasis}
          </p>
        </div>

        <div>
          <div className={eyebrowClass}>
            Primary measures
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {module.primaryMeasures.map((measure) => (
              <span
                key={measure}
                className={chipClass}
              >
                {measure}
              </span>
            ))}
          </div>
        </div>

        {module.nextDefinition ? (
          <div className="border border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] px-3 py-2 text-xs leading-5 text-[var(--tge-governance-attention-text)]">
            {module.nextDefinition}
          </div>
        ) : null}

        {module.definitionQuestions?.length || module.dataPrerequisites?.length ? (
          <details className={`${subtleCardClass} px-3 py-2 text-xs ${bodyTextClass}`}>
            <summary className={`cursor-pointer font-semibold ${titleTextClass}`}>
              Definition checklist
            </summary>

            {module.definitionQuestions?.length ? (
              <div className="mt-3">
                <div className="font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
                  Questions to resolve
                </div>
                <ul className="mt-2 space-y-1.5">
                  {module.definitionQuestions.map((question) => (
                    <li key={question} className="leading-5">
                      {question}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {module.dataPrerequisites?.length ? (
              <div className="mt-3">
                <div className="font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
                  Data prerequisites
                </div>
                <ul className="mt-2 space-y-1.5">
                  {module.dataPrerequisites.map((prerequisite) => (
                    <li key={prerequisite} className="leading-5">
                      {prerequisite}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </details>
        ) : null}

        <div
          className={isLive ? linkActionClass : inactiveActionClass}
        >
          {isLive ? "Open analysis" : "Review module definition"}
        </div>
      </div>
    </>
  );

  return (
    <Link
      href={href}
      className="block border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] transition hover:border-[var(--tge-brand-green)] hover:shadow-sm"
    >
      {cardContent}
    </Link>
  );
}

function StatusSummary() {
  const liveCount = analysisModulesByStatus("live").length;
  const definitionCount = analysisModulesByStatus("definition_next").length;
  const plannedCount = analysisModulesByStatus("planned").length;

  const cards = [
    {
      label: "Live modules",
      value: liveCount,
      note: "Available now",
    },
    {
      label: "Define next",
      value: definitionCount,
      note: "Scope before build",
    },
    {
      label: "Planned backlog",
      value: plannedCount,
      note: "Future analysis pages",
    },
    {
      label: "Module pattern",
      value: "1",
      note: "Shared workspace registry",
    },
  ];

  return (
    <div className={`grid grid-cols-1 gap-3 text-sm ${bodyTextClass} sm:grid-cols-2 xl:grid-cols-4`}>
      {cards.map((card) => (
        <div key={card.label} className={`${panelClass} px-4 py-3`}>
          <div className={eyebrowClass}>
            {card.label}
          </div>
          <div className={`mt-1 text-2xl font-bold ${titleTextClass}`}>
            {typeof card.value === "number" ? formatCount(card.value) : card.value}
          </div>
          <div className="mt-1 text-xs text-[var(--tge-governance-muted-text)]">
            {card.note}
          </div>
        </div>
      ))}
    </div>
  );
}

function AnalysisDomainSummary() {
  return (
    <section className={panelClass}>
      <div className={`${panelHeaderClass} px-5 py-3`}>
        <h2 className={`text-lg font-semibold ${titleTextClass}`}>
          Analysis Domains
        </h2>
        <p className={`mt-1 text-[13px] leading-5 ${bodyTextClass}`}>
          Domain map for adding future analysis pages without blurring live
          analysis, definition work, and longer-term backlog.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
        {analysisCategoryOrder.map((category: AnalysisModuleCategory) => {
          const modules = analysisModulesByCategory(category);
          const liveCount = modules.filter(
            (module) => module.status === "live"
          ).length;
          const definitionCount = modules.filter(
            (module) => module.status === "definition_next"
          ).length;
          const plannedCount = modules.filter(
            (module) => module.status === "planned"
          ).length;

          return (
            <div key={category} className={`${subtleCardClass} p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={eyebrowClass}>
                    Domain
                  </div>
                  <h3 className={`mt-1 text-base font-bold ${titleTextClass}`}>
                    {analysisCategoryLabels[category]}
                  </h3>
                </div>
                <span className="inline-flex min-h-[24px] items-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-2 text-xs font-semibold text-[var(--tge-governance-neutral-text)]">
                  {modules.length} modules
                </span>
              </div>

              <p className={`mt-2 text-[13px] leading-5 ${bodyTextClass}`}>
                {analysisCategoryDescriptions[category]}
              </p>

              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="border border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] px-2 py-1.5 text-[var(--tge-governance-success-text)]">
                  <div className="font-bold">{liveCount}</div>
                  <div>Live</div>
                </div>
                <div className="border border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] px-2 py-1.5 text-[var(--tge-governance-attention-text)]">
                  <div className="font-bold">{definitionCount}</div>
                  <div>Define</div>
                </div>
                <div className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-2 py-1.5 text-[var(--tge-governance-neutral-text)]">
                  <div className="font-bold">{plannedCount}</div>
                  <div>Planned</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function AnalysisDefinitionProtocol() {
  return (
    <section className={panelClass}>
      <div className={`${panelHeaderClass} px-5 py-3`}>
        <h2 className={`text-lg font-semibold ${titleTextClass}`}>
          Module Definition Protocol
        </h2>
        <p className={`mt-1 text-[13px] leading-5 ${bodyTextClass}`}>
          Standard checklist before a future analysis module becomes a live
          page. This keeps new benchmark views consistent and avoids hidden
          weighting or source assumptions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 xl:grid-cols-5">
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
    </section>
  );
}

function AnalysisGovernanceQaPattern() {
  return (
    <section className="border border-[var(--tge-governance-attention-border)] bg-[var(--tge-surface-card)]">
      <div className="border-b border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] px-5 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-attention-text)]">
          Governance QA
        </div>
        <h2 className={`mt-1 text-lg font-semibold ${titleTextClass}`}>
          Analysis Governance Pattern
        </h2>
        <p className="mt-1 max-w-5xl text-[13px] leading-5 text-[var(--tge-governance-attention-text)]">
          Every analysis module should expose the data-quality and attribution
          gaps that could distort interpretation. This keeps the platform in
          logic-validation mode until the underlying records are strong enough
          for market-grade use.
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
            <div className="mt-3 flex flex-wrap gap-2">
              {category.examples.map((example) => (
                <span
                  key={example}
                  className="inline-flex min-h-[24px] items-center border border-[var(--tge-governance-attention-border)] bg-[var(--tge-surface-card)] px-2 text-[11px] font-semibold text-[var(--tge-governance-attention-text)]"
                >
                  {example}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AnalysisPage() {
  const liveModules = analysisModulesByStatus("live");
  const definitionNextModules = analysisModulesByStatus("definition_next");
  const plannedModules = analysisModulesByStatus("planned");

  return (
    <main className="space-y-6">
      <section className={panelClass}>
        <div className="border-l-4 border-l-[var(--tge-brand-green)] px-6 py-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-5xl">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]">
                Analysis
              </p>
              <h1 className={`mt-2 text-4xl font-bold tracking-tight ${titleTextClass} xl:text-5xl`}>
                Modular Geothermal Intelligence Analysis
              </h1>
              <p className={`mt-3 max-w-5xl text-base leading-7 ${bodyTextClass}`}>
                Derived intelligence views built from plants, projects,
                companies, relationships, and country taxonomy. Analysis pages
                should behave like reusable intelligence products: methodology
                visible, metrics clear, drilldowns available, and governance QA
                explicit where it affects confidence.
              </p>
            </div>

            <div className="grid gap-2 sm:flex sm:flex-wrap xl:justify-end">
              <Link
                href="/analysis/developers"
                className="inline-flex h-10 items-center justify-center border border-[var(--tge-brand-green)] bg-[var(--tge-brand-green)] px-4 text-sm font-semibold text-[var(--tge-text-primary)] hover:bg-[var(--tge-governance-success-bg)]"
              >
                Developer Analysis
              </Link>
              <Link
                href="/analysis/turbine-technology"
                className="inline-flex h-10 items-center justify-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-4 text-sm font-semibold text-[var(--tge-text-primary)] hover:border-[var(--tge-brand-green)]"
              >
                Turbine Technology
              </Link>
              <Link
                href="/analysis/owners-operators"
                className="inline-flex h-10 items-center justify-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-4 text-sm font-semibold text-[var(--tge-text-primary)] hover:border-[var(--tge-brand-green)]"
              >
                Owners & Operators
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-6 py-4">
          <StatusSummary />
        </div>
      </section>

      <section className={panelClass}>
        <div className={`${panelHeaderClass} px-5 py-3`}>
          <h2 className={`text-lg font-semibold ${titleTextClass}`}>
            Live Analysis Modules
          </h2>
          <p className={`mt-1 text-[13px] leading-5 ${bodyTextClass}`}>
            Active intelligence pages. These set the product pattern: snapshot
            first, MWe/MWth hierarchy, benchmark tables, drilldowns, and
            methodology context.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-2 xl:grid-cols-3">
          {liveModules.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>
      </section>

      <AnalysisDomainSummary />

      <AnalysisDefinitionProtocol />

      <AnalysisGovernanceQaPattern />

      <section className={panelClass}>
        <div className={`${panelHeaderClass} px-5 py-3`}>
          <h2 className={`text-lg font-semibold ${titleTextClass}`}>
            Next Modules To Define
          </h2>
          <p className={`mt-1 text-[13px] leading-5 ${bodyTextClass}`}>
            These should be scoped before implementation so role grouping,
            source fields, and weighting logic are clear.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-2">
          {definitionNextModules.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>
      </section>

      <section className={panelClass}>
        <div className={`${panelHeaderClass} px-5 py-3`}>
          <h2 className={`text-lg font-semibold ${titleTextClass}`}>
            Planned Analysis Backlog
          </h2>
          <p className={`mt-1 text-[13px] leading-5 ${bodyTextClass}`}>
            Future analysis pages stay visible here without becoming active
            navigation until the source data and aggregation rules are ready.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-2 xl:grid-cols-3">
          {plannedModules.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>
      </section>

      <section className={panelClass}>
        <div className={`${panelHeaderClass} px-5 py-3`}>
          <h2 className={`text-lg font-semibold ${titleTextClass}`}>
            Analysis Page Pattern
          </h2>
        </div>
        <div className={`grid grid-cols-1 gap-4 px-5 py-5 text-[13px] leading-6 ${bodyTextClass} md:grid-cols-4`}>
          <div>
            <div className="font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
              1. Snapshot
            </div>
            <p className="mt-1">
              Top-line MWe, counts, coverage, and data-readiness indicators.
            </p>
          </div>
          <div>
            <div className="font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
              2. Benchmark
            </div>
            <p className="mt-1">
              Ranked tables and compact bars for market share and comparison.
            </p>
          </div>
          <div>
            <div className="font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
              3. Drilldown
            </div>
            <p className="mt-1">
              Country, region, company, plant, or project links for deeper work.
            </p>
          </div>
          <div>
            <div className="font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
              4. Governance
            </div>
            <p className="mt-1">
              Source coverage, missing links, and normalization notes where needed.
            </p>
          </div>
        </div>
      </section>

      <div className="h-4" />
    </main>
  );
}
