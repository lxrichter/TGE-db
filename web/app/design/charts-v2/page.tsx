import type { ReactNode } from "react";
import {
  PageHeader,
  SectionHeader,
  StatusBadge,
} from "@/components/design-system/TgeDesignSystem";
import {
  tgeChartLanguageV2,
  tgeChartTaxonomy,
  tgeSurfaces,
  tgeText,
  tgeTypography,
} from "@/lib/design-system";

const installedCapacityRows = [
  ["Indonesia", "2,744 MWe", 94],
  ["United States", "2,587 MWe", 89],
  ["Philippines", "1,928 MWe", 66],
  ["Türkiye", "1,691 MWe", 58],
  ["Kenya", "985 MWe", 34],
] as const;

const pipelineRows = [
  ["Indonesia", "8.9 GW", 92],
  ["Kenya", "3.7 GW", 76],
  ["United States", "2.9 GW", 70],
  ["Türkiye", "2.1 GW", 56],
  ["Philippines", "0.9 GW", 34],
] as const;

const incorrectRankingRows = [
  ["Indonesia", "2,744 MWe", 94, "var(--tge-chart-tech-single-flash)"],
  ["United States", "2,587 MWe", 89, "var(--tge-chart-signal-permits)"],
  ["Philippines", "1,928 MWe", 66, "var(--tge-chart-governance-ai-candidate)"],
  ["Türkiye", "1,691 MWe", 58, "var(--tge-chart-lifecycle-construction)"],
] as const;

const technologyMix = [
  ["Flash", 38, "var(--tge-chart-tech-single-flash)"],
  ["Binary ORC", 28, "var(--tge-chart-tech-binary-orc)"],
  ["Dry Steam", 14, "var(--tge-chart-tech-dry-steam)"],
  ["Direct Use", 12, "var(--tge-chart-tech-direct-use)"],
  ["Other", 8, "var(--tge-chart-tech-other)"],
] as const;

const signalSeries = [
  ["Drilling", 78, "var(--tge-chart-signal-drilling)"],
  ["Funding", 52, "var(--tge-chart-signal-funding)"],
  ["Permits", 64, "var(--tge-chart-signal-permits)"],
  ["Policy", 43, "var(--tge-chart-signal-policy)"],
  ["Commissioning", 36, "var(--tge-chart-signal-commissioning)"],
  ["M&A", 29, "var(--tge-chart-signal-ma)"],
] as const;

function ChartPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className={`${tgeSurfaces.card} p-5`}>
      <SectionHeader title={title} description={description} />
      <div className="mt-5">{children}</div>
    </section>
  );
}

function PaletteGrid({
  title,
  description,
  entries,
}: {
  title: string;
  description: string;
  entries: ReadonlyArray<{
    key: string;
    label: string;
    cssVar: string;
    hex: string;
    usage: string;
  }>;
}) {
  return (
    <section className="space-y-4">
      <SectionHeader title={title} description={description} />
      <div className="grid gap-px overflow-hidden border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-border)] md:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry) => (
          <article className="bg-[var(--tge-surface-card)] p-4" key={entry.key}>
            <div
              className="h-2 w-24"
              style={{ backgroundColor: entry.cssVar }}
            />
            <div className={`${tgeTypography.subsectionTitle} mt-3 ${tgeText.primary}`}>
              {entry.label}
            </div>
            <div className={`${tgeTypography.metadata} mt-1 font-mono`}>
              {entry.hex}
            </div>
            <p className={`${tgeTypography.metadata} mt-2`}>{entry.usage}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function RankingBars({
  rows,
  color,
}: {
  rows: ReadonlyArray<readonly [string, string, number]>;
  color: string;
}) {
  return (
    <div className="space-y-3">
      {rows.map(([label, value, width], index) => (
        <div
          className="grid grid-cols-[28px_minmax(110px,150px)_1fr_86px] items-center gap-3"
          key={label}
        >
          <div className={`${tgeTypography.metadata} text-right`}>{index + 1}</div>
          <div className={`${tgeTypography.bodyStrong} truncate ${tgeText.primary}`}>
            {label}
          </div>
          <div className="h-7 bg-[var(--tge-governance-neutral-bg)]">
            <div
              className="flex h-7 items-center justify-end px-2 text-[11px] font-bold text-[var(--tge-surface-card)]"
              style={{ backgroundColor: color, width: `${width}%` }}
            >
              {width > 44 ? value : ""}
            </div>
          </div>
          <div className={`${tgeTypography.bodyStrong} text-right ${tgeText.primary}`}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

function IncorrectRankingBars() {
  return (
    <div className="space-y-3">
      {incorrectRankingRows.map(([label, value, width, color], index) => (
        <div
          className="grid grid-cols-[28px_minmax(110px,150px)_1fr_86px] items-center gap-3"
          key={label}
        >
          <div className={`${tgeTypography.metadata} text-right`}>{index + 1}</div>
          <div className={`${tgeTypography.bodyStrong} truncate ${tgeText.primary}`}>
            {label}
          </div>
          <div className="h-7 bg-[var(--tge-governance-neutral-bg)]">
            <div
              className="h-7"
              style={{ backgroundColor: color, width: `${width}%` }}
            />
          </div>
          <div className={`${tgeTypography.bodyStrong} text-right ${tgeText.primary}`}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

function LifecycleStack() {
  const entries = tgeChartLanguageV2.lifecycle.filter(
    (entry) => entry.key !== "cancelled"
  );
  const widths = [12, 24, 18, 17, 13, 16];

  return (
    <div className="space-y-5">
      <div className="flex h-12 overflow-hidden bg-[var(--tge-governance-neutral-bg)]">
        {entries.map((entry, index) => (
          <div
            className="flex items-center justify-center px-2 text-[10px] font-bold uppercase tracking-wide text-[var(--tge-surface-card)]"
            key={entry.key}
            style={{
              backgroundColor: entry.cssVar,
              color: entry.key === "prospect" ? "var(--tge-text-primary)" : undefined,
              width: `${widths[index]}%`,
            }}
            title={entry.label}
          >
            {widths[index] >= 13 ? entry.label : ""}
          </div>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {entries.map((entry) => (
          <div className="bg-[var(--tge-surface-subtle)] p-3" key={entry.key}>
            <div className="h-2 w-16" style={{ backgroundColor: entry.cssVar }} />
            <div className={`${tgeTypography.subsectionTitle} mt-3 ${tgeText.primary}`}>
              {entry.label}
            </div>
            <p className={tgeTypography.metadata}>{entry.hex}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompositionChart() {
  return (
    <div className="space-y-5">
      <div className="flex h-12 overflow-hidden bg-[var(--tge-governance-neutral-bg)]">
        {technologyMix.map(([label, width, color]) => (
          <div
            className="flex items-center justify-center px-2 text-[10px] font-bold uppercase tracking-wide text-[var(--tge-surface-card)]"
            key={label}
            style={{ backgroundColor: color, width: `${width}%` }}
            title={label}
          >
            {width >= 12 ? label : ""}
          </div>
        ))}
      </div>
      <div className="grid gap-2 md:grid-cols-5">
        {technologyMix.map(([label, width, color]) => (
          <div className="bg-[var(--tge-surface-subtle)] p-3" key={label}>
            <div className="h-2 w-12" style={{ backgroundColor: color }} />
            <div className={`${tgeTypography.subsectionTitle} mt-3 ${tgeText.primary}`}>
              {width}%
            </div>
            <p className={tgeTypography.metadata}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SignalBars() {
  return (
    <div className="grid gap-3 md:grid-cols-6">
      {signalSeries.map(([label, value, color]) => (
        <div
          className="flex min-h-[180px] flex-col justify-between bg-[var(--tge-surface-subtle)] p-3"
          key={label}
        >
          <div>
            <div className={`${tgeTypography.tableHeader} ${tgeText.muted}`}>{label}</div>
            <div className={`${tgeTypography.sectionTitle} mt-2 ${tgeText.primary}`}>
              {value}
            </div>
          </div>
          <div className="flex h-24 items-end bg-[var(--tge-governance-neutral-bg)]">
            <div
              className="w-full"
              style={{ backgroundColor: color, height: `${value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SpatialIntensity() {
  const levels = tgeChartLanguageV2.spatial;

  return (
    <div className="relative min-h-[340px] overflow-hidden bg-[var(--tge-concept-map-land)] p-5">
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <path
          d="M5 38 C20 24, 42 46, 58 28 C74 13, 84 38, 96 29"
          fill="none"
          opacity="0.32"
          stroke="var(--tge-brand-green-dark)"
          strokeLinecap="round"
          strokeWidth="1.3"
        />
        <path
          d="M11 72 C30 60, 43 48, 61 61 C77 75, 88 55, 98 50"
          fill="none"
          opacity="0.26"
          stroke="var(--tge-chart-ranking-pipeline-capacity)"
          strokeLinecap="round"
          strokeWidth="1.3"
        />
      </svg>
      <div
        className="absolute left-[18%] top-[42%] h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60"
        style={{ backgroundColor: levels[0].cssVar }}
      />
      <div
        className="absolute left-[43%] top-[54%] h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50"
        style={{ backgroundColor: levels[1].cssVar }}
      />
      <div
        className="absolute left-[65%] top-[38%] h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-42"
        style={{ backgroundColor: levels[2].cssVar }}
      />
      <div
        className="absolute left-[78%] top-[65%] h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-55"
        style={{ backgroundColor: levels[3].cssVar }}
      />
      <div className="relative max-w-sm bg-[var(--tge-surface-card)] p-4">
        <div className={tgeTypography.pageLabel}>Spatial Intelligence</div>
        <h3 className={`${tgeTypography.sectionTitle} mt-2 ${tgeText.primary}`}>
          Density first, category second
        </h3>
        <p className={`${tgeTypography.metadata} mt-2`}>
          Map overlays should show capacity concentration, pipeline clusters,
          activity intensity, and market hotspots rather than assigning random
          colors to nearby records.
        </p>
      </div>
    </div>
  );
}

export default function ChartLanguageV2Page() {
  return (
    <main className="space-y-10">
      <PageHeader
        label="Chart Language V2"
        title="Semantic chart language before page rollout"
        description="This freeze candidate defines how color, chart type, and intelligence hierarchy should behave across Dashboard, Markets, Analysis, Projects, Plants, Companies, Reports, and Map Explorer."
        variant="brief"
      />

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-[var(--tge-surface-card)] p-6">
          <div className={tgeTypography.pageLabel}>Core Principle</div>
          <h2 className={`${tgeTypography.intelligenceHeadline} mt-3 ${tgeText.primary}`}>
            Color carries meaning.
          </h2>
          <p className={`${tgeTypography.body} mt-4 ${tgeText.secondary}`}>
            Charts should teach users a stable visual language over time. The
            same market concept must look the same in charts, maps, tables,
            badges, reports, and dashboards.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <StatusBadge tone="brand">Same metric, same color</StatusBadge>
            <StatusBadge tone="governance">No decorative rainbow charts</StatusBadge>
            <StatusBadge tone="ai">Category colors only when categories differ</StatusBadge>
          </div>
        </div>
        <div className="grid gap-px border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-border)] md:grid-cols-2">
          {tgeChartTaxonomy.map((item) => (
            <article className="bg-[var(--tge-surface-card)] p-4" key={item.key}>
              <div className={`${tgeTypography.subsectionTitle} ${tgeText.primary}`}>
                {item.label}
              </div>
              <p className={`${tgeTypography.body} mt-2 ${tgeText.secondary}`}>
                {item.rule}
              </p>
              <p className={`${tgeTypography.metadata} mt-3`}>{item.examples}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Correct vs Incorrect Ranking Logic"
          description="Ranking charts compare one metric. Rows should not receive different colors unless they represent different categories."
        />
        <div className="grid gap-6 xl:grid-cols-2">
          <ChartPanel
            title="Correct: Installed capacity ranking"
            description="All bars use the installed-capacity color because every row represents installed MWe."
          >
            <RankingBars
              color={tgeChartLanguageV2.ranking[0].cssVar}
              rows={installedCapacityRows}
            />
          </ChartPanel>
          <ChartPanel
            title="Incorrect: Same metric, many colors"
            description="This creates false meaning. These colors imply categories that do not exist."
          >
            <IncorrectRankingBars />
          </ChartPanel>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartPanel
          title="Ranking Chart: Pipeline capacity"
          description="A different metric can use a different stable color, but the rows still stay consistent."
        >
          <RankingBars
            color={tgeChartLanguageV2.ranking[1].cssVar}
            rows={pipelineRows}
          />
        </ChartPanel>
        <ChartPanel
          title="Lifecycle Chart: Project pipeline"
          description="Project stages use a maturity progression palette in a fixed order."
        >
          <LifecycleStack />
        </ChartPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartPanel
          title="Composition Chart: Technology mix"
          description="Composition charts use the category palette because the colors represent different geothermal technologies."
        >
          <CompositionChart />
        </ChartPanel>
        <ChartPanel
          title="Signal Chart: Market pulse"
          description="Signal colors are reserved for market events such as drilling, funding, permits, policy, commissioning, and M&A."
        >
          <SignalBars />
        </ChartPanel>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Spatial Intelligence"
          description="Maps should prioritize density, clusters, intensity, and market movement. Use categorical marker colors only when category comparison is the task."
        />
        <SpatialIntensity />
      </section>

      <PaletteGrid
        description="Use for installed capacity, pipeline capacity, neutral counts, and attributed-MW rankings. Single metric charts use one color."
        entries={tgeChartLanguageV2.ranking}
        title="Ranking Palette"
      />
      <PaletteGrid
        description="Use for project pipeline and development maturity. This is a progression palette and should remain stable everywhere."
        entries={tgeChartLanguageV2.lifecycle}
        title="Lifecycle Palette"
      />
      <PaletteGrid
        description="Use only for validation, approval, rejection, AI candidates, blockers, and review workflows. Do not use governance colors for market categories."
        entries={tgeChartLanguageV2.governance}
        title="Governance Workflow Palette"
      />
      <PaletteGrid
        description="Use for turbine technology analysis, technology mix, country technology splits, market reports, and map technology overlays."
        entries={tgeChartLanguageV2.technology}
        title="Technology Palette"
      />
      <PaletteGrid
        description="Use for living market pulse and event-category charts. Signal colors communicate market movement, not record status."
        entries={tgeChartLanguageV2.signal}
        title="Signal Palette"
      />
      <PaletteGrid
        description="Use for heatmaps, map overlays, activity clusters, capacity density, and spatial market intensity."
        entries={tgeChartLanguageV2.spatial}
        title="Spatial Intensity Palette"
      />
    </main>
  );
}
