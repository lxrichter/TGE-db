import GroupedMap from "@/components/GroupedMap";

export default function MapPage() {
  return (
    <main className="space-y-8">
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-8 py-8">
          <div className="max-w-5xl">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
              Map
            </p>
            <h1 className="mt-3 text-5xl font-bold tracking-tight text-[#1f2937]">
              Global Geothermal Map
            </h1>
            <p className="mt-4 max-w-5xl text-lg leading-8 text-gray-600">
              Global grouped map view of geothermal plants and projects. By
              default, the map shows one marker per Plant Group or Project Group
              using the average coordinates of grouped records.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-[#f7f7f7] px-8 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-700">
            <span className="font-semibold uppercase tracking-wide text-gray-500">
              Map Scope
            </span>
            <span>
              <span className="font-medium text-[#1f2937]">Layers</span>
              <span className="mx-2 text-gray-300">|</span>
              Plants and Projects
            </span>
            <span>
              <span className="font-medium text-[#1f2937]">Grouping</span>
              <span className="mx-2 text-gray-300">|</span>
              Plant Group / Project Group
            </span>
            <span>
              <span className="font-medium text-[#1f2937]">Future Filters</span>
              <span className="mx-2 text-gray-300">|</span>
              Country, Phase, Technology
            </span>
          </div>
        </div>
      </section>

      <section className="border border-gray-200 bg-white">
        <GroupedMap />
      </section>
    </main>
  );
}