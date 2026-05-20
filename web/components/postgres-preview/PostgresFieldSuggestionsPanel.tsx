"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  PostgresFieldSuggestionAction,
  PostgresFieldSuggestionCandidate,
} from "@/lib/postgres-preview";
import { formatCount } from "@/lib/format";

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
    return "Plant / Facility";
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
    return "border-[#b9d98b] bg-[#f1f8e8] text-[#3f6f19]";
  }

  if (candidate.suggestion_status_code === "confirmed") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (candidate.suggestion_status_code === "rejected") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-800";
}

function fieldContext(candidate: PostgresFieldSuggestionCandidate) {
  return candidate.current_value && candidate.current_value.trim()
    ? "Existing value present"
    : "Fills empty field";
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
      <div className="border-b border-gray-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Showing {formatCount(total)} suggestion{total === 1 ? "" : "s"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-3 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Showing {formatCount(pageStart)}-{formatCount(pageEnd)} of{" "}
        {formatCount(total)} suggestions
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="h-8 border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={page <= 1}
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Previous
        </button>
        <span className="inline-flex h-8 items-center border border-gray-200 bg-[#f7f7f7] px-3 text-xs font-semibold text-gray-700">
          Page {formatCount(page)} / {formatCount(pageCount)}
        </span>
        <button
          className="h-8 border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f] disabled:cursor-not-allowed disabled:opacity-50"
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
  showEntity = false,
}: {
  candidates: PostgresFieldSuggestionCandidate[];
  canReviewStatus: boolean;
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

  return (
    <section className="border border-gray-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1f2937]">
            AI Field Suggestions
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Reviewable field candidates for this record. Confirming a suggestion
            marks it as accepted but does NOT update the database record.
            Applying confirmed suggestions is a separate audited write step and
            only updates supported empty fields.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex h-9 items-center border border-gray-200 bg-[#f7f7f7] px-3 text-xs font-semibold text-gray-700">
            {formatCount(openCount)} open
          </span>
          <Link
            href="/postgres-preview/research-ops#field-suggestion-review"
            className="inline-flex h-9 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
          >
            Open Research Ops
          </Link>
        </div>
      </div>

      {message ? (
        <div className="border-b border-gray-100 px-5 py-3 text-xs leading-5 text-gray-600">
          {message}
        </div>
      ) : null}

      {candidates.length === 0 ? (
        <div className="px-5 py-5">
          <div className="border border-dashed border-gray-300 bg-[#fbfbfb] px-4 py-5 text-sm leading-6 text-gray-600">
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
              <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
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
              <tbody className="divide-y divide-gray-100">
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
                      className="align-top"
                    >
                      {showEntity ? (
                        <td className="px-4 py-3">
                          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {entityTypeLabel(candidate.entity_type)}
                          </div>
                          <Link
                            href={targetHref}
                            className="mt-1 block font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                          >
                            {candidate.entity_name}
                          </Link>
                          <div className="mt-1 text-xs text-gray-500">
                            {candidate.country || "No country"}
                          </div>
                        </td>
                      ) : null}
                      <td className="px-4 py-3 font-semibold text-[#1f2937]">
                        {candidate.field_name}
                        <div className="mt-1 text-xs font-normal text-gray-500">
                          {formatDate(candidate.generated_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {candidate.current_value || "-"}
                        <div className="mt-2 text-xs font-semibold text-gray-500">
                          {fieldContext(candidate)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <span className="font-semibold text-[#1f2937]">
                          {candidate.suggested_value}
                        </span>
                        {candidate.suggestion_reason ? (
                          <div className="mt-2 line-clamp-2 text-xs leading-5 text-gray-500">
                            {candidate.suggestion_reason}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {href ? (
                          <Link
                            href={href}
                            className="line-clamp-2 font-semibold text-[#4f7f1f] hover:underline"
                          >
                            {candidate.source_title ||
                              candidate.source_reference ||
                              "Open source"}
                          </Link>
                        ) : (
                          <span className="text-gray-400">No source link</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {formatConfidence(candidate.confidence_score)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <span
                          className={`inline-flex min-h-[24px] items-center border px-2 text-xs font-semibold ${workflowTone(
                            candidate
                          )}`}
                        >
                          {workflowLabel(candidate)}
                        </span>
                        {candidate.applied_at ? (
                          <div className="mt-1 text-xs font-semibold text-[#4f7f1f]">
                            Applied {formatDate(candidate.applied_at)}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={
                              !canReviewStatus ||
                              isBusy ||
                              isSuperseded ||
                              isApplied
                            }
                            onClick={() => submitAction(candidate, "confirm")}
                            className="inline-flex h-8 items-center border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            disabled={
                              !canReviewStatus || isBusy || !isApplyReady
                            }
                            onClick={() => submitAction(candidate, "apply")}
                            className="inline-flex h-8 items-center border border-[#8dc63f] bg-[#8dc63f] px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
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
                            className="inline-flex h-8 items-center border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
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
        <div className="border-t border-gray-100 px-5 py-3 text-xs leading-5 text-gray-500">
          Review actions require editor/admin permissions.
        </div>
      ) : null}
    </section>
  );
}
