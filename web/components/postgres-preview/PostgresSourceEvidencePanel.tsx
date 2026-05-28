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
  getSourceFactTypeDefinition,
  SOURCE_FACT_TYPE_PRESETS,
  type SourceFactTypePreset,
} from "@/lib/sourceFactTypePresets";
import PostgresStatusBadge, {
  type PostgresStatusDomain,
} from "@/components/postgres-preview/PostgresStatusBadge";

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

function StatusBadge({
  value,
  domain = "generic",
}: {
  value: string | null;
  domain?: PostgresStatusDomain;
}) {
  return <PostgresStatusBadge domain={domain} value={value} />;
}

function fieldLabelClass() {
  return "flex min-w-0 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]";
}

function inputClass() {
  return "h-10 min-w-0 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 text-sm font-medium normal-case tracking-normal text-[var(--tge-text-primary)] outline-none focus:border-[var(--tge-brand-green)]";
}

function textAreaClass() {
  return "min-h-[72px] min-w-0 resize-y border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 py-2 text-sm font-medium normal-case tracking-normal text-[var(--tge-text-primary)] outline-none focus:border-[var(--tge-brand-green)]";
}

function primaryActionClass() {
  return "h-10 w-full self-end border border-[var(--tge-brand-green)] bg-[var(--tge-brand-green)] px-5 text-sm font-semibold text-[var(--tge-surface-card)] hover:bg-[var(--tge-brand-green-dark)] disabled:cursor-not-allowed disabled:opacity-60";
}

function secondaryActionClass() {
  return "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] font-semibold text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)]";
}

function entityLinkClass() {
  return "font-semibold text-[var(--tge-text-primary)] hover:text-[var(--tge-brand-green-dark)] hover:underline";
}

function formatEvidenceCode(value: string | null) {
  if (!value) {
    return "-";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\bmw\b/gi, "MWe")
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
    neutral:
      "border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)]",
    green:
      "border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)]",
    amber:
      "border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)]",
    red:
      "border-[var(--tge-governance-danger-border)] bg-[var(--tge-governance-danger-bg)]",
  };

  return (
    <div className={`border px-4 py-3 ${tones[tone]}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold leading-none text-[var(--tge-text-primary)]">
        {value}
      </div>
      <div className="mt-2 text-xs leading-5 text-[var(--tge-governance-muted-text)]">
        {note}
      </div>
    </div>
  );
}

function FactTypeDefinitionCard({
  evidenceType,
}: {
  evidenceType: string | null | undefined;
}) {
  const definition = getSourceFactTypeDefinition(evidenceType);

  if (!definition) {
    return null;
  }

  return (
    <div className="border border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-success-text)]">
        Fact Type Definition
      </div>
      <div className="mt-2 text-sm font-bold text-[var(--tge-text-primary)]">
        {definition.label}
      </div>
      <p className="mt-1 text-xs leading-5 text-[var(--tge-text-secondary)]">
        {definition.purpose}
      </p>
      <p className="mt-2 text-xs font-semibold leading-5 text-[var(--tge-governance-neutral-text)]">
        {definition.reviewQuestion}
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
            Accept When
          </div>
          <ul className="mt-1 space-y-1 text-xs leading-5 text-[var(--tge-text-secondary)]">
            {definition.accept.slice(0, 2).map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
            Avoid Mixing With
          </div>
          <ul className="mt-1 space-y-1 text-xs leading-5 text-[var(--tge-text-secondary)]">
            {definition.reject.slice(0, 2).map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      </div>
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
  const factPresetGroups = useMemo(
    () =>
      [
        ["core", "Core Signals"],
        ["money", "Money / Funding"],
        ["classification", "Classification"],
        ["matching", "Matching"],
      ].map(([category, label]) => ({
        category,
        label,
        presets: SOURCE_FACT_TYPE_PRESETS.filter(
          (preset) => preset.category === category
        ),
      })),
    []
  );

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
        <p className="max-w-3xl text-sm leading-6 text-[var(--tge-text-secondary)]">
          Authoritative governed source/evidence table for this entity. It
          covers all source types, including TGE articles;
          the related-news section is a filtered article view of the same
          evidence layer. Evidence is reviewed separately from database field
          updates: source record, credibility, fact type, field/value, then
          human-confirmed use.
        </p>
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 md:w-auto md:flex md:flex-wrap">
          {canManageSources ? (
            <button
              className={`h-9 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60 ${secondaryActionClass()}`}
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
              className={`h-9 px-4 text-sm ${secondaryActionClass()}`}
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
            className="inline-flex h-9 items-center justify-center border border-[var(--tge-brand-green)] bg-[var(--tge-surface-card)] px-4 text-sm font-semibold text-[var(--tge-brand-green-dark)] hover:bg-[var(--tge-governance-success-bg)]"
          >
            Add Source
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
        <div className="border border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] px-4 py-3 text-xs leading-5 text-[var(--tge-governance-success-text)]">
          {formatCount(evidenceSummary.tgeArticles.length)} ThinkGeoEnergy
          article link{evidenceSummary.tgeArticles.length === 1 ? "" : "s"} are
          connected to this record. Confirmed article links can support related
          news, source evidence, and future AI-assisted field suggestions.
        </div>
      ) : null}

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

      {showLinkForm && canManageSources ? (
        <div className="space-y-4 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-4 py-4">
          <div className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
              Quick Fact Type
            </div>
            <div className="mt-3 space-y-3">
              {factPresetGroups.map((group) => (
                <div key={group.category}>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
                    {group.label}
                  </div>
                  <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap">
                    {group.presets.map((preset) => {
                      const selected = evidenceType === preset.evidenceType;

                      return (
                        <button
                          key={preset.evidenceType}
                          className={`border px-3 py-1.5 text-xs font-semibold ${
                            selected
                              ? "border-[var(--tge-brand-green)] bg-[var(--tge-governance-success-bg)] text-[var(--tge-brand-green-dark)]"
                              : "border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)]"
                          }`}
                          type="button"
                          onClick={() => applyFactTypePreset(preset)}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-[var(--tge-governance-muted-text)]">
              Presets fill the fact/evidence type and linked field only. The
              link still needs human review before export-ready use.
            </p>
            <div className="mt-3">
              <FactTypeDefinitionCard evidenceType={evidenceType} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
            <label className={fieldLabelClass()}>
              Source
              <select
                className={inputClass()}
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
            <label className={fieldLabelClass()}>
              Confidence
              <select
                className={inputClass()}
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
            <label className="flex min-h-10 items-center justify-center gap-2 self-end border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 text-sm font-semibold text-[var(--tge-governance-neutral-text)] lg:justify-start">
              <input
                checked={isPrimaryEvidence}
                className="h-4 w-4 accent-[var(--tge-brand-green)]"
                type="checkbox"
                onChange={(event) => setIsPrimaryEvidence(event.target.checked)}
              />
              Primary evidence
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <label className={fieldLabelClass()}>
              Fact / Evidence Type
              <input
                className={inputClass()}
                placeholder="capacity_signal, record_source..."
                value={evidenceType}
                onChange={(event) => setEvidenceType(event.target.value)}
              />
            </label>
            <label className={fieldLabelClass()}>
              Linked Field
              <input
                className={inputClass()}
                placeholder="capacity, COD, owner..."
                value={linkedField}
                onChange={(event) => setLinkedField(event.target.value)}
              />
            </label>
            <label className={fieldLabelClass()}>
              Extracted Value
              <input
                className={inputClass()}
                placeholder="35 MWe, COD 2027..."
                value={extractedValue}
                onChange={(event) => setExtractedValue(event.target.value)}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px]">
            <label className={fieldLabelClass()}>
              Claim Text
              <textarea
                className={textAreaClass()}
                placeholder="What claim or data point does this source support?"
                value={claimText}
                onChange={(event) => setClaimText(event.target.value)}
              />
            </label>
            <label className={fieldLabelClass()}>
              Evidence Note
              <textarea
                className={textAreaClass()}
                placeholder="Internal note about this source-record link"
                value={evidenceNote}
                onChange={(event) => setEvidenceNote(event.target.value)}
              />
            </label>
            <button
              className={primaryActionClass()}
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
        <div className="space-y-4 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-4 py-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_160px]">
            <label className={fieldLabelClass()}>
              TGE Article Search
              <input
                className={inputClass()}
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
              className={primaryActionClass()}
              disabled={articleSearching}
              type="button"
              onClick={searchTgeArticles}
            >
              {articleSearching ? "Searching..." : "Search"}
            </button>
          </div>

          {articleResults.length > 0 ? (
            <div className="divide-y divide-[var(--tge-governance-muted-border)] border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]">
              {articleResults.map((article) => (
                <div
                  key={article.wordpress_id}
                  className="grid grid-cols-1 gap-3 px-4 py-3 hover:bg-[var(--tge-surface-subtle)] md:grid-cols-[minmax(0,1fr)_140px] md:items-start"
                >
                  <div className="min-w-0">
                    <a
                      className={entityLinkClass()}
                      href={article.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {article.title}
                    </a>
                    <div className="mt-1 text-xs text-[var(--tge-governance-muted-text)]">
                      {article.source_reference}
                      {article.published_at
                        ? ` - ${article.published_at.slice(0, 10)}`
                        : ""}
                    </div>
                    {article.excerpt ? (
                      <p className="mt-2 line-clamp-2 text-sm leading-5 text-[var(--tge-text-secondary)]">
                        {article.excerpt}
                      </p>
                    ) : null}
                  </div>
                  <button
                    className="h-9 w-full border border-[var(--tge-brand-green)] bg-[var(--tge-surface-card)] px-4 text-sm font-semibold text-[var(--tge-brand-green-dark)] hover:bg-[var(--tge-governance-success-bg)] disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
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
            <div className="border border-dashed border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-4 py-6 text-center text-sm text-[var(--tge-governance-muted-text)]">
              Search by project, company, country, or article title.
            </div>
          )}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-[1280px] table-fixed text-left text-sm">
          <thead className="bg-[var(--tge-governance-neutral-bg)] text-[11px] uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
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
          <tbody className="divide-y divide-[var(--tge-governance-muted-border)]">
            {sources.map((source) => (
              <tr
                key={source.entity_source_id}
                className="align-top hover:bg-[var(--tge-surface-subtle)]"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/sources/${source.source_id}`}
                    className={entityLinkClass()}
                  >
                    {source.source_title ||
                      source.source_reference ||
                      "Untitled source"}
                  </Link>
                  <div className="mt-1 text-xs text-[var(--tge-governance-muted-text)]">
                    {source.source_reference || source.source_id}
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--tge-governance-neutral-text)]">
                  {source.source_type_label || "-"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    domain="source"
                    value={source.credibility_status_code}
                  />
                </td>
                <td className="px-4 py-3 text-[var(--tge-governance-neutral-text)]">
                  {formatEvidenceCode(source.evidence_type)}
                </td>
                <td className="px-4 py-3 text-[var(--tge-governance-neutral-text)]">
                  {formatEvidenceCode(source.linked_field)}
                </td>
                <td className="px-4 py-3 text-[var(--tge-governance-neutral-text)]">
                  {source.extracted_value || "-"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    domain="confidence"
                    value={source.confidence_status_code}
                  />
                  {source.is_primary_evidence ? (
                    <div className="mt-2 text-xs font-semibold text-[var(--tge-brand-green-dark)]">
                      Primary
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/sources/${source.source_id}/edit`}
                    className={`inline-flex h-8 items-center justify-center px-3 text-xs ${secondaryActionClass()}`}
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
                  className="px-4 py-8 text-center text-sm text-[var(--tge-governance-muted-text)]"
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
