import {
  KPIStat,
  KPIStrip,
  MarketSignalCard,
  PageHeader,
  SectionHeader,
  StatusBadge,
} from "@/components/design-system/TgeDesignSystem";
import {
  tgeBrandIdentity,
  tgeSurfaces,
  tgeText,
  tgeToneClasses,
  tgeTypography,
  type TgeSemanticTone,
} from "@/lib/design-system";
import type { ReactNode } from "react";

function MiniRanking() {
  const rows = [
    ["Indonesia", "8.9 GW", 92, "pipeline"],
    ["Kenya", "3.7 GW", 76, "construction"],
    ["United States", "2.9 GW", 70, "pipeline"],
  ] as const;

  return (
    <div className="space-y-3">
      {rows.map(([market, value, width, tone]) => (
        <div className="grid grid-cols-[96px_1fr_64px] items-center gap-3 text-sm" key={market}>
          <div className={`font-bold ${tgeText.primary}`}>{market}</div>
          <div className="h-6 bg-[var(--tge-governance-neutral-bg)]">
            <div
              className={`h-6 ${tgeToneClasses[tone as TgeSemanticTone].bar}`}
              style={{ width: `${width}%` }}
            />
          </div>
          <div className={`text-right font-bold ${tgeText.primary}`}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function LayoutLayer({
  label,
  title,
  description,
  children,
  emphasis = "standard",
}: {
  label: string;
  title: string;
  description: string;
  children: ReactNode;
  emphasis?: "primary" | "standard" | "quiet";
}) {
  return (
    <section
      className={
        emphasis === "primary"
          ? "bg-[var(--tge-surface-card)] p-6"
          : emphasis === "quiet"
            ? "bg-[var(--tge-surface-subtle)] p-5"
            : "bg-[var(--tge-surface-card)] p-5"
      }
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className={tgeTypography.pageLabel}>{label}</div>
          <h2
            className={
              emphasis === "primary"
                ? `${tgeTypography.intelligenceHeadline} mt-2 ${tgeText.primary}`
                : `${tgeTypography.sectionTitle} mt-1 ${tgeText.primary}`
            }
          >
            {title}
          </h2>
          <p className={`${tgeTypography.body} mt-2 max-w-3xl ${tgeText.secondary}`}>
            {description}
          </p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function DashboardMapPreview() {
  return (
    <div className="relative min-h-[360px] overflow-hidden bg-[var(--tge-concept-map-land)]">
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <path
          d="M6 35 C22 24, 39 44, 57 30 C70 20, 82 35, 94 28"
          fill="none"
          opacity="0.34"
          stroke="var(--tge-brand-green-dark)"
          strokeLinecap="round"
          strokeWidth="1.4"
        />
        <path
          d="M16 74 C34 58, 49 54, 64 63 C78 72, 86 58, 95 51"
          fill="none"
          opacity="0.36"
          stroke="var(--tge-governance-info-text)"
          strokeLinecap="round"
          strokeWidth="1.4"
        />
      </svg>
      {[
        ["left-[21%] top-[36%]", "operating", "h-24 w-24"],
        ["left-[50%] top-[42%]", "pipeline", "h-36 w-36"],
        ["left-[72%] top-[64%]", "construction", "h-20 w-20"],
      ].map(([position, tone, size]) => (
        <div
          className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 ${position} ${size} ${tgeToneClasses[tone as TgeSemanticTone].bar}`}
          key={position}
        />
      ))}
      <div className="absolute bottom-4 left-4 right-4 grid gap-2 md:grid-cols-3">
        {[
          ["Operating Density", "17.4 GW"],
          ["Pipeline Clusters", "38.2 GW"],
          ["New Signals", "42"],
        ].map(([label, value]) => (
          <div className="bg-[var(--tge-surface-card)] p-3" key={label}>
            <div className={tgeTypography.tableHeader}>{label}</div>
            <div className={`${tgeTypography.subsectionTitle} mt-1 ${tgeText.primary}`}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardLayoutExplorationPage() {
  return (
    <main className="space-y-10">
      <PageHeader
        label="Dashboard Layout Exploration v1"
        title="Visible hierarchy for a morning market command center"
        description="This concept tests whether the hierarchy is visible without relying on explanatory text: intelligence first, analysis second, entities third, governance fourth."
        variant="brief"
      />

      <LayoutLayer
        description="The first screen should answer what changed, where it happened, and why it matters."
        emphasis="primary"
        label="Primary Layer / Market Intelligence"
        title="Geothermal activity accelerated in 18 markets."
      >
        <div className="grid gap-6 xl:grid-cols-[1fr_0.82fr]">
          <div>
            <KPIStrip columns="three">
              <KPIStat
                context="confirmed"
                delta="+312 MW"
                label="Operating Capacity"
                size="large"
                tone="operating"
                unit="GW"
                value="17.4"
              />
              <KPIStat
                context="active movement"
                delta="+1.1 GW"
                label="Pipeline Capacity"
                size="large"
                tone="pipeline"
                unit="GW"
                value="38.2"
              />
              <KPIStat
                context="new market signals"
                delta="+42"
                label="Signal Pulse"
                size="large"
                tone="construction"
                value="18"
              />
            </KPIStrip>
            <div className="mt-6">
              <SectionHeader
                title="Markets To Watch"
                description="This block should feel like discovery, not administration."
              />
              <div className="mt-4">
                <MiniRanking />
              </div>
            </div>
          </div>
          <DashboardMapPreview />
        </div>
      </LayoutLayer>

      <LayoutLayer
        description="Charts, comparisons, trends, and rankings become the second layer."
        label="Secondary Layer / Analysis and Trends"
        title="Trend surfaces explain market movement"
      >
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-[var(--tge-surface-subtle)] p-4">
            <div className={tgeTypography.subsectionTitle}>Capacity Growth Trajectory</div>
            <svg className="mt-4 h-[220px] w-full" viewBox="0 0 480 220">
              <path
                d="M28 180 C88 158, 124 166, 168 130 C220 88, 262 112, 308 76 C360 36, 404 54, 452 28"
                fill="none"
                stroke="var(--tge-brand-green-dark)"
                strokeLinecap="round"
                strokeWidth="4"
              />
              {[60, 100, 140, 180].map((y) => (
                <line
                  key={y}
                  stroke="var(--tge-governance-neutral-border)"
                  x1="28"
                  x2="452"
                  y1={y}
                  y2={y}
                />
              ))}
            </svg>
          </div>
          <div className="bg-[var(--tge-surface-subtle)] p-4">
            <div className={tgeTypography.subsectionTitle}>Signal Strength</div>
            <div className="mt-4 space-y-4">
              {[
                ["Drilling", 84, "construction"],
                ["Funding", 68, "operating"],
                ["Permits", 54, "pipeline"],
                ["Commissioning", 42, "feasibility"],
              ].map(([label, value, tone]) => (
                <div className="grid grid-cols-[96px_1fr_44px] items-center gap-3" key={label}>
                  <div className={tgeTypography.metadata}>{label}</div>
                  <div className="h-5 bg-[var(--tge-governance-neutral-bg)]">
                    <div
                      className={`h-5 ${tgeToneClasses[tone as TgeSemanticTone].bar}`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <div className={`text-right text-sm font-bold ${tgeText.primary}`}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </LayoutLayer>

      <LayoutLayer
        description="Entities are accessible as drilldowns, but they do not visually lead the dashboard."
        emphasis="quiet"
        label="Third Layer / Entities"
        title="Projects, Plants, and Companies"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Projects", "Pipeline intelligence", "pipeline"],
            ["Plants", "Operating fleet intelligence", "operating"],
            ["Companies", "Ecosystem intelligence", "governance"],
          ].map(([title, description, tone]) => (
            <div className="bg-[var(--tge-surface-card)] p-4" key={title}>
              <StatusBadge tone={tone as TgeSemanticTone}>{title}</StatusBadge>
              <div className={`${tgeTypography.subsectionTitle} mt-4 ${tgeText.primary}`}>
                {description}
              </div>
            </div>
          ))}
        </div>
      </LayoutLayer>

      <LayoutLayer
        description="Evidence and governance support confidence, but remain visually subordinate to market intelligence."
        emphasis="quiet"
        label="Fourth Layer / Evidence and Governance"
        title="Trust, review, and operational readiness"
      >
        <div className="grid gap-3">
          <MarketSignalCard
            category="Evidence"
            impact="Source-backed confidence supports subscriber-facing intelligence."
            market="Evidence Backbone"
            strength={71}
            title="Priority records are source-backed"
            tone="evidence"
          />
          <MarketSignalCard
            category="Governance"
            impact="Research Ops receives action, but does not dominate the executive dashboard."
            market="Research Ops"
            strength={42}
            title="Open review queues remain below the market surface"
            tone="governance"
          />
        </div>
      </LayoutLayer>
    </main>
  );
}
