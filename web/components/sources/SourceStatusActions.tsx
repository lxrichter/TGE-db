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
      "border-[#8dc63f] bg-[#8dc63f] text-white hover:bg-[#78ad35]",
  },
  {
    code: "weak",
    label: "Mark Weak",
    description: "Useful context, but weak or indirect evidence.",
    className: "border-amber-200 bg-white text-amber-800 hover:bg-amber-50",
  },
  {
    code: "outdated",
    label: "Mark Outdated",
    description: "Stale or superseded source needing replacement.",
    className: "border-amber-200 bg-white text-amber-800 hover:bg-amber-50",
  },
  {
    code: "rejected",
    label: "Reject",
    description: "Do not use this source as supporting evidence.",
    className: "border-red-200 bg-white text-red-700 hover:bg-red-50",
  },
  {
    code: "needs_review",
    label: "Needs Review",
    description: "Return this source to the review queue.",
    className: "border-gray-300 bg-white text-gray-700 hover:border-[#8dc63f]",
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
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-bold text-[#1f2937]">Editor Review Actions</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
          Move this source through the MVP credibility workflow without editing
          the full source record.
        </p>
      </div>
      <div className="space-y-4 px-5 py-5">
        {error ? (
          <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="border border-[#b9d98b] bg-[#f1f8e8] px-4 py-3 text-sm font-medium text-[#3f6f19]">
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
