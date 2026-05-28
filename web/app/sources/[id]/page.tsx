import Link from "next/link";
import { getServerSession } from "next-auth";
import type { ReactNode } from "react";
import { DetailPriorityMarker } from "@/components/postgres-preview/PostgresEntityDetail";
import PostgresFieldSuggestionsPanel from "@/components/postgres-preview/PostgresFieldSuggestionsPanel";
import PostgresRecordActionHub, {
  type PostgresRecordAction,
} from "@/components/postgres-preview/PostgresRecordActionHub";
import PostgresSectionJumpNav from "@/components/postgres-preview/PostgresSectionJumpNav";
import PostgresStatusBadge, {
  postgresStatusTone,
  type PostgresStatusTone,
} from "@/components/postgres-preview/PostgresStatusBadge";
import ArticleFactCandidatesClient from "@/components/sources/ArticleFactCandidatesClient";
import SourceMatchCandidatesClient from "@/components/sources/SourceMatchCandidatesClient";
import SourceStatusActions from "@/components/sources/SourceStatusActions";
import { authOptions } from "@/lib/auth/auth";
import { canReview, type UserRole } from "@/lib/auth/roles";
import { listPostgresFieldSuggestionCandidatesForSource } from "@/lib/postgres-preview";
import {
  countSourceMatchCandidates,
  getSourceById,
  listSourceMatchCandidates,
  type SourceDetail,
  type SourceLink,
} from "@/lib/services/sources";
import {
  countArticleFactCandidates,
  listArticleFactCandidates,
} from "@/lib/services/article-facts";
import { formatCount } from "@/lib/format";

export const dynamic = "force-dynamic";

type LifecycleState = "complete" | "attention" | "blocked" | "neutral";

type LifecycleStep = {
  title: string;
  state: LifecycleState;
  note: string;
};

type SourceDetailData =
  | {
      ok: true;
      source: SourceDetail | null;
    }
  | {
      ok: false;
      error: string;
    };

async function getSourceDetailData(id: string): Promise<SourceDetailData> {
  try {
    const source = await getSourceById(id);
    return { ok: true, source };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: message };
  }
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
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

function sourceStatusTone(status: string): PostgresStatusTone {
  return postgresStatusTone(status, "source");
}

function visibilityStatusTone(visibility: string): PostgresStatusTone {
  return postgresStatusTone(visibility, "visibility");
}

function confidenceStatusTone(status: string): PostgresStatusTone {
  return postgresStatusTone(status, "confidence");
}

function formatCode(value: string | null) {
  if (!value) {
    return "-";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\bmw\b/gi, "MW")
    .replace(/\bmwe\b/gi, "MWe")
    .replace(/\bmwth\b/gi, "MWth")
    .replace(/\bcod\b/gi, "COD");
}

const sourceDetailCardClass =
  "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]";
const sourceDetailSubtleCardClass =
  "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)]";
const sourceDetailEyebrowClass =
  "text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]";
const sourceDetailTitleClass = "font-bold text-[var(--tge-text-primary)]";
const sourceDetailMutedTextClass = "text-[var(--tge-governance-muted-text)]";
const sourceDetailBodyTextClass = "text-[var(--tge-text-secondary)]";
const sourceDetailLinkClass =
  "font-semibold text-[var(--tge-brand-green-dark)] hover:underline";
const sourceDetailSecondaryButtonClass =
  "inline-flex min-h-[28px] items-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 text-xs font-semibold text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)]";

function lifecycleStateLabel(state: LifecycleState) {
  if (state === "complete") {
    return "Complete";
  }

  if (state === "attention") {
    return "Needs Review";
  }

  if (state === "blocked") {
    return "Blocked";
  }

  return "Not Started";
}

function Badge({
  label,
  value,
  tone = "neutral",
}: {
  label: string | null;
  value?: string | null;
  tone?: PostgresStatusTone;
}) {
  return (
    <PostgresStatusBadge
      label={label || undefined}
      tone={tone}
      value={value || label || "unknown"}
    />
  );
}

function LifecycleBadge({ state }: { state: LifecycleState }) {
  const tones: Record<LifecycleState, PostgresStatusTone> = {
    complete: "success",
    attention: "attention",
    blocked: "danger",
    neutral: "neutral",
  };

  return (
    <PostgresStatusBadge
      label={lifecycleStateLabel(state)}
      tone={tones[state]}
      value={state}
    />
  );
}

function WorkflowStep({
  step,
  title,
  note,
}: {
  step: string;
  title: string;
  note: string;
}) {
  return (
    <div className={`${sourceDetailCardClass} px-4 py-4`}>
      <div className="inline-flex h-7 min-w-7 items-center justify-center border border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] px-2 text-xs font-bold text-[var(--tge-governance-success-text)]">
        {step}
      </div>
      <div className={`mt-3 text-sm ${sourceDetailTitleClass}`}>{title}</div>
      <p className={`mt-2 text-xs leading-5 ${sourceDetailMutedTextClass}`}>
        {note}
      </p>
    </div>
  );
}

function SourceGovernanceDetails() {
  return (
    <details className={sourceDetailCardClass}>
      <summary className="flex cursor-pointer list-none flex-col gap-2 px-5 py-4 marker:hidden md:flex-row md:items-center md:justify-between">
        <div>
          <div className={sourceDetailEyebrowClass}>Governance Model</div>
          <h2 className={`mt-1 text-base ${sourceDetailTitleClass}`}>
            Source Record -&gt; Review -&gt; Evidence Link -&gt; Candidate
          </h2>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--tge-brand-green-dark)]">
          Expand
        </span>
      </summary>
      <div className="grid grid-cols-1 gap-3 border-t border-[var(--tge-governance-neutral-border)] px-5 py-5 md:grid-cols-4">
        <WorkflowStep
          step="1"
          title="Source Record"
          note="Imported or manually added metadata, URL/reference, visibility, and source type."
        />
        <WorkflowStep
          step="2"
          title="Credibility Review"
          note="Editors mark whether the source is credible, weak, outdated, rejected, or pending."
        />
        <WorkflowStep
          step="3"
          title="Evidence Link"
          note="Confirmed links connect this source to projects, plants, or companies."
        />
        <WorkflowStep
          step="4"
          title="Fact / Candidate"
          note="Extracted facts and AI suggestions stay reviewable before affecting entity fields."
        />
      </div>
    </details>
  );
}

function StatusTile({
  label,
  value,
  note,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  note: string;
  tone?: PostgresStatusTone;
}) {
  const accents: Record<PostgresStatusTone, string> = {
    success: "border-l-[var(--tge-status-bar-success)]",
    attention: "border-l-[var(--tge-status-bar-attention)]",
    danger: "border-l-[var(--tge-status-bar-danger)]",
    info: "border-l-[var(--tge-status-bar-info)]",
    neutral: "border-l-[var(--tge-status-bar-neutral)]",
    muted: "border-l-[var(--tge-status-bar-muted)]",
    prospect: "border-l-[var(--tge-lifecycle-prospect-border)]",
    exploration: "border-l-[var(--tge-lifecycle-exploration-border)]",
    pre_feasibility: "border-l-[var(--tge-status-bar-pre-feasibility)]",
    feasibility: "border-l-[var(--tge-status-bar-feasibility)]",
    construction: "border-l-[var(--tge-status-bar-success)]",
    operating: "border-l-[var(--tge-status-bar-operating)]",
    cancelled: "border-l-[var(--tge-status-bar-danger)]",
    retired: "border-l-[var(--tge-lifecycle-retired-border)]",
    pilot: "border-l-[var(--tge-status-bar-attention)]",
  };

  return (
    <div
      className={`border border-l-4 border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-4 py-4 ${accents[tone]}`}
    >
      <div className={sourceDetailEyebrowClass}>{label}</div>
      <div className={`mt-2 text-2xl leading-none ${sourceDetailTitleClass}`}>
        {value}
      </div>
      <div className={`mt-2 text-xs leading-5 ${sourceDetailMutedTextClass}`}>
        {note}
      </div>
    </div>
  );
}

function SourceLifecyclePanel({ steps }: { steps: LifecycleStep[] }) {
  const activeStepCount = steps.filter(
    (step) => step.state === "attention" || step.state === "blocked"
  ).length;

  return (
    <details className={sourceDetailCardClass} open={activeStepCount > 0}>
      <summary className="flex cursor-pointer list-none flex-col gap-2 px-5 py-4 marker:hidden">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className={`text-lg ${sourceDetailTitleClass}`}>
              Source Lifecycle
            </h2>
            <p className={`mt-2 text-sm leading-6 ${sourceDetailBodyTextClass}`}>
              Current operational state from governed source entry through
              reviewed evidence and controlled AI-assisted updates.
            </p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--tge-brand-green-dark)]">
            {activeStepCount > 0
              ? `${formatCount(activeStepCount)} active`
              : "Expand"}
          </span>
        </div>
      </summary>
      <div className="divide-y divide-[var(--tge-governance-muted-border)]">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className="grid gap-3 px-5 py-4 sm:grid-cols-[32px_1fr_auto] sm:items-start"
          >
            <div className="flex h-8 w-8 items-center justify-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] text-xs font-bold text-[var(--tge-governance-neutral-text)]">
              {index + 1}
            </div>
            <div>
              <div className="font-semibold text-[var(--tge-text-primary)]">
                {step.title}
              </div>
              <p className={`mt-1 text-xs leading-5 ${sourceDetailMutedTextClass}`}>
                {step.note}
              </p>
            </div>
            <LifecycleBadge state={step.state} />
          </div>
        ))}
      </div>
    </details>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className={`${sourceDetailCardClass} px-4 py-4`}>
      <div className={sourceDetailEyebrowClass}>{label}</div>
      <div className="mt-2 text-sm leading-6 text-[var(--tge-text-primary)]">
        {value || "-"}
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  description,
  collapsible = false,
  defaultOpen = true,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const className = id
    ? `scroll-mt-6 ${sourceDetailCardClass}`
    : sourceDetailCardClass;

  if (collapsible) {
    return (
      <details id={id} className={className} open={defaultOpen}>
        <summary className="flex cursor-pointer list-none flex-col gap-2 border-b border-[var(--tge-governance-neutral-border)] px-5 py-4 marker:hidden sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className={`text-lg ${sourceDetailTitleClass}`}>{title}</h2>
            {description ? (
              <p className={`mt-1 max-w-3xl text-sm leading-6 ${sourceDetailBodyTextClass}`}>
                {description}
              </p>
            ) : null}
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--tge-brand-green-dark)]">
            Expand / collapse
          </span>
        </summary>
        <div className="px-5 py-5">{children}</div>
      </details>
    );
  }

  return (
    <section id={id} className={className}>
      <div className="border-b border-[var(--tge-governance-neutral-border)] px-5 py-4">
        <h2 className={`text-lg ${sourceDetailTitleClass}`}>{title}</h2>
        {description ? (
          <p className={`mt-1 max-w-3xl text-sm leading-6 ${sourceDetailBodyTextClass}`}>
            {description}
          </p>
        ) : null}
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

function entityHref(link: SourceLink) {
  if (link.entity_type === "project") {
    return `/postgres-preview/projects/${link.entity_id}`;
  }

  if (link.entity_type === "operating_asset") {
    return `/postgres-preview/operating-assets/${link.entity_id}`;
  }

  return `/postgres-preview/companies/${link.entity_id}`;
}

function entityTypeLabel(value: SourceLink["entity_type"]) {
  if (value === "operating_asset") {
    return "Plant";
  }

  if (value === "project") {
    return "Project";
  }

  return "Company";
}

function SourceSupportsPanel({
  links,
  openMatchCount,
}: {
  links: SourceLink[];
  openMatchCount: number;
}) {
  const groups: Array<{
    code: SourceLink["entity_type"];
    label: string;
    links: SourceLink[];
  }> = [
    {
      code: "project",
      label: "Projects",
      links: links.filter((link) => link.entity_type === "project"),
    },
    {
      code: "operating_asset",
      label: "Plants",
      links: links.filter((link) => link.entity_type === "operating_asset"),
    },
    {
      code: "company",
      label: "Companies",
      links: links.filter((link) => link.entity_type === "company"),
    },
  ];
  const primaryEvidenceCount = links.filter((link) => link.is_primary_evidence).length;
  const confidenceCounts = links.reduce<Record<string, number>>((acc, link) => {
    acc[link.confidence_status_code] =
      (acc[link.confidence_status_code] || 0) + 1;
    return acc;
  }, {});

  return (
    <section id="source-supports" className={`scroll-mt-6 ${sourceDetailCardClass}`}>
      <div className="border-b border-[var(--tge-governance-neutral-border)] px-5 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className={`text-lg ${sourceDetailTitleClass}`}>
              What This Source Supports
            </h2>
            <p className={`mt-2 text-sm leading-6 ${sourceDetailBodyTextClass}`}>
              Confirmed evidence relationships. This is the core bridge between
              source governance and geothermal entities.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              label={`${formatCount(links.length)} confirmed link${
                links.length === 1 ? "" : "s"
              }`}
              tone={links.length > 0 ? "success" : "attention"}
            />
            <Badge
              label={`${formatCount(openMatchCount)} open match${
                openMatchCount === 1 ? "" : "es"
              }`}
              tone={openMatchCount > 0 ? "attention" : "neutral"}
            />
          </div>
        </div>
      </div>

      {links.length === 0 ? (
        <div className="px-5 py-5">
          <div className="border border-dashed border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] px-5 py-5">
            <div className="font-semibold text-[var(--tge-governance-attention-text)]">
              No confirmed evidence links yet
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--tge-governance-attention-text)]">
              This source exists as a governed source, but it does not yet
              support a specific project, plant, or company. Review
              article match candidates or add an evidence link before using it
              in export-ready workflows.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 px-5 py-5 xl:grid-cols-[1fr_260px]">
          <div className="grid gap-3 md:grid-cols-3">
            {groups.map((group) => (
              <div key={group.code} className={sourceDetailSubtleCardClass}>
                <div className="border-b border-[var(--tge-governance-neutral-border)] px-4 py-3">
                  <div className={sourceDetailEyebrowClass}>{group.label}</div>
                  <div className="mt-1 text-2xl font-bold text-[var(--tge-text-primary)]">
                    {formatCount(group.links.length)}
                  </div>
                </div>
                <div className="divide-y divide-[var(--tge-governance-muted-border)]">
                  {group.links.slice(0, 4).map((link) => (
                    <div key={link.entity_source_id} className="px-4 py-3">
                      <Link
                        href={entityHref(link)}
                        className="font-semibold text-[var(--tge-text-primary)] hover:text-[var(--tge-brand-green-dark)] hover:underline"
                      >
                        {link.entity_name || "Unnamed entity"}
                      </Link>
                      <div className={`mt-1 text-xs leading-5 ${sourceDetailMutedTextClass}`}>
                        {link.country || "No country"} ·{" "}
                        {formatCode(link.linked_field)}
                      </div>
                    </div>
                  ))}
                  {group.links.length === 0 ? (
                    <div className={`px-4 py-4 text-sm ${sourceDetailMutedTextClass}`}>
                      No confirmed links.
                    </div>
                  ) : null}
                  {group.links.length > 4 ? (
                    <div className={`px-4 py-3 text-xs font-semibold ${sourceDetailMutedTextClass}`}>
                      +{formatCount(group.links.length - 4)} more in linked
                      evidence table
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className={`${sourceDetailSubtleCardClass} px-4 py-4`}>
            <div className={`text-sm ${sourceDetailTitleClass}`}>
              Evidence Confidence
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(confidenceCounts).map(([status, count]) => (
                <Badge
                  key={status}
                  label={`${formatCode(status)} · ${formatCount(count)}`}
                  tone={confidenceStatusTone(status)}
                />
              ))}
            </div>
            <div className={`mt-4 border-t border-[var(--tge-governance-neutral-border)] pt-4 text-xs leading-5 ${sourceDetailMutedTextClass}`}>
              {formatCount(primaryEvidenceCount)} primary evidence link
              {primaryEvidenceCount === 1 ? "" : "s"} marked. Confidence labels
              describe the evidence relationship, separate from the source
              credibility status.
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function SourceActionHub({
  source,
  openSourceMatchCount,
  openArticleFactCount,
  openFieldSuggestionCount,
  canReviewSource,
}: {
  source: SourceDetail;
  openSourceMatchCount: number;
  openArticleFactCount: number;
  openFieldSuggestionCount: number;
  canReviewSource: boolean;
}) {
  const blockerCount = source.credibility_status_code === "rejected" ? 1 : 0;
  const warningCount =
    (source.credibility_status_code === "credible" ? 0 : 1) +
    (source.linked_entity_count > 0 ? 0 : 1) +
    (openSourceMatchCount > 0 ? 1 : 0) +
    (openArticleFactCount > 0 ? 1 : 0) +
    (openFieldSuggestionCount > 0 ? 1 : 0);
  const actions: PostgresRecordAction[] = [
    {
      label: "Edit Source Metadata",
      detail:
        "Update title, URL/reference, source type, visibility, publication date, and notes.",
      href: `/sources/${source.source_id}/edit`,
      tone: "neutral",
    },
    {
      label: "Review Credibility",
      detail:
        source.credibility_status_code === "credible"
          ? "Source is currently marked credible for evidence use."
          : canReviewSource
            ? "Mark this source credible, weak, outdated, rejected, or needs review."
            : "Credibility changes require editor/admin permissions.",
      href: canReviewSource ? "#source-credibility-actions" : "#source-review-metadata",
      tone:
        source.credibility_status_code === "credible"
          ? "ready"
          : source.credibility_status_code === "rejected"
            ? "blocker"
            : "warning",
      primary: source.credibility_status_code !== "credible",
    },
    {
      label: "What It Supports",
      detail:
        source.linked_entity_count > 0
          ? `${formatCount(source.linked_entity_count)} confirmed evidence link${
              source.linked_entity_count === 1 ? "" : "s"
            } across projects, plants, or companies.`
          : "No confirmed evidence links yet. Review matches or link this source.",
      href: "#source-supports",
      tone: source.linked_entity_count > 0 ? "ready" : "warning",
    },
    {
      label: "Linked Evidence Table",
      detail:
        "Inspect linked fields, claims, extracted values, confidence, and primary evidence flags.",
      href: "#source-linked-evidence",
      tone: source.linked_entity_count > 0 ? "ready" : "neutral",
    },
  ];

  if (openSourceMatchCount > 0) {
    actions.push({
      label: "Review Match Candidates",
      detail: `${formatCount(openSourceMatchCount)} article/entity match candidate${
        openSourceMatchCount === 1 ? "" : "s"
      } waiting for review.`,
      href: `/sources/matches?sourceId=${source.source_id}`,
      tone: "warning",
    });
  }

  if (openArticleFactCount > 0) {
    actions.push({
      label: "Review Extracted Facts",
      detail: `${formatCount(openArticleFactCount)} fact candidate${
        openArticleFactCount === 1 ? "" : "s"
      } waiting for human review.`,
      href: `/sources/facts?sourceId=${source.source_id}`,
      tone: "warning",
    });
  }

  if (openFieldSuggestionCount > 0) {
    actions.push({
      label: "Review AI Suggestions",
      detail: `${formatCount(openFieldSuggestionCount)} field suggestion${
        openFieldSuggestionCount === 1 ? "" : "s"
      } connected to this source.`,
      href: "#source-ai-suggestions",
      tone: "warning",
    });
  }

  return (
    <PostgresRecordActionHub
      actions={actions}
      blockerCount={blockerCount}
      description="Use this as the operational entry point for this source: review credibility, confirm what it supports, inspect extracted facts, and control AI-assisted evidence workflows."
      title="Source Action Hub"
      warningCount={warningCount}
    />
  );
}

function LinkedEntityMobileField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div
        className={`text-[10px] font-semibold uppercase tracking-wide ${sourceDetailMutedTextClass}`}
      >
        {label}
      </div>
      <div className="mt-1 min-w-0 text-sm text-[var(--tge-governance-neutral-text)]">
        {children}
      </div>
    </div>
  );
}

function LinkedEntityTable({ links }: { links: SourceLink[] }) {
  return (
    <>
      <div className="divide-y divide-[var(--tge-governance-muted-border)] border border-[var(--tge-governance-neutral-border)] lg:hidden">
        {links.map((link) => (
          <article key={link.entity_source_id} className="px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <Link
                  className="font-semibold text-[var(--tge-text-primary)] hover:text-[var(--tge-brand-green-dark)] hover:underline"
                  href={entityHref(link)}
                >
                  {link.entity_name || "Unnamed entity"}
                </Link>
                <div className={`mt-1 text-xs ${sourceDetailMutedTextClass}`}>
                  {link.legacy_id || link.entity_id}
                </div>
              </div>
              <Badge
                label={formatCode(link.confidence_status_code)}
                value={link.confidence_status_code}
                tone={confidenceStatusTone(link.confidence_status_code)}
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <LinkedEntityMobileField label="Entity">
                {entityTypeLabel(link.entity_type)}
              </LinkedEntityMobileField>
              <LinkedEntityMobileField label="Country">
                {link.country || "-"}
              </LinkedEntityMobileField>
              <LinkedEntityMobileField label="Evidence">
                <div className="font-medium text-[var(--tge-text-primary)]">
                  {formatCode(link.evidence_type)}
                </div>
                {link.evidence_note ? (
                  <div className={`mt-2 text-xs leading-5 ${sourceDetailMutedTextClass}`}>
                    {link.evidence_note}
                  </div>
                ) : null}
              </LinkedEntityMobileField>
              <LinkedEntityMobileField label="Claim / Value">
                <div className={`text-xs font-semibold uppercase tracking-wide ${sourceDetailMutedTextClass}`}>
                  {formatCode(link.linked_field)}
                </div>
                {link.extracted_value ? (
                  <div className="mt-1 font-semibold text-[var(--tge-text-primary)]">
                    {link.extracted_value}
                  </div>
                ) : null}
                {link.claim_text ? (
                  <div className={`mt-2 text-xs leading-5 ${sourceDetailMutedTextClass}`}>
                    {link.claim_text}
                  </div>
                ) : null}
              </LinkedEntityMobileField>
              <LinkedEntityMobileField label="Confidence">
                <Badge
                  label={formatCode(link.confidence_status_code)}
                  value={link.confidence_status_code}
                  tone={confidenceStatusTone(link.confidence_status_code)}
                />
                {link.is_primary_evidence ? (
                  <div className="mt-2 text-xs font-semibold text-[var(--tge-brand-green-dark)]">
                    Primary evidence
                  </div>
                ) : null}
              </LinkedEntityMobileField>
              <LinkedEntityMobileField label="Updated">
                {formatDateTime(link.updated_at)}
              </LinkedEntityMobileField>
            </div>
          </article>
        ))}

        {links.length === 0 ? (
          <div className={`px-4 py-8 text-center text-sm ${sourceDetailMutedTextClass}`}>
            This source is not linked to a project, plant, or company yet.
          </div>
        ) : null}
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-[1080px] table-fixed text-left text-sm">
          <thead className="bg-[var(--tge-governance-neutral-bg)] text-[11px] uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
            <tr>
              <th className="w-[14%] px-4 py-3 font-semibold">Entity</th>
              <th className="w-[24%] px-4 py-3 font-semibold">Record</th>
              <th className="w-[11%] px-4 py-3 font-semibold">Country</th>
              <th className="w-[14%] px-4 py-3 font-semibold">Evidence</th>
              <th className="w-[18%] px-4 py-3 font-semibold">Claim / Value</th>
              <th className="w-[10%] px-4 py-3 font-semibold">Confidence</th>
              <th className="w-[9%] px-4 py-3 font-semibold">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--tge-governance-muted-border)]">
            {links.map((link) => (
              <tr
                key={link.entity_source_id}
                className="align-top hover:bg-[var(--tge-surface-subtle)]"
              >
                <td className="px-4 py-3 text-[var(--tge-governance-neutral-text)]">
                  {entityTypeLabel(link.entity_type)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    className="font-semibold text-[var(--tge-text-primary)] hover:text-[var(--tge-brand-green-dark)] hover:underline"
                    href={entityHref(link)}
                  >
                    {link.entity_name || "Unnamed entity"}
                  </Link>
                  <div className={`mt-1 text-xs ${sourceDetailMutedTextClass}`}>
                    {link.legacy_id || link.entity_id}
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--tge-governance-neutral-text)]">
                  {link.country || "-"}
                </td>
                <td className="px-4 py-3 text-[var(--tge-governance-neutral-text)]">
                  <div className="font-medium text-[var(--tge-text-primary)]">
                    {formatCode(link.evidence_type)}
                  </div>
                  {link.evidence_note ? (
                    <div className={`mt-2 text-xs leading-5 ${sourceDetailMutedTextClass}`}>
                      {link.evidence_note}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-[var(--tge-governance-neutral-text)]">
                  <div className={`text-xs font-semibold uppercase tracking-wide ${sourceDetailMutedTextClass}`}>
                    {formatCode(link.linked_field)}
                  </div>
                  {link.extracted_value ? (
                    <div className="mt-1 font-semibold text-[var(--tge-text-primary)]">
                      {link.extracted_value}
                    </div>
                  ) : null}
                  {link.claim_text ? (
                    <div className={`mt-2 text-xs leading-5 ${sourceDetailMutedTextClass}`}>
                      {link.claim_text}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    label={formatCode(link.confidence_status_code)}
                    value={link.confidence_status_code}
                    tone={confidenceStatusTone(link.confidence_status_code)}
                  />
                  {link.is_primary_evidence ? (
                    <div className="mt-2 text-xs font-semibold text-[var(--tge-brand-green-dark)]">
                      Primary evidence
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-[var(--tge-governance-neutral-text)]">
                  {formatDateTime(link.updated_at)}
                </td>
              </tr>
            ))}

            {links.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className={`px-4 py-8 text-center text-sm ${sourceDetailMutedTextClass}`}
                >
                  This source is not linked to a project, plant, or company yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SetupNotice({ error }: { error: string }) {
  return (
    <section className="border border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] px-5 py-5">
      <h2 className="text-lg font-bold text-[var(--tge-governance-attention-text)]">
        PostgreSQL Not Connected
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--tge-governance-attention-text)]">
        This source profile reads from Railway PostgreSQL. Run the app through
        Railway variables or set `DATABASE_PUBLIC_URL` / `DATABASE_URL` locally.
      </p>
      <p className="mt-3 text-xs text-[var(--tge-governance-attention-text)]">
        Error: {error}
      </p>
    </section>
  );
}

export default async function SourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getSourceDetailData(id);

  if (!data.ok) {
    return (
      <main className="space-y-6">
        <SetupNotice error={data.error} />
        <Link href="/sources" className={sourceDetailLinkClass}>
          Back to Sources / Documents
        </Link>
      </main>
    );
  }

  if (!data.source) {
    return (
      <main className="space-y-6">
        <section className={`${sourceDetailCardClass} p-8`}>
          <p className="text-base text-[var(--tge-governance-neutral-text)]">
            Source not found.
          </p>
          <Link
            href="/sources"
            className={`mt-4 inline-block text-sm ${sourceDetailLinkClass}`}
          >
            Back to Sources / Documents
          </Link>
        </section>
      </main>
    );
  }

  const source = data.source;
  const sourceTitle =
    source.title || source.url || source.source_reference || "Untitled source";
  const [
    session,
    sourceMatchCandidates,
    articleFactCandidates,
    openSourceMatchCount,
    openArticleFactCount,
    fieldSuggestionCandidates,
  ] = await Promise.all([
    getServerSession(authOptions),
    listSourceMatchCandidates({ sourceId: source.source_id, limit: 25 }),
    listArticleFactCandidates({ sourceId: source.source_id, limit: 25 }),
    countSourceMatchCandidates({
      sourceId: source.source_id,
      openOnly: true,
    }),
    countArticleFactCandidates({
      sourceId: source.source_id,
      openOnly: true,
    }),
    listPostgresFieldSuggestionCandidatesForSource(source.source_id),
  ]);
  const sessionUser = session?.user as
    | { role?: UserRole | string | null }
    | undefined;
  const canReviewSource = canReview(sessionUser?.role);
  const openFieldSuggestionCount = fieldSuggestionCandidates.filter(
    (candidate) =>
      !candidate.applied_at &&
      !["confirmed", "rejected", "superseded"].includes(
        candidate.suggestion_status_code
      )
  ).length;
  const confirmedArticleFactCount = articleFactCandidates.filter(
    (candidate) => candidate.fact_status_code === "confirmed"
  ).length;
  const appliedFieldSuggestionCount = fieldSuggestionCandidates.filter(
    (candidate) => Boolean(candidate.applied_at)
  ).length;
  const sourceLifecycleSteps: LifecycleStep[] = [
    {
      title: "Source record",
      state: "complete",
      note: "Metadata exists and this source is part of the governed source layer.",
    },
    {
      title: "Credibility review",
      state:
        source.credibility_status_code === "credible"
          ? "complete"
          : source.credibility_status_code === "rejected"
            ? "blocked"
            : "attention",
      note:
        source.credibility_status_code === "credible"
          ? "Reviewed as credible for evidence use."
          : source.credibility_status_code === "rejected"
            ? "Rejected sources should not support export-ready records."
            : "Needs editor review before it becomes strong evidence.",
    },
    {
      title: "Evidence links",
      state:
        source.linked_entity_count > 0
          ? "complete"
          : openSourceMatchCount > 0
            ? "attention"
            : "neutral",
      note:
        source.linked_entity_count > 0
          ? "Confirmed links show what this source supports."
          : openSourceMatchCount > 0
            ? "Open match candidates can become evidence links after review."
            : "No confirmed links or open match candidates yet.",
    },
    {
      title: "Extracted facts",
      state:
        openArticleFactCount > 0
          ? "attention"
          : confirmedArticleFactCount > 0
            ? "complete"
            : "neutral",
      note:
        openArticleFactCount > 0
          ? "Fact candidates are waiting for human review."
          : confirmedArticleFactCount > 0
            ? "Extracted facts have been confirmed but do not write fields."
            : "No extracted fact workflow is active for this source.",
    },
    {
      title: "AI field suggestions",
      state:
        openFieldSuggestionCount > 0
          ? "attention"
          : appliedFieldSuggestionCount > 0
            ? "complete"
            : "neutral",
      note:
        openFieldSuggestionCount > 0
          ? "Field suggestions need review before any audited apply step."
          : appliedFieldSuggestionCount > 0
            ? "At least one confirmed suggestion has been applied with audit."
            : "No field suggestions are active for this source.",
    },
  ];

  return (
    <main className="space-y-8">
      <section className={sourceDetailCardClass}>
        <div className="border-l-4 border-l-[var(--tge-brand-green)] px-8 py-8">
          <Link
            href="/sources"
            className={sourceDetailLinkClass}
          >
            Back to Sources / Documents
          </Link>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]">
                Source Profile
              </p>
              <h1 className="mt-3 max-w-5xl text-4xl font-bold tracking-tight text-[var(--tge-text-primary)]">
                {sourceTitle}
              </h1>
              <p className="mt-4 max-w-4xl text-base leading-7 text-[var(--tge-text-secondary)]">
                Operational evidence workspace for source metadata, credibility
                review, entity links, extracted fact candidates, and audited
                field suggestions.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                label={source.visibility_label || source.visibility_code}
                value={source.visibility_code}
                tone={visibilityStatusTone(source.visibility_code)}
              />
              <Badge
                label={
                  source.credibility_status_label ||
                  source.credibility_status_code
                }
                value={source.credibility_status_code}
                tone={sourceStatusTone(source.credibility_status_code)}
              />
              <Link
                href={`/sources/${source.source_id}/edit`}
                className={sourceDetailSecondaryButtonClass}
              >
                Edit Source
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PostgresSectionJumpNav
        items={[
          {
            href: "#source-triage",
            label: "Triage",
            note: "Readiness",
          },
          {
            href: "#source-metadata",
            label: "Metadata",
            note: "Reference",
          },
          {
            href: "#source-evidence-work",
            label: "Evidence Work",
            note: "Links",
          },
          {
            href: "#source-review-controls",
            label: "Review",
            note: "Governance",
          },
        ]}
      />

      <section id="source-triage" className="space-y-5 scroll-mt-24">
        <DetailPriorityMarker
          label="Core"
          title="Source Triage"
          description="Credibility, visibility, links, open review work."
          tone="core"
        />

        <SourceGovernanceDetails />

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <StatusTile
            label="Credibility"
            value={
              <span className="text-xl">
                {source.credibility_status_label ||
                  formatCode(source.credibility_status_code)}
              </span>
            }
            note="Current source review state"
            tone={sourceStatusTone(source.credibility_status_code)}
          />
          <StatusTile
            label="Visibility"
            value={
              <span className="text-xl">
                {source.visibility_label || formatCode(source.visibility_code)}
              </span>
            }
            note="Controls future export/subscriber exposure"
            tone={visibilityStatusTone(source.visibility_code)}
          />
          <StatusTile
            label="Evidence Links"
            value={formatCount(source.linked_entity_count)}
            note="Confirmed source-to-entity relationships"
            tone={source.linked_entity_count > 0 ? "success" : "attention"}
          />
          <StatusTile
            label="Open Matches"
            value={formatCount(openSourceMatchCount)}
            note="Article/entity candidates needing review"
            tone={openSourceMatchCount > 0 ? "attention" : "neutral"}
          />
          <StatusTile
            label="Open Facts"
            value={formatCount(openArticleFactCount)}
            note="Extracted fact candidates not finalized"
            tone={openArticleFactCount > 0 ? "attention" : "neutral"}
          />
          <StatusTile
            label="AI Suggestions"
            value={formatCount(openFieldSuggestionCount)}
            note="Reviewable field suggestions"
            tone={openFieldSuggestionCount > 0 ? "attention" : "neutral"}
          />
        </section>

        <SourceActionHub
          canReviewSource={canReviewSource}
          openArticleFactCount={openArticleFactCount}
          openFieldSuggestionCount={openFieldSuggestionCount}
          openSourceMatchCount={openSourceMatchCount}
          source={source}
        />

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <SourceSupportsPanel
            links={source.links}
            openMatchCount={openSourceMatchCount}
          />
          <SourceLifecyclePanel steps={sourceLifecycleSteps} />
        </section>
      </section>

      <section id="source-metadata" className="space-y-5 scroll-mt-24">
        <DetailPriorityMarker
          label="Core Record"
          title="Source Metadata"
          description="Reference, dates, summary, excerpt, notes, attachments."
          tone="core"
        />

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <DetailField
            label="Source Type"
            value={source.source_type_label || source.source_type_code}
          />
          <DetailField label="Country" value={source.country || "-"} />
          <DetailField
            label="Published"
            value={formatDate(source.published_date)}
          />
          <DetailField
            label="Accessed"
            value={formatDateTime(source.accessed_at)}
          />
          <DetailField
            label="Linked Records"
            value={formatCount(source.linked_entity_count)}
          />
        </section>

        <Section
          id="source-reference"
          title="Reference"
          description="URL, citation, publisher, language, and source access details."
          collapsible
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <DetailField
              label="URL"
              value={
                source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`break-all ${sourceDetailLinkClass}`}
                  >
                    {source.url}
                  </a>
                ) : (
                  "-"
                )
              }
            />
            <DetailField
              label="Reference"
              value={source.source_reference || source.publisher || "-"}
            />
            <DetailField
              label="Author / Organization"
              value={source.author_organization || "-"}
            />
            <DetailField label="Language" value={source.language_code || "-"} />
          </div>
        </Section>

        <Section
          id="source-summary-notes"
          title="Summary And Notes"
          description="Research notes, relevant excerpts, extracted summary, and attachments."
          collapsible
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <DetailField
              label="Extracted Summary"
              value={source.extracted_summary || "No extracted summary added yet."}
            />
            <DetailField
              label="Relevant Excerpt"
              value={source.relevant_excerpt || "No excerpt added yet."}
            />
            <DetailField
              label="Internal Notes"
              value={source.notes || "No notes added."}
            />
            <DetailField
              label="Attachment"
              value={
                source.attachment_url ? (
                  <a
                    href={source.attachment_url}
                    target="_blank"
                    rel="noreferrer"
                    className={`break-all ${sourceDetailLinkClass}`}
                  >
                    {source.attachment_url}
                  </a>
                ) : (
                  "No attachment URL added."
                )
              }
            />
          </div>
        </Section>
      </section>

      <section id="source-evidence-work" className="space-y-5 scroll-mt-24">
        <DetailPriorityMarker
          label="Workflow"
          title="Evidence Work"
          description="Evidence links, article matches, facts, AI suggestions."
          tone="workflow"
        />

        <Section
          id="source-linked-evidence"
          title="Linked Evidence"
          description={`${formatCount(source.links.length)} confirmed evidence link${
            source.links.length === 1 ? "" : "s"
          }. Open for full relationship detail, linked fields, claims, and confidence labels.`}
          collapsible
          defaultOpen={false}
        >
          <div className={`mb-4 grid gap-3 text-sm ${sourceDetailBodyTextClass} lg:grid-cols-3`}>
            <div className={`${sourceDetailSubtleCardClass} px-4 py-3`}>
              <div className="font-semibold text-[var(--tge-text-primary)]">
                Evidence link
              </div>
              <p className="mt-1 text-xs leading-5">
                A confirmed relationship between this source and a database
                record. It does not automatically change fields.
              </p>
            </div>
            <div className={`${sourceDetailSubtleCardClass} px-4 py-3`}>
              <div className="font-semibold text-[var(--tge-text-primary)]">
                Claim context
              </div>
              <p className="mt-1 text-xs leading-5">
                Linked field, extracted value, and evidence note explain what the
                source supports.
              </p>
            </div>
            <div className={`${sourceDetailSubtleCardClass} px-4 py-3`}>
              <div className="font-semibold text-[var(--tge-text-primary)]">
                Primary evidence
              </div>
              <p className="mt-1 text-xs leading-5">
                Primary evidence can later drive export readiness and confidence
                scoring.
              </p>
            </div>
          </div>
          <LinkedEntityTable links={source.links} />
        </Section>

        <div id="source-match-candidates" className="scroll-mt-6">
          <SourceMatchCandidatesClient candidates={sourceMatchCandidates} />
        </div>

        <div id="source-fact-candidates" className="scroll-mt-6">
          <ArticleFactCandidatesClient
            canReview={canReviewSource}
            candidates={articleFactCandidates}
          />
        </div>

        <PostgresFieldSuggestionsPanel
          id="source-ai-suggestions"
          canReviewStatus={canReviewSource}
          candidates={fieldSuggestionCandidates}
          collapseWhenIdle
          showEntity
        />
      </section>

      <section id="source-review-controls" className="space-y-5 scroll-mt-24">
        <DetailPriorityMarker
          label="Governance"
          title="Review Controls"
          description="Credibility actions and review metadata."
          tone="governance"
        />

        {canReviewSource ? (
          <div id="source-credibility-actions" className="scroll-mt-6">
            <SourceStatusActions
              sourceId={source.source_id}
              currentStatus={source.credibility_status_code}
            />
          </div>
        ) : null}

        <Section
          id="source-review-metadata"
          title="Review Metadata"
          description="Audit metadata for source creation, review ownership, and last update."
          collapsible
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
            <DetailField
              label="Added By"
              value={source.added_by_name || "Unknown"}
            />
            <DetailField
              label="Reviewed By"
              value={source.reviewed_by_name || "-"}
            />
            <DetailField
              label="Created"
              value={formatDateTime(source.created_at)}
            />
            <DetailField
              label="Updated"
              value={formatDateTime(source.updated_at)}
            />
          </div>
        </Section>
      </section>
    </main>
  );
}
