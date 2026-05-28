"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  PostgresFieldSuggestionAction,
  PostgresFieldSuggestionCandidate,
} from "@/lib/postgres-preview";
import { formatCount } from "@/lib/format";
import { postgresStatusClassForValue } from "@/components/postgres-preview/PostgresStatusBadge";

function formatConfidence(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

function sourceHref(candidate: PostgresFieldSuggestionCandidate) {
  return candidate.source_id ? `/sources/${candidate.source_id}` : null;
}

function entityHref(candidate: PostgresFieldSuggestionCandidate) {
  if (candidate.entity_type === "project") {
    return `/postgres-preview/projects/${candidate.entity_id}`;
  }

  if (candidate.entity_type === "operating_asset") {
    return `/postgres-preview/operating-assets/${candidate.entity_id}`;
  }

  return `/postgres-preview/companies/${candidate.entity_id}`;
}

function entityTypeLabel(value: string) {
  if (value === "operating_asset") {
    return "Plant";
  }

  if (value === "project") {
    return "Project";
  }

  if (value === "company") {
    return "Company";
  }

  return value.replaceAll("_", " ");
}

function workflowLabel(candidate: PostgresFieldSuggestionCandidate) {
  if (candidate.applied_at) {
    return "Applied To Record";
  }

  if (candidate.suggestion_status_code === "confirmed") {
    return "Confirmed, Not Written";
  }

  if (candidate.suggestion_status_code === "rejected") {
    return "Rejected";
  }

  if (candidate.suggestion_status_code === "superseded") {
    return "Superseded";
  }

  return "Open Review";
}

function workflowTone(candidate: PostgresFieldSuggestionCandidate) {
  if (candidate.applied_at) {
    return postgresStatusClassForValue("applied_to_record", "confidence");
  }

  if (candidate.suggestion_status_code === "confirmed") {
    return postgresStatusClassForValue("confirmed_not_written", "confidence");
  }

  if (candidate.suggestion_status_code === "rejected") {
    return postgresStatusClassForValue("rejected", "confidence");
  }

  return postgresStatusClassForValue("open_review", "confidence");
}

function fieldContext(candidate: PostgresFieldSuggestionCandidate) {
  return candidate.current_value && candidate.current_value.trim()
    ? "Existing value present"
    : "Fills empty field";
}

function secondaryActionClass() {
  return "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] font-semibold text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)]";
}

function summaryChipClass(tone: "neutral" | "success" = "neutral") {
  if (tone === "success") {
    return "inline-flex h-8 items-center border border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] px-3 text-xs font-semibold text-[var(--tge-governance-success-text)]";
  }

  return "inline-flex h-8 items-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] px-3 text-xs font-semibold text-[var(--tge-governance-neutral-text)]";
}

function PaginationBar({
  page,
  pageCount,
  pageStart,
  pageEnd,
  total,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  pageStart: number;
  pageEnd: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) {
    return (
      <div className="border-b border-[var(--tge-governance-muted-border)] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
        Showing {formatCount(total)} suggestion{total === 1 ? "" : "s"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 border-b border-[var(--tge-governance-muted-border)] px-5 py-3 text-sm text-[var(--tge-text-secondary)] md:flex-row md:items-center md:justify-between">
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
        Showing {formatCount(pageStart)}-{formatCount(pageEnd)} of{" "}
        {formatCount(total)} suggestions
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <button
          className={`h-8 flex-1 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none ${secondaryActionClass()}`}
          disabled={page <= 1}
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Previous
        </button>
        <span className={summaryChipClass()}>
          Page {formatCount(page)} / {formatCount(pageCount)}
        </span>
        <button
          className={`h-8 flex-1 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none ${secondaryActionClass()}`}
          disabled={page >= pageCount}
          type="button"
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function PostgresFieldSuggestionsPanel({
  candidates,
  canReviewStatus,
  collapseWhenIdle = false,
  id,
  showEntity = false,
}: {
  candidates: PostgresFieldSuggestionCandidate[];
  canReviewStatus: boolean;
  collapseWhenIdle?: boolean;
  id?: string;
  showEntity?: boolean;
}) {
  const router = useRouter();
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const [busyCandidateId, setBusyCandidateId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const openCount = candidates.filter(
    (candidate) =>
      !["confirmed", "rejected", "superseded"].includes(
        candidate.suggestion_status_code
      ) && !candidate.applied_at
  ).length;
  const applyReadyCount = candidates.filter(
    (candidate) =>
      candidate.suggestion_status_code === "confirmed" && !candidate.applied_at
  ).length;
  const activeReviewCount = openCount + applyReadyCount;
  const appliedCount = candidates.filter((candidate) =>
    Boolean(candidate.applied_at)
  ).length;
  const pageCount = Math.max(1, Math.ceil(candidates.length / pageSize));
  const clampedPage = Math.min(page, pageCount);
  const pageStartIndex = (clampedPage - 1) * pageSize;
  const pageItems = candidates.slice(pageStartIndex, pageStartIndex + pageSize);
  const pageStart = candidates.length === 0 ? 0 : pageStartIndex + 1;
  const pageEnd = Math.min(pageStartIndex + pageItems.length, candidates.length);

  async function submitAction(
    candidate: PostgresFieldSuggestionCandidate,
    action: PostgresFieldSuggestionAction
  ) {
    if (!canReviewStatus || candidate.suggestion_status_code === "superseded") {
      return;
    }

    if (
      action === "apply" &&
      !window.confirm(
        `Apply this confirmed suggestion to ${candidate.entity_name}? This is the audited database write step and should only be used after human review.`
      )
    ) {
      return;
    }

    setBusyCandidateId(candidate.field_suggestion_candidate_id);
    setMessage(null);

    try {
      const response = await fetch("/api/postgres/field-suggestion-candidates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          candidateIds: [candidate.field_suggestion_candidate_id],
        }),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
        result?: {
          requested?: number;
          updated?: number;
          applied?: number;
          skipped?: number;
        };
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Field suggestion update failed.");
      }

      if (action === "apply") {
        setMessage(
          `Applied ${formatCount(
            payload.result?.applied || 0
          )} confirmed suggestion; skipped ${formatCount(
            payload.result?.skipped || 0
          )}.`
        );
      } else {
        setMessage(
          `Updated ${formatCount(payload.result?.updated || 0)} suggestion.`
        );
      }
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Field suggestion update failed."
      );
    } finally {
      setBusyCandidateId(null);
    }
  }

  const content = (
    <>
      {message ? (
        <div className="border-b border-[var(--tge-governance-muted-border)] px-5 py-3 text-xs leading-5 text-[var(--tge-text-secondary)]">
          {message}
        </div>
      ) : null}

      {candidates.length === 0 ? (
        <div className="px-5 py-5">
          <div className="border border-dashed border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-4 py-5 text-sm leading-6 text-[var(--tge-text-secondary)]">
            No field suggestions are attached to this record yet. This is
            expected until source/article review and extraction workflows begin
            writing candidates.
          </div>
        </div>
      ) : (
        <>
          <PaginationBar
            page={clampedPage}
            pageCount={pageCount}
            pageEnd={pageEnd}
            pageStart={pageStart}
            total={candidates.length}
            onPageChange={setPage}
          />
          <div className="overflow-x-auto">
            <table
              className={`table-fixed text-left text-sm ${
                showEntity ? "min-w-[1120px]" : "min-w-[980px]"
              }`}
            >
              <thead className="bg-[var(--tge-governance-neutral-bg)] text-[11px] uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
                <tr>
                  {showEntity ? (
                    <th className="w-[18%] px-4 py-3 font-semibold">Record</th>
                  ) : null}
                  <th className="w-[13%] px-4 py-3 font-semibold">Field</th>
                  <th className="w-[15%] px-4 py-3 font-semibold">Current</th>
                  <th className="w-[17%] px-4 py-3 font-semibold">Suggested</th>
                  <th className="w-[17%] px-4 py-3 font-semibold">Evidence</th>
                  <th className="w-[9%] px-4 py-3 font-semibold">Confidence</th>
                  <th className="w-[9%] px-4 py-3 font-semibold">Status</th>
                  <th className="w-[12%] px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--tge-governance-muted-border)]">
                {pageItems.map((candidate) => {
                  const href = sourceHref(candidate);
                  const targetHref = entityHref(candidate);
                  const isBusy =
                    busyCandidateId === candidate.field_suggestion_candidate_id;
                  const isSuperseded =
                    candidate.suggestion_status_code === "superseded";
                  const isApplied = Boolean(candidate.applied_at);
                  const isApplyReady =
                    candidate.suggestion_status_code === "confirmed" &&
                    !isApplied;

                  return (
                    <tr
                      key={candidate.field_suggestion_candidate_id}
                      className="align-top hover:bg-[var(--tge-surface-subtle)]"
                    >
                      {showEntity ? (
                        <td className="px-4 py-3">
                          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
                            {entityTypeLabel(candidate.entity_type)}
                          </div>
                          <Link
                            href={targetHref}
                            className="mt-1 block font-semibold text-[var(--tge-text-primary)] hover:text-[var(--tge-brand-green-dark)] hover:underline"
                          >
                            {candidate.entity_name}
                          </Link>
                          <div className="mt-1 text-xs text-[var(--tge-governance-muted-text)]">
                            {candidate.country || "No country"}
                          </div>
                        </td>
                      ) : null}
                      <td className="px-4 py-3 font-semibold text-[var(--tge-text-primary)]">
                        {candidate.field_name}
                        <div className="mt-1 text-xs font-normal text-[var(--tge-governance-muted-text)]">
                          {formatDate(candidate.generated_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--tge-governance-neutral-text)]">
                        {candidate.current_value || "-"}
                        <div className="mt-2 text-xs font-semibold text-[var(--tge-governance-muted-text)]">
                          {fieldContext(candidate)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--tge-governance-neutral-text)]">
                        <span className="font-semibold text-[var(--tge-text-primary)]">
                          {candidate.suggested_value}
                        </span>
                        {candidate.suggestion_reason ? (
                          <div className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--tge-governance-muted-text)]">
                            {candidate.suggestion_reason}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-[var(--tge-governance-neutral-text)]">
                        {href ? (
                          <Link
                            href={href}
                            className="line-clamp-2 font-semibold text-[var(--tge-brand-green-dark)] hover:underline"
                          >
                            {candidate.source_title ||
                              candidate.source_reference ||
                              "Open source"}
                          </Link>
                        ) : (
                          <span className="text-[var(--tge-governance-muted-text)]">
                            No source link
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--tge-governance-neutral-text)]">
                        {formatConfidence(candidate.confidence_score)}
                      </td>
                      <td className="px-4 py-3 text-[var(--tge-governance-neutral-text)]">
                        <span
                          className={`inline-flex min-h-[24px] items-center border px-2 text-xs font-semibold ${workflowTone(
                            candidate
                          )}`}
                        >
                          {workflowLabel(candidate)}
                        </span>
                        {candidate.applied_at ? (
                          <div className="mt-1 text-xs font-semibold text-[var(--tge-brand-green-dark)]">
                            Applied {formatDate(candidate.applied_at)}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="grid grid-cols-1 gap-2">
                          <button
                            type="button"
                            disabled={
                              !canReviewStatus ||
                              isBusy ||
                              isSuperseded ||
                              isApplied
                            }
                            onClick={() => submitAction(candidate, "confirm")}
                            className="inline-flex h-8 items-center justify-center border border-[var(--tge-governance-info-border)] bg-[var(--tge-governance-info-bg)] px-3 text-xs font-semibold text-[var(--tge-governance-info-text)] disabled:cursor-not-allowed disabled:border-[var(--tge-governance-muted-border)] disabled:bg-[var(--tge-governance-muted-bg)] disabled:text-[var(--tge-governance-muted-text)]"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            disabled={
                              !canReviewStatus || isBusy || !isApplyReady
                            }
                            onClick={() => submitAction(candidate, "apply")}
                            className="inline-flex h-8 items-center justify-center border border-[var(--tge-brand-green)] bg-[var(--tge-brand-green)] px-3 text-xs font-semibold text-[var(--tge-surface-card)] disabled:cursor-not-allowed disabled:border-[var(--tge-governance-muted-border)] disabled:bg-[var(--tge-governance-muted-bg)] disabled:text-[var(--tge-governance-muted-text)]"
                          >
                            Apply To DB
                          </button>
                          <button
                            type="button"
                            disabled={
                              !canReviewStatus ||
                              isBusy ||
                              isSuperseded ||
                              isApplied
                            }
                            onClick={() => submitAction(candidate, "reject")}
                            className="inline-flex h-8 items-center justify-center border border-[var(--tge-governance-danger-border)] bg-[var(--tge-governance-danger-bg)] px-3 text-xs font-semibold text-[var(--tge-governance-danger-text)] disabled:cursor-not-allowed disabled:border-[var(--tge-governance-muted-border)] disabled:bg-[var(--tge-governance-muted-bg)] disabled:text-[var(--tge-governance-muted-text)]"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pageCount > 1 ? (
            <PaginationBar
              page={clampedPage}
              pageCount={pageCount}
              pageEnd={pageEnd}
              pageStart={pageStart}
              total={candidates.length}
              onPageChange={setPage}
            />
          ) : null}
        </>
      )}

      {!canReviewStatus ? (
        <div className="border-t border-[var(--tge-governance-muted-border)] px-5 py-3 text-xs leading-5 text-[var(--tge-governance-muted-text)]">
          Review actions require editor/admin permissions.
        </div>
      ) : null}
    </>
  );

  if (collapseWhenIdle && activeReviewCount === 0) {
    return (
      <details
        id={id}
        className={`border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] ${
          id ? "scroll-mt-6" : ""
        }`}
      >
        <summary className="flex cursor-pointer list-none flex-col gap-3 px-5 py-4 marker:hidden md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--tge-governance-muted-text)]">
              Advanced Review Layer
            </div>
            <h2 className="mt-1 text-lg font-bold text-[var(--tge-text-primary)]">
              AI Field Suggestions
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--tge-text-secondary)]">
              No active AI review work is waiting on this record. Expand for
              applied history, rejected candidates, or future extraction output.
            </p>
          </div>
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 md:w-auto md:flex md:flex-wrap">
            <span className={summaryChipClass()}>
              {formatCount(candidates.length)} total
            </span>
            <span className={summaryChipClass("success")}>
              {formatCount(appliedCount)} applied
            </span>
            <span className={summaryChipClass()}>
              Expand
            </span>
          </div>
        </summary>
        <div className="border-t border-[var(--tge-governance-neutral-border)]">
          {content}
        </div>
      </details>
    );
  }

  return (
    <section
      id={id}
      className={`border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] ${id ? "scroll-mt-6" : ""}`}
    >
      <div className="flex flex-col gap-3 border-b border-[var(--tge-governance-neutral-border)] px-5 py-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--tge-text-primary)]">
            AI Field Suggestions
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--tge-text-secondary)]">
            Reviewable field candidates for this record. Confirming a suggestion
            marks it as accepted but does NOT update the database record.
            Applying confirmed suggestions is a separate audited write step and
            only updates supported empty fields.
          </p>
        </div>
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 md:w-auto md:flex md:flex-wrap">
          <span className="inline-flex h-9 items-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] px-3 text-xs font-semibold text-[var(--tge-governance-neutral-text)]">
            {formatCount(openCount)} open
          </span>
          {applyReadyCount > 0 ? (
            <span className="inline-flex h-9 items-center border border-[var(--tge-brand-green)] bg-[var(--tge-governance-success-bg)] px-3 text-xs font-semibold text-[var(--tge-governance-success-text)]">
              {formatCount(applyReadyCount)} ready to apply
            </span>
          ) : null}
          <Link
            href="/postgres-preview/research-ops#field-suggestion-review"
            className={`inline-flex h-9 items-center justify-center px-4 text-sm ${secondaryActionClass()}`}
          >
            Open Research Ops
          </Link>
        </div>
      </div>
      {content}
    </section>
  );
}
