import GroupedMap from "@/components/GroupedMap";

export default function MapPage() {
  return (
    <main className="space-y-8">
      <section className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]">
        <div className="border-l-4 border-l-[var(--tge-brand-green)] px-8 py-8">
          <div className="max-w-5xl">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]">
              Map
            </p>
            <h1 className="mt-3 text-5xl font-bold tracking-tight text-[var(--tge-text-primary)]">
              Global Geothermal Map
            </h1>
            <p className="mt-4 max-w-5xl text-lg leading-8 text-[var(--tge-text-secondary)]">
              Global grouped map view of geothermal plants and projects. By
              default, the map shows one marker per Plant Group or Project Group
              using the average coordinates of grouped records.
            </p>
          </div>
        </div>

        <div className="border-t border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-8 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--tge-governance-neutral-text)]">
            <span className="font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
              Map Scope
            </span>
            <span>
              <span className="font-medium text-[var(--tge-text-primary)]">Layers</span>
              <span className="mx-2 text-[var(--tge-governance-muted-border)]">|</span>
              Plants and Projects
            </span>
            <span>
              <span className="font-medium text-[var(--tge-text-primary)]">Grouping</span>
              <span className="mx-2 text-[var(--tge-governance-muted-border)]">|</span>
              Plant Group / Project Group
            </span>
            <span>
              <span className="font-medium text-[var(--tge-text-primary)]">
                Future Filters
              </span>
              <span className="mx-2 text-[var(--tge-governance-muted-border)]">|</span>
              Country, Phase, Technology
            </span>
          </div>
        </div>
      </section>

      <section className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]">
        <GroupedMap />
      </section>
    </main>
  );
}
