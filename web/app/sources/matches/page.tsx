import Link from "next/link";
import SourceMatchCandidatesClient from "@/components/sources/SourceMatchCandidatesClient";
import { formatCount } from "@/lib/format";
import {
  countSourceMatchCandidates,
  getSourceMatchCandidateSummary,
  listSourceMatchCandidates,
  listSourceMatchStatusOptions,
  type SourceMatchCandidateItem,
  type SourceMatchCandidateStatusOption,
  type SourceMatchCandidateSummary,
} from "@/lib/services/sources";

export const dynamic = "force-dynamic";

type SourceMatchSearchParams = {
  search?: string;
  status?: string;
  entityType?: string;
  flagged?: string;
  page?: string;
};

type SourceMatchData =
  | {
      ok: true;
      candidates: SourceMatchCandidateItem[];
      statuses: SourceMatchCandidateStatusOption[];
      summary: SourceMatchCandidateSummary;
      filteredCount: number;
      page: number;
      pageSize: number;
    }
  | {
      ok: false;
      error: string;
    };

const entityTypeOptions = [
  { code: "project", label: "Projects" },
  { code: "operating_asset", label: "Plants / Facilities" },
  { code: "company", label: "Companies" },
  { code: "country_market", label: "Countries / Markets" },
];
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

function sourceMatchHref(
  filters: SourceMatchSearchParams,
  nextPage: number
) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.entityType) params.set("entityType", filters.entityType);
  if (filters.flagged) params.set("flagged", filters.flagged);
  if (nextPage > 1) params.set("page", String(nextPage));

  const query = params.toString();
  return query ? `/sources/matches?${query}` : "/sources/matches";
}

async function getSourceMatchData(
  params: SourceMatchSearchParams
): Promise<SourceMatchData> {
  const page = parsePage(params.page);
  const offset = (page - 1) * pageSize;
  try {
    const listParams = {
      limit: pageSize,
      offset,
      search: params.search,
      status: params.status,
      entityType: params.entityType,
      flagged: params.flagged === "1",
    };
    const [candidates, filteredCount, statuses, summary] = await Promise.all([
      listSourceMatchCandidates({
        ...listParams,
      }),
      countSourceMatchCandidates(listParams),
      listSourceMatchStatusOptions(),
      getSourceMatchCandidateSummary(),
    ]);

    return {
      ok: true,
      candidates,
      filteredCount,
      statuses,
      summary,
      page,
      pageSize,
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

function SetupNotice({ error }: { error: string }) {
  return (
    <section className="border border-amber-200 bg-amber-50 px-5 py-5">
      <h2 className="text-lg font-bold text-amber-900">PostgreSQL Not Connected</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
        Source match review reads from Railway PostgreSQL. Run the app through
        Railway variables or set `DATABASE_PUBLIC_URL` / `DATABASE_URL` locally.
      </p>
      <pre className="mt-4 overflow-x-auto bg-white px-4 py-3 text-xs text-gray-700">
        railway run --service Postgres -- npm --prefix web run dev
      </pre>
      <p className="mt-3 text-xs text-amber-900">Error: {error}</p>
    </section>
  );
}

export default async function SourceMatchCandidatesPage({
  searchParams,
}: {
  searchParams?: Promise<SourceMatchSearchParams>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const filters = {
    search: cleanParam(resolvedSearchParams.search),
    status: cleanParam(resolvedSearchParams.status),
    entityType: cleanParam(resolvedSearchParams.entityType),
    flagged: cleanParam(resolvedSearchParams.flagged),
    page: cleanParam(resolvedSearchParams.page),
  };
  const data = await getSourceMatchData(filters);

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
                Article Match Review
              </h1>
              <p className="mt-4 max-w-4xl text-base leading-7 text-gray-600">
                Review generated TGE article-to-record candidates before they
                become evidence links. This keeps the archive import controlled,
                auditable, and separate from automated field updates.
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
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-7">
            <StatTile
              label="Candidates"
              value={formatCount(data.summary.total)}
              note="All generated matches"
            />
            <StatTile
              label="Open"
              value={formatCount(data.summary.open)}
              note="Needs review or suggested"
            />
            <StatTile
              label="High"
              value={formatCount(data.summary.highConfidence)}
              note="Suggested high confidence"
            />
            <StatTile
              label="Medium"
              value={formatCount(data.summary.mediumConfidence)}
              note="Suggested medium confidence"
            />
            <StatTile
              label="Flags"
              value={formatCount(data.summary.flaggedForReview)}
              note="Needs careful review"
            />
            <StatTile
              label="Confirmed"
              value={formatCount(data.summary.confirmed)}
              note="Evidence links created"
            />
            <StatTile
              label="Rejected"
              value={formatCount(data.summary.rejected)}
              note="Dismissed candidates"
            />
          </section>

          <section className="border border-gray-200 bg-white px-5 py-5">
            <form
              className="flex flex-col gap-4 xl:flex-row xl:items-end"
              action="/sources/matches"
            >
              <label className="flex min-w-[260px] flex-[1.5] flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Search
                <input
                  name="search"
                  defaultValue={filters.search || ""}
                  placeholder="Article, entity, alias, reason..."
                  className="h-10 border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-[#1f2937] outline-none focus:border-[#8dc63f]"
                />
              </label>

              <label className="flex min-w-[200px] flex-1 flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Match Status
                <select
                  name="status"
                  defaultValue={filters.status || ""}
                  className="h-10 border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-[#1f2937] outline-none focus:border-[#8dc63f]"
                >
                  <option value="">All statuses</option>
                  {data.statuses.map((status) => (
                    <option key={status.code} value={status.code}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex min-w-[200px] flex-1 flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Entity Type
                <select
                  name="entityType"
                  defaultValue={filters.entityType || ""}
                  className="h-10 border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-[#1f2937] outline-none focus:border-[#8dc63f]"
                >
                  <option value="">All entity types</option>
                  {entityTypeOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex min-w-[170px] flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Review Flags
                <select
                  name="flagged"
                  defaultValue={filters.flagged || ""}
                  className="h-10 border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-[#1f2937] outline-none focus:border-[#8dc63f]"
                >
                  <option value="">All candidates</option>
                  <option value="1">Flagged only</option>
                </select>
              </label>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center border border-[#8dc63f] bg-[#8dc63f] px-4 text-sm font-semibold text-white hover:bg-[#78ad35]"
                >
                  Apply
                </button>
                <Link
                  href="/sources/matches?flagged=1"
                  className="inline-flex h-10 items-center justify-center border border-amber-200 bg-amber-50 px-4 text-sm font-semibold text-amber-800 hover:bg-amber-100"
                >
                  Flagged
                </Link>
                <Link
                  href="/sources/matches"
                  className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                >
                  Reset
                </Link>
              </div>
            </form>
          </section>

          <SourceMatchCandidatesClient candidates={data.candidates} />

          <section className="flex flex-col gap-3 border border-gray-200 bg-white px-5 py-4 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
            <div>
              Showing{" "}
              <span className="font-semibold text-[#1f2937]">
                {data.filteredCount === 0
                  ? 0
                  : (data.page - 1) * data.pageSize + 1}
                -
                {Math.min(data.page * data.pageSize, data.filteredCount)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[#1f2937]">
                {formatCount(data.filteredCount)}
              </span>{" "}
              filtered candidates
            </div>
            <div className="flex gap-2">
              <Link
                aria-disabled={data.page <= 1}
                className={`inline-flex h-9 items-center justify-center border px-4 text-sm font-semibold ${
                  data.page <= 1
                    ? "pointer-events-none border-gray-200 bg-gray-50 text-gray-400"
                    : "border-gray-300 bg-white text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                }`}
                href={sourceMatchHref(filters, Math.max(data.page - 1, 1))}
              >
                Previous
              </Link>
              <Link
                aria-disabled={data.page * data.pageSize >= data.filteredCount}
                className={`inline-flex h-9 items-center justify-center border px-4 text-sm font-semibold ${
                  data.page * data.pageSize >= data.filteredCount
                    ? "pointer-events-none border-gray-200 bg-gray-50 text-gray-400"
                    : "border-gray-300 bg-white text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                }`}
                href={sourceMatchHref(filters, data.page + 1)}
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
