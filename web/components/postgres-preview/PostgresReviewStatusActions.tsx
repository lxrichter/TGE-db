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
    return "border-[var(--tge-brand-green)] bg-[var(--tge-brand-green)] text-white hover:opacity-90";
  }

  if (code === "export_ready") {
    return "border-[var(--tge-brand-green-dark)] bg-[var(--tge-brand-green-dark)] text-white hover:opacity-90";
  }

  if (code === "needs_update" || code === "weak" || code === "outdated") {
    return "border-[var(--tge-governance-attention-border)] bg-[var(--tge-surface-card)] text-[var(--tge-governance-attention-text)] hover:bg-[var(--tge-governance-attention-bg)]";
  }

  if (code === "archived" || code === "rejected") {
    return "border-[var(--tge-governance-danger-border)] bg-[var(--tge-surface-card)] text-[var(--tge-governance-danger-text)] hover:bg-[var(--tge-governance-danger-bg)]";
  }

  if (code === "validation" || code === "needs_review") {
    return "border-[var(--tge-governance-info-border)] bg-[var(--tge-surface-card)] text-[var(--tge-governance-info-text)] hover:bg-[var(--tge-governance-info-bg)]";
  }

  return "border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)]";
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
    return "plant";
  }

  return entityType;
}

function reviewPanelStartsOpen(status: string | null) {
  return ["validation", "needs_update", "needs_review"].includes(status || "");
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

  const startsOpen = reviewPanelStartsOpen(currentStatus) || Boolean(error || message);

  return (
    <details className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]" open={startsOpen}>
      <summary className="flex cursor-pointer list-none flex-col gap-3 px-5 py-4 marker:hidden md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--tge-text-primary)]">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--tge-text-secondary)]">
            {description ||
              `Move this ${entityLabel(
                entityType
              )} through the staging review workflow without opening the full edit form.`}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap md:justify-end">
          <span className="inline-flex min-h-[28px] items-center justify-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] px-2 text-xs font-semibold text-[var(--tge-governance-neutral-text)]">
            Current: {currentStatus || "not set"}
          </span>
          <span className="inline-flex min-h-[28px] items-center justify-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] px-2 text-xs font-semibold text-[var(--tge-governance-neutral-text)]">
            {startsOpen ? "Open" : "Expand actions"}
          </span>
        </div>
      </summary>
      <div className="space-y-4 border-t border-[var(--tge-governance-neutral-border)] px-5 py-5">
        {error ? (
          <div className="border border-[var(--tge-governance-danger-border)] bg-[var(--tge-governance-danger-bg)] px-4 py-3 text-sm font-medium text-[var(--tge-governance-danger-text)]">
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
          <div className="border border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] px-4 py-3 text-sm font-medium text-[var(--tge-governance-success-text)]">
            {message}
          </div>
        ) : null}

        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--tge-text-secondary)]">
          Change Note
          <textarea
            className="mt-1 min-h-[72px] w-full resize-y border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 py-2 text-sm font-medium normal-case tracking-normal text-[var(--tge-text-primary)] outline-none focus:border-[var(--tge-brand-green)]"
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
    </details>
  );
}
