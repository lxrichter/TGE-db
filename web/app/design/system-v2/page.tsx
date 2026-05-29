import {
  KPIStat,
  KPIStrip,
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

const semanticColors: Array<[TgeSemanticTone, string, string]> = [
  ["operating", "Operating", "Plant status, operating MWe, approved output"],
  ["pipeline", "Pipeline", "Development capacity and active projects"],
  ["prospect", "Prospect", "TBD and early-stage signals"],
  ["pre_feasibility", "Pre-Feasibility", "Early development assessment"],
  ["feasibility", "Feasibility", "Advanced development assessment"],
  ["construction", "Construction", "Build activity and near-term movement"],
  ["review", "Review", "Needs human attention"],
  ["danger", "Rejected / Cancelled", "Blocked, rejected, cancelled"],
  ["governance", "Governance", "Supporting administrative context"],
];

function TokenSwatch({
  tone,
  label,
  description,
}: {
  tone: TgeSemanticTone;
  label: string;
  description: string;
}) {
  return (
    <div className="bg-[var(--tge-surface-card)] p-4">
      <div className={`h-2 w-20 ${tgeToneClasses[tone].bar}`} />
      <div className={`${tgeTypography.subsectionTitle} mt-3 ${tgeText.primary}`}>
        {label}
      </div>
      <p className={`${tgeTypography.metadata} mt-1`}>{description}</p>
    </div>
  );
}

export default function DesignSystemV2Page() {
  return (
    <main className="space-y-10">
      <PageHeader
        label="Design System v2"
        title="Product identity before page rollout"
        description="This preview separates ThinkGeoEnergy brand identity from semantic status colors, sharpens typography hierarchy, simplifies KPIs, and reduces box-heavy grouping."
        variant="brief"
      />

      <section className="space-y-4">
        <SectionHeader
          title="Brand vs Semantic Color"
          description="ThinkGeoEnergy green is the platform identity. Semantic colors explain market and workflow states."
        />
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="bg-[var(--tge-surface-card)] p-6">
            <div className={tgeTypography.pageLabel}>Platform Identity</div>
            <h2 className={`${tgeTypography.sectionTitle} mt-2 ${tgeText.primary}`}>
              ThinkGeoEnergy Green
            </h2>
            <p className={`${tgeTypography.body} mt-2 ${tgeText.secondary}`}>
              Use for navigation identity, active states, primary buttons,
              platform branding, selected views, and key intelligence accents.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className={`${tgeBrandIdentity.primaryAction} border px-4 py-3 text-sm font-bold`}>
                Primary Action
              </div>
              <div className={`${tgeBrandIdentity.secondaryAction} border px-4 py-3 text-sm font-bold`}>
                Secondary Action
              </div>
              <div className={`${tgeBrandIdentity.navActive} px-4 py-3 text-sm font-bold`}>
                Active Navigation
              </div>
              <div className="border-l-4 border-l-[var(--tge-brand-green)] bg-[var(--tge-surface-subtle)] px-4 py-3 text-sm font-bold text-[var(--tge-text-primary)]">
                Intelligence Accent
              </div>
            </div>
          </div>
          <div className="grid gap-px bg-[var(--tge-governance-neutral-border)] md:grid-cols-3">
            {semanticColors.map(([tone, label, description]) => (
              <TokenSwatch
                description={description}
                key={tone}
                label={label}
                tone={tone}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Typography Hierarchy"
          description="Hierarchy must be visible even without color. The dashboard brief gets the largest headline; working pages stay compact."
        />
        <div className={`${tgeSurfaces.panel} space-y-5 p-6`}>
          <div>
            <div className={tgeTypography.pageLabel}>Dashboard Intelligence Headline</div>
            <div className={`${tgeTypography.intelligenceHeadline} mt-2 ${tgeText.primary}`}>
              What changed in geothermal this week?
            </div>
          </div>
          <div>
            <div className={tgeTypography.pageLabel}>Page Title</div>
            <div className={`${tgeTypography.pageTitle} mt-2 ${tgeText.primary}`}>
              Markets
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <div className={`${tgeTypography.sectionTitle} ${tgeText.primary}`}>
                Regional Momentum
              </div>
              <p className={`${tgeTypography.body} mt-1 ${tgeText.secondary}`}>
                Section titles frame the next intelligence surface.
              </p>
            </div>
            <div>
              <div className={`${tgeTypography.subsectionTitle} ${tgeText.primary}`}>
                Operating Capacity
              </div>
              <p className={`${tgeTypography.body} mt-1 ${tgeText.secondary}`}>
                Card titles support the data.
              </p>
            </div>
            <div>
              <div className={tgeTypography.metadata}>
                Metadata, table hints, confidence, and source context.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="KPI Philosophy"
          description="KPIs summarize status. Charts carry trends. The KPI component should not become a miniature dashboard."
        />
        <KPIStrip columns="four">
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
            context="countries with signal"
            label="Active Markets"
            size="medium"
            tone="brand"
            value="102"
          />
          <KPIStat
            context="priority records"
            label="Evidence Coverage"
            size="small"
            tone="evidence"
            value="71%"
          />
        </KPIStrip>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Surface Strategy"
          description="Use whitespace and section rhythm first. Add borders only when a component needs containment."
        />
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div>
              <div className={tgeTypography.pageLabel}>Preferred</div>
              <div className={`${tgeTypography.sectionTitle} mt-1 ${tgeText.primary}`}>
                Section rhythm with fewer visible boxes
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-[var(--tge-surface-card)] p-4">
                <StatusBadge tone="pipeline">Pipeline</StatusBadge>
                <div className={`${tgeTypography.subsectionTitle} mt-4 ${tgeText.primary}`}>
                  Indonesia
                </div>
                <p className={`${tgeTypography.metadata} mt-1`}>8.9 GW pipeline</p>
              </div>
              <div className="bg-[var(--tge-surface-card)] p-4">
                <StatusBadge tone="construction">Activity</StatusBadge>
                <div className={`${tgeTypography.subsectionTitle} mt-4 ${tgeText.primary}`}>
                  Kenya
                </div>
                <p className={`${tgeTypography.metadata} mt-1`}>Drilling cluster</p>
              </div>
              <div className="bg-[var(--tge-surface-card)] p-4">
                <StatusBadge tone="operating">Operating</StatusBadge>
                <div className={`${tgeTypography.subsectionTitle} mt-4 ${tgeText.primary}`}>
                  Iceland
                </div>
                <p className={`${tgeTypography.metadata} mt-1`}>Fleet update</p>
              </div>
            </div>
          </div>
          <div className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] p-5">
            <div className={tgeTypography.pageLabel}>Use carefully</div>
            <div className={`${tgeTypography.sectionTitle} mt-1 ${tgeText.primary}`}>
              Contained modules
            </div>
            <p className={`${tgeTypography.body} mt-2 ${tgeText.secondary}`}>
              Borders are appropriate for tables, filters, governance blocks,
              and repeated cards. Avoid stacking boxes inside boxes when spacing
              can do the job.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
