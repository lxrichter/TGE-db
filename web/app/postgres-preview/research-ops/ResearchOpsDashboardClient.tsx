"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { formatCount } from "@/lib/format";
import PostgresReviewStatusActions, {
  type PostgresStatusOption,
} from "@/components/postgres-preview/PostgresReviewStatusActions";
import PostgresStatusBadge, {
  type PostgresStatusDomain,
} from "@/components/postgres-preview/PostgresStatusBadge";
import PostgresStatusLegend from "@/components/postgres-preview/PostgresStatusLegend";
import PostgresHierarchyMarker, {
  type PostgresHierarchyTone,
} from "@/components/postgres-preview/PostgresHierarchyMarker";
import PostgresSectionJumpNav from "@/components/postgres-preview/PostgresSectionJumpNav";
import {
  type PostgresResearchOpsDashboard,
  type PostgresFieldSuggestionCandidate,
  type PostgresFieldSuggestionSummary,
  type PostgresResearchOpsIssue,
  type PostgresResearchOpsIssueReferenceData,
  type PostgresResearchOpsQueue,
  type PostgresResearchOpsQueueItem,
  type PostgresResearchOpsRecentEdit,
  type ResearchOpsQueueKey,
  type ResearchOpsQueueSeverity,
} from "@/lib/postgres-preview";
import type { SourceMatchCandidateSummary } from "@/lib/services/sources";
import type { ArticleFactCandidateSummary } from "@/lib/services/article-facts";

type EntityType = PostgresResearchOpsQueueItem["entity_type"];
type ResearchOpsRecord = PostgresResearchOpsQueueItem | PostgresResearchOpsRecentEdit;

type QueueFilter = "all" | ResearchOpsQueueKey;
type SeverityFilter = "all" | ResearchOpsQueueSeverity;
type EntityFilter = "all" | EntityType;
type BulkTarget = "records" | "sources";
type AssignmentFilter = "all" | "mine" | "unassigned" | `user:${string}`;
type FieldSuggestionReviewAction =
  | "confirm"
  | "reject"
  | "needs_review"
  | "apply";
type ActiveOperationalFilter = {
  key:
    | "queue"
    | "severity"
    | "entity"
    | "country"
    | "search"
    | "researcher"
    | "showEmpty";
  label: string;
  value: string;
};
type QueueGroupKey =
  | "missing_data"
  | "sources_evidence"
  | "validation_approval"
  | "duplicates_stale"
  | "classification";
type ResearcherActivityRow = {
  name: string;
  recentEdits: number;
  sourceUpdates: number;
  approvedOrReady: number;
  needsReview: number;
  auditedChanges: number;
  assignedOpenIssues: number;
  createdIssues: number;
  resolvedIssues: number;
  lastUpdatedAt: string | null;
};

const editorOnlyReviewStatuses = new Set(["approved", "export_ready", "archived"]);
const editorOnlySourceStatuses = new Set(["credible", "weak", "outdated", "rejected"]);
const exportBlockingQueueKeys = new Set<ResearchOpsQueueKey>([
  "needs_source",
  "missing_country",
  "missing_lifecycle",
  "missing_use_type",
  "suspected_duplicates",
]);

const opsClass = {
  panel:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]",
  panelSubtle:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)]",
  eyebrow:
    "text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]",
  title: "text-[var(--tge-text-primary)]",
  body: "text-[var(--tge-text-secondary)]",
  muted: "text-[var(--tge-governance-muted-text)]",
  primaryButton:
    "inline-flex h-9 w-full items-center justify-center border border-[var(--tge-brand-green)] bg-[var(--tge-surface-card)] px-4 text-sm font-semibold text-[var(--tge-brand-green-dark)] hover:bg-[var(--tge-governance-success-bg)] sm:w-auto",
  secondaryButton:
    "inline-flex h-9 w-full items-center justify-center border border-[var(--tge-governance-muted-border)] bg-[var(--tge-surface-card)] px-4 text-sm font-semibold text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)] sm:w-auto",
  compactButton:
    "inline-flex min-h-8 items-center justify-center border border-[var(--tge-governance-muted-border)] bg-[var(--tge-surface-card)] px-3 text-xs font-semibold text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)] sm:justify-start",
  routeCard:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-4 py-4 hover:border-[var(--tge-brand-green)] hover:bg-[var(--tge-governance-success-bg)]",
  dangerPanel:
    "border border-[var(--tge-governance-danger-border)] bg-[var(--tge-governance-danger-bg)]",
  dangerCard:
    "border border-[var(--tge-governance-danger-border)] bg-[var(--tge-surface-card)] px-4 py-4",
  divider: "border-[var(--tge-governance-neutral-border)]",
};

const queueGroupDefinitions: Array<{
  key: QueueGroupKey;
  title: string;
  description: string;
  queueKeys: ResearchOpsQueueKey[];
}> = [
  {
    key: "missing_data",
    title: "Missing Data",
    description: "Core field gaps that slow validation, maps, exports, and analysis.",
    queueKeys: [
      "missing_country",
      "missing_coordinates",
      "missing_capacity",
      "missing_company_link",
      "missing_lifecycle",
      "missing_use_type",
    ],
  },
  {
    key: "sources_evidence",
    title: "Sources / Evidence",
    description: "Projects, plants, companies, and sources that need evidence coverage or credibility review.",
    queueKeys: ["needs_source", "source_needs_review", "weak_or_outdated_source"],
  },
  {
    key: "validation_approval",
    title: "Validation / Approval",
    description: "Draft, validation, or updated items that need editor attention.",
    queueKeys: ["needs_approval", "needs_update"],
  },
  {
    key: "duplicates_stale",
    title: "Duplicates / Stale",
    description: "Duplicate warnings and items that should be rechecked.",
    queueKeys: ["suspected_duplicates", "needs_update"],
  },
  {
    key: "classification",
    title: "Classification",
    description: "Use-type and direct-use classification work.",
    queueKeys: ["missing_use_type", "direct_use_classification"],
  },
];

type QueueListTarget = {
  label: string;
  href: string;
  note: string;
};

type QueueTargetConfig = {
  label: string;
  basePath: string;
  query: Record<string, string>;
  note: string;
};

const queueListTargetConfig: Partial<
  Record<ResearchOpsQueueKey, QueueTargetConfig[]>
> = {
  needs_source: [
    {
      label: "Projects",
      basePath: "/postgres-preview/projects",
      query: { missing: "source" },
      note: "Projects missing evidence",
    },
    {
      label: "Plants",
      basePath: "/postgres-preview/operating-assets",
      query: { missing: "source" },
      note: "Plants missing evidence",
    },
    {
      label: "Companies",
      basePath: "/postgres-preview/companies",
      query: { missing: "source" },
      note: "Companies missing evidence",
    },
  ],
  source_needs_review: [
    {
      label: "Sources",
      basePath: "/sources",
      query: { status: "needs_review" },
      note: "Source credibility review",
    },
  ],
  weak_or_outdated_source: [
    {
      label: "Sources",
      basePath: "/sources",
      query: { quality: "weak_outdated_rejected" },
      note: "Weak, outdated, or rejected sources",
    },
  ],
  missing_country: [
    {
      label: "Projects",
      basePath: "/postgres-preview/projects",
      query: { missing: "country" },
      note: "Projects without country",
    },
    {
      label: "Plants",
      basePath: "/postgres-preview/operating-assets",
      query: { missing: "country" },
      note: "Plants without country",
    },
  ],
  missing_lifecycle: [
    {
      label: "Projects",
      basePath: "/postgres-preview/projects",
      query: { missing: "status" },
      note: "Projects without lifecycle",
    },
    {
      label: "Plants",
      basePath: "/postgres-preview/operating-assets",
      query: { missing: "status" },
      note: "Plants without status",
    },
  ],
  missing_use_type: [
    {
      label: "Projects",
      basePath: "/postgres-preview/projects",
      query: { missing: "use_type" },
      note: "Projects without use type",
    },
    {
      label: "Plants",
      basePath: "/postgres-preview/operating-assets",
      query: { missing: "use_type" },
      note: "Plants without use type",
    },
  ],
  missing_company_link: [
    {
      label: "Projects",
      basePath: "/postgres-preview/projects",
      query: { missing: "company_link" },
      note: "Projects without company links",
    },
    {
      label: "Plants",
      basePath: "/postgres-preview/operating-assets",
      query: { missing: "company_link" },
      note: "Plants without company links",
    },
  ],
  missing_coordinates: [
    {
      label: "Projects",
      basePath: "/postgres-preview/projects",
      query: { missing: "coordinates" },
      note: "Projects missing map coordinates",
    },
    {
      label: "Plants",
      basePath: "/postgres-preview/operating-assets",
      query: { missing: "coordinates" },
      note: "Plants missing map coordinates",
    },
  ],
  missing_capacity: [
    {
      label: "Projects",
      basePath: "/postgres-preview/projects",
      query: { missing: "capacity" },
      note: "Projects without capacity/output",
    },
    {
      label: "Plants",
      basePath: "/postgres-preview/operating-assets",
      query: { missing: "capacity" },
      note: "Plants without capacity/output",
    },
  ],
  needs_approval: [
    {
      label: "Projects",
      basePath: "/postgres-preview/projects",
      query: { review: "draft_or_validation" },
      note: "Draft or validation projects",
    },
    {
      label: "Plants",
      basePath: "/postgres-preview/operating-assets",
      query: { review: "draft_or_validation" },
      note: "Draft or validation plants",
    },
    {
      label: "Companies",
      basePath: "/postgres-preview/companies",
      query: { review: "draft_or_validation" },
      note: "Draft or validation companies",
    },
  ],
  needs_update: [
    {
      label: "Projects",
      basePath: "/postgres-preview/projects",
      query: { review: "needs_update" },
      note: "Projects requiring re-check",
    },
    {
      label: "Plants",
      basePath: "/postgres-preview/operating-assets",
      query: { review: "needs_update" },
      note: "Plants requiring re-check",
    },
    {
      label: "Companies",
      basePath: "/postgres-preview/companies",
      query: { review: "needs_update" },
      note: "Companies requiring re-check",
    },
  ],
  direct_use_classification: [
    {
      label: "Projects",
      basePath: "/postgres-preview/projects",
      query: { use: "direct_use" },
      note: "Direct-use project list",
    },
    {
      label: "Plants",
      basePath: "/postgres-preview/operating-assets",
      query: { use: "direct_use" },
      note: "Direct-use asset list",
    },
  ],
};

function queryHref(basePath: string, query: Record<string, string>) {
  const params = new URLSearchParams(query);
  const queryString = params.toString();

  return queryString ? `${basePath}?${queryString}` : basePath;
}

function queueListTargets(queueKey: ResearchOpsQueueKey): QueueListTarget[] {
  return (queueListTargetConfig[queueKey] || []).map((target) => ({
    label: target.label,
    href: queryHref(target.basePath, target.query),
    note: target.note,
  }));
}

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function downloadCsv(filename: string, rows: unknown[][]) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function readJson(res: Response) {
  try {
    const text = await res.text();
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

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toISOString().slice(0, 10);
}

function formatEntityType(value: EntityType) {
  if (value === "operating_asset") {
    return "Plant";
  }

  if (value === "project") {
    return "Project";
  }

  if (value === "company") {
    return "Company";
  }

  return "Source";
}

function formatConfidence(value: number) {
  return `${Math.round(value * 100)}%`;
}

function latestTimestamp(current: string | null, next: string | null) {
  if (!next) {
    return current;
  }

  if (!current) {
    return next;
  }

  return new Date(next).getTime() > new Date(current).getTime()
    ? next
    : current;
}

function normalizedResearcherName(value: string | null | undefined) {
  const trimmed = String(value || "").trim();
  return trimmed || null;
}

function isOpenResearchIssue(issue: PostgresResearchOpsIssue) {
  return !["resolved", "dismissed"].includes(issue.issue_status_code);
}

function ensureResearcherRow(
  rows: Map<string, ResearcherActivityRow>,
  name: string
) {
  const existing = rows.get(name);

  if (existing) {
    return existing;
  }

  const row: ResearcherActivityRow = {
    name,
    recentEdits: 0,
    sourceUpdates: 0,
    approvedOrReady: 0,
    needsReview: 0,
    auditedChanges: 0,
    assignedOpenIssues: 0,
    createdIssues: 0,
    resolvedIssues: 0,
    lastUpdatedAt: null,
  };

  rows.set(name, row);
  return row;
}

function buildResearcherActivityRows(
  recentEdits: PostgresResearchOpsRecentEdit[],
  issues: PostgresResearchOpsIssue[]
) {
  const rows = new Map<string, ResearcherActivityRow>();

  recentEdits.forEach((item) => {
    const name = normalizedResearcherName(item.last_updated_by_name);

    if (!name) {
      return;
    }

    const row = ensureResearcherRow(rows, name);
    row.recentEdits += 1;
    row.sourceUpdates += item.entity_type === "source" ? 1 : 0;
    row.approvedOrReady += ["approved", "export_ready", "credible"].includes(
      item.review_status_code || ""
    )
      ? 1
      : 0;
    row.needsReview += [
      "draft",
      "validation",
      "needs_review",
      "needs_update",
    ].includes(item.review_status_code || "")
      ? 1
      : 0;
    row.auditedChanges += item.latest_activity_type ? 1 : 0;
    row.lastUpdatedAt = latestTimestamp(row.lastUpdatedAt, item.updated_at);
  });

  issues.forEach((issue) => {
    const assignedName = normalizedResearcherName(issue.assigned_to_name);
    const createdName = normalizedResearcherName(issue.created_by_name);
    const resolvedName = normalizedResearcherName(issue.resolved_by_name);

    if (assignedName && isOpenResearchIssue(issue)) {
      const row = ensureResearcherRow(rows, assignedName);
      row.assignedOpenIssues += 1;
      row.lastUpdatedAt = latestTimestamp(row.lastUpdatedAt, issue.updated_at);
    }

    if (createdName) {
      const row = ensureResearcherRow(rows, createdName);
      row.createdIssues += 1;
      row.lastUpdatedAt = latestTimestamp(row.lastUpdatedAt, issue.created_at);
    }

    if (resolvedName) {
      const row = ensureResearcherRow(rows, resolvedName);
      row.resolvedIssues += 1;
      row.lastUpdatedAt = latestTimestamp(
        row.lastUpdatedAt,
        issue.resolved_at || issue.updated_at
      );
    }
  });

  return Array.from(rows.values()).sort((a, b) => {
    const activityDelta = b.recentEdits - a.recentEdits;

    if (activityDelta !== 0) {
      return activityDelta;
    }

    const assignedDelta = b.assignedOpenIssues - a.assignedOpenIssues;

    if (assignedDelta !== 0) {
      return assignedDelta;
    }

    return a.name.localeCompare(b.name);
  });
}

function recordKey(record: ResearchOpsRecord) {
  return `${record.entity_type}-${record.entity_id}`;
}

function entityAnchorPrefix(entityType: EntityType) {
  if (entityType === "operating_asset") {
    return "asset";
  }

  return entityType;
}

function entityAnchorForQueue(record: ResearchOpsRecord) {
  if (!("queue_key" in record)) {
    return null;
  }

  if (record.entity_type === "source") {
    if (
      record.queue_key === "source_needs_review" ||
      record.queue_key === "weak_or_outdated_source"
    ) {
      return "source-credibility-actions";
    }

    return null;
  }

  const prefix = entityAnchorPrefix(record.entity_type);

  if (record.queue_key === "needs_source") {
    return `${prefix}-source-evidence`;
  }

  if (record.queue_key === "missing_company_link") {
    return record.entity_type === "company"
      ? "company-relationships"
      : `${prefix}-company-links`;
  }

  if (record.queue_key === "missing_capacity") {
    if (record.entity_type === "project") {
      return "project-resource-timeline";
    }

    if (record.entity_type === "operating_asset") {
      return "asset-operating-data";
    }

    return null;
  }

  if (
    record.queue_key === "missing_country" ||
    record.queue_key === "missing_lifecycle" ||
    record.queue_key === "missing_use_type" ||
    record.queue_key === "missing_coordinates" ||
    record.queue_key === "direct_use_classification"
  ) {
    return record.entity_type === "company"
      ? "company-classification"
      : `${prefix}-identity-location`;
  }

  if (
    record.queue_key === "needs_approval" ||
    record.queue_key === "needs_update" ||
    record.queue_key === "suspected_duplicates"
  ) {
    return `${prefix}-export-readiness`;
  }

  return null;
}

function statusOptionsForTarget({
  target,
  reviewStatuses,
  sourceStatuses,
  canReviewStatus,
}: {
  target: BulkTarget;
  reviewStatuses: PostgresStatusOption[];
  sourceStatuses: PostgresStatusOption[];
  canReviewStatus: boolean;
}) {
  const options = target === "sources" ? sourceStatuses : reviewStatuses;
  const editorOnlyStatuses =
    target === "sources" ? editorOnlySourceStatuses : editorOnlyReviewStatuses;

  return options
    .filter((option) => option.is_active !== false)
    .filter((option) => canReviewStatus || !editorOnlyStatuses.has(option.code))
    .slice()
    .sort((a, b) => {
      const aOrder = a.sort_order ?? 0;
      const bOrder = b.sort_order ?? 0;

      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      return a.label.localeCompare(b.label);
    });
}

function sumQueueCounts(
  queueCounts: Map<ResearchOpsQueueKey, number>,
  queueKeys: ResearchOpsQueueKey[]
) {
  return queueKeys.reduce((sum, key) => sum + (queueCounts.get(key) || 0), 0);
}

function scrollToPageSection(sectionId: string) {
  window.setTimeout(() => {
    document
      .getElementById(sectionId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 0);
}

function recordHref(record: ResearchOpsRecord) {
  const anchor = entityAnchorForQueue(record);
  const anchorSuffix = anchor ? `#${anchor}` : "";

  if (record.entity_type === "source") {
    return `/sources/${record.entity_id}${anchorSuffix}`;
  }

  if (record.entity_type === "project") {
    return `/postgres-preview/projects/${record.entity_id}${anchorSuffix}`;
  }

  if (record.entity_type === "operating_asset") {
    return `/postgres-preview/operating-assets/${record.entity_id}${anchorSuffix}`;
  }

  if (record.entity_type === "company") {
    return `/postgres-preview/companies/${record.entity_id}${anchorSuffix}`;
  }

  return null;
}

function issueHref(issue: PostgresResearchOpsIssue) {
  const record = {
    entity_type: issue.entity_type,
    entity_id: issue.entity_id,
  } as ResearchOpsRecord;

  return recordHref(record);
}

function formatLinkedField(value: string | null) {
  if (!value) {
    return "Record-level";
  }

  return value
    .split(",")
    .map((part) =>
      part
        .trim()
        .replace(/_/g, " ")
        .replace(/\bmwe\b/gi, "MWe")
        .replace(/\bmwth\b/gi, "MWth")
        .replace(/\bcod\b/gi, "COD")
        .replace(/\bhq\b/gi, "HQ")
    )
    .filter(Boolean)
    .join(", ");
}

function addSourceHref(record: ResearchOpsRecord) {
  if (!("queue_key" in record) || record.queue_key !== "needs_source") {
    return null;
  }

  if (record.entity_type === "source") {
    return null;
  }

  const params = new URLSearchParams({
    entityType: record.entity_type,
    entityId: record.entity_id,
  });

  return `/sources/new?${params.toString()}`;
}

function normalizeText(value: string | null | undefined) {
  return String(value || "").toLowerCase();
}

function formatActivityType(value: string | null | undefined) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function recentActivityLabel(record: ResearchOpsRecord) {
  if (!("latest_activity_type" in record) || !record.latest_activity_type) {
    return null;
  }

  const fieldCount =
    record.latest_changed_field_count > 0
      ? ` · ${formatCount(record.latest_changed_field_count)} field${
          record.latest_changed_field_count === 1 ? "" : "s"
        }`
      : "";

  return `${formatActivityType(record.latest_activity_type)}${fieldCount}`;
}

function tableCellTitle(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  return String(value);
}

function CompactCellText({
  value,
  fallback = "-",
  lines = 1,
  className = "",
  title,
}: {
  value: string | number | null | undefined;
  fallback?: string;
  lines?: 1 | 2;
  className?: string;
  title?: string | null;
}) {
  const displayValue =
    value === null || value === undefined || value === "" ? fallback : value;
  const titleValue =
    title || tableCellTitle(value) || tableCellTitle(displayValue);

  return (
    <div
      className={`min-w-0 break-words ${
        lines === 2 ? "line-clamp-2" : "line-clamp-1"
      } ${className}`}
      title={titleValue}
    >
      {displayValue}
    </div>
  );
}

function recordMatchesSearch(record: ResearchOpsRecord, search: string) {
  if (!search) {
    return true;
  }

  const haystack = [
    record.name,
    record.legacy_id,
    record.country,
    record.primary_use_type_code,
    record.lifecycle_phase_code,
    record.review_status_code,
    record.last_updated_by_name,
    "issue_label" in record ? record.issue_label : null,
    "latest_activity_type" in record ? record.latest_activity_type : null,
    "latest_activity_note" in record ? record.latest_activity_note : null,
  ]
    .map(normalizeText)
    .join(" ");

  return haystack.includes(search);
}

function recordMatchesFilters(
  record: ResearchOpsRecord,
  entityFilter: EntityFilter,
  countryFilter: string,
  search: string
) {
  if (entityFilter !== "all" && record.entity_type !== entityFilter) {
    return false;
  }

  if (countryFilter !== "all") {
    const recordCountry = record.country || "__missing__";
    if (recordCountry !== countryFilter) {
      return false;
    }
  }

  return recordMatchesSearch(record, search);
}

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className={`${opsClass.panel} px-5 py-5`}>
      <div className={opsClass.eyebrow}>
        {eyebrow}
      </div>
      <h2 className={`mt-2 text-xl font-bold ${opsClass.title}`}>{title}</h2>
      <p className={`mt-2 max-w-4xl text-sm leading-6 ${opsClass.body}`}>
        {description}
      </p>
    </section>
  );
}

function DisclosurePanel({
  id,
  eyebrow,
  title,
  description,
  defaultOpen = false,
  open,
  onOpenChange,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = open ?? internalOpen;

  function toggleOpen() {
    const nextOpen = !isOpen;
    if (onOpenChange) {
      onOpenChange(nextOpen);
      return;
    }
    setInternalOpen(nextOpen);
  }

  return (
    <section
      id={id}
      className={id ? `scroll-mt-6 ${opsClass.panel}` : opsClass.panel}
    >
      <button
        className="flex w-full flex-col gap-2 border-b border-[var(--tge-governance-neutral-border)] px-5 py-5 text-left md:flex-row md:items-start md:justify-between"
        type="button"
        onClick={toggleOpen}
      >
        <div>
          <div className={opsClass.eyebrow}>
            {eyebrow}
          </div>
          <h2 className={`mt-2 text-xl font-bold ${opsClass.title}`}>{title}</h2>
          <p className={`mt-2 max-w-4xl text-sm leading-6 ${opsClass.body}`}>
            {description}
          </p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--tge-brand-green-dark)]">
          {isOpen ? "Collapse" : "Expand"}
        </span>
      </button>
      {isOpen ? <div className="px-5 py-5">{children}</div> : null}
    </section>
  );
}

function WorkflowTierMarker({
  eyebrow,
  title,
  description,
  tone,
}: {
  eyebrow: string;
  title: string;
  description: string;
  tone: PostgresHierarchyTone;
}) {
  return (
    <PostgresHierarchyMarker
      description={description}
      label={eyebrow}
      title={title}
      tone={tone}
    />
  );
}

function OperationalStatusBar({
  metrics,
}: {
  metrics: Array<{
    label: string;
    value: number;
    note: string;
    tone: "critical" | "important" | "workflow" | "neutral";
    onClick?: () => void;
  }>;
}) {
  const toneClasses = {
    critical:
      "border-[var(--tge-governance-danger-border)] bg-[var(--tge-governance-danger-bg)] text-[var(--tge-governance-danger-text)]",
    important:
      "border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] text-[var(--tge-governance-attention-text)]",
    workflow:
      "border-[var(--tge-governance-info-border)] bg-[var(--tge-governance-info-bg)] text-[var(--tge-governance-info-text)]",
    neutral:
      "border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] text-[var(--tge-text-primary)]",
  };

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
      {metrics.map((metric) => {
        const content = (
          <>
            <div className={`text-[11px] font-semibold uppercase tracking-wide ${opsClass.muted}`}>
              {metric.label}
            </div>
            <div className={`mt-2 text-3xl font-bold leading-none ${opsClass.title}`}>
              {formatCount(metric.value)}
            </div>
            <div className={`mt-2 text-xs leading-5 ${opsClass.muted}`}>
              {metric.note}
            </div>
          </>
        );

        if (metric.onClick) {
          return (
            <button
              key={metric.label}
              className={`min-h-[112px] border px-4 py-4 text-left hover:border-[var(--tge-brand-green)] hover:bg-[var(--tge-governance-success-bg)] ${toneClasses[metric.tone]}`}
              type="button"
              onClick={metric.onClick}
            >
              {content}
            </button>
          );
        }

        return (
          <div
            key={metric.label}
            className={`min-h-[112px] border px-4 py-4 ${toneClasses[metric.tone]}`}
          >
            {content}
          </div>
        );
      })}
    </section>
  );
}

function MyWorkPanel({
  issues,
  currentUser,
}: {
  issues: PostgresResearchOpsIssue[];
  currentUser: { id: string; name: string | null } | null;
}) {
  const assignedToMe = currentUser
    ? issues.filter((issue) => issue.assigned_to_user_id === currentUser.id)
    : [];
  const unassigned = issues.filter((issue) => !issue.assigned_to_user_id);
  const previewIssues = assignedToMe.slice(0, 5);

  return (
    <section id="my-work" className={`scroll-mt-6 ${opsClass.panel}`}>
      <div className="flex flex-col gap-4 border-b border-[var(--tge-governance-neutral-border)] px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className={opsClass.eyebrow}>
            Human / Team Work
          </div>
          <h2 className={`mt-2 text-xl font-bold ${opsClass.title}`}>
            My Work / Team Work
          </h2>
          <p className={`mt-2 max-w-4xl text-sm leading-6 ${opsClass.body}`}>
            Persistent human-created issues stay separate from generated system
            queues. This is the lightweight assignment layer until formal task
            objects are introduced.
          </p>
        </div>
        <div className="grid w-full grid-cols-1 gap-2 text-center sm:grid-cols-3 lg:w-auto">
          <div className={`${opsClass.panelSubtle} px-3 py-3`}>
            <div className={`text-2xl font-bold ${opsClass.title}`}>
              {formatCount(assignedToMe.length)}
            </div>
            <div className={`text-[11px] font-semibold uppercase tracking-wide ${opsClass.muted}`}>
              Mine
            </div>
          </div>
          <div className={`${opsClass.panelSubtle} px-3 py-3`}>
            <div className={`text-2xl font-bold ${opsClass.title}`}>
              {formatCount(unassigned.length)}
            </div>
            <div className={`text-[11px] font-semibold uppercase tracking-wide ${opsClass.muted}`}>
              Unassigned
            </div>
          </div>
          <div className={`${opsClass.panelSubtle} px-3 py-3`}>
            <div className={`text-2xl font-bold ${opsClass.title}`}>
              {formatCount(issues.length)}
            </div>
            <div className={`text-[11px] font-semibold uppercase tracking-wide ${opsClass.muted}`}>
              Team Open
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b border-[var(--tge-governance-neutral-border)] px-5 py-3 sm:flex-row sm:flex-wrap sm:items-center">
        <button
          className={opsClass.primaryButton}
          type="button"
          onClick={() => scrollToPageSection("persistent-issues")}
        >
          Review Persistent Issues
        </button>
        <button
          className={opsClass.secondaryButton}
          type="button"
          onClick={() => scrollToPageSection("system-queue-groups")}
        >
          Review System Queues
        </button>
      </div>

      {!currentUser ? (
        <div className={`px-5 py-4 text-sm leading-6 ${opsClass.body}`}>
          No mapped PostgreSQL user was found for the current session. Assignment
          totals will become personal once the signed-in user maps to
          `app_users`.
        </div>
      ) : previewIssues.length === 0 ? (
        <div className={`px-5 py-4 text-sm leading-6 ${opsClass.body}`}>
          No open persistent issues are assigned to{" "}
          {currentUser.name || "the current user"}.
        </div>
      ) : (
        <div className="divide-y divide-[var(--tge-governance-neutral-border)]">
          {previewIssues.map((issue) => {
            const href = issueHref(issue);

            return (
              <div
                key={issue.research_ops_issue_id}
                className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-start lg:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={issue.severity} />
                    <StatusBadge value={issue.issue_status_label} />
                  </div>
                  <div className={`mt-2 font-semibold ${opsClass.title}`}>
                    {issue.title}
                  </div>
                  <div className={`mt-1 text-sm ${opsClass.body}`}>
                    {issue.name} · {issue.country || "No country"} ·{" "}
                    {issue.issue_type_label}
                  </div>
                </div>
                {href ? (
                  <Link
                    className={opsClass.secondaryButton}
                    href={href}
                  >
                    Open Record
                  </Link>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function QuickOperationalViews({
  onApplyView,
}: {
  onApplyView: (view: {
    queue?: QueueFilter;
    severity?: SeverityFilter;
    entity?: EntityFilter;
  }) => void;
}) {
  const views: Array<{
    label: string;
    note: string;
    view: {
      queue?: QueueFilter;
      severity?: SeverityFilter;
      entity?: EntityFilter;
    };
  }> = [
    {
      label: "Critical / Export Blockers",
      note: "High-priority items first",
      view: { severity: "critical" },
    },
    {
      label: "Needs Source",
      note: "Evidence gaps",
      view: { queue: "needs_source" },
    },
    {
      label: "Source Validation",
      note: "Evidence review",
      view: { queue: "source_needs_review", entity: "source" },
    },
    {
      label: "Missing Coordinates",
      note: "Map blockers",
      view: { queue: "missing_coordinates" },
    },
    {
      label: "Duplicate Review",
      note: "Possible duplicate items",
      view: { queue: "suspected_duplicates" },
    },
    {
      label: "Stale / Needs Update",
      note: "Items needing re-review",
      view: { queue: "needs_update" },
    },
    {
      label: "Direct-Use Classification",
      note: "Use/category work",
      view: { queue: "direct_use_classification" },
    },
  ];

  return (
    <DisclosurePanel
      defaultOpen={false}
      description="MVP shortcut views are local filter presets for now. Persisted user/team saved views should come after the workflow stabilizes."
      eyebrow="Saved Views"
      title="Saved Operational Views"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {views.map((item) => (
          <button
            key={item.label}
            className={`${opsClass.routeCard} text-left`}
            type="button"
            onClick={() => onApplyView(item.view)}
          >
            <div className={`text-sm font-bold ${opsClass.title}`}>{item.label}</div>
            <div className={`mt-2 text-xs leading-5 ${opsClass.muted}`}>
              {item.note}
            </div>
          </button>
        ))}
      </div>
    </DisclosurePanel>
  );
}

function QueueTargetLinks({ targets }: { targets: QueueListTarget[] }) {
  if (targets.length === 0) {
    return (
      <div className={`text-xs leading-5 ${opsClass.muted}`}>
        Detailed review stays in Research Ops for this queue until a dedicated
        entity-list filter exists.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {targets.map((target) => (
        <Link
          key={`${target.href}-${target.label}`}
          className={opsClass.compactButton}
          href={target.href}
          title={target.note}
        >
          Open {target.label}
        </Link>
      ))}
    </div>
  );
}

function ExportBlockerPanel({
  queues,
  onSelectQueue,
}: {
  queues: PostgresResearchOpsQueue[];
  onSelectQueue: (queue: ResearchOpsQueueKey) => void;
}) {
  const blockerQueues = queues.filter((queue) =>
    exportBlockingQueueKeys.has(queue.key)
  );
  const total = blockerQueues.reduce((sum, queue) => sum + queue.count, 0);

  return (
    <section className={opsClass.dangerPanel}>
      <div className="flex flex-col gap-3 border-b border-[var(--tge-governance-danger-border)] px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--tge-governance-danger-text)]">
            Export Readiness
          </div>
          <h2 className={`mt-2 text-xl font-bold ${opsClass.title}`}>
            Export-Blocking Queues
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--tge-governance-danger-text)]">
            These generated queues should be cleared or explicitly accepted
            before data is treated as approved/export-ready for formal outputs.
            Operational CSV exports remain internal working exports.
          </p>
        </div>
        <div className="w-full border border-[var(--tge-governance-danger-border)] bg-[var(--tge-surface-card)] px-4 py-3 text-left sm:w-auto sm:text-right">
          <div className={`text-3xl font-bold leading-none ${opsClass.title}`}>
            {formatCount(total)}
          </div>
          <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-danger-text)]">
            blockers
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 px-5 py-5 sm:grid-cols-2 xl:grid-cols-5">
        {blockerQueues.map((queue) => (
          <div key={queue.key} className={opsClass.dangerCard}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className={`text-sm font-bold ${opsClass.title}`}>
                  {queue.title}
                </div>
                <div className={`mt-2 text-xs leading-5 ${opsClass.muted}`}>
                  {queue.description}
                </div>
              </div>
              <div className="text-xl font-bold leading-none text-[var(--tge-governance-danger-text)]">
                {formatCount(queue.count)}
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <button
                className="inline-flex h-8 w-full items-center justify-center border border-[var(--tge-governance-danger-border)] bg-[var(--tge-governance-danger-bg)] px-3 text-xs font-semibold text-[var(--tge-governance-danger-text)] hover:border-[var(--tge-brand-green)] hover:bg-[var(--tge-governance-success-bg)] hover:text-[var(--tge-brand-green-dark)]"
                type="button"
                onClick={() => onSelectQueue(queue.key)}
              >
                Focus In Research Ops
              </button>
              <QueueTargetLinks targets={queueListTargets(queue.key)} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SystemQueueGroups({
  groups,
  onSelectQueue,
}: {
  groups: Array<{
    key: QueueGroupKey;
    title: string;
    description: string;
    count: number;
    criticalCount: number;
    queues: Array<{
      key: ResearchOpsQueueKey;
      title: string;
      count: number;
      severity: ResearchOpsQueueSeverity;
    }>;
  }>;
  onSelectQueue: (queue: ResearchOpsQueueKey) => void;
}) {
  return (
    <section
      id="system-queue-groups"
      className={`scroll-mt-6 ${opsClass.panel}`}
    >
      <div className="border-b border-[var(--tge-governance-neutral-border)] px-5 py-4">
        <div className={opsClass.eyebrow}>
          System-Generated Queues
        </div>
        <h2 className={`mt-2 text-xl font-bold ${opsClass.title}`}>
          Queue Groups
        </h2>
        <p className={`mt-2 max-w-4xl text-sm leading-6 ${opsClass.body}`}>
          These queues are calculated from current platform data. They
          are not human assignments unless a persistent issue is created from a
          row.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 px-5 py-5 md:grid-cols-2 xl:grid-cols-5">
        {groups.map((group) => (
          <div key={group.key} className={opsClass.panelSubtle}>
            <div className="border-b border-[var(--tge-governance-neutral-border)] px-4 py-4">
              <div className={`text-3xl font-bold leading-none ${opsClass.title}`}>
                {formatCount(group.count)}
              </div>
              <h3 className={`mt-3 text-base font-bold ${opsClass.title}`}>
                {group.title}
              </h3>
              <p className={`mt-2 text-xs leading-5 ${opsClass.muted}`}>
                {group.description}
              </p>
              {group.criticalCount > 0 ? (
                <div className="mt-3 inline-flex min-h-[26px] items-center border border-[var(--tge-governance-danger-border)] bg-[var(--tge-governance-danger-bg)] px-2 text-xs font-semibold text-[var(--tge-governance-danger-text)]">
                  {formatCount(group.criticalCount)} critical
                </div>
              ) : null}
            </div>
            <div className="divide-y divide-[var(--tge-governance-neutral-border)]">
              {group.queues.map((queue) => (
                <div
                  key={queue.key}
                  className="flex items-start justify-between gap-3 px-4 py-3"
                >
                  <span>
                    <span className="text-xs font-semibold text-[var(--tge-governance-neutral-text)]">
                      {queue.title}
                    </span>
                    {exportBlockingQueueKeys.has(queue.key) ? (
                      <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--tge-governance-danger-text)]">
                        Export blocker
                      </span>
                    ) : null}
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-2">
                    <span className={`text-xs font-bold ${opsClass.title}`}>
                      {formatCount(queue.count)}
                    </span>
                    <button
                      className="h-7 border border-[var(--tge-governance-muted-border)] bg-[var(--tge-surface-card)] px-2 text-[11px] font-semibold text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)]"
                      type="button"
                      onClick={() => onSelectQueue(queue.key)}
                    >
                      Focus
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ArticleMatchReviewPanel({
  summary,
}: {
  summary: SourceMatchCandidateSummary;
}) {
  const matchLinks = [
    {
      label: "All Candidates",
      value: summary.total,
      href: "/sources/matches",
      note: "Full review table",
    },
    {
      label: "High",
      value: summary.highConfidence,
      href: "/sources/matches?status=suggested_high_confidence",
      note: "Best bulk-review set",
    },
    {
      label: "Medium",
      value: summary.mediumConfidence,
      href: "/sources/matches?status=suggested_medium_confidence",
      note: "Review before confirming",
    },
    {
      label: "Low",
      value: summary.lowConfidence,
      href: "/sources/matches?status=suggested_low_confidence",
      note: "Usually careful review",
    },
    {
      label: "Flags",
      value: summary.flaggedForReview,
      href: "/sources/matches?flagged=1",
      note: "Country or quality flags",
    },
    {
      label: "Confirmed",
      value: summary.confirmed,
      href: "/sources/matches?status=confirmed",
      note: "Evidence links created",
    },
    {
      label: "Rejected",
      value: summary.rejected,
      href: "/sources/matches?status=rejected",
      note: "Dismissed matches",
    },
  ];

  return (
    <DisclosurePanel
      id="article-match-review"
      defaultOpen={false}
      description="Generated TGE article/entity matches remain candidates until reviewed. This keeps archive-linking workload visible while confirmation stays in Sources."
      eyebrow="Source Review"
      title="Article Match Review"
    >
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Link
          className={opsClass.primaryButton}
          href="/sources/matches"
        >
          Review Matches
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {matchLinks.map((item) => (
          <Link
            key={item.label}
            className={opsClass.routeCard}
            href={item.href}
          >
            <div className={`text-[11px] font-semibold uppercase tracking-wide ${opsClass.muted}`}>
              {item.label}
            </div>
            <div className={`mt-2 text-2xl font-bold leading-none ${opsClass.title}`}>
              {formatCount(item.value)}
            </div>
            <div className={`mt-2 text-xs leading-5 ${opsClass.muted}`}>
              {item.note}
            </div>
          </Link>
        ))}
      </div>

      <div className={`mt-4 border-t pt-3 text-xs leading-5 ${opsClass.divider} ${opsClass.muted}`}>
        Open candidate workload: {formatCount(summary.open)}. Matching does not
        create evidence links; confirmation in Sources creates or reuses
        reviewed evidence links.
      </div>
    </DisclosurePanel>
  );
}

function ArticleFactReviewPanel({
  summary,
}: {
  summary: ArticleFactCandidateSummary;
}) {
  const factLinks = [
    {
      label: "Candidates",
      value: summary.total,
      href: "/sources/facts",
      note: "Extracted article facts",
    },
    {
      label: "Open",
      value: summary.open,
      href: "/sources/facts?status=suggested",
      note: "Suggested or needs review",
    },
    {
      label: "Confirmed",
      value: summary.confirmed,
      href: "/sources/facts?status=confirmed",
      note: "Accepted facts",
    },
    {
      label: "Rejected",
      value: summary.rejected,
      href: "/sources/facts?status=rejected",
      note: "Dismissed facts",
    },
    {
      label: "Entity Signals",
      value: summary.withEntitySignal,
      href: "/sources/facts",
      note: "Facts with entity labels",
    },
    {
      label: "Source Rows",
      value: summary.withSourceRecord,
      href: "/sources/facts",
      note: "Linked to governed sources",
    },
  ];

  return (
    <DisclosurePanel
      id="article-fact-review"
      defaultOpen={false}
      description="Compact article facts are reviewed separately from entity fields. Confirmed facts can later feed human-approved field suggestions."
      eyebrow="Source Review"
      title="Article Fact Review"
    >
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Link
          className={opsClass.primaryButton}
          href="/sources/facts"
        >
          Review Facts
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {factLinks.map((item) => (
          <Link
            key={item.label}
            className={opsClass.routeCard}
            href={item.href}
          >
            <div className={`text-[11px] font-semibold uppercase tracking-wide ${opsClass.muted}`}>
              {item.label}
            </div>
            <div className={`mt-2 text-2xl font-bold leading-none ${opsClass.title}`}>
              {formatCount(item.value)}
            </div>
            <div className={`mt-2 text-xs leading-5 ${opsClass.muted}`}>
              {item.note}
            </div>
          </Link>
        ))}
      </div>

      <div className={`mt-4 border-t pt-3 text-xs leading-5 ${opsClass.divider} ${opsClass.muted}`}>
        Article fact review is a staging layer for future AI-assisted data
        filling. It intentionally stays separate from evidence-link creation and
        entity field updates.
      </div>
    </DisclosurePanel>
  );
}

function fieldSuggestionHref(candidate: PostgresFieldSuggestionCandidate) {
  if (candidate.entity_type === "project") {
    return `/postgres-preview/projects/${candidate.entity_id}#project-ai-suggestions`;
  }

  if (candidate.entity_type === "operating_asset") {
    return `/postgres-preview/operating-assets/${candidate.entity_id}#asset-ai-suggestions`;
  }

  return `/postgres-preview/companies/${candidate.entity_id}#company-ai-suggestions`;
}

function isAppliedFieldSuggestion(candidate: PostgresFieldSuggestionCandidate) {
  return Boolean(candidate.applied_at);
}

function isSelectableFieldSuggestion(
  candidate: PostgresFieldSuggestionCandidate
) {
  return (
    !isAppliedFieldSuggestion(candidate) &&
    candidate.suggestion_status_code !== "rejected" &&
    candidate.suggestion_status_code !== "superseded"
  );
}

function isReviewOpenFieldSuggestion(
  candidate: PostgresFieldSuggestionCandidate
) {
  return (
    isSelectableFieldSuggestion(candidate) &&
    candidate.suggestion_status_code !== "confirmed"
  );
}

function isApplyReadyFieldSuggestion(
  candidate: PostgresFieldSuggestionCandidate
) {
  return (
    !isAppliedFieldSuggestion(candidate) &&
    candidate.suggestion_status_code === "confirmed"
  );
}

function fieldSuggestionWorkflowLabel(
  candidate: PostgresFieldSuggestionCandidate
) {
  if (candidate.applied_at) {
    return "Applied To Record";
  }

  if (candidate.suggestion_status_code === "confirmed") {
    return "Confirmed, Not Written";
  }

  if (candidate.suggestion_status_code === "rejected") {
    return "Rejected";
  }

  if (candidate.suggestion_status_code === "superseded") {
    return "Superseded";
  }

  return "Open Review";
}

function fieldSuggestionWorkflowTone(
  candidate: PostgresFieldSuggestionCandidate
) {
  if (candidate.applied_at) {
    return "border-[#b9d98b] bg-[#f1f8e8] text-[#3f6f19]";
  }

  if (candidate.suggestion_status_code === "confirmed") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (candidate.suggestion_status_code === "rejected") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-800";
}

function fieldSuggestionFieldContext(
  candidate: PostgresFieldSuggestionCandidate
) {
  return candidate.current_value && candidate.current_value.trim()
    ? "Existing value present"
    : "Fills empty field";
}

function FieldSuggestionReviewPanel({
  summary,
  candidates,
  canReviewStatus,
}: {
  summary: PostgresFieldSuggestionSummary;
  candidates: PostgresFieldSuggestionCandidate[];
  canReviewStatus: boolean;
}) {
  const router = useRouter();
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(
    () => new Set()
  );
  const [busyAction, setBusyAction] =
    useState<FieldSuggestionReviewAction | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const cards = [
    {
      label: "Open Review",
      value: summary.open,
      note: "Awaiting human review",
    },
    {
      label: "Confirmed, Not Written",
      value: summary.confirmedUnapplied,
      note: "Accepted, no DB write",
    },
    {
      label: "Ready To Apply",
      value: summary.applyReady,
      note: "Safe audited write queue",
    },
    {
      label: "Applied To Record",
      value: summary.applied,
      note: "Written with audit event",
    },
    {
      label: "High",
      value: summary.highConfidence,
      note: "Best first review set",
    },
    {
      label: "Medium",
      value: summary.mediumConfidence,
      note: "Useful but needs care",
    },
    {
      label: "Low",
      value: summary.lowConfidence,
      note: "Weak or ambiguous",
    },
    {
      label: "Confirmed Total",
      value: summary.confirmed,
      note: "Includes applied rows",
    },
    {
      label: "Rejected",
      value: summary.rejected + summary.superseded,
      note: "Rejected or superseded",
    },
  ];
  const highConfidenceCandidateIds = useMemo(
    () =>
      candidates
        .filter(
          (candidate) =>
            isReviewOpenFieldSuggestion(candidate) &&
            candidate.suggestion_status_code === "suggested_high_confidence"
        )
        .map((candidate) => candidate.field_suggestion_candidate_id),
    [candidates]
  );
  const applyReadyCandidateIds = useMemo(
    () =>
      candidates
        .filter(isApplyReadyFieldSuggestion)
        .map((candidate) => candidate.field_suggestion_candidate_id),
    [candidates]
  );
  const pageCount = Math.max(1, Math.ceil(candidates.length / pageSize));
  const clampedPage = Math.min(page, pageCount);
  const pageStartIndex = (clampedPage - 1) * pageSize;
  const pageItems = candidates.slice(pageStartIndex, pageStartIndex + pageSize);
  const pageStart = candidates.length === 0 ? 0 : pageStartIndex + 1;
  const pageEnd = Math.min(pageStartIndex + pageItems.length, candidates.length);
  const selectablePageCandidateIds = pageItems
    .filter(isSelectableFieldSuggestion)
    .map((candidate) => candidate.field_suggestion_candidate_id);
  const allVisibleSelected =
    selectablePageCandidateIds.length > 0 &&
    selectablePageCandidateIds.every((id) => selectedCandidateIds.has(id));
  const selectedCount = selectedCandidateIds.size;

  useEffect(() => {
    const visibleIds = new Set(
      candidates.map((candidate) => candidate.field_suggestion_candidate_id)
    );

    setSelectedCandidateIds((current) => {
      const next = new Set(
        Array.from(current).filter((candidateId) => visibleIds.has(candidateId))
      );

      return next.size === current.size ? current : next;
    });
  }, [candidates]);

  function toggleCandidate(candidateId: string, checked: boolean) {
    setSelectedCandidateIds((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(candidateId);
      } else {
        next.delete(candidateId);
      }

      return next;
    });
  }

  function toggleVisibleCandidates(checked: boolean) {
    setSelectedCandidateIds((current) => {
      const next = new Set(current);

      selectablePageCandidateIds.forEach((candidateId) => {
        if (checked) {
          next.add(candidateId);
        } else {
          next.delete(candidateId);
        }
      });

      return next;
    });
  }

  function selectHighConfidenceCandidates() {
    setActionMessage(null);
    setSelectedCandidateIds(new Set(highConfidenceCandidateIds));
  }

  function selectApplyReadyCandidates() {
    setActionMessage(null);
    setSelectedCandidateIds(new Set(applyReadyCandidateIds));
  }

  async function submitFieldSuggestionAction(
    action: FieldSuggestionReviewAction
  ) {
    if (!canReviewStatus || selectedCandidateIds.size === 0) {
      return;
    }

    if (
      action === "apply" &&
      !window.confirm(
        `Apply ${formatCount(
          selectedCandidateIds.size
        )} confirmed suggestion(s) to project, plant, or company fields? This is the audited write step and should only be used after human review.`
      )
    ) {
      return;
    }

    setBusyAction(action);
    setActionMessage(null);

    try {
      const response = await fetch("/api/postgres/field-suggestion-candidates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          candidateIds: Array.from(selectedCandidateIds),
        }),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
        result?: {
          requested?: number;
          updated?: number;
          applied?: number;
          skipped?: number;
        };
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Field suggestion update failed.");
      }

      if (action === "apply") {
        setActionMessage(
          `Applied ${formatCount(
            payload.result?.applied || 0
          )} confirmed suggestion(s); skipped ${formatCount(
            payload.result?.skipped || 0
          )}.`
        );
      } else {
        setActionMessage(
          `Updated ${formatCount(
            payload.result?.updated || 0
          )} of ${formatCount(
            payload.result?.requested || selectedCandidateIds.size
          )} selected suggestion(s).`
        );
      }
      setSelectedCandidateIds(new Set());
      router.refresh();
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Field suggestion update failed."
      );
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <DisclosurePanel
      id="field-suggestion-review"
      defaultOpen={false}
      description="AI-assisted extraction creates review candidates first. Confirmation accepts a suggestion; Apply To Database is the audited write step."
      eyebrow="AI Review"
      title="AI Field Suggestion Review"
    >
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-xs leading-5 text-gray-500">
          {formatCount(summary.open)} open review item
          {summary.open === 1 ? "" : "s"} ·{" "}
          {formatCount(summary.applyReady)} ready to apply ·{" "}
          {formatCount(summary.applied)} applied to entities
        </div>
        <span className="inline-flex min-h-[28px] self-start border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
          Human confirmation required
        </span>
      </div>

      <div className="border border-gray-200 bg-white px-4 py-4">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          {[
            ["1", "AI Suggestion", "Candidate only"],
            ["2", "Human Confirmation", "Accepted, not written"],
            ["3", "Audited Apply", "Controlled database write"],
            ["4", "Record Updated", "Audit trail visible"],
          ].map(([step, label, note]) => (
            <div
              key={step}
              className="border border-gray-200 bg-[#fbfbfb] px-3 py-3"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center border border-gray-300 bg-white text-xs font-bold text-[#1f2937]">
                  {step}
                </span>
                <span className="text-xs font-bold uppercase tracking-wide text-[#1f2937]">
                  {label}
                </span>
              </div>
              <div className="mt-2 text-xs leading-5 text-gray-500">{note}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {cards.map((card) => (
          <div key={card.label} className="border border-gray-200 bg-[#fbfbfb] px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              {card.label}
            </div>
            <div className="mt-2 text-2xl font-bold leading-none text-[#1f2937]">
              {formatCount(card.value)}
            </div>
            <div className="mt-2 text-xs leading-5 text-gray-500">
              {card.note}
            </div>
          </div>
        ))}
      </div>

      {candidates.length === 0 ? (
        <div className="border-t border-gray-100 px-5 py-5 text-sm leading-6 text-gray-600">
          No field suggestions are available yet. This is expected until
          extraction scripts begin writing review candidates.
        </div>
      ) : (
        <div className="border-t border-gray-100">
          <div className="flex flex-col gap-3 px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-xs leading-5 text-gray-500">
              {formatCount(selectedCount)} selected. Confirm accepts the AI
              suggestion for later application. It does NOT update the database
              record. Apply To Database is the audited write step.
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:flex-wrap">
              <button
                type="button"
                disabled={
                  !canReviewStatus ||
                  highConfidenceCandidateIds.length === 0 ||
                  Boolean(busyAction)
                }
                onClick={selectHighConfidenceCandidates}
                className="inline-flex h-8 items-center justify-center border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
              >
                Select high confidence
              </button>
              <button
                type="button"
                disabled={
                  !canReviewStatus ||
                  applyReadyCandidateIds.length === 0 ||
                  Boolean(busyAction)
                }
                onClick={selectApplyReadyCandidates}
                className="inline-flex h-8 items-center justify-center border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
              >
                Select apply-ready
              </button>
              <button
                type="button"
                disabled={!canReviewStatus || selectedCount === 0 || Boolean(busyAction)}
                onClick={() => submitFieldSuggestionAction("confirm")}
                className="inline-flex h-8 items-center justify-center border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
              >
                {busyAction === "confirm" ? "Confirming..." : "Confirm selected"}
              </button>
              <button
                type="button"
                disabled={!canReviewStatus || selectedCount === 0 || Boolean(busyAction)}
                onClick={() => submitFieldSuggestionAction("apply")}
                className="inline-flex h-8 items-center justify-center border border-[#8dc63f] bg-[#8dc63f] px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
              >
                {busyAction === "apply" ? "Applying..." : "Apply To Database"}
              </button>
              <button
                type="button"
                disabled={!canReviewStatus || selectedCount === 0 || Boolean(busyAction)}
                onClick={() => submitFieldSuggestionAction("needs_review")}
                className="inline-flex h-8 items-center justify-center border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
              >
                {busyAction === "needs_review" ? "Updating..." : "Needs review"}
              </button>
              <button
                type="button"
                disabled={!canReviewStatus || selectedCount === 0 || Boolean(busyAction)}
                onClick={() => submitFieldSuggestionAction("reject")}
                className="inline-flex h-8 items-center justify-center border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
              >
                {busyAction === "reject" ? "Rejecting..." : "Reject selected"}
              </button>
            </div>
          </div>
          {actionMessage ? (
            <div className="border-t border-gray-100 px-5 py-3 text-xs leading-5 text-gray-600">
              {actionMessage}
            </div>
          ) : null}
          {!canReviewStatus ? (
            <div className="border-t border-gray-100 px-5 py-3 text-xs leading-5 text-gray-500">
              Review actions require editor/admin permissions.
            </div>
          ) : null}
          <PaginationControls
            noun="suggestion"
            page={clampedPage}
            pageCount={pageCount}
            pageEnd={pageEnd}
            pageStart={pageStart}
            total={candidates.length}
            onPageChange={setPage}
          />
          <div className="overflow-x-auto">
            <table className="min-w-[1240px] table-fixed text-left text-sm">
              <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="w-[4%] px-4 py-3 font-semibold">
                    <input
                      type="checkbox"
                      aria-label="Select visible field suggestions on this page"
                      checked={allVisibleSelected}
                      disabled={
                        !canReviewStatus ||
                        selectablePageCandidateIds.length === 0
                      }
                      onChange={(event) =>
                        toggleVisibleCandidates(event.target.checked)
                      }
                      className="h-4 w-4 rounded-none border-gray-300 text-[#8dc63f] focus:ring-[#8dc63f]"
                    />
                  </th>
                  <th className="w-[12%] px-4 py-3 font-semibold">Type</th>
                  <th className="w-[19%] px-4 py-3 font-semibold">Record</th>
                  <th className="w-[13%] px-4 py-3 font-semibold">Field</th>
                  <th className="w-[14%] px-4 py-3 font-semibold">Current</th>
                  <th className="w-[15%] px-4 py-3 font-semibold">Suggested</th>
                  <th className="w-[9%] px-4 py-3 font-semibold">Confidence</th>
                  <th className="w-[14%] px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageItems.map((candidate) => (
                  <tr
                    key={candidate.field_suggestion_candidate_id}
                    className="align-top transition-colors hover:bg-[#fbfdf8]"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select suggestion for ${candidate.entity_name}`}
                        checked={selectedCandidateIds.has(
                          candidate.field_suggestion_candidate_id
                        )}
                        disabled={
                          !canReviewStatus ||
                          !isSelectableFieldSuggestion(candidate)
                        }
                        onChange={(event) =>
                          toggleCandidate(
                            candidate.field_suggestion_candidate_id,
                            event.target.checked
                          )
                        }
                        className="h-4 w-4 rounded-none border-gray-300 text-[#8dc63f] focus:ring-[#8dc63f]"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-gray-700">
                      {formatEntityType(candidate.entity_type)}
                      <div
                        className={`mt-2 inline-flex min-h-[24px] items-center border px-2 text-xs font-semibold ${fieldSuggestionWorkflowTone(
                          candidate
                        )}`}
                      >
                        {fieldSuggestionWorkflowLabel(candidate)}
                      </div>
                      {candidate.applied_at ? (
                        <div className="mt-1 text-xs font-semibold text-[#4f7f1f]">
                          Applied {formatDate(candidate.applied_at)}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-2.5">
                      <Link
                        href={fieldSuggestionHref(candidate)}
                        className="line-clamp-2 font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                        title={candidate.entity_name}
                      >
                        {candidate.entity_name}
                      </Link>
                      <CompactCellText
                        className="mt-1 text-xs text-gray-500"
                        value={candidate.country}
                        fallback="No country"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-gray-700">
                      <CompactCellText value={candidate.field_name} />
                      {candidate.source_title || candidate.source_reference ? (
                        <CompactCellText
                          className="mt-2 text-xs text-gray-500"
                          lines={2}
                          value={
                            candidate.source_title || candidate.source_reference
                          }
                        />
                      ) : null}
                      {candidate.source_id ? (
                        <Link
                          href={`/sources/${candidate.source_id}`}
                          className="mt-2 inline-flex text-xs font-semibold text-[#4f7f1f] hover:underline"
                        >
                          Open source
                        </Link>
                      ) : null}
                    </td>
                    <td className="px-4 py-2.5 text-gray-700">
                      <CompactCellText
                        lines={2}
                        value={candidate.current_value}
                      />
                      <CompactCellText
                        className="mt-2 text-xs font-semibold text-gray-500"
                        value={fieldSuggestionFieldContext(candidate)}
                      />
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-[#1f2937]">
                      <CompactCellText
                        lines={2}
                        value={candidate.suggested_value}
                      />
                      {candidate.suggestion_reason ? (
                        <CompactCellText
                          className="mt-2 text-xs font-normal text-gray-500"
                          lines={2}
                          value={candidate.suggestion_reason}
                        />
                      ) : null}
                    </td>
                    <td className="px-4 py-2.5 text-gray-700">
                      {formatConfidence(candidate.confidence_score)}
                      <div className="mt-1 text-xs text-gray-500">
                        {formatDate(candidate.generated_at)}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <Link
                        href={fieldSuggestionHref(candidate)}
                        className="inline-flex h-8 items-center border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                      >
                        Open Record
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pageCount > 1 ? (
            <PaginationControls
              noun="suggestion"
              page={clampedPage}
              pageCount={pageCount}
              pageEnd={pageEnd}
              pageStart={pageStart}
              total={candidates.length}
              onPageChange={setPage}
            />
          ) : null}
        </div>
      )}

      <div className="mt-4 border border-gray-100 bg-[#fbfbfb] px-4 py-3 text-xs leading-5 text-gray-500">
        Total candidates: {formatCount(summary.total)}. Confirm first, then
        apply confirmed suggestions as a separate audited write step. Applying
        only updates supported empty fields and leaves validation/export
        approval under editor control.
      </div>
    </DisclosurePanel>
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

function SeverityBadge({ severity }: { severity: ResearchOpsQueueSeverity }) {
  return <PostgresStatusBadge domain="severity" value={severity} />;
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
      {label}
      <select
        className="h-10 min-w-0 border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-[#8dc63f]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

function EmptyQueue() {
  return (
    <div className="border-t border-gray-100 px-5 py-5 text-sm text-gray-500">
      No matching items in this queue.
    </div>
  );
}

function PaginationControls({
  page,
  pageCount,
  pageStart,
  pageEnd,
  total,
  onPageChange,
  noun = "record",
}: {
  page: number;
  pageCount: number;
  pageStart: number;
  pageEnd: number;
  total: number;
  onPageChange: (page: number) => void;
  noun?: string;
}) {
  if (pageCount <= 1) {
    return (
      <div className="border-t border-gray-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Showing {formatCount(total)} {noun}
        {total === 1 ? "" : "s"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-3 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Showing {formatCount(pageStart)}-{formatCount(pageEnd)} of{" "}
        {formatCount(total)}
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <button
          className="h-8 flex-1 border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
          disabled={page <= 1}
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Previous
        </button>
        <span className="inline-flex h-8 items-center border border-gray-200 bg-[#f7f7f7] px-3 text-xs font-semibold text-gray-700">
          Page {formatCount(page)} / {formatCount(pageCount)}
        </span>
        <button
          className="h-8 flex-1 border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
          disabled={page >= pageCount}
          type="button"
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function EntityTable({
  items,
  compactRows = false,
  selectedKey,
  selectedBulkKeys,
  onToggleBulk,
  onToggleVisible,
  onSelect,
}: {
  items: ResearchOpsRecord[];
  compactRows?: boolean;
  selectedKey: string | null;
  selectedBulkKeys: Set<string>;
  onToggleBulk: (record: ResearchOpsRecord, checked: boolean) => void;
  onToggleVisible: (records: ResearchOpsRecord[], checked: boolean) => void;
  onSelect: (record: ResearchOpsRecord) => void;
}) {
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const clampedPage = Math.min(page, pageCount);
  const pageStartIndex = (clampedPage - 1) * pageSize;
  const pageItems = items.slice(pageStartIndex, pageStartIndex + pageSize);
  const pageStart = items.length === 0 ? 0 : pageStartIndex + 1;
  const pageEnd = Math.min(pageStartIndex + pageItems.length, items.length);
  const allSelected = pageItems.every((item) =>
    selectedBulkKeys.has(recordKey(item))
  );
  const headCellClass = compactRows ? "px-4 py-2" : "px-5 py-3";
  const cellClass = compactRows ? "px-4 py-2.5" : "px-5 py-4";
  const supportingTextClass = compactRows
    ? "mt-1 line-clamp-1 text-xs text-gray-500"
    : "mt-1 text-xs text-gray-500";
  const issueTextClass = compactRows
    ? "mt-1 line-clamp-1 text-xs font-medium text-gray-600"
    : "mt-2 text-xs font-medium text-gray-600";
  const activityTextClass = compactRows
    ? "mt-1 line-clamp-1 text-xs font-medium text-sky-700"
    : "mt-2 text-xs font-medium text-sky-700";
  const actionButtonClass = compactRows
    ? "inline-flex h-7 items-center border px-2 text-[11px] font-semibold"
    : "inline-flex h-8 items-center border px-3 text-xs font-semibold";

  if (items.length === 0) {
    return <EmptyQueue />;
  }

  return (
    <>
      <PaginationControls
        page={clampedPage}
        pageCount={pageCount}
        pageEnd={pageEnd}
        pageStart={pageStart}
        total={items.length}
        onPageChange={setPage}
      />
      <div className="border-t border-gray-100 bg-white px-5 py-3 text-xs leading-5 text-gray-500">
        The page checkbox selects only the visible rows on this page. Use{" "}
        <span className="font-semibold text-[#1f2937]">Select Filtered</span>{" "}
        above when the whole filtered work set should be selected for bulk
        review.
      </div>
      <div className="overflow-x-auto border-t border-gray-100">
        <table className="min-w-[1260px] table-fixed text-left text-sm">
          <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className={`w-[4%] ${headCellClass} font-semibold`}>
                <input
                  aria-label="Select visible records on this page"
                  checked={allSelected}
                  className="h-4 w-4 accent-[#8dc63f]"
                  type="checkbox"
                  onChange={(event) =>
                    onToggleVisible(pageItems, event.target.checked)
                  }
                />
              </th>
              <th className={`w-[9%] ${headCellClass} font-semibold`}>Type</th>
              <th className={`w-[24%] ${headCellClass} font-semibold`}>
                Record
              </th>
              <th className={`w-[12%] ${headCellClass} font-semibold`}>
                Country
              </th>
              <th className={`w-[12%] ${headCellClass} font-semibold`}>
                Use / Type
              </th>
              <th className={`w-[12%] ${headCellClass} font-semibold`}>
                Status
              </th>
              <th className={`w-[11%] ${headCellClass} font-semibold`}>
                Review
              </th>
              <th className={`w-[12%] ${headCellClass} font-semibold`}>
                Updated By
              </th>
              <th className={`w-[10%] ${headCellClass} font-semibold`}>
                Updated
              </th>
              <th className={`w-[12%] ${headCellClass} font-semibold`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pageItems.map((item) => {
              const key = recordKey(item);
              const selected = key === selectedKey;
              const href = recordHref(item);
              const sourceHref = addSourceHref(item);
              const activityLabel = recentActivityLabel(item);

              return (
                <tr
                  key={key}
                  className={
                    selected
                      ? "align-top bg-[#f3f8ec]"
                      : "align-top transition-colors hover:bg-[#fbfdf8]"
                  }
                >
                  <td className={cellClass}>
                    <input
                      aria-label={`Select ${item.name}`}
                      checked={selectedBulkKeys.has(key)}
                      className="h-4 w-4 accent-[#8dc63f]"
                      type="checkbox"
                      onChange={(event) => onToggleBulk(item, event.target.checked)}
                    />
                  </td>
                  <td className={`${cellClass} text-gray-700`}>
                    <CompactCellText value={formatEntityType(item.entity_type)} />
                  </td>
                  <td className={cellClass}>
                    <CompactCellText
                      className="font-semibold text-[#1f2937]"
                      lines={2}
                      value={item.name}
                    />
                    <CompactCellText
                      className={supportingTextClass}
                      value={item.legacy_id}
                      fallback="No legacy ID"
                    />
                    {"issue_label" in item ? (
                      <CompactCellText
                        className={issueTextClass}
                        value={item.issue_label}
                      />
                    ) : null}
                    {activityLabel ? (
                      <CompactCellText
                        className={activityTextClass}
                        value={activityLabel}
                      />
                    ) : null}
                  </td>
                  <td className={`${cellClass} text-gray-700`}>
                    <CompactCellText value={item.country} />
                  </td>
                  <td className={`${cellClass} text-gray-700`}>
                    <CompactCellText value={item.primary_use_type_code} />
                  </td>
                  <td className={`${cellClass} text-gray-700`}>
                    <StatusBadge
                      domain="lifecycle"
                      value={item.lifecycle_phase_code}
                    />
                  </td>
                  <td className={cellClass}>
                    <StatusBadge
                      domain="review"
                      value={item.review_status_code}
                    />
                  </td>
                  <td className={`${cellClass} text-gray-700`}>
                    <CompactCellText value={item.last_updated_by_name} />
                  </td>
                  <td className={`${cellClass} text-gray-700`}>
                    {formatDate(item.updated_at)}
                  </td>
                  <td className={cellClass}>
                    <div className={compactRows ? "flex flex-wrap gap-1" : "flex flex-wrap gap-2"}>
                      <button
                        className={`${actionButtonClass} border-[#8dc63f] bg-white text-[#4f7f1f] hover:bg-[#f3f8ec]`}
                        type="button"
                        onClick={() => onSelect(item)}
                      >
                        Review
                      </button>
                      {sourceHref ? (
                        <Link
                          className={`${actionButtonClass} border-[#8dc63f] bg-white text-[#4f7f1f] hover:bg-[#f3f8ec]`}
                          href={sourceHref}
                        >
                          Add Source
                        </Link>
                      ) : null}
                      {href ? (
                        <Link
                          className={`${actionButtonClass} border-gray-300 bg-white text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]`}
                          href={href}
                        >
                          Open
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pageCount > 1 ? (
        <PaginationControls
          page={clampedPage}
          pageCount={pageCount}
          pageEnd={pageEnd}
          pageStart={pageStart}
          total={items.length}
          onPageChange={setPage}
        />
      ) : null}
    </>
  );
}

function QueueCard({
  queue,
  collapsed,
  compactRows,
  selectedKey,
  selectedBulkKeys,
  onToggleCollapsed,
  onToggleBulk,
  onToggleVisible,
  onSelect,
}: {
  queue: PostgresResearchOpsQueue;
  collapsed: boolean;
  compactRows: boolean;
  selectedKey: string | null;
  selectedBulkKeys: Set<string>;
  onToggleCollapsed: () => void;
  onToggleBulk: (record: ResearchOpsRecord, checked: boolean) => void;
  onToggleVisible: (records: ResearchOpsRecord[], checked: boolean) => void;
  onSelect: (record: ResearchOpsRecord) => void;
}) {
  const isExportBlocking = exportBlockingQueueKeys.has(queue.key);
  const targets = queueListTargets(queue.key);

  return (
    <section
      id={`queue-${queue.key}`}
      className="scroll-mt-6 border border-gray-200 bg-white"
    >
      <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-[#1f2937]">{queue.title}</h2>
            <SeverityBadge severity={queue.severity} />
            <span className="inline-flex h-7 items-center border border-gray-200 bg-[#f7f7f7] px-2 text-xs font-semibold text-gray-600">
              System-generated
            </span>
            {isExportBlocking ? (
              <span className="inline-flex h-7 items-center border border-red-200 bg-red-50 px-2 text-xs font-semibold text-red-800">
                Export blocker
              </span>
            ) : null}
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            {queue.description}
          </p>
          <div className="mt-3">
            <QueueTargetLinks targets={targets} />
          </div>
        </div>
        <div className="flex w-full items-start justify-between gap-3 md:w-auto md:justify-end">
          <div className="text-left md:text-right">
            <div className="text-2xl font-bold leading-none text-[#1f2937]">
              {formatCount(queue.items.length)}
            </div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              shown of {formatCount(queue.count)}
            </div>
          </div>
          <button
            className="h-9 border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
            type="button"
            onClick={onToggleCollapsed}
          >
            {collapsed ? "Expand" : "Collapse"}
          </button>
        </div>
      </div>
      {collapsed ? (
        <div className="border-t border-gray-100 px-5 py-4 text-sm leading-6 text-gray-600">
          Queue collapsed. {formatCount(queue.items.length)} matching row
          {queue.items.length === 1 ? "" : "s"} remain in the current filter
          state.
        </div>
      ) : (
        <EntityTable
          compactRows={compactRows}
          items={queue.items}
          onSelect={onSelect}
          onToggleBulk={onToggleBulk}
          onToggleVisible={onToggleVisible}
          selectedBulkKeys={selectedBulkKeys}
          selectedKey={selectedKey}
        />
      )}
    </section>
  );
}

function ResearchOpsViewContext({
  activeFilters,
  filteredIssueRows,
  filteredRecordCount,
  selectedBulkCount,
  canReviewStatus,
  onRemoveFilter,
}: {
  activeFilters: ActiveOperationalFilter[];
  filteredIssueRows: number;
  filteredRecordCount: number;
  selectedBulkCount: number;
  canReviewStatus: boolean;
  onRemoveFilter: (filterKey: ActiveOperationalFilter["key"]) => void;
}) {
  return (
    <div className="border border-gray-200 bg-[#fbfbfb] px-4 py-4 text-sm text-gray-600">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="font-semibold text-[#1f2937]">
            Active Research Ops view
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {activeFilters.length > 0 ? (
              activeFilters.map((filter) => (
                <button
                  className="inline-flex min-h-8 items-center border border-[#d7e8bf] bg-[#f5faef] px-3 text-xs font-semibold text-[#4f7f1f] hover:border-[#8dc63f]"
                  key={filter.key}
                  type="button"
                  onClick={() => onRemoveFilter(filter.key)}
                >
                  <span className="text-gray-500">{filter.label}:</span>
                  <span className="ml-1">{filter.value}</span>
                  <span className="ml-2 text-gray-400">x</span>
                </button>
              ))
            ) : (
              <span className="inline-flex min-h-8 items-center border border-gray-200 bg-white px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                All generated queues
              </span>
            )}
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-2 text-xs sm:grid-cols-3 xl:min-w-[540px]">
          <div className="border border-gray-200 bg-white px-3 py-2">
            <div className="font-semibold uppercase tracking-wide text-gray-500">
              Queue Origin
            </div>
            <div className="mt-1 font-semibold text-[#1f2937]">
              Generated staging queues
            </div>
            <p className="mt-1 leading-5 text-gray-500">
              Calculated from current platform data, separate from
              persisted human-created issues.
            </p>
          </div>
          <div className="border border-gray-200 bg-white px-3 py-2">
            <div className="font-semibold uppercase tracking-wide text-gray-500">
              Export Scope
            </div>
            <div className="mt-1 font-semibold text-[#1f2937]">
              {canReviewStatus ? "Filtered queue rows" : "Editor/Admin only"}
            </div>
            <p className="mt-1 leading-5 text-gray-500">
              CSV export contains generated queue rows matching these filters,
              not Recent Activity rows.
            </p>
          </div>
          <div className="border border-gray-200 bg-white px-3 py-2">
            <div className="font-semibold uppercase tracking-wide text-gray-500">
              Bulk Scope
            </div>
            <div className="mt-1 font-semibold text-[#1f2937]">
              {formatCount(selectedBulkCount)} selected
            </div>
            <p className="mt-1 leading-5 text-gray-500">
              Bulk status changes affect selected rows only. Filtered rows are
              not changed until selected.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {formatCount(filteredIssueRows)} queue rows ·{" "}
        {formatCount(filteredRecordCount)} unique items
      </div>
    </div>
  );
}

function BulkActionsPanel({
  selectedRecords,
  reviewStatuses,
  sourceStatuses,
  canReviewStatus,
  onClearSelection,
  onRecordsChanged,
}: {
  selectedRecords: ResearchOpsRecord[];
  reviewStatuses: PostgresStatusOption[];
  sourceStatuses: PostgresStatusOption[];
  canReviewStatus: boolean;
  onClearSelection: () => void;
  onRecordsChanged: (recordKeys: string[], statusCode: string) => void;
}) {
  const router = useRouter();
  const [bulkTarget, setBulkTarget] = useState<BulkTarget>("records");
  const [statusCode, setStatusCode] = useState("");
  const [eventNote, setEventNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errorIssues, setErrorIssues] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const hasSources = selectedRecords.some((record) => record.entity_type === "source");
  const hasRecords = selectedRecords.some((record) => record.entity_type !== "source");
  const activeTarget =
    bulkTarget === "sources" && hasSources ? "sources" : "records";
  const targetRecords = selectedRecords.filter((record) =>
    activeTarget === "sources"
      ? record.entity_type === "source"
      : record.entity_type !== "source"
  );
  const statusOptions = useMemo(
    () =>
      statusOptionsForTarget({
        target: activeTarget,
        reviewStatuses,
        sourceStatuses,
        canReviewStatus,
      }),
    [activeTarget, canReviewStatus, reviewStatuses, sourceStatuses]
  );

  useEffect(() => {
    if (!hasRecords && hasSources) {
      setBulkTarget("sources");
    } else if (hasRecords && !hasSources) {
      setBulkTarget("records");
    }
  }, [hasRecords, hasSources]);

  useEffect(() => {
    if (!statusOptions.some((option) => option.code === statusCode)) {
      setStatusCode(statusOptions[0]?.code || "");
    }
  }, [statusCode, statusOptions]);

  async function applyBulkStatus() {
    if (!statusCode || targetRecords.length === 0) {
      return;
    }

    setSaving(true);
    setError("");
    setErrorIssues([]);
    setMessage("");

    const updatedKeys: string[] = [];
    const failures: string[] = [];
    const failureIssues: string[] = [];

    for (const record of targetRecords) {
      try {
        const res = await fetch("/api/postgres-preview/research-ops/status", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entity_type: record.entity_type,
            entity_id: record.entity_id,
            status_code: statusCode,
            event_note: eventNote,
          }),
        });
        const json = await readJson(res);

        if (!res.ok || !json?.success) {
          const issues = getApiIssues(json);
          failureIssues.push(
            ...issues.map((issue) => `${record.name}: ${issue}`)
          );
          throw new Error(getApiError(json, "Failed to update status."));
        }

        updatedKeys.push(recordKey(record));
      } catch (error) {
        failures.push(
          `${record.name}: ${
            error instanceof Error ? error.message : "Failed to update status."
          }`
        );
      }
    }

    if (updatedKeys.length > 0) {
      onRecordsChanged(updatedKeys, statusCode);
      setEventNote("");
      setMessage(
        `Updated ${formatCount(updatedKeys.length)} ${
          activeTarget === "sources" ? "source" : "record"
        }${updatedKeys.length === 1 ? "" : "s"} to ${statusCode}.`
      );
      router.refresh();
    }

    if (failures.length > 0) {
      setError(failures.slice(0, 3).join(" "));
      setErrorIssues(failureIssues.slice(0, 12));
    }

    setSaving(false);
  }

  if (selectedRecords.length === 0) {
    return null;
  }

  return (
    <section
      id="bulk-review-actions"
      className="scroll-mt-6 border border-gray-200 bg-white"
    >
      <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1f2937]">
            Bulk Review Actions
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Apply a workflow status to selected queue rows. Sources
            use source credibility states; projects, plants, and
            companies use review states.
          </p>
        </div>
        <button
          className="h-9 w-full border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f] sm:w-auto"
          type="button"
          onClick={onClearSelection}
        >
          Clear Selection
        </button>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="border border-gray-200 bg-[#fbfbfb] px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Selection Scope
            </div>
            <div className="mt-1 text-sm font-semibold text-[#1f2937]">
              {formatCount(selectedRecords.length)} selected row
              {selectedRecords.length === 1 ? "" : "s"}
            </div>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              Bulk actions affect selected rows only, not every row currently
              visible in the filtered queue view.
            </p>
          </div>
          <div className="border border-gray-200 bg-[#fbfbfb] px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Active Target
            </div>
            <div className="mt-1 text-sm font-semibold text-[#1f2937]">
              {activeTarget === "sources" ? "Sources" : "Projects / Plants / Companies"}
            </div>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              Record statuses and source credibility states are handled
              separately to avoid mixed workflow updates.
            </p>
          </div>
          <div className="border border-gray-200 bg-[#fbfbfb] px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Audit Boundary
            </div>
            <div className="mt-1 text-sm font-semibold text-[#1f2937]">
              Review status only
            </div>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              This does not edit field values or create evidence links; those
              remain record/source workflows.
            </p>
          </div>
        </div>

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

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[220px_220px_minmax(0,1fr)]">
          <FilterSelect
            label="Apply To"
            value={activeTarget}
            onChange={(value) => setBulkTarget(value as BulkTarget)}
          >
            <option disabled={!hasRecords} value="records">
              Entity Items ({formatCount(selectedRecords.filter((r) => r.entity_type !== "source").length)})
            </option>
            <option disabled={!hasSources} value="sources">
              Sources ({formatCount(selectedRecords.filter((r) => r.entity_type === "source").length)})
            </option>
          </FilterSelect>

          <FilterSelect label="New Status" value={statusCode} onChange={setStatusCode}>
            {statusOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label || option.code}
              </option>
            ))}
          </FilterSelect>

          <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Change Note
            <input
              className="h-10 min-w-0 border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-[#8dc63f]"
              placeholder="Optional reason applied to each selected row"
              value={eventNote}
              onChange={(event) => setEventNote(event.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            className="h-10 w-full border border-[#8dc63f] bg-[#8dc63f] px-5 text-sm font-semibold text-white hover:bg-[#78ad35] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            disabled={saving || !statusCode || targetRecords.length === 0}
            type="button"
            onClick={applyBulkStatus}
          >
            {saving
              ? "Applying..."
              : `Apply To ${formatCount(targetRecords.length)} ${
                  activeTarget === "sources" ? "Source" : "Item"
                }${targetRecords.length === 1 ? "" : "s"}`}
          </button>
          <div className="text-sm text-gray-600">
            {formatCount(selectedRecords.length)} unique row
            {selectedRecords.length === 1 ? "" : "s"} selected.
          </div>
        </div>
      </div>
    </section>
  );
}

function defaultIssueTitle(record: ResearchOpsRecord) {
  if ("issue_label" in record && record.issue_label) {
    return record.issue_label;
  }

  return `Research follow-up for ${record.name}`;
}

function CreateIssuePanel({
  record,
  issueReferenceData,
}: {
  record: ResearchOpsRecord;
  issueReferenceData: PostgresResearchOpsIssueReferenceData;
}) {
  const router = useRouter();
  const issueTypes = useMemo(
    () =>
      issueReferenceData.issueTypes
        .filter((issueType) => issueType.is_active !== false)
        .slice()
        .sort((a, b) => {
          const aOrder = a.sort_order ?? 0;
          const bOrder = b.sort_order ?? 0;

          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }

          return a.label.localeCompare(b.label);
        }),
    [issueReferenceData.issueTypes]
  );
  const [issueTypeCode, setIssueTypeCode] = useState(issueTypes[0]?.code || "");
  const [title, setTitle] = useState(defaultIssueTitle(record));
  const [description, setDescription] = useState("");
  const [linkedField, setLinkedField] = useState("");
  const [assignToSelf, setAssignToSelf] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setTitle(defaultIssueTitle(record));
    setDescription("");
    setLinkedField("");
    setError("");
    setMessage("");
  }, [record]);

  useEffect(() => {
    if (!issueTypes.some((issueType) => issueType.code === issueTypeCode)) {
      setIssueTypeCode(issueTypes[0]?.code || "");
    }
  }, [issueTypeCode, issueTypes]);

  async function createIssue() {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/postgres-preview/research-ops/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_type: record.entity_type,
          entity_id: record.entity_id,
          issue_type_code: issueTypeCode,
          title,
          description,
          linked_field: linkedField,
          assign_to_self: assignToSelf,
        }),
      });
      const json = await readJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to create research issue.");
      }

      setMessage("Research issue created.");
      setDescription("");
      setLinkedField("");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to create research issue."
      );
    } finally {
      setSaving(false);
    }
  }

  if (issueTypes.length === 0) {
    return null;
  }

  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-bold text-[#1f2937]">
          Create Persistent Issue
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
          Store an operational issue, assignment, or duplicate/research follow-up
          against this record. Generated queues remain separate from these
          human-created issues.
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

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
          <FilterSelect
            label="Issue Type"
            value={issueTypeCode}
            onChange={setIssueTypeCode}
          >
            {issueTypes.map((issueType) => (
              <option key={issueType.code} value={issueType.code}>
                {issueType.label}
              </option>
            ))}
          </FilterSelect>

          <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Title
            <input
              className="h-10 min-w-0 border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-[#8dc63f]"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
          <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Linked Field
            <input
              className="h-10 min-w-0 border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-[#8dc63f]"
              placeholder="Optional, e.g. capacity, source, coordinates"
              value={linkedField}
              onChange={(event) => setLinkedField(event.target.value)}
            />
          </label>

          <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Note
            <input
              className="h-10 min-w-0 border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-[#8dc63f]"
              placeholder="Optional operational context"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex h-9 items-center gap-2 border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700">
            <input
              checked={assignToSelf}
              className="h-4 w-4 accent-[#8dc63f]"
              type="checkbox"
              onChange={(event) => setAssignToSelf(event.target.checked)}
            />
            Assign to me
          </label>
          <button
            className="h-10 border border-[#8dc63f] bg-[#8dc63f] px-5 text-sm font-semibold text-white hover:bg-[#78ad35] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving || !issueTypeCode || !title.trim()}
            type="button"
            onClick={createIssue}
          >
            {saving ? "Creating..." : "Create Issue"}
          </button>
        </div>
      </div>
    </section>
  );
}

function SelectedRecordPanel({
  record,
  onClear,
  onStatusChanged,
  reviewStatuses,
  sourceStatuses,
  canReviewStatus,
  issueReferenceData,
}: {
  record: ResearchOpsRecord | null;
  onClear: () => void;
  onStatusChanged: (statusCode: string) => void;
  reviewStatuses: PostgresStatusOption[];
  sourceStatuses: PostgresStatusOption[];
  canReviewStatus: boolean;
  issueReferenceData: PostgresResearchOpsIssueReferenceData;
}) {
  if (!record) {
    return null;
  }

  const href = recordHref(record);
  const sourceHref = addSourceHref(record);

  return (
    <div className="space-y-4">
      <section className="border border-[#8dc63f] bg-[#f8fbf4] px-5 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[#4f7f1f]">
              Selected Record
            </div>
            <h2 className="mt-2 text-xl font-bold text-[#1f2937]">
              {record.name}
            </h2>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-gray-600">
              <span>{formatEntityType(record.entity_type)}</span>
              <span>{record.country || "No country"}</span>
              <span>{record.primary_use_type_code || "No type"}</span>
              <span>{record.review_status_code || "No review status"}</span>
              <span>Updated by {record.last_updated_by_name || "-"}</span>
            </div>
            {"issue_label" in record ? (
              <p className="mt-3 text-sm leading-6 text-gray-700">
                {record.issue_label}
              </p>
            ) : null}
            <p className="mt-2 break-all text-xs text-gray-500">
              {record.entity_id}
            </p>
          </div>
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 md:w-auto md:flex md:flex-wrap">
            <button
              className="h-9 border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
              type="button"
              onClick={onClear}
            >
              Clear
            </button>
            {href ? (
              <Link
                className="inline-flex h-9 items-center justify-center border border-[#8dc63f] bg-white px-4 text-sm font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec]"
                href={href}
              >
                Open Record
              </Link>
            ) : null}
            {sourceHref ? (
              <Link
                className="inline-flex h-9 items-center justify-center border border-[#8dc63f] bg-white px-4 text-sm font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec]"
                href={sourceHref}
              >
                Add Source
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <PostgresReviewStatusActions
        currentStatus={record.review_status_code}
        description="Move the selected entity through the MVP review workflow directly from the Research Ops queue."
        entityId={record.entity_id}
        entityType={record.entity_type}
        reviewStatuses={reviewStatuses}
        sourceStatuses={sourceStatuses}
        title="Quick Review Actions"
        canReviewStatus={canReviewStatus}
        onStatusChanged={onStatusChanged}
      />

      <CreateIssuePanel
        record={record}
        issueReferenceData={issueReferenceData}
      />
    </div>
  );
}

function PersistentIssues({
  issues,
  issueReferenceData,
  currentUser,
}: {
  issues: PostgresResearchOpsIssue[];
  issueReferenceData: PostgresResearchOpsIssueReferenceData;
  currentUser: { id: string; name: string | null } | null;
}) {
  const router = useRouter();
  const [hiddenIssueIds, setHiddenIssueIds] = useState<Set<string>>(
    () => new Set()
  );
  const [savingIssueId, setSavingIssueId] = useState<string | null>(null);
  const [eventNote, setEventNote] = useState("");
  const [assignmentFilter, setAssignmentFilter] =
    useState<AssignmentFilter>("all");
  const [issueTypeFilter, setIssueTypeFilter] = useState("all");
  const [linkedFieldFilter, setLinkedFieldFilter] = useState("all");
  const [error, setError] = useState("");
  const assignableUsers = issueReferenceData.assignableUsers
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
  const issueTypeOptions = issueReferenceData.issueTypes
    .filter((issueType) => issueType.is_active !== false)
    .slice()
    .sort((a, b) => {
      const aOrder = a.sort_order ?? 0;
      const bOrder = b.sort_order ?? 0;

      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      return a.label.localeCompare(b.label);
    });
  const linkedFieldOptions = useMemo(() => {
    const values = new Set<string>();

    issues.forEach((issue) => {
      if (issue.linked_field) {
        values.add(issue.linked_field);
      }
    });

    return Array.from(values).sort((a, b) =>
      formatLinkedField(a).localeCompare(formatLinkedField(b))
    );
  }, [issues]);
  const visibleIssues = issues
    .filter((issue) => !hiddenIssueIds.has(issue.research_ops_issue_id))
    .filter((issue) => {
      if (assignmentFilter === "mine") {
        return Boolean(
          currentUser && issue.assigned_to_user_id === currentUser.id
        );
      }

      if (assignmentFilter === "unassigned") {
        return !issue.assigned_to_user_id;
      }

      if (assignmentFilter.startsWith("user:")) {
        return issue.assigned_to_user_id === assignmentFilter.slice(5);
      }

      return true;
    })
    .filter((issue) => {
      if (issueTypeFilter !== "all") {
        return issue.issue_type_code === issueTypeFilter;
      }

      return true;
    })
    .filter((issue) => {
      if (linkedFieldFilter === "field_linked") {
        return Boolean(issue.linked_field);
      }

      if (linkedFieldFilter === "record_level") {
        return !issue.linked_field;
      }

      if (linkedFieldFilter.startsWith("field:")) {
        return issue.linked_field === linkedFieldFilter.slice(6);
      }

      return true;
    });
  const criticalIssueCount = visibleIssues.filter(
    (issue) => issue.severity === "critical"
  ).length;
  const fieldLinkedIssueCount = visibleIssues.filter(
    (issue) => issue.linked_field
  ).length;
  const assignedIssueCount = visibleIssues.filter(
    (issue) => issue.assigned_to_user_id
  ).length;
  const statusOptions = issueReferenceData.issueStatuses.filter(
    (status) => status.is_active !== false
  );

  function clearPersistentIssueFilters() {
    setAssignmentFilter("all");
    setIssueTypeFilter("all");
    setLinkedFieldFilter("all");
  }

  async function setIssueStatus(
    issue: PostgresResearchOpsIssue,
    issueStatusCode: string,
    options: { assignToSelf?: boolean; assignToUserId?: string } = {}
  ) {
    setSavingIssueId(issue.research_ops_issue_id);
    setError("");

    try {
      const res = await fetch(
        `/api/postgres-preview/research-ops/issues/${issue.research_ops_issue_id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            issue_status_code: issueStatusCode,
            event_note: eventNote,
            ...(options.assignToSelf ? { assign_to_self: true } : {}),
            ...(options.assignToUserId !== undefined
              ? { assign_to_user_id: options.assignToUserId }
              : {}),
          }),
        }
      );
      const json = await readJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to update research issue.");
      }

      const nextStatus = statusOptions.find(
        (status) => status.code === issueStatusCode
      );

      if (nextStatus && !nextStatus.is_open) {
        setHiddenIssueIds((current) => {
          const next = new Set(current);
          next.add(issue.research_ops_issue_id);
          return next;
        });
      }

      setEventNote("");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update research issue."
      );
    } finally {
      setSavingIssueId(null);
    }
  }

  async function assignIssue(
    issue: PostgresResearchOpsIssue,
    assignToUserId: string
  ) {
    await setIssueStatus(issue, issue.issue_status_code, { assignToUserId });
  }

  function exportVisibleIssues() {
    const rows: unknown[][] = [
      [
        "issue_type",
        "severity",
        "status",
        "entity_type",
        "entity_id",
        "legacy_id",
        "record_name",
        "country",
        "linked_field",
        "title",
        "description",
        "assigned_to",
        "created_by",
        "updated_at",
      ],
      ...visibleIssues.map((issue) => [
        issue.issue_type_label,
        issue.severity,
        issue.issue_status_label,
        issue.entity_type,
        issue.entity_id,
        issue.legacy_id,
        issue.name,
        issue.country,
        issue.linked_field,
        issue.title,
        issue.description,
        issue.assigned_to_name,
        issue.created_by_name,
        issue.updated_at,
      ]),
    ];

    downloadCsv("tge-research-ops-persistent-issues.csv", rows);
  }

  return (
    <section
      id="persistent-issues"
      className="scroll-mt-6 border border-gray-200 bg-white"
    >
      <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1f2937]">
            Persistent Research Issues
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Human-created issues and follow-ups with status, assignment, linked
            field, and audit event support.
          </p>
        </div>
        <span className="inline-flex min-h-[28px] items-center border border-gray-200 bg-[#f7f7f7] px-2 text-xs font-semibold text-gray-700">
          {formatCount(visibleIssues.length)} open
        </span>
      </div>

      <div className="space-y-4 px-5 py-5">
        {error ? (
          <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border border-gray-200 bg-[#fbfbfb] px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Filtered Open
            </div>
            <div className="mt-1 text-2xl font-bold text-[#1f2937]">
              {formatCount(visibleIssues.length)}
            </div>
          </div>
          <div className="border border-red-100 bg-red-50 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-red-700">
              Critical
            </div>
            <div className="mt-1 text-2xl font-bold text-red-800">
              {formatCount(criticalIssueCount)}
            </div>
          </div>
          <div className="border border-blue-100 bg-blue-50 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Field-Linked
            </div>
            <div className="mt-1 text-2xl font-bold text-blue-800">
              {formatCount(fieldLinkedIssueCount)}
            </div>
          </div>
          <div className="border border-[#d9eac2] bg-[#f5faee] px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#4f7f1f]">
              Assigned
            </div>
            <div className="mt-1 text-2xl font-bold text-[#3f6f19]">
              {formatCount(assignedIssueCount)}
            </div>
          </div>
        </div>

        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Resolution / Status Note
          <input
            className="mt-1 h-10 w-full border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-[#8dc63f]"
            placeholder="Optional note applied when changing an issue status"
            value={eventNote}
            onChange={(event) => setEventNote(event.target.value)}
          />
        </label>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[220px_220px_260px_minmax(0,1fr)]">
          <FilterSelect
            label="Assignment"
            value={assignmentFilter}
            onChange={(value) => setAssignmentFilter(value as AssignmentFilter)}
          >
            <option value="all">All Open Issues</option>
            <option value="mine" disabled={!currentUser}>
              Assigned To Me
            </option>
            <option value="unassigned">Unassigned</option>
            {assignableUsers.map((user) => (
              <option key={user.user_id} value={`user:${user.user_id}`}>
                {user.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Issue Type"
            value={issueTypeFilter}
            onChange={setIssueTypeFilter}
          >
            <option value="all">All issue types</option>
            {issueTypeOptions.map((issueType) => (
              <option key={issueType.code} value={issueType.code}>
                {issueType.label}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Linked Field"
            value={linkedFieldFilter}
            onChange={setLinkedFieldFilter}
          >
            <option value="all">All fields</option>
            <option value="field_linked">Any field-linked issue</option>
            <option value="record_level">Record-level only</option>
            {linkedFieldOptions.map((linkedField) => (
              <option key={linkedField} value={`field:${linkedField}`}>
                {formatLinkedField(linkedField)}
              </option>
            ))}
          </FilterSelect>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <button
              className="h-10 w-full border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f] sm:w-auto"
              type="button"
              onClick={clearPersistentIssueFilters}
            >
              Clear Issue Filters
            </button>
            <button
              className="h-10 w-full border border-[#8dc63f] bg-white px-4 text-sm font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              disabled={visibleIssues.length === 0}
              type="button"
              onClick={exportVisibleIssues}
            >
              Export Issues CSV
            </button>
            {currentUser ? (
              <span className="self-center text-xs font-medium text-gray-500">
                Current PostgreSQL user: {currentUser.name || "Current user"}
              </span>
            ) : null}
          </div>
        </div>

        {visibleIssues.length === 0 ? (
          <div className="border border-gray-200 bg-[#f7f7f7] px-4 py-3 text-sm text-gray-600">
            No persistent research issues are currently open.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1280px] table-fixed text-left text-sm">
              <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="w-[13%] px-4 py-3 font-semibold">Issue</th>
                  <th className="w-[23%] px-4 py-3 font-semibold">Record</th>
                  <th className="w-[13%] px-4 py-3 font-semibold">Field</th>
                  <th className="w-[10%] px-4 py-3 font-semibold">Severity</th>
                  <th className="w-[10%] px-4 py-3 font-semibold">Status</th>
                  <th className="w-[14%] px-4 py-3 font-semibold">Assigned</th>
                  <th className="w-[10%] px-4 py-3 font-semibold">Updated</th>
                  <th className="w-[17%] px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleIssues.map((issue) => {
                  const href = issueHref(issue);
                  const saving = savingIssueId === issue.research_ops_issue_id;

                  return (
                    <tr
                      key={issue.research_ops_issue_id}
                      className="align-top transition-colors hover:bg-[#fbfdf8]"
                    >
                      <td className="px-4 py-2.5">
                        <CompactCellText
                          className="font-semibold text-[#1f2937]"
                          value={issue.issue_type_label}
                        />
                        <CompactCellText
                          className="mt-1 text-xs text-gray-500"
                          value={formatEntityType(issue.entity_type)}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <CompactCellText
                          className="font-semibold text-[#1f2937]"
                          lines={2}
                          value={issue.title}
                        />
                        <CompactCellText
                          className="mt-1 text-xs text-gray-600"
                          value={issue.name}
                        />
                        {issue.description ? (
                          <CompactCellText
                            className="mt-2 text-xs leading-5 text-gray-500"
                            lines={2}
                            value={issue.description}
                          />
                        ) : null}
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          className="inline-flex min-h-7 max-w-full items-center border border-gray-200 bg-[#f7f7f7] px-2 text-left text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                          type="button"
                          title={formatLinkedField(issue.linked_field)}
                          onClick={() =>
                            setLinkedFieldFilter(
                              issue.linked_field
                                ? `field:${issue.linked_field}`
                                : "record_level"
                            )
                          }
                        >
                          <span className="line-clamp-1 break-words">
                            {formatLinkedField(issue.linked_field)}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-2.5">
                        <SeverityBadge severity={issue.severity} />
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge value={issue.issue_status_label} />
                      </td>
                      <td className="px-4 py-2.5 text-gray-700">
                        <select
                          className="h-8 w-full min-w-0 border border-gray-300 bg-white px-2 text-xs font-semibold text-gray-700 outline-none focus:border-[#8dc63f] disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={saving}
                          value={issue.assigned_to_user_id || ""}
                          onChange={(event) =>
                            assignIssue(issue, event.target.value)
                          }
                        >
                          <option value="">Unassigned</option>
                          {assignableUsers.map((user) => (
                            <option key={user.user_id} value={user.user_id}>
                              {user.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2.5 text-gray-700">
                        {formatDate(issue.updated_at)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1.5">
                          {href ? (
                            <Link
                              className="inline-flex h-8 items-center border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                              href={href}
                            >
                              Open
                            </Link>
                          ) : null}
                          <button
                            className="h-8 border border-blue-200 bg-white px-3 text-xs font-semibold text-blue-800 hover:bg-blue-50 disabled:opacity-60"
                            disabled={saving || issue.issue_status_code === "in_progress"}
                            type="button"
                            onClick={() =>
                              setIssueStatus(issue, "in_progress", {
                                assignToSelf: true,
                              })
                            }
                          >
                            {saving ? "Saving..." : "In Progress"}
                          </button>
                          <button
                            className="h-8 border border-[#8dc63f] bg-white px-3 text-xs font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec] disabled:opacity-60"
                            disabled={saving}
                            type="button"
                            onClick={() => setIssueStatus(issue, "resolved")}
                          >
                            Resolve
                          </button>
                          <button
                            className="h-8 border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                            disabled={saving}
                            type="button"
                            onClick={() => setIssueStatus(issue, "dismissed")}
                          >
                            Dismiss
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function ResearchActivitySummary({
  recentEdits,
}: {
  recentEdits: PostgresResearchOpsRecentEdit[];
}) {
  const sourceUpdates = recentEdits.filter(
    (item) => item.entity_type === "source"
  ).length;
  const approvedOrReady = recentEdits.filter((item) =>
    ["approved", "export_ready", "credible"].includes(
      item.review_status_code || ""
    )
  ).length;
  const needsReview = recentEdits.filter((item) =>
    ["draft", "validation", "needs_review", "needs_update"].includes(
      item.review_status_code || ""
    )
  ).length;
  const touchedBy = new Set(
    recentEdits
      .map((item) => item.last_updated_by_name)
      .filter((name): name is string => Boolean(name))
  ).size;
  const auditedChanges = recentEdits.filter((item) =>
    Boolean(item.latest_activity_type)
  ).length;

  const cards = [
    {
      label: "Recent Edits",
      value: recentEdits.length,
      note: "Latest staging updates",
    },
    {
      label: "Approved / Ready",
      value: approvedOrReady,
      note: "Recently updated approved states",
    },
    {
      label: "Needs Review",
      value: needsReview,
      note: "Recent rows still needing review",
    },
    {
      label: "Source Updates",
      value: sourceUpdates,
      note: "Recent evidence activity",
    },
    {
      label: "Audited Changes",
      value: auditedChanges,
      note: "Recent rows with audit events",
    },
    {
      label: "Researchers",
      value: touchedBy,
      note: "Named users in recent edits",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <div key={card.label} className="border border-gray-200 bg-white px-4 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {card.label}
          </div>
          <div className="mt-2 text-3xl font-bold leading-none text-[#1f2937]">
            {formatCount(card.value)}
          </div>
          <div className="mt-2 text-xs leading-5 text-gray-500">
            {card.note}
          </div>
        </div>
      ))}
    </section>
  );
}

function ResearcherActivityOverview({
  recentEdits,
  issues,
  onFocusResearcher,
}: {
  recentEdits: PostgresResearchOpsRecentEdit[];
  issues: PostgresResearchOpsIssue[];
  onFocusResearcher: (name: string) => void;
}) {
  const rows = useMemo(
    () => buildResearcherActivityRows(recentEdits, issues),
    [issues, recentEdits]
  );

  return (
    <section
      id="researcher-activity"
      className="scroll-mt-24 border border-gray-200 bg-white"
    >
      <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1f2937]">
            Researcher Activity Lens
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Operational visibility for validation and guidance: recent edits,
            evidence activity, assigned follow-ups, and completed issue work.
            This is context, not scoring.
          </p>
        </div>
        <span className="inline-flex h-8 items-center self-start border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-800">
          Work visibility
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="px-5 py-5 text-sm text-gray-500">
          No named researcher activity is available in the current recent
          activity window.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[1080px] table-fixed text-left text-sm">
            <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
              <tr>
                <th className="w-[20%] px-4 py-3 font-semibold">Researcher</th>
                <th className="w-[12%] px-4 py-3 font-semibold">Recent Work</th>
                <th className="w-[14%] px-4 py-3 font-semibold">Review Movement</th>
                <th className="w-[14%] px-4 py-3 font-semibold">Follow-Ups</th>
                <th className="w-[12%] px-4 py-3 font-semibold">Sources</th>
                <th className="w-[12%] px-4 py-3 font-semibold">Last Touched</th>
                <th className="w-[16%] px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr
                  key={row.name}
                  className="align-top transition-colors hover:bg-[#fbfdf8]"
                >
                  <td className="px-4 py-2.5">
                    <CompactCellText
                      className="font-semibold text-[#1f2937]"
                      value={row.name}
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      Named recent activity
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-700">
                    <div className="text-lg font-bold leading-none text-[#1f2937]">
                      {formatCount(row.recentEdits)}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      edited rows
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs leading-5 text-gray-600">
                    <div>
                      <span className="font-semibold text-[#4f7f1f]">
                        {formatCount(row.approvedOrReady)}
                      </span>{" "}
                      approved / ready
                    </div>
                    <div>
                      <span className="font-semibold text-amber-700">
                        {formatCount(row.needsReview)}
                      </span>{" "}
                      still in review
                    </div>
                    <div>
                      <span className="font-semibold text-blue-800">
                        {formatCount(row.auditedChanges)}
                      </span>{" "}
                      audited changes
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs leading-5 text-gray-600">
                    <div>
                      <span className="font-semibold text-[#1f2937]">
                        {formatCount(row.assignedOpenIssues)}
                      </span>{" "}
                      open assigned
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">
                        {formatCount(row.createdIssues)}
                      </span>{" "}
                      created
                    </div>
                    <div>
                      <span className="font-semibold text-[#4f7f1f]">
                        {formatCount(row.resolvedIssues)}
                      </span>{" "}
                      resolved
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-700">
                    <div className="text-lg font-bold leading-none text-[#1f2937]">
                      {formatCount(row.sourceUpdates)}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      evidence rows
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-700">
                    {formatDate(row.lastUpdatedAt)}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      className="inline-flex h-8 items-center border border-[#8dc63f] bg-white px-3 text-xs font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec]"
                      type="button"
                      onClick={() => onFocusResearcher(row.name)}
                    >
                      View Work
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function RecentEdits({
  items,
  selectedKey,
  selectedBulkKeys,
  onToggleBulk,
  onToggleVisible,
  onSelect,
}: {
  items: PostgresResearchOpsRecentEdit[];
  selectedKey: string | null;
  selectedBulkKeys: Set<string>;
  onToggleBulk: (record: ResearchOpsRecord, checked: boolean) => void;
  onToggleVisible: (records: ResearchOpsRecord[], checked: boolean) => void;
  onSelect: (record: ResearchOpsRecord) => void;
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-bold text-[#1f2937]">Recently Edited</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
          Latest platform edits by updated timestamp, including the
          researcher/editor field when user metadata exists.
        </p>
      </div>
      <EntityTable
        compactRows
        items={items}
        onSelect={onSelect}
        onToggleBulk={onToggleBulk}
        onToggleVisible={onToggleVisible}
        selectedBulkKeys={selectedBulkKeys}
        selectedKey={selectedKey}
      />
    </section>
  );
}

export function ResearchOpsDashboardClient({
  dashboard,
  reviewStatuses,
  sourceStatuses,
  canReviewStatus,
  currentUser,
  issueReferenceData,
  sourceMatchSummary,
  articleFactSummary,
  fieldSuggestionSummary,
  fieldSuggestionCandidates,
}: {
  dashboard: PostgresResearchOpsDashboard;
  reviewStatuses: PostgresStatusOption[];
  sourceStatuses: PostgresStatusOption[];
  canReviewStatus: boolean;
  currentUser: { id: string; name: string | null } | null;
  issueReferenceData: PostgresResearchOpsIssueReferenceData;
  sourceMatchSummary: SourceMatchCandidateSummary;
  articleFactSummary: ArticleFactCandidateSummary;
  fieldSuggestionSummary: PostgresFieldSuggestionSummary;
  fieldSuggestionCandidates: PostgresFieldSuggestionCandidate[];
}) {
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("all");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [entityFilter, setEntityFilter] = useState<EntityFilter>("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showEmptyQueues, setShowEmptyQueues] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ResearchOpsRecord | null>(
    null
  );
  const [selectedBulkKeys, setSelectedBulkKeys] = useState<Set<string>>(
    () => new Set()
  );
  const [collapsedQueueKeys, setCollapsedQueueKeys] = useState<
    Set<ResearchOpsQueueKey>
  >(() => new Set());
  const [deepWorkbenchOpen, setDeepWorkbenchOpen] = useState(false);
  const [queueRowsCompact, setQueueRowsCompact] = useState(true);
  const [focusedResearcher, setFocusedResearcher] = useState<string | null>(
    null
  );

  const normalizedSearch = search.trim().toLowerCase();

  const countryOptions = useMemo(() => {
    const values = new Set<string>();

    dashboard.queues.forEach((queue) => {
      queue.items.forEach((item) => values.add(item.country || "__missing__"));
    });

    dashboard.recentEdits.forEach((item) => {
      values.add(item.country || "__missing__");
    });

    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [dashboard.queues, dashboard.recentEdits]);

  const filteredQueues = useMemo(() => {
    return dashboard.queues
      .filter((queue) => queueFilter === "all" || queue.key === queueFilter)
      .filter(
        (queue) => severityFilter === "all" || queue.severity === severityFilter
      )
      .map((queue) => ({
        ...queue,
        items: queue.items.filter((item) =>
          recordMatchesFilters(
            item,
            entityFilter,
            countryFilter,
            normalizedSearch
          )
        ),
      }))
      .filter((queue) => showEmptyQueues || queue.items.length > 0);
  }, [
    countryFilter,
    dashboard.queues,
    entityFilter,
    normalizedSearch,
    queueFilter,
    severityFilter,
    showEmptyQueues,
  ]);

  const filteredRecentEdits = useMemo(() => {
    return dashboard.recentEdits.filter((item) =>
      recordMatchesFilters(item, entityFilter, countryFilter, normalizedSearch)
    );
  }, [countryFilter, dashboard.recentEdits, entityFilter, normalizedSearch]);

  const filteredIssueRows = filteredQueues.reduce(
    (sum, queue) => sum + queue.items.length,
    0
  );

  const filteredRecords = useMemo(() => {
    const records = new Map<string, ResearchOpsRecord>();

    filteredQueues.forEach((queue) => {
      queue.items.forEach((item) => records.set(recordKey(item), item));
    });
    filteredRecentEdits.forEach((item) => records.set(recordKey(item), item));

    return Array.from(records.values());
  }, [filteredQueues, filteredRecentEdits]);

  const allRecordLookup = useMemo(() => {
    const records = new Map<string, ResearchOpsRecord>();

    dashboard.queues.forEach((queue) => {
      queue.items.forEach((item) => records.set(recordKey(item), item));
    });
    dashboard.recentEdits.forEach((item) => records.set(recordKey(item), item));

    return records;
  }, [dashboard.queues, dashboard.recentEdits]);

  const selectedBulkRecords = useMemo(() => {
    return Array.from(selectedBulkKeys)
      .map((key) => allRecordLookup.get(key))
      .filter((record): record is ResearchOpsRecord => Boolean(record));
  }, [allRecordLookup, selectedBulkKeys]);

  const queueCounts = useMemo(() => {
    return new Map(
      dashboard.queues.map((queue) => [queue.key, queue.count] as const)
    );
  }, [dashboard.queues]);

  const queueTitleByKey = useMemo(() => {
    return new Map(
      dashboard.queues.map((queue) => [queue.key, queue.title] as const)
    );
  }, [dashboard.queues]);

  const myAssignedIssueCount = useMemo(() => {
    if (!currentUser) {
      return 0;
    }

    return dashboard.persistentIssues.filter(
      (issue) => issue.assigned_to_user_id === currentUser.id
    ).length;
  }, [currentUser, dashboard.persistentIssues]);

  const exportBlockerCount = useMemo(() => {
    return dashboard.queues
      .filter((queue) => exportBlockingQueueKeys.has(queue.key))
      .reduce((sum, queue) => sum + queue.count, 0);
  }, [dashboard.queues]);

  const sourceGapCount = useMemo(
    () =>
      sumQueueCounts(queueCounts, [
        "needs_source",
        "source_needs_review",
        "weak_or_outdated_source",
      ]),
    [queueCounts]
  );

  const queueGroups = useMemo(() => {
    const queueByKey = new Map(
      dashboard.queues.map((queue) => [queue.key, queue] as const)
    );

    return queueGroupDefinitions.map((group) => {
      const queues = group.queueKeys
        .map((queueKey) => queueByKey.get(queueKey))
        .filter((queue): queue is PostgresResearchOpsQueue => Boolean(queue));

      return {
        ...group,
        count: queues.reduce((sum, queue) => sum + queue.count, 0),
        criticalCount: queues
          .filter((queue) => queue.severity === "critical")
          .reduce((sum, queue) => sum + queue.count, 0),
        queues: queues.map((queue) => ({
          key: queue.key,
          title: queue.title,
          count: queue.count,
          severity: queue.severity,
        })),
      };
    });
  }, [dashboard.queues]);

  const activeOperationalFilters = useMemo(() => {
    const filters: ActiveOperationalFilter[] = [];

    if (queueFilter !== "all") {
      filters.push({
        key: "queue",
        label: "Queue",
        value: queueTitleByKey.get(queueFilter) || queueFilter,
      });
    }

    if (severityFilter !== "all") {
      filters.push({
        key: "severity",
        label: "Severity",
        value: severityFilter,
      });
    }

    if (entityFilter !== "all") {
      filters.push({
        key: "entity",
        label: "Entity",
        value: formatEntityType(entityFilter),
      });
    }

    if (countryFilter !== "all") {
      filters.push({
        key: "country",
        label: "Country",
        value: countryFilter === "__missing__" ? "Missing country" : countryFilter,
      });
    }

    if (focusedResearcher && search === focusedResearcher) {
      filters.push({
        key: "researcher",
        label: "Researcher",
        value: focusedResearcher,
      });
    } else if (search) {
      filters.push({
        key: "search",
        label: "Search",
        value: search,
      });
    }

    if (showEmptyQueues) {
      filters.push({
        key: "showEmpty",
        label: "Queue Display",
        value: "Show empty queues",
      });
    }

    return filters;
  }, [
    countryFilter,
    entityFilter,
    queueFilter,
    queueTitleByKey,
    focusedResearcher,
    search,
    severityFilter,
    showEmptyQueues,
  ]);

  function clearFilters() {
    setQueueFilter("all");
    setSeverityFilter("all");
    setEntityFilter("all");
    setCountryFilter("all");
    setSearch("");
    setFocusedResearcher(null);
    setShowEmptyQueues(false);
  }

  function focusResearcher(name: string) {
    setFocusedResearcher(name);
    setSearch(name);
    setDeepWorkbenchOpen(true);
    scrollToPageSection("deep-table");
  }

  function removeOperationalFilter(
    filterKey: (typeof activeOperationalFilters)[number]["key"]
  ) {
    if (filterKey === "queue") {
      setQueueFilter("all");
      return;
    }

    if (filterKey === "severity") {
      setSeverityFilter("all");
      return;
    }

    if (filterKey === "entity") {
      setEntityFilter("all");
      return;
    }

    if (filterKey === "country") {
      setCountryFilter("all");
      return;
    }

    if (filterKey === "search") {
      setSearch("");
      setFocusedResearcher(null);
      return;
    }

    if (filterKey === "researcher") {
      setSearch("");
      setFocusedResearcher(null);
      return;
    }

    if (filterKey === "showEmpty") {
      setShowEmptyQueues(false);
    }
  }

  function toggleBulkRecord(record: ResearchOpsRecord, checked: boolean) {
    setSelectedBulkKeys((current) => {
      const next = new Set(current);
      const key = recordKey(record);

      if (checked) {
        next.add(key);
      } else {
        next.delete(key);
      }

      return next;
    });
  }

  function toggleBulkRecords(records: ResearchOpsRecord[], checked: boolean) {
    setSelectedBulkKeys((current) => {
      const next = new Set(current);

      records.forEach((record) => {
        const key = recordKey(record);

        if (checked) {
          next.add(key);
        } else {
          next.delete(key);
        }
      });

      return next;
    });
  }

  function selectFilteredRecords() {
    toggleBulkRecords(filteredRecords, true);
  }

  function applyOperationalView(view: {
    queue?: QueueFilter;
    severity?: SeverityFilter;
    entity?: EntityFilter;
  }) {
    setDeepWorkbenchOpen(true);
    setQueueFilter(view.queue || "all");
    setSeverityFilter(view.severity || "all");
    setEntityFilter(view.entity || "all");
    setCountryFilter("all");
    setSearch("");
    setShowEmptyQueues(false);
    scrollToPageSection("deep-table");
  }

  function toggleQueueCollapsed(queueKey: ResearchOpsQueueKey) {
    setCollapsedQueueKeys((current) => {
      const next = new Set(current);

      if (next.has(queueKey)) {
        next.delete(queueKey);
      } else {
        next.add(queueKey);
      }

      return next;
    });
  }

  function collapseAllQueues() {
    setCollapsedQueueKeys(new Set(filteredQueues.map((queue) => queue.key)));
  }

  function expandAllQueues() {
    setCollapsedQueueKeys(new Set());
  }

  function exportFilteredIssues() {
    if (!canReviewStatus) {
      return;
    }

    const rows: unknown[][] = [
      [
        "queue",
        "severity",
        "entity_type",
        "entity_id",
        "legacy_id",
        "name",
        "country",
        "use_type",
        "status",
        "review_status",
        "issue_label",
        "last_updated_by",
        "updated_at",
      ],
    ];

    filteredQueues.forEach((queue) => {
      queue.items.forEach((item) => {
        rows.push([
          queue.title,
          queue.severity,
          item.entity_type,
          item.entity_id,
          item.legacy_id,
          item.name,
          item.country,
          item.primary_use_type_code,
          item.lifecycle_phase_code,
          item.review_status_code,
          item.issue_label,
          item.last_updated_by_name,
          item.updated_at,
        ]);
      });
    });

    downloadCsv(
      `tge-postgres-research-ops-${new Date().toISOString().slice(0, 10)}.csv`,
      rows
    );
  }

  function handleStatusChanged(statusCode: string) {
    setSelectedRecord((current) =>
      current
        ? {
            ...current,
            review_status_code: statusCode,
            updated_at: new Date().toISOString(),
          }
        : current
    );
  }

  function handleBulkStatusChanged(recordKeys: string[], statusCode: string) {
    const changedKeys = new Set(recordKeys);

    setSelectedRecord((current) =>
      current && changedKeys.has(recordKey(current))
        ? {
            ...current,
            review_status_code: statusCode,
            updated_at: new Date().toISOString(),
          }
        : current
    );
  }

  return (
    <>
      <PostgresSectionJumpNav
        items={[
          {
            href: "#ops-triage",
            label: "Triage",
            note: "Status",
          },
          {
            href: "#work-review",
            label: "Work Queues",
            note: "Review",
          },
          {
            href: "#deep-workbench",
            label: "Workbench",
            note: "Filters",
          },
          {
            href: "#research-activity",
            label: "Activity",
            note: "Recent",
          },
          {
            href: "#researcher-activity",
            label: "Researchers",
            note: "Work",
          },
          {
            href: "#queue-rows",
            label: "Queue Rows",
            note: "Tables",
          },
        ]}
      />

      <section id="ops-triage" className="space-y-4 scroll-mt-24">
        <WorkflowTierMarker
          eyebrow="Core"
          title="Operational Triage"
          description="Critical issues, backlog, assignments, source gaps, blockers."
          tone="core"
        />

        <OperationalStatusBar
          metrics={[
            {
              label: "Critical",
              value: dashboard.totals.criticalIssues,
              note: "Highest-priority data quality issues",
              tone: "critical",
              onClick: () => applyOperationalView({ severity: "critical" }),
            },
            {
              label: "Validation Backlog",
              value: queueCounts.get("needs_approval") || 0,
              note: "Draft or validation items",
              tone: "workflow",
              onClick: () => applyOperationalView({ queue: "needs_approval" }),
            },
            {
              label: "Assigned To Me",
              value: myAssignedIssueCount,
              note: "Persistent human-created issues",
              tone: "neutral",
              onClick: () => scrollToPageSection("my-work"),
            },
            {
              label: "Source Gaps",
              value: sourceGapCount,
              note: "Missing, weak, or unreviewed evidence",
              tone: "important",
              onClick: () => applyOperationalView({ queue: "needs_source" }),
            },
            {
              label: "Duplicate Warnings",
              value: queueCounts.get("suspected_duplicates") || 0,
              note: "Potential duplicate items",
              tone: "important",
              onClick: () =>
                applyOperationalView({ queue: "suspected_duplicates" }),
            },
            {
              label: "Export Blockers",
              value: exportBlockerCount,
              note: "Critical queues before export-ready use",
              tone: "critical",
              onClick: () => applyOperationalView({ severity: "critical" }),
            },
            {
              label: "AI Suggestions",
              value: fieldSuggestionSummary.open,
              note: "Field suggestions awaiting review",
              tone: "workflow",
              onClick: () => scrollToPageSection("field-suggestion-review"),
            },
            {
              label: "Article Facts",
              value: articleFactSummary.total,
              note: "Reviewed extraction candidates",
              tone: "workflow",
              onClick: () => scrollToPageSection("article-fact-review"),
            },
          ]}
        />

        <ExportBlockerPanel
          queues={dashboard.queues}
          onSelectQueue={(queue) => applyOperationalView({ queue })}
        />
      </section>

      <section id="work-review" className="space-y-5 scroll-mt-24">
        <WorkflowTierMarker
          eyebrow="Workflow"
          title="Work And Review Queues"
          description="Assignments, article review, AI candidates, saved views, system queues."
          tone="workflow"
        />

        <MyWorkPanel
          currentUser={currentUser}
          issues={dashboard.persistentIssues}
        />

        <PersistentIssues
          issues={dashboard.persistentIssues}
          currentUser={currentUser}
          issueReferenceData={issueReferenceData}
        />

        <ArticleMatchReviewPanel summary={sourceMatchSummary} />

        <ArticleFactReviewPanel summary={articleFactSummary} />

        <FieldSuggestionReviewPanel
          canReviewStatus={canReviewStatus}
          candidates={fieldSuggestionCandidates}
          summary={fieldSuggestionSummary}
        />

        <QuickOperationalViews onApplyView={applyOperationalView} />

        <SystemQueueGroups
          groups={queueGroups}
          onSelectQueue={(queue) => applyOperationalView({ queue })}
        />
      </section>

      <section id="deep-workbench" className="space-y-5 scroll-mt-24">
        <DisclosurePanel
          id="deep-table"
          description="Filters, selected items, bulk actions, exports, activity, and queue scope. It opens automatically when a queue or operational view is selected."
          eyebrow="Governance"
          onOpenChange={setDeepWorkbenchOpen}
          open={deepWorkbenchOpen || activeOperationalFilters.length > 0}
          title="Deep Workbench"
        >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_repeat(4,minmax(150px,190px))] xl:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Search
              <input
                className="h-10 min-w-0 border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-[#8dc63f]"
                placeholder="Name, country, issue, status, researcher"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setFocusedResearcher(null);
                }}
              />
            </label>
            <FilterSelect
              label="Issue Type"
              value={queueFilter}
              onChange={(value) => setQueueFilter(value as QueueFilter)}
            >
              <option value="all">All issue types</option>
              {dashboard.queues.map((queue) => (
                <option key={queue.key} value={queue.key}>
                  {queue.title}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              label="Severity"
              value={severityFilter}
              onChange={(value) => setSeverityFilter(value as SeverityFilter)}
            >
              <option value="all">All severities</option>
              <option value="critical">Critical</option>
              <option value="important">Important</option>
              <option value="workflow">Workflow</option>
            </FilterSelect>
            <FilterSelect
              label="Record Type"
              value={entityFilter}
              onChange={(value) => setEntityFilter(value as EntityFilter)}
            >
              <option value="all">All record types</option>
              <option value="project">Projects</option>
              <option value="operating_asset">Plants</option>
              <option value="company">Companies</option>
              <option value="source">Sources</option>
            </FilterSelect>
            <FilterSelect
              label="Country"
              value={countryFilter}
              onChange={setCountryFilter}
            >
              <option value="all">All countries</option>
              {countryOptions.map((country) => (
                <option key={country} value={country}>
                  {country === "__missing__" ? "Missing country" : country}
                </option>
              ))}
            </FilterSelect>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                className={
                  queueFilter === "all"
                    ? "h-8 border border-[#8dc63f] bg-[#f3f8ec] px-3 text-xs font-semibold text-[#4f7f1f]"
                    : "h-8 border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                }
                type="button"
                onClick={() => setQueueFilter("all")}
              >
                All
              </button>
              {dashboard.queues.map((queue) => (
                <button
                  className={
                    queueFilter === queue.key
                      ? "h-8 border border-[#8dc63f] bg-[#f3f8ec] px-3 text-xs font-semibold text-[#4f7f1f]"
                      : "h-8 border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                  }
                  key={queue.key}
                  type="button"
                  onClick={() => setQueueFilter(queue.key)}
                >
                  {queue.title} ({formatCount(queue.count)})
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:flex-wrap xl:items-center">
              <label className="inline-flex h-9 items-center justify-center gap-2 border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 sm:justify-start">
                <input
                  checked={showEmptyQueues}
                  className="h-4 w-4 accent-[#8dc63f]"
                  type="checkbox"
                  onChange={(event) => setShowEmptyQueues(event.target.checked)}
                />
                Show empty queues
              </label>
              <button
                className="h-9 border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                type="button"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
              <button
                className="h-9 border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                disabled={filteredRecords.length === 0}
                type="button"
                onClick={selectFilteredRecords}
              >
                Select Filtered
              </button>
              <button
                className="h-9 border border-[#8dc63f] bg-white px-4 text-sm font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canReviewStatus || filteredIssueRows === 0}
                type="button"
                onClick={exportFilteredIssues}
                title={
                  canReviewStatus
                    ? undefined
                    : "Exports require editor or admin permissions."
                }
              >
                Export Filtered CSV
              </button>
            </div>
          </div>

          <ResearchOpsViewContext
            activeFilters={activeOperationalFilters}
            canReviewStatus={canReviewStatus}
            filteredIssueRows={filteredIssueRows}
            filteredRecordCount={filteredRecords.length}
            selectedBulkCount={selectedBulkRecords.length}
            onRemoveFilter={removeOperationalFilter}
          />
        </div>
        </DisclosurePanel>

        <section className="border border-gray-200 bg-white px-5 py-4 text-sm leading-6 text-gray-600">
        <span className="font-semibold text-[#1f2937]">Current scope:</span>{" "}
        Platform queues now support quick review-status changes for
        projects, plants, companies, and source credibility.
        Railway PostgreSQL uses a transformed copied Hetzner SQLite
        backup for controlled review; the current live SQLite database remains
        on the server. Generated {formatDate(dashboard.generatedAt)}.
        </section>

        <PostgresStatusLegend
          description="Research Ops uses badge colors to separate data quality severity, human review state, project/plant status, source credibility, and AI candidate confidence."
          groups={["severity", "review", "lifecycle", "source", "confidence"]}
          title="Research Ops Badge Meaning"
        />

        <SelectedRecordPanel
          record={selectedRecord}
          reviewStatuses={reviewStatuses}
          sourceStatuses={sourceStatuses}
          canReviewStatus={canReviewStatus}
          issueReferenceData={issueReferenceData}
          onClear={() => setSelectedRecord(null)}
          onStatusChanged={handleStatusChanged}
        />

        <BulkActionsPanel
          canReviewStatus={canReviewStatus}
          reviewStatuses={reviewStatuses}
          selectedRecords={selectedBulkRecords}
          sourceStatuses={sourceStatuses}
          onClearSelection={() => setSelectedBulkKeys(new Set())}
          onRecordsChanged={handleBulkStatusChanged}
        />
      </section>

      <section id="research-activity" className="scroll-mt-24">
        <DisclosurePanel
          defaultOpen={false}
          description="Recently edited platform items and summary indicators for source, approval, and review activity. Dedicated approval/source-addition timelines should come next."
          eyebrow="Research Activity"
          title="Recent Activity"
        >
        <div className="space-y-5">
          <ResearchActivitySummary recentEdits={filteredRecentEdits} />

          <ResearcherActivityOverview
            issues={dashboard.persistentIssues}
            recentEdits={filteredRecentEdits}
            onFocusResearcher={focusResearcher}
          />

          <RecentEdits
            items={filteredRecentEdits}
            onSelect={setSelectedRecord}
            onToggleBulk={toggleBulkRecord}
            onToggleVisible={toggleBulkRecords}
            selectedBulkKeys={selectedBulkKeys}
            selectedKey={selectedRecord ? recordKey(selectedRecord) : null}
          />
        </div>
        </DisclosurePanel>
      </section>

      <section id="queue-rows" className="space-y-5 scroll-mt-24">
        <SectionIntro
          eyebrow="Deep Table View"
          title="Filtered System Queue Rows"
          description="Use this area for detailed filtering, row selection, bulk review actions, CSV exports, and click-through to the underlying project, plant, company, or source record."
        />

        <section className="flex flex-col gap-3 border border-gray-200 bg-white px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm leading-6 text-gray-600">
          {formatCount(filteredQueues.length)} queue
          {filteredQueues.length === 1 ? "" : "s"} visible. Collapse queues to
          keep the workbench manageable while preserving the active filter state.
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:flex md:flex-wrap">
          <button
            className="h-9 border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
            type="button"
            onClick={() => setQueueRowsCompact((current) => !current)}
          >
            {queueRowsCompact ? "Detailed Rows" : "Compact Rows"}
          </button>
          <button
            className="h-9 border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
            type="button"
            onClick={collapseAllQueues}
          >
            Collapse All
          </button>
          <button
            className="h-9 border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
            type="button"
            onClick={expandAllQueues}
          >
            Expand All
          </button>
        </div>
        </section>

        <div className="space-y-5">
          {filteredQueues.map((queue) => (
            <QueueCard
              key={queue.key}
              queue={queue}
              collapsed={collapsedQueueKeys.has(queue.key)}
              compactRows={queueRowsCompact}
              onSelect={setSelectedRecord}
              onToggleCollapsed={() => toggleQueueCollapsed(queue.key)}
              onToggleBulk={toggleBulkRecord}
              onToggleVisible={toggleBulkRecords}
              selectedBulkKeys={selectedBulkKeys}
              selectedKey={selectedRecord ? recordKey(selectedRecord) : null}
            />
          ))}
        </div>
      </section>
    </>
  );
}
