import Link from "next/link";
import type { ReactNode } from "react";
import type {
  PostgresAuditEvent,
  PostgresEntitySourceLink,
} from "@/lib/postgres-preview";
import { formatCount } from "@/lib/format";
import PostgresStatusBadge, {
  type PostgresStatusDomain,
} from "@/components/postgres-preview/PostgresStatusBadge";
import PostgresStatusLegend, {
  type PostgresStatusLegendGroupKey,
} from "@/components/postgres-preview/PostgresStatusLegend";
export { default as DetailPriorityMarker } from "@/components/postgres-preview/PostgresHierarchyMarker";

export type DetailField = {
  label: string;
  value: ReactNode;
};

export type DetailStat = {
  label: string;
  value: ReactNode;
  note: string;
};

export type DetailNavItem = {
  label: string;
  href: string;
  note?: string;
};

export type DetailWorkflowStep = {
  label: string;
  href: string;
  status: "complete" | "attention" | "blocked" | "neutral";
  note: string;
  meta?: string;
};

export type ExportReadinessIssue = {
  severity: "blocker" | "warning";
  label: string;
  detail: string;
};

type ReviewChangeRow = {
  key: string;
  fieldName: string;
  fieldLabel: string;
  previousValue: string;
  nextValue: string;
  eventLabel: string;
  actorLabel: string;
  createdAt: string;
  eventNote: string | null;
};

function EmptyValue() {
  return <span className="text-gray-400">-</span>;
}

function renderValue(value: ReactNode) {
  if (value === null || value === undefined || value === "") {
    return <EmptyValue />;
  }

  return value;
}

function formatAuditEventType(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatAuditDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatCompactAuditDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

function asAuditRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
}

function formatAuditValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (Array.isArray(value)) {
    return value.map(formatAuditValue).join(" -> ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function formatAuditFieldLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\bmwe\b/gi, "MWe")
    .replace(/\bmwth\b/gi, "MWth")
    .replace(/\bgwh(e|th|c)?\b/gi, (match) => match.toUpperCase())
    .replace(/\bcod\b/gi, "COD")
    .replace(/\bhq\b/gi, "HQ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function auditChangeSummary(event: PostgresAuditEvent) {
  const fields = asAuditRecord(event.changed_fields);

  if (!fields) {
    return event.event_note || "-";
  }

  if (typeof fields.field_name === "string") {
    return `${formatAuditFieldLabel(fields.field_name)}: ${formatAuditValue(
      fields.previous_value
    )} -> ${formatAuditValue(fields.next_value)}`;
  }

  if (Array.isArray(fields.review_status_code)) {
    return `Review Status: ${formatAuditValue(fields.review_status_code)}`;
  }

  const entries = Object.entries(fields).filter(
    ([, value]) => value !== null && value !== undefined && value !== ""
  );
  const visibleEntries = entries.slice(0, 3);

  if (visibleEntries.length === 0) {
    return event.event_note || "-";
  }

  const summary = visibleEntries
    .map(([key, value]) => `${formatAuditFieldLabel(key)}: ${formatAuditValue(value)}`)
    .join("; ");
  const remainingCount = entries.length - visibleEntries.length;

  return remainingCount > 0 ? `${summary}; +${remainingCount} more` : summary;
}

function getReviewChangeRows(events: PostgresAuditEvent[]): ReviewChangeRow[] {
  return events.flatMap((event) => {
    const fields = asAuditRecord(event.changed_fields);

    if (!fields) {
      return [];
    }

    const eventLabel = formatAuditEventType(event.event_type);
    const actorLabel = event.actor_name || event.actor_email || "System";

    if (typeof fields.field_name === "string") {
      return [
        {
          key: `${event.audit_event_id}-${fields.field_name}`,
          fieldName: fields.field_name,
          fieldLabel: formatAuditFieldLabel(fields.field_name),
          previousValue: formatAuditValue(fields.previous_value),
          nextValue: formatAuditValue(fields.next_value),
          eventLabel,
          actorLabel,
          createdAt: event.created_at,
          eventNote: event.event_note,
        },
      ];
    }

    return Object.entries(fields)
      .filter(([, value]) => Array.isArray(value) && value.length >= 2)
      .map(([fieldName, value]) => {
        const [previousValue, nextValue] = value as unknown[];

        return {
          key: `${event.audit_event_id}-${fieldName}`,
          fieldName,
          fieldLabel: formatAuditFieldLabel(fieldName),
          previousValue: formatAuditValue(previousValue),
          nextValue: formatAuditValue(nextValue),
          eventLabel,
          actorLabel,
          createdAt: event.created_at,
          eventNote: event.event_note,
        };
      });
  });
}

export function StatusBadge({
  value,
  domain,
  label,
}: {
  value: string | null;
  domain?: PostgresStatusDomain;
  label?: string;
}) {
  return <PostgresStatusBadge domain={domain} label={label} value={value} />;
}

export function PendingReviewChangesPanel({
  events,
  currentReviewStatus,
  id,
}: {
  events: PostgresAuditEvent[];
  currentReviewStatus: string;
  id?: string;
}) {
  const rows = getReviewChangeRows(events);
  const visibleRows = rows.slice(0, 12);
  const hiddenCount = rows.length - visibleRows.length;
  const needsReReview = currentReviewStatus === "needs_update";

  return (
    <details
      id={id}
      className={`border border-gray-200 bg-white ${id ? "scroll-mt-6" : ""}`}
      open={needsReReview}
    >
      <summary className="flex cursor-pointer list-none flex-col gap-3 border-b border-gray-200 px-5 py-4 marker:hidden md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1f2937]">
            Changed Fields For Review
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Compact view of governed field changes from form edits and audited
            AI-assisted applies. This is the reviewer-facing version of the
            audit trail.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <StatusBadge domain="review" value={currentReviewStatus} />
          <StatusBadge value={`${formatCount(rows.length)} field changes`} />
          <span className="inline-flex min-h-[28px] items-center border border-gray-200 bg-[#f7f7f7] px-2 text-xs font-semibold text-gray-700">
            {needsReReview ? "Open" : "Expand"}
          </span>
        </div>
      </summary>

      <div className="space-y-4 px-5 py-5">
        {needsReReview ? (
          <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            This record is marked <span className="font-semibold">needs_update</span>.
            Review the changed fields below before approving or marking it
            export-ready again.
          </div>
        ) : null}

        {rows.length === 0 ? (
          <div className="border border-dashed border-gray-300 bg-[#fbfbfb] px-4 py-5 text-sm leading-6 text-gray-600">
            No governed field changes have been recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[980px] table-fixed text-left text-sm">
              <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="w-[18%] px-4 py-3 font-semibold">Field</th>
                  <th className="w-[22%] px-4 py-3 font-semibold">Previous</th>
                  <th className="w-[22%] px-4 py-3 font-semibold">Current</th>
                  <th className="w-[16%] px-4 py-3 font-semibold">Source</th>
                  <th className="w-[12%] px-4 py-3 font-semibold">Actor</th>
                  <th className="w-[10%] px-4 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleRows.map((row) => (
                  <tr key={row.key} className="align-top">
                    <td className="px-4 py-3 font-semibold text-[#1f2937]">
                      {row.fieldLabel}
                    </td>
                    <td className="break-words px-4 py-3 text-gray-600">
                      {row.previousValue}
                    </td>
                    <td className="break-words px-4 py-3 font-medium text-[#1f2937]">
                      {row.nextValue}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {row.eventLabel}
                      {row.eventNote ? (
                        <div className="mt-1 line-clamp-2 text-xs text-gray-500">
                          {row.eventNote}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{row.actorLabel}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatCompactAuditDate(row.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hiddenCount > 0 ? (
              <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
                Showing 12 most recent field changes. The full audit trail below
                contains {formatCount(hiddenCount)} additional change
                {hiddenCount === 1 ? "" : "s"}.
              </div>
            ) : null}
          </div>
        )}
      </div>
    </details>
  );
}

export function AuditTrailPanel({
  events,
  id,
}: {
  events: PostgresAuditEvent[];
  id?: string;
}) {
  return (
    <details
      id={id}
      className={`border border-gray-200 bg-white ${id ? "scroll-mt-6" : ""}`}
    >
      <summary className="flex cursor-pointer list-none flex-col gap-3 border-b border-gray-200 px-5 py-4 marker:hidden md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1f2937]">
            Activity / Audit Trail
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Recent governed changes for this staging record, including review
            status changes and audited AI-assisted field applications.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <StatusBadge value={`${formatCount(events.length)} events`} />
          <span className="inline-flex min-h-[28px] items-center border border-gray-200 bg-[#f7f7f7] px-2 text-xs font-semibold text-gray-700">
            Expand
          </span>
        </div>
      </summary>

      {events.length === 0 ? (
        <div className="px-5 py-5">
          <div className="border border-dashed border-gray-300 bg-[#fbfbfb] px-4 py-5 text-sm leading-6 text-gray-600">
            No audit events recorded yet for this staging record.
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[980px] table-fixed text-left text-sm">
            <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
              <tr>
                <th className="w-[17%] px-4 py-3 font-semibold">Event</th>
                <th className="w-[16%] px-4 py-3 font-semibold">Actor</th>
                <th className="w-[19%] px-4 py-3 font-semibold">Review</th>
                <th className="w-[30%] px-4 py-3 font-semibold">Change</th>
                <th className="w-[18%] px-4 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map((event) => (
                <tr key={event.audit_event_id} className="align-top">
                  <td className="px-4 py-3 font-semibold text-[#1f2937]">
                    {formatAuditEventType(event.event_type)}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {event.actor_name || "System"}
                    {event.actor_email ? (
                      <div className="mt-1 text-xs text-gray-500">
                        {event.actor_email}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {event.previous_review_status_code ||
                    event.next_review_status_code ? (
                      <>
                        {event.previous_review_status_code || "-"} {"->"}{" "}
                        {event.next_review_status_code || "-"}
                      </>
                    ) : (
                      <EmptyValue />
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {auditChangeSummary(event)}
                    {event.event_note ? (
                      <div className="mt-2 line-clamp-2 text-xs text-gray-500">
                        {event.event_note}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatAuditDate(event.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </details>
  );
}

export function DetailFieldGrid({ fields }: { fields: DetailField[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {fields.map((field) => (
        <div key={field.label} className="border border-gray-200 bg-white px-4 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {field.label}
          </div>
          <div className="mt-2 text-sm leading-6 text-[#1f2937]">
            {renderValue(field.value)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatGrid({ stats }: { stats: DetailStat[] }) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat) => (
        <div key={stat.label} className="border border-gray-200 bg-white px-4 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {stat.label}
          </div>
          <div className="mt-2 text-2xl font-bold leading-none text-[#1f2937]">
            {renderValue(stat.value)}
          </div>
          <div className="mt-2 text-xs leading-5 text-gray-500">{stat.note}</div>
        </div>
      ))}
    </section>
  );
}

export function DetailAnchorNav({
  title = "Record Sections",
  items,
}: {
  title?: string;
  items: DetailNavItem[];
}) {
  return (
    <nav className="border border-gray-200 bg-white px-5 py-4" aria-label={title}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
            Navigation
          </div>
          <h2 className="mt-1 text-lg font-bold text-[#1f2937]">{title}</h2>
        </div>
        <div className="grid w-full max-w-5xl grid-cols-1 gap-2 sm:grid-cols-2 md:flex md:w-auto md:flex-wrap md:justify-end">
          {items.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className="inline-flex min-h-9 items-center justify-center border border-gray-200 bg-[#fbfbfb] px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:bg-[#f3f8ec] hover:text-[#4f7f1f]"
              title={item.note}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

function workflowStepTone(status: DetailWorkflowStep["status"]) {
  if (status === "complete") {
    return {
      badge: "border-[#b9d98b] bg-[#f1f8e8] text-[#3f6f19]",
      card: "hover:border-[#8dc63f]",
      label: "Complete",
    };
  }

  if (status === "blocked") {
    return {
      badge: "border-red-200 bg-red-50 text-red-700",
      card: "hover:border-red-300",
      label: "Blocked",
    };
  }

  if (status === "attention") {
    return {
      badge: "border-amber-200 bg-amber-50 text-amber-800",
      card: "hover:border-amber-300",
      label: "Needs Attention",
    };
  }

  return {
    badge: "border-gray-200 bg-[#f7f7f7] text-gray-700",
    card: "hover:border-gray-300",
    label: "Not Started",
  };
}

export function DetailWorkflowMap({
  title = "Record Workflow",
  description,
  steps,
}: {
  title?: string;
  description: string;
  steps: DetailWorkflowStep[];
}) {
  return (
    <section className="border border-gray-200 bg-white px-5 py-5">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
            Workflow
          </div>
          <h2 className="mt-1 text-lg font-bold text-[#1f2937]">{title}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-gray-600">
            {description}
          </p>
        </div>
        <StatusBadge value={`${formatCount(steps.length)} steps`} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {steps.map((step, index) => {
          const tone = workflowStepTone(step.status);

          return (
            <Link
              key={`${step.href}-${step.label}`}
              href={step.href}
              className={`block border border-gray-200 bg-[#fbfbfb] px-4 py-4 ${tone.card}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Step {index + 1}
                </div>
                <span
                  className={`inline-flex min-h-6 items-center border px-2 text-[11px] font-semibold ${tone.badge}`}
                >
                  {tone.label}
                </span>
              </div>
              <div className="mt-3 text-sm font-bold leading-5 text-[#1f2937]">
                {step.label}
              </div>
              <div className="mt-2 text-xs leading-5 text-gray-600">
                {step.note}
              </div>
              {step.meta ? (
                <div className="mt-3 border-t border-gray-200 pt-2 text-xs font-semibold text-gray-500">
                  {step.meta}
                </div>
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function EvidenceWorkflowContext({
  sourceEvidenceHref,
  tgeNewsHref,
  aiSuggestionsHref,
}: {
  sourceEvidenceHref: string;
  tgeNewsHref: string;
  aiSuggestionsHref: string;
}) {
  const cards = [
    {
      label: "Source Evidence",
      href: sourceEvidenceHref,
      badge: "Authoritative",
      note:
        "Governed source links used for validation and export-readiness.",
    },
    {
      label: "Related TGE News",
      href: tgeNewsHref,
      badge: "Article View",
      note:
        "Confirmed ThinkGeoEnergy article links for context and related news.",
    },
    {
      label: "AI Suggestions",
      href: aiSuggestionsHref,
      badge: "Candidate Layer",
      note:
        "Human-reviewed candidates; applying is the separate audited write.",
    },
  ];

  return (
    <section className="border border-gray-200 bg-white px-5 py-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
            Evidence Layers
          </div>
          <h2 className="mt-1 text-base font-bold text-[#1f2937]">
            Source Evidence, Related News, And AI Review Stay Separate
          </h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-gray-600">
            Use this as orientation: evidence proves the record, news gives
            context, and AI suggestions remain candidates until reviewed and
            applied.
          </p>
        </div>
        <StatusBadge value="orientation" />
      </div>
      <div className="mt-3 grid gap-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            className="block border border-gray-200 bg-[#fbfbfb] px-3 py-3 hover:border-[#8dc63f] hover:bg-[#f5faef]"
            href={card.href}
            key={card.label}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="text-sm font-bold text-[#1f2937]">{card.label}</div>
              <span className="inline-flex min-h-6 items-center border border-gray-200 bg-white px-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                {card.badge}
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-gray-600">{card.note}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function DetailSection({
  title,
  children,
  id,
}: {
  title: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`border border-gray-200 bg-white ${id ? "scroll-mt-6" : ""}`}
    >
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-bold text-[#1f2937]">{title}</h2>
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

function issueTone(severity: ExportReadinessIssue["severity"]) {
  if (severity === "blocker") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-800";
}

export function ExportReadinessPanel({
  issues,
  sourceCount,
  credibleSourceCount,
  id,
}: {
  issues: ExportReadinessIssue[];
  sourceCount: number;
  credibleSourceCount: number;
  id?: string;
}) {
  const blockers = issues.filter((issue) => issue.severity === "blocker");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  const ready = blockers.length === 0;

  return (
    <section
      id={id}
      className={`border border-gray-200 bg-white ${id ? "scroll-mt-6" : ""}`}
    >
      <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1f2937]">Export Readiness</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Preview-only readiness check for PostgreSQL staging records. This
            does not yet enforce production exports.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <StatusBadge value={ready ? "ready" : "not_ready"} />
          <StatusBadge value={`${credibleSourceCount}/${sourceCount} credible sources`} />
        </div>
      </div>
      <div className="space-y-4 px-5 py-5">
        {ready && warnings.length === 0 ? (
          <div className="border border-[#b9d98b] bg-[#f1f8e8] px-4 py-3 text-sm font-medium text-[#3f6f19]">
            No export-readiness blockers or warnings detected for this staging
            record.
          </div>
        ) : null}

        {issues.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {issues.map((issue) => (
              <div
                key={`${issue.severity}-${issue.label}`}
                className={`border px-4 py-3 ${issueTone(issue.severity)}`}
              >
                <div className="text-xs font-semibold uppercase tracking-wide">
                  {issue.severity}
                </div>
                <div className="mt-1 text-sm font-bold">{issue.label}</div>
                <div className="mt-1 text-xs leading-5">{issue.detail}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function formatSourceLinkCode(value: string | null) {
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

export function SourceEvidenceTable({
  sources,
  entityType,
  entityId,
}: {
  sources: PostgresEntitySourceLink[];
  entityType: string;
  entityId: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="max-w-3xl text-sm leading-6 text-gray-600">
          Source/evidence links for this PostgreSQL staging record.
        </p>
        <Link
          href={`/sources/new?entityType=${entityType}&entityId=${entityId}`}
          className="inline-flex h-9 w-full items-center justify-center border border-[#8dc63f] bg-white px-4 text-sm font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec] md:w-auto"
        >
          Add Source
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1280px] table-fixed text-left text-sm">
          <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-[26%] px-4 py-3 font-semibold">Source</th>
              <th className="w-[14%] px-4 py-3 font-semibold">Type</th>
              <th className="w-[13%] px-4 py-3 font-semibold">Credibility</th>
              <th className="w-[13%] px-4 py-3 font-semibold">Fact Type</th>
              <th className="w-[12%] px-4 py-3 font-semibold">Field</th>
              <th className="w-[12%] px-4 py-3 font-semibold">Value</th>
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
                  <StatusBadge
                    domain="source"
                    value={source.credibility_status_code}
                  />
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {formatSourceLinkCode(source.evidence_type)}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {formatSourceLinkCode(source.linked_field)}
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
                    className="inline-flex h-8 items-center justify-center border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}

            {sources.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
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

function formatSourceDate(value: string | null) {
  if (!value) {
    return "No publication date";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function RelatedTgeNewsPanel({
  sources,
  entityType,
  entityId,
  id,
}: {
  sources: PostgresEntitySourceLink[];
  entityType: string;
  entityId: string;
  id?: string;
}) {
  const articles = sources
    .filter((source) => source.source_type_code === "tge_article")
    .slice()
    .sort((a, b) => {
      const aDate = a.source_published_date || a.updated_at;
      const bDate = b.source_published_date || b.updated_at;
      return bDate.localeCompare(aDate);
    });

  return (
    <section
      id={id}
      className={`border border-gray-200 bg-white ${id ? "scroll-mt-6" : ""}`}
    >
      <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1f2937]">
            Related TGE News / Evidence
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Article-focused view of confirmed ThinkGeoEnergy source links for
            this record. These links are still governed evidence records; the
            full source table below remains the authoritative evidence workspace
            for all source types.
          </p>
        </div>
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto lg:flex lg:flex-wrap">
          <StatusBadge value="TGE article view" />
          <StatusBadge value={`${formatCount(articles.length)} article links`} />
          <Link
            href="/sources/matches"
            className="inline-flex h-9 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
          >
            Review Matches
          </Link>
          <Link
            href={`/sources/new?entityType=${entityType}&entityId=${entityId}`}
            className="inline-flex h-9 items-center justify-center border border-[#8dc63f] bg-white px-4 text-sm font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec]"
          >
            Add Source
          </Link>
        </div>
      </div>

      <div className="px-5 py-5">
        {articles.length === 0 ? (
          <div className="border border-dashed border-gray-300 bg-[#fbfbfb] px-4 py-5 text-sm leading-6 text-gray-600">
            No confirmed ThinkGeoEnergy article links yet. Use the source
            evidence tools or confirm article match candidates to connect
            related news to this record.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {articles.map((article) => (
              <div
                key={article.entity_source_id}
                className="border border-gray-200 bg-[#fbfbfb] px-4 py-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <Link
                      href={`/sources/${article.source_id}`}
                      className="block font-semibold leading-6 text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                    >
                      {article.source_title ||
                        article.source_reference ||
                        "Untitled TGE article"}
                    </Link>
                    <div className="mt-2 text-xs leading-5 text-gray-500">
                      {formatSourceDate(article.source_published_date)}
                      {article.source_reference ? ` - ${article.source_reference}` : ""}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <StatusBadge
                      domain="source"
                      value={article.credibility_status_code}
                    />
                    <StatusBadge
                      domain="confidence"
                      value={article.confidence_status_code}
                    />
                  </div>
                </div>

                {article.claim_text ||
                article.extracted_value ||
                article.linked_field ||
                article.evidence_type ? (
                  <div className="mt-3 border-t border-gray-200 pt-3 text-xs leading-5 text-gray-600">
                    {article.evidence_type ? (
                      <div>
                        <span className="font-semibold text-gray-700">
                          Fact type:
                        </span>{" "}
                        {formatSourceLinkCode(article.evidence_type)}
                      </div>
                    ) : null}
                    {article.linked_field ? (
                      <div>
                        <span className="font-semibold text-gray-700">Field:</span>{" "}
                        {formatSourceLinkCode(article.linked_field)}
                      </div>
                    ) : null}
                    {article.extracted_value ? (
                      <div>
                        <span className="font-semibold text-gray-700">Value:</span>{" "}
                        {article.extracted_value}
                      </div>
                    ) : null}
                    {article.claim_text ? (
                      <div className="mt-1 line-clamp-2">{article.claim_text}</div>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-3 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                  {article.source_url ? (
                    <Link
                      href={article.source_url}
                      target="_blank"
                      className="inline-flex h-8 items-center justify-center border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                    >
                      Open Article
                    </Link>
                  ) : null}
                  <Link
                    href={`/sources/${article.source_id}`}
                    className="inline-flex h-8 items-center justify-center border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                  >
                    Source Record
                  </Link>
                  {article.is_primary_evidence ? (
                    <span className="inline-flex h-8 items-center justify-center border border-[#b9d98b] bg-[#f1f8e8] px-3 text-xs font-semibold text-[#3f6f19]">
                      Primary Evidence
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function DetailShell({
  eyebrow,
  title,
  subtitle,
  backHref,
  backLabel,
  badges,
  stats,
  statusLegendGroups = ["review", "lifecycle", "severity"],
  statusLegendTitle = "Record Status Meaning",
  statusLegendDescription = "Detail pages use the same badge language as Research Ops and the table views.",
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  backHref: string;
  backLabel: string;
  badges: ReactNode;
  stats: DetailStat[];
  statusLegendGroups?: PostgresStatusLegendGroupKey[];
  statusLegendTitle?: string;
  statusLegendDescription?: string;
  children: ReactNode;
}) {
  return (
    <main className="space-y-6 sm:space-y-8">
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-5 py-6 sm:px-8 sm:py-8">
          <Link
            href={backHref}
            className="text-sm font-semibold text-[#4f7f1f] hover:underline"
          >
            {backLabel}
          </Link>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
                {eyebrow}
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#1f2937] sm:text-4xl">
                {title}
              </h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-gray-600 sm:mt-4 sm:text-base sm:leading-7">
                {subtitle}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
              {badges}
            </div>
          </div>
        </div>
      </section>

      <StatGrid stats={stats} />
      <PostgresStatusLegend
        compact
        description={statusLegendDescription}
        groups={statusLegendGroups}
        title={statusLegendTitle}
      />
      {children}
    </main>
  );
}

export function NotFoundNotice({
  label,
  backHref,
}: {
  label: string;
  backHref: string;
}) {
  return (
    <main className="space-y-6">
      <section className="border border-gray-200 bg-white p-8">
        <p className="text-base text-gray-700">{label} not found.</p>
        <Link
          href={backHref}
          className="mt-4 inline-block text-sm font-semibold text-[#4f7f1f]"
        >
          Back to PostgreSQL Preview
        </Link>
      </section>
    </main>
  );
}

export function formatOptionalCount(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }

  return formatCount(value);
}
