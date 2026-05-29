import Link from "next/link";

type KPI = {
  label: string;
  value: string | number;
  sub?: string;
};

type Action = {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
};

export default function TopOverviewBar({
  eyebrow,
  title,
  description,
  kpis = [],
  actions = [],
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  kpis?: KPI[];
  actions?: Action[];
}) {
  return (
    <section className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-6 py-4 xl:px-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-5xl">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tge-brand-green)]">
              {eyebrow}
            </p>
          ) : null}

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--tge-text-primary)] xl:text-[2.1rem]">
            {title}
          </h1>

          {description ? (
            <p className="mt-2 max-w-5xl text-sm leading-6 text-[var(--tge-text-secondary)] xl:text-base">
              {description}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-5 xl:min-w-[520px] xl:items-end">
          {actions.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {actions.map((action) => (
                <Link
                  key={`${action.label}-${action.href}`}
                  href={action.href}
                  className={
                    action.variant === "primary"
                      ? "bg-[var(--tge-brand-green)] px-4 py-2 text-sm font-semibold text-[var(--tge-surface-card)] transition hover:opacity-90"
                      : "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-4 py-2 text-sm font-semibold text-[var(--tge-governance-neutral-text)] transition hover:bg-[var(--tge-governance-neutral-bg)]"
                  }
                >
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}

          {kpis.length > 0 ? (
            <div className="grid w-full grid-cols-2 gap-x-8 gap-y-4 border-t border-[var(--tge-governance-neutral-border)] pt-5 xl:grid-cols-4">
              {kpis.map((kpi) => (
                <div key={kpi.label}>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-text-secondary)]">
                    {kpi.label}
                  </div>
                  <div className="mt-1 text-2xl font-bold text-[var(--tge-text-primary)]">
                    {kpi.value}
                  </div>
                  {kpi.sub ? (
                    <div className="mt-1 text-xs text-[var(--tge-text-secondary)]">{kpi.sub}</div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
