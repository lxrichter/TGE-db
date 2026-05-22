"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Fragment,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import PostgresStatusBadge from "@/components/postgres-preview/PostgresStatusBadge";
import ReviewTablePagination from "@/components/sources/ReviewTablePagination";
import { formatCount } from "@/lib/format";
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

function StatusBadge({
  status,
  label,
}: {
  status: string;
  label: string | null;
}) {
  return (
    <PostgresStatusBadge
      domain="confidence"
      label={label || undefined}
      value={status}
    />
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
    return "Plant";
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

function MobileMatchField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-1 min-w-0 text-sm text-gray-700">{children}</div>
    </div>
  );
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
  const [collapsedSourceKeys, setCollapsedSourceKeys] = useState<Set<string>>(
    () => new Set()
  );
  const [compactRows, setCompactRows] = useState(true);
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
  const cellClassName = compactRows ? "px-4 py-3" : "px-4 py-4";
  const groupHeaderClassName = compactRows ? "px-4 py-2.5" : "px-4 py-3";
  const sourceReferenceClassName = compactRows
    ? "mt-1 line-clamp-1 break-all text-xs text-gray-500"
    : "mt-1 line-clamp-2 break-all text-xs text-gray-500";
  const signalClassName = compactRows
    ? "line-clamp-3 text-xs leading-5 text-gray-600"
    : "text-xs leading-5 text-gray-600";
  const sourceGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        sourceKey: string;
        sourceTitle: string | null;
        sourceReference: string | null;
        sourceUrl: string | null;
        sourcePublishedDate: string | null;
        sourceCountry: string | null;
        sourceOpenCandidateCount: number;
        confirmedArticleFactCount: number;
        suggestionRelevantFactCount: number;
        candidates: SourceMatchCandidateItem[];
      }
    >();

    pageItems.forEach((candidate) => {
      const sourceKey =
        candidate.source_id ||
        candidate.source_reference ||
        candidate.source_url ||
        candidate.match_candidate_id;
      const existing = groups.get(sourceKey);

      if (existing) {
        existing.sourceOpenCandidateCount = Math.max(
          existing.sourceOpenCandidateCount,
          candidate.source_open_candidate_count
        );
        existing.confirmedArticleFactCount = Math.max(
          existing.confirmedArticleFactCount,
          candidate.confirmed_article_fact_count
        );
        existing.suggestionRelevantFactCount = Math.max(
          existing.suggestionRelevantFactCount,
          candidate.suggestion_relevant_fact_count
        );
        existing.candidates.push(candidate);
        return;
      }

      groups.set(sourceKey, {
        sourceKey,
        sourceTitle: candidate.source_title,
        sourceReference: candidate.source_reference,
        sourceUrl: candidate.source_url,
        sourcePublishedDate: candidate.source_published_date,
        sourceCountry: candidate.source_country,
        sourceOpenCandidateCount: candidate.source_open_candidate_count,
        confirmedArticleFactCount: candidate.confirmed_article_fact_count,
        suggestionRelevantFactCount: candidate.suggestion_relevant_fact_count,
        candidates: [candidate],
      });
    });

    return Array.from(groups.values());
  }, [pageItems]);

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
    setSelected((current) => {
      const next = new Set(current);

      candidateIds.forEach((candidateId) => {
        if (allSelected) {
          next.delete(candidateId);
        } else {
          next.add(candidateId);
        }
      });

      return next;
    });
  }

  function selectCleanVisible() {
    if (cleanHighConfidenceIds.length === 0) {
      setMessage("No clean high-confidence candidates are visible in this view.");
      return;
    }

    setMessage(null);
    setSelected((current) => {
      const next = new Set(current);

      cleanHighConfidenceIds.forEach((candidateId) => next.add(candidateId));

      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
    setMessage(null);
  }

  function toggleSourceGroup(sourceKey: string) {
    setCollapsedSourceKeys((current) => {
      const next = new Set(current);

      if (next.has(sourceKey)) {
        next.delete(sourceKey);
      } else {
        next.add(sourceKey);
      }

      return next;
    });
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
        `Confirm ${selectedIds.length} article match candidate(s) and create or reuse evidence link(s)? This links sources to records but does not update project, plant, or company fields.`
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
      <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1f2937]">Article Match Candidates</h2>
          <p className="mt-1 text-sm text-gray-500">
            Review generated article/entity matches before creating evidence links.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:flex-wrap xl:items-center">
          <div className="border border-gray-200 bg-[#f7f7f7] px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:col-span-2 xl:mr-1 xl:border-0 xl:bg-transparent xl:px-0 xl:py-0 xl:text-right">
            <div>{selected.size} selected</div>
            {selected.size > 0 ? (
              <div className="mt-1 normal-case tracking-normal text-gray-400">
                {selectedCleanCount} clean / {selectedCautionCount} needs care
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setCompactRows((current) => !current)}
            className="inline-flex h-9 items-center justify-center border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
          >
            {compactRows ? "Detailed Rows" : "Compact Rows"}
          </button>
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
            project, plant, or company fields.
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

      <div className="divide-y divide-gray-100 lg:hidden">
        {sourceGroups.map((group) => {
          const isGroupCollapsed = collapsedSourceKeys.has(group.sourceKey);
          const groupHasAmbiguity = group.candidates.some(hasSourceAmbiguity);
          const groupOpenRows = group.candidates.filter(
            (candidate) => !isClosedCandidate(candidate)
          ).length;

          return (
            <section key={group.sourceKey} className="bg-white">
              <div className="bg-[#fbfcfa] px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Source Article Group
                    </div>
                    <Link
                      className="mt-1 inline-block font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                      href={`/sources/${group.sourceKey}`}
                    >
                      {group.sourceTitle ||
                        group.sourceReference ||
                        "Untitled source"}
                    </Link>
                    <div className="mt-1 line-clamp-2 break-all text-xs text-gray-500">
                      {group.sourceReference ||
                        group.sourceUrl ||
                        "No source reference"}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <PostgresStatusBadge
                        label={`${formatCount(group.candidates.length)} visible candidate${
                          group.candidates.length === 1 ? "" : "s"
                        }`}
                        tone="info"
                        value="open"
                      />
                      <PostgresStatusBadge
                        label={`${formatCount(groupOpenRows)} open row${
                          groupOpenRows === 1 ? "" : "s"
                        }`}
                        tone={groupOpenRows > 0 ? "attention" : "success"}
                        value={groupOpenRows > 0 ? "review" : "complete"}
                      />
                      <PostgresStatusBadge
                        label={`${formatCount(group.sourceOpenCandidateCount)} source open match${
                          group.sourceOpenCandidateCount === 1 ? "" : "es"
                        }`}
                        tone={groupHasAmbiguity ? "attention" : "success"}
                        value={groupHasAmbiguity ? "warning" : "ready"}
                      />
                      {group.confirmedArticleFactCount > 0 ? (
                        <PostgresStatusBadge
                          label={`${formatCount(group.confirmedArticleFactCount)} confirmed fact${
                            group.confirmedArticleFactCount === 1 ? "" : "s"
                          }`}
                          tone="success"
                          value="confirmed"
                        />
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 text-xs text-gray-500 sm:items-end">
                    <span>
                      {group.sourcePublishedDate
                        ? formatDate(group.sourcePublishedDate)
                        : group.sourceCountry || "No date/country metadata"}
                    </span>
                    {group.sourceCountry ? (
                      <span>Source country: {group.sourceCountry}</span>
                    ) : null}
                    <button
                      className="inline-flex h-8 items-center justify-center border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                      type="button"
                      onClick={() => toggleSourceGroup(group.sourceKey)}
                    >
                      {isGroupCollapsed ? "Expand Group" : "Collapse Group"}
                    </button>
                  </div>
                </div>
              </div>

              {isGroupCollapsed ? null : (
                <div className="divide-y divide-gray-100">
                  {group.candidates.map((candidate) => {
                    const href = entityHref(candidate);
                    const isClosed = isClosedCandidate(candidate);
                    const isAmbiguous = hasSourceAmbiguity(candidate);

                    return (
                      <article
                        key={candidate.match_candidate_id}
                        className="px-4 py-4 sm:px-5"
                      >
                        <div className="flex items-start gap-3">
                          <input
                            aria-label={`Select ${candidate.entity_label}`}
                            className="mt-1"
                            disabled={isClosed}
                            checked={selected.has(candidate.match_candidate_id)}
                            onChange={() =>
                              toggleCandidate(candidate.match_candidate_id)
                            }
                            type="checkbox"
                          />
                          <div className="min-w-0 flex-1">
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
                            <div className="mt-2 flex flex-wrap gap-2">
                              <StatusBadge
                                status={candidate.match_status_code}
                                label={candidate.match_status_label}
                              />
                              <PostgresStatusBadge
                                domain="confidence"
                                label={formatConfidence(candidate.confidence_score)}
                                value={
                                  candidate.confidence_score >= 0.8
                                    ? "high"
                                    : candidate.confidence_score >= 0.55
                                      ? "medium"
                                      : "low"
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <MobileMatchField label="Entity Signal">
                            {candidate.matched_alias ? (
                              <div>Alias: {candidate.matched_alias}</div>
                            ) : null}
                            {candidate.entity_country ? (
                              <div>Entity country: {candidate.entity_country}</div>
                            ) : null}
                            {candidate.entity_use_type ? (
                              <div>
                                Use type:{" "}
                                {candidate.entity_use_type.replaceAll("_", " ")}
                              </div>
                            ) : null}
                            {!candidate.matched_alias &&
                            !candidate.entity_country &&
                            !candidate.entity_use_type
                              ? "-"
                              : null}
                          </MobileMatchField>
                          <MobileMatchField label="Reason / Signals">
                            <div className="line-clamp-4 text-xs leading-5 text-gray-600">
                              {candidate.match_reason || "-"}
                            </div>
                            {candidate.article_country_candidates.length > 0 ? (
                              <div className="mt-2 text-xs text-gray-500">
                                Article countries:{" "}
                                {candidate.article_country_candidates.join(", ")}
                              </div>
                            ) : null}
                            {candidate.review_flags.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {candidate.review_flags.map((flag) => (
                                  <PostgresStatusBadge
                                    key={flag}
                                    label={formatReviewFlag(flag)}
                                    tone="attention"
                                    value="warning"
                                  />
                                ))}
                              </div>
                            ) : null}
                            {isAmbiguous ? (
                              <div className="mt-2 border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] font-medium leading-4 text-amber-900">
                                This source has{" "}
                                {candidate.source_open_candidate_count} open
                                match candidates. Confirm only the record(s)
                                this article actually supports.
                              </div>
                            ) : null}
                          </MobileMatchField>
                          <MobileMatchField label="Source Context">
                            {candidate.source_published_date
                              ? formatDate(candidate.source_published_date)
                              : candidate.source_country ||
                                "No date/country metadata"}
                            {candidate.source_country ? (
                              <div className="mt-1 text-xs text-gray-500">
                                Source country: {candidate.source_country}
                              </div>
                            ) : null}
                            <div className="mt-2 flex flex-wrap gap-1">
                              <PostgresStatusBadge
                                label={`${candidate.source_open_candidate_count} open match${
                                  candidate.source_open_candidate_count === 1
                                    ? ""
                                    : "es"
                                }`}
                                tone={isAmbiguous ? "attention" : "success"}
                                value={isAmbiguous ? "warning" : "ready"}
                              />
                              {candidate.confirmed_article_fact_count > 0 ? (
                                <PostgresStatusBadge
                                  label={`${candidate.confirmed_article_fact_count} confirmed fact${
                                    candidate.confirmed_article_fact_count === 1
                                      ? ""
                                      : "s"
                                  }`}
                                  tone="success"
                                  value="confirmed"
                                />
                              ) : null}
                            </div>
                          </MobileMatchField>
                          <MobileMatchField label="Generated">
                            {formatDate(candidate.generated_at)}
                            <div className="mt-1 text-xs text-gray-500">
                              {candidate.generated_by}
                            </div>
                            {candidate.reviewed_by_name ? (
                              <div className="mt-1 text-xs text-gray-500">
                                reviewed by {candidate.reviewed_by_name}
                              </div>
                            ) : null}
                          </MobileMatchField>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}

        {candidates.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            No match candidates fit the current filters.
          </div>
        ) : null}
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-[1280px] table-fixed text-left text-sm">
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
            {sourceGroups.map((group) => {
              const isGroupCollapsed = collapsedSourceKeys.has(group.sourceKey);
              const groupHasAmbiguity = group.candidates.some(hasSourceAmbiguity);
              const groupOpenRows = group.candidates.filter(
                (candidate) => !isClosedCandidate(candidate)
              ).length;

              return (
                <Fragment key={group.sourceKey}>
                  <tr
                    key={`${group.sourceKey}-header`}
                    className="bg-[#fbfcfa] align-top"
                  >
                    <td className={groupHeaderClassName} colSpan={7}>
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                            Source Article Group
                          </div>
                          <Link
                            className="mt-1 inline-block font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                            href={`/sources/${group.sourceKey}`}
                          >
                            {group.sourceTitle ||
                              group.sourceReference ||
                              "Untitled source"}
                          </Link>
                          <div className="mt-1 line-clamp-1 break-all text-xs text-gray-500">
                            {group.sourceReference ||
                              group.sourceUrl ||
                              "No source reference"}
                          </div>
                          <div
                            className={
                              compactRows
                                ? "mt-2 flex flex-wrap gap-1.5"
                                : "mt-2 flex flex-wrap gap-2"
                            }
                          >
                            <PostgresStatusBadge
                              label={`${formatCount(group.candidates.length)} visible candidate${
                                group.candidates.length === 1 ? "" : "s"
                              }`}
                              tone="info"
                              value="open"
                            />
                            <PostgresStatusBadge
                              label={`${formatCount(groupOpenRows)} open row${
                                groupOpenRows === 1 ? "" : "s"
                              }`}
                              tone={groupOpenRows > 0 ? "attention" : "success"}
                              value={groupOpenRows > 0 ? "review" : "complete"}
                            />
                            <PostgresStatusBadge
                              label={`${formatCount(group.sourceOpenCandidateCount)} source open match${
                                group.sourceOpenCandidateCount === 1 ? "" : "es"
                              }`}
                              tone={groupHasAmbiguity ? "attention" : "success"}
                              value={groupHasAmbiguity ? "warning" : "ready"}
                            />
                            {group.confirmedArticleFactCount > 0 ? (
                              <PostgresStatusBadge
                                label={`${formatCount(group.confirmedArticleFactCount)} confirmed fact${
                                  group.confirmedArticleFactCount === 1 ? "" : "s"
                                }`}
                                tone="success"
                                value="confirmed"
                              />
                            ) : null}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 text-xs text-gray-500 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
                          <span>
                            {group.sourcePublishedDate
                              ? formatDate(group.sourcePublishedDate)
                              : group.sourceCountry || "No date/country metadata"}
                          </span>
                          {group.sourceCountry ? (
                            <span>Source country: {group.sourceCountry}</span>
                          ) : null}
                          <button
                            className="inline-flex h-8 items-center justify-center border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                            type="button"
                            onClick={() => toggleSourceGroup(group.sourceKey)}
                          >
                            {isGroupCollapsed ? "Expand Group" : "Collapse Group"}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  {isGroupCollapsed
                    ? null
                    : group.candidates.map((candidate) => {
                        const href = entityHref(candidate);
                        const isClosed = isClosedCandidate(candidate);
                        const isAmbiguous = hasSourceAmbiguity(candidate);

                      return (
                        <tr
                          key={candidate.match_candidate_id}
                          className="align-top"
                        >
                            <td className={cellClassName}>
                              <input
                                aria-label={`Select ${candidate.entity_label}`}
                                disabled={isClosed}
                                checked={selected.has(
                                  candidate.match_candidate_id
                                )}
                                onChange={() =>
                                  toggleCandidate(candidate.match_candidate_id)
                                }
                                type="checkbox"
                              />
                            </td>
                            <td className={cellClassName}>
                              <Link
                                className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                                href={`/sources/${candidate.source_id}`}
                              >
                                {candidate.source_title ||
                                  candidate.source_reference ||
                                  "Untitled source"}
                              </Link>
                              <div className={sourceReferenceClassName}>
                                {candidate.source_reference ||
                                  candidate.source_url ||
                                  "No source reference"}
                              </div>
                              <div
                                className={
                                  compactRows
                                    ? "mt-1 text-xs text-gray-500"
                                    : "mt-2 text-xs text-gray-500"
                                }
                              >
                                {candidate.source_published_date
                                  ? formatDate(candidate.source_published_date)
                                  : candidate.source_country ||
                                    "No date/country metadata"}
                              </div>
                              {candidate.source_country ? (
                                <div className="mt-1 text-xs font-medium text-gray-600">
                                  Source country: {candidate.source_country}
                                </div>
                              ) : null}
                              <div
                                className={
                                  compactRows
                                    ? "mt-2 flex flex-wrap gap-1"
                                    : "mt-3 flex flex-wrap gap-1"
                                }
                              >
                                <PostgresStatusBadge
                                  label={`${candidate.source_open_candidate_count} open match${
                                    candidate.source_open_candidate_count === 1
                                      ? ""
                                      : "es"
                                  }`}
                                  tone={isAmbiguous ? "attention" : "success"}
                                  value={isAmbiguous ? "warning" : "ready"}
                                />
                                {candidate.confirmed_article_fact_count > 0 ? (
                                  <PostgresStatusBadge
                                    label={`${candidate.confirmed_article_fact_count} confirmed fact${
                                      candidate.confirmed_article_fact_count ===
                                      1
                                        ? ""
                                        : "s"
                                    }`}
                                    tone="success"
                                    value="confirmed"
                                  />
                                ) : null}
                                {candidate.suggestion_relevant_fact_count > 0 ? (
                                  <PostgresStatusBadge
                                    label={`${candidate.suggestion_relevant_fact_count} field-suggestion fact${
                                      candidate.suggestion_relevant_fact_count ===
                                      1
                                        ? ""
                                        : "s"
                                    }`}
                                    tone="info"
                                    value="suggested"
                                  />
                                ) : null}
                              </div>
                            </td>
                            <td className={cellClassName}>
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
                              {candidate.entity_country ||
                              candidate.entity_use_type ? (
                                <div className="mt-2 text-xs leading-5 text-gray-500">
                                  {candidate.entity_country ? (
                                    <div>
                                      Entity country: {candidate.entity_country}
                                    </div>
                                  ) : null}
                                  {candidate.entity_use_type ? (
                                    <div>
                                      Use type:{" "}
                                      {candidate.entity_use_type.replaceAll(
                                        "_",
                                        " "
                                      )}
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                            </td>
                            <td className={cellClassName}>
                              <div className="text-xl font-bold text-[#1f2937]">
                                {formatConfidence(candidate.confidence_score)}
                              </div>
                              <div className="mt-1 text-xs text-gray-500">
                                {candidate.confirmed_entity_source_id
                                  ? "Evidence link confirmed"
                                  : "Candidate only"}
                              </div>
                            </td>
                            <td className={cellClassName}>
                              <div className={signalClassName}>
                                {candidate.match_reason || "-"}
                              </div>
                              {candidate.article_country_candidates.length > 0 ? (
                                <div className="mt-2 text-gray-500">
                                  Article countries:{" "}
                                  {candidate.article_country_candidates.join(", ")}
                                </div>
                              ) : null}
                              {candidate.review_flags.length > 0 ? (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {candidate.review_flags.map((flag) => (
                                    <PostgresStatusBadge
                                      key={flag}
                                      label={formatReviewFlag(flag)}
                                      tone="attention"
                                      value="warning"
                                    />
                                  ))}
                                </div>
                              ) : null}
                              {isAmbiguous ? (
                                <div
                                  className={
                                    compactRows
                                      ? "mt-2 line-clamp-2 border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] font-medium leading-4 text-amber-900"
                                      : "mt-2 border border-amber-200 bg-amber-50 px-2 py-2 text-[11px] font-medium leading-4 text-amber-900"
                                  }
                                >
                                  This source has{" "}
                                  {candidate.source_open_candidate_count} open
                                  match candidates. Confirm only the record(s)
                                  this article actually supports.
                                </div>
                              ) : null}
                            </td>
                            <td className={cellClassName}>
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
                            <td className={`${cellClassName} text-gray-700`}>
                              {formatDate(candidate.generated_at)}
                              <div className="mt-1 text-xs text-gray-500">
                                {candidate.generated_by}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                </Fragment>
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
