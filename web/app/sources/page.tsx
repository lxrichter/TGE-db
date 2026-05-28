import Link from "next/link";
import type { ReactNode } from "react";
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
import PostgresStatusBadge, {
  postgresStatusToneClass,
  type PostgresStatusTone,
} from "@/components/postgres-preview/PostgresStatusBadge";
import PostgresStatusLegend from "@/components/postgres-preview/PostgresStatusLegend";
import { DetailPriorityMarker } from "@/components/postgres-preview/PostgresEntityDetail";
import PostgresSectionJumpNav from "@/components/postgres-preview/PostgresSectionJumpNav";

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

const sourceCardClass =
  "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]";
const sourceSubtleCardClass =
  "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)]";
const sourceEyebrowClass =
  "text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]";
const sourceTitleClass = "font-bold text-[var(--tge-text-primary)]";
const sourceMutedTextClass = "text-[var(--tge-governance-muted-text)]";
const sourceBodyTextClass = "text-[var(--tge-text-secondary)]";
const sourcePrimaryButtonClass =
  "inline-flex h-10 items-center justify-center border border-[var(--tge-brand-green)] bg-[var(--tge-brand-green)] px-4 text-sm font-semibold text-[var(--tge-surface-card)] hover:bg-[var(--tge-brand-green-dark)]";
const sourceSecondaryButtonClass =
  "inline-flex h-10 items-center justify-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-4 text-sm font-semibold text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)]";
const sourceInputClass =
  "h-10 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 text-sm font-medium normal-case tracking-normal text-[var(--tge-text-primary)] outline-none focus:border-[var(--tge-brand-green)]";

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
    <div className={`${sourceCardClass} px-4 py-4`}>
      <div className={sourceEyebrowClass}>{label}</div>
      <div className={`mt-2 text-3xl leading-none ${sourceTitleClass}`}>
        {value}
      </div>
      <div className={`mt-2 text-xs leading-5 ${sourceMutedTextClass}`}>
        {note}
      </div>
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
  tone?: PostgresStatusTone;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={sourceEyebrowClass}>{label}</div>
          <div className={`mt-2 text-2xl leading-none ${sourceTitleClass}`}>
            {value}
          </div>
        </div>
        {href ? (
          <span className="text-xs font-semibold text-[var(--tge-brand-green-dark)]">
            Open
          </span>
        ) : null}
      </div>
      <div className={`mt-3 text-xs leading-5 ${sourceMutedTextClass}`}>
        {note}
      </div>
    </>
  );

  const className = `border px-4 py-4 transition ${postgresStatusToneClass(tone)} ${
    href
      ? "hover:border-[var(--tge-brand-green)] hover:bg-[var(--tge-governance-success-bg)]"
      : ""
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
      note: "Confirmed link to project, plant, company, or market.",
    },
    {
      step: "4",
      label: "Fact / AI Candidate",
      note: "Extracted facts stay reviewable before field suggestions.",
    },
  ];

  return (
    <details className={sourceCardClass}>
      <summary className="flex cursor-pointer list-none flex-col gap-2 px-5 py-4 marker:hidden md:flex-row md:items-center md:justify-between">
        <div>
          <div className={sourceEyebrowClass}>Governance Model</div>
          <h2 className={`mt-1 text-base ${sourceTitleClass}`}>
            Source Record -&gt; Review -&gt; Evidence Link -&gt; Candidate
          </h2>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--tge-brand-green-dark)]">
          Expand
        </span>
      </summary>
      <div className="grid grid-cols-1 gap-2 border-t border-[var(--tge-governance-neutral-border)] px-5 py-5 md:grid-cols-4">
        {steps.map((item) => (
          <div
            key={item.step}
            className={`${sourceSubtleCardClass} px-4 py-4`}
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] text-xs font-bold text-[var(--tge-text-primary)]">
                {item.step}
              </span>
              <span className="text-xs font-bold uppercase tracking-wide text-[var(--tge-text-primary)]">
                {item.label}
              </span>
            </div>
            <div className={`mt-2 text-xs leading-5 ${sourceMutedTextClass}`}>
              {item.note}
            </div>
          </div>
        ))}
      </div>
    </details>
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
    <label
      className={`flex min-w-0 flex-1 flex-col gap-2 text-xs font-semibold uppercase tracking-wide ${sourceMutedTextClass}`}
    >
      {label}
      <select
        name={name}
        defaultValue={value || ""}
        className={sourceInputClass}
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

function sourceOptionLabel(options: SourceReferenceOption[], value?: string) {
  if (!value) {
    return undefined;
  }

  return options.find((option) => option.code === value)?.label || value;
}

function activeSourceFilterLabels(
  filters: SourceSearchParams,
  referenceData: SourceReferenceData
) {
  return [
    filters.search ? { label: "Search", value: filters.search } : null,
    filters.sourceType
      ? {
          label: "Source Type",
          value:
            sourceOptionLabel(referenceData.sourceTypes, filters.sourceType) ||
            filters.sourceType,
        }
      : null,
    filters.visibility
      ? {
          label: "Visibility",
          value:
            sourceOptionLabel(referenceData.visibilityLevels, filters.visibility) ||
            filters.visibility,
        }
      : null,
    filters.status
      ? {
          label: "Status",
          value:
            sourceOptionLabel(referenceData.credibilityStatuses, filters.status) ||
            filters.status,
        }
      : null,
    filters.linkState === "unlinked"
      ? { label: "Link State", value: "Unlinked sources" }
      : null,
    filters.linkState === "linked"
      ? { label: "Link State", value: "Linked sources" }
      : null,
    filters.duplicate === "1"
      ? { label: "Review Flags", value: "Duplicate flagged" }
      : null,
    filters.quality === "weak_outdated_rejected"
      ? { label: "Quality", value: "Weak / outdated / rejected" }
      : null,
  ].filter((filter): filter is { label: string; value: string } =>
    Boolean(filter)
  );
}

function sourceViewLabel(activeFilters: Array<{ label: string; value: string }>) {
  if (activeFilters.length === 0) {
    return "All Governed Sources";
  }

  if (activeFilters.length === 1) {
    return activeFilters[0].value;
  }

  return "Custom Source View";
}

function SourcesListContext({
  shownCount,
  total,
  activeFilters,
}: {
  shownCount: number;
  total: number;
  activeFilters: Array<{ label: string; value: string }>;
}) {
  return (
    <>
      <section className={sourceCardClass}>
        <div className="grid gap-4 px-5 py-4 lg:grid-cols-[1.1fr_1fr_auto] lg:items-center">
          <div>
            <div className={sourceEyebrowClass}>Current View</div>
            <div className={`mt-1 text-lg ${sourceTitleClass}`}>
              {sourceViewLabel(activeFilters)}
            </div>
            <div className={`mt-1 text-xs leading-5 ${sourceMutedTextClass}`}>
              {activeFilters.length === 0
                ? "No active filters"
                : `${formatCount(activeFilters.length)} active filter${
                    activeFilters.length === 1 ? "" : "s"
                  }`}
            </div>
          </div>
          <div>
            <div className={sourceEyebrowClass}>Results</div>
            <div className="mt-1 text-sm font-semibold text-[var(--tge-text-primary)]">
              Showing {formatCount(shownCount)} of {formatCount(total)} matching
              governed sources
            </div>
            <div className={`mt-1 text-xs leading-5 ${sourceMutedTextClass}`}>
              Source table currently shows the first {formatCount(shownCount)} sources.
            </div>
          </div>
          <div className={`text-xs leading-5 ${sourceMutedTextClass} lg:max-w-xs lg:text-right`}>
            Source export is not enabled yet. For now, exports remain available on
            project, plant, company, Research Ops, and candidate-review
            workflows where explicit export routes exist.
          </div>
        </div>
        {activeFilters.length > 0 ? (
          <div className="flex flex-col gap-2 border-t border-[var(--tge-governance-neutral-border)] px-5 py-3 sm:flex-row sm:flex-wrap">
            {activeFilters.map((filter) => (
              <span
                key={`${filter.label}-${filter.value}`}
                className="inline-flex min-h-8 items-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] px-3 text-xs font-semibold text-[var(--tge-governance-neutral-text)]"
              >
                <span className={sourceMutedTextClass}>{filter.label}:</span>
                <span className="ml-1">{filter.value}</span>
              </span>
            ))}
          </div>
        ) : null}
      </section>
      <details className={sourceCardClass}>
        <summary className="flex cursor-pointer list-none flex-col gap-2 px-5 py-4 marker:hidden sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className={sourceEyebrowClass}>Status Language</div>
            <h2 className={`mt-1 text-base ${sourceTitleClass}`}>
              Source Status Meaning
            </h2>
            <p className={`mt-1 max-w-3xl text-xs leading-5 ${sourceMutedTextClass}`}>
              Badge help for credibility, visibility, confidence, and review
              states.
            </p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--tge-brand-green-dark)]">
            Show badge guide
          </span>
        </summary>
        <div className="border-t border-[var(--tge-governance-neutral-border)]">
          <PostgresStatusLegend
            compact
            description="Sources use badges to separate source credibility, visibility restrictions, match confidence, and human review status."
            groups={["source", "visibility", "confidence", "review"]}
            title="Source Status Meaning"
          />
        </div>
      </details>
    </>
  );
}

function DisclosureSection({
  label,
  title,
  description,
  defaultOpen,
  children,
}: {
  label: string;
  title: string;
  description: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className={sourceCardClass} open={defaultOpen}>
      <summary className="flex cursor-pointer list-none flex-col gap-2 px-5 py-4 marker:hidden md:flex-row md:items-start md:justify-between">
        <div>
          <div className={sourceEyebrowClass}>{label}</div>
          <h2 className={`mt-1 text-lg ${sourceTitleClass}`}>{title}</h2>
          <p className={`mt-1 max-w-3xl text-sm leading-6 ${sourceBodyTextClass}`}>
            {description}
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

function SetupNotice({ error }: { error: string }) {
  return (
    <section className="border border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] px-5 py-5">
      <h2 className="text-lg font-bold text-[var(--tge-governance-attention-text)]">
        PostgreSQL Not Connected
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--tge-governance-attention-text)]">
        Sources / Documents currently reads from Railway PostgreSQL. Run the app
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

function SourceMobileField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div
        className={`text-[10px] font-semibold uppercase tracking-wide ${sourceMutedTextClass}`}
      >
        {label}
      </div>
      <div className="mt-1 min-w-0 text-sm text-[var(--tge-governance-neutral-text)]">
        {children}
      </div>
    </div>
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
    <section className={sourceCardClass}>
      <div className="flex flex-col gap-2 border-b border-[var(--tge-governance-neutral-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className={`text-lg ${sourceTitleClass}`}>Governed Sources</h2>
        <span className={`text-xs font-semibold uppercase tracking-wide ${sourceMutedTextClass}`}>
          Showing {formatCount(sources.length)} of {formatCount(total)} matching
        </span>
      </div>

      <div className="divide-y divide-[var(--tge-governance-muted-border)] lg:hidden">
        {sources.map((source) => (
          <article key={source.source_id} className="px-4 py-4 sm:px-5">
            <Link
              href={`/sources/${source.source_id}`}
              className="font-semibold text-[var(--tge-text-primary)] hover:text-[var(--tge-brand-green-dark)] hover:underline"
            >
              {source.title ||
                source.url ||
                source.source_reference ||
                "Untitled source"}
            </Link>
            <div className={`mt-1 line-clamp-2 break-all text-xs ${sourceMutedTextClass}`}>
              {source.url || source.source_reference || "No URL or reference added"}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <SourceMobileField label="Type">
                {source.source_type_label || source.source_type_code}
              </SourceMobileField>
              <SourceMobileField label="Visibility">
                <PostgresStatusBadge
                  domain="visibility"
                  label={source.visibility_label || source.visibility_code}
                  value={source.visibility_code}
                />
              </SourceMobileField>
              <SourceMobileField label="Status">
                <PostgresStatusBadge
                  domain="source"
                  label={
                    source.credibility_status_label ||
                    source.credibility_status_code
                  }
                  value={source.credibility_status_code}
                />
                {source.duplicate_source_flag ? (
                  <div className="mt-2 text-xs font-semibold text-[var(--tge-governance-danger-text)]">
                    Duplicate flag
                  </div>
                ) : null}
              </SourceMobileField>
              <SourceMobileField label="Country">
                {source.country || "-"}
              </SourceMobileField>
              <SourceMobileField label="Links">
                {formatCount(source.linked_entity_count)}
              </SourceMobileField>
              <SourceMobileField label="Updated">
                {formatDate(source.updated_at)}
                <div className={`mt-1 text-xs ${sourceMutedTextClass}`}>
                  by {source.reviewed_by_name || source.added_by_name || "unknown"}
                </div>
              </SourceMobileField>
            </div>
          </article>
        ))}

        {sources.length === 0 ? (
          <div className={`px-5 py-10 text-center text-sm ${sourceMutedTextClass}`}>
            No governed sources match the current filters. The source model
            and reference data are in place; source entry is ready for review
            workflow expansion.
          </div>
        ) : null}
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-[1080px] table-fixed text-left text-sm">
          <thead className="bg-[var(--tge-governance-neutral-bg)] text-[11px] uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
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
          <tbody className="divide-y divide-[var(--tge-governance-muted-border)]">
            {sources.map((source) => (
              <tr
                key={source.source_id}
                className="align-top hover:bg-[var(--tge-surface-subtle)]"
              >
                <td className="px-5 py-4">
                  <Link
                    href={`/sources/${source.source_id}`}
                    className="font-semibold text-[var(--tge-text-primary)] hover:text-[var(--tge-brand-green-dark)] hover:underline"
                  >
                    {source.title || source.url || source.source_reference || "Untitled source"}
                  </Link>
                  <div className={`mt-1 line-clamp-2 text-xs ${sourceMutedTextClass}`}>
                    {source.url || source.source_reference || "No URL or reference added"}
                  </div>
                </td>
                <td className="px-5 py-4 text-[var(--tge-governance-neutral-text)]">
                  {source.source_type_label || source.source_type_code}
                </td>
                <td className="px-5 py-4">
                  <PostgresStatusBadge
                    domain="visibility"
                    label={source.visibility_label || source.visibility_code}
                    value={source.visibility_code}
                  />
                </td>
                <td className="px-5 py-4">
                  <PostgresStatusBadge
                    domain="source"
                    label={
                      source.credibility_status_label ||
                      source.credibility_status_code
                    }
                    value={source.credibility_status_code}
                  />
                  {source.duplicate_source_flag ? (
                    <div className="mt-2 text-xs font-semibold text-[var(--tge-governance-danger-text)]">
                      Duplicate flag
                    </div>
                  ) : null}
                </td>
                <td className="px-5 py-4 text-[var(--tge-governance-neutral-text)]">
                  {source.country || "-"}
                </td>
                <td className="px-5 py-4 text-[var(--tge-governance-neutral-text)]">
                  {formatCount(source.linked_entity_count)}
                </td>
                <td className="px-5 py-4 text-[var(--tge-governance-neutral-text)]">
                  {formatDate(source.updated_at)}
                  <div className={`mt-1 text-xs ${sourceMutedTextClass}`}>
                    by {source.reviewed_by_name || source.added_by_name || "unknown"}
                  </div>
                </td>
              </tr>
            ))}

            {sources.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className={`px-5 py-10 text-center text-sm ${sourceMutedTextClass}`}
                >
                  No governed sources match the current filters. The source
                  model and reference data are in place; source entry is ready
                  for review workflow expansion.
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
  const activeSourceFilters = data.ok
    ? activeSourceFilterLabels(filters, data.referenceData)
    : [];
  const openEvidenceWorkCount = data.ok
    ? data.summary.needsReview +
      data.summary.unlinkedSources +
      data.summary.weakOutdatedRejected +
      data.summary.duplicateFlagged +
      data.matchSummary.open +
      data.articleFactSummary.open
    : 0;

  return (
    <main className="space-y-6 sm:space-y-8">
      <section className={sourceCardClass}>
        <div className="border-l-4 border-l-[var(--tge-brand-green)] px-5 py-6 sm:px-8 sm:py-8">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]">
            Sources / Documents
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--tge-text-primary)] sm:text-4xl">
                Evidence Backbone
              </h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--tge-text-secondary)] sm:mt-4 sm:text-base sm:leading-7">
                Governed sources, evidence links, credibility, and visibility
                controls. This page is the working surface for validation and
                future AI-ready source management.
              </p>
            </div>
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 lg:w-auto lg:flex lg:flex-wrap">
              <Link
                className={sourceSecondaryButtonClass}
                href="/sources/facts"
              >
                Review Article Facts
              </Link>
              <Link
                className={sourceSecondaryButtonClass}
                href="/sources/matches"
              >
                Review Article Matches
              </Link>
              <Link
                className={sourceSecondaryButtonClass}
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
          <PostgresSectionJumpNav
            items={[
              {
                href: "#source-triage",
                label: "Triage",
                note: "Coverage",
              },
              {
                href: "#source-queues",
                label: "Queues",
                note: "Evidence Work",
              },
              {
                href: "#source-workbench",
                label: "Workbench",
                note: "Records",
              },
            ]}
          />

          <section id="source-triage" className="space-y-5 scroll-mt-24">
            <DetailPriorityMarker
              label="Core"
              title="Evidence Triage"
              description="Coverage, credibility, source gaps, review queues."
              tone="core"
            />

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
              <StatTile
                label="Total Sources"
                value={formatCount(data.summary.total)}
                note="Sources matching filters"
              />
              <StatTile
                label="Credible"
                value={formatCount(data.summary.credible)}
                note="Reviewed governed sources"
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
                note="Project/plant/company links"
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

            <WorkflowStrip />
          </section>

          <section id="source-queues" className="space-y-5 scroll-mt-24">
            <DetailPriorityMarker
              label="Workflow"
              title="Evidence Queues"
              description="Review credibility, links, article matches, extracted facts."
              tone="workflow"
            />

            <DisclosureSection
              defaultOpen={openEvidenceWorkCount > 0}
              description="Source governance stays separate from article/entity match review. Confirmed matches become real evidence links; suggestions remain reviewable operational work."
              label="Workflow"
              title="Evidence Operations"
            >
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <OperationCard
                    label="Source Review"
                    value={formatCount(data.summary.needsReview)}
                    note="Sources marked needs review"
                    href="/sources?status=needs_review"
                    tone={data.summary.needsReview > 0 ? "attention" : "success"}
                  />
                  <OperationCard
                    label="Unlinked Sources"
                    value={formatCount(data.summary.unlinkedSources)}
                    note="Need evidence links or archive-only classification"
                    href="/sources?linkState=unlinked"
                    tone={
                      data.summary.unlinkedSources > 0 ? "attention" : "success"
                    }
                  />
                  <OperationCard
                    label="Match Review"
                    value={formatCount(data.matchSummary.open)}
                    note="Confirm matches to create evidence links"
                    href="/sources/matches"
                    tone={data.matchSummary.open > 0 ? "attention" : "success"}
                  />
                  <OperationCard
                    label="Fact Review"
                    value={formatCount(data.articleFactSummary.open)}
                    note="Confirm extracted facts before field suggestions"
                    href="/sources/facts"
                    tone={
                      data.articleFactSummary.open > 0 ? "attention" : "success"
                    }
                  />
                  <OperationCard
                    label="Restricted Sources"
                    value={formatCount(data.summary.restrictedVisibility)}
                    note="Internal or confidential visibility"
                    tone={
                      data.summary.restrictedVisibility > 0
                        ? "attention"
                        : "neutral"
                    }
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <OperationCard
                    label="Article Archive"
                    value={formatCount(data.summary.tgeArticles)}
                    note="TGE article metadata"
                    href="/sources?sourceType=tge_article"
                  />
                  <OperationCard
                    label="Weak / Outdated / Rejected"
                    value={formatCount(data.summary.weakOutdatedRejected)}
                    note="Sources not currently export-eligible"
                    href="/sources?quality=weak_outdated_rejected"
                    tone={
                      data.summary.weakOutdatedRejected > 0 ? "danger" : "success"
                    }
                  />
                  <OperationCard
                    label="Duplicate Flags"
                    value={formatCount(data.summary.duplicateFlagged)}
                    note="Sources requiring duplicate review"
                    href="/sources?duplicate=1"
                    tone={
                      data.summary.duplicateFlagged > 0 ? "danger" : "success"
                    }
                  />
                  <OperationCard
                    label="Confirmed Matches"
                    value={formatCount(data.matchSummary.confirmed)}
                    note="Article/entity links confirmed"
                    href="/sources/matches?status=confirmed"
                    tone="success"
                  />
                </div>
              </div>
            </DisclosureSection>
          </section>

          <section id="source-workbench" className="space-y-5 scroll-mt-24">
            <DetailPriorityMarker
              label="Governance"
              title="Source Workbench"
              description="Detailed filters and governed sources."
              tone="governance"
            />

            <DisclosureSection
              defaultOpen={
                activeSourceFilters.length > 0 ||
                activeOperationalFilters.length > 0
              }
              description="Use detailed filters when narrowing the source table for source review, evidence gaps, or archive cleanup."
              label="Workbench"
              title="Detailed Source Filters"
            >
              <form
                className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.5fr)_repeat(3,minmax(170px,1fr))_auto] xl:items-end"
                action="/sources"
              >
                {filters.linkState ? (
                  <input type="hidden" name="linkState" value={filters.linkState} />
                ) : null}
                {filters.duplicate ? (
                  <input type="hidden" name="duplicate" value={filters.duplicate} />
                ) : null}
                {filters.quality ? (
                  <input type="hidden" name="quality" value={filters.quality} />
                ) : null}
                <label
                  className={`flex min-w-0 flex-col gap-2 text-xs font-semibold uppercase tracking-wide ${sourceMutedTextClass}`}
                >
                  Search
                  <input
                    name="search"
                    defaultValue={filters.search || ""}
                    placeholder="Title, URL, publisher, country..."
                    className={sourceInputClass}
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

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex">
                  <button
                    type="submit"
                    className={sourcePrimaryButtonClass}
                  >
                    Apply
                  </button>
                  <Link
                    href="/sources"
                    className={sourceSecondaryButtonClass}
                  >
                    Reset
                  </Link>
                </div>
              </form>
              {activeOperationalFilters.length > 0 ? (
                <div className="mt-4 flex flex-col gap-2 border-t border-[var(--tge-governance-muted-border)] pt-4 sm:flex-row sm:flex-wrap">
                  {activeOperationalFilters.map((label) => (
                    <span
                      key={label}
                      className="inline-flex min-h-[28px] items-center border border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] px-2 text-xs font-semibold text-[var(--tge-governance-attention-text)]"
                    >
                      {label}
                    </span>
                  ))}
                  <Link
                    href="/sources"
                    className="inline-flex min-h-[28px] items-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-2 text-xs font-semibold text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)]"
                  >
                    Clear operational filters
                  </Link>
                </div>
              ) : null}
            </DisclosureSection>

            <SourcesListContext
              activeFilters={activeSourceFilters}
              shownCount={data.sources.length}
              total={data.summary.total}
            />

            <SourcesTable sources={data.sources} total={data.summary.total} />
          </section>
        </>
      )}
    </main>
  );
}
