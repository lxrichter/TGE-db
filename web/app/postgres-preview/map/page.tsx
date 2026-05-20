import Link from "next/link";
import GroupedMap from "@/components/GroupedMap";

export const dynamic = "force-dynamic";

export default function PostgresPreviewMapPage() {
  return (
    <main className="space-y-8">
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-8 py-8">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
            PostgreSQL Staging
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-[#1f2937]">
                PostgreSQL Map Preview
              </h1>
              <p className="mt-4 max-w-4xl text-base leading-7 text-gray-600">
                Coordinate-confirmed project and plant/facility groups from the
                PostgreSQL staging model. Records without coordinates remain in
                Research Ops missing-coordinate queues.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                href="/postgres-preview"
              >
                Back to Preview
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                href="/postgres-preview/research-ops"
              >
                Research Ops
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-[#f7f7f7] px-8 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-700">
            <span className="font-semibold uppercase tracking-wide text-gray-500">
              Map Scope
            </span>
            <span>
              <span className="font-medium text-[#1f2937]">Source</span>
              <span className="mx-2 text-gray-300">|</span>
              PostgreSQL staging
            </span>
            <span>
              <span className="font-medium text-[#1f2937]">Layers</span>
              <span className="mx-2 text-gray-300">|</span>
              Projects and Plants / Facilities
            </span>
            <span>
              <span className="font-medium text-[#1f2937]">Missing Coordinates</span>
              <span className="mx-2 text-gray-300">|</span>
              Managed in Research Ops
            </span>
          </div>
        </div>
      </section>

      <section className="border border-gray-200 bg-white">
        <GroupedMap apiPath="/api/postgres-preview/map" />
      </section>
    </main>
  );
}
