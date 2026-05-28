import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import VocabularyManagementPanel from "@/components/admin/vocabulary-management-panel";
import { authOptions } from "@/lib/auth/auth";
import { canManageVocabularies } from "@/lib/auth/roles";
import { listVocabularyGroups } from "@/lib/services/admin-vocabularies";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatCount(value: number) {
  return value.toLocaleString();
}

function VocabularyMetric({
  label,
  value,
  note,
  tone = "default",
}: {
  label: string;
  value: number;
  note: string;
  tone?: "default" | "active" | "governance";
}) {
  const toneClass =
    tone === "active"
      ? "border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)]"
      : tone === "governance"
        ? "border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)]"
        : "border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]";

  return (
    <div className={`border px-4 py-3 ${toneClass}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-[var(--tge-text-primary)]">
        {formatCount(value)}
      </div>
      <div className="mt-1 text-xs leading-5 text-[var(--tge-governance-muted-text)]">
        {note}
      </div>
    </div>
  );
}

function GovernanceNote({ title, text }: { title: string; text: string }) {
  return (
    <div className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-4 py-3">
      <div className="text-sm font-bold text-[var(--tge-text-primary)]">
        {title}
      </div>
      <div className="mt-1 text-xs leading-5 text-[var(--tge-text-secondary)]">
        {text}
      </div>
    </div>
  );
}

export default async function AdminVocabulariesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as { role?: string | null }).role;

  if (!canManageVocabularies(role)) {
    redirect("/");
  }

  const groups = await listVocabularyGroups();
  const totalTerms = groups.reduce((sum, group) => sum + group.items.length, 0);
  const activeTerms = groups.reduce(
    (sum, group) => sum + group.items.filter((item) => item.is_active).length,
    0
  );
  const inactiveTerms = totalTerms - activeTerms;
  const metadataGroups = groups.filter(
    (group) => group.metadataColumns.length > 0
  ).length;

  return (
    <main className="space-y-6">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-[15px] font-medium text-[var(--tge-brand-green)] transition hover:text-[var(--tge-brand-green-dark)]"
        >
          <span aria-hidden="true">←</span>
          <span>Back to admin</span>
        </Link>
      </div>

      <section className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]">
        <div className="border-l-4 border-l-[var(--tge-brand-green)] px-8 py-8">
          <div className="max-w-4xl">
            <div className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]">
              Admin
            </div>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-[var(--tge-text-primary)]">
              Controlled Vocabularies
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--tge-text-secondary)]">
              Manage selected PostgreSQL reference terms for entity forms,
              evidence/source workflows, Research Ops, and article fact review.
              Codes are stable identifiers; labels, descriptions, sort order,
              and active state can evolve through Admin governance.
            </p>
          </div>
        </div>

        <div className="border-t border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-8 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--tge-governance-neutral-text)]">
            <span className="font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
              Scope
            </span>
            <span>Taxonomy</span>
            <span className="text-[var(--tge-governance-muted-border)]">|</span>
            <span>Review States</span>
            <span className="text-[var(--tge-governance-muted-border)]">|</span>
            <span>Evidence Types</span>
            <span className="text-[var(--tge-governance-muted-border)]">|</span>
            <span>Research Ops Terms</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]">
          <div className="border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-5 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-success-text)]">
              Vocabulary Governance
            </div>
            <h2 className="mt-1 text-lg font-bold text-[var(--tge-text-primary)]">
              Controlled Term Snapshot
            </h2>
            <p className="mt-1 text-sm text-[var(--tge-governance-muted-text)]">
              These terms feed forms, filters, badges, review states, source
              governance, Research Ops queues, and later design-system color
              semantics.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
            <VocabularyMetric
              label="Groups"
              value={groups.length}
              note="Governed term sets"
              tone="governance"
            />
            <VocabularyMetric
              label="Active Terms"
              value={activeTerms}
              note="Available in workflows"
              tone="active"
            />
            <VocabularyMetric
              label="Inactive Terms"
              value={inactiveTerms}
              note="Retained but hidden"
            />
            <VocabularyMetric
              label="Metadata Groups"
              value={metadataGroups}
              note="Terms with workflow flags"
              tone="governance"
            />
          </div>
        </section>

        <section className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]">
          <div className="border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-5 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-success-text)]">
              Design Readiness
            </div>
            <h2 className="mt-1 text-lg font-bold text-[var(--tge-text-primary)]">
              Badge And Status Semantics
            </h2>
          </div>
          <div className="space-y-3 p-4">
            <GovernanceNote
              title="Stable codes, flexible labels"
              text="Codes remain stable for data and URLs; labels can be refined through design and editorial terminology work."
            />
            <GovernanceNote
              title="Colors follow meaning"
              text="The design phase should map phase, status, evidence, severity, and confidence colors to these controlled terms."
            />
            <GovernanceNote
              title="Inactive does not delete history"
              text="Deactivated terms remain available for historical interpretation while disappearing from active workflows."
            />
          </div>
        </section>
      </section>

      <VocabularyManagementPanel initialGroups={groups} />
    </main>
  );
}
