import Link from "next/link";
import {
  getSourceOperationalSummary,
  getSourceReferenceData,
  listSources,
  type SourceListItem,
  type SourceOperationalSummary,
  type SourceReferenceData,
  type SourceReferenceOption,
} from "@/lib/services/sources";
import { formatCount } from "@/lib/format";

export const dynamic = "force-dynamic";

type SourceSearchParams = {
  search?: string;
  sourceType?: string;
  visibility?: string;
  status?: string;
};

type SourcesData =
  | {
      ok: true;
      sources: SourceListItem[];
      summary: SourceOperationalSummary;
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
    const listParams = {
      search: params.search,
      sourceType: params.sourceType,
      visibility: params.visibility,
      status: params.status,
    };
    const [sources, referenceData, summary] = await Promise.all([
      listSources({
        limit: 100,
        ...listParams,
      }),
      getSourceReferenceData(),
      getSourceOperationalSummary(listParams),
    ]);

    return { ok: true, sources, summary, referenceData };
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
  };
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
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatTile
              label="Total Sources"
              value={formatCount(data.summary.total)}
              note="Records matching filters"
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
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <OperationCard
                label="Source Review"
                value={formatCount(data.summary.needsReview)}
                note="Sources marked needs review"
                href="/sources?status=needs_review"
                tone={data.summary.needsReview > 0 ? "amber" : "green"}
              />
              <OperationCard
                label="Article Archive"
                value={formatCount(data.summary.tgeArticles)}
                note="TGE article metadata records"
                href="/sources?sourceType=tge_article"
              />
              <OperationCard
                label="Match Review"
                value="Open"
                note="Review article/entity candidates"
                href="/sources/matches"
                tone="amber"
              />
              <OperationCard
                label="Restricted Sources"
                value={formatCount(data.summary.restrictedVisibility)}
                note="Internal or confidential visibility"
                tone={data.summary.restrictedVisibility > 0 ? "amber" : "neutral"}
              />
            </div>
          </section>

          <section className="border border-gray-200 bg-white px-5 py-5">
            <form className="flex flex-col gap-4 xl:flex-row xl:items-end" action="/sources">
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
          </section>

          <SourcesTable sources={data.sources} total={data.summary.total} />
        </>
      )}
    </main>
  );
}
