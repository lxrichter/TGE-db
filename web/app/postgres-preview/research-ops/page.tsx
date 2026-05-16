import Link from "next/link";
import { formatCount } from "@/lib/format";
import {
  getPostgresResearchOpsDashboard,
  type PostgresResearchOpsDashboard,
  type PostgresResearchOpsQueue,
  type PostgresResearchOpsQueueItem,
  type PostgresResearchOpsRecentEdit,
  type ResearchOpsQueueSeverity,
} from "@/lib/postgres-preview";

export const dynamic = "force-dynamic";

type ResearchOpsData =
  | {
      ok: true;
      dashboard: PostgresResearchOpsDashboard;
    }
  | {
      ok: false;
      error: string;
    };

async function getResearchOpsData(): Promise<ResearchOpsData> {
  try {
    const dashboard = await getPostgresResearchOpsDashboard();
    return { ok: true, dashboard };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: message };
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

function formatEntityType(value: PostgresResearchOpsQueueItem["entity_type"]) {
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

function EmptyQueue() {
  return (
    <div className="border-t border-gray-100 px-5 py-5 text-sm text-gray-500">
      No open records in this queue.
    </div>
  );
}

function EntityTable({
  items,
}: {
  items: PostgresResearchOpsQueueItem[] | PostgresResearchOpsRecentEdit[];
}) {
  if (items.length === 0) {
    return <EmptyQueue />;
  }

  return (
    <div className="overflow-x-auto border-t border-gray-100">
      <table className="min-w-full table-fixed text-left text-sm">
        <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
          <tr>
            <th className="w-[12%] px-5 py-3 font-semibold">Type</th>
            <th className="w-[28%] px-5 py-3 font-semibold">Record</th>
            <th className="w-[14%] px-5 py-3 font-semibold">Country</th>
            <th className="w-[14%] px-5 py-3 font-semibold">Use / Type</th>
            <th className="w-[14%] px-5 py-3 font-semibold">Status</th>
            <th className="w-[12%] px-5 py-3 font-semibold">Review</th>
            <th className="w-[12%] px-5 py-3 font-semibold">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item) => (
            <tr key={`${item.entity_type}-${item.entity_id}`} className="align-top">
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
                {formatDate(item.updated_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QueueCard({ queue }: { queue: PostgresResearchOpsQueue }) {
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
            {formatCount(queue.count)}
          </div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            open
          </div>
        </div>
      </div>
      <EntityTable items={queue.items} />
    </section>
  );
}

function RecentEdits({ items }: { items: PostgresResearchOpsRecentEdit[] }) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-bold text-[#1f2937]">Recently Edited</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
          Latest PostgreSQL staging records by updated timestamp. This is useful
          for editor review and lightweight activity checks.
        </p>
      </div>
      <EntityTable items={items} />
    </section>
  );
}

function SetupNotice({ error }: { error: string }) {
  return (
    <section className="border border-amber-200 bg-amber-50 px-5 py-5">
      <h2 className="text-lg font-bold text-amber-900">PostgreSQL Not Connected</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
        This preview reads from the Railway PostgreSQL database. Run the app
        through Railway variables or set `DATABASE_PUBLIC_URL` / `DATABASE_URL`
        locally.
      </p>
      <pre className="mt-4 overflow-x-auto bg-white px-4 py-3 text-xs text-gray-700">
        railway run --service Postgres -- npm --prefix web run dev
      </pre>
      <p className="mt-3 text-xs text-amber-900">Error: {error}</p>
    </section>
  );
}

export default async function PostgresResearchOpsPage() {
  const data = await getResearchOpsData();

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
                Research Ops Preview
              </h1>
              <p className="mt-4 max-w-4xl text-base leading-7 text-gray-600">
                Read-only operational queues for validation, missing data,
                direct-use classification, duplicate checks, and editor review.
              </p>
            </div>
            <Link
              className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
              href="/postgres-preview"
            >
              Back to PostgreSQL Preview
            </Link>
          </div>
        </div>
      </section>

      {!data.ok ? (
        <SetupNotice error={data.error} />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Open Issues"
              value={data.dashboard.totals.openIssues}
              note="All queue matches"
            />
            <StatTile
              label="Critical"
              value={data.dashboard.totals.criticalIssues}
              note="Blocking approval quality"
            />
            <StatTile
              label="Important"
              value={data.dashboard.totals.importantIssues}
              note="Research completeness"
            />
            <StatTile
              label="Workflow"
              value={data.dashboard.totals.workflowIssues}
              note="Approval and update state"
            />
          </section>

          <section className="border border-gray-200 bg-white px-5 py-4 text-sm leading-6 text-gray-600">
            <span className="font-semibold text-[#1f2937]">Current scope:</span>{" "}
            this is a staging preview only. It does not alter records, does not
            import the live Hetzner SQLite database, and does not replace the
            existing SQLite app workflows yet. Generated {formatDate(data.dashboard.generatedAt)}.
          </section>

          <div className="space-y-5">
            {data.dashboard.queues.map((queue) => (
              <QueueCard key={queue.key} queue={queue} />
            ))}
          </div>

          <RecentEdits items={data.dashboard.recentEdits} />
        </>
      )}
    </main>
  );
}
