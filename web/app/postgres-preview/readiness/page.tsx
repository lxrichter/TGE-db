import Link from "next/link";
import {
  getPostgresReplacementReadiness,
  type PostgresReplacementReadiness,
  type PostgresReplacementReadinessEntity,
} from "@/lib/postgres-preview";
import { formatCount } from "@/lib/format";
import { PostgresPreviewSetupNotice } from "@/components/postgres-preview/PostgresPreviewListTables";

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
    neutral: "border-gray-200 bg-white text-[#1f2937]",
    good: "border-emerald-200 bg-emerald-50 text-emerald-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    critical: "border-red-200 bg-red-50 text-red-900",
  }[tone];

  return (
    <div className={`border px-4 py-4 ${toneClass}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold leading-none">{value}</div>
      <div className="mt-2 text-xs leading-5 opacity-80">{note}</div>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const bounded = Math.min(Math.max(value, 0), 100);

  return (
    <div className="h-1.5 overflow-hidden bg-gray-100">
      <div className="h-full bg-[#8dc63f]" style={{ width: `${bounded}%` }} />
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
  const statusClass = {
    ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
    partial: "border-amber-200 bg-amber-50 text-amber-700",
    blocked: "border-red-200 bg-red-50 text-red-700",
  }[status];

  const statusLabel = {
    ready: "Ready",
    partial: "Partial",
    blocked: "Blocked",
  }[status];

  return (
    <div className="flex flex-col gap-3 border border-gray-200 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="font-semibold text-[#1f2937]">{label}</div>
        <div className="mt-1 text-sm leading-5 text-gray-600">{detail}</div>
      </div>
      <span
        className={`inline-flex h-7 shrink-0 items-center border px-2 text-xs font-semibold ${statusClass}`}
      >
        {statusLabel}
      </span>
    </div>
  );
}

function ReadinessTable({
  entities,
}: {
  entities: PostgresReplacementReadinessEntity[];
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-bold text-[#1f2937]">
          Entity Readiness Signals
        </h2>
        <p className="mt-1 text-sm leading-6 text-gray-600">
          These are live staging signals for replacement planning. They do not
          replace detailed record review, but they show where cutover risk still
          sits.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1120px] table-fixed text-left text-sm">
          <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-[16%] px-5 py-3 font-semibold">Area</th>
              <th className="w-[10%] px-5 py-3 font-semibold">Records</th>
              <th className="w-[16%] px-5 py-3 font-semibold">
                Review Coverage
              </th>
              <th className="w-[12%] px-5 py-3 font-semibold">Source Gaps</th>
              <th className="w-[12%] px-5 py-3 font-semibold">Core Gaps</th>
              <th className="w-[12%] px-5 py-3 font-semibold">Links</th>
              <th className="w-[12%] px-5 py-3 font-semibold">Issues</th>
              <th className="w-[10%] px-5 py-3 font-semibold">Updated</th>
              <th className="w-[10%] px-5 py-3 font-semibold">Open</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entities.map((entity) => {
              const coverage = share(
                entity.approved_or_export_ready_count,
                entity.record_count
              );
              const coreGaps =
                entity.missing_country_count +
                entity.missing_use_or_status_count +
                entity.missing_capacity_count +
                entity.missing_coordinates_count;

              return (
                <tr key={entity.entity_type} className="align-top">
                  <td className="px-5 py-4">
                    <Link
                      className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                      href={entityPath(entity.entity_type)}
                    >
                      {entity.label}
                    </Link>
                    <div className="mt-1 text-xs text-gray-500">
                      {formatCount(entity.needs_update_count)} need re-review
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-700">
                    {formatCount(entity.record_count)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-between gap-3 text-xs text-gray-600">
                      <span>{formatPercent(coverage)}</span>
                      <span>
                        {formatCount(entity.approved_or_export_ready_count)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <ProgressBar value={coverage} />
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {formatCount(entity.draft_or_validation_count)} draft /
                      validation
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      className="inline-flex h-7 items-center border border-amber-200 bg-amber-50 px-2 text-xs font-semibold text-amber-700 hover:underline"
                      href={missingPath(entity.entity_type, "source")}
                    >
                      {formatCount(entity.missing_source_count)}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-gray-700">
                    <div>{formatCount(coreGaps)} total</div>
                    <div className="mt-1 text-xs leading-5 text-gray-500">
                      {formatCount(entity.missing_country_count)} country ·{" "}
                      {formatCount(entity.missing_use_or_status_count)} class ·{" "}
                      {formatCount(entity.missing_capacity_count)} capacity ·{" "}
                      {formatCount(entity.missing_coordinates_count)} coords
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      className="inline-flex h-7 items-center border border-amber-200 bg-amber-50 px-2 text-xs font-semibold text-amber-700 hover:underline"
                      href={missingPath(entity.entity_type, "company_link")}
                    >
                      {formatCount(entity.missing_company_link_count)}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-gray-700">
                    <div>{formatCount(entity.open_issue_count)} open</div>
                    <div className="mt-1 text-xs text-red-600">
                      {formatCount(entity.critical_issue_count)} critical
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-700">
                    {formatDate(entity.latest_update_at)}
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      className="text-xs font-semibold text-[#4f7f1f] hover:underline"
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
    </section>
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
    }),
    {
      records: 0,
      approved: 0,
      sourceGaps: 0,
      openIssues: 0,
      criticalIssues: 0,
      needsUpdate: 0,
    }
  );
  const reviewCoverage = share(totals.approved, totals.records);

  return (
    <main className="space-y-8">
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-8 py-8">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
            PostgreSQL Staging
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-[#1f2937]">
                Replacement Readiness
              </h1>
              <p className="mt-4 max-w-4xl text-base leading-7 text-gray-600">
                Live operational signals for deciding when the PostgreSQL
                platform is ready to replace the current internal SQLite site.
                This is a cutover-planning view, not the final executive
                dashboard.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                href="/postgres-preview"
              >
                Back to Preview
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                href="/postgres-preview/research-ops"
              >
                Research Ops
              </Link>
            </div>
          </div>
        </div>
      </section>

      {!data.ok ? (
        <PostgresPreviewSetupNotice error={data.error} />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            <StatTile
              label="Staged Records"
              note="Projects, plants/facilities, and companies"
              value={formatCount(totals.records)}
            />
            <StatTile
              label="Review Coverage"
              note="Approved or export-ready records"
              tone={reviewCoverage >= 70 ? "good" : "warning"}
              value={formatPercent(reviewCoverage)}
            />
            <StatTile
              label="Source Gaps"
              note="Records without confirmed evidence links"
              tone={totals.sourceGaps > 0 ? "warning" : "good"}
              value={formatCount(totals.sourceGaps)}
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
              note="Edited approved records requiring re-review"
              tone={totals.needsUpdate > 0 ? "warning" : "good"}
              value={formatCount(totals.needsUpdate)}
            />
          </section>

          <section className="space-y-3">
            <GateRow
              detail="PostgreSQL staging has the core entity structure, create/edit forms, evidence links, review states, and Research Ops issue tracking."
              label="Controlled Internal Data Filling"
              status="partial"
            />
            <GateRow
              detail="Replacement still needs final live SQLite import, production deployment on Hetzner, backup/restore checks, user access review, export parity, and hands-on workflow acceptance."
              label="Replace Current Internal Platform"
              status="partial"
            />
            <GateRow
              detail="AI suggestions, article fact training, semantic search, subscriber views, and advanced reporting are foundation-stage and should not block internal replacement if governed separately."
              label="Long-Term Intelligence Platform"
              status="partial"
            />
          </section>

          <ReadinessTable entities={entities} />
        </>
      )}
    </main>
  );
}
