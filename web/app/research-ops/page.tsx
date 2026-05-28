"use client";

import ActionButton from "@/components/ui/ActionButton";
import { useSession } from "next-auth/react";
import { canEdit, type UserRole } from "@/lib/auth/roles";

const researchOpsHomeClass = {
  panel:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]",
  hero:
    "border-l-4 border-l-[var(--tge-brand-green)] px-8 py-8",
  dangerHero:
    "border-l-4 border-l-[var(--tge-governance-danger-text)] px-8 py-8",
  strip:
    "border-t border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-8 py-5",
  title: "text-[var(--tge-text-primary)]",
  body: "text-[var(--tge-text-secondary)]",
  muted: "text-[var(--tge-governance-muted-text)]",
  kicker:
    "text-sm font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]",
  dangerKicker:
    "text-sm font-semibold uppercase tracking-[0.08em] text-[var(--tge-governance-danger-text)]",
  card:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] p-6",
  cardDivider:
    "mt-4 border-t border-[var(--tge-governance-neutral-border)] pt-4",
  subtlePanel:
    "border border-dashed border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-8 py-6",
  label:
    "text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]",
};

export default function ResearchOpsPage() {
  const { data: session } = useSession();
  const currentRole = ((session?.user as { role?: UserRole } | undefined)?.role ??
    null) as UserRole | null;

  const userCanAccessResearchOps = canEdit(currentRole);

  if (!userCanAccessResearchOps) {
    return (
      <main className="space-y-8">
        <section className={researchOpsHomeClass.panel}>
          <div className={researchOpsHomeClass.dangerHero}>
            <p className={researchOpsHomeClass.dangerKicker}>
              Research Ops
            </p>
            <h1 className={`mt-3 text-5xl font-bold tracking-tight ${researchOpsHomeClass.title}`}>
              Access Restricted
            </h1>
            <p className={`mt-4 max-w-3xl text-lg leading-8 ${researchOpsHomeClass.body}`}>
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
    <main className="space-y-8">
      <section className={researchOpsHomeClass.panel}>
        <div className={researchOpsHomeClass.hero}>
          <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl">
              <p className={researchOpsHomeClass.kicker}>
                Research Ops
              </p>
              <h1 className={`mt-3 text-5xl font-bold tracking-tight ${researchOpsHomeClass.title}`}>
                Research Operations Dashboard
              </h1>
              <p className={`mt-4 max-w-4xl text-lg leading-8 ${researchOpsHomeClass.body}`}>
                Internal operational center for managing research priorities,
                data gaps, approval queues, and editor workflows across
                projects, plants, and companies.
              </p>
            </div>
          </div>
        </div>

        <div className={researchOpsHomeClass.strip}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <div className={researchOpsHomeClass.label}>
                Projects
              </div>
              <div className={`mt-1 text-sm font-medium ${researchOpsHomeClass.title}`}>
                Missing data, pending review, and project research queues
              </div>
            </div>

            <div>
              <div className={researchOpsHomeClass.label}>
                Plants
              </div>
              <div className={`mt-1 text-sm font-medium ${researchOpsHomeClass.title}`}>
                Operational data gaps, validation, and plant-focused workflows
              </div>
            </div>

            <div>
              <div className={researchOpsHomeClass.label}>
                Companies
              </div>
              <div className={`mt-1 text-sm font-medium ${researchOpsHomeClass.title}`}>
                Classification gaps, review tracking, and research tasks
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className={researchOpsHomeClass.card}>
          <h2 className={`text-xl font-bold ${researchOpsHomeClass.title}`}>Projects</h2>

          <p className={`mt-3 text-sm leading-6 ${researchOpsHomeClass.body}`}>
            Operational queue for missing project data, promoted-project tracking,
            and approval workflow.
          </p>

          <div className={researchOpsHomeClass.cardDivider}>
            <div className={researchOpsHomeClass.label}>
              Tracks
            </div>
            <p className={`mt-2 text-sm leading-6 ${researchOpsHomeClass.body}`}>
              Missing coordinates, missing MW, missing source, missing operator / owner,
              need info, pending review, and promoted projects.
            </p>
          </div>

          <div className="mt-5">
            <ActionButton href="/research-ops/projects" variant="primary">
              Open Projects Ops
            </ActionButton>
          </div>
        </div>

        <div className={researchOpsHomeClass.card}>
          <h2 className={`text-xl font-bold ${researchOpsHomeClass.title}`}>Plants</h2>

          <p className={`mt-3 text-sm leading-6 ${researchOpsHomeClass.body}`}>
            Operational queue for missing plant data, promoted-from-project tracking,
            and approval workflow.
          </p>

          <div className={researchOpsHomeClass.cardDivider}>
            <div className={researchOpsHomeClass.label}>
              Tracks
            </div>
            <p className={`mt-2 text-sm leading-6 ${researchOpsHomeClass.body}`}>
              Missing coordinates, missing MW, missing source, missing operator / owner,
              need info, pending review, and plants promoted from projects.
            </p>
          </div>

          <div className="mt-5">
            <ActionButton href="/research-ops/plants" variant="primary">
              Open Plants Ops
            </ActionButton>
          </div>
        </div>

        <div className={researchOpsHomeClass.card}>
          <h2 className={`text-xl font-bold ${researchOpsHomeClass.title}`}>Companies</h2>

          <p className={`mt-3 text-sm leading-6 ${researchOpsHomeClass.body}`}>
            Operational queue for company data gaps, relationship completeness,
            and approval workflow.
          </p>

          <div className={researchOpsHomeClass.cardDivider}>
            <div className={researchOpsHomeClass.label}>
              Tracks
            </div>
            <p className={`mt-2 text-sm leading-6 ${researchOpsHomeClass.body}`}>
              Missing primary type, missing country, missing source, no asset links,
              no relationships, need info, and pending review.
            </p>
          </div>

          <div className="mt-5">
            <ActionButton href="/research-ops/companies" variant="primary">
              Open Companies Ops
            </ActionButton>
          </div>
        </div>
      </section>

      <section className={researchOpsHomeClass.subtlePanel}>
        <h2 className={`text-xl font-bold ${researchOpsHomeClass.title}`}>
          Current Expansion Path
        </h2>
        <p className={`mt-3 max-w-4xl text-sm leading-6 ${researchOpsHomeClass.body}`}>
          Entity worklists now cover projects, plants, and companies. The next
          Research Ops layer should keep tightening review ergonomics, saved
          queue views, assignment visibility, and governance QA rather than
          adding more parallel queue surfaces.
        </p>
      </section>
    </main>
  );
}
