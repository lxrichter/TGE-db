"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PostgresPromotedOperatingAsset } from "@/lib/postgres-preview";

const promotionClass = {
  panel:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]",
  header:
    "flex flex-col gap-3 border-b border-[var(--tge-governance-neutral-border)] px-5 py-4 md:flex-row md:items-start md:justify-between",
  title: "text-lg font-bold text-[var(--tge-text-primary)]",
  body: "text-[var(--tge-text-secondary)]",
  muted: "text-[var(--tge-governance-muted-text)]",
  chip:
    "inline-flex min-h-[28px] items-center justify-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-2 text-xs font-semibold text-[var(--tge-governance-neutral-text)]",
  input:
    "mt-1 min-h-[82px] w-full resize-y border border-[var(--tge-governance-muted-border)] bg-[var(--tge-surface-card)] px-3 py-2 text-sm font-medium normal-case tracking-normal text-[var(--tge-text-primary)] outline-none focus:border-[var(--tge-brand-green)]",
  primaryButton:
    "h-10 w-full border border-[var(--tge-brand-green)] bg-[var(--tge-brand-green)] px-5 text-sm font-semibold text-[var(--tge-surface-card)] hover:bg-[var(--tge-brand-green-dark)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto",
  secondaryButton:
    "inline-flex h-8 items-center justify-center border border-[var(--tge-governance-muted-border)] bg-[var(--tge-surface-card)] px-3 text-xs font-semibold text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)]",
};

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
    <section className={promotionClass.panel}>
      <div className={promotionClass.header}>
        <div>
          <h2 className={promotionClass.title}>
            Promotion To Plant
          </h2>
          <p className={`mt-2 max-w-3xl text-sm leading-6 ${promotionClass.body}`}>
            Create a non-destructive plant draft from this project. Sources
            and company-role links are copied when available.
          </p>
        </div>
        <span className={promotionClass.chip}>
          {promotedAssets.length} linked plant{promotedAssets.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="space-y-5 px-5 py-5">
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

        {promotedAssets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-[920px] table-fixed text-left text-sm">
              <thead className="bg-[var(--tge-surface-subtle)] text-[11px] uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
                <tr>
                  <th className="w-[34%] px-4 py-3 font-semibold">Plant</th>
                  <th className="w-[18%] px-4 py-3 font-semibold">Country</th>
                  <th className="w-[18%] px-4 py-3 font-semibold">Review</th>
                  <th className="w-[18%] px-4 py-3 font-semibold">Linked</th>
                  <th className="w-[12%] px-4 py-3 font-semibold">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--tge-governance-neutral-border)]">
                {promotedAssets.map((asset) => (
                  <tr key={asset.operating_asset_id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[var(--tge-text-primary)]">
                        {asset.asset_name}
                      </div>
                      <div className={`mt-1 text-xs ${promotionClass.muted}`}>
                        {asset.legacy_plant_id || asset.operating_asset_id}
                      </div>
                    </td>
                    <td className={`px-4 py-3 ${promotionClass.body}`}>
                      {asset.country || "-"}
                    </td>
                    <td className={`px-4 py-3 ${promotionClass.body}`}>
                      {asset.review_status_code}
                    </td>
                    <td className={`px-4 py-3 ${promotionClass.body}`}>
                      {formatDate(asset.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        className={promotionClass.secondaryButton}
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
          <div className="border border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] px-4 py-3 text-sm font-medium text-[var(--tge-governance-attention-text)]">
            No promoted plant is linked yet.
          </div>
        )}

        {canPromote ? (
          <div className="space-y-3 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-4 py-4">
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
              Promotion Note
              <textarea
                className={promotionClass.input}
                placeholder="Optional context, e.g. commissioned after source review, copied as first plant draft"
                value={promotionNote}
                onChange={(event) => setPromotionNote(event.target.value)}
              />
            </label>
            <button
              className={promotionClass.primaryButton}
              disabled={saving}
              type="button"
              onClick={promoteProject}
            >
              {saving ? "Promoting..." : "Promote To Plant"}
            </button>
          </div>
        ) : (
          <div className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-4 py-3 text-sm text-[var(--tge-text-secondary)]">
            Promotion is available to editor, senior editor, and admin roles.
          </div>
        )}
      </div>
    </section>
  );
}
