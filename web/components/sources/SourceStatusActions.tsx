"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type SourceStatusAction = {
  code: string;
  label: string;
  description: string;
  className: string;
};

const statusActions: SourceStatusAction[] = [
  {
    code: "credible",
    label: "Mark Credible",
    description: "Reviewed and usable for internal/export-ready evidence.",
    className:
      "border-[var(--tge-brand-green)] bg-[var(--tge-brand-green)] text-[var(--tge-surface-card)] hover:bg-[var(--tge-brand-green-dark)]",
  },
  {
    code: "weak",
    label: "Mark Weak",
    description: "Useful context, but weak or indirect evidence.",
    className:
      "border-[var(--tge-governance-attention-border)] bg-[var(--tge-surface-card)] text-[var(--tge-governance-attention-text)] hover:bg-[var(--tge-governance-attention-bg)]",
  },
  {
    code: "outdated",
    label: "Mark Outdated",
    description: "Stale or superseded source needing replacement.",
    className:
      "border-[var(--tge-governance-attention-border)] bg-[var(--tge-surface-card)] text-[var(--tge-governance-attention-text)] hover:bg-[var(--tge-governance-attention-bg)]",
  },
  {
    code: "rejected",
    label: "Reject",
    description: "Do not use this source as supporting evidence.",
    className:
      "border-[var(--tge-governance-danger-border)] bg-[var(--tge-surface-card)] text-[var(--tge-governance-danger-text)] hover:bg-[var(--tge-governance-danger-bg)]",
  },
  {
    code: "needs_review",
    label: "Needs Review",
    description: "Return this source to the review queue.",
    className:
      "border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)]",
  },
];

async function safeJson(res: Response) {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export default function SourceStatusActions({
  sourceId,
  currentStatus,
}: {
  sourceId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function setStatus(statusCode: string) {
    setSavingStatus(statusCode);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`/api/postgres/sources/${sourceId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credibility_status_code: statusCode }),
      });
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to update source status.");
      }

      setMessage("Source status updated.");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update source status."
      );
    } finally {
      setSavingStatus(null);
    }
  }

  return (
    <section className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]">
      <div className="border-b border-[var(--tge-governance-neutral-border)] px-5 py-4">
        <h2 className="text-lg font-bold text-[var(--tge-text-primary)]">
          Editor Review Actions
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--tge-text-secondary)]">
          Move this source through the MVP credibility workflow without editing
          the full source profile.
        </p>
      </div>
      <div className="space-y-4 px-5 py-5">
        {error ? (
          <div className="border border-[var(--tge-governance-danger-border)] bg-[var(--tge-governance-danger-bg)] px-4 py-3 text-sm font-medium text-[var(--tge-governance-danger-text)]">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="border border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] px-4 py-3 text-sm font-medium text-[var(--tge-governance-success-text)]">
            {message}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          {statusActions.map((action) => {
            const isCurrent = action.code === currentStatus;
            const isSaving = savingStatus === action.code;

            return (
              <button
                key={action.code}
                className={`min-h-[88px] border px-4 py-3 text-left text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${action.className}`}
                disabled={Boolean(savingStatus) || isCurrent}
                type="button"
                onClick={() => setStatus(action.code)}
              >
                <span>{isSaving ? "Saving..." : action.label}</span>
                <span className="mt-2 block text-xs font-medium leading-5 opacity-80">
                  {isCurrent ? "Current status." : action.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
