import Link from "next/link";

export const dynamic = "force-dynamic";

type PilotStep = {
  number: string;
  title: string;
  goal: string;
  checks: string[];
  links: Array<{
    label: string;
    href: string;
    primary?: boolean;
  }>;
};

const pilotSteps: PilotStep[] = [
  {
    number: "01",
    title: "Create Or Edit A Project",
    goal: "Confirm researchers can create or update a pipeline project without developer help.",
    checks: [
      "Required and approval-sensitive fields are clear.",
      "Changed fields are highlighted before save.",
      "Saving a changed approved/export-ready record moves it to needs_update.",
      "Readiness warnings are specific enough to act on.",
    ],
    links: [
      { label: "New Project", href: "/postgres-preview/projects/new", primary: true },
      { label: "Projects Worklist", href: "/postgres-preview/projects" },
      {
        label: "Projects Missing Source",
        href: "/postgres-preview/projects?missing=source",
      },
    ],
  },
  {
    number: "02",
    title: "Create Or Edit A Plant",
    goal: "Confirm plant records can handle power plants, direct-use plants, and missing-data workflows.",
    checks: [
      "Operating status and use type are understandable.",
      "Capacity/output fields are clear for electric and thermal records.",
      "Missing coordinates and COD/year warnings are useful.",
      "Record links to evidence, Research Ops, and relationships are visible.",
    ],
    links: [
      {
        label: "New Plant",
        href: "/postgres-preview/operating-assets/new",
        primary: true,
      },
      {
        label: "Plants Worklist",
        href: "/postgres-preview/operating-assets",
      },
      {
        label: "Plants Missing Coordinates",
        href: "/postgres-preview/operating-assets?missing=coordinates",
      },
    ],
  },
  {
    number: "03",
    title: "Create Or Edit A Company",
    goal: "Confirm company records, controlled categories, and activity links support daily research.",
    checks: [
      "Primary company type is clear and controlled.",
      "Company relationships and activity links are easy to find.",
      "Missing project/asset link warnings are actionable.",
      "Company records appear correctly in search and country summaries.",
    ],
    links: [
      { label: "New Company", href: "/postgres-preview/companies/new", primary: true },
      { label: "Companies Worklist", href: "/postgres-preview/companies" },
      {
        label: "Companies Missing Activity Link",
        href: "/postgres-preview/companies?missing=activity_link",
      },
    ],
  },
  {
    number: "04",
    title: "Add Source / Evidence",
    goal: "Confirm evidence is attached as governed source context and does not silently overwrite record fields.",
    checks: [
      "Source metadata can be created and edited.",
      "Evidence links show fact/evidence type, confidence, linked field, and notes.",
      "Source credibility actions are understandable.",
      "Related TGE article evidence remains reviewable and governed.",
    ],
    links: [
      { label: "New Source", href: "/sources/new", primary: true },
      { label: "Sources", href: "/sources" },
      { label: "Article Matches", href: "/sources/matches" },
      { label: "Fact Candidates", href: "/sources/facts" },
    ],
  },
  {
    number: "05",
    title: "Run Research Ops Review",
    goal: "Confirm the operational work loop points users to real missing data, validation, source, duplicate, and assignment work.",
    checks: [
      "Queue cards and deep table filters point to useful worklists.",
      "Persistent human-created issues are distinct from generated queues.",
      "Assignment, severity, linked field, and export blockers are clear.",
      "Recent activity and changed-field review support editor decisions.",
    ],
    links: [
      {
        label: "Research Ops",
        href: "/postgres-preview/research-ops",
        primary: true,
      },
      {
        label: "Replacement Readiness",
        href: "/postgres-preview/readiness",
      },
    ],
  },
  {
    number: "06",
    title: "Verify Outputs",
    goal: "Confirm records become findable, filterable, mappable, analyzable, and exportable after edits.",
    checks: [
      "Global search finds the changed record.",
      "Filtered entity tables reflect the changed status and issue badges.",
      "Country/market, map, and analysis previews update from PostgreSQL.",
      "CSV exports reflect the active filtered view.",
    ],
    links: [
      { label: "Global Search", href: "/search", primary: true },
      { label: "Countries / Markets", href: "/postgres-preview/countries" },
      { label: "Map Preview", href: "/postgres-preview/map" },
      { label: "Analysis Preview", href: "/postgres-preview/analysis" },
    ],
  },
];

function StepCard({ step }: { step: PilotStep }) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-[#f7f7f7] px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8dc63f]">
              Pilot Step {step.number}
            </div>
            <h2 className="mt-1 text-lg font-bold text-[#1f2937]">
              {step.title}
            </h2>
          </div>
          <span className="inline-flex h-7 items-center border border-gray-200 bg-white px-2 text-xs font-semibold text-gray-600">
            Manual acceptance
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-gray-600">{step.goal}</p>
      </div>
      <div className="grid gap-4 px-5 py-5 lg:grid-cols-[1fr_280px]">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Check During Review
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-gray-700">
            {step.checks.map((check) => (
              <li key={check} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[#8dc63f]" />
                <span>{check}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Open
          </h3>
          <div className="mt-3 flex flex-col gap-2">
            {step.links.map((link) => (
              <Link
                className={`inline-flex h-10 items-center justify-center border px-4 text-sm font-semibold ${
                  link.primary
                    ? "border-[#8dc63f] bg-[#8dc63f] text-white hover:bg-[#78ad35]"
                    : "border-gray-300 bg-white text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                }`}
                href={link.href}
                key={`${link.href}-${link.label}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PostgresPilotWorkflowPage() {
  return (
    <main className="space-y-8">
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-8 py-8">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
            PostgreSQL Staging
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-[#1f2937]">
                Pilot Workflow Acceptance
              </h1>
              <p className="mt-4 max-w-4xl text-base leading-7 text-gray-600">
                Guided internal-use test for deciding whether the PostgreSQL
                platform is ready for controlled data filling and, later,
                replacement of the current internal database site.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                href="/postgres-preview"
              >
                Back to Preview
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                href="/postgres-preview/readiness"
              >
                Replacement Readiness
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-[#f7f7f7] px-8 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-700">
            <span className="font-semibold uppercase tracking-wide text-gray-500">
              Pilot Scope
            </span>
            <span>
              <span className="font-medium text-[#1f2937]">Goal</span>
              <span className="mx-2 text-gray-300">|</span>
              Complete one realistic project, plant, and company workflow
            </span>
            <span>
              <span className="font-medium text-[#1f2937]">Output</span>
              <span className="mx-2 text-gray-300">|</span>
              Acceptance notes and blockers for the next build pass
            </span>
          </div>
        </div>
      </section>

      <section className="border border-amber-200 bg-amber-50 px-5 py-5">
        <h2 className="text-lg font-bold text-amber-900">
          Recommended Pilot Rule
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-amber-900">
          Use a small real-world sample first, for example one country or a
          known project/plant/company cluster. The point is not volume yet; the
          point is proving that a researcher and editor can complete the full
          loop without developer help.
        </p>
      </section>

      <div className="space-y-5">
        {pilotSteps.map((step) => (
          <StepCard key={step.number} step={step} />
        ))}
      </div>
    </main>
  );
}
