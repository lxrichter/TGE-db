"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { formatCount } from "@/lib/format";
import PostgresReviewStatusActions, {
  type PostgresStatusOption,
} from "@/components/postgres-preview/PostgresReviewStatusActions";
import {
  type PostgresResearchOpsDashboard,
  type PostgresResearchOpsIssue,
  type PostgresResearchOpsIssueReferenceData,
  type PostgresResearchOpsQueue,
  type PostgresResearchOpsQueueItem,
  type PostgresResearchOpsRecentEdit,
  type ResearchOpsQueueKey,
  type ResearchOpsQueueSeverity,
} from "@/lib/postgres-preview";

type EntityType = PostgresResearchOpsQueueItem["entity_type"];
type ResearchOpsRecord = PostgresResearchOpsQueueItem | PostgresResearchOpsRecentEdit;

type QueueFilter = "all" | ResearchOpsQueueKey;
type SeverityFilter = "all" | ResearchOpsQueueSeverity;
type EntityFilter = "all" | EntityType;
type BulkTarget = "records" | "sources";

const editorOnlyReviewStatuses = new Set(["approved", "export_ready", "archived"]);
const editorOnlySourceStatuses = new Set(["credible", "weak", "outdated", "rejected"]);

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
    return "Asset";
  }

  if (value === "project") {
    return "Project";
  }

  if (value === "company") {
    return "Company";
  }

  return "Source";
}

function severityClasses(severity: ResearchOpsQueueSeverity) {
  if (severity === "critical") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (severity === "important") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-blue-200 bg-blue-50 text-blue-800";
}

function recordKey(record: ResearchOpsRecord) {
  return `${record.entity_type}-${record.entity_id}`;
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

function recordHref(record: ResearchOpsRecord) {
  if (record.entity_type === "source") {
    return `/sources/${record.entity_id}`;
  }

  if (record.entity_type === "project") {
    return `/postgres-preview/projects/${record.entity_id}`;
  }

  if (record.entity_type === "operating_asset") {
    return `/postgres-preview/operating-assets/${record.entity_id}`;
  }

  if (record.entity_type === "company") {
    return `/postgres-preview/companies/${record.entity_id}`;
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

function StatTile({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note: string;
}) {
  return (
    <div className="border border-gray-200 bg-white px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-2 text-3xl font-bold leading-none text-[#1f2937]">
        {formatCount(value)}
      </div>
      <div className="mt-2 text-xs leading-5 text-gray-500">{note}</div>
    </div>
  );
}

function StatusBadge({ value }: { value: string | null }) {
  return (
    <span className="inline-flex h-7 items-center border border-gray-200 bg-[#f7f7f7] px-2 text-xs font-semibold text-gray-700">
      {value || "unknown"}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: ResearchOpsQueueSeverity }) {
  return (
    <span
      className={`inline-flex h-7 items-center border px-2 text-xs font-semibold capitalize ${severityClasses(
        severity
      )}`}
    >
      {severity}
    </span>
  );
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
      No matching records in this queue.
    </div>
  );
}

function EntityTable({
  items,
  selectedKey,
  selectedBulkKeys,
  onToggleBulk,
  onToggleVisible,
  onSelect,
}: {
  items: ResearchOpsRecord[];
  selectedKey: string | null;
  selectedBulkKeys: Set<string>;
  onToggleBulk: (record: ResearchOpsRecord, checked: boolean) => void;
  onToggleVisible: (records: ResearchOpsRecord[], checked: boolean) => void;
  onSelect: (record: ResearchOpsRecord) => void;
}) {
  if (items.length === 0) {
    return <EmptyQueue />;
  }

  const allSelected = items.every((item) => selectedBulkKeys.has(recordKey(item)));

  return (
    <div className="overflow-x-auto border-t border-gray-100">
      <table className="min-w-[1260px] table-fixed text-left text-sm">
        <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
          <tr>
            <th className="w-[4%] px-5 py-3 font-semibold">
              <input
                aria-label="Select visible records"
                checked={allSelected}
                className="h-4 w-4 accent-[#8dc63f]"
                type="checkbox"
                onChange={(event) => onToggleVisible(items, event.target.checked)}
              />
            </th>
            <th className="w-[9%] px-5 py-3 font-semibold">Type</th>
            <th className="w-[24%] px-5 py-3 font-semibold">Record</th>
            <th className="w-[12%] px-5 py-3 font-semibold">Country</th>
            <th className="w-[12%] px-5 py-3 font-semibold">Use / Type</th>
            <th className="w-[12%] px-5 py-3 font-semibold">Status</th>
            <th className="w-[11%] px-5 py-3 font-semibold">Review</th>
            <th className="w-[12%] px-5 py-3 font-semibold">Updated By</th>
            <th className="w-[10%] px-5 py-3 font-semibold">Updated</th>
            <th className="w-[12%] px-5 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item) => {
            const key = recordKey(item);
            const selected = key === selectedKey;
            const href = recordHref(item);
            const sourceHref = addSourceHref(item);

            return (
              <tr
                key={key}
                className={selected ? "align-top bg-[#f3f8ec]" : "align-top"}
              >
                <td className="px-5 py-4">
                  <input
                    aria-label={`Select ${item.name}`}
                    checked={selectedBulkKeys.has(key)}
                    className="h-4 w-4 accent-[#8dc63f]"
                    type="checkbox"
                    onChange={(event) => onToggleBulk(item, event.target.checked)}
                  />
                </td>
                <td className="px-5 py-4 text-gray-700">
                  {formatEntityType(item.entity_type)}
                </td>
                <td className="px-5 py-4">
                  <div className="font-semibold text-[#1f2937]">{item.name}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {item.legacy_id || "new-postgres-record"}
                  </div>
                  {"issue_label" in item ? (
                    <div className="mt-2 text-xs font-medium text-gray-600">
                      {item.issue_label}
                    </div>
                  ) : null}
                </td>
                <td className="px-5 py-4 text-gray-700">{item.country || "-"}</td>
                <td className="px-5 py-4 text-gray-700">
                  {item.primary_use_type_code || "-"}
                </td>
                <td className="px-5 py-4 text-gray-700">
                  {item.lifecycle_phase_code || "-"}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge value={item.review_status_code} />
                </td>
                <td className="px-5 py-4 text-gray-700">
                  {item.last_updated_by_name || "-"}
                </td>
                <td className="px-5 py-4 text-gray-700">
                  {formatDate(item.updated_at)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="inline-flex h-8 items-center border border-[#8dc63f] bg-white px-3 text-xs font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec]"
                      type="button"
                      onClick={() => onSelect(item)}
                    >
                      Review
                    </button>
                    {sourceHref ? (
                      <Link
                        className="inline-flex h-8 items-center border border-[#8dc63f] bg-white px-3 text-xs font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec]"
                        href={sourceHref}
                      >
                        Add Source
                      </Link>
                    ) : href ? (
                      <Link
                        className="inline-flex h-8 items-center border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
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
  );
}

function QueueCard({
  queue,
  selectedKey,
  selectedBulkKeys,
  onToggleBulk,
  onToggleVisible,
  onSelect,
}: {
  queue: PostgresResearchOpsQueue;
  selectedKey: string | null;
  selectedBulkKeys: Set<string>;
  onToggleBulk: (record: ResearchOpsRecord, checked: boolean) => void;
  onToggleVisible: (records: ResearchOpsRecord[], checked: boolean) => void;
  onSelect: (record: ResearchOpsRecord) => void;
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-[#1f2937]">{queue.title}</h2>
            <SeverityBadge severity={queue.severity} />
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            {queue.description}
          </p>
        </div>
        <div className="text-left md:text-right">
          <div className="text-2xl font-bold leading-none text-[#1f2937]">
            {formatCount(queue.items.length)}
          </div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            shown of {formatCount(queue.count)}
          </div>
        </div>
      </div>
      <EntityTable
        items={queue.items}
        onSelect={onSelect}
        onToggleBulk={onToggleBulk}
        onToggleVisible={onToggleVisible}
        selectedBulkKeys={selectedBulkKeys}
        selectedKey={selectedKey}
      />
    </section>
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
    setMessage("");

    const updatedKeys: string[] = [];
    const failures: string[] = [];

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
          throw new Error(json?.error || "Failed to update status.");
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
    }

    setSaving(false);
  }

  if (selectedRecords.length === 0) {
    return null;
  }

  return (
    <section className="border border-gray-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1f2937]">
            Bulk Review Actions
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Apply a workflow status to selected PostgreSQL staging rows. Sources
            use source credibility states; projects, plants/facilities, and
            companies use review states.
          </p>
        </div>
        <button
          className="h-9 border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
          type="button"
          onClick={onClearSelection}
        >
          Clear Selection
        </button>
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

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[220px_220px_minmax(0,1fr)]">
          <FilterSelect
            label="Apply To"
            value={activeTarget}
            onChange={(value) => setBulkTarget(value as BulkTarget)}
          >
            <option disabled={!hasRecords} value="records">
              Records ({formatCount(selectedRecords.filter((r) => r.entity_type !== "source").length)})
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

        <div className="flex flex-wrap items-center gap-3">
          <button
            className="h-10 border border-[#8dc63f] bg-[#8dc63f] px-5 text-sm font-semibold text-white hover:bg-[#78ad35] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving || !statusCode || targetRecords.length === 0}
            type="button"
            onClick={applyBulkStatus}
          >
            {saving
              ? "Applying..."
              : `Apply To ${formatCount(targetRecords.length)} ${
                  activeTarget === "sources" ? "Source" : "Record"
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
          <div className="flex flex-wrap gap-2">
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
        description="Move the selected staging record through the MVP review workflow directly from the Research Ops queue."
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
  issueStatuses,
}: {
  issues: PostgresResearchOpsIssue[];
  issueStatuses: PostgresResearchOpsIssueReferenceData["issueStatuses"];
}) {
  const router = useRouter();
  const [hiddenIssueIds, setHiddenIssueIds] = useState<Set<string>>(
    () => new Set()
  );
  const [savingIssueId, setSavingIssueId] = useState<string | null>(null);
  const [eventNote, setEventNote] = useState("");
  const [error, setError] = useState("");
  const visibleIssues = issues.filter(
    (issue) => !hiddenIssueIds.has(issue.research_ops_issue_id)
  );
  const statusOptions = issueStatuses.filter(
    (status) => status.is_active !== false
  );

  async function setIssueStatus(
    issue: PostgresResearchOpsIssue,
    issueStatusCode: string
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

  return (
    <section className="border border-gray-200 bg-white">
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

        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Resolution / Status Note
          <input
            className="mt-1 h-10 w-full border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-[#8dc63f]"
            placeholder="Optional note applied when changing an issue status"
            value={eventNote}
            onChange={(event) => setEventNote(event.target.value)}
          />
        </label>

        {visibleIssues.length === 0 ? (
          <div className="border border-gray-200 bg-[#f7f7f7] px-4 py-3 text-sm text-gray-600">
            No persistent research issues are currently open.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1180px] table-fixed text-left text-sm">
              <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="w-[13%] px-4 py-3 font-semibold">Issue</th>
                  <th className="w-[25%] px-4 py-3 font-semibold">Record</th>
                  <th className="w-[11%] px-4 py-3 font-semibold">Severity</th>
                  <th className="w-[11%] px-4 py-3 font-semibold">Status</th>
                  <th className="w-[13%] px-4 py-3 font-semibold">Assigned</th>
                  <th className="w-[10%] px-4 py-3 font-semibold">Updated</th>
                  <th className="w-[17%] px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleIssues.map((issue) => {
                  const href = issueHref(issue);
                  const saving = savingIssueId === issue.research_ops_issue_id;

                  return (
                    <tr key={issue.research_ops_issue_id} className="align-top">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#1f2937]">
                          {issue.issue_type_label}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {issue.linked_field || "record-level"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#1f2937]">
                          {issue.title}
                        </div>
                        <div className="mt-1 text-xs text-gray-600">
                          {issue.name}
                        </div>
                        {issue.description ? (
                          <div className="mt-2 text-xs leading-5 text-gray-500">
                            {issue.description}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <SeverityBadge severity={issue.severity} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge value={issue.issue_status_label} />
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {issue.assigned_to_name || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {formatDate(issue.updated_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
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
                            onClick={() => setIssueStatus(issue, "in_progress")}
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
          Latest PostgreSQL staging records by updated timestamp, including the
          researcher/editor field when user metadata exists.
        </p>
      </div>
      <EntityTable
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
  issueReferenceData,
}: {
  dashboard: PostgresResearchOpsDashboard;
  reviewStatuses: PostgresStatusOption[];
  sourceStatuses: PostgresStatusOption[];
  canReviewStatus: boolean;
  issueReferenceData: PostgresResearchOpsIssueReferenceData;
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

  function clearFilters() {
    setQueueFilter("all");
    setSeverityFilter("all");
    setEntityFilter("all");
    setCountryFilter("all");
    setSearch("");
    setShowEmptyQueues(false);
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

  function exportFilteredIssues() {
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
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatTile
          label="Open Issues"
          value={dashboard.totals.openIssues}
          note="Generated + persistent"
        />
        <StatTile
          label="Critical"
          value={dashboard.totals.criticalIssues}
          note="Blocking approval quality"
        />
        <StatTile
          label="Important"
          value={dashboard.totals.importantIssues}
          note="Research completeness"
        />
        <StatTile
          label="Workflow"
          value={dashboard.totals.workflowIssues}
          note="Approval and update state"
        />
        <StatTile
          label="Filtered Rows"
          value={filteredIssueRows}
          note="Visible issue rows"
        />
        <StatTile
          label="Persistent"
          value={dashboard.totals.persistentIssues}
          note="Human-created tasks"
        />
      </section>

      <section className="border border-gray-200 bg-white px-5 py-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Search
              <input
                className="h-10 min-w-0 border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-[#8dc63f]"
                placeholder="Name, country, issue, status, researcher"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
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
              <option value="operating_asset">Assets</option>
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
            <div className="flex flex-wrap gap-2">
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

            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex h-9 items-center gap-2 border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700">
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
                disabled={filteredIssueRows === 0}
                type="button"
                onClick={exportFilteredIssues}
              >
                Export Filtered CSV
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="border border-gray-200 bg-white px-5 py-4 text-sm leading-6 text-gray-600">
        <span className="font-semibold text-[#1f2937]">Current scope:</span>{" "}
        PostgreSQL staging queues now support quick review-status changes for
        projects, plants/facilities, companies, and source credibility records.
        This still does not import the live Hetzner SQLite database or replace
        the existing SQLite app workflows. Generated {formatDate(dashboard.generatedAt)}.
      </section>

      <SelectedRecordPanel
        record={selectedRecord}
        reviewStatuses={reviewStatuses}
        sourceStatuses={sourceStatuses}
        canReviewStatus={canReviewStatus}
        issueReferenceData={issueReferenceData}
        onClear={() => setSelectedRecord(null)}
        onStatusChanged={handleStatusChanged}
      />

      <PersistentIssues
        issues={dashboard.persistentIssues}
        issueStatuses={issueReferenceData.issueStatuses}
      />

      <BulkActionsPanel
        canReviewStatus={canReviewStatus}
        reviewStatuses={reviewStatuses}
        selectedRecords={selectedBulkRecords}
        sourceStatuses={sourceStatuses}
        onClearSelection={() => setSelectedBulkKeys(new Set())}
        onRecordsChanged={handleBulkStatusChanged}
      />

      <div className="space-y-5">
        {filteredQueues.map((queue) => (
          <QueueCard
            key={queue.key}
            queue={queue}
            onSelect={setSelectedRecord}
            onToggleBulk={toggleBulkRecord}
            onToggleVisible={toggleBulkRecords}
            selectedBulkKeys={selectedBulkKeys}
            selectedKey={selectedRecord ? recordKey(selectedRecord) : null}
          />
        ))}
      </div>

      <RecentEdits
        items={filteredRecentEdits}
        onSelect={setSelectedRecord}
        onToggleBulk={toggleBulkRecord}
        onToggleVisible={toggleBulkRecords}
        selectedBulkKeys={selectedBulkKeys}
        selectedKey={selectedRecord ? recordKey(selectedRecord) : null}
      />
    </>
  );
}
