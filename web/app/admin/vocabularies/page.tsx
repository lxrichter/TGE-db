import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import VocabularyManagementPanel from "@/components/admin/vocabulary-management-panel";
import { authOptions } from "@/lib/auth/auth";
import { canManageVocabularies } from "@/lib/auth/roles";
import { listVocabularyGroups } from "@/lib/services/admin-vocabularies";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

      <VocabularyManagementPanel initialGroups={groups} />
    </main>
  );
}
