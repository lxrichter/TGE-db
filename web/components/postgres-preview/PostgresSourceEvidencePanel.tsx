"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { PostgresEntitySourceLink } from "@/lib/postgres-preview";
import { formatCount } from "@/lib/format";
import type {
  SourceListItem,
  SourceReferenceOption,
  SourceLink,
} from "@/lib/services/sources";
import {
  SOURCE_FACT_TYPE_PRESETS,
  type SourceFactTypePreset,
} from "@/lib/sourceFactTypePresets";

type TgeArticleResult = {
  wordpress_id: number;
  source_reference: string;
  title: string;
  url: string;
  published_at: string | null;
  excerpt: string | null;
};

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

function formatEvidenceCode(value: string | null) {
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

function EvidenceSummaryTile({
  label,
  value,
  note,
  tone = "neutral",
}: {
  label: string;
  value: string;
  note: string;
  tone?: "neutral" | "green" | "amber" | "red";
}) {
  const tones = {
    neutral: "border-gray-200 bg-[#fbfbfb]",
    green: "border-[#b9d98b] bg-[#f1f8e8]",
    amber: "border-amber-200 bg-amber-50",
    red: "border-red-200 bg-red-50",
  };

  return (
    <div className={`border px-4 py-3 ${tones[tone]}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold leading-none text-[#1f2937]">
        {value}
      </div>
      <div className="mt-2 text-xs leading-5 text-gray-500">{note}</div>
    </div>
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
  const evidenceSummary = useMemo(() => {
    const credibleSources = sources.filter(
      (source) => source.credibility_status_code === "credible"
    );
    const attentionSources = sources.filter((source) =>
      ["needs_review", "weak", "outdated", "rejected"].includes(
        source.credibility_status_code || ""
      )
    );
    const primaryEvidence = sources.filter((source) => source.is_primary_evidence);
    const fieldLinked = sources.filter(
      (source) =>
        Boolean(source.linked_field) ||
        Boolean(source.extracted_value) ||
        Boolean(source.claim_text)
    );
    const tgeArticles = sources.filter(
      (source) => source.source_type_code === "tge_article"
    );

    return {
      credibleSources,
      attentionSources,
      primaryEvidence,
      fieldLinked,
      tgeArticles,
    };
  }, [sources]);
  const availableSources = useMemo(
    () =>
      sourceOptions
        .filter((source) => !linkedSourceIds.has(source.source_id))
        .slice()
        .sort((a, b) => sourceLabel(a).localeCompare(sourceLabel(b))),
    [linkedSourceIds, sourceOptions]
  );
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [showTgeArticleSearch, setShowTgeArticleSearch] = useState(false);
  const [sourceId, setSourceId] = useState("");
  const [evidenceType, setEvidenceType] = useState("record_source");
  const [confidenceStatusCode, setConfidenceStatusCode] = useState("unknown");
  const [linkedField, setLinkedField] = useState("");
  const [extractedValue, setExtractedValue] = useState("");
  const [claimText, setClaimText] = useState("");
  const [evidenceNote, setEvidenceNote] = useState("");
  const [isPrimaryEvidence, setIsPrimaryEvidence] = useState(false);
  const [articleSearch, setArticleSearch] = useState("");
  const [articleResults, setArticleResults] = useState<TgeArticleResult[]>([]);
  const [articleSearching, setArticleSearching] = useState(false);
  const [articleImportingId, setArticleImportingId] = useState<number | null>(
    null
  );
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
          evidence_type: evidenceType,
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
      setEvidenceType("record_source");
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

  async function searchTgeArticles() {
    setArticleSearching(true);
    setError("");
    setMessage("");

    try {
      const params = new URLSearchParams({
        limit: "8",
      });

      if (articleSearch.trim()) {
        params.set("search", articleSearch.trim());
      }

      const res = await fetch(`/api/postgres/tge-articles?${params.toString()}`);
      const json = await readJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to search TGE articles.");
      }

      setArticleResults(json.articles || []);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to search TGE articles."
      );
    } finally {
      setArticleSearching(false);
    }
  }

  async function importTgeArticle(article: TgeArticleResult) {
    setArticleImportingId(article.wordpress_id);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/postgres/tge-articles/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordpress_id: article.wordpress_id,
          entity_type: entityType,
          entity_id: entityId,
          evidence_type: "tge_article",
          evidence_note: "Linked from ThinkGeoEnergy article search.",
          confidence_status_code: "unknown",
        }),
      });
      const json = await readJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to import TGE article.");
      }

      setMessage(
        json.link_created
          ? "TGE article imported and linked."
          : "TGE article source already existed and is linked."
      );
      setShowTgeArticleSearch(false);
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to import TGE article."
      );
    } finally {
      setArticleImportingId(null);
    }
  }

  function applyFactTypePreset(preset: SourceFactTypePreset) {
    setEvidenceType(preset.evidenceType);
    setLinkedField(preset.linkedField);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="max-w-3xl text-sm leading-6 text-gray-600">
          Source/evidence links for this PostgreSQL staging record. Evidence
          is reviewed separately from database field updates: source record,
          credibility, fact type, field/value, then human-confirmed use.
        </p>
        <div className="flex flex-wrap gap-2">
          {canManageSources ? (
            <button
              className="h-9 border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={availableSources.length === 0}
              type="button"
              onClick={() => {
                setShowLinkForm((current) => !current);
                setShowTgeArticleSearch(false);
              }}
            >
              {showLinkForm ? "Close" : "Link Existing Source"}
            </button>
          ) : null}
          {canManageSources ? (
            <button
              className="h-9 border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
              type="button"
              onClick={() => {
                setShowTgeArticleSearch((current) => !current);
                setShowLinkForm(false);
              }}
            >
              {showTgeArticleSearch ? "Close" : "Find TGE Article"}
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <EvidenceSummaryTile
          label="Linked"
          value={formatCount(sources.length)}
          note="Source-record links"
          tone={sources.length > 0 ? "neutral" : "red"}
        />
        <EvidenceSummaryTile
          label="Credible"
          value={`${formatCount(evidenceSummary.credibleSources.length)}/${formatCount(
            sources.length
          )}`}
          note="Marked credible"
          tone={evidenceSummary.credibleSources.length > 0 ? "green" : "amber"}
        />
        <EvidenceSummaryTile
          label="Primary"
          value={formatCount(evidenceSummary.primaryEvidence.length)}
          note="Primary evidence flags"
          tone={evidenceSummary.primaryEvidence.length > 0 ? "green" : "neutral"}
        />
        <EvidenceSummaryTile
          label="Field-Linked"
          value={formatCount(evidenceSummary.fieldLinked.length)}
          note="Field, value, or claim"
          tone={evidenceSummary.fieldLinked.length > 0 ? "green" : "neutral"}
        />
        <EvidenceSummaryTile
          label="Needs Care"
          value={formatCount(evidenceSummary.attentionSources.length)}
          note="Review, weak, outdated, or rejected"
          tone={evidenceSummary.attentionSources.length > 0 ? "amber" : "neutral"}
        />
      </div>

      {evidenceSummary.tgeArticles.length > 0 ? (
        <div className="border border-[#d7e8bf] bg-[#f5faef] px-4 py-3 text-xs leading-5 text-[#4f7f1f]">
          {formatCount(evidenceSummary.tgeArticles.length)} ThinkGeoEnergy
          article link{evidenceSummary.tgeArticles.length === 1 ? "" : "s"} are
          connected to this record. Confirmed article links can support related
          news, source evidence, and future AI-assisted field suggestions.
        </div>
      ) : null}

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
          <div className="border border-gray-200 bg-white px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Quick Fact Type
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {SOURCE_FACT_TYPE_PRESETS.map((preset) => {
                const selected = evidenceType === preset.evidenceType;

                return (
                  <button
                    key={preset.evidenceType}
                    className={`border px-3 py-1.5 text-xs font-semibold ${
                      selected
                        ? "border-[#8dc63f] bg-[#edf7df] text-[#4f7f1f]"
                        : "border-gray-200 bg-white text-gray-700 hover:border-[#8dc63f]"
                    }`}
                    type="button"
                    onClick={() => applyFactTypePreset(preset)}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Presets fill the fact/evidence type and linked field only. The
              link still needs human review before export-ready use.
            </p>
          </div>

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
              Fact / Evidence Type
              <input
                className="h-10 min-w-0 border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-[#8dc63f]"
                placeholder="capacity_signal, record_source..."
                value={evidenceType}
                onChange={(event) => setEvidenceType(event.target.value)}
              />
            </label>
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
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px]">
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
            <button
              className="h-10 self-end border border-[#8dc63f] bg-[#8dc63f] px-5 text-sm font-semibold text-white hover:bg-[#78ad35] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving || !sourceId}
              type="button"
              onClick={linkExistingSource}
            >
              {saving ? "Linking..." : "Link Source"}
            </button>
          </div>
        </div>
      ) : null}

      {showTgeArticleSearch && canManageSources ? (
        <div className="space-y-4 border border-gray-200 bg-[#fbfbfb] px-4 py-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_160px]">
            <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              TGE Article Search
              <input
                className="h-10 min-w-0 border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-[#8dc63f]"
                placeholder="Project, company, country, article title..."
                value={articleSearch}
                onChange={(event) => setArticleSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void searchTgeArticles();
                  }
                }}
              />
            </label>
            <button
              className="h-10 self-end border border-[#8dc63f] bg-[#8dc63f] px-5 text-sm font-semibold text-white hover:bg-[#78ad35] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={articleSearching}
              type="button"
              onClick={searchTgeArticles}
            >
              {articleSearching ? "Searching..." : "Search"}
            </button>
          </div>

          {articleResults.length > 0 ? (
            <div className="divide-y divide-gray-100 border border-gray-200 bg-white">
              {articleResults.map((article) => (
                <div
                  key={article.wordpress_id}
                  className="grid grid-cols-1 gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_140px] md:items-start"
                >
                  <div className="min-w-0">
                    <a
                      className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                      href={article.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {article.title}
                    </a>
                    <div className="mt-1 text-xs text-gray-500">
                      {article.source_reference}
                      {article.published_at
                        ? ` - ${article.published_at.slice(0, 10)}`
                        : ""}
                    </div>
                    {article.excerpt ? (
                      <p className="mt-2 line-clamp-2 text-sm leading-5 text-gray-600">
                        {article.excerpt}
                      </p>
                    ) : null}
                  </div>
                  <button
                    className="h-9 border border-[#8dc63f] bg-white px-4 text-sm font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={articleImportingId === article.wordpress_id}
                    type="button"
                    onClick={() => importTgeArticle(article)}
                  >
                    {articleImportingId === article.wordpress_id
                      ? "Linking..."
                      : "Import & Link"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-500">
              Search by project, company, country, or article title.
            </div>
          )}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed text-left text-sm">
          <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-[26%] px-4 py-3 font-semibold">Source</th>
              <th className="w-[14%] px-4 py-3 font-semibold">Type</th>
              <th className="w-[13%] px-4 py-3 font-semibold">Credibility</th>
              <th className="w-[13%] px-4 py-3 font-semibold">Fact Type</th>
              <th className="w-[12%] px-4 py-3 font-semibold">Field</th>
              <th className="w-[12%] px-4 py-3 font-semibold">Value</th>
              <th className="w-[10%] px-4 py-3 font-semibold">Confidence</th>
              <th className="w-[8%] px-4 py-3 font-semibold">Edit</th>
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
                  {formatEvidenceCode(source.evidence_type)}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {formatEvidenceCode(source.linked_field)}
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
                  colSpan={8}
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
