"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { formatCount } from "@/lib/format";
import {
  type PostgresResearchOpsDashboard,
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

  return "Company";
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
  onSelect,
}: {
  items: ResearchOpsRecord[];
  selectedKey: string | null;
  onSelect: (record: ResearchOpsRecord) => void;
}) {
  if (items.length === 0) {
    return <EmptyQueue />;
  }

  return (
    <div className="overflow-x-auto border-t border-gray-100">
      <table className="min-w-[1180px] table-fixed text-left text-sm">
        <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
          <tr>
            <th className="w-[10%] px-5 py-3 font-semibold">Type</th>
            <th className="w-[25%] px-5 py-3 font-semibold">Record</th>
            <th className="w-[12%] px-5 py-3 font-semibold">Country</th>
            <th className="w-[12%] px-5 py-3 font-semibold">Use / Type</th>
            <th className="w-[12%] px-5 py-3 font-semibold">Status</th>
            <th className="w-[11%] px-5 py-3 font-semibold">Review</th>
            <th className="w-[12%] px-5 py-3 font-semibold">Updated By</th>
            <th className="w-[10%] px-5 py-3 font-semibold">Updated</th>
            <th className="w-[8%] px-5 py-3 font-semibold">Open</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item) => {
            const key = recordKey(item);
            const selected = key === selectedKey;

            return (
              <tr
                key={key}
                className={selected ? "align-top bg-[#f3f8ec]" : "align-top"}
              >
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
                  <button
                    className="h-8 border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                    type="button"
                    onClick={() => onSelect(item)}
                  >
                    View
                  </button>
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
  onSelect,
}: {
  queue: PostgresResearchOpsQueue;
  selectedKey: string | null;
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
        selectedKey={selectedKey}
      />
    </section>
  );
}

function SelectedRecordPanel({
  record,
  onClear,
}: {
  record: ResearchOpsRecord | null;
  onClear: () => void;
}) {
  if (!record) {
    return null;
  }

  return (
    <section className="border border-[#8dc63f] bg-[#f8fbf4] px-5 py-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-[#4f7f1f]">
            Selected Record
          </div>
          <h2 className="mt-2 text-xl font-bold text-[#1f2937]">{record.name}</h2>
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
        <button
          className="h-9 border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
          type="button"
          onClick={onClear}
        >
          Clear
        </button>
      </div>
    </section>
  );
}

function RecentEdits({
  items,
  selectedKey,
  onSelect,
}: {
  items: PostgresResearchOpsRecentEdit[];
  selectedKey: string | null;
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
      <EntityTable items={items} onSelect={onSelect} selectedKey={selectedKey} />
    </section>
  );
}

export function ResearchOpsDashboardClient({
  dashboard,
}: {
  dashboard: PostgresResearchOpsDashboard;
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

  function clearFilters() {
    setQueueFilter("all");
    setSeverityFilter("all");
    setEntityFilter("all");
    setCountryFilter("all");
    setSearch("");
    setShowEmptyQueues(false);
  }

  return (
    <>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile
          label="Open Issues"
          value={dashboard.totals.openIssues}
          note="All queue matches"
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
            </div>
          </div>
        </div>
      </section>

      <section className="border border-gray-200 bg-white px-5 py-4 text-sm leading-6 text-gray-600">
        <span className="font-semibold text-[#1f2937]">Current scope:</span>{" "}
        this is a staging preview only. It does not alter records, does not import
        the live Hetzner SQLite database, and does not replace the existing SQLite
        app workflows yet. Generated {formatDate(dashboard.generatedAt)}.
      </section>

      <SelectedRecordPanel
        record={selectedRecord}
        onClear={() => setSelectedRecord(null)}
      />

      <div className="space-y-5">
        {filteredQueues.map((queue) => (
          <QueueCard
            key={queue.key}
            queue={queue}
            onSelect={setSelectedRecord}
            selectedKey={selectedRecord ? recordKey(selectedRecord) : null}
          />
        ))}
      </div>

      <RecentEdits
        items={filteredRecentEdits}
        onSelect={setSelectedRecord}
        selectedKey={selectedRecord ? recordKey(selectedRecord) : null}
      />
    </>
  );
}
