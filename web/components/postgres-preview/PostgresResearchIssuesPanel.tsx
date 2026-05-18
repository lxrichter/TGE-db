import Link from "next/link";
import type { PostgresResearchOpsIssue } from "@/lib/postgres-preview";

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

export default function PostgresResearchIssuesPanel({
  issues,
}: {
  issues: PostgresResearchOpsIssue[];
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1f2937]">
            Research Ops Issues
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Open persistent research issues linked to this PostgreSQL staging
            record. Generated missing-data queues remain visible in Research Ops.
          </p>
        </div>
        <Link
          className="inline-flex h-9 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
          href="/postgres-preview/research-ops"
        >
          Open Research Ops
        </Link>
      </div>

      <div className="px-5 py-5">
        {issues.length === 0 ? (
          <div className="border border-gray-200 bg-[#f7f7f7] px-4 py-3 text-sm text-gray-600">
            No open persistent research issues are linked to this record.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed text-left text-sm">
              <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="w-[18%] px-4 py-3 font-semibold">Type</th>
                  <th className="w-[36%] px-4 py-3 font-semibold">Issue</th>
                  <th className="w-[14%] px-4 py-3 font-semibold">Severity</th>
                  <th className="w-[14%] px-4 py-3 font-semibold">Assigned</th>
                  <th className="w-[12%] px-4 py-3 font-semibold">Updated</th>
                  <th className="w-[10%] px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {issues.map((issue) => (
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
                        {issue.linked_field || "record-level"}
                      </div>
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
                      {issue.assigned_to_name || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatDate(issue.updated_at)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {issue.issue_status_label}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
