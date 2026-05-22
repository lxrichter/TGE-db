"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type {
  PostgresResearchOpsIssue,
  PostgresResearchOpsIssueEntityType,
  PostgresResearchOpsIssueReferenceData,
} from "@/lib/postgres-preview";

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toISOString().slice(0, 10);
}

function severityClass(severity: string) {
  if (severity === "critical") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (severity === "workflow") {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }

  return "border-amber-200 bg-amber-50 text-amber-800";
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

async function readJson(res: Response) {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export default function PostgresResearchIssuesPanel({
  issues,
  entityType,
  entityId,
  issueReferenceData,
  canManageIssues,
}: {
  issues: PostgresResearchOpsIssue[];
  entityType: PostgresResearchOpsIssueEntityType;
  entityId: string;
  issueReferenceData: PostgresResearchOpsIssueReferenceData;
  canManageIssues: boolean;
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
  const assignableUsers = useMemo(
    () =>
      issueReferenceData.assignableUsers
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [issueReferenceData.assignableUsers]
  );
  const [showCreate, setShowCreate] = useState(false);
  const [issueTypeCode, setIssueTypeCode] = useState(issueTypes[0]?.code || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkedField, setLinkedField] = useState("");
  const [assignToSelf, setAssignToSelf] = useState(true);
  const [statusNote, setStatusNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingIssueId, setSavingIssueId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const criticalIssueCount = issues.filter(
    (issue) => issue.severity === "critical"
  ).length;
  const assignedIssueCount = issues.filter((issue) => issue.assigned_to_user_id)
    .length;
  const fieldLinkedIssueCount = issues.filter((issue) => issue.linked_field).length;

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
          entity_type: entityType,
          entity_id: entityId,
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
      setTitle("");
      setDescription("");
      setLinkedField("");
      setShowCreate(false);
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to create research issue."
      );
    } finally {
      setSaving(false);
    }
  }

  async function patchIssue({
    issueId,
    issueStatusCode,
    assignToSelf,
    assignToUserId,
  }: {
    issueId: string;
    issueStatusCode: string;
    assignToSelf?: boolean;
    assignToUserId?: string;
  }) {
    setSavingIssueId(issueId);
    setError("");
    setMessage("");

    try {
      const res = await fetch(
        `/api/postgres-preview/research-ops/issues/${issueId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            issue_status_code: issueStatusCode,
            event_note: statusNote,
            ...(assignToSelf ? { assign_to_self: true } : {}),
            ...(assignToUserId !== undefined
              ? { assign_to_user_id: assignToUserId }
              : {}),
          }),
        }
      );
      const json = await readJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to update research issue.");
      }

      setMessage(`Issue marked ${issueStatusCode}.`);
      setStatusNote("");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update research issue."
      );
    } finally {
      setSavingIssueId(null);
    }
  }

  async function setIssueStatus(
    issueId: string,
    issueStatusCode: string,
    assignToSelf = false
  ) {
    await patchIssue({ issueId, issueStatusCode, assignToSelf });
  }

  async function assignIssue(
    issue: PostgresResearchOpsIssue,
    assignToUserId: string
  ) {
    await patchIssue({
      issueId: issue.research_ops_issue_id,
      issueStatusCode: issue.issue_status_code,
      assignToUserId,
    });
  }

  const startsOpen = issues.length > 0 || showCreate || Boolean(error || message);

  return (
    <details className="border border-gray-200 bg-white" open={startsOpen}>
      <summary className="flex cursor-pointer list-none flex-col gap-3 px-5 py-4 marker:hidden md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1f2937]">
            Research Ops Issues
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Open persistent research issues linked to this PostgreSQL staging
            record. Generated missing-data queues remain visible in Research Ops.
          </p>
        </div>
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 md:w-auto md:flex md:flex-wrap md:justify-end">
          <span className="inline-flex h-9 items-center justify-center border border-gray-200 bg-[#f7f7f7] px-3 text-xs font-semibold text-gray-700">
            {issues.length} open issue{issues.length === 1 ? "" : "s"}
          </span>
          <span className="inline-flex h-9 items-center justify-center border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700">
            {startsOpen ? "Open" : "Expand"}
          </span>
        </div>
      </summary>

      <div className="space-y-5 border-t border-gray-200 px-5 py-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-gray-500">
            Persistent issues are human/team-created follow-ups. Generated queues
            remain managed from Research Ops.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            <Link
              className="inline-flex h-9 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
              href="/postgres-preview/research-ops"
            >
              Open Research Ops
            </Link>
            {canManageIssues ? (
              <button
                className="h-9 w-full border border-[#8dc63f] bg-white px-4 text-sm font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec] sm:w-auto"
                type="button"
                onClick={() => setShowCreate((current) => !current)}
              >
                {showCreate ? "Close" : "Add Issue"}
              </button>
            ) : null}
          </div>
        </div>
        {canManageIssues ? null : (
          <div className="border border-gray-200 bg-[#f7f7f7] px-4 py-3 text-sm text-gray-600">
            Issue creation requires editor/admin permissions.
          </div>
        )}

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

        {issues.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border border-gray-200 bg-[#fbfbfb] px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Open Issues
              </div>
              <div className="mt-1 text-2xl font-bold text-[#1f2937]">
                {issues.length}
              </div>
            </div>
            <div className="border border-red-100 bg-red-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-red-700">
                Critical
              </div>
              <div className="mt-1 text-2xl font-bold text-red-800">
                {criticalIssueCount}
              </div>
            </div>
            <div className="border border-blue-100 bg-blue-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                Field-Linked
              </div>
              <div className="mt-1 text-2xl font-bold text-blue-800">
                {fieldLinkedIssueCount}
              </div>
            </div>
            <div className="border border-[#d9eac2] bg-[#f5faee] px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#4f7f1f]">
                Assigned
              </div>
              <div className="mt-1 text-2xl font-bold text-[#3f6f19]">
                {assignedIssueCount}
              </div>
            </div>
          </div>
        ) : null}

        {showCreate && canManageIssues ? (
          <div className="space-y-4 border border-gray-200 bg-[#fbfbfb] px-4 py-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
              <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Issue Type
                <select
                  className="h-10 min-w-0 border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-[#8dc63f]"
                  value={issueTypeCode}
                  onChange={(event) => setIssueTypeCode(event.target.value)}
                >
                  {issueTypes.map((issueType) => (
                    <option key={issueType.code} value={issueType.code}>
                      {issueType.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Title
                <input
                  className="h-10 min-w-0 border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-[#8dc63f]"
                  placeholder="Short operational issue title"
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
                  placeholder="Optional, e.g. source, capacity, coordinates"
                  value={linkedField}
                  onChange={(event) => setLinkedField(event.target.value)}
                />
              </label>
              <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Note
                <input
                  className="h-10 min-w-0 border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-[#8dc63f]"
                  placeholder="Optional research context"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </label>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <label className="inline-flex h-9 items-center justify-center gap-2 border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 sm:justify-start">
                <input
                  checked={assignToSelf}
                  className="h-4 w-4 accent-[#8dc63f]"
                  type="checkbox"
                  onChange={(event) => setAssignToSelf(event.target.checked)}
                />
                Assign to me
              </label>
              <button
                className="h-10 w-full border border-[#8dc63f] bg-[#8dc63f] px-5 text-sm font-semibold text-white hover:bg-[#78ad35] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                disabled={saving || !issueTypeCode || !title.trim()}
                type="button"
                onClick={createIssue}
              >
                {saving ? "Creating..." : "Create Issue"}
              </button>
            </div>
          </div>
        ) : null}

        {canManageIssues && issues.length > 0 ? (
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Resolution / Status Note
            <input
              className="mt-1 h-10 w-full border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-gray-800 outline-none focus:border-[#8dc63f]"
              placeholder="Optional note used when resolving or dismissing an issue"
              value={statusNote}
              onChange={(event) => setStatusNote(event.target.value)}
            />
          </label>
        ) : null}

        {issues.length === 0 ? (
          <div className="border border-gray-200 bg-[#f7f7f7] px-4 py-3 text-sm text-gray-600">
            No open persistent research issues are linked to this record.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1080px] table-fixed text-left text-sm">
              <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="w-[15%] px-4 py-3 font-semibold">Type</th>
                  <th className="w-[29%] px-4 py-3 font-semibold">Issue</th>
                  <th className="w-[14%] px-4 py-3 font-semibold">Field</th>
                  <th className="w-[10%] px-4 py-3 font-semibold">Severity</th>
                  <th className="w-[12%] px-4 py-3 font-semibold">Assigned</th>
                  <th className="w-[10%] px-4 py-3 font-semibold">Updated</th>
                  <th className="w-[10%] px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {issues.map((issue) => {
                  const savingThis = savingIssueId === issue.research_ops_issue_id;

                  return (
                    <tr key={issue.research_ops_issue_id} className="align-top">
                      <td className="px-4 py-3 text-gray-700">
                        {issue.issue_type_label}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#1f2937]">
                          {issue.title}
                        </div>
                        {issue.description ? (
                          <div className="mt-1 text-xs leading-5 text-gray-500">
                            {issue.description}
                          </div>
                        ) : null}
                        <div className="mt-1 text-xs text-gray-500">
                          {issue.issue_status_label}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex min-h-7 items-center border border-gray-200 bg-[#f7f7f7] px-2 text-xs font-semibold text-gray-700">
                          {formatLinkedField(issue.linked_field)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex h-7 items-center border px-2 text-xs font-semibold capitalize ${severityClass(
                            issue.severity
                          )}`}
                        >
                          {issue.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {canManageIssues ? (
                          <select
                            className="h-8 w-full min-w-0 border border-gray-300 bg-white px-2 text-xs font-semibold text-gray-700 outline-none focus:border-[#8dc63f] disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={savingThis}
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
                        ) : (
                          issue.assigned_to_name || "-"
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {formatDate(issue.updated_at)}
                      </td>
                      <td className="px-4 py-3">
                        {canManageIssues ? (
                          <div className="grid grid-cols-1 gap-2">
                            <button
                              className="h-8 border border-blue-200 bg-white px-3 text-xs font-semibold text-blue-800 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={
                                savingThis ||
                                issue.issue_status_code === "in_progress"
                              }
                              type="button"
                              onClick={() =>
                                setIssueStatus(
                                  issue.research_ops_issue_id,
                                  "in_progress",
                                  true
                                )
                              }
                            >
                              {savingThis ? "Saving..." : "Start"}
                            </button>
                            <button
                              className="h-8 border border-[#8dc63f] bg-white px-3 text-xs font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec] disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={savingThis}
                              type="button"
                              onClick={() =>
                                setIssueStatus(
                                  issue.research_ops_issue_id,
                                  "resolved"
                                )
                              }
                            >
                              Resolve
                            </button>
                            <button
                              className="h-8 border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={savingThis}
                              type="button"
                              onClick={() =>
                                setIssueStatus(
                                  issue.research_ops_issue_id,
                                  "dismissed"
                                )
                              }
                            >
                              Dismiss
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">
                            Open in Research Ops
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </details>
  );
}
