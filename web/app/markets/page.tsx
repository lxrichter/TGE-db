import Link from "next/link";

const panelClass =
  "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]";
const panelHeaderClass =
  "border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)]";
const titleTextClass = "text-[var(--tge-text-primary)]";
const bodyTextClass = "text-[var(--tge-text-secondary)]";
const brandLinkClass = "text-[var(--tge-brand-green-dark)]";

function MarketCard({
  title,
  text,
  href,
}: {
  title: string;
  text: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] transition hover:border-[var(--tge-brand-green)] hover:bg-[var(--tge-governance-success-bg)]"
    >
      <div className={`${panelHeaderClass} px-6 py-4`}>
        <h2 className={`text-2xl font-bold ${titleTextClass}`}>{title}</h2>
      </div>

      <div className="px-6 py-6">
        <p className={`text-sm leading-7 ${bodyTextClass}`}>{text}</p>
        <div className={`mt-5 text-sm font-semibold ${brandLinkClass}`}>
          Open {title} →
        </div>
      </div>
    </Link>
  );
}

export default function MarketsPage() {
  return (
    <main className="space-y-8">
      <section className={panelClass}>
        <div className="border-l-4 border-l-[var(--tge-brand-green)] px-8 py-8">
          <div className="max-w-5xl">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]">
              Markets
            </p>
            <h1 className={`mt-3 text-5xl font-bold tracking-tight ${titleTextClass}`}>
              Markets
            </h1>
            <p className={`mt-4 max-w-5xl text-lg leading-8 ${bodyTextClass}`}>
              Internal geothermal market intelligence pages for country markets
              and TGE regions, combining operating plants, development pipeline,
              maps, and structured database intelligence.
            </p>
          </div>
        </div>

        <div className="border-t border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-8 py-4">
          <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 text-sm ${bodyTextClass}`}>
            <span className="font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
              Scope
            </span>
            <span>
              <span className={`font-medium ${titleTextClass}`}>Country Markets</span>
              <span className="mx-2 text-[var(--tge-governance-muted-border)]">|</span>
              capacity, phases, maps, plants, projects
            </span>
            <span>
              <span className={`font-medium ${titleTextClass}`}>Regional Pages</span>
              <span className="mx-2 text-[var(--tge-governance-muted-border)]">|</span>
              aggregation, comparison, operator landscape
            </span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <MarketCard
          title="Country Markets"
          text="Browse country-market drilldowns with installed capacity, operating capacity, plant counts, project pipeline by phase, maps, and linked plant/project profiles."
          href="/markets/countries"
        />

        <MarketCard
          title="Regional Markets"
          text="Browse TGE regional drilldowns with regional capacity, market coverage, project pipeline, country-market summaries, maps, and linked plant/project profiles."
          href="/markets/regions"
        />
      </section>
    </main>
  );
}
