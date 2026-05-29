"use client";

import ActionButton from "@/components/ui/ActionButton";
import { useSession } from "next-auth/react";
import { canEdit, type UserRole } from "@/lib/auth/roles";

const researchOpsHomeClass = {
  panel:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]",
  hero: "px-6 py-4 xl:px-8",
  dangerHero:
    "px-6 py-4 xl:px-8",
  strip:
    "border-t border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-6 py-3.5 xl:px-8",
  title: "text-[var(--tge-text-primary)]",
  body: "text-[var(--tge-text-secondary)]",
  muted: "text-[var(--tge-governance-muted-text)]",
  kicker:
    "text-xs font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]",
  dangerKicker:
    "text-xs font-semibold uppercase tracking-[0.08em] text-[var(--tge-governance-danger-text)]",
  card:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-5 py-4",
  cardDivider:
    "mt-3 border-t border-[var(--tge-governance-neutral-border)] pt-3",
  subtlePanel:
    "border border-dashed border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-5 py-4",
  label:
    "text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]",
};

const workAreas = [
  {
    label: "Projects",
    title: "Project Queues",
    description:
      "Missing coordinates, MWe, sources, owner/operator fields, promoted records, and pending review.",
    href: "/research-ops/projects",
    action: "Open Projects Ops",
  },
  {
    label: "Plants",
    title: "Plant Queues",
    description:
      "Operational data gaps, source coverage, approval state, and promoted-from-project follow-up.",
    href: "/research-ops/plants",
    action: "Open Plants Ops",
  },
  {
    label: "Companies",
    title: "Company Queues",
    description:
      "Classification gaps, missing countries, relationship coverage, source gaps, and approval state.",
    href: "/research-ops/companies",
    action: "Open Companies Ops",
  },
];

const evidenceAreas = [
  {
    label: "Sources",
    title: "Evidence Backbone",
    description: "Governed source records, credibility review, visibility, and source-to-entity links.",
    href: "/sources",
    action: "Open Sources",
  },
  {
    label: "Matches",
    title: "Article Match Review",
    description: "Review article/entity match candidates before they become evidence links.",
    href: "/sources/matches",
    action: "Review Matches",
  },
  {
    label: "Facts",
    title: "Article Fact Review",
    description: "Review extracted fact candidates before they inform field suggestions.",
    href: "/sources/facts",
    action: "Review Facts",
  },
];

function WorkAreaCard({
  label,
  title,
  description,
  href,
  action,
}: {
  label: string;
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className={researchOpsHomeClass.card}>
      <div className={researchOpsHomeClass.label}>{label}</div>
      <h2 className={`mt-1 text-lg font-bold ${researchOpsHomeClass.title}`}>
        {title}
      </h2>
      <p className={`mt-2 text-sm leading-6 ${researchOpsHomeClass.body}`}>
        {description}
      </p>
      <div className="mt-4">
        <ActionButton href={href} variant="primary">
          {action}
        </ActionButton>
      </div>
    </div>
  );
}

function SignalMetric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div>
      <div className={researchOpsHomeClass.label}>{label}</div>
      <div className={`mt-0.5 text-xl font-bold ${researchOpsHomeClass.title}`}>
        {value}
      </div>
      <div className={`mt-1 text-xs ${researchOpsHomeClass.muted}`}>{note}</div>
    </div>
  );
}

export default function ResearchOpsPage() {
  const { data: session } = useSession();
  const currentRole = ((session?.user as { role?: UserRole } | undefined)?.role ??
    null) as UserRole | null;

  const userCanAccessResearchOps = canEdit(currentRole);

  if (!userCanAccessResearchOps) {
    return (
      <main className="space-y-7">
        <section className={researchOpsHomeClass.panel}>
          <div className={researchOpsHomeClass.dangerHero}>
            <p className={researchOpsHomeClass.dangerKicker}>
              Research Ops
            </p>
            <h1 className={`mt-2 text-2xl font-bold tracking-tight ${researchOpsHomeClass.title} xl:text-[2.2rem]`}>
              Access Restricted
            </h1>
            <p className={`mt-2 max-w-3xl text-base leading-7 ${researchOpsHomeClass.body}`}>
              Research Ops is available only to editors and administrators.
            </p>

            <div className="mt-6">
              <ActionButton href="/projects" variant="secondary">
                Back to Projects
              </ActionButton>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-7">
      <section className={researchOpsHomeClass.panel}>
        <div className={researchOpsHomeClass.hero}>
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className={researchOpsHomeClass.kicker}>
                Research Ops
              </p>
              <h1 className={`mt-2 text-2xl font-bold tracking-tight ${researchOpsHomeClass.title} xl:text-[2.2rem]`}>
                Research Operations
              </h1>
              <p className={`mt-2 max-w-4xl text-base leading-7 ${researchOpsHomeClass.body}`}>
                Internal command layer for data gaps, evidence review, approval
                queues, and editor workflows across the geothermal intelligence
                platform.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 xl:justify-end">
              <ActionButton href="/sources/facts" variant="secondary">
                Fact Review
              </ActionButton>
              <ActionButton href="/sources/matches" variant="secondary">
                Match Review
              </ActionButton>
            </div>
          </div>
        </div>

        <div className={researchOpsHomeClass.strip}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 xl:grid-cols-4">
            <SignalMetric
              label="Entity Worklists"
              value="3"
              note="Projects, plants, companies"
            />
            <SignalMetric
              label="Evidence Queues"
              value="3"
              note="Sources, matches, facts"
            />
            <SignalMetric
              label="Primary Users"
              value="Editors"
              note="Researchers and admins"
            />
            <SignalMetric
              label="Mode"
              value="Internal"
              note="Governance and review"
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <div className={researchOpsHomeClass.label}>Entity Worklists</div>
          <h2 className={`mt-1 text-xl font-bold ${researchOpsHomeClass.title}`}>
            Data Quality Queues
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {workAreas.map((area) => (
            <WorkAreaCard key={area.href} {...area} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <div className={researchOpsHomeClass.label}>Evidence Workflows</div>
          <h2 className={`mt-1 text-xl font-bold ${researchOpsHomeClass.title}`}>
            Review Queues
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {evidenceAreas.map((area) => (
            <WorkAreaCard key={area.href} {...area} />
          ))}
        </div>
      </section>

      <section className={researchOpsHomeClass.subtlePanel}>
        <div className="grid gap-3 xl:grid-cols-[220px_minmax(0,1fr)] xl:items-center">
          <h2 className={`text-lg font-bold ${researchOpsHomeClass.title}`}>
            Operating Principle
          </h2>
          <p className={`max-w-5xl text-sm leading-6 ${researchOpsHomeClass.body}`}>
            Research Ops routes people into work. Entity pages remain the
            structured records; Sources remain the evidence backbone; review
            queues remain moderation surfaces.
          </p>
        </div>
      </section>
    </main>
  );
}
