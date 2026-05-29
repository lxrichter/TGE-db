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
  "inline-flex min-h-[38px] items-center justify-center whitespace-nowrap border border-[var(--tge-brand-green)] bg-[var(--tge-brand-green)] px-4 py-2 text-sm font-semibold text-[var(--tge-surface-card)] hover:bg-[var(--tge-brand-green-dark)]";
const sourceSecondaryButtonClass =
  "inline-flex min-h-[38px] items-center justify-center whitespace-nowrap border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-4 py-2 text-sm font-semibold text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)]";
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
    <div>
      <div className={sourceEyebrowClass}>{label}</div>
      <div className={`mt-0.5 text-xl leading-none ${sourceTitleClass}`}>
        {value}
      </div>
      <div className={`mt-1 text-xs leading-5 ${sourceMutedTextClass}`}>
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
          <div className={`mt-1 text-xl leading-none ${sourceTitleClass}`}>
            {value}
          </div>
        </div>
        {href ? (
          <span className="text-xs font-semibold text-[var(--tge-brand-green-dark)]">
            Open
          </span>
        ) : null}
      </div>
      <div className={`mt-2 text-xs leading-5 ${sourceMutedTextClass}`}>
        {note}
      </div>
    </>
  );

  const className = `border px-3.5 py-3 transition ${postgresStatusToneClass(tone)} ${
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
  activeFilters,
}: {
  sources: SourceListItem[];
  total: number;
  activeFilters: Array<{ label: string; value: string }>;
}) {
  return (
    <section className={sourceCardClass}>
      <div className="flex flex-col gap-2 border-b border-[var(--tge-governance-neutral-border)] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className={`text-lg ${sourceTitleClass}`}>Source Records</h2>
          <p className={`mt-1 text-xs ${sourceMutedTextClass}`}>
            {sourceViewLabel(activeFilters)}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <span className={`text-xs font-semibold uppercase tracking-wide ${sourceMutedTextClass}`}>
            Showing {formatCount(sources.length)} of {formatCount(total)} matching
          </span>
          <div className={`mt-1 text-xs ${sourceMutedTextClass}`}>
            {activeFilters.length === 0
              ? "No active filters"
              : `${formatCount(activeFilters.length)} active filter${
                  activeFilters.length === 1 ? "" : "s"
                }`}
          </div>
        </div>
      </div>

      {activeFilters.length > 0 ? (
        <div className="flex flex-col gap-2 border-b border-[var(--tge-governance-neutral-border)] px-5 py-2.5 sm:flex-row sm:flex-wrap">
          {activeFilters.map((filter) => (
            <span
              key={`${filter.label}-${filter.value}`}
              className="inline-flex min-h-[28px] items-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] px-2.5 text-xs font-semibold text-[var(--tge-governance-neutral-text)]"
            >
              <span className={sourceMutedTextClass}>{filter.label}:</span>
              <span className="ml-1">{filter.value}</span>
            </span>
          ))}
        </div>
      ) : null}

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
              <th className="w-[30%] px-4 py-2.5 font-semibold">Source</th>
              <th className="w-[14%] px-4 py-2.5 font-semibold">Type</th>
              <th className="w-[12%] px-4 py-2.5 font-semibold">Visibility</th>
              <th className="w-[12%] px-4 py-2.5 font-semibold">Status</th>
              <th className="w-[12%] px-4 py-2.5 font-semibold">Country</th>
              <th className="w-[8%] px-4 py-2.5 font-semibold">Links</th>
              <th className="w-[12%] px-4 py-2.5 font-semibold">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--tge-governance-muted-border)]">
            {sources.map((source) => (
              <tr
                key={source.source_id}
                className="align-top hover:bg-[var(--tge-surface-subtle)]"
              >
                <td className="px-4 py-3">
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
                <td className="px-4 py-3 text-[var(--tge-governance-neutral-text)]">
                  {source.source_type_label || source.source_type_code}
                </td>
                <td className="px-4 py-3">
                  <PostgresStatusBadge
                    domain="visibility"
                    label={source.visibility_label || source.visibility_code}
                    value={source.visibility_code}
                  />
                </td>
                <td className="px-4 py-3">
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
                <td className="px-4 py-3 text-[var(--tge-governance-neutral-text)]">
                  {source.country || "-"}
                </td>
                <td className="px-4 py-3 font-semibold text-[var(--tge-text-primary)]">
                  {formatCount(source.linked_entity_count)}
                </td>
                <td className="px-4 py-3 text-[var(--tge-governance-neutral-text)]">
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
  return (
    <main className="space-y-7">
      <section className={sourceCardClass}>
        <div className="px-6 py-4 xl:px-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]">
                Evidence
              </p>
              <h1 className={`mt-2 text-2xl font-bold tracking-tight ${sourceTitleClass} xl:text-[2.2rem]`}>
                Sources & Documents
              </h1>
              <p className={`mt-2 max-w-4xl text-base leading-7 ${sourceBodyTextClass}`}>
                Evidence governance for source records, credibility, visibility,
                article matches, structured fact candidates, and record-level
                evidence links.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 xl:justify-end">
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
                className={sourcePrimaryButtonClass}
                href="/sources/new"
              >
                Add Source
              </Link>
            </div>
          </div>
        </div>

        {data.ok ? (
          <div className="border-t border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-6 py-3.5 xl:px-8">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 xl:grid-cols-4">
              <StatTile
                label="Sources"
                value={formatCount(data.summary.total)}
                note={`${formatCount(data.summary.credible)} credible · ${formatCount(
                  data.summary.tgeArticles
                )} TGE articles`}
              />
              <StatTile
                label="Evidence Links"
                value={formatCount(data.summary.linkedEvidence)}
                note={`${formatCount(
                  data.summary.unlinkedSources
                )} sources still unlinked`}
              />
              <StatTile
                label="Review Work"
                value={formatCount(data.summary.needsReview)}
                note={`${formatCount(
                  data.summary.weakOutdatedRejected
                )} weak/outdated · ${formatCount(
                  data.summary.duplicateFlagged
                )} duplicates`}
              />
              <StatTile
                label="AI Review"
                value={formatCount(
                  data.matchSummary.open + data.articleFactSummary.open
                )}
                note={`${formatCount(data.matchSummary.open)} matches · ${formatCount(
                  data.articleFactSummary.open
                )} facts`}
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
                href: "#source-workbench",
                label: "Workbench",
                note: "Records",
              },
              {
                href: "#source-queues",
                label: "Queues",
                note: "Evidence Work",
              },
              {
                href: "#source-model",
                label: "Model",
                note: "Governance",
              },
            ]}
          />

          <section id="source-workbench" className="space-y-5 scroll-mt-24">
            <DetailPriorityMarker
              label="Core"
              title="Source Workbench"
              description="Search, filter, and open governed source records."
              tone="core"
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

            <SourcesTable
              activeFilters={activeSourceFilters}
              sources={data.sources}
              total={data.summary.total}
            />
          </section>

          <section id="source-queues" className="space-y-5 scroll-mt-24">
            <DetailPriorityMarker
              label="Workflow"
              title="Evidence Queues"
              description="Review credibility, links, article matches, extracted facts."
              tone="workflow"
            />

            <section className={sourceCardClass}>
              <div className="grid gap-3 px-5 py-4 md:grid-cols-2 xl:grid-cols-4">
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
              </div>
            </section>

            <DisclosureSection
              defaultOpen={false}
              description="Secondary evidence governance queues remain available without competing with source record review."
              label="Governance"
              title="Secondary Evidence Queues"
            >
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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
            </DisclosureSection>
          </section>

          <section id="source-model" className="space-y-5 scroll-mt-24">
            <DetailPriorityMarker
              label="Governance"
              title="Evidence Model"
              description="Status language and source-to-evidence workflow."
              tone="governance"
            />

            <WorkflowStrip />

            <details className={sourceCardClass}>
              <summary className="flex cursor-pointer list-none flex-col gap-2 px-5 py-4 marker:hidden sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className={sourceEyebrowClass}>Status Language</div>
                  <h2 className={`mt-1 text-base ${sourceTitleClass}`}>
                    Source Status Meaning
                  </h2>
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
          </section>
        </>
      )}
    </main>
  );
}
