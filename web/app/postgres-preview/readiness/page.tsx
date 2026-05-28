import Link from "next/link";
import type { ReactNode } from "react";
import {
  getPostgresReplacementReadiness,
  type PostgresReplacementReadiness,
  type PostgresReplacementReadinessEntity,
  type PostgresReplacementMigrationSummary,
} from "@/lib/postgres-preview";
import { formatCount } from "@/lib/format";
import { DetailPriorityMarker } from "@/components/postgres-preview/PostgresEntityDetail";
import { PostgresPreviewSetupNotice } from "@/components/postgres-preview/PostgresPreviewListTables";
import PostgresSectionJumpNav from "@/components/postgres-preview/PostgresSectionJumpNav";
import {
  postgresStatusBarClass,
  postgresStatusToneClass,
  type PostgresStatusTone,
} from "@/components/postgres-preview/PostgresStatusBadge";
import NextActionStrip from "@/components/ui/NextActionStrip";

export const dynamic = "force-dynamic";

type ReadinessData =
  | {
      ok: true;
      readiness: PostgresReplacementReadiness;
    }
  | {
      ok: false;
      error: string;
    };

async function getReadinessData(): Promise<ReadinessData> {
  try {
    const readiness = await getPostgresReplacementReadiness();

    return {
      ok: true,
      readiness,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function entityPath(entityType: PostgresReplacementReadinessEntity["entity_type"]) {
  if (entityType === "operating_assets") {
    return "/postgres-preview/operating-assets";
  }

  if (entityType === "companies") {
    return "/postgres-preview/companies";
  }

  return "/postgres-preview/projects";
}

function missingPath(
  entityType: PostgresReplacementReadinessEntity["entity_type"],
  missing: string
) {
  if (entityType === "companies" && missing === "company_link") {
    return `${entityPath(entityType)}?missing=activity_link`;
  }

  return `${entityPath(entityType)}?missing=${missing}`;
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function share(part: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return (part / total) * 100;
}

function formatDate(value: string | null | undefined) {
  if (!value || value.startsWith("1970-01-01")) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatFileSize(value: number) {
  if (!value) {
    return "-";
  }

  const mb = value / 1024 / 1024;

  return `${mb.toLocaleString("en-US", {
    maximumFractionDigits: 1,
  })} MB`;
}

const readinessClass = {
  panel:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]",
  hero:
    "border-l-4 border-l-[var(--tge-brand-green)] px-5 py-6 sm:px-8 sm:py-8",
  sectionHeader:
    "flex flex-col gap-4 border-b border-[var(--tge-governance-neutral-border)] px-5 py-4 lg:flex-row lg:items-end lg:justify-between",
  title: "text-[var(--tge-text-primary)]",
  body: "text-[var(--tge-text-secondary)]",
  muted: "text-[var(--tge-governance-muted-text)]",
  neutral: "text-[var(--tge-governance-neutral-text)]",
  kicker:
    "text-sm font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]",
  label:
    "text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]",
  smallLabel:
    "text-[10px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]",
  action:
    "inline-flex h-10 w-full items-center justify-center border border-[var(--tge-border-strong)] bg-[var(--tge-surface-card)] px-4 text-sm font-semibold text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)] sm:w-auto",
  warningPanel:
    "border border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] px-5 py-5",
  warningText: "text-[var(--tge-governance-attention-text)]",
  progressTrack:
    "h-1.5 overflow-hidden bg-[var(--tge-governance-neutral-bg)]",
  gateRow:
    "flex flex-col gap-3 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-4 py-3 md:flex-row md:items-center md:justify-between",
  details:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]",
  detailsBodyMobile:
    "divide-y divide-[var(--tge-governance-muted-border)] border-t border-[var(--tge-governance-neutral-border)] lg:hidden",
  detailsBodyDesktop:
    "hidden overflow-x-auto border-t border-[var(--tge-governance-neutral-border)] lg:block",
  neutralBadge:
    "border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] text-[var(--tge-governance-neutral-text)]",
  neutralBadgeSolid:
    "inline-flex min-h-8 items-center justify-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-neutral-text)]",
  tableHead:
    "bg-[var(--tge-governance-neutral-bg)] text-[11px] uppercase tracking-wide text-[var(--tge-governance-muted-text)]",
  tableDivider: "divide-y divide-[var(--tge-governance-muted-border)]",
  tableRow:
    "align-top transition-colors hover:bg-[var(--tge-governance-success-bg)]",
  tableCell: "px-5 py-4 text-[var(--tge-governance-neutral-text)]",
  tableLink:
    "font-semibold text-[var(--tge-text-primary)] hover:text-[var(--tge-brand-green-dark)] hover:underline",
  gapLink:
    "inline-flex h-7 items-center border border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] px-2 text-xs font-semibold text-[var(--tge-governance-attention-text)] hover:underline",
  inlineLink:
    "text-xs font-semibold text-[var(--tge-brand-green-dark)] hover:underline",
  criticalText: "text-[var(--tge-governance-danger-text)]",
};

function StatTile({
  label,
  value,
  note,
  tone = "neutral",
}: {
  label: string;
  value: string;
  note: string;
  tone?: "neutral" | "good" | "warning" | "critical";
}) {
  const toneClass = {
    neutral:
      "border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] text-[var(--tge-text-primary)]",
    good: postgresStatusToneClass("success"),
    warning: postgresStatusToneClass("attention"),
    critical: postgresStatusToneClass("danger"),
  }[tone];

  return (
    <div className={`border px-4 py-4 ${toneClass}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
        {label}
      </div>
      <div className="mt-2 text-xl font-bold leading-none sm:text-2xl">
        {value}
      </div>
      <div className="mt-2 text-xs leading-5 opacity-80">{note}</div>
    </div>
  );
}

function MigrationRehearsalPanel({
  migration,
}: {
  migration: PostgresReplacementMigrationSummary | null;
}) {
  if (!migration) {
    return (
      <section className={readinessClass.warningPanel}>
        <h2 className={`text-lg font-bold ${readinessClass.warningText}`}>
          Migration Rehearsal
        </h2>
        <p className={`mt-2 max-w-3xl text-sm leading-6 ${readinessClass.warningText}`}>
          No live SQLite migration rehearsal run is recorded in PostgreSQL yet.
          Before internal replacement, run a fresh backup import, transform, and
          validation pass.
        </p>
      </section>
    );
  }

  const validationReady =
    migration.validation_check_count > 0 &&
    migration.validation_fail_count === 0 &&
    migration.error_warning_count === 0;

  return (
    <section className={readinessClass.panel}>
      <div className={readinessClass.sectionHeader}>
        <div>
          <h2 className={`text-lg font-bold ${readinessClass.title}`}>
            Latest Migration Rehearsal
          </h2>
          <p className={`mt-1 text-sm leading-6 ${readinessClass.body}`}>
            Latest recorded live SQLite import, transform, and validation pass.
          </p>
        </div>
        <span
          className={`inline-flex h-7 items-center border px-2 text-xs font-semibold ${
            validationReady
              ? postgresStatusToneClass("success")
              : postgresStatusToneClass("attention")
          }`}
        >
          {validationReady ? "Validation clean" : "Needs cutover review"}
        </span>
      </div>
      <div className="grid gap-3 px-5 py-5 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className={readinessClass.label}>
            Run
          </div>
          <div className={`mt-1 font-semibold ${readinessClass.title}`}>
            {migration.run_label}
          </div>
          <div className={`mt-1 text-xs ${readinessClass.muted}`}>{migration.status}</div>
        </div>
        <div>
          <div className={readinessClass.label}>
            Source Backup
          </div>
          <div className={`mt-1 font-semibold ${readinessClass.title}`}>
            {migration.source_database_file_name || "not recorded"}
          </div>
          <div className={`mt-1 text-xs ${readinessClass.muted}`}>
            {formatFileSize(migration.source_database_size_bytes)}
          </div>
        </div>
        <div>
          <div className={readinessClass.label}>
            Validation
          </div>
          <div className={`mt-1 font-semibold ${readinessClass.title}`}>
            {formatCount(migration.validation_pass_count)} pass ·{" "}
            {formatCount(migration.validation_fail_count)} fail
          </div>
          <div className={`mt-1 text-xs ${readinessClass.muted}`}>
            {formatCount(migration.warning_count)} warning rows
          </div>
        </div>
        <div>
          <div className={readinessClass.label}>
            Completed
          </div>
          <div className={`mt-1 font-semibold ${readinessClass.title}`}>
            {formatDate(migration.validation_completed_at)}
          </div>
          <div className={`mt-1 text-xs ${readinessClass.muted}`}>
            Transform {formatDate(migration.transform_completed_at)}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProgressBar({ value }: { value: number }) {
  const bounded = Math.min(Math.max(value, 0), 100);
  const barClass = postgresStatusBarClass("success");

  return (
    <div className={readinessClass.progressTrack}>
      <div className={`h-full ${barClass}`} style={{ width: `${bounded}%` }} />
    </div>
  );
}

function GateRow({
  label,
  detail,
  status,
}: {
  label: string;
  detail: string;
  status: "ready" | "partial" | "blocked";
}) {
  const statusTones: Record<typeof status, PostgresStatusTone> = {
    ready: "success",
    partial: "attention",
    blocked: "danger",
  };
  const statusTone = statusTones[status];
  const statusClass = postgresStatusToneClass(statusTone);

  const statusLabel = {
    ready: "Ready",
    partial: "Partial",
    blocked: "Blocked",
  }[status];

  return (
    <div className={readinessClass.gateRow}>
      <div>
        <div className={`font-semibold ${readinessClass.title}`}>{label}</div>
        <div className={`mt-1 text-xs leading-5 ${readinessClass.muted}`}>{detail}</div>
      </div>
      <span
        className={`inline-flex h-7 shrink-0 items-center border px-2 text-xs font-semibold ${statusClass}`}
      >
        {statusLabel}
      </span>
    </div>
  );
}

function ReadinessMobileField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className={readinessClass.smallLabel}>
        {label}
      </div>
      <div className={`mt-1 min-w-0 text-sm ${readinessClass.neutral}`}>{children}</div>
    </div>
  );
}

function ReadinessTable({
  entities,
}: {
  entities: PostgresReplacementReadinessEntity[];
}) {
  const openIssueCount = entities.reduce(
    (sum, entity) => sum + entity.open_issue_count,
    0
  );
  const criticalIssueCount = entities.reduce(
    (sum, entity) => sum + entity.critical_issue_count,
    0
  );
  const sourceGapCount = entities.reduce(
    (sum, entity) => sum + entity.missing_source_count,
    0
  );
  const startsOpen = criticalIssueCount > 0;

  return (
    <details className={readinessClass.details} open={startsOpen}>
      <summary className="flex cursor-pointer list-none flex-col gap-3 px-5 py-4 marker:hidden md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className={`text-lg font-bold ${readinessClass.title}`}>
            Entity Readiness Signals
          </h2>
          <p className={`mt-1 text-sm leading-6 ${readinessClass.body}`}>
            Cutover worklist by entity family, with counts linking back to
            filtered staging pages.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap md:justify-end">
          <span
            className={`inline-flex min-h-8 items-center justify-center border px-3 text-xs font-semibold uppercase tracking-wide ${
              criticalIssueCount > 0
                ? postgresStatusToneClass("danger")
                : postgresStatusToneClass("success")
            }`}
          >
            {formatCount(criticalIssueCount)} critical
          </span>
          <span
            className={`inline-flex min-h-8 items-center justify-center border px-3 text-xs font-semibold uppercase tracking-wide ${
              openIssueCount > 0
                ? postgresStatusToneClass("attention")
                : readinessClass.neutralBadge
            }`}
          >
            {formatCount(openIssueCount)} open issues
          </span>
          <span
            className={`inline-flex min-h-8 items-center justify-center border px-3 text-xs font-semibold uppercase tracking-wide ${
              sourceGapCount > 0
                ? postgresStatusToneClass("attention")
                : readinessClass.neutralBadge
            }`}
          >
            {formatCount(sourceGapCount)} source gaps
          </span>
          <span className={readinessClass.neutralBadgeSolid}>
            {startsOpen ? "Open" : "Expand"}
          </span>
        </div>
      </summary>

      <div className={readinessClass.detailsBodyMobile}>
        {entities.map((entity) => {
          const coverage = share(
            entity.approved_or_export_ready_count,
            entity.record_count
          );
          const coreGaps =
            entity.missing_country_count +
            entity.missing_country_reference_count +
            entity.missing_use_or_status_count +
            entity.missing_capacity_count +
            entity.missing_coordinates_count;

          return (
            <article key={entity.entity_type} className="px-4 py-4 sm:px-5">
              <Link
                className={readinessClass.tableLink}
                href={entityPath(entity.entity_type)}
              >
                {entity.label}
              </Link>
              <div className={`mt-1 text-xs ${readinessClass.muted}`}>
                {formatCount(entity.record_count)} items · Updated{" "}
                {formatDate(entity.latest_update_at)}
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <ReadinessMobileField label="Readiness">
                  <div className={`flex items-center justify-between gap-3 text-xs ${readinessClass.neutral}`}>
                    <span>{formatPercent(coverage)}</span>
                    <span>
                      {formatCount(entity.approved_or_export_ready_count)} ready
                    </span>
                  </div>
                  <div className="mt-2">
                    <ProgressBar value={coverage} />
                  </div>
                  <div className={`mt-1 text-xs ${readinessClass.muted}`}>
                    {formatCount(entity.draft_or_validation_count)} draft /
                    validation
                  </div>
                </ReadinessMobileField>
                <ReadinessMobileField label="Source / Link Gaps">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      className={readinessClass.gapLink}
                      href={missingPath(entity.entity_type, "source")}
                    >
                      {formatCount(entity.missing_source_count)} source
                    </Link>
                    <Link
                      className={readinessClass.gapLink}
                      href={missingPath(entity.entity_type, "company_link")}
                    >
                      {formatCount(entity.missing_company_link_count)} links
                    </Link>
                  </div>
                </ReadinessMobileField>
                <ReadinessMobileField label="Core Gaps">
                  {formatCount(coreGaps)} total
                  <div className={`mt-1 text-xs leading-5 ${readinessClass.muted}`}>
                    {formatCount(entity.missing_country_count)} country ·{" "}
                    {formatCount(entity.missing_country_reference_count)} geo ref ·{" "}
                    {formatCount(entity.missing_use_or_status_count)} class ·{" "}
                    {formatCount(entity.missing_capacity_count)} capacity ·{" "}
                    {formatCount(entity.missing_coordinates_count)} coords
                  </div>
                </ReadinessMobileField>
                <ReadinessMobileField label="Issues">
                  {formatCount(entity.open_issue_count)} open
                  <div className={`mt-1 text-xs ${readinessClass.criticalText}`}>
                    {formatCount(entity.critical_issue_count)} critical
                  </div>
                </ReadinessMobileField>
              </div>
            </article>
          );
        })}
      </div>

      <div className={readinessClass.detailsBodyDesktop}>
        <table className="min-w-[920px] table-fixed text-left text-sm">
          <thead className={readinessClass.tableHead}>
            <tr>
              <th className="w-[22%] px-5 py-3 font-semibold">Area</th>
              <th className="w-[24%] px-5 py-3 font-semibold">Readiness</th>
              <th className="w-[26%] px-5 py-3 font-semibold">Gaps</th>
              <th className="w-[14%] px-5 py-3 font-semibold">Issues</th>
              <th className="w-[14%] px-5 py-3 font-semibold">Open</th>
            </tr>
          </thead>
          <tbody className={readinessClass.tableDivider}>
            {entities.map((entity) => {
              const coverage = share(
                entity.approved_or_export_ready_count,
                entity.record_count
              );
              const coreGaps =
                entity.missing_country_count +
                entity.missing_country_reference_count +
                entity.missing_use_or_status_count +
                entity.missing_capacity_count +
                entity.missing_coordinates_count;

              return (
                <tr
                  key={entity.entity_type}
                  className={readinessClass.tableRow}
                >
                  <td className="px-5 py-4">
                    <Link
                      className={readinessClass.tableLink}
                      href={entityPath(entity.entity_type)}
                    >
                      {entity.label}
                    </Link>
                    <div className={`mt-1 text-xs ${readinessClass.muted}`}>
                      {formatCount(entity.record_count)} items
                    </div>
                    <div className={`mt-1 text-xs ${readinessClass.muted}`}>
                      Updated {formatDate(entity.latest_update_at)}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className={`flex items-center justify-between gap-3 text-xs ${readinessClass.neutral}`}>
                      <span>{formatPercent(coverage)}</span>
                      <span>
                        {formatCount(entity.approved_or_export_ready_count)} ready
                      </span>
                    </div>
                    <div className="mt-2">
                      <ProgressBar value={coverage} />
                    </div>
                    <div className={`mt-1 text-xs ${readinessClass.muted}`}>
                      {formatCount(entity.draft_or_validation_count)} draft /
                      validation
                    </div>
                    <div className={`mt-1 text-xs ${readinessClass.muted}`}>
                      {formatCount(entity.needs_update_count)} need re-review
                    </div>
                  </td>
                  <td className={readinessClass.tableCell}>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        className={readinessClass.gapLink}
                        href={missingPath(entity.entity_type, "source")}
                      >
                        {formatCount(entity.missing_source_count)} source
                      </Link>
                      <Link
                        className={readinessClass.gapLink}
                        href={missingPath(entity.entity_type, "company_link")}
                      >
                        {formatCount(entity.missing_company_link_count)} links
                      </Link>
                    </div>
                    <div className={`mt-2 line-clamp-2 text-xs leading-5 ${readinessClass.muted}`}>
                      {formatCount(coreGaps)} core gaps:{" "}
                      {formatCount(entity.missing_country_count)} country ·{" "}
                      {formatCount(entity.missing_country_reference_count)} geo ref ·{" "}
                      {formatCount(entity.missing_use_or_status_count)} class ·{" "}
                      {formatCount(entity.missing_capacity_count)} capacity ·{" "}
                      {formatCount(entity.missing_coordinates_count)} coords
                    </div>
                  </td>
                  <td className={readinessClass.tableCell}>
                    <div>{formatCount(entity.open_issue_count)} open</div>
                    <div className={`mt-1 text-xs ${readinessClass.criticalText}`}>
                      {formatCount(entity.critical_issue_count)} critical
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      className={readinessClass.inlineLink}
                      href={entityPath(entity.entity_type)}
                    >
                      Worklist
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export default async function PostgresReadinessPage() {
  const data = await getReadinessData();
  const entities = data.ok ? data.readiness.entities : [];
  const totals = entities.reduce(
    (acc, entity) => ({
      records: acc.records + entity.record_count,
      approved:
        acc.approved + entity.approved_or_export_ready_count,
      sourceGaps: acc.sourceGaps + entity.missing_source_count,
      openIssues: acc.openIssues + entity.open_issue_count,
      criticalIssues: acc.criticalIssues + entity.critical_issue_count,
      needsUpdate: acc.needsUpdate + entity.needs_update_count,
      geographyReferenceGaps:
        acc.geographyReferenceGaps + entity.missing_country_reference_count,
    }),
    {
      records: 0,
      approved: 0,
      sourceGaps: 0,
      openIssues: 0,
      criticalIssues: 0,
      needsUpdate: 0,
      geographyReferenceGaps: 0,
    }
  );
  const reviewCoverage = share(totals.approved, totals.records);

  return (
    <main className="space-y-6 sm:space-y-8">
      <section className={readinessClass.panel}>
        <div className={readinessClass.hero}>
          <p className={readinessClass.kicker}>
            Cutover Governance
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className={`text-3xl font-bold tracking-tight sm:text-4xl ${readinessClass.title}`}>
                Replacement Readiness
              </h1>
              <p className={`mt-4 max-w-4xl text-sm leading-6 sm:text-base sm:leading-7 ${readinessClass.body}`}>
                Live operational signals for deciding when the PostgreSQL
                platform is ready to replace the current internal SQLite site.
                This is a cutover-planning view, not the final executive
                dashboard.
              </p>
            </div>
            <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap">
              <Link
                className={readinessClass.action}
                href="/postgres-preview"
              >
                Back to Command Center
              </Link>
              <Link
                className={readinessClass.action}
                href="/postgres-preview/research-ops"
              >
                Research Ops
              </Link>
            </div>
          </div>
        </div>
      </section>

      <NextActionStrip
        title="Primary Work Paths"
        description="Use these routes for the three main readiness workflows: blockers, migration gates, and command navigation."
        actions={[
          {
            label: "Blockers",
            title: "Open Research Ops",
            description: "Work through critical issues, export blockers, and human-created follow-ups.",
            href: "/postgres-preview/research-ops",
          },
          {
            label: "Gates",
            title: "Review migration gates",
            description: "Check import, transform, validation, and replacement readiness.",
            href: "#migration-gates",
          },
          {
            label: "Command",
            title: "Return to Command Center",
            description: "Route into staging modules and acceptance checks.",
            href: "/postgres-preview",
          },
        ]}
      />

      {!data.ok ? (
        <PostgresPreviewSetupNotice error={data.error} />
      ) : (
        <>
          <PostgresSectionJumpNav
            items={[
              {
                href: "#readiness-snapshot",
                label: "Snapshot",
                note: "Signals",
              },
              {
                href: "#migration-gates",
                label: "Gates",
                note: "Cutover",
              },
              {
                href: "#cutover-worklist",
                label: "Worklist",
                note: "Risks",
              },
            ]}
          />

          <section id="readiness-snapshot" className="space-y-4 scroll-mt-24">
            <DetailPriorityMarker
              label="Core"
              title="Readiness Snapshot"
              description="Coverage, gaps, issues, re-review load."
              tone="core"
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
              <StatTile
                label="Staged Items"
                note="Projects, plants, and companies"
                value={formatCount(totals.records)}
              />
              <StatTile
                label="Review Coverage"
                note="Approved or export-ready items"
                tone={reviewCoverage >= 70 ? "good" : "warning"}
                value={formatPercent(reviewCoverage)}
              />
              <StatTile
                label="Source Gaps"
                note="Items without confirmed evidence links"
                tone={totals.sourceGaps > 0 ? "warning" : "good"}
                value={formatCount(totals.sourceGaps)}
              />
              <StatTile
                label="Geo Ref Gaps"
                note="Country text present but not linked to canonical geography"
                tone={totals.geographyReferenceGaps > 0 ? "warning" : "good"}
                value={formatCount(totals.geographyReferenceGaps)}
              />
              <StatTile
                label="Open Issues"
                note="Persistent human-created Research Ops issues"
                tone={totals.openIssues > 0 ? "warning" : "good"}
                value={formatCount(totals.openIssues)}
              />
              <StatTile
                label="Critical Issues"
                note="Must be resolved or explicitly accepted before cutover"
                tone={totals.criticalIssues > 0 ? "critical" : "good"}
                value={formatCount(totals.criticalIssues)}
              />
              <StatTile
                label="Needs Update"
                note="Edited approved items requiring re-review"
                tone={totals.needsUpdate > 0 ? "warning" : "good"}
                value={formatCount(totals.needsUpdate)}
              />
            </div>
          </section>

          <section id="migration-gates" className="space-y-4 scroll-mt-24">
            <DetailPriorityMarker
              label="Workflow"
              title="Migration Gates"
              description="Rehearsal status and cutover gates."
              tone="workflow"
            />

            <MigrationRehearsalPanel
              migration={data.readiness.latestMigrationRun}
            />

            <div className="space-y-3">
              <GateRow
                detail="Core entity structure, forms, evidence links, review states, and Research Ops issues exist in staging."
                label="Controlled Internal Data Filling"
                status="partial"
              />
              <GateRow
                detail="Still needs final import, Hetzner deployment, backup/restore checks, access review, export parity, and hands-on workflow acceptance."
                label="Replace Current Internal Platform"
                status="partial"
              />
              <GateRow
                detail="AI suggestions, article fact training, semantic search, subscriber views, and reporting remain foundation-stage."
                label="Long-Term Intelligence Platform"
                status="partial"
              />
            </div>
          </section>

          <section id="cutover-worklist" className="space-y-4 scroll-mt-24">
            <DetailPriorityMarker
              label="Governance"
              title="Cutover Worklist"
              description="Entity-level risk and follow-up."
              tone="governance"
            />

            <ReadinessTable entities={entities} />
          </section>
        </>
      )}
    </main>
  );
}
