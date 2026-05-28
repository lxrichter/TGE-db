import type { ReactNode } from "react";

export function AnalysisGovernanceQaSection({
  eyebrow = "Governance QA",
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="border border-amber-200 bg-amber-50 px-6 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
          {eyebrow}
        </div>
        <h2 className="mt-1 text-xl font-bold text-[#1f2937]">{title}</h2>
        <p className="mt-1 max-w-5xl text-sm leading-6 text-amber-900">
          {description}
        </p>
      </div>

      {children}
    </section>
  );
}

export function AnalysisQaTable({
  title,
  description,
  headers,
  emptyMessage,
  colSpan,
  isEmpty,
  children,
}: {
  title: string;
  description: string;
  headers: string[];
  emptyMessage: string;
  colSpan: number;
  isEmpty: boolean;
  children: ReactNode;
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-[#f7f7f7] px-6 py-4">
        <h2 className="text-xl font-bold text-[#1f2937]">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100 text-left uppercase tracking-wide text-gray-600">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="border-b border-gray-200 px-4 py-2 text-[12px] font-semibold"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {children}
            {isEmpty ? (
              <tr>
                <td
                  colSpan={colSpan}
                  className="px-4 py-8 text-center text-[13px] text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AnalysisQaEmptyRow({
  colSpan,
  children,
}: {
  colSpan: number;
  children: ReactNode;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-[13px] text-gray-500">
        {children}
      </td>
    </tr>
  );
}
