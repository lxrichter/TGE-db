import Link from "next/link";

const reportPaths = [
  {
    title: "Market Intelligence Reports",
    note: "Future subscriber-ready market reports built from approved markets, country profiles, analysis modules, and evidence-backed signals.",
    href: "/markets",
  },
  {
    title: "Analysis Modules",
    note: "Current modular intelligence layer for developer, owner/operator, turbine technology, and country benchmark analysis.",
    href: "/analysis",
  },
  {
    title: "Evidence-Backed Exports",
    note: "Future report-ready outputs should inherit source quality, visibility, and approval-readiness rules from the evidence backbone.",
    href: "/sources",
  },
];

export default function ReportsPage() {
  return (
    <main className="space-y-6">
      <section className="border-l-4 border-[var(--tge-brand-green)] bg-[var(--tge-surface-card)] px-6 py-8">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--tge-brand-green-dark)]">
          Intelligence
        </div>
        <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight text-[var(--tge-text-primary)]">
          Reports
        </h1>
        <p className="mt-4 max-w-4xl text-base leading-7 text-[var(--tge-text-secondary)]">
          Report products will become the subscriber-ready publishing layer for
          approved geothermal intelligence. For now this page anchors the shell
          route and connects to the live intelligence sources that will feed
          reports.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {reportPaths.map((path) => (
          <Link
            key={path.title}
            href={path.href}
            className="block border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] p-5 transition hover:border-[var(--tge-brand-green)] hover:bg-[var(--tge-governance-success-bg)]"
          >
            <h2 className="text-lg font-bold text-[var(--tge-text-primary)]">
              {path.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--tge-text-secondary)]">
              {path.note}
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
