"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type {
  PostgresResearchOpsIssue,
  PostgresResearchOpsIssueEntityType,
  PostgresResearchOpsIssueReferenceData,
} from "@/lib/postgres-preview";
import {
  postgresStatusTone,
  postgresStatusToneClass,
} from "@/components/postgres-preview/PostgresStatusBadge";

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toISOString().slice(0, 10);
}

function severityClass(severity: string) {
  return postgresStatusToneClass(postgresStatusTone(severity, "severity"));
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
    <details
      className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]"
      open={startsOpen}
    >
      <summary className="flex cursor-pointer list-none flex-col gap-3 px-5 py-4 marker:hidden md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--tge-text-primary)]">
            Research Ops Issues
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--tge-text-secondary)]">
            Open persistent research issues linked to this entity. Generated
            missing-data queues remain visible in Research Ops.
          </p>
        </div>
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 md:w-auto md:flex md:flex-wrap md:justify-end">
          <span className="inline-flex h-9 items-center justify-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] px-3 text-xs font-semibold text-[var(--tge-governance-neutral-text)]">
            {issues.length} open issue{issues.length === 1 ? "" : "s"}
          </span>
          <span className="inline-flex h-9 items-center justify-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 text-xs font-semibold text-[var(--tge-governance-neutral-text)]">
            {startsOpen ? "Open" : "Expand"}
          </span>
        </div>
      </summary>

      <div className="space-y-5 border-t border-[var(--tge-governance-neutral-border)] px-5 py-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-[var(--tge-governance-muted-text)]">
            Persistent issues are human/team-created follow-ups. Generated queues
            remain managed from Research Ops.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            <Link
              className="inline-flex h-9 items-center justify-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-4 text-sm font-semibold text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)]"
              href="/postgres-preview/research-ops"
            >
              Open Research Ops
            </Link>
            {canManageIssues ? (
              <button
                className="h-9 w-full border border-[var(--tge-brand-green)] bg-[var(--tge-surface-card)] px-4 text-sm font-semibold text-[var(--tge-brand-green-dark)] hover:bg-[var(--tge-governance-success-bg)] sm:w-auto"
                type="button"
                onClick={() => setShowCreate((current) => !current)}
              >
                {showCreate ? "Close" : "Add Issue"}
              </button>
            ) : null}
          </div>
        </div>
        {canManageIssues ? null : (
          <div className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] px-4 py-3 text-sm text-[var(--tge-text-secondary)]">
            Issue creation requires editor/admin permissions.
          </div>
        )}

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

        {issues.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
                Open Issues
              </div>
              <div className="mt-1 text-2xl font-bold text-[var(--tge-text-primary)]">
                {issues.length}
              </div>
            </div>
            <div className="border border-[var(--tge-governance-danger-border)] bg-[var(--tge-governance-danger-bg)] px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-danger-text)]">
                Critical
              </div>
              <div className="mt-1 text-2xl font-bold text-[var(--tge-governance-danger-text)]">
                {criticalIssueCount}
              </div>
            </div>
            <div className="border border-[var(--tge-governance-info-border)] bg-[var(--tge-governance-info-bg)] px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-info-text)]">
                Field-Linked
              </div>
              <div className="mt-1 text-2xl font-bold text-[var(--tge-governance-info-text)]">
                {fieldLinkedIssueCount}
              </div>
            </div>
            <div className="border border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-success-text)]">
                Assigned
              </div>
              <div className="mt-1 text-2xl font-bold text-[var(--tge-governance-success-text)]">
                {assignedIssueCount}
              </div>
            </div>
          </div>
        ) : null}

        {showCreate && canManageIssues ? (
          <div className="space-y-4 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-4 py-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
              <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
                Issue Type
                <select
                  className="h-10 min-w-0 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 text-sm font-medium normal-case tracking-normal text-[var(--tge-text-primary)] outline-none focus:border-[var(--tge-brand-green)]"
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
              <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
                Title
                <input
                  className="h-10 min-w-0 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 text-sm font-medium normal-case tracking-normal text-[var(--tge-text-primary)] outline-none focus:border-[var(--tge-brand-green)]"
                  placeholder="Short operational issue title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
              <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
                Linked Field
                <input
                  className="h-10 min-w-0 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 text-sm font-medium normal-case tracking-normal text-[var(--tge-text-primary)] outline-none focus:border-[var(--tge-brand-green)]"
                  placeholder="Optional, e.g. source, capacity, coordinates"
                  value={linkedField}
                  onChange={(event) => setLinkedField(event.target.value)}
                />
              </label>
              <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
                Note
                <input
                  className="h-10 min-w-0 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 text-sm font-medium normal-case tracking-normal text-[var(--tge-text-primary)] outline-none focus:border-[var(--tge-brand-green)]"
                  placeholder="Optional research context"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </label>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <label className="inline-flex h-9 items-center justify-center gap-2 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 text-xs font-semibold text-[var(--tge-governance-neutral-text)] sm:justify-start">
                <input
                  checked={assignToSelf}
                  className="h-4 w-4 accent-[var(--tge-brand-green)]"
                  type="checkbox"
                  onChange={(event) => setAssignToSelf(event.target.checked)}
                />
                Assign to me
              </label>
              <button
                className="h-10 w-full border border-[var(--tge-brand-green)] bg-[var(--tge-brand-green)] px-5 text-sm font-semibold text-[var(--tge-surface-card)] hover:bg-[var(--tge-brand-green-dark)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
            Resolution / Status Note
            <input
              className="mt-1 h-10 w-full border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 text-sm font-medium normal-case tracking-normal text-[var(--tge-text-primary)] outline-none focus:border-[var(--tge-brand-green)]"
              placeholder="Optional note used when resolving or dismissing an issue"
              value={statusNote}
              onChange={(event) => setStatusNote(event.target.value)}
            />
          </label>
        ) : null}

        {issues.length === 0 ? (
          <div className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] px-4 py-3 text-sm text-[var(--tge-text-secondary)]">
            No open persistent research issues are linked to this record.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1080px] table-fixed text-left text-sm">
              <thead className="bg-[var(--tge-governance-neutral-bg)] text-[11px] uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
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
              <tbody className="divide-y divide-[var(--tge-governance-muted-border)]">
                {issues.map((issue) => {
                  const savingThis = savingIssueId === issue.research_ops_issue_id;

                  return (
                    <tr
                      key={issue.research_ops_issue_id}
                      className="align-top hover:bg-[var(--tge-surface-subtle)]"
                    >
                      <td className="px-4 py-3 text-[var(--tge-governance-neutral-text)]">
                        {issue.issue_type_label}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[var(--tge-text-primary)]">
                          {issue.title}
                        </div>
                        {issue.description ? (
                          <div className="mt-1 text-xs leading-5 text-[var(--tge-governance-muted-text)]">
                            {issue.description}
                          </div>
                        ) : null}
                        <div className="mt-1 text-xs text-[var(--tge-governance-muted-text)]">
                          {issue.issue_status_label}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex min-h-7 items-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] px-2 text-xs font-semibold text-[var(--tge-governance-neutral-text)]">
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
                      <td className="px-4 py-3 text-[var(--tge-governance-neutral-text)]">
                        {canManageIssues ? (
                          <select
                            className="h-8 w-full min-w-0 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-2 text-xs font-semibold text-[var(--tge-governance-neutral-text)] outline-none focus:border-[var(--tge-brand-green)] disabled:cursor-not-allowed disabled:opacity-60"
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
                      <td className="px-4 py-3 text-[var(--tge-governance-neutral-text)]">
                        {formatDate(issue.updated_at)}
                      </td>
                      <td className="px-4 py-3">
                        {canManageIssues ? (
                          <div className="grid grid-cols-1 gap-2">
                            <button
                              className="h-8 border border-[var(--tge-governance-info-border)] bg-[var(--tge-surface-card)] px-3 text-xs font-semibold text-[var(--tge-governance-info-text)] hover:bg-[var(--tge-governance-info-bg)] disabled:cursor-not-allowed disabled:opacity-60"
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
                              className="h-8 border border-[var(--tge-brand-green)] bg-[var(--tge-surface-card)] px-3 text-xs font-semibold text-[var(--tge-brand-green-dark)] hover:bg-[var(--tge-governance-success-bg)] disabled:cursor-not-allowed disabled:opacity-60"
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
                              className="h-8 border border-[var(--tge-governance-danger-border)] bg-[var(--tge-surface-card)] px-3 text-xs font-semibold text-[var(--tge-governance-danger-text)] hover:bg-[var(--tge-governance-danger-bg)] disabled:cursor-not-allowed disabled:opacity-60"
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
                          <span className="text-xs text-[var(--tge-governance-muted-text)]">
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
