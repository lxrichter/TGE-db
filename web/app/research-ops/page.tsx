"use client";

import ActionButton from "@/components/ui/ActionButton";
import { useSession } from "next-auth/react";
import { canEdit, type UserRole } from "@/lib/auth/roles";

export default function ResearchOpsPage() {
  const { data: session } = useSession();
  const currentRole = ((session?.user as { role?: UserRole } | undefined)?.role ??
    null) as UserRole | null;

  const userCanAccessResearchOps = canEdit(currentRole);

  if (!userCanAccessResearchOps) {
    return (
      <main className="space-y-8">
        <section className="border border-gray-200 bg-white">
          <div className="border-l-4 border-l-red-500 px-8 py-8">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-red-600">
              Research Ops
            </p>
            <h1 className="mt-3 text-5xl font-bold tracking-tight text-[#1f2937]">
              Access Restricted
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-gray-600">
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
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-8 py-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
                Research Ops
              </p>
              <h1 className="mt-3 text-5xl font-bold tracking-tight text-[#1f2937]">
                Research Operations Dashboard
              </h1>
              <p className="mt-4 max-w-4xl text-lg leading-8 text-gray-600">
                Internal operational center for managing research priorities,
                data gaps, approval queues, and editor workflows across
                projects, plants, and companies.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-[#f7f7f7] px-8 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Projects
              </div>
              <div className="mt-1 text-sm font-medium text-[#1f2937]">
                Missing data, pending review, and project research queues
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Plants
              </div>
              <div className="mt-1 text-sm font-medium text-[#1f2937]">
                Operational data gaps, validation, and plant-focused workflows
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Companies
              </div>
              <div className="mt-1 text-sm font-medium text-[#1f2937]">
                Classification gaps, review tracking, and research tasks
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-bold text-[#1f2937]">Projects</h2>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            Operational queue for missing project data, promoted-project tracking,
            and approval workflow.
          </p>

          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Tracks
            </div>
            <p className="mt-2 text-sm leading-6 text-gray-600">
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

        <div className="border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-bold text-[#1f2937]">Plants</h2>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            Operational queue for missing plant data, promoted-from-project tracking,
            and approval workflow.
          </p>

          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Tracks
            </div>
            <p className="mt-2 text-sm leading-6 text-gray-600">
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

        <div className="border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-bold text-[#1f2937]">Companies</h2>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            Operational queue for company data gaps, relationship completeness,
            and approval workflow.
          </p>

          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Tracks
            </div>
            <p className="mt-2 text-sm leading-6 text-gray-600">
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

      <section className="border border-dashed border-gray-300 bg-[#fafafa] px-8 py-6">
        <h2 className="text-xl font-bold text-[#1f2937]">
          Planned Next Step
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-gray-600">
          Build entity-specific research management views including missing-data
          filters, editor assignments, approval queues, and manager-level
          dashboards for projects, plants, and companies.
        </p>
      </section>
    </main>
  );
}