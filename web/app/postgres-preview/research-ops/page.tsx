import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { canReview } from "@/lib/auth/roles";
import {
  getPostgresEntityFormReferenceData,
  getPostgresResearchOpsIssueReferenceData,
  getPostgresResearchOpsDashboard,
  type PostgresResearchOpsDashboard,
  type PostgresResearchOpsIssueReferenceData,
} from "@/lib/postgres-preview";
import { getCurrentPostgresPreviewUser } from "@/lib/postgres-preview/entity-api";
import {
  getSourceMatchCandidateSummary,
  getSourceReferenceData,
  type SourceMatchCandidateSummary,
} from "@/lib/services/sources";
import { ResearchOpsDashboardClient } from "./ResearchOpsDashboardClient";

export const dynamic = "force-dynamic";

type ResearchOpsData =
  | {
      ok: true;
      dashboard: PostgresResearchOpsDashboard;
      reviewStatuses: Array<{
        code: string;
        label: string;
        sort_order: number;
        is_active: boolean;
      }>;
      sourceStatuses: Array<{
        code: string;
        label: string;
        sort_order: number;
        is_active: boolean;
      }>;
      canReviewStatus: boolean;
      currentUser: {
        id: string;
        name: string | null;
      } | null;
      issueReferenceData: PostgresResearchOpsIssueReferenceData;
      sourceMatchSummary: SourceMatchCandidateSummary;
    }
  | {
      ok: false;
      error: string;
    };

async function getResearchOpsData(): Promise<ResearchOpsData> {
  try {
    const [
      dashboard,
      entityReferenceData,
      sourceReferenceData,
      issueReferenceData,
      sourceMatchSummary,
    ] =
      await Promise.all([
        getPostgresResearchOpsDashboard(100),
        getPostgresEntityFormReferenceData(),
        getSourceReferenceData(),
        getPostgresResearchOpsIssueReferenceData(),
        getSourceMatchCandidateSummary(),
      ]);
    const [session, currentUser] = await Promise.all([
      getServerSession(authOptions),
      getCurrentPostgresPreviewUser(),
    ]);
    const role = (session?.user as { role?: string | null } | undefined)?.role;

    return {
      ok: true,
      dashboard,
      reviewStatuses: entityReferenceData.reviewStatuses,
      sourceStatuses: sourceReferenceData.credibilityStatuses,
      canReviewStatus: canReview(role),
      currentUser: currentUser
        ? { id: currentUser.id, name: currentUser.name }
        : null,
      issueReferenceData,
      sourceMatchSummary,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: message };
  }
}

function SetupNotice({ error }: { error: string }) {
  return (
    <section className="border border-amber-200 bg-amber-50 px-5 py-5">
      <h2 className="text-lg font-bold text-amber-900">PostgreSQL Not Connected</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
        This preview reads from the Railway PostgreSQL database. Run the app
        through Railway variables or set `DATABASE_PUBLIC_URL` / `DATABASE_URL`
        locally.
      </p>
      <pre className="mt-4 overflow-x-auto bg-white px-4 py-3 text-xs text-gray-700">
        railway run --service Postgres -- npm --prefix web run dev
      </pre>
      <p className="mt-3 text-xs text-amber-900">Error: {error}</p>
    </section>
  );
}

export default async function PostgresResearchOpsPage() {
  const data = await getResearchOpsData();

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
                Research Ops Preview
              </h1>
              <p className="mt-4 max-w-4xl text-base leading-7 text-gray-600">
                Operational queues for validation, missing data, direct-use
                classification, duplicate checks, and quick review-status changes.
              </p>
            </div>
            <Link
              className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
              href="/postgres-preview"
            >
              Back to PostgreSQL Preview
            </Link>
          </div>
        </div>
      </section>

      {!data.ok ? (
        <SetupNotice error={data.error} />
      ) : (
        <ResearchOpsDashboardClient
          dashboard={data.dashboard}
          reviewStatuses={data.reviewStatuses}
          sourceStatuses={data.sourceStatuses}
          canReviewStatus={data.canReviewStatus}
          currentUser={data.currentUser}
          issueReferenceData={data.issueReferenceData}
          sourceMatchSummary={data.sourceMatchSummary}
        />
      )}
    </main>
  );
}
