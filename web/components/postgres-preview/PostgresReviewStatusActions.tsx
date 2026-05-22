"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export type PostgresStatusOption = {
  code: string;
  label: string;
  sort_order?: number;
  is_active?: boolean;
};

type ReviewEntityType = "project" | "operating_asset" | "company" | "source";

const editorOnlyReviewStatuses = new Set(["approved", "export_ready", "archived"]);
const editorOnlySourceStatuses = new Set(["credible", "weak", "outdated", "rejected"]);

function safeJson(text: string) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function getApiIssues(json: unknown) {
  if (!json || typeof json !== "object" || !("issues" in json)) {
    return [];
  }

  const issues = (json as { issues?: unknown }).issues;
  if (!Array.isArray(issues)) {
    return [];
  }

  return issues.filter((issue): issue is string => typeof issue === "string");
}

function getApiError(json: unknown, fallback: string) {
  if (!json || typeof json !== "object" || !("error" in json)) {
    return fallback;
  }

  const error = (json as { error?: unknown }).error;
  return typeof error === "string" && error.trim() ? error : fallback;
}

function statusTone(code: string) {
  if (code === "approved" || code === "credible") {
    return "border-[#8dc63f] bg-[#8dc63f] text-white hover:bg-[#78ad35]";
  }

  if (code === "export_ready") {
    return "border-[#4f7f1f] bg-[#4f7f1f] text-white hover:bg-[#436e1a]";
  }

  if (code === "needs_update" || code === "weak" || code === "outdated") {
    return "border-amber-200 bg-white text-amber-800 hover:bg-amber-50";
  }

  if (code === "archived" || code === "rejected") {
    return "border-red-200 bg-white text-red-700 hover:bg-red-50";
  }

  if (code === "validation" || code === "needs_review") {
    return "border-blue-200 bg-white text-blue-800 hover:bg-blue-50";
  }

  return "border-gray-300 bg-white text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]";
}

function actionLabel(option: PostgresStatusOption) {
  const label = option.label || option.code;

  if (option.code === "export_ready") {
    return "Mark Export Ready";
  }

  if (option.code === "needs_update") {
    return "Mark Needs Update";
  }

  if (option.code === "needs_review") {
    return "Needs Review";
  }

  if (option.code === "rejected") {
    return "Reject";
  }

  return `Mark ${label}`;
}

function entityLabel(entityType: ReviewEntityType) {
  if (entityType === "operating_asset") {
    return "plant/facility";
  }

  return entityType;
}

export default function PostgresReviewStatusActions({
  entityType,
  entityId,
  currentStatus,
  reviewStatuses,
  sourceStatuses = [],
  title = "Review Workflow",
  description,
  canReviewStatus = false,
  onStatusChanged,
}: {
  entityType: ReviewEntityType;
  entityId: string;
  currentStatus: string | null;
  reviewStatuses: PostgresStatusOption[];
  sourceStatuses?: PostgresStatusOption[];
  title?: string;
  description?: string;
  canReviewStatus?: boolean;
  onStatusChanged?: (statusCode: string) => void;
}) {
  const router = useRouter();
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [eventNote, setEventNote] = useState("");
  const [error, setError] = useState("");
  const [errorIssues, setErrorIssues] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const statusOptions = useMemo(() => {
    const options = entityType === "source" ? sourceStatuses : reviewStatuses;

    return options
      .filter((option) => option.is_active !== false)
      .filter((option) => {
        if (canReviewStatus) {
          return true;
        }

        return entityType === "source"
          ? !editorOnlySourceStatuses.has(option.code)
          : !editorOnlyReviewStatuses.has(option.code);
      })
      .slice()
      .sort((a, b) => {
        const aOrder = a.sort_order ?? 0;
        const bOrder = b.sort_order ?? 0;

        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }

        return a.label.localeCompare(b.label);
      });
  }, [canReviewStatus, entityType, reviewStatuses, sourceStatuses]);

  async function setStatus(statusCode: string) {
    setSavingStatus(statusCode);
    setError("");
    setErrorIssues([]);
    setMessage("");

    try {
      const res = await fetch("/api/postgres-preview/research-ops/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          status_code: statusCode,
          event_note: eventNote,
        }),
      });
      const json = await safeJson(await res.text());

      if (!res.ok || !json?.success) {
        setErrorIssues(getApiIssues(json));
        throw new Error(getApiError(json, "Failed to update workflow status."));
      }

      setMessage(`Status updated to ${statusCode}.`);
      setEventNote("");
      onStatusChanged?.(statusCode);
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update workflow status."
      );
    } finally {
      setSavingStatus(null);
    }
  }

  if (statusOptions.length === 0) {
    return null;
  }

  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-bold text-[#1f2937]">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
          {description ||
            `Move this ${entityLabel(
              entityType
            )} through the staging review workflow without opening the full edit form.`}
        </p>
      </div>
      <div className="space-y-4 px-5 py-5">
        {error ? (
          <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <div>{error}</div>
            {errorIssues.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5">
                {errorIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        {message ? (
          <div className="border border-[#b9d98b] bg-[#f1f8e8] px-4 py-3 text-sm font-medium text-[#3f6f19]">
            {message}
          </div>
        ) : null}

        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Change Note
          <textarea
            className="mt-1 min-h-[72px] w-full resize-y border border-gray-300 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-[#8dc63f]"
            placeholder="Optional reason, e.g. source checked, moved back after edit, approved for internal use"
            value={eventNote}
            onChange={(event) => setEventNote(event.target.value)}
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {statusOptions.map((option) => {
            const isCurrent = option.code === currentStatus;
            const isSaving = savingStatus === option.code;

            return (
              <button
                key={option.code}
                className={`min-h-[78px] border px-4 py-3 text-left text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${statusTone(
                  option.code
                )}`}
                disabled={Boolean(savingStatus) || isCurrent}
                type="button"
                onClick={() => setStatus(option.code)}
              >
                <span>{isSaving ? "Saving..." : actionLabel(option)}</span>
                <span className="mt-2 block text-xs font-medium leading-5 opacity-80">
                  {isCurrent ? "Current status." : option.code}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
