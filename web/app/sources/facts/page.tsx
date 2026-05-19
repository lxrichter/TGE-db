import Link from "next/link";
import { getServerSession } from "next-auth";
import ArticleFactCandidatesClient from "@/components/sources/ArticleFactCandidatesClient";
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
    <label className="flex min-w-[200px] flex-1 flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
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

  return (
    <main className="space-y-8">
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-8 py-8">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
            Sources / Documents
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-[#1f2937]">
                Article Fact Review
              </h1>
              <p className="mt-4 max-w-4xl text-base leading-7 text-gray-600">
                Review compact fact candidates extracted from local TGE markdown
                articles. This is the controlled bridge between article
                extraction and future human-confirmed field suggestions.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
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

      {!data.ok ? (
        <SetupNotice error={data.error} />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">
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

          <section className="border border-gray-200 bg-white px-5 py-5">
            <form
              className="flex flex-col gap-4 xl:flex-row xl:items-end"
              action="/sources/facts"
            >
              <label className="flex min-w-[260px] flex-[1.5] flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
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

              <div className="flex gap-2">
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
          </section>

          <ArticleFactCandidatesClient
            candidates={data.candidates}
            canReview={data.canReview}
          />

          <section className="flex flex-col gap-3 border border-gray-200 bg-white px-5 py-4 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
            <div>
              Showing {formatCount(data.candidates.length)} of{" "}
              {formatCount(data.filteredCount)} matching candidates.
            </div>
            <div className="flex flex-wrap gap-2">
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
                aria-disabled={
                  data.page * data.pageSize >= data.filteredCount
                }
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
        </>
      )}
    </main>
  );
}
