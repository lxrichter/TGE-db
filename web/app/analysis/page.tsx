import Link from "next/link";

import {
  analysisModules,
  analysisModulesByStatus,
  analysisStatusDescriptions,
  analysisStatusLabels,
  type AnalysisModule,
  type AnalysisModuleStatus,
} from "@/lib/analysis/modules";

const statusTone: Record<AnalysisModuleStatus, string> = {
  live: "border-[#b9d98b] bg-[#f1f8e8] text-[#3f6f19]",
  definition_next: "border-amber-200 bg-amber-50 text-amber-800",
  planned: "border-gray-200 bg-[#f7f7f7] text-gray-600",
};

function formatCount(value: number) {
  return value.toLocaleString();
}

function ModuleCard({ module }: { module: AnalysisModule }) {
  const isLive = module.status === "live" && module.href;
  const cardContent = (
    <>
      <div className="flex flex-col gap-3 border-b border-gray-200 bg-[#f7f7f7] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {module.category.replaceAll("_", " ")}
          </div>
          <h3 className="mt-1 text-lg font-semibold text-[#1f2937]">
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
        <p className="text-[13px] leading-6 text-gray-600">
          {module.description}
        </p>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Source basis
          </div>
          <p className="mt-1 text-[13px] leading-5 text-[#1f2937]">
            {module.sourceBasis}
          </p>
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Primary measures
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {module.primaryMeasures.map((measure) => (
              <span
                key={measure}
                className="inline-flex min-h-[24px] items-center border border-gray-200 bg-[#fafafa] px-2 text-xs font-semibold text-gray-700"
              >
                {measure}
              </span>
            ))}
          </div>
        </div>

        {module.nextDefinition ? (
          <div className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
            {module.nextDefinition}
          </div>
        ) : null}

        {module.definitionQuestions?.length || module.dataPrerequisites?.length ? (
          <details className="border border-gray-200 bg-[#fafafa] px-3 py-2 text-xs text-gray-700">
            <summary className="cursor-pointer font-semibold text-[#1f2937]">
              Definition checklist
            </summary>

            {module.definitionQuestions?.length ? (
              <div className="mt-3">
                <div className="font-semibold uppercase tracking-wide text-gray-500">
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
                <div className="font-semibold uppercase tracking-wide text-gray-500">
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
          className={`text-sm font-semibold ${
            isLive ? "text-[#4f7f1f]" : "text-gray-400"
          }`}
        >
          {isLive ? "Open analysis" : analysisStatusDescriptions[module.status]}
        </div>
      </div>
    </>
  );

  if (isLive) {
    return (
      <Link
        href={module.href!}
        className="block border border-gray-200 bg-white transition hover:border-[#8dc63f] hover:shadow-sm"
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <article className="block border border-gray-200 bg-white">
      {cardContent}
    </article>
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
    <div className="grid grid-cols-1 gap-3 text-sm text-gray-700 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="border border-gray-200 bg-white px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {card.label}
          </div>
          <div className="mt-1 text-2xl font-bold text-[#1f2937]">
            {typeof card.value === "number" ? formatCount(card.value) : card.value}
          </div>
          <div className="mt-1 text-xs text-gray-500">{card.note}</div>
        </div>
      ))}
    </div>
  );
}

export default function AnalysisPage() {
  const liveModules = analysisModulesByStatus("live");
  const definitionNextModules = analysisModulesByStatus("definition_next");
  const plannedModules = analysisModulesByStatus("planned");

  return (
    <main className="space-y-6">
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-6 py-6">
          <div className="max-w-5xl">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
              Analysis
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-[#1f2937] xl:text-5xl">
              Analysis Workspace
            </h1>
            <p className="mt-3 max-w-5xl text-base leading-7 text-gray-600">
              Derived intelligence views built from the geothermal plants,
              projects, companies, and relationship tables. This workspace now
              acts as the registry for live analysis pages and the backlog for
              future benchmark modules.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-[#fafafa] px-6 py-4">
          <StatusSummary />
        </div>
      </section>

      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-[#f3f4f6] px-5 py-3">
          <h2 className="text-lg font-semibold text-[#1f2937]">
            Live Analysis Modules
          </h2>
          <p className="mt-1 text-[13px] leading-5 text-gray-600">
            These pages are active and can be reviewed now. They should set the
            pattern for future analysis pages: snapshot first, benchmark tables
            second, drilldowns and supporting detail below.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-2 xl:grid-cols-3">
          {liveModules.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>
      </section>

      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-[#f3f4f6] px-5 py-3">
          <h2 className="text-lg font-semibold text-[#1f2937]">
            Next Modules To Define
          </h2>
          <p className="mt-1 text-[13px] leading-5 text-gray-600">
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

      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-[#f3f4f6] px-5 py-3">
          <h2 className="text-lg font-semibold text-[#1f2937]">
            Planned Analysis Backlog
          </h2>
          <p className="mt-1 text-[13px] leading-5 text-gray-600">
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

      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-[#f3f4f6] px-5 py-3">
          <h2 className="text-lg font-semibold text-[#1f2937]">
            Analysis Page Pattern
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 px-5 py-5 text-[13px] leading-6 text-gray-600 md:grid-cols-4">
          <div>
            <div className="font-semibold uppercase tracking-wide text-gray-500">
              1. Snapshot
            </div>
            <p className="mt-1">
              Top-line MWe, counts, coverage, and data-readiness indicators.
            </p>
          </div>
          <div>
            <div className="font-semibold uppercase tracking-wide text-gray-500">
              2. Benchmark
            </div>
            <p className="mt-1">
              Ranked tables and compact bars for market share and comparison.
            </p>
          </div>
          <div>
            <div className="font-semibold uppercase tracking-wide text-gray-500">
              3. Drilldown
            </div>
            <p className="mt-1">
              Country, region, company, plant, or project links for deeper work.
            </p>
          </div>
          <div>
            <div className="font-semibold uppercase tracking-wide text-gray-500">
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
