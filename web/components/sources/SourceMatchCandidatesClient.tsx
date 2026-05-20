"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import ReviewTablePagination from "@/components/sources/ReviewTablePagination";
import type {
  SourceMatchCandidateAction,
  SourceMatchCandidateItem,
} from "@/lib/services/sources";

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

function formatConfidence(value: number) {
  return `${Math.round(value * 100)}%`;
}

function statusTone(status: string) {
  if (status === "suggested_high_confidence" || status === "confirmed") {
    return "green";
  }

  if (status === "suggested_medium_confidence" || status === "needs_review") {
    return "amber";
  }

  if (status === "rejected") {
    return "red";
  }

  return "neutral";
}

function badgeClass(tone: "green" | "amber" | "red" | "neutral") {
  const classes = {
    green: "border-[#b9d98b] bg-[#f1f8e8] text-[#3f6f19]",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    red: "border-red-200 bg-red-50 text-red-700",
    neutral: "border-gray-200 bg-[#f7f7f7] text-gray-700",
  };

  return `inline-flex min-h-[28px] items-center border px-2 text-xs font-semibold ${classes[tone]}`;
}

function StatusBadge({
  status,
  label,
}: {
  status: string;
  label: string | null;
}) {
  return (
    <span className={badgeClass(statusTone(status))}>
      {label || status.replaceAll("_", " ")}
    </span>
  );
}

function formatReviewFlag(value: string) {
  if (value === "country_conflict") {
    return "Country conflict";
  }

  return value.replaceAll("_", " ");
}

function hasReviewFlags(candidate: SourceMatchCandidateItem) {
  return candidate.review_flags.length > 0;
}

function isClosedCandidate(candidate: SourceMatchCandidateItem) {
  return (
    candidate.match_status_code === "confirmed" ||
    candidate.match_status_code === "rejected"
  );
}

function hasSourceAmbiguity(candidate: SourceMatchCandidateItem) {
  return candidate.source_open_candidate_count > 1;
}

function hasReviewCaution(candidate: SourceMatchCandidateItem) {
  return hasReviewFlags(candidate) || hasSourceAmbiguity(candidate);
}

function isCleanHighConfidence(candidate: SourceMatchCandidateItem) {
  return (
    !isClosedCandidate(candidate) &&
    candidate.match_status_code === "suggested_high_confidence" &&
    !hasReviewCaution(candidate)
  );
}

function entityHref(candidate: SourceMatchCandidateItem) {
  if (!candidate.entity_id) {
    return null;
  }

  if (candidate.entity_type === "project") {
    return `/postgres-preview/projects/${candidate.entity_id}`;
  }

  if (candidate.entity_type === "operating_asset") {
    return `/postgres-preview/operating-assets/${candidate.entity_id}`;
  }

  if (candidate.entity_type === "company") {
    return `/postgres-preview/companies/${candidate.entity_id}`;
  }

  return null;
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

  if (value === "country_market") {
    return "Country / Market";
  }

  return value.replaceAll("_", " ");
}

export default function SourceMatchCandidatesClient({
  candidates,
}: {
  candidates: SourceMatchCandidateItem[];
}) {
  const router = useRouter();
  const pageSize = 25;
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const pageCount = Math.max(1, Math.ceil(candidates.length / pageSize));
  const clampedPage = Math.min(page, pageCount);
  const pageStartIndex = (clampedPage - 1) * pageSize;
  const pageItems = candidates.slice(pageStartIndex, pageStartIndex + pageSize);
  const pageStart = candidates.length === 0 ? 0 : pageStartIndex + 1;
  const pageEnd = Math.min(pageStartIndex + pageItems.length, candidates.length);
  const candidateIds = useMemo(
    () =>
      pageItems
        .filter((candidate) => !isClosedCandidate(candidate))
        .map((candidate) => candidate.match_candidate_id),
    [pageItems]
  );
  const cleanHighConfidenceIds = useMemo(
    () =>
      pageItems
        .filter(isCleanHighConfidence)
        .map((candidate) => candidate.match_candidate_id),
    [pageItems]
  );
  const selectedIds = [...selected];
  const selectedCandidates = useMemo(
    () =>
      candidates.filter((candidate) =>
        selected.has(candidate.match_candidate_id)
      ),
    [candidates, selected]
  );
  const selectedFlaggedCount = selectedCandidates.filter(hasReviewFlags).length;
  const selectedAmbiguousCount =
    selectedCandidates.filter(hasSourceAmbiguity).length;
  const selectedCautionCount =
    selectedCandidates.filter(hasReviewCaution).length;
  const allSelected =
    candidateIds.length > 0 &&
    candidateIds.every((candidateId) => selected.has(candidateId));
  const selectedCleanCount = selectedCandidates.filter(isCleanHighConfidence).length;

  function toggleCandidate(candidateId: string) {
    setSelected((current) => {
      const next = new Set(current);

      if (next.has(candidateId)) {
        next.delete(candidateId);
      } else {
        next.add(candidateId);
      }

      return next;
    });
  }

  function toggleAll() {
    setSelected(() => (allSelected ? new Set() : new Set(candidateIds)));
  }

  function selectCleanVisible() {
    if (cleanHighConfidenceIds.length === 0) {
      setMessage("No clean high-confidence candidates are visible in this view.");
      return;
    }

    setMessage(null);
    setSelected(new Set(cleanHighConfidenceIds));
  }

  function clearSelection() {
    setSelected(new Set());
    setMessage(null);
  }

  function runAction(action: SourceMatchCandidateAction) {
    if (selectedIds.length === 0) {
      setMessage("Select one or more match candidates first.");
      return;
    }

    if (action === "confirm" && selectedIds.length > 1 && selectedCautionCount > 0) {
      setMessage(
        "Bulk confirmation is limited to clean candidates. Review flagged or multi-candidate sources one at a time."
      );
      return;
    }

    if (
      action === "confirm" &&
      !window.confirm(
        `Confirm ${selectedIds.length} article match candidate(s) and create or reuse evidence link(s)? This links sources to records but does not update project, plant/facility, or company fields.`
      )
    ) {
      return;
    }

    setMessage(null);
    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/postgres/source-match-candidates", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, candidateIds: selectedIds }),
        });
        const payload = (await response.json()) as {
          success: boolean;
          error?: string;
          result?: {
            requested: number;
            updated: number;
            confirmedLinksCreatedOrReused: number;
          };
        };

        if (!response.ok || !payload.success) {
          setMessage(payload.error || "Could not update selected candidates.");
          return;
        }

        const updated = payload.result?.updated ?? 0;
        const links = payload.result?.confirmedLinksCreatedOrReused ?? 0;
        const linkNote =
          action === "confirm" ? `, ${links} evidence link(s) created or reused` : "";
        setSelected(new Set());
        setMessage(`${updated} candidate(s) updated${linkNote}.`);
        router.refresh();
      })();
    });
  }

  return (
    <section className="border border-gray-200 bg-white">
      <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1f2937]">Article Match Candidates</h2>
          <p className="mt-1 text-sm text-gray-500">
            Review generated article/entity matches before creating evidence links.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-1 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
            <div>{selected.size} selected</div>
            {selected.size > 0 ? (
              <div className="mt-1 normal-case tracking-normal text-gray-400">
                {selectedCleanCount} clean / {selectedCautionCount} needs care
              </div>
            ) : null}
          </div>
          <button
            type="button"
            disabled={isPending || cleanHighConfidenceIds.length === 0}
            onClick={selectCleanVisible}
            className="inline-flex h-9 items-center justify-center border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f] disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
          >
            Select Clean Visible
          </button>
          <button
            type="button"
            disabled={
              isPending ||
              selected.size === 0 ||
              (selected.size > 1 && selectedCautionCount > 0)
            }
            onClick={() => runAction("confirm")}
            className="inline-flex h-9 items-center justify-center border border-[#8dc63f] bg-[#8dc63f] px-3 text-sm font-semibold text-white hover:bg-[#78ad35] disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
          >
            Confirm
          </button>
          <button
            type="button"
            disabled={isPending || selected.size === 0}
            onClick={() => runAction("reject")}
            className="inline-flex h-9 items-center justify-center border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
          >
            Reject
          </button>
          <button
            type="button"
            disabled={isPending || selected.size === 0}
            onClick={() => runAction("needs_review")}
            className="inline-flex h-9 items-center justify-center border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f] disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
          >
            Needs Review
          </button>
          <button
            type="button"
            disabled={isPending || selected.size === 0}
            onClick={clearSelection}
            className="inline-flex h-9 items-center justify-center border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f] disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid gap-3 border-b border-gray-200 bg-[#fbfcfa] px-5 py-4 text-sm text-gray-600 lg:grid-cols-3">
        <div>
          <div className="font-semibold text-[#1f2937]">Confirm means evidence link</div>
          <p className="mt-1 leading-5">
            Confirmation links the TGE article to the record. It does not update
            project, plant/facility, or company fields.
          </p>
        </div>
        <div>
          <div className="font-semibold text-[#1f2937]">Clean visible is safest</div>
          <p className="mt-1 leading-5">
            The clean selector only picks high-confidence rows on the current
            page without review flags and without competing open candidates for
            the same source.
          </p>
        </div>
        <div>
          <div className="font-semibold text-[#1f2937]">Multiple candidates need care</div>
          <p className="mt-1 leading-5">
            Field/group articles can correctly link to several records, but they
            should be confirmed deliberately rather than by broad bulk action.
          </p>
        </div>
      </div>

      {message ? (
        <div className="border-b border-gray-200 bg-[#f7f7f7] px-5 py-3 text-sm text-gray-700">
          {message}
        </div>
      ) : null}

      {selectedCautionCount > 0 ? (
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900">
          {selectedCautionCount} selected candidate(s) need careful review
          {selectedFlaggedCount > 0 ? `; ${selectedFlaggedCount} flagged` : ""}
          {selectedAmbiguousCount > 0
            ? `; ${selectedAmbiguousCount} from sources with multiple open candidates`
            : ""}
          . Bulk confirmation is limited to clean rows.
        </div>
      ) : null}

      <ReviewTablePagination
        noun="candidate"
        page={clampedPage}
        pageCount={pageCount}
        pageEnd={pageEnd}
        pageStart={pageStart}
        total={candidates.length}
        onPageChange={setPage}
      />

      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed text-left text-sm">
          <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-[44px] px-4 py-3 font-semibold">
                <input
                  aria-label="Select visible match candidates on this page"
                  checked={allSelected}
                  onChange={toggleAll}
                  type="checkbox"
                />
              </th>
              <th className="w-[26%] px-4 py-3 font-semibold">Article Source</th>
              <th className="w-[19%] px-4 py-3 font-semibold">Matched Entity</th>
              <th className="w-[12%] px-4 py-3 font-semibold">Confidence</th>
              <th className="w-[20%] px-4 py-3 font-semibold">Reason / Signals</th>
              <th className="w-[12%] px-4 py-3 font-semibold">Status</th>
              <th className="w-[10%] px-4 py-3 font-semibold">Generated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pageItems.map((candidate) => {
              const href = entityHref(candidate);
              const isClosed = isClosedCandidate(candidate);
              const isAmbiguous = hasSourceAmbiguity(candidate);
              return (
                <tr key={candidate.match_candidate_id} className="align-top">
                  <td className="px-4 py-4">
                    <input
                      aria-label={`Select ${candidate.entity_label}`}
                      disabled={isClosed}
                      checked={selected.has(candidate.match_candidate_id)}
                      onChange={() => toggleCandidate(candidate.match_candidate_id)}
                      type="checkbox"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                      href={`/sources/${candidate.source_id}`}
                    >
                      {candidate.source_title ||
                        candidate.source_reference ||
                        "Untitled source"}
                    </Link>
                    <div className="mt-1 line-clamp-2 break-all text-xs text-gray-500">
                      {candidate.source_reference || candidate.source_url || "No source reference"}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {candidate.source_published_date
                        ? formatDate(candidate.source_published_date)
                        : candidate.source_country || "No date/country metadata"}
                    </div>
                    {candidate.source_country ? (
                      <div className="mt-1 text-xs font-medium text-gray-600">
                        Source country: {candidate.source_country}
                      </div>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-1">
                      <span
                        className={`inline-flex border px-2 py-1 text-[11px] font-semibold ${
                          isAmbiguous
                            ? "border-amber-200 bg-amber-50 text-amber-800"
                            : "border-[#b9d98b] bg-[#f1f8e8] text-[#3f6f19]"
                        }`}
                      >
                        {candidate.source_open_candidate_count} open match
                        {candidate.source_open_candidate_count === 1 ? "" : "es"}
                      </span>
                      {candidate.confirmed_article_fact_count > 0 ? (
                        <span className="inline-flex border border-gray-200 bg-[#f7f7f7] px-2 py-1 text-[11px] font-semibold text-gray-700">
                          {candidate.confirmed_article_fact_count} confirmed fact
                          {candidate.confirmed_article_fact_count === 1 ? "" : "s"}
                        </span>
                      ) : null}
                      {candidate.suggestion_relevant_fact_count > 0 ? (
                        <span className="inline-flex border border-[#b9d98b] bg-white px-2 py-1 text-[11px] font-semibold text-[#3f6f19]">
                          {candidate.suggestion_relevant_fact_count} field-suggestion fact
                          {candidate.suggestion_relevant_fact_count === 1 ? "" : "s"}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {entityTypeLabel(candidate.entity_type)}
                    </div>
                    {href ? (
                      <Link
                        href={href}
                        className="mt-1 block font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                      >
                        {candidate.entity_label}
                      </Link>
                    ) : (
                      <div className="mt-1 font-semibold text-[#1f2937]">
                        {candidate.entity_label}
                      </div>
                    )}
                    {candidate.matched_alias ? (
                      <div className="mt-2 text-xs text-gray-500">
                        Alias: {candidate.matched_alias}
                      </div>
                    ) : null}
                    {candidate.entity_country || candidate.entity_use_type ? (
                      <div className="mt-2 text-xs leading-5 text-gray-500">
                        {candidate.entity_country ? (
                          <div>Entity country: {candidate.entity_country}</div>
                        ) : null}
                        {candidate.entity_use_type ? (
                          <div>
                            Use type: {candidate.entity_use_type.replaceAll("_", " ")}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-xl font-bold text-[#1f2937]">
                      {formatConfidence(candidate.confidence_score)}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {candidate.confirmed_entity_source_id
                        ? "Evidence link confirmed"
                        : "Candidate only"}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs leading-5 text-gray-600">
                    <div>{candidate.match_reason || "-"}</div>
                    {candidate.article_country_candidates.length > 0 ? (
                      <div className="mt-2 text-gray-500">
                        Article countries:{" "}
                        {candidate.article_country_candidates.join(", ")}
                      </div>
                    ) : null}
                    {candidate.review_flags.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {candidate.review_flags.map((flag) => (
                          <span
                            key={flag}
                            className="inline-flex border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800"
                          >
                            {formatReviewFlag(flag)}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {isAmbiguous ? (
                      <div className="mt-2 border border-amber-200 bg-amber-50 px-2 py-2 text-[11px] font-medium leading-4 text-amber-900">
                        This source has {candidate.source_open_candidate_count} open
                        match candidates. Confirm only the record(s) this article
                        actually supports.
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge
                      status={candidate.match_status_code}
                      label={candidate.match_status_label}
                    />
                    {candidate.reviewed_by_name ? (
                      <div className="mt-2 text-xs text-gray-500">
                        by {candidate.reviewed_by_name}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 text-gray-700">
                    {formatDate(candidate.generated_at)}
                    <div className="mt-1 text-xs text-gray-500">
                      {candidate.generated_by}
                    </div>
                  </td>
                </tr>
              );
            })}

            {candidates.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-500">
                  No match candidates fit the current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {pageCount > 1 ? (
        <ReviewTablePagination
          noun="candidate"
          page={clampedPage}
          pageCount={pageCount}
          pageEnd={pageEnd}
          pageStart={pageStart}
          total={candidates.length}
          onPageChange={setPage}
        />
      ) : null}
    </section>
  );
}
