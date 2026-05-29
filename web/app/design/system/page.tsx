import {
  ChartContainer,
  EntityTable,
  FilterBar,
  GovernanceTable,
  IntelligenceCard,
  KPIStat,
  KPIStrip,
  LifecycleBadge,
  MarketSignalCard,
  PageHeader,
  RankingTable,
  SectionHeader,
  StatusBadge,
} from "@/components/design-system/TgeDesignSystem";
import {
  tgeLifecycleOrder,
  tgeSpacing,
  tgeSurfaces,
  tgeText,
  tgeToneClasses,
  tgeTypography,
  type TgeSemanticTone,
} from "@/lib/design-system";
import type { ReactNode } from "react";

const semanticTones: Array<[TgeSemanticTone, string, string]> = [
  ["brand", "Brand Green", "Primary actions and selected navigation"],
  ["operating", "Operating", "Operating capacity and approved states"],
  ["pipeline", "Pipeline", "Development pipeline and active projects"],
  ["prospect", "Prospect", "Early-stage or TBD projects"],
  ["exploration", "Exploration", "Exploration phase"],
  ["pre_feasibility", "Pre-Feasibility", "Pre-feasibility phase"],
  ["feasibility", "Feasibility", "Feasibility phase"],
  ["construction", "Construction", "Construction and near-term activity"],
  ["review", "Review", "Needs review or attention"],
  ["danger", "Danger", "Rejected, blocker, or cancelled"],
  ["governance", "Governance", "Administrative support layer"],
  ["evidence", "Evidence", "Source-backed confidence"],
  ["ai", "AI", "AI candidate or suggestion"],
];

const entityColumns = [
  { key: "name", label: "Project" },
  { key: "country", label: "Country" },
  { key: "phase", label: "Phase" },
  { key: "capacity", label: "MWe", align: "right" as const },
  { key: "status", label: "Status" },
];

const entityRows = [
  {
    name: <span className="font-bold text-[var(--tge-text-primary)]">Abaya</span>,
    country: "Ethiopia",
    phase: <LifecycleBadge phase="Exploration" />,
    capacity: "150.0",
    status: <StatusBadge tone="review">Needs Evidence</StatusBadge>,
  },
  {
    name: <span className="font-bold text-[var(--tge-text-primary)]">Hellisheidi Stage 1</span>,
    country: "Iceland",
    phase: <LifecycleBadge phase="Operating" />,
    capacity: "90.0",
    status: <StatusBadge tone="evidence">Source Backed</StatusBadge>,
  },
];

const governanceColumns = [
  { key: "source", label: "Source" },
  { key: "candidate", label: "Candidate Value" },
  { key: "confidence", label: "Confidence" },
  { key: "review", label: "Review" },
];

const governanceRows = [
  {
    source: "TGE article",
    candidate: "Commissioning activity update",
    confidence: <StatusBadge tone="evidence">High</StatusBadge>,
    review: <StatusBadge tone="review">Needs Review</StatusBadge>,
  },
  {
    source: "Company release",
    candidate: "Installed capacity change",
    confidence: <StatusBadge tone="review">Medium</StatusBadge>,
    review: <StatusBadge tone="operating">Confirmed</StatusBadge>,
  },
];

const rankingColumns = [
  { key: "rank", label: "#", align: "right" as const },
  { key: "market", label: "Market" },
  { key: "operating", label: "Operating MWe", align: "right" as const },
  { key: "pipeline", label: "Pipeline MWe", align: "right" as const },
  { key: "share", label: "Pipeline Share" },
];

const rankingRows = [
  {
    rank: "1",
    market: <span className="font-bold text-[var(--tge-text-primary)]">Indonesia</span>,
    operating: "2,408",
    pipeline: "8,900",
    share: <BarPreview tone="pipeline" width={92} />,
  },
  {
    rank: "2",
    market: <span className="font-bold text-[var(--tge-text-primary)]">Kenya</span>,
    operating: "986",
    pipeline: "3,720",
    share: <BarPreview tone="construction" width={76} />,
  },
];

function BarPreview({
  tone,
  width,
}: {
  tone: TgeSemanticTone;
  width: number;
}) {
  return (
    <div className="h-4 bg-[var(--tge-governance-neutral-bg)]">
      <div className={`h-4 ${tgeToneClasses[tone].bar}`} style={{ width: `${width}%` }}>
        &nbsp;
      </div>
    </div>
  );
}

function DesignSection({
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
      {children}
    </section>
  );
}

export default function DesignSystemPreviewPage() {
  return (
    <main className={tgeSpacing.page}>
      <PageHeader
        label="Design System"
        title="TGE Intelligence Platform Foundation"
        description="Non-production preview of the platform typography, color, KPI, card, table, badge, spacing, and chart language before broad rollout."
        variant="brief"
      />

      <DesignSection
        title="Typography"
        description="The platform uses compact, confident typography. Page titles orient; intelligence headlines are reserved for briefing moments."
      >
        <div className={`${tgeSurfaces.card} p-5`}>
          <div className={tgeTypography.pageLabel}>Page Label</div>
          <div className={`${tgeTypography.pageTitle} ${tgeText.primary}`}>
            Dashboard / Markets / Projects
          </div>
          <div className={`${tgeTypography.intelligenceHeadline} mt-5 ${tgeText.primary}`}>
            Geothermal activity accelerated in 18 markets.
          </div>
          <div className={`${tgeTypography.sectionTitle} mt-5 ${tgeText.primary}`}>
            Regional Momentum
          </div>
          <div className={`${tgeTypography.subsectionTitle} mt-3 ${tgeText.primary}`}>
            Operating Capacity
          </div>
          <p className={`${tgeTypography.body} mt-3 max-w-3xl ${tgeText.secondary}`}>
            Body text should remain readable during long research sessions while
            avoiding excessive explanation on live product pages.
          </p>
          <div className={`${tgeTypography.metadata} mt-3`}>
            Metadata, labels, source hints, and compact governance context.
          </div>
        </div>
      </DesignSection>

      <DesignSection
        title="Semantic Color"
        description="Color is semantic, not decorative. Use white surfaces and small, intentional color accents."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {semanticTones.map(([tone, label, description]) => (
            <div
              className={`${tgeSurfaces.card} border-l-4 p-4 ${tgeToneClasses[tone].accent}`}
              key={tone}
            >
              <div className={`h-3 w-16 ${tgeToneClasses[tone].bar}`} />
              <div className={`${tgeTypography.subsectionTitle} mt-3 ${tgeText.primary}`}>
                {label}
              </div>
              <p className={`${tgeTypography.metadata} mt-1`}>{description}</p>
            </div>
          ))}
        </div>
      </DesignSection>

      <DesignSection
        title="KPI Standards"
        description="KPI cards are compact summaries. They should not become decorative chart widgets."
      >
        <KPIStrip>
          <KPIStat
            context="confirmed installed capacity"
            delta="+312 MW"
            label="Operating Capacity"
            size="large"
            tone="operating"
            unit="GW"
            value="17.4"
          />
          <KPIStat
            context="development capacity"
            delta="+1.1 GW"
            label="Pipeline Capacity"
            size="large"
            tone="pipeline"
            unit="GW"
            value="38.2"
          />
          <KPIStat
            context="countries with signal"
            label="Active Markets"
            size="medium"
            tone="brand"
            value="102"
          />
          <KPIStat
            context="source-backed priority items"
            label="Evidence Coverage"
            size="small"
            tone="evidence"
            value="71%"
          />
        </KPIStrip>
      </DesignSection>

      <DesignSection
        title="Cards"
        description="Cards separate intelligence, market summaries, and governance. Governance cards stay visually quieter."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <IntelligenceCard
            description="Market signal cards summarize what changed and where the user should investigate next."
            label="Intelligence"
            meta="Signal"
            title="Tender activity strengthens Indonesia pipeline watch"
            tone="pipeline"
          />
          <IntelligenceCard
            description="Country and regional cards should prioritize operating MWe, pipeline MWe, and signal state."
            label="Market Summary"
            meta="Market"
            title="Kenya"
            tone="construction"
          />
          <IntelligenceCard
            description="Governance cards support confidence and review work without taking over the intelligence surface."
            label="Governance"
            meta="QA"
            title="Source gaps require review"
            tone="governance"
          />
        </div>
      </DesignSection>

      <DesignSection
        title="Market Signals"
        description="Signal cards should feel like a living intelligence feed, with market impact more important than internal workflow."
      >
        <div className="grid gap-3">
          <MarketSignalCard
            category="Drilling"
            impact="Pipeline visibility increased"
            market="Kenya"
            strength={88}
            title="Rift Valley drilling campaign advances development cluster"
            tone="construction"
          />
          <MarketSignalCard
            category="Financing"
            impact="Emerging technology signal"
            market="United States"
            strength={72}
            title="Private capital strengthens next-generation geothermal outlook"
            tone="operating"
          />
        </div>
      </DesignSection>

      <DesignSection
        title="Badges"
        description="Badges communicate controlled meaning. Keep them short, semantic, and secondary to the main intelligence."
      >
        <div className={`${tgeSurfaces.card} flex flex-wrap gap-2 p-4`}>
          {tgeLifecycleOrder.map((phase) => (
            <LifecycleBadge key={phase} phase={phase} />
          ))}
          <StatusBadge tone="evidence">Source Backed</StatusBadge>
          <StatusBadge tone="review">Needs Review</StatusBadge>
          <StatusBadge tone="danger">Rejected</StatusBadge>
          <StatusBadge tone="ai">AI Candidate</StatusBadge>
        </div>
      </DesignSection>

      <DesignSection
        title="Filters"
        description="Filters should feel analytical and compact, not like administrative forms."
      >
        <FilterBar>
          <StatusBadge tone="brand">All Markets</StatusBadge>
          <StatusBadge tone="pipeline">Pipeline</StatusBadge>
          <StatusBadge tone="operating">Operating</StatusBadge>
          <StatusBadge tone="governance">Source Gaps</StatusBadge>
        </FilterBar>
      </DesignSection>

      <DesignSection
        title="Tables"
        description="Entity, governance, and ranking tables share typography and density rules, but emphasize different information."
      >
        <div className="space-y-5">
          <SectionHeader
            title="Entity Table"
            description="Projects, Plants, and Companies prioritize identity, market context, phase/status, and action."
          />
          <EntityTable columns={entityColumns} rows={entityRows} />

          <SectionHeader
            title="Governance Table"
            description="Sources, Matches, Facts, and Research Ops prioritize candidate review and evidence."
          />
          <GovernanceTable columns={governanceColumns} rows={governanceRows} />

          <SectionHeader
            title="Ranking Table"
            description="Markets, Countries, Technology, Developers, Owners, and Operators prioritize comparison."
          />
          <RankingTable columns={rankingColumns} rows={rankingRows} />
        </div>
      </DesignSection>

      <DesignSection
        title="Chart Language"
        description="Charts must be clean, semantic, and readable. They are intelligence surfaces, not decorative widgets."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartContainer
            title="Ranking Bars"
            description="Use for country and company rankings."
          >
            <div className="space-y-3">
              <BarPreview tone="pipeline" width={92} />
              <BarPreview tone="operating" width={76} />
              <BarPreview tone="construction" width={58} />
            </div>
          </ChartContainer>
          <ChartContainer
            title="Stacked Pipeline"
            description="Use fixed lifecycle order."
          >
            <div className="flex h-8 overflow-hidden bg-[var(--tge-governance-neutral-bg)]">
              {[
                ["prospect", 18],
                ["exploration", 25],
                ["pre_feasibility", 14],
                ["feasibility", 15],
                ["construction", 10],
                ["operating", 18],
              ].map(([tone, width]) => (
                <div
                  className={tgeToneClasses[tone as TgeSemanticTone].bar}
                  key={tone}
                  style={{ width: `${width}%` }}
                />
              ))}
            </div>
          </ChartContainer>
          <ChartContainer
            title="Map Overlay"
            description="Use clusters and intensity, not just pins."
          >
            <div className="relative h-36 overflow-hidden border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-concept-map-land)]">
              {[
                ["left-[22%] top-[38%]", "operating", "h-16 w-16"],
                ["left-[52%] top-[44%]", "pipeline", "h-24 w-24"],
                ["left-[74%] top-[62%]", "construction", "h-14 w-14"],
              ].map(([position, tone, size]) => (
                <div
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 ${position} ${size} ${tgeToneClasses[tone as TgeSemanticTone].bar}`}
                  key={position}
                />
              ))}
            </div>
          </ChartContainer>
        </div>
      </DesignSection>

      <DesignSection
        title="Spacing"
        description="Spacing creates rhythm. Intelligence pages breathe; operational tables stay dense."
      >
        <div className={`${tgeSurfaces.card} grid gap-4 p-5 md:grid-cols-4`}>
          {[
            ["xs", "4px metadata"],
            ["sm", "8px inline groups"],
            ["md", "12px compact cards"],
            ["lg", "16px standard padding"],
            ["xl", "24px section rhythm"],
            ["2xl", "32px major separation"],
          ].map(([label, usage]) => (
            <div className={tgeSurfaces.cardSubtle} key={label}>
              <div className="p-3">
                <div className={tgeTypography.subsectionTitle}>{label}</div>
                <div className={tgeTypography.metadata}>{usage}</div>
              </div>
            </div>
          ))}
        </div>
      </DesignSection>
    </main>
  );
}
