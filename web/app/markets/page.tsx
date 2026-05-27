import Link from "next/link";

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
      className="block border border-gray-200 bg-white transition hover:border-[#8dc63f]"
    >
      <div className="border-b border-gray-200 bg-[#f7f7f7] px-6 py-4">
        <h2 className="text-2xl font-bold text-[#1f2937]">{title}</h2>
      </div>

      <div className="px-6 py-6">
        <p className="text-sm leading-7 text-gray-600">{text}</p>
        <div className="mt-5 text-sm font-semibold text-[#8dc63f]">
          Open {title} →
        </div>
      </div>
    </Link>
  );
}

export default function MarketsPage() {
  return (
    <main className="space-y-8">
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-8 py-8">
          <div className="max-w-5xl">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
              Markets
            </p>
            <h1 className="mt-3 text-5xl font-bold tracking-tight text-[#1f2937]">
              Markets
            </h1>
            <p className="mt-4 max-w-5xl text-lg leading-8 text-gray-600">
              Internal geothermal market intelligence pages for country markets
              and TGE regions, combining operating plants, development pipeline,
              maps, and structured database intelligence.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-[#f7f7f7] px-8 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-700">
            <span className="font-semibold uppercase tracking-wide text-gray-500">
              Scope
            </span>
            <span>
              <span className="font-medium text-[#1f2937]">Country Markets</span>
              <span className="mx-2 text-gray-300">|</span>
              capacity, phases, maps, plants, projects
            </span>
            <span>
              <span className="font-medium text-[#1f2937]">Regional Pages</span>
              <span className="mx-2 text-gray-300">|</span>
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
