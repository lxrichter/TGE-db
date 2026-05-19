import Link from "next/link";
import {
  getSourceMatchCandidateSummary,
  getSourceOperationalSummary,
  getSourceReferenceData,
  listSources,
  type SourceListParams,
  type SourceMatchCandidateSummary,
  type SourceListItem,
  type SourceOperationalSummary,
  type SourceReferenceData,
  type SourceReferenceOption,
} from "@/lib/services/sources";
import {
  getArticleFactCandidateSummary,
  type ArticleFactCandidateSummary,
} from "@/lib/services/article-facts";
import { formatCount } from "@/lib/format";

export const dynamic = "force-dynamic";

type SourceSearchParams = {
  search?: string;
  sourceType?: string;
  visibility?: string;
  status?: string;
  linkState?: string;
  duplicate?: string;
  quality?: string;
};

type SourcesData =
  | {
      ok: true;
      sources: SourceListItem[];
      summary: SourceOperationalSummary;
      matchSummary: SourceMatchCandidateSummary;
      articleFactSummary: ArticleFactCandidateSummary;
      referenceData: SourceReferenceData;
    }
  | {
      ok: false;
      error: string;
    };

async function getSourcesData(
  params: SourceSearchParams
): Promise<SourcesData> {
  try {
    const listParams: SourceListParams = {
      search: params.search,
      sourceType: params.sourceType,
      visibility: params.visibility,
      status: params.status,
      linkState:
        params.linkState === "linked" || params.linkState === "unlinked"
          ? params.linkState
          : undefined,
      duplicate: params.duplicate === "1",
      quality:
        params.quality === "weak_outdated_rejected"
          ? params.quality
          : undefined,
    };
    const [sources, referenceData, summary, matchSummary, articleFactSummary] =
      await Promise.all([
        listSources({
          limit: 100,
          ...listParams,
        }),
        getSourceReferenceData(),
        getSourceOperationalSummary(listParams),
        getSourceMatchCandidateSummary(),
        getArticleFactCandidateSummary(),
      ]);

    return {
      ok: true,
      sources,
      summary,
      matchSummary,
      articleFactSummary,
      referenceData,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: message };
  }
}

function cleanParam(value: string | undefined) {
  return value?.trim() || undefined;
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string | null;
  tone?: "green" | "amber" | "red" | "neutral";
}) {
  const classes = {
    green: "border-[#b9d98b] bg-[#f1f8e8] text-[#3f6f19]",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    red: "border-red-200 bg-red-50 text-red-700",
    neutral: "border-gray-200 bg-[#f7f7f7] text-gray-700",
  };

  return (
    <span
      className={`inline-flex min-h-[28px] items-center border px-2 text-xs font-semibold ${classes[tone]}`}
    >
      {label || "Unknown"}
    </span>
  );
}

function statusTone(status: string) {
  if (status === "credible") {
    return "green";
  }

  if (status === "needs_review" || status === "outdated") {
    return "amber";
  }

  if (status === "weak" || status === "rejected") {
    return "red";
  }

  return "neutral";
}

function visibilityTone(visibility: string) {
  if (visibility === "public") {
    return "green";
  }

  if (visibility === "client_confidential" || visibility === "not_for_publication") {
    return "red";
  }

  return "amber";
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

function OperationCard({
  label,
  value,
  note,
  href,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  note: string;
  href?: string;
  tone?: "green" | "amber" | "red" | "neutral";
}) {
  const toneClasses = {
    green: "border-[#b9d98b] bg-[#f8fcf2]",
    amber: "border-amber-200 bg-amber-50",
    red: "border-red-200 bg-red-50",
    neutral: "border-gray-200 bg-white",
  };
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {label}
          </div>
          <div className="mt-2 text-2xl font-bold leading-none text-[#1f2937]">
            {value}
          </div>
        </div>
        {href ? (
          <span className="text-xs font-semibold text-[#4f7f1f]">Open</span>
        ) : null}
      </div>
      <div className="mt-3 text-xs leading-5 text-gray-500">{note}</div>
    </>
  );

  const className = `border px-4 py-4 transition ${toneClasses[tone]} ${
    href ? "hover:border-[#8dc63f] hover:bg-[#fbfdf8]" : ""
  }`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

function WorkflowStrip() {
  const steps = [
    {
      step: "1",
      label: "Source Record",
      note: "Article, report, website, document, or internal evidence.",
    },
    {
      step: "2",
      label: "Credibility Review",
      note: "Marked credible, weak, outdated, rejected, or needs review.",
    },
    {
      step: "3",
      label: "Evidence Link",
      note: "Confirmed link to project, plant/facility, company, or market.",
    },
    {
      step: "4",
      label: "Fact / AI Candidate",
      note: "Extracted facts stay reviewable before field suggestions.",
    },
  ];

  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-bold text-[#1f2937]">
          Source Governance Flow
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
          Source records, evidence links, article matches, and extracted facts
          remain separate until reviewed. This keeps source governance ahead of
          AI-assisted data filling.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 px-5 py-5 md:grid-cols-4">
        {steps.map((item) => (
          <div key={item.step} className="border border-gray-200 bg-[#fbfbfb] px-4 py-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center border border-gray-300 bg-white text-xs font-bold text-[#1f2937]">
                {item.step}
              </span>
              <span className="text-xs font-bold uppercase tracking-wide text-[#1f2937]">
                {item.label}
              </span>
            </div>
            <div className="mt-2 text-xs leading-5 text-gray-500">
              {item.note}
            </div>
          </div>
        ))}
      </div>
    </section>
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
  options: SourceReferenceOption[];
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
          </option>
        ))}
      </select>
    </label>
  );
}

function activeOperationalFilterLabels(filters: SourceSearchParams) {
  return [
    filters.linkState === "unlinked" ? "Unlinked sources" : null,
    filters.linkState === "linked" ? "Linked sources" : null,
    filters.duplicate === "1" ? "Duplicate flagged" : null,
    filters.quality === "weak_outdated_rejected"
      ? "Weak / outdated / rejected"
      : null,
  ].filter((label): label is string => Boolean(label));
}

function SetupNotice({ error }: { error: string }) {
  return (
    <section className="border border-amber-200 bg-amber-50 px-5 py-5">
      <h2 className="text-lg font-bold text-amber-900">PostgreSQL Not Connected</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
        Sources / Documents currently reads from Railway PostgreSQL. Run the app
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

function SourcesTable({
  sources,
  total,
}: {
  sources: SourceListItem[];
  total: number;
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-bold text-[#1f2937]">Source Records</h2>
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Showing {formatCount(sources.length)} of {formatCount(total)} matching
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed text-left text-sm">
          <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-[28%] px-5 py-3 font-semibold">Source</th>
              <th className="w-[14%] px-5 py-3 font-semibold">Type</th>
              <th className="w-[12%] px-5 py-3 font-semibold">Visibility</th>
              <th className="w-[12%] px-5 py-3 font-semibold">Status</th>
              <th className="w-[12%] px-5 py-3 font-semibold">Country</th>
              <th className="w-[10%] px-5 py-3 font-semibold">Links</th>
              <th className="w-[12%] px-5 py-3 font-semibold">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sources.map((source) => (
              <tr key={source.source_id} className="align-top">
                <td className="px-5 py-4">
                  <Link
                    href={`/sources/${source.source_id}`}
                    className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                  >
                    {source.title || source.url || source.source_reference || "Untitled source"}
                  </Link>
                  <div className="mt-1 line-clamp-2 text-xs text-gray-500">
                    {source.url || source.source_reference || "No URL or reference added"}
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-700">
                  {source.source_type_label || source.source_type_code}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge
                    label={source.visibility_label || source.visibility_code}
                    tone={visibilityTone(source.visibility_code)}
                  />
                </td>
                <td className="px-5 py-4">
                  <StatusBadge
                    label={source.credibility_status_label || source.credibility_status_code}
                    tone={statusTone(source.credibility_status_code)}
                  />
                  {source.duplicate_source_flag ? (
                    <div className="mt-2 text-xs font-semibold text-red-700">
                      Duplicate flag
                    </div>
                  ) : null}
                </td>
                <td className="px-5 py-4 text-gray-700">
                  {source.country || "-"}
                </td>
                <td className="px-5 py-4 text-gray-700">
                  {formatCount(source.linked_entity_count)}
                </td>
                <td className="px-5 py-4 text-gray-700">
                  {formatDate(source.updated_at)}
                  <div className="mt-1 text-xs text-gray-500">
                    by {source.reviewed_by_name || source.added_by_name || "unknown"}
                  </div>
                </td>
              </tr>
            ))}

            {sources.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-500">
                  No source records match the current filters. The PostgreSQL
                  source model and reference data are in place; source entry is
                  the next implementation slice.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function SourcesPage({
  searchParams,
}: {
  searchParams?: Promise<SourceSearchParams>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const filters = {
    search: cleanParam(resolvedSearchParams.search),
    sourceType: cleanParam(resolvedSearchParams.sourceType),
    visibility: cleanParam(resolvedSearchParams.visibility),
    status: cleanParam(resolvedSearchParams.status),
    linkState: cleanParam(resolvedSearchParams.linkState),
    duplicate: cleanParam(resolvedSearchParams.duplicate),
    quality: cleanParam(resolvedSearchParams.quality),
  };
  const activeOperationalFilters = activeOperationalFilterLabels(filters);
  const data = await getSourcesData(filters);

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
                Evidence Backbone
              </h1>
              <p className="mt-4 max-w-4xl text-base leading-7 text-gray-600">
                PostgreSQL-backed source records, evidence links, source
                credibility, and visibility controls. This page is the first
                read-only working surface for validation and future AI-ready
                source management.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                href="/sources/facts"
              >
                Review Article Facts
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                href="/sources/matches"
              >
                Review Article Matches
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                href="/sources/new"
              >
                Add Source
              </Link>
            </div>
          </div>
        </div>
      </section>

      {!data.ok ? (
        <SetupNotice error={data.error} />
      ) : (
        <>
          <WorkflowStrip />

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
            <StatTile
              label="Total Sources"
              value={formatCount(data.summary.total)}
              note="Records matching filters"
            />
            <StatTile
              label="Credible"
              value={formatCount(data.summary.credible)}
              note="Reviewed source records"
            />
            <StatTile
              label="TGE Articles"
              value={formatCount(data.summary.tgeArticles)}
              note="Historical article metadata"
            />
            <StatTile
              label="Needs Review"
              value={formatCount(data.summary.needsReview)}
              note="Credibility work queue"
            />
            <StatTile
              label="Unlinked Sources"
              value={formatCount(data.summary.unlinkedSources)}
              note="No confirmed entity links"
            />
            <StatTile
              label="Linked Evidence"
              value={formatCount(data.summary.linkedEvidence)}
              note="Project/asset/company links"
            />
            <StatTile
              label="Open Matches"
              value={formatCount(data.matchSummary.open)}
              note="Article/entity candidates"
            />
            <StatTile
              label="Open Facts"
              value={formatCount(data.articleFactSummary.open)}
              note="Extracted fact candidates"
            />
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-bold text-[#1f2937]">
                Evidence Operations
              </h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">
                Source governance should stay separate from article/entity
                match review. Confirmed matches become real evidence links;
                suggestions remain reviewable operational work.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <OperationCard
                label="Source Review"
                value={formatCount(data.summary.needsReview)}
                note="Sources marked needs review"
                href="/sources?status=needs_review"
                tone={data.summary.needsReview > 0 ? "amber" : "green"}
              />
              <OperationCard
                label="Unlinked Sources"
                value={formatCount(data.summary.unlinkedSources)}
                note="Need evidence links or archive-only classification"
                href="/sources?linkState=unlinked"
                tone={data.summary.unlinkedSources > 0 ? "amber" : "green"}
              />
              <OperationCard
                label="Match Review"
                value={formatCount(data.matchSummary.open)}
                note="Confirm matches to create evidence links"
                href="/sources/matches"
                tone={data.matchSummary.open > 0 ? "amber" : "green"}
              />
              <OperationCard
                label="Fact Review"
                value={formatCount(data.articleFactSummary.open)}
                note="Confirm extracted facts before field suggestions"
                href="/sources/facts"
                tone={data.articleFactSummary.open > 0 ? "amber" : "green"}
              />
              <OperationCard
                label="Restricted Sources"
                value={formatCount(data.summary.restrictedVisibility)}
                note="Internal or confidential visibility"
                tone={data.summary.restrictedVisibility > 0 ? "amber" : "neutral"}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <OperationCard
                label="Article Archive"
                value={formatCount(data.summary.tgeArticles)}
                note="TGE article metadata records"
                href="/sources?sourceType=tge_article"
              />
              <OperationCard
                label="Weak / Outdated / Rejected"
                value={formatCount(data.summary.weakOutdatedRejected)}
                note="Sources not currently export-eligible"
                href="/sources?quality=weak_outdated_rejected"
                tone={data.summary.weakOutdatedRejected > 0 ? "red" : "green"}
              />
              <OperationCard
                label="Duplicate Flags"
                value={formatCount(data.summary.duplicateFlagged)}
                note="Sources requiring duplicate review"
                href="/sources?duplicate=1"
                tone={data.summary.duplicateFlagged > 0 ? "red" : "green"}
              />
              <OperationCard
                label="Confirmed Matches"
                value={formatCount(data.matchSummary.confirmed)}
                note="Article/entity links confirmed"
                href="/sources/matches?status=confirmed"
                tone="green"
              />
            </div>
          </section>

          <section className="border border-gray-200 bg-white px-5 py-5">
            <form className="flex flex-col gap-4 xl:flex-row xl:items-end" action="/sources">
              {filters.linkState ? (
                <input type="hidden" name="linkState" value={filters.linkState} />
              ) : null}
              {filters.duplicate ? (
                <input type="hidden" name="duplicate" value={filters.duplicate} />
              ) : null}
              {filters.quality ? (
                <input type="hidden" name="quality" value={filters.quality} />
              ) : null}
              <label className="flex min-w-[260px] flex-[1.5] flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Search
                <input
                  name="search"
                  defaultValue={filters.search || ""}
                  placeholder="Title, URL, publisher, country..."
                  className="h-10 border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-[#1f2937] outline-none focus:border-[#8dc63f]"
                />
              </label>

              <SelectFilter
                label="Source Type"
                name="sourceType"
                value={filters.sourceType}
                options={data.referenceData.sourceTypes}
                allLabel="All source types"
              />
              <SelectFilter
                label="Visibility"
                name="visibility"
                value={filters.visibility}
                options={data.referenceData.visibilityLevels}
                allLabel="All visibility levels"
              />
              <SelectFilter
                label="Status"
                name="status"
                value={filters.status}
                options={data.referenceData.credibilityStatuses}
                allLabel="All statuses"
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center border border-[#8dc63f] bg-[#8dc63f] px-4 text-sm font-semibold text-white hover:bg-[#78ad35]"
                >
                  Apply
                </button>
                <Link
                  href="/sources"
                  className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                >
                  Reset
                </Link>
              </div>
            </form>
            {activeOperationalFilters.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                {activeOperationalFilters.map((label) => (
                  <span
                    key={label}
                    className="inline-flex min-h-[28px] items-center border border-amber-200 bg-amber-50 px-2 text-xs font-semibold text-amber-800"
                  >
                    {label}
                  </span>
                ))}
                <Link
                  href="/sources"
                  className="inline-flex min-h-[28px] items-center border border-gray-300 bg-white px-2 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                >
                  Clear operational filters
                </Link>
              </div>
            ) : null}
          </section>

          <SourcesTable sources={data.sources} total={data.summary.total} />
        </>
      )}
    </main>
  );
}
