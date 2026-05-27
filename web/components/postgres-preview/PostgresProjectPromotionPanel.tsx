"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PostgresPromotedOperatingAsset } from "@/lib/postgres-preview";

async function safeJson(res: Response) {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toISOString().slice(0, 10);
}

export default function PostgresProjectPromotionPanel({
  projectId,
  promotedAssets,
  canPromote,
}: {
  projectId: string;
  promotedAssets: PostgresPromotedOperatingAsset[];
  canPromote: boolean;
}) {
  const router = useRouter();
  const [promotionNote, setPromotionNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function promoteProject() {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(
        `/api/postgres-preview/projects/${projectId}/promote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promotion_note: promotionNote }),
        }
      );
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to promote project.");
      }

      const created = Boolean(json.promotion?.created);
      const operatingAssetId =
        json.promotion?.operatingAsset?.operating_asset_id || "";
      setMessage(
        created
          ? "Plant record created from project."
          : "A plant record already exists for this project."
      );
      setPromotionNote("");
      router.refresh();

      if (operatingAssetId) {
        router.push(`/postgres-preview/operating-assets/${operatingAssetId}`);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to promote project.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="border border-gray-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1f2937]">
            Promotion To Plant
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Create a non-destructive plant draft from this project. Sources
            and company-role links are copied when available.
          </p>
        </div>
        <span className="inline-flex min-h-[28px] items-center justify-center border border-gray-200 bg-[#f7f7f7] px-2 text-xs font-semibold text-gray-700">
          {promotedAssets.length} linked plant{promotedAssets.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="space-y-5 px-5 py-5">
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

        {promotedAssets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-[920px] table-fixed text-left text-sm">
              <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="w-[34%] px-4 py-3 font-semibold">Plant</th>
                  <th className="w-[18%] px-4 py-3 font-semibold">Country</th>
                  <th className="w-[18%] px-4 py-3 font-semibold">Review</th>
                  <th className="w-[18%] px-4 py-3 font-semibold">Linked</th>
                  <th className="w-[12%] px-4 py-3 font-semibold">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {promotedAssets.map((asset) => (
                  <tr key={asset.operating_asset_id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#1f2937]">
                        {asset.asset_name}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {asset.legacy_plant_id || asset.operating_asset_id}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {asset.country || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {asset.review_status_code}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatDate(asset.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        className="inline-flex h-8 items-center justify-center border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                        href={`/postgres-preview/operating-assets/${asset.operating_asset_id}`}
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            No promoted plant is linked yet.
          </div>
        )}

        {canPromote ? (
          <div className="space-y-3 border border-gray-200 bg-[#fbfbfb] px-4 py-4">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Promotion Note
              <textarea
                className="mt-1 min-h-[82px] w-full resize-y border border-gray-300 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-[#8dc63f]"
                placeholder="Optional context, e.g. commissioned after source review, copied as first plant draft"
                value={promotionNote}
                onChange={(event) => setPromotionNote(event.target.value)}
              />
            </label>
            <button
              className="h-10 w-full border border-[#8dc63f] bg-[#8dc63f] px-5 text-sm font-semibold text-white hover:bg-[#78ad35] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              disabled={saving}
              type="button"
              onClick={promoteProject}
            >
              {saving ? "Promoting..." : "Promote To Plant"}
            </button>
          </div>
        ) : (
          <div className="border border-gray-200 bg-[#f7f7f7] px-4 py-3 text-sm text-gray-600">
            Promotion is available to editor, senior editor, and admin roles.
          </div>
        )}
      </div>
    </section>
  );
}
