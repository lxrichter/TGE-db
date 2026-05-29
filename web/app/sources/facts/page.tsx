import Link from "next/link";
import { getServerSession } from "next-auth";
import ArticleFactCandidatesClient from "@/components/sources/ArticleFactCandidatesClient";
import SourceReviewFilterChips, {
  type SourceReviewFilterChip,
} from "@/components/sources/SourceReviewFilterChips";
import { DetailPriorityMarker } from "@/components/postgres-preview/PostgresEntityDetail";
import PostgresSectionJumpNav from "@/components/postgres-preview/PostgresSectionJumpNav";
import { getArticleFactTypeDefinition } from "@/lib/articleFactTypeDefinitions";
import { authOptions } from "@/lib/auth/auth";
import { canReview } from "@/lib/auth/roles";
import { formatCount } from "@/lib/format";
import {
  countArticleFactCandidates,
  getArticleFactCandidateFacets,
  getArticleFactCandidateSummary,
  listArticleFactCandidates,
  listArticleFactCandidateStatusOptions,
  type ArticleFactCandidateFacetOption,
  type ArticleFactCandidateItem,
  type ArticleFactCandidateStatusOption,
  type ArticleFactCandidateSummary,
} from "@/lib/services/article-facts";

export const dynamic = "force-dynamic";

type ArticleFactSearchParams = {
  search?: string;
  sourceId?: string;
  status?: string;
  factType?: string;
  fieldName?: string;
  page?: string;
};

type ArticleFactData =
  | {
      ok: true;
      candidates: ArticleFactCandidateItem[];
      statuses: ArticleFactCandidateStatusOption[];
      factTypes: ArticleFactCandidateFacetOption[];
      fieldNames: ArticleFactCandidateFacetOption[];
      summary: ArticleFactCandidateSummary;
      filteredCount: number;
      page: number;
      pageSize: number;
      canReview: boolean;
    }
  | {
      ok: false;
      error: string;
    };

const pageSize = 100;

function cleanParam(value: string | undefined) {
  return value?.trim() || undefined;
}

function parsePage(value: string | undefined) {
  const parsed = Number(value || "1");

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

const factCardClass =
  "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]";
const factSubtleCardClass =
  "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)]";
const factEyebrowClass =
  "text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]";
const factTitleClass = "font-bold text-[var(--tge-text-primary)]";
const factMutedTextClass = "text-[var(--tge-governance-muted-text)]";
const factBodyTextClass = "text-[var(--tge-text-secondary)]";
const factInputClass =
  "h-10 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 text-sm font-medium normal-case tracking-normal text-[var(--tge-text-primary)] outline-none focus:border-[var(--tge-brand-green)]";
const factPrimaryButtonClass =
  "inline-flex min-h-[38px] items-center justify-center whitespace-nowrap border border-[var(--tge-brand-green)] bg-[var(--tge-brand-green)] px-4 py-2 text-sm font-semibold text-[var(--tge-surface-card)] hover:bg-[var(--tge-brand-green-dark)]";
const factSecondaryButtonClass =
  "inline-flex min-h-[38px] items-center justify-center whitespace-nowrap border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-4 py-2 text-sm font-semibold text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)]";

function articleFactHref(filters: ArticleFactSearchParams, nextPage: number) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.sourceId) params.set("sourceId", filters.sourceId);
  if (filters.status) params.set("status", filters.status);
  if (filters.factType) params.set("factType", filters.factType);
  if (filters.fieldName) params.set("fieldName", filters.fieldName);
  if (nextPage > 1) params.set("page", String(nextPage));

  const query = params.toString();
  return query ? `/sources/facts?${query}` : "/sources/facts";
}

function articleFactFilterHref(
  filters: ArticleFactSearchParams,
  overrides: Partial<ArticleFactSearchParams>
) {
  return articleFactHref({ ...filters, ...overrides, page: undefined }, 1);
}

async function getArticleFactData(
  params: ArticleFactSearchParams
): Promise<ArticleFactData> {
  const page = parsePage(params.page);
  const offset = (page - 1) * pageSize;

  try {
    const listParams = {
      limit: pageSize,
      offset,
      search: params.search,
      sourceId: params.sourceId,
      status: params.status,
      factType: params.factType,
      fieldName: params.fieldName,
    };
    const [
      candidates,
      filteredCount,
      statuses,
      summary,
      facets,
      session,
    ] = await Promise.all([
      listArticleFactCandidates(listParams),
      countArticleFactCandidates(listParams),
      listArticleFactCandidateStatusOptions(),
      getArticleFactCandidateSummary(),
      getArticleFactCandidateFacets(),
      getServerSession(authOptions),
    ]);
    const role = (session?.user as { role?: string | null } | undefined)?.role;

    return {
      ok: true,
      candidates,
      filteredCount,
      statuses,
      summary,
      factTypes: facets.factTypes,
      fieldNames: facets.fieldNames,
      page,
      pageSize,
      canReview: canReview(role),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: message };
  }
}

function StatTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note: string;
}) {
  return (
    <div>
      <div className={factEyebrowClass}>{label}</div>
      <div className={`mt-0.5 text-xl leading-none ${factTitleClass}`}>
        {value}
      </div>
      <div className={`mt-1 text-xs leading-5 ${factMutedTextClass}`}>
        {note}
      </div>
    </div>
  );
}

function SelectFilter({
  label,
  name,
  value,
  options,
  allLabel,
}: {
  label: string;
  name: string;
  value?: string;
  options: Array<{ code: string; label: string; count?: number }>;
  allLabel: string;
}) {
  return (
    <label
      className={`flex min-w-0 flex-1 flex-col gap-2 text-xs font-semibold uppercase tracking-wide ${factMutedTextClass}`}
    >
      {label}
      <select
        name={name}
        defaultValue={value || ""}
        className={factInputClass}
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
            {option.count !== undefined ? ` (${formatCount(option.count)})` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

function FactTypeTrainingCard({
  factType,
}: {
  factType: ArticleFactSearchParams["factType"];
}) {
  const definition = getArticleFactTypeDefinition(factType);

  if (!definition) {
    return (
      <section className={`${factCardClass} px-5 py-4`}>
        <div className={`text-xs ${factEyebrowClass}`}>
          Fact Type Training
        </div>
        <p className={`mt-2 max-w-4xl text-sm leading-5 ${factBodyTextClass}`}>
          Filter to one fact type, review a compact sample, then tune the rule
          before expanding the archive batch.
        </p>
      </section>
    );
  }

  return (
    <section className={factCardClass}>
      <div className="border-l-4 border-l-[var(--tge-brand-green)] px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className={`text-xs ${factEyebrowClass}`}>
              Fact Type Training
            </div>
            <h2 className={`mt-2 text-xl ${factTitleClass}`}>
              {definition.label}
            </h2>
            <p className={`mt-2 max-w-4xl text-sm leading-5 ${factBodyTextClass}`}>
              {definition.purpose}
            </p>
          </div>
          <div className="self-start border border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] px-3 py-2 text-xs font-semibold text-[var(--tge-governance-success-text)]">
            One-type review mode
          </div>
        </div>

        <div className={`mt-4 ${factSubtleCardClass} px-4 py-3`}>
          <div className={`text-xs ${factEyebrowClass}`}>
            Reviewer Question
          </div>
          <p className="mt-2 text-sm font-semibold leading-5 text-[var(--tge-text-primary)]">
            {definition.reviewQuestion}
          </p>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-success-text)]">
              Accept When
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm leading-5 text-[var(--tge-governance-neutral-text)]">
              {definition.accept.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-danger-text)]">
              Reject When
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm leading-5 text-[var(--tge-governance-neutral-text)]">
              {definition.reject.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function SetupNotice({ error }: { error: string }) {
  return (
    <section className="border border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] px-5 py-5">
      <h2 className="text-lg font-bold text-[var(--tge-governance-attention-text)]">
        PostgreSQL Not Connected
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--tge-governance-attention-text)]">
        Article fact review reads from PostgreSQL. Run the app with local
        `DATABASE_URL` or Railway PostgreSQL variables.
      </p>
      <pre className="mt-4 overflow-x-auto bg-[var(--tge-surface-card)] px-4 py-3 text-xs text-[var(--tge-governance-neutral-text)]">
        DATABASE_URL=&quot;postgresql://lxrichter@localhost:5432/tge_local?schema=public&quot; npm run dev
      </pre>
      <p className="mt-3 text-xs text-[var(--tge-governance-attention-text)]">
        Error: {error}
      </p>
    </section>
  );
}

function FilterDisclosure({
  defaultOpen,
  children,
}: {
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className={factCardClass} open={defaultOpen}>
      <summary className="flex cursor-pointer list-none flex-col gap-2 px-5 py-4 marker:hidden sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className={`text-lg ${factTitleClass}`}>
            Fact Review Filters
          </h2>
          <p className={`mt-1 max-w-3xl text-sm leading-6 ${factBodyTextClass}`}>
            Scope candidates by status, fact type, field, or search.
          </p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--tge-brand-green-dark)]">
          Expand / collapse
        </span>
      </summary>
      <div className="border-t border-[var(--tge-governance-neutral-border)] px-5 py-5">
        {children}
      </div>
    </details>
  );
}

export default async function ArticleFactCandidatesPage({
  searchParams,
}: {
  searchParams?: Promise<ArticleFactSearchParams>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const filters = {
    search: cleanParam(resolvedSearchParams.search),
    sourceId: cleanParam(resolvedSearchParams.sourceId),
    status: cleanParam(resolvedSearchParams.status),
    factType: cleanParam(resolvedSearchParams.factType),
    fieldName: cleanParam(resolvedSearchParams.fieldName),
    page: cleanParam(resolvedSearchParams.page),
  };
  const data = await getArticleFactData(filters);
  const activeFilterChips: SourceReviewFilterChip[] = data.ok
    ? [
        filters.search
          ? {
              key: "search",
              label: "Search",
              value: filters.search,
              href: articleFactFilterHref(filters, { search: undefined }),
            }
          : null,
        filters.sourceId
          ? {
              key: "sourceId",
              label: "Source",
              value: "Current source",
              href: articleFactFilterHref(filters, { sourceId: undefined }),
            }
          : null,
        filters.status
          ? {
              key: "status",
              label: "Status",
              value:
                data.statuses.find((status) => status.code === filters.status)
                  ?.label || filters.status,
              href: articleFactFilterHref(filters, { status: undefined }),
            }
          : null,
        filters.factType
          ? {
              key: "factType",
              label: "Fact Type",
              value:
                data.factTypes.find((factType) => factType.code === filters.factType)
                  ?.label || filters.factType,
              href: articleFactFilterHref(filters, { factType: undefined }),
            }
          : null,
        filters.fieldName
          ? {
              key: "fieldName",
              label: "Field",
              value:
                data.fieldNames.find((field) => field.code === filters.fieldName)
                  ?.label || filters.fieldName,
              href: articleFactFilterHref(filters, { fieldName: undefined }),
            }
          : null,
      ].filter((chip): chip is SourceReviewFilterChip => Boolean(chip))
    : [];
  return (
    <main className="space-y-7">
      <section className={factCardClass}>
        <div className="px-6 py-4 xl:px-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]">
                Evidence Review
              </p>
              <h1 className={`mt-2 text-2xl font-bold tracking-tight ${factTitleClass} xl:text-[2.2rem]`}>
                Article Fact Review
              </h1>
              <p className={`mt-2 max-w-4xl text-base leading-7 ${factBodyTextClass}`}>
                Review compact fact candidates from local TGE markdown articles
                before they inform human-confirmed field suggestions.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 xl:justify-end">
              <Link
                className={factSecondaryButtonClass}
                href="/sources"
              >
                Sources
              </Link>
              <Link
                className={factSecondaryButtonClass}
                href="/sources/matches"
              >
                Article Matches
              </Link>
              <Link
                className={factSecondaryButtonClass}
                href="/postgres-preview/research-ops"
              >
                Research Ops
              </Link>
            </div>
          </div>
        </div>

        {data.ok ? (
          <div className="border-t border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-6 py-3.5 xl:px-8">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 xl:grid-cols-4">
              <StatTile
                label="Candidates"
                value={formatCount(data.summary.total)}
                note={`${formatCount(data.summary.open)} open review candidates`}
              />
              <StatTile
                label="Suggested"
                value={formatCount(data.summary.suggested)}
                note={`${formatCount(data.summary.needsReview)} need review`}
              />
              <StatTile
                label="Decisions"
                value={formatCount(data.summary.confirmed + data.summary.rejected)}
                note={`${formatCount(data.summary.confirmed)} confirmed · ${formatCount(
                  data.summary.rejected
                )} rejected`}
              />
              <StatTile
                label="Evidence Coverage"
                value={formatCount(data.summary.withSourceRecord)}
                note={`${formatCount(data.summary.withEntitySignal)} entity signals`}
              />
            </div>
          </div>
        ) : null}
      </section>

      {!data.ok ? (
        <SetupNotice error={data.error} />
      ) : (
        <>
          <PostgresSectionJumpNav
            items={[
              {
                href: "#fact-training",
                label: "Filters",
                note: "Training",
              },
              {
                href: "#fact-review",
                label: "Review",
                note: "Candidates",
              },
              {
                href: "#fact-summary",
                label: "Summary",
                note: "Signals",
              },
            ]}
          />

          <section id="fact-training" className="space-y-5 scroll-mt-24">
            <DetailPriorityMarker
              label="Core"
              title="Fact Review Filters"
              description="Filter, review definitions, accept/reject candidates."
              tone="core"
            />

            <FilterDisclosure defaultOpen={activeFilterChips.length > 0}>
              <form
                className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.5fr)_repeat(3,minmax(170px,1fr))_auto] xl:items-end"
                action="/sources/facts"
              >
                {filters.sourceId ? (
                  <input type="hidden" name="sourceId" value={filters.sourceId} />
                ) : null}
                <label
                  className={`flex min-w-0 flex-col gap-2 text-xs font-semibold uppercase tracking-wide ${factMutedTextClass}`}
                >
                  Search
                  <input
                    name="search"
                    defaultValue={filters.search || ""}
                    placeholder="Article, reference, value, field, reason..."
                    className={factInputClass}
                  />
                </label>

                <SelectFilter
                  label="Status"
                  name="status"
                  value={filters.status}
                  options={data.statuses}
                  allLabel="All statuses"
                />
                <SelectFilter
                  label="Fact Type"
                  name="factType"
                  value={filters.factType}
                  options={data.factTypes}
                  allLabel="All fact types"
                />
                <SelectFilter
                  label="Field"
                  name="fieldName"
                  value={filters.fieldName}
                  options={data.fieldNames}
                  allLabel="All fields"
                />

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex">
                  <button
                    type="submit"
                    className={factPrimaryButtonClass}
                  >
                    Apply
                  </button>
                  <Link
                    href="/sources/facts"
                    className={factSecondaryButtonClass}
                  >
                    Reset
                  </Link>
                </div>
              </form>
              <SourceReviewFilterChips
                chips={activeFilterChips}
                resetHref="/sources/facts"
                emptyLabel="All article fact candidates"
              />
            </FilterDisclosure>

            <FactTypeTrainingCard factType={filters.factType} />
          </section>

          <section id="fact-review" className="space-y-5 scroll-mt-24">
            <DetailPriorityMarker
              label="Workflow"
              title="Candidate Review Rows"
              description="Review signals only; no automatic entity updates."
              tone="workflow"
            />

            <ArticleFactCandidatesClient
              candidates={data.candidates}
              canReview={data.canReview}
            />

            <section className="flex flex-col gap-3 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-5 py-4 text-sm text-[var(--tge-text-secondary)] md:flex-row md:items-center md:justify-between">
              <div>
                Showing {formatCount(data.candidates.length)} of{" "}
                {formatCount(data.filteredCount)} matching candidates.
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <Link
                  href={articleFactHref(filters, Math.max(data.page - 1, 1))}
                  aria-disabled={data.page <= 1}
                  className={`inline-flex h-9 items-center border px-3 text-sm font-semibold ${
                    data.page <= 1
                      ? "pointer-events-none border-[var(--tge-governance-muted-border)] text-[var(--tge-governance-muted-text)]"
                      : "border-[var(--tge-governance-neutral-border)] text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)]"
                  }`}
                >
                  Previous
                </Link>
                <span className="inline-flex h-9 items-center border border-[var(--tge-governance-neutral-border)] px-3 text-sm font-semibold text-[var(--tge-governance-muted-text)]">
                  Page {formatCount(data.page)}
                </span>
                <Link
                  href={articleFactHref(filters, data.page + 1)}
                  aria-disabled={data.page * data.pageSize >= data.filteredCount}
                  className={`inline-flex h-9 items-center border px-3 text-sm font-semibold ${
                    data.page * data.pageSize >= data.filteredCount
                      ? "pointer-events-none border-[var(--tge-governance-muted-border)] text-[var(--tge-governance-muted-text)]"
                      : "border-[var(--tge-governance-neutral-border)] text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)]"
                  }`}
                >
                  Next
                </Link>
              </div>
            </section>
          </section>

          <section id="fact-summary" className="space-y-5 scroll-mt-24">
            <DetailPriorityMarker
              label="Governance"
              title="Fact Review Signal Summary"
              description="Open load, decisions, entity signals, source coverage."
              tone="governance"
            />

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
              <StatTile
                label="Candidates"
                value={formatCount(data.summary.total)}
                note="All extracted facts"
              />
              <StatTile
                label="Open"
                value={formatCount(data.summary.open)}
                note="Suggested or needs review"
              />
              <StatTile
                label="Suggested"
                value={formatCount(data.summary.suggested)}
                note="Machine/rule candidates"
              />
              <StatTile
                label="Needs Review"
                value={formatCount(data.summary.needsReview)}
                note="Deferred for review"
              />
              <StatTile
                label="Confirmed"
                value={formatCount(data.summary.confirmed)}
                note="Human accepted"
              />
              <StatTile
                label="Rejected"
                value={formatCount(data.summary.rejected)}
                note="Human rejected"
              />
              <StatTile
                label="Entity Signals"
                value={formatCount(data.summary.withEntitySignal)}
                note="Has entity label"
              />
              <StatTile
                label="Governed Sources"
                value={formatCount(data.summary.withSourceRecord)}
                note="Linked to source row"
              />
            </section>
          </section>
        </>
      )}
    </main>
  );
}
