import {
  PageHeader,
  SectionHeader,
} from "@/components/design-system/TgeDesignSystem";
import {
  tgeSurfaces,
  tgeText,
  tgeToneClasses,
  tgeTypography,
  type TgeSemanticTone,
} from "@/lib/design-system";
import type { ReactNode } from "react";

const rankingRows = [
  ["Indonesia", "8.9 GW", 92, "pipeline"],
  ["Kenya", "3.7 GW", 76, "construction"],
  ["United States", "2.9 GW", 70, "pipeline"],
  ["Türkiye", "2.1 GW", 56, "feasibility"],
  ["Philippines", "0.9 GW", 34, "operating"],
] as const;

const lifecycleSegments = [
  ["Prospect / TBD", 18, "prospect"],
  ["Exploration", 25, "exploration"],
  ["Pre-Feasibility", 14, "pre_feasibility"],
  ["Feasibility", 15, "feasibility"],
  ["Construction", 10, "construction"],
  ["Operating", 18, "operating"],
] as const;

const trendSeries = [20, 26, 31, 38, 44, 49, 57, 63, 72, 81, 86, 92];

const signalRows = [
  ["Drilling", 84, "construction"],
  ["Funding", 68, "operating"],
  ["Permits", 54, "pipeline"],
  ["Activity", 72, "feasibility"],
] as const;

function ChartShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="bg-[var(--tge-surface-card)] p-5">
      <SectionHeader title={title} description={description} />
      <div className="mt-5">{children}</div>
    </section>
  );
}

function RankingBars() {
  return (
    <div className="space-y-4">
      {rankingRows.map(([label, value, width, tone], index) => (
        <div
          className="grid grid-cols-[32px_120px_1fr_72px] items-center gap-3 text-sm"
          key={label}
        >
          <div className={`${tgeTypography.metadata} text-right`}>{index + 1}</div>
          <div className={`font-bold ${tgeText.primary}`}>{label}</div>
          <div className="h-7 bg-[var(--tge-governance-neutral-bg)]">
            <div
              className={`flex h-7 items-center justify-end pr-2 text-[10px] font-bold text-[var(--tge-surface-card)] ${tgeToneClasses[tone as TgeSemanticTone].bar}`}
              style={{ width: `${width}%` }}
            >
              {width >= 42 ? value : ""}
            </div>
          </div>
          <div className={`text-right font-bold ${tgeText.primary}`}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function LifecyclePipeline() {
  return (
    <div className="space-y-4">
      <div className="flex h-10 overflow-hidden bg-[var(--tge-governance-neutral-bg)]">
        {lifecycleSegments.map(([label, width, tone]) => (
          <div
            className={`flex items-center justify-center px-2 text-[10px] font-bold text-[var(--tge-surface-card)] ${tgeToneClasses[tone as TgeSemanticTone].bar}`}
            key={label}
            style={{ width: `${width}%` }}
            title={label}
          >
            {width >= 14 ? label : ""}
          </div>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {lifecycleSegments.map(([label, width, tone]) => (
          <div className="bg-[var(--tge-surface-subtle)] p-3" key={label}>
            <div className={`h-2 w-14 ${tgeToneClasses[tone as TgeSemanticTone].bar}`} />
            <div className={`${tgeTypography.subsectionTitle} mt-3 ${tgeText.primary}`}>
              {label}
            </div>
            <div className={tgeTypography.metadata}>{width}% pipeline mix</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendChart() {
  const max = Math.max(...trendSeries);
  const min = Math.min(...trendSeries);
  const range = max - min || 1;
  const points = trendSeries
    .map((point, index) => {
      const x = 28 + (index / (trendSeries.length - 1)) * 424;
      const y = 192 - ((point - min) / range) * 144;
      return `${x},${y}`;
    })
    .join(" ");
  const area = `28,192 ${points} 452,192`;

  return (
    <svg className="h-[240px] w-full" viewBox="0 0 480 220">
      {[48, 84, 120, 156, 192].map((y) => (
        <line
          key={y}
          stroke="var(--tge-governance-neutral-border)"
          strokeWidth="1"
          x1="28"
          x2="452"
          y1={y}
          y2={y}
        />
      ))}
      <polygon fill="var(--tge-governance-success-bg)" points={area} />
      <polyline
        fill="none"
        points={points}
        stroke="var(--tge-brand-green-dark)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
      />
      {trendSeries.map((point, index) => {
        const x = 28 + (index / (trendSeries.length - 1)) * 424;
        const y = 192 - ((point - min) / range) * 144;
        return (
          <circle
            cx={x}
            cy={y}
            fill="var(--tge-surface-card)"
            key={`${point}-${index}`}
            r="4"
            stroke="var(--tge-brand-green-dark)"
            strokeWidth="2"
          />
        );
      })}
    </svg>
  );
}

function SignalChart() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {signalRows.map(([label, value, tone]) => (
        <div className="bg-[var(--tge-surface-subtle)] p-4" key={label}>
          <div className={`${tgeTypography.tableHeader} ${tgeText.muted}`}>{label}</div>
          <div className={`${tgeTypography.pageTitle} mt-2 ${tgeText.primary}`}>{value}</div>
          <div className="mt-4 h-24 bg-[var(--tge-governance-neutral-bg)]">
            <div
              className={`mt-auto ${tgeToneClasses[tone as TgeSemanticTone].bar}`}
              style={{ height: `${value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SpatialPreview() {
  const clusters = [
    ["left-[18%] top-[34%]", "operating", "h-20 w-20"],
    ["left-[41%] top-[48%]", "construction", "h-28 w-28"],
    ["left-[62%] top-[32%]", "pipeline", "h-32 w-32"],
    ["left-[78%] top-[65%]", "exploration", "h-16 w-16"],
  ] as const;

  return (
    <div className="relative h-[360px] overflow-hidden bg-[var(--tge-concept-map-land)]">
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <path
          d="M8 38 C26 24, 42 45, 62 31 C74 24, 84 39, 94 32"
          fill="none"
          opacity="0.36"
          stroke="var(--tge-brand-green-dark)"
          strokeLinecap="round"
          strokeWidth="1.4"
        />
        <path
          d="M16 72 C34 58, 46 51, 63 62 C76 71, 86 58, 95 51"
          fill="none"
          opacity="0.34"
          stroke="var(--tge-governance-info-text)"
          strokeLinecap="round"
          strokeWidth="1.4"
        />
      </svg>
      {clusters.map(([position, tone, size]) => (
        <div
          className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 ${position} ${size} ${tgeToneClasses[tone].bar}`}
          key={position}
        />
      ))}
      <div className="absolute left-4 top-4 bg-[var(--tge-surface-card)] p-4">
        <div className={tgeTypography.pageLabel}>Spatial Intelligence</div>
        <div className={`${tgeTypography.sectionTitle} mt-1 ${tgeText.primary}`}>
          Activity intensity and clusters
        </div>
        <p className={`${tgeTypography.metadata} mt-1 max-w-xs`}>
          Map overlays should communicate capacity, pipeline, signals, and market movement.
        </p>
      </div>
    </div>
  );
}

export default function ChartLanguagePage() {
  return (
    <main className="space-y-10">
      <PageHeader
        label="Chart Language v1"
        title="Intelligence visualizations before dashboard rollout"
        description="Charts should be clean, premium, semantic, and consistent across Dashboard, Markets, Analysis, Projects, Plants, Companies, and Map Explorer."
        variant="brief"
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartShell
          title="A. Ranking Bars"
          description="Use for countries, markets, developers, owners, operators, and technologies."
        >
          <RankingBars />
        </ChartShell>

        <ChartShell
          title="B. Lifecycle Pipeline"
          description="Use fixed lifecycle order and consistent phase color."
        >
          <LifecyclePipeline />
        </ChartShell>

        <ChartShell
          title="C. Capacity Trend"
          description="Use only when real time-series data exists. Trend charts carry movement; KPI cards do not."
        >
          <TrendChart />
        </ChartShell>

        <ChartShell
          title="D. Signal Charts"
          description="Use for drilling, funding, permits, construction, commissioning, and company activity."
        >
          <SignalChart />
        </ChartShell>
      </div>

      <section className="space-y-4">
        <SectionHeader
          title="E. Spatial Intelligence"
          description="The map should become a market-intensity layer, not a record locator."
        />
        <div className={tgeSurfaces.panel}>
          <SpatialPreview />
        </div>
      </section>
    </main>
  );
}
