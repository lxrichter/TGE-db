import Link from "next/link";
import { getServerSession } from "next-auth";
import ArticleFactCandidatesClient from "@/components/sources/ArticleFactCandidatesClient";
import SourceReviewFilterChips, {
  type SourceReviewFilterChip,
} from "@/components/sources/SourceReviewFilterChips";
import { DetailPriorityMarker } from "@/components/postgres-preview/PostgresEntityDetail";
import PostgresSectionJumpNav from "@/components/postgres-preview/PostgresSectionJumpNav";
import NextActionStrip from "@/components/ui/NextActionStrip";
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

function articleFactHref(filters: ArticleFactSearchParams, nextPage: number) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
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
    <div className="border border-gray-200 bg-white px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-2 text-3xl font-bold leading-none text-[#1f2937]">
        {value}
      </div>
      <div className="mt-2 text-xs leading-5 text-gray-500">{note}</div>
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
    <label className="flex min-w-0 flex-1 flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
      {label}
      <select
        name={name}
        defaultValue={value || ""}
        className="h-10 border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-[#1f2937] outline-none focus:border-[#8dc63f]"
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
      <section className="border border-gray-200 bg-white px-5 py-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Fact Type Training
        </div>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-gray-600">
          Filter to one fact type, review a compact sample, mark accept/reject,
          then tune the extraction rule before expanding the archive batch.
          Confirmed candidates remain review signals and do not update records
          automatically.
        </p>
      </section>
    );
  }

  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-l-4 border-l-[#8dc63f] px-5 py-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Fact Type Training
            </div>
            <h2 className="mt-2 text-xl font-bold text-[#1f2937]">
              {definition.label}
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-gray-600">
              {definition.purpose}
            </p>
          </div>
          <div className="self-start border border-[#d7e8bf] bg-[#f5faef] px-3 py-2 text-xs font-semibold text-[#4f7f1f]">
            One-type review mode
          </div>
        </div>

        <div className="mt-5 border border-gray-200 bg-[#fbfbfb] px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Reviewer Question
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#1f2937]">
            {definition.reviewQuestion}
          </p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[#4f7f1f]">
              Accept When
            </h3>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-gray-700">
              {definition.accept.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-red-700">
              Reject When
            </h3>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-gray-700">
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
    <section className="border border-amber-200 bg-amber-50 px-5 py-5">
      <h2 className="text-lg font-bold text-amber-900">PostgreSQL Not Connected</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
        Article fact review reads from PostgreSQL. Run the app with local
        `DATABASE_URL` or Railway PostgreSQL variables.
      </p>
      <pre className="mt-4 overflow-x-auto bg-white px-4 py-3 text-xs text-gray-700">
        DATABASE_URL=&quot;postgresql://lxrichter@localhost:5432/tge_local?schema=public&quot; npm run dev
      </pre>
      <p className="mt-3 text-xs text-amber-900">Error: {error}</p>
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
    <details className="border border-gray-200 bg-white" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none flex-col gap-2 px-5 py-4 marker:hidden sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1f2937]">
            Fact Review Filters
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">
            Scope extracted fact candidates by status, fact type, field, or
            search term before review.
          </p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide text-[#4f7f1f]">
          Expand / collapse
        </span>
      </summary>
      <div className="border-t border-gray-200 px-5 py-5">{children}</div>
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
    <main className="space-y-6 sm:space-y-8">
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-5 py-6 sm:px-8 sm:py-8">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
            Sources / Documents
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#1f2937] sm:text-4xl">
                Article Fact Review
              </h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-gray-600 sm:mt-4 sm:text-base sm:leading-7">
                Review compact fact candidates extracted from local TGE markdown
                articles. This is the controlled bridge between article
                extraction and future human-confirmed field suggestions.
              </p>
            </div>
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 lg:w-auto lg:flex lg:flex-wrap">
              <Link
                className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                href="/sources"
              >
                Sources
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                href="/sources/matches"
              >
                Article Matches
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                href="/postgres-preview/research-ops"
              >
                Research Ops
              </Link>
            </div>
          </div>
        </div>
      </section>

      <NextActionStrip
        description="From article fact review, the next step should be source context, entity lookup, or Research Ops governance before any field suggestion is applied."
        actions={[
          {
            label: "Source Context",
            title: "Open Evidence Backbone",
            description: "Review source records, credibility state, and linked evidence coverage.",
            href: "/sources",
          },
          {
            label: "Entity Linking",
            title: "Review article matches",
            description: "Check whether extracted facts have a reviewed article-to-entity path.",
            href: "/sources/matches",
          },
          {
            label: "Operations",
            title: "Open fact queue",
            description: "Return to Research Ops for fact review and field-suggestion governance.",
            href: "/postgres-preview/research-ops#article-fact-review",
          },
        ]}
      />

      {!data.ok ? (
        <SetupNotice error={data.error} />
      ) : (
        <>
          <PostgresSectionJumpNav
            items={[
              {
                href: "#fact-triage",
                label: "Triage",
                note: "Load",
              },
              {
                href: "#fact-training",
                label: "Training",
                note: "Fact Types",
              },
              {
                href: "#fact-review",
                label: "Review",
                note: "Candidates",
              },
            ]}
          />

          <section id="fact-triage" className="space-y-5 scroll-mt-24">
            <DetailPriorityMarker
              label="Core"
              title="Fact Triage"
              description="Open load, decisions, entity signals, source coverage."
              tone="core"
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
                label="Source Records"
                value={formatCount(data.summary.withSourceRecord)}
                note="Linked to source row"
              />
            </section>
          </section>

          <section id="fact-training" className="space-y-5 scroll-mt-24">
            <DetailPriorityMarker
              label="Workflow"
              title="Fact-Type Training"
              description="Filter, review definitions, accept/reject candidates."
              tone="workflow"
            />

            <FilterDisclosure defaultOpen={activeFilterChips.length > 0}>
              <form
                className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.5fr)_repeat(3,minmax(170px,1fr))_auto] xl:items-end"
                action="/sources/facts"
              >
                <label className="flex min-w-0 flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Search
                  <input
                    name="search"
                    defaultValue={filters.search || ""}
                    placeholder="Article, reference, value, field, reason..."
                    className="h-10 border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-[#1f2937] outline-none focus:border-[#8dc63f]"
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
                    className="inline-flex h-10 items-center justify-center border border-[#8dc63f] bg-[#8dc63f] px-4 text-sm font-semibold text-white hover:bg-[#78ad35]"
                  >
                    Apply
                  </button>
                  <Link
                    href="/sources/facts"
                    className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
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
              label="Governance"
              title="Candidate Review Rows"
              description="Review signals only; no automatic entity updates."
              tone="governance"
            />

            <ArticleFactCandidatesClient
              candidates={data.candidates}
              canReview={data.canReview}
            />

            <section className="flex flex-col gap-3 border border-gray-200 bg-white px-5 py-4 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
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
                      ? "pointer-events-none border-gray-200 text-gray-300"
                      : "border-gray-300 text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                  }`}
                >
                  Previous
                </Link>
                <span className="inline-flex h-9 items-center border border-gray-200 px-3 text-sm font-semibold text-gray-500">
                  Page {formatCount(data.page)}
                </span>
                <Link
                  href={articleFactHref(filters, data.page + 1)}
                  aria-disabled={data.page * data.pageSize >= data.filteredCount}
                  className={`inline-flex h-9 items-center border px-3 text-sm font-semibold ${
                    data.page * data.pageSize >= data.filteredCount
                      ? "pointer-events-none border-gray-200 text-gray-300"
                      : "border-gray-300 text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                  }`}
                >
                  Next
                </Link>
              </div>
            </section>
          </section>
        </>
      )}
    </main>
  );
}
