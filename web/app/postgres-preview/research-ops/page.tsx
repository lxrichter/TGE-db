import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { canReview } from "@/lib/auth/roles";
import {
  getPostgresEntityFormReferenceData,
  getPostgresFieldSuggestionSummary,
  getPostgresResearchOpsIssueReferenceData,
  getPostgresResearchOpsDashboard,
  listPostgresFieldSuggestionCandidates,
  type PostgresFieldSuggestionCandidate,
  type PostgresFieldSuggestionSummary,
  type PostgresResearchOpsDashboard,
  type PostgresResearchOpsIssueReferenceData,
} from "@/lib/postgres-preview";
import { getCurrentPostgresPreviewUser } from "@/lib/postgres-preview/entity-api";
import {
  getSourceMatchCandidateSummary,
  getSourceReferenceData,
  type SourceMatchCandidateSummary,
} from "@/lib/services/sources";
import {
  getArticleFactCandidateSummary,
  type ArticleFactCandidateSummary,
} from "@/lib/services/article-facts";
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
      articleFactSummary: ArticleFactCandidateSummary;
      fieldSuggestionSummary: PostgresFieldSuggestionSummary;
      fieldSuggestionCandidates: PostgresFieldSuggestionCandidate[];
    }
  | {
      ok: false;
      error: string;
    };

const pageClass = {
  panel:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]",
  eyebrow:
    "text-sm font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]",
  title:
    "text-3xl font-bold tracking-tight text-[var(--tge-text-primary)] sm:text-4xl",
  body:
    "mt-3 max-w-4xl text-sm leading-6 text-[var(--tge-text-secondary)] sm:mt-4 sm:text-base sm:leading-7",
  secondaryButton:
    "inline-flex h-10 w-full items-center justify-center border border-[var(--tge-governance-muted-border)] bg-[var(--tge-surface-card)] px-4 text-sm font-semibold text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)] sm:w-auto",
  setupNotice:
    "border border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] px-5 py-5",
};

async function getResearchOpsData(): Promise<ResearchOpsData> {
  try {
    const [
      dashboard,
      entityReferenceData,
      sourceReferenceData,
      issueReferenceData,
      sourceMatchSummary,
      articleFactSummary,
      fieldSuggestionSummary,
      fieldSuggestionCandidates,
    ] =
      await Promise.all([
        getPostgresResearchOpsDashboard(100),
        getPostgresEntityFormReferenceData(),
        getSourceReferenceData(),
        getPostgresResearchOpsIssueReferenceData(),
        getSourceMatchCandidateSummary(),
        getArticleFactCandidateSummary(),
        getPostgresFieldSuggestionSummary(),
        listPostgresFieldSuggestionCandidates(12),
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
      articleFactSummary,
      fieldSuggestionSummary,
      fieldSuggestionCandidates,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: message };
  }
}

function SetupNotice({ error }: { error: string }) {
  return (
    <section className={pageClass.setupNotice}>
      <h2 className="text-lg font-bold text-[var(--tge-governance-attention-text)]">
        PostgreSQL Not Connected
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--tge-governance-attention-text)]">
        This preview reads from the Railway PostgreSQL database. Run the app
        through Railway variables or set `DATABASE_PUBLIC_URL` / `DATABASE_URL`
        locally.
      </p>
      <pre className="mt-4 overflow-x-auto bg-[var(--tge-surface-card)] px-4 py-3 text-xs text-[var(--tge-governance-neutral-text)]">
        railway run --service Postgres -- npm --prefix web run dev
      </pre>
      <p className="mt-3 text-xs text-[var(--tge-governance-attention-text)]">
        Error: {error}
      </p>
    </section>
  );
}

export default async function PostgresResearchOpsPage() {
  const data = await getResearchOpsData();

  return (
    <main className="space-y-6 sm:space-y-8">
      <section className={pageClass.panel}>
        <div className="border-l-4 border-l-[var(--tge-brand-green)] px-5 py-6 sm:px-8 sm:py-8">
          <p className={pageClass.eyebrow}>
            Research Operations
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className={pageClass.title}>
                Research Ops
              </h1>
              <p className={pageClass.body}>
                Operational queues for validation, missing data, direct-use
                classification, duplicate checks, and quick review-status changes.
              </p>
            </div>
            <Link
              className={pageClass.secondaryButton}
              href="/postgres-preview"
            >
              Back to Command Center
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
          articleFactSummary={data.articleFactSummary}
          fieldSuggestionSummary={data.fieldSuggestionSummary}
          fieldSuggestionCandidates={data.fieldSuggestionCandidates}
        />
      )}
    </main>
  );
}
