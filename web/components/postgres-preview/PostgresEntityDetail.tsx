import Link from "next/link";
import type { ReactNode } from "react";
import type { PostgresEntitySourceLink } from "@/lib/postgres-preview";
import { formatCount } from "@/lib/format";

export type DetailField = {
  label: string;
  value: ReactNode;
};

export type DetailStat = {
  label: string;
  value: ReactNode;
  note: string;
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

export function StatusBadge({ value }: { value: string | null }) {
  return (
    <span className="inline-flex min-h-[28px] items-center border border-gray-200 bg-[#f7f7f7] px-2 text-xs font-semibold text-gray-700">
      {value || "unknown"}
    </span>
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
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
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

export function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-bold text-[#1f2937]">{title}</h2>
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
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
          className="inline-flex h-9 items-center justify-center border border-[#8dc63f] bg-white px-4 text-sm font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec]"
        >
          Add Source
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed text-left text-sm">
          <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-[26%] px-4 py-3 font-semibold">Source</th>
              <th className="w-[14%] px-4 py-3 font-semibold">Type</th>
              <th className="w-[14%] px-4 py-3 font-semibold">Credibility</th>
              <th className="w-[14%] px-4 py-3 font-semibold">Field</th>
              <th className="w-[14%] px-4 py-3 font-semibold">Value</th>
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
                  <StatusBadge value={source.credibility_status_code} />
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {source.linked_field || "-"}
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
                    className="inline-flex h-8 items-center border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}

            {sources.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
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

export function DetailShell({
  eyebrow,
  title,
  subtitle,
  backHref,
  backLabel,
  badges,
  stats,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  backHref: string;
  backLabel: string;
  badges: ReactNode;
  stats: DetailStat[];
  children: ReactNode;
}) {
  return (
    <main className="space-y-8">
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-8 py-8">
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
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#1f2937]">
                {title}
              </h1>
              <p className="mt-4 max-w-4xl text-base leading-7 text-gray-600">
                {subtitle}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">{badges}</div>
          </div>
        </div>
      </section>

      <StatGrid stats={stats} />
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
