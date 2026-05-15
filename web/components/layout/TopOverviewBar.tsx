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
    <section className="border border-gray-200 bg-white px-8 py-8">
      <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl">
          {eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-wide text-[#8dc63f]">
              {eyebrow}
            </p>
          ) : null}

          <h1 className="mt-2 text-4xl font-bold tracking-tight text-[#1f2937]">
            {title}
          </h1>

          {description ? (
            <p className="mt-3 max-w-4xl text-base text-gray-600">
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
                      ? "bg-[#8dc63f] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                      : "border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  }
                >
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}

          {kpis.length > 0 ? (
            <div className="grid w-full grid-cols-2 gap-x-8 gap-y-4 border-t border-gray-200 pt-5 xl:grid-cols-4">
              {kpis.map((kpi) => (
                <div key={kpi.label}>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    {kpi.label}
                  </div>
                  <div className="mt-1 text-2xl font-bold text-[#1f2937]">
                    {kpi.value}
                  </div>
                  {kpi.sub ? (
                    <div className="mt-1 text-xs text-gray-500">{kpi.sub}</div>
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