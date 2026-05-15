"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ApprovePlantButton({
  plantId,
}: {
  plantId: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleApprove() {
    try {
      setSubmitting(true);

      const res = await fetch(`/api/plants/${plantId}/approve`, {
        method: "POST",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.error || "Failed to approve plant");
      }

      router.refresh();
    } catch (error: any) {
      alert(error?.message || "Could not approve plant.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleApprove}
      disabled={submitting}
      className="inline-flex min-h-[32px] items-center justify-center whitespace-nowrap border border-green-400 bg-green-100 px-3 py-1 text-[11px] font-semibold leading-none text-green-800 transition hover:bg-green-200 disabled:cursor-not-allowed disabled:opacity-60"
      title="Approve this plant"
    >
      {submitting ? "Approving..." : "Approve"}
    </button>
  );
}