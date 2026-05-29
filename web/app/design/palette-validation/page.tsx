import type { ReactNode } from "react";
import {
  PageHeader,
  SectionHeader,
} from "@/components/design-system/TgeDesignSystem";
import {
  tgeChartLanguageV2,
  tgeSurfaces,
  tgeText,
  tgeTypography,
  type TgeChartPaletteEntry,
} from "@/lib/design-system";

type ValidationEntry = TgeChartPaletteEntry & {
  metric?: string;
  share?: number;
};

const rankingEntries: ValidationEntry[] = tgeChartLanguageV2.ranking.map(
  (entry, index) => ({
    ...entry,
    metric: ["17.4 GW", "38.2 GW", "102 markets", "2.8 GW"][index],
    share: [88, 72, 54, 63][index],
  })
);

const lifecycleEntries: ValidationEntry[] = tgeChartLanguageV2.lifecycle.map(
  (entry, index) => ({
    ...entry,
    metric: ["124", "430", "88", "67", "81", "38", "19"][index],
    share: [11, 31, 14, 13, 17, 9, 5][index],
  })
);

const governanceEntries: ValidationEntry[] = tgeChartLanguageV2.governance.map(
  (entry, index) => ({
    ...entry,
    metric: ["Approved", "Review", "Rejected", "Blocked", "Candidate", "Suggested"][index],
    share: [72, 42, 30, 20, 58, 38][index],
  })
);

const technologyEntries: ValidationEntry[] = tgeChartLanguageV2.technology.map(
  (entry, index) => ({
    ...entry,
    metric: [
      "412 MW",
      "4.8 GW",
      "5.9 GW",
      "1.2 GW",
      "1.1 GW",
      "3.7 GW",
      "284 MW",
      "946 MW",
      "1.9 GW",
      "612 MW",
      "2.4 GWth",
      "1.8 GWth",
      "740 MWth",
      "18 signals",
      "Unknown",
    ][index],
    share: [18, 56, 68, 28, 23, 48, 14, 25, 34, 20, 44, 38, 19, 16, 10][index],
  })
);

const signalEntries: ValidationEntry[] = tgeChartLanguageV2.signal.map(
  (entry, index) => ({
    ...entry,
    metric: ["24", "18", "31", "16", "9", "7"][index],
    share: [76, 58, 66, 44, 35, 28][index],
  })
);

const spatialEntries: ValidationEntry[] = tgeChartLanguageV2.spatial.map(
  (entry, index) => ({
    ...entry,
    metric: ["Low", "Medium", "High", "Hotspot"][index],
    share: [25, 52, 78, 64][index],
  })
);

const lightTextKeys = new Set([
  "prospect",
  "dry_steam",
  "heat_pumps",
  "ai_suggested",
  "low",
]);

function contrastText(entry: ValidationEntry) {
  return lightTextKeys.has(entry.key)
    ? "var(--tge-text-primary)"
    : "var(--tge-surface-card)";
}

function ValidationShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <SectionHeader title={title} description={description} />
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function LargeSwatches({ entries }: { entries: ValidationEntry[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {entries.map((entry) => (
        <article
          className="min-h-[148px] p-4"
          key={entry.key}
          style={{
            backgroundColor: entry.cssVar,
            color: contrastText(entry),
          }}
        >
          <div className={tgeTypography.tableHeader}>{entry.label}</div>
          <div className="mt-8 text-2xl font-bold leading-none">
            {entry.metric}
          </div>
          <div className="mt-2 font-mono text-[11px] font-semibold leading-4 opacity-80">
            {entry.hex}
          </div>
        </article>
      ))}
    </div>
  );
}

function BadgeExamples({ entries }: { entries: ValidationEntry[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {entries.map((entry) => (
        <div
          className="flex flex-wrap items-center gap-3 bg-[var(--tge-surface-card)] p-3"
          key={entry.key}
        >
          <span
            className="inline-flex min-h-7 items-center px-2.5 text-[10px] font-bold uppercase leading-4 tracking-wide"
            style={{
              backgroundColor: entry.cssVar,
              color: contrastText(entry),
            }}
          >
            {entry.label}
          </span>
          <span
            className="inline-flex min-h-7 items-center border px-2.5 text-[10px] font-bold uppercase leading-4 tracking-wide"
            style={{
              borderColor: entry.cssVar,
              color: entry.cssVar,
            }}
          >
            {entry.metric}
          </span>
        </div>
      ))}
    </div>
  );
}

function TableExample({
  entries,
  heading,
}: {
  entries: ValidationEntry[];
  heading: string;
}) {
  return (
    <div className={`${tgeSurfaces.card} overflow-x-auto`}>
      <table className="w-full min-w-[820px] table-fixed text-left">
        <thead className={`${tgeSurfaces.tableHeader} ${tgeTypography.tableHeader} ${tgeText.muted}`}>
          <tr>
            <th className="px-4 py-3">{heading}</th>
            <th className="px-4 py-3">Usage</th>
            <th className="px-4 py-3 text-right">Metric</th>
            <th className="px-4 py-3 text-right">Signal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--tge-governance-muted-border)]">
          {entries.slice(0, 8).map((entry) => (
            <tr className={tgeTypography.tableBody} key={entry.key}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className="h-8 w-2"
                    style={{ backgroundColor: entry.cssVar }}
                  />
                  <div>
                    <div className={`font-bold ${tgeText.primary}`}>{entry.label}</div>
                    <div className={`${tgeTypography.metadata} font-mono`}>
                      {entry.hex}
                    </div>
                  </div>
                </div>
              </td>
              <td className={`px-4 py-3 ${tgeText.secondary}`}>{entry.usage}</td>
              <td className={`px-4 py-3 text-right font-bold ${tgeText.primary}`}>
                {entry.metric}
              </td>
              <td className="px-4 py-3">
                <div className="ml-auto h-2 w-28 bg-[var(--tge-governance-neutral-bg)]">
                  <div
                    className="h-2"
                    style={{
                      backgroundColor: entry.cssVar,
                      width: `${entry.share ?? 50}%`,
                    }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BarChartExample({ entries }: { entries: ValidationEntry[] }) {
  return (
    <div className={`${tgeSurfaces.card} space-y-3 p-4`}>
      {entries.slice(0, 7).map((entry) => (
        <div
          className="grid grid-cols-[minmax(96px,160px)_1fr_72px] items-center gap-3"
          key={entry.key}
        >
          <div className={`${tgeTypography.bodyStrong} truncate ${tgeText.primary}`}>
            {entry.label}
          </div>
          <div className="h-8 bg-[var(--tge-governance-neutral-bg)]">
            <div
              className="flex h-8 items-center justify-end px-2 text-[10px] font-bold uppercase tracking-wide"
              style={{
                backgroundColor: entry.cssVar,
                color: contrastText(entry),
                width: `${entry.share ?? 50}%`,
              }}
            >
              {(entry.share ?? 0) > 28 ? entry.metric : ""}
            </div>
          </div>
          <div className={`${tgeTypography.bodyStrong} text-right ${tgeText.primary}`}>
            {entry.metric}
          </div>
        </div>
      ))}
    </div>
  );
}

function StackedChartExample({ entries }: { entries: ValidationEntry[] }) {
  return (
    <div className={`${tgeSurfaces.card} space-y-4 p-4`}>
      <div className="flex h-14 overflow-hidden bg-[var(--tge-governance-neutral-bg)]">
        {entries.slice(0, 8).map((entry) => (
          <div
            className="flex items-center justify-center px-2 text-[10px] font-bold uppercase tracking-wide"
            key={entry.key}
            style={{
              backgroundColor: entry.cssVar,
              color: contrastText(entry),
              width: `${entry.share ?? 12}%`,
            }}
            title={entry.label}
          >
            {(entry.share ?? 0) >= 16 ? entry.label : ""}
          </div>
        ))}
      </div>
      <div className="grid gap-2 md:grid-cols-4">
        {entries.slice(0, 8).map((entry) => (
          <div className="bg-[var(--tge-surface-subtle)] p-3" key={entry.key}>
            <div className="h-2 w-12" style={{ backgroundColor: entry.cssVar }} />
            <div className={`${tgeTypography.bodyStrong} mt-2 ${tgeText.primary}`}>
              {entry.label}
            </div>
            <p className={tgeTypography.metadata}>{entry.metric}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MarkerExamples({ entries }: { entries: ValidationEntry[] }) {
  return (
    <div className={`${tgeSurfaces.card} p-4`}>
      <div className="relative min-h-[300px] overflow-hidden bg-[var(--tge-concept-map-land)]">
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <path
            d="M7 32 C21 22, 38 42, 55 29 C69 18, 82 38, 95 30"
            fill="none"
            opacity="0.28"
            stroke="var(--tge-brand-green-dark)"
            strokeLinecap="round"
            strokeWidth="1.2"
          />
          <path
            d="M12 72 C31 57, 46 52, 62 64 C76 74, 88 57, 98 50"
            fill="none"
            opacity="0.22"
            stroke="var(--tge-chart-ranking-pipeline-capacity)"
            strokeLinecap="round"
            strokeWidth="1.2"
          />
        </svg>
        {entries.slice(0, 10).map((entry, index) => {
          const positions = [
            [18, 36],
            [32, 58],
            [44, 42],
            [57, 66],
            [68, 35],
            [79, 54],
            [24, 73],
            [51, 25],
            [86, 72],
            [39, 79],
          ];
          const [left, top] = positions[index] ?? [50, 50];

          return (
            <div
              className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[var(--tge-surface-card)] text-[10px] font-bold shadow-sm"
              key={entry.key}
              style={{
                backgroundColor: entry.cssVar,
                color: contrastText(entry),
                left: `${left}%`,
                top: `${top}%`,
              }}
              title={entry.label}
            >
              {index + 1}
            </div>
          );
        })}
        <div className="absolute left-4 top-4 bg-[var(--tge-surface-card)] p-3">
          <div className={tgeTypography.pageLabel}>Map Stress Test</div>
          <p className={`${tgeTypography.metadata} mt-1 max-w-xs`}>
            Marker colors must stay readable on muted land and terrain surfaces.
          </p>
        </div>
      </div>
    </div>
  );
}

function IntensityMapExample() {
  return (
    <div className={`${tgeSurfaces.card} p-4`}>
      <div className="relative min-h-[300px] overflow-hidden bg-[var(--tge-concept-map-land)]">
        <div
          className="absolute left-[19%] top-[48%] h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-65"
          style={{ backgroundColor: spatialEntries[0].cssVar }}
        />
        <div
          className="absolute left-[40%] top-[55%] h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-55"
          style={{ backgroundColor: spatialEntries[1].cssVar }}
        />
        <div
          className="absolute left-[63%] top-[41%] h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-45"
          style={{ backgroundColor: spatialEntries[2].cssVar }}
        />
        <div
          className="absolute left-[77%] top-[69%] h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-58"
          style={{ backgroundColor: spatialEntries[3].cssVar }}
        />
        <div className="absolute bottom-4 left-4 grid gap-2 bg-[var(--tge-surface-card)] p-3">
          {spatialEntries.map((entry) => (
            <div className="flex items-center gap-2" key={entry.key}>
              <span
                className="h-3 w-8"
                style={{ backgroundColor: entry.cssVar }}
              />
              <span className={tgeTypography.metadata}>{entry.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PaletteValidationSection({
  title,
  description,
  entries,
  tableHeading,
  chartMode,
  mapMode = "markers",
}: {
  title: string;
  description: string;
  entries: ValidationEntry[];
  tableHeading: string;
  chartMode: "bars" | "stacked";
  mapMode?: "markers" | "intensity" | "none";
}) {
  return (
    <ValidationShell title={title} description={description}>
      <LargeSwatches entries={entries} />
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <SectionHeader
            title="Badge and interface test"
            description="Filled and outline treatments test saturation, label readability, and workflow usability."
          />
          <BadgeExamples entries={entries} />
        </div>
        <div className="space-y-4">
          <SectionHeader
            title="Chart test"
            description="Bars and stacked surfaces reveal whether the palette feels premium at product scale."
          />
          {chartMode === "bars" ? (
            <BarChartExample entries={entries} />
          ) : (
            <StackedChartExample entries={entries} />
          )}
        </div>
      </div>
      <TableExample entries={entries} heading={tableHeading} />
      {mapMode !== "none" ? (
        mapMode === "intensity" ? (
          <IntensityMapExample />
        ) : (
          <MarkerExamples entries={entries} />
        )
      ) : null}
    </ValidationShell>
  );
}

export default function PaletteValidationPage() {
  return (
    <main className="space-y-12">
      <PageHeader
        label="Palette Validation"
        title="Visual stress test for chart language colors"
        description="This page is intentionally visual. It tests saturation, contrast, hierarchy, readability, and product feel before the palettes are applied to Dashboard, Markets, Analysis, Projects, Plants, Companies, Sources, Research Ops, and Map Explorer."
        variant="brief"
      />

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-[var(--tge-surface-card)] p-6">
          <div className={tgeTypography.pageLabel}>Validation Goal</div>
          <h2 className={`${tgeTypography.intelligenceHeadline} mt-3 ${tgeText.primary}`}>
            Geothermal, not generic.
          </h2>
          <p className={`${tgeTypography.body} mt-4 ${tgeText.secondary}`}>
            The palette should feel rooted in geothermal energy, infrastructure,
            geology, research, and market intelligence. This page shows how the
            colors behave when they become the product rather than a chart legend.
          </p>
        </div>
        <div className="grid gap-px border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-border)] md:grid-cols-2">
          {[
            "Saturation",
            "Contrast",
            "Hierarchy",
            "Readability",
            "Premium feel",
            "Cross-page consistency",
          ].map((item) => (
            <div className="bg-[var(--tge-surface-card)] p-4" key={item}>
              <div className={`${tgeTypography.subsectionTitle} ${tgeText.primary}`}>
                {item}
              </div>
              <p className={`${tgeTypography.metadata} mt-2`}>
                Validate against charts, badges, tables, and map surfaces before
                rollout.
              </p>
            </div>
          ))}
        </div>
      </section>

      <PaletteValidationSection
        chartMode="bars"
        description="Ranking colors should stay stable by metric and remain calm in table, chart, and KPI-like contexts."
        entries={rankingEntries}
        mapMode="none"
        tableHeading="Metric"
        title="Ranking Palette"
      />

      <PaletteValidationSection
        chartMode="stacked"
        description="Lifecycle colors should communicate project maturity and progression without feeling like generic dashboard decoration."
        entries={lifecycleEntries}
        tableHeading="Project Phase"
        title="Lifecycle Palette"
      />

      <PaletteValidationSection
        chartMode="bars"
        description="Governance colors should communicate workflow state and review urgency without being confused with market lifecycle or technology categories."
        entries={governanceEntries}
        mapMode="none"
        tableHeading="Workflow State"
        title="Governance Palette"
      />

      <PaletteValidationSection
        chartMode="stacked"
        description="Technology colors should feel grounded in energy infrastructure, geology, heat, minerals, and geothermal systems."
        entries={technologyEntries}
        tableHeading="Technology"
        title="Technology Palette"
      />

      <PaletteValidationSection
        chartMode="bars"
        description="Signal colors should support a living market pulse: drilling, funding, permits, policy, commissioning, and M&A."
        entries={signalEntries}
        tableHeading="Signal Type"
        title="Signal Palette"
      />

      <PaletteValidationSection
        chartMode="stacked"
        description="Spatial colors should support density, clusters, intensity, and hotspots while keeping the map dominant."
        entries={spatialEntries}
        mapMode="intensity"
        tableHeading="Spatial Layer"
        title="Spatial Palette"
      />
    </main>
  );
}
