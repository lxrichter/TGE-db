"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const candidateIds = useMemo(
    () =>
      candidates
        .filter((candidate) => candidate.match_status_code !== "confirmed")
        .map((candidate) => candidate.match_candidate_id),
    [candidates]
  );
  const selectedIds = [...selected];
  const allSelected =
    candidateIds.length > 0 &&
    candidateIds.every((candidateId) => selected.has(candidateId));

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

  function runAction(action: SourceMatchCandidateAction) {
    if (selectedIds.length === 0) {
      setMessage("Select one or more match candidates first.");
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
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {selected.size} selected
          </span>
          <button
            type="button"
            disabled={isPending || selected.size === 0}
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
        </div>
      </div>

      {message ? (
        <div className="border-b border-gray-200 bg-[#f7f7f7] px-5 py-3 text-sm text-gray-700">
          {message}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed text-left text-sm">
          <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-[44px] px-4 py-3 font-semibold">
                <input
                  aria-label="Select all candidates"
                  checked={allSelected}
                  onChange={toggleAll}
                  type="checkbox"
                />
              </th>
              <th className="w-[26%] px-4 py-3 font-semibold">Article Source</th>
              <th className="w-[20%] px-4 py-3 font-semibold">Matched Entity</th>
              <th className="w-[14%] px-4 py-3 font-semibold">Confidence</th>
              <th className="w-[18%] px-4 py-3 font-semibold">Reason</th>
              <th className="w-[12%] px-4 py-3 font-semibold">Status</th>
              <th className="w-[10%] px-4 py-3 font-semibold">Generated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {candidates.map((candidate) => {
              const href = entityHref(candidate);
              const isConfirmed = candidate.match_status_code === "confirmed";
              return (
                <tr key={candidate.match_candidate_id} className="align-top">
                  <td className="px-4 py-4">
                    <input
                      aria-label={`Select ${candidate.entity_label}`}
                      disabled={isConfirmed}
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
                    {candidate.match_reason || "-"}
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
    </section>
  );
}
