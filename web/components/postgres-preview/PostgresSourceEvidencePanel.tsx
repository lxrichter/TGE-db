"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { PostgresEntitySourceLink } from "@/lib/postgres-preview";
import type {
  SourceListItem,
  SourceReferenceOption,
  SourceLink,
} from "@/lib/services/sources";

async function readJson(res: Response) {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function sourceLabel(source: SourceListItem) {
  return (
    source.title ||
    source.source_reference ||
    source.url ||
    `Source ${source.source_id.slice(0, 8)}`
  );
}

function StatusBadge({ value }: { value: string | null }) {
  return (
    <span className="inline-flex min-h-[28px] items-center border border-gray-200 bg-[#f7f7f7] px-2 text-xs font-semibold text-gray-700">
      {value || "unknown"}
    </span>
  );
}

export default function PostgresSourceEvidencePanel({
  sources,
  entityType,
  entityId,
  sourceOptions,
  confidenceStatuses,
  canManageSources,
}: {
  sources: PostgresEntitySourceLink[];
  entityType: SourceLink["entity_type"];
  entityId: string;
  sourceOptions: SourceListItem[];
  confidenceStatuses: SourceReferenceOption[];
  canManageSources: boolean;
}) {
  const router = useRouter();
  const linkedSourceIds = useMemo(
    () => new Set(sources.map((source) => source.source_id)),
    [sources]
  );
  const availableSources = useMemo(
    () =>
      sourceOptions
        .filter((source) => !linkedSourceIds.has(source.source_id))
        .slice()
        .sort((a, b) => sourceLabel(a).localeCompare(sourceLabel(b))),
    [linkedSourceIds, sourceOptions]
  );
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [sourceId, setSourceId] = useState("");
  const [confidenceStatusCode, setConfidenceStatusCode] = useState("unknown");
  const [linkedField, setLinkedField] = useState("");
  const [extractedValue, setExtractedValue] = useState("");
  const [claimText, setClaimText] = useState("");
  const [evidenceNote, setEvidenceNote] = useState("");
  const [isPrimaryEvidence, setIsPrimaryEvidence] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function linkExistingSource() {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/postgres/source-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_id: sourceId,
          entity_type: entityType,
          entity_id: entityId,
          evidence_type: "record_source",
          evidence_note: evidenceNote,
          confidence_status_code: confidenceStatusCode,
          linked_field: linkedField,
          claim_text: claimText,
          extracted_value: extractedValue,
          is_primary_evidence: isPrimaryEvidence,
        }),
      });
      const json = await readJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to link source.");
      }

      setMessage("Source linked.");
      setSourceId("");
      setLinkedField("");
      setExtractedValue("");
      setClaimText("");
      setEvidenceNote("");
      setIsPrimaryEvidence(false);
      setShowLinkForm(false);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to link source.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="max-w-3xl text-sm leading-6 text-gray-600">
          Source/evidence links for this PostgreSQL staging record.
        </p>
        <div className="flex flex-wrap gap-2">
          {canManageSources ? (
            <button
              className="h-9 border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={availableSources.length === 0}
              type="button"
              onClick={() => setShowLinkForm((current) => !current)}
            >
              {showLinkForm ? "Close" : "Link Existing Source"}
            </button>
          ) : null}
          <Link
            href={`/sources/new?entityType=${entityType}&entityId=${entityId}`}
            className="inline-flex h-9 items-center justify-center border border-[#8dc63f] bg-white px-4 text-sm font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec]"
          >
            Add Source
          </Link>
        </div>
      </div>

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

      {showLinkForm && canManageSources ? (
        <div className="space-y-4 border border-gray-200 bg-[#fbfbfb] px-4 py-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
            <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Source
              <select
                className="h-10 min-w-0 border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-[#8dc63f]"
                value={sourceId}
                onChange={(event) => setSourceId(event.target.value)}
              >
                <option value="">Select source</option>
                {availableSources.map((source) => (
                  <option key={source.source_id} value={source.source_id}>
                    {sourceLabel(source)}
                    {source.country ? ` (${source.country})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Confidence
              <select
                className="h-10 min-w-0 border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-[#8dc63f]"
                value={confidenceStatusCode}
                onChange={(event) => setConfidenceStatusCode(event.target.value)}
              >
                {confidenceStatuses.map((status) => (
                  <option key={status.code} value={status.code}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-h-10 items-center gap-2 self-end border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700">
              <input
                checked={isPrimaryEvidence}
                className="h-4 w-4 accent-[#8dc63f]"
                type="checkbox"
                onChange={(event) => setIsPrimaryEvidence(event.target.checked)}
              />
              Primary evidence
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Linked Field
              <input
                className="h-10 min-w-0 border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-[#8dc63f]"
                placeholder="capacity, COD, owner..."
                value={linkedField}
                onChange={(event) => setLinkedField(event.target.value)}
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Extracted Value
              <input
                className="h-10 min-w-0 border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-[#8dc63f]"
                placeholder="35 MWe, COD 2027..."
                value={extractedValue}
                onChange={(event) => setExtractedValue(event.target.value)}
              />
            </label>
            <button
              className="h-10 self-end border border-[#8dc63f] bg-[#8dc63f] px-5 text-sm font-semibold text-white hover:bg-[#78ad35] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving || !sourceId}
              type="button"
              onClick={linkExistingSource}
            >
              {saving ? "Linking..." : "Link Source"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Claim Text
              <textarea
                className="min-h-[72px] min-w-0 resize-y border border-gray-300 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-[#8dc63f]"
                placeholder="What claim or data point does this source support?"
                value={claimText}
                onChange={(event) => setClaimText(event.target.value)}
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Evidence Note
              <textarea
                className="min-h-[72px] min-w-0 resize-y border border-gray-300 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-[#8dc63f]"
                placeholder="Internal note about this source-record link"
                value={evidenceNote}
                onChange={(event) => setEvidenceNote(event.target.value)}
              />
            </label>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed text-left text-sm">
          <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-[26%] px-4 py-3 font-semibold">Source</th>
              <th className="w-[14%] px-4 py-3 font-semibold">Type</th>
              <th className="w-[14%] px-4 py-3 font-semibold">Credibility</th>
              <th className="w-[14%] px-4 py-3 font-semibold">Field</th>
              <th className="w-[14%] px-4 py-3 font-semibold">Value</th>
              <th className="w-[10%] px-4 py-3 font-semibold">Confidence</th>
              <th className="w-[8%] px-4 py-3 font-semibold">Open</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sources.map((source) => (
              <tr key={source.entity_source_id} className="align-top">
                <td className="px-4 py-3">
                  <Link
                    href={`/sources/${source.source_id}`}
                    className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                  >
                    {source.source_title ||
                      source.source_reference ||
                      "Untitled source"}
                  </Link>
                  <div className="mt-1 text-xs text-gray-500">
                    {source.source_reference || source.source_id}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {source.source_type_label || "-"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge value={source.credibility_status_code} />
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {source.linked_field || "-"}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {source.extracted_value || "-"}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {source.confidence_status_code}
                  {source.is_primary_evidence ? (
                    <div className="mt-2 text-xs font-semibold text-[#4f7f1f]">
                      Primary
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/sources/${source.source_id}/edit`}
                    className="inline-flex h-8 items-center border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}

            {sources.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-gray-500"
                >
                  No source links yet. Add one before this record can become
                  export-ready.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
