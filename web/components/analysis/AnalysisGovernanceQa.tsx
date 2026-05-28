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
      <div className="border border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] px-6 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-attention-text)]">
          {eyebrow}
        </div>
        <h2 className="mt-1 text-xl font-bold text-[var(--tge-text-primary)]">
          {title}
        </h2>
        <p className="mt-1 max-w-5xl text-sm leading-6 text-[var(--tge-governance-attention-text)]">
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
    <section className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]">
      <div className="border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-6 py-4">
        <h2 className="text-xl font-bold text-[var(--tge-text-primary)]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[var(--tge-governance-muted-text)]">
          {description}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-[var(--tge-governance-neutral-bg)] text-left uppercase tracking-wide text-[var(--tge-governance-neutral-text)]">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="border-b border-[var(--tge-governance-neutral-border)] px-4 py-2 text-[12px] font-semibold"
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
                  className="px-4 py-8 text-center text-[13px] text-[var(--tge-governance-muted-text)]"
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
      <td
        colSpan={colSpan}
        className="px-4 py-8 text-center text-[13px] text-[var(--tge-governance-muted-text)]"
      >
        {children}
      </td>
    </tr>
  );
}
