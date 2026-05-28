import Link from "next/link";
import type { ReactNode } from "react";
import type {
  PostgresEntitySourceLink,
  PostgresFieldSuggestionCandidate,
  PostgresResearchOpsIssue,
} from "@/lib/postgres-preview";
import { formatCount } from "@/lib/format";
import {
  formatStatusLabel,
  postgresStatusTone,
  postgresStatusToneClass,
  type PostgresStatusTone,
} from "@/components/postgres-preview/PostgresStatusBadge";

export type GovernanceTone = "green" | "amber" | "red" | "neutral";

export type GovernanceLifecycleState =
  | "complete"
  | "attention"
  | "blocked"
  | "neutral";

export type GovernanceLifecycleStep = {
  title: string;
  state: GovernanceLifecycleState;
  note: string;
};

export type GovernanceFieldSuggestionSummary = {
  open: number;
  applyReady: number;
  applied: number;
};

export function formatGovernanceCode(value: string | null | undefined) {
  return value ? formatStatusLabel(value) : "-";
}

export function governanceToneClass(tone: GovernanceTone) {
  const classes: Record<GovernanceTone, PostgresStatusTone> = {
    green: "success",
    amber: "attention",
    red: "danger",
    neutral: "neutral",
  };

  return postgresStatusToneClass(classes[tone]);
}

export function reviewStatusTone(status: string | null): GovernanceTone {
  const tone = postgresStatusTone(status, "review");

  if (tone === "success") {
    return "green";
  }

  if (tone === "attention" || tone === "info") {
    return "amber";
  }

  if (tone === "danger") {
    return "red";
  }

  return "neutral";
}

export function sourceCredibilityTone(status: string): GovernanceTone {
  const tone = postgresStatusTone(status, "source");

  if (tone === "success") {
    return "green";
  }

  if (tone === "danger") {
    return "red";
  }

  return tone === "attention" ? "amber" : "neutral";
}

export function signalTone({
  blockers,
  warnings,
  complete,
}: {
  blockers?: number;
  warnings?: number;
  complete?: boolean;
}): GovernanceTone {
  if ((blockers || 0) > 0) {
    return "red";
  }

  if ((warnings || 0) > 0) {
    return "amber";
  }

  return complete ? "green" : "neutral";
}

export function openResearchIssues(issues: PostgresResearchOpsIssue[]) {
  return issues.filter(
    (issue) =>
      !issue.resolved_at &&
      !["resolved", "closed", "rejected"].includes(issue.issue_status_code)
  );
}

export function fieldSuggestionCounts(
  candidates: PostgresFieldSuggestionCandidate[]
): GovernanceFieldSuggestionSummary {
  return {
    open: candidates.filter(
      (candidate) =>
        !candidate.applied_at &&
        !["confirmed", "rejected", "superseded"].includes(
          candidate.suggestion_status_code
        )
    ).length,
    applyReady: candidates.filter(
      (candidate) =>
        candidate.suggestion_status_code === "confirmed" && !candidate.applied_at
    ).length,
    applied: candidates.filter((candidate) => Boolean(candidate.applied_at)).length,
  };
}

export function GovernanceBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: GovernanceTone;
}) {
  return (
    <span
      className={`inline-flex min-h-[26px] items-center border px-2 text-[11px] font-semibold ${governanceToneClass(
        tone
      )}`}
    >
      {label}
    </span>
  );
}

export function GovernanceSignalCard({
  label,
  value,
  note,
  tone,
  children,
}: {
  label: string;
  value: ReactNode;
  note: string;
  tone: GovernanceTone;
  children?: ReactNode;
}) {
  const accents = {
    green: "border-l-[var(--tge-governance-success-border)]",
    amber: "border-l-[var(--tge-governance-attention-border)]",
    red: "border-l-[var(--tge-governance-danger-border)]",
    neutral: "border-l-[var(--tge-governance-neutral-border)]",
  };

  return (
    <div
      className={`border border-l-4 border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-4 py-4 ${accents[tone]}`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-text-secondary)]">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold leading-none text-[var(--tge-text-primary)]">
        {value}
      </div>
      <div className="mt-2 text-xs leading-5 text-[var(--tge-text-secondary)]">{note}</div>
      {children ? <div className="mt-3 flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}

function lifecycleLabel(state: GovernanceLifecycleState) {
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

export function GovernanceLifecyclePanel({
  title,
  description,
  steps,
}: {
  title: string;
  description: string;
  steps: GovernanceLifecycleStep[];
}) {
  const stateTone: Record<GovernanceLifecycleState, GovernanceTone> = {
    complete: "green",
    attention: "amber",
    blocked: "red",
    neutral: "neutral",
  };

  return (
    <section className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]">
      <div className="border-b border-[var(--tge-governance-neutral-border)] px-5 py-4">
        <h2 className="text-lg font-bold text-[var(--tge-text-primary)]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--tge-text-secondary)]">{description}</p>
      </div>
      <div className="divide-y divide-[var(--tge-governance-neutral-border)]">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className="grid gap-3 px-5 py-4 sm:grid-cols-[32px_1fr_auto] sm:items-start"
          >
            <div className="flex h-8 w-8 items-center justify-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-page)] text-xs font-bold text-[var(--tge-governance-neutral-text)]">
              {index + 1}
            </div>
            <div>
              <div className="font-semibold text-[var(--tge-text-primary)]">{step.title}</div>
              <p className="mt-1 text-xs leading-5 text-[var(--tge-text-secondary)]">{step.note}</p>
            </div>
            <GovernanceBadge
              label={lifecycleLabel(step.state)}
              tone={stateTone[step.state]}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export function GovernanceEvidenceSnapshot({
  sources,
  openSourceMatchCount,
  description,
  emptyMessage,
}: {
  sources: PostgresEntitySourceLink[];
  openSourceMatchCount: number;
  description: string;
  emptyMessage: string;
}) {
  const credibleSources = sources.filter(
    (source) => source.credibility_status_code === "credible"
  );
  const tgeArticles = sources.filter(
    (source) => source.source_type_code === "tge_article"
  );
  const primaryEvidence = sources.filter((source) => source.is_primary_evidence);
  const sortedSources = sources
    .slice()
    .sort((a, b) => {
      const aScore =
        (a.is_primary_evidence ? 4 : 0) +
        (a.credibility_status_code === "credible" ? 3 : 0) +
        (a.source_type_code === "tge_article" ? 1 : 0);
      const bScore =
        (b.is_primary_evidence ? 4 : 0) +
        (b.credibility_status_code === "credible" ? 3 : 0) +
        (b.source_type_code === "tge_article" ? 1 : 0);
      return bScore - aScore || b.updated_at.localeCompare(a.updated_at);
    });

  return (
    <section className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]">
      <div className="flex flex-col gap-3 border-b border-[var(--tge-governance-neutral-border)] px-5 py-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--tge-text-primary)]">Evidence Backbone</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--tge-text-secondary)]">
            {description}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap md:justify-end">
          <GovernanceBadge
            label={`${formatCount(credibleSources.length)}/${formatCount(
              sources.length
            )} credible`}
            tone={credibleSources.length > 0 ? "green" : "amber"}
          />
          <GovernanceBadge
            label={`${formatCount(openSourceMatchCount)} open match${
              openSourceMatchCount === 1 ? "" : "es"
            }`}
            tone={openSourceMatchCount > 0 ? "amber" : "neutral"}
          />
        </div>
      </div>

      <div className="grid gap-4 px-5 py-5 xl:grid-cols-[1fr_280px]">
        {sources.length === 0 ? (
          <div className="border border-dashed border-[var(--tge-governance-danger-border)] bg-[var(--tge-governance-danger-bg)] px-5 py-5">
            <div className="font-semibold text-[var(--tge-governance-danger-text)]">No confirmed evidence</div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--tge-governance-danger-text)]">
              {emptyMessage}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {sortedSources.slice(0, 4).map((source) => (
              <div
                key={source.entity_source_id}
                className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-4 py-4"
              >
                <Link
                  href={`/sources/${source.source_id}`}
                  className="font-semibold leading-6 text-[var(--tge-text-primary)] hover:text-[var(--tge-brand-green-dark)] hover:underline"
                >
                  {source.source_title || source.source_reference || "Untitled source"}
                </Link>
                <div className="mt-2 flex flex-wrap gap-2">
                  <GovernanceBadge
                    label={formatGovernanceCode(source.credibility_status_code)}
                    tone={sourceCredibilityTone(source.credibility_status_code)}
                  />
                  <GovernanceBadge
                    label={formatGovernanceCode(source.confidence_status_code)}
                  />
                  {source.is_primary_evidence ? (
                    <GovernanceBadge label="Primary evidence" tone="green" />
                  ) : null}
                </div>
                <div className="mt-3 text-xs leading-5 text-[var(--tge-text-secondary)]">
                  {source.evidence_type ? (
                    <div>
                      <span className="font-semibold text-[var(--tge-governance-neutral-text)]">Fact type:</span>{" "}
                      {formatGovernanceCode(source.evidence_type)}
                    </div>
                  ) : null}
                  {source.linked_field ? (
                    <div>
                      <span className="font-semibold text-[var(--tge-governance-neutral-text)]">Field:</span>{" "}
                      {formatGovernanceCode(source.linked_field)}
                    </div>
                  ) : null}
                  {source.extracted_value ? (
                    <div>
                      <span className="font-semibold text-[var(--tge-governance-neutral-text)]">Value:</span>{" "}
                      {source.extracted_value}
                    </div>
                  ) : null}
                  {source.claim_text ? (
                    <div className="mt-1 line-clamp-2">{source.claim_text}</div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-4 py-4">
          <div className="text-sm font-bold text-[var(--tge-text-primary)]">Evidence Coverage</div>
          <div className="mt-3 space-y-3 text-sm text-[var(--tge-governance-neutral-text)]">
            <div className="flex justify-between gap-3">
              <span>Total sources</span>
              <span className="font-bold text-[var(--tge-text-primary)]">
                {formatCount(sources.length)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Primary evidence</span>
              <span className="font-bold text-[var(--tge-text-primary)]">
                {formatCount(primaryEvidence.length)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span>TGE articles</span>
              <span className="font-bold text-[var(--tge-text-primary)]">
                {formatCount(tgeArticles.length)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Open article matches</span>
              <span className="font-bold text-[var(--tge-text-primary)]">
                {formatCount(openSourceMatchCount)}
              </span>
            </div>
          </div>
          <div className="mt-4 border-t border-[var(--tge-governance-neutral-border)] pt-4">
            <Link
              href="/sources/matches"
              className="inline-flex h-9 w-full items-center justify-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 text-xs font-semibold text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)]"
            >
              Review Article Matches
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
