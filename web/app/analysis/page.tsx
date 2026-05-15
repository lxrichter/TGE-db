import Link from "next/link";

function AvailableAnalysisCard({
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
      className="block border border-gray-200 bg-white transition hover:border-[#8dc63f] hover:shadow-sm"
    >
      <div className="border-b border-gray-200 bg-[#f7f7f7] px-5 py-3">
        <h3 className="text-lg font-semibold text-[#1f2937]">{title}</h3>
      </div>

      <div className="px-5 py-4">
        <p className="text-[13px] leading-6 text-gray-600">{text}</p>
        <div className="mt-4 text-sm font-semibold text-[#1f2937]">
          Open analysis →
        </div>
      </div>
    </Link>
  );
}

function PlannedAnalysisCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="border border-gray-200 bg-[#fafafa]">
      <div className="border-b border-gray-200 bg-[#f3f4f6] px-5 py-3">
        <h3 className="text-lg font-semibold text-[#4b5563]">{title}</h3>
      </div>

      <div className="px-5 py-4">
        <p className="text-[13px] leading-6 text-gray-500">{text}</p>
        <div className="mt-4 text-sm font-semibold text-gray-400">
          Planned functionality
        </div>
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <main className="space-y-6">
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-6 py-6">
          <div className="max-w-5xl">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
              Analysis
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-[#1f2937] xl:text-5xl">
              Analysis Workspace
            </h1>
            <p className="mt-3 max-w-5xl text-base leading-7 text-gray-600">
              Derived intelligence views built from the geothermal plants,
              projects, and companies database, supporting country comparison,
              technology assessment, ownership/operator tracking, and future
              chart-based analysis modules. Regional and country market overviews
              are currently accessed through the Markets section.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-[#fafafa] px-6 py-4">
          <div className="grid grid-cols-1 gap-3 text-sm text-gray-700 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <span className="font-semibold uppercase tracking-wide text-gray-500">
                Live modules
              </span>
              <div className="mt-1 text-[#1f2937]">
                countries, turbine technology, owners/operators
              </div>
            </div>

            <div>
              <span className="font-semibold uppercase tracking-wide text-gray-500">
                Planned next layer
              </span>
              <div className="mt-1 text-[#1f2937]">
                developers, roles, phases, resource types
              </div>
            </div>

            <div>
              <span className="font-semibold uppercase tracking-wide text-gray-500">
                Source base
              </span>
              <div className="mt-1 text-[#1f2937]">
                plants, projects, companies, link tables
              </div>
            </div>

            <div>
              <span className="font-semibold uppercase tracking-wide text-gray-500">
                Markets note
              </span>
              <div className="mt-1 text-[#1f2937]">
                regional and country overviews live under Markets
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-[#f3f4f6] px-5 py-3">
          <h2 className="text-lg font-semibold text-[#1f2937]">
            Available Analysis
          </h2>
        </div>
        <div className="p-5">
          <p className="mb-5 text-[13px] leading-6 text-gray-600">
            These modules are already built and available in the platform.
          </p>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
            <AvailableAnalysisCard
              title="Countries Analysis"
              text="Installed capacity by country and TGE region, planned project MW, and country-level project phase distribution."
              href="/analysis/countries"
            />

            <AvailableAnalysisCard
              title="Turbine Technology Analysis"
              text="Installed capacity, units, and supplier overview derived from the plants database."
              href="/analysis/turbine-technology"
            />

            <AvailableAnalysisCard
              title="Owners & Operators Analysis"
              text="Weighted owner MW and operator-linked installed MW based on structured company-to-plant links."
              href="/analysis/operators"
            />
          </div>
        </div>
      </section>

      <section className="border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-[#f3f4f6] px-5 py-3">
          <h2 className="text-lg font-semibold text-[#1f2937]">
            Planned Functionality
          </h2>
        </div>
        <div className="p-5">
          <p className="mb-5 text-[13px] leading-6 text-gray-600">
            These modules define the intended future structure of the analysis
            workspace, but are not yet active in the site.
          </p>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
            <PlannedAnalysisCard
              title="Developer Analysis"
              text="Developer exposure across projects and plants, including planned MW, project counts, and phase distribution."
            />

            <PlannedAnalysisCard
              title="Company Roles Analysis"
              text="Analysis of linked company roles across plants and projects, including EPC, drilling, turbine supply, investment, and operations."
            />

            <PlannedAnalysisCard
              title="Project Phase Analysis"
              text="Pipeline overview by development phase, including counts and MW by prospect, exploration, feasibility, construction, operational, and cancelled."
            />

            <PlannedAnalysisCard
              title="Resource Type Analysis"
              text="Breakdown of hydrothermal, EGS, AGS, closed-loop, and other resource categories across plants and projects."
            />

            <PlannedAnalysisCard
              title="Wellfield Analysis"
              text="Well-related analysis covering total wells, production wells, reinjection wells, depth, and selected resource indicators."
            />
          </div>
        </div>
      </section>

      <section className="border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-[#f3f4f6] px-5 py-3">
          <h2 className="text-lg font-semibold text-[#1f2937]">
            Notes on planned modules
          </h2>
        </div>
        <div className="px-5 py-4 text-[13px] leading-6 text-gray-600">
          Planned modules are shown to indicate the intended future structure of
          the analysis workspace. They remain non-clickable until the required
          normalization, roll-up logic, and dedicated analysis views have been
          implemented. Country and regional market views are already available
          through the Markets section rather than being duplicated here.
        </div>
      </section>

      <div className="h-4" />
    </main>
  );
}