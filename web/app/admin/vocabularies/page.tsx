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
      ? "border-[#b7df72] bg-[#eef8dc]"
      : tone === "governance"
        ? "border-[#d7e8bf] bg-[#f5faef]"
        : "border-gray-200 bg-white";

  return (
    <div className={`border px-4 py-3 ${toneClass}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-[#1f2937]">
        {formatCount(value)}
      </div>
      <div className="mt-1 text-xs leading-5 text-gray-500">{note}</div>
    </div>
  );
}

function GovernanceNote({ title, text }: { title: string; text: string }) {
  return (
    <div className="border border-gray-200 bg-[#fafafa] px-4 py-3">
      <div className="text-sm font-bold text-[#1f2937]">{title}</div>
      <div className="mt-1 text-xs leading-5 text-gray-600">{text}</div>
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
          className="inline-flex items-center gap-2 text-[15px] font-medium text-[#8dc63f] transition hover:opacity-80"
        >
          <span aria-hidden="true">←</span>
          <span>Back to admin</span>
        </Link>
      </div>

      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-8 py-8">
          <div className="max-w-4xl">
            <div className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
              Admin
            </div>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#1f2937]">
              Controlled Vocabularies
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-gray-600">
              Manage selected PostgreSQL reference terms for entity forms,
              evidence/source workflows, Research Ops, and article fact review.
              Codes are stable identifiers; labels, descriptions, sort order,
              and active state can evolve through Admin governance.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-[#f7f7f7] px-8 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-700">
            <span className="font-semibold uppercase tracking-wide text-gray-500">
              Scope
            </span>
            <span>Taxonomy</span>
            <span className="text-gray-300">|</span>
            <span>Review States</span>
            <span className="text-gray-300">|</span>
            <span>Evidence Types</span>
            <span className="text-gray-300">|</span>
            <span>Research Ops Terms</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="border border-gray-200 bg-white">
          <div className="border-b border-gray-200 bg-[#f7f7f7] px-5 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[#6b8f2a]">
              Vocabulary Governance
            </div>
            <h2 className="mt-1 text-lg font-bold text-[#1f2937]">
              Controlled Term Snapshot
            </h2>
            <p className="mt-1 text-sm text-gray-500">
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

        <section className="border border-gray-200 bg-white">
          <div className="border-b border-gray-200 bg-[#f7f7f7] px-5 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[#6b8f2a]">
              Design Readiness
            </div>
            <h2 className="mt-1 text-lg font-bold text-[#1f2937]">
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
