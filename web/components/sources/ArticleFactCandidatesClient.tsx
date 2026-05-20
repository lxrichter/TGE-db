"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import ReviewTablePagination from "@/components/sources/ReviewTablePagination";
import type {
  ArticleFactCandidateAction,
  ArticleFactCandidateItem,
} from "@/lib/services/article-facts";

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

function statusTone(status: string) {
  if (status === "confirmed") {
    return "green";
  }

  if (status === "suggested" || status === "needs_review") {
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
      {label || formatCode(status)}
    </span>
  );
}

function sourceHref(candidate: ArticleFactCandidateItem) {
  if (candidate.source_id) {
    return `/sources/${candidate.source_id}`;
  }

  return null;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function valuePreview(candidate: ArticleFactCandidateItem) {
  let value = candidate.extracted_value.trim();
  const unit = candidate.unit_code?.trim();

  if (!unit) {
    return value;
  }

  const repeatedTrailingUnit = new RegExp(
    `(?:\\s+${escapeRegExp(unit)}){2,}$`,
    "i"
  );
  value = value.replace(repeatedTrailingUnit, ` ${unit}`);

  const compactValue = value.replace(/\s/g, "").toLowerCase();
  const compactUnit = unit.replace(/\s/g, "").toLowerCase();

  if (compactValue.includes(compactUnit)) {
    return value;
  }

  return `${value} ${unit}`;
}

export default function ArticleFactCandidatesClient({
  candidates,
  canReview,
}: {
  candidates: ArticleFactCandidateItem[];
  canReview: boolean;
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
  const selectableIds = useMemo(
    () =>
      pageItems
        .filter((candidate) => candidate.fact_status_code !== "superseded")
        .map((candidate) => candidate.article_fact_candidate_id),
    [pageItems]
  );
  const selectedIds = [...selected];
  const allSelected =
    selectableIds.length > 0 &&
    selectableIds.every((candidateId) => selected.has(candidateId));

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

      selectableIds.forEach((candidateId) => {
        if (allSelected) {
          next.delete(candidateId);
        } else {
          next.add(candidateId);
        }
      });

      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
    setMessage(null);
  }

  function runAction(action: ArticleFactCandidateAction) {
    if (!canReview) {
      setMessage("You need editor permissions to update article fact candidates.");
      return;
    }

    if (selectedIds.length === 0) {
      setMessage("Select one or more article fact candidates first.");
      return;
    }

    setMessage(null);
    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/postgres/article-fact-candidates", {
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
          };
        };

        if (!response.ok || !payload.success) {
          setMessage(payload.error || "Could not update selected candidates.");
          return;
        }

        setSelected(new Set());
        setMessage(`${payload.result?.updated ?? 0} candidate(s) updated.`);
        router.refresh();
      })();
    });
  }

  return (
    <section className="border border-gray-200 bg-white">
      <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1f2937]">
            Article Fact Candidates
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Review compact facts extracted from TGE article markdown. Confirming
            here keeps the candidate; it does not update records or create
            evidence links.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {selected.size} selected
          </span>
          <button
            type="button"
            disabled={isPending || !canReview || selected.size === 0}
            onClick={() => runAction("confirm")}
            className="inline-flex h-9 items-center justify-center border border-[#8dc63f] bg-[#8dc63f] px-3 text-sm font-semibold text-white hover:bg-[#78ad35] disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
          >
            Confirm
          </button>
          <button
            type="button"
            disabled={isPending || !canReview || selected.size === 0}
            onClick={() => runAction("reject")}
            className="inline-flex h-9 items-center justify-center border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
          >
            Reject
          </button>
          <button
            type="button"
            disabled={isPending || !canReview || selected.size === 0}
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

      {message ? (
        <div className="border-b border-gray-200 bg-[#f7f7f7] px-5 py-3 text-sm text-gray-700">
          {message}
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
                  aria-label="Select visible article fact candidates"
                  checked={allSelected}
                  onChange={toggleAll}
                  type="checkbox"
                />
              </th>
              <th className="w-[21%] px-4 py-3 font-semibold">Article / Source</th>
              <th className="w-[14%] px-4 py-3 font-semibold">Fact Type</th>
              <th className="w-[18%] px-4 py-3 font-semibold">Candidate Value</th>
              <th className="w-[20%] px-4 py-3 font-semibold">Evidence</th>
              <th className="w-[10%] px-4 py-3 font-semibold">Confidence</th>
              <th className="w-[9%] px-4 py-3 font-semibold">Status</th>
              <th className="w-[8%] px-4 py-3 font-semibold">Reviewed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pageItems.map((candidate) => {
              const href = sourceHref(candidate);
              const sourceLabel =
                candidate.source_title ||
                candidate.article_title ||
                candidate.source_reference;

              return (
                <tr key={candidate.article_fact_candidate_id} className="align-top">
                  <td className="px-4 py-4">
                    <input
                      aria-label={`Select ${candidate.fact_key}`}
                      disabled={candidate.fact_status_code === "superseded"}
                      checked={selected.has(candidate.article_fact_candidate_id)}
                      onChange={() =>
                        toggleCandidate(candidate.article_fact_candidate_id)
                      }
                      type="checkbox"
                    />
                  </td>
                  <td className="px-4 py-4">
                    {href ? (
                      <Link
                        href={href}
                        className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                      >
                        {sourceLabel}
                      </Link>
                    ) : (
                      <div className="font-semibold text-[#1f2937]">
                        {sourceLabel}
                      </div>
                    )}
                    <div className="mt-1 line-clamp-2 break-all text-xs text-gray-500">
                      {candidate.source_reference}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {candidate.published_date
                        ? formatDate(candidate.published_date)
                        : "No publication date"}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-[#1f2937]">
                      {formatCode(candidate.fact_type_code)}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Field: {formatCode(candidate.field_name)}
                    </div>
                    {candidate.entity_label ? (
                      <div className="mt-2 text-xs text-gray-500">
                        Entity signal: {candidate.entity_label}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-[#1f2937]">
                      {valuePreview(candidate)}
                    </div>
                    {candidate.fact_reason ? (
                      <div className="mt-2 text-xs leading-5 text-gray-500">
                        {candidate.fact_reason}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 text-xs leading-5 text-gray-600">
                    {candidate.evidence_snippet || "-"}
                    {candidate.review_note ? (
                      <div className="mt-2 border-l-2 border-gray-200 pl-2 text-gray-500">
                        Review note: {candidate.review_note}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-xl font-bold text-[#1f2937]">
                      {formatConfidence(candidate.confidence_score)}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {candidate.review_sample_bucket || candidate.extraction_method}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge
                      status={candidate.fact_status_code}
                      label={candidate.fact_status_label}
                    />
                    {candidate.review_decision ? (
                      <div className="mt-2 text-xs text-gray-500">
                        decision: {candidate.review_decision}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 text-gray-700">
                    {candidate.reviewed_at
                      ? formatDate(candidate.reviewed_at)
                      : formatDate(candidate.generated_at)}
                    <div className="mt-1 text-xs text-gray-500">
                      {candidate.reviewed_by_name || "candidate"}
                    </div>
                  </td>
                </tr>
              );
            })}

            {candidates.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-sm text-gray-500">
                  No article fact candidates fit the current filters.
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
