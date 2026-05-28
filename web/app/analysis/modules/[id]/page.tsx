import Link from "next/link";
import { notFound } from "next/navigation";

import {
  analysisCategoryLabels,
  analysisDefinitionProtocol,
  analysisModules,
  analysisStatusDescriptions,
  analysisStatusLabels,
  getAnalysisModule,
  type AnalysisModuleStatus,
} from "@/lib/analysis/modules";

const statusTone: Record<AnalysisModuleStatus, string> = {
  live: "border-[#b9d98b] bg-[#f1f8e8] text-[#3f6f19]",
  definition_next: "border-amber-200 bg-amber-50 text-amber-800",
  planned: "border-gray-200 bg-[#f7f7f7] text-gray-600",
};

function DetailPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-[#f3f4f6] px-5 py-3">
        <h2 className="text-lg font-semibold text-[#1f2937]">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function DetailList({ items }: { items?: string[] }) {
  if (!items?.length) {
    return (
      <div className="border border-gray-200 bg-[#fafafa] px-4 py-3 text-sm text-gray-500">
        No specific items defined yet.
      </div>
    );
  }

  return (
    <ul className="space-y-2 text-sm leading-6 text-gray-600">
      {items.map((item) => (
        <li key={item} className="border border-gray-200 bg-[#fafafa] px-4 py-3">
          {item}
        </li>
      ))}
    </ul>
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
          className="text-sm font-semibold text-[#8dc63f] hover:underline"
        >
          ← Back to Analysis Workspace
        </Link>
      </div>

      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-6 py-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-5xl">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
                  Analysis Definition
                </p>
                <span
                  className={`inline-flex min-h-[24px] items-center border px-2 text-xs font-semibold ${statusTone[module.status]}`}
                >
                  {analysisStatusLabels[module.status]}
                </span>
              </div>

              <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#1f2937] xl:text-5xl">
                {module.title}
              </h1>
              <p className="mt-4 max-w-5xl text-base leading-7 text-gray-600">
                {module.description}
              </p>
            </div>

            {module.href ? (
              <Link
                href={module.href}
                className="inline-flex min-h-[38px] w-fit items-center border border-[#8dc63f] bg-[#8dc63f] px-4 text-sm font-semibold text-white transition hover:bg-[#7ab52f]"
              >
                Open Live Analysis
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 border-t border-gray-200 bg-[#fafafa] md:grid-cols-3">
          <div className="border-b border-gray-200 px-5 py-4 md:border-b-0 md:border-r">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Domain
            </div>
            <div className="mt-1 text-sm font-bold text-[#1f2937]">
              {analysisCategoryLabels[module.category]}
            </div>
          </div>
          <div className="border-b border-gray-200 px-5 py-4 md:border-b-0 md:border-r">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Status Meaning
            </div>
            <div className="mt-1 text-sm font-bold text-[#1f2937]">
              {analysisStatusDescriptions[module.status]}
            </div>
          </div>
          <div className="px-5 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Source Basis
            </div>
            <div className="mt-1 text-sm font-bold text-[#1f2937]">
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
                className="inline-flex min-h-[28px] items-center border border-gray-200 bg-[#fafafa] px-3 text-xs font-semibold text-gray-700"
              >
                {measure}
              </span>
            ))}
          </div>
          {module.nextDefinition ? (
            <div className="mt-4 border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              {module.nextDefinition}
            </div>
          ) : null}
        </DetailPanel>

        <DetailPanel title="Release Logic">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="border border-gray-200 bg-[#fafafa] px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Definition
              </div>
              <div className="mt-1 text-sm font-bold text-[#1f2937]">
                Scope and measures confirmed
              </div>
            </div>
            <div className="border border-gray-200 bg-[#fafafa] px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Data
              </div>
              <div className="mt-1 text-sm font-bold text-[#1f2937]">
                Source fields and joins validated
              </div>
            </div>
            <div className="border border-gray-200 bg-[#fafafa] px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Governance
              </div>
              <div className="mt-1 text-sm font-bold text-[#1f2937]">
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

      <DetailPanel title="Standard Definition Protocol">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {analysisDefinitionProtocol.map((item) => (
            <div key={item.step} className="border border-gray-200 bg-[#fafafa] p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center border border-[#b9d98b] bg-[#f1f8e8] text-sm font-bold text-[#3f6f19]">
                  {item.step}
                </div>
                <h3 className="text-sm font-bold text-[#1f2937]">{item.title}</h3>
              </div>
              <p className="mt-3 text-xs leading-5 text-gray-600">
                {item.description}
              </p>
              <div className="mt-3 border-t border-gray-200 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                {item.output}
              </div>
            </div>
          ))}
        </div>
      </DetailPanel>
    </main>
  );
}
