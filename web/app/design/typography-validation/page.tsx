import {
  PageHeader,
  SectionHeader,
  StatusBadge,
} from "@/components/design-system/TgeDesignSystem";
import {
  tgeSurfaces,
  tgeText,
  tgeTypography,
} from "@/lib/design-system";

const typeScaleRows = [
  ["H1", "Dashboard Intelligence Headline", "36-42px", "Weekly market brief and executive entry surface"],
  ["H2", "Page Title", "24-28px", "Markets, Projects, Plants, Analysis"],
  ["H3", "Section Title", "18-20px", "Regional Momentum, Project Pipeline, Market Signals"],
  ["H4", "Card Title", "14-16px", "Market cards, KPI context, table modules"],
  ["Body", "Body Text", "14px", "Readable product copy and descriptions"],
  ["Metadata", "Metadata", "11-12px", "Confidence, source state, timestamps, small context"],
  ["Table", "Table Text", "13-14px", "Long-session research and scanning surfaces"],
  ["Badge", "Badge Text", "10-11px", "Status, lifecycle, review, and compact labels"],
] as const;

const marketRows = [
  ["Indonesia", "2,744 MWe", "8.9 GW", "High"],
  ["United States", "2,587 MWe", "2.9 GW", "Medium"],
  ["Philippines", "1,928 MWe", "0.9 GW", "Stable"],
  ["Türkiye", "1,691 MWe", "2.1 GW", "Rising"],
] as const;

function ScaleCard({
  label,
  className,
  sample,
  note,
}: {
  label: string;
  className: string;
  sample: string;
  note: string;
}) {
  return (
    <article className="bg-[var(--tge-surface-card)] p-5">
      <div className={tgeTypography.pageLabel}>{label}</div>
      <div className={`${className} mt-3 ${tgeText.primary}`}>{sample}</div>
      <p className={`${tgeTypography.metadata} mt-3`}>{note}</p>
    </article>
  );
}

function TypeSpecTable() {
  return (
    <div className={`${tgeSurfaces.card} overflow-x-auto`}>
      <table className="w-full min-w-[760px] table-fixed text-left">
        <thead className={`${tgeSurfaces.tableHeader} ${tgeTypography.tableHeader} ${tgeText.muted}`}>
          <tr>
            <th className="w-24 px-4 py-3">Level</th>
            <th className="px-4 py-3">Role</th>
            <th className="w-32 px-4 py-3">Size</th>
            <th className="px-4 py-3">Usage</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--tge-governance-muted-border)]">
          {typeScaleRows.map(([level, role, size, usage]) => (
            <tr className={tgeTypography.tableBody} key={level}>
              <td className={`px-4 py-3 font-bold ${tgeText.primary}`}>{level}</td>
              <td className={`px-4 py-3 ${tgeText.primary}`}>{role}</td>
              <td className={`px-4 py-3 font-mono text-xs ${tgeText.secondary}`}>{size}</td>
              <td className={`px-4 py-3 ${tgeText.secondary}`}>{usage}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IntelligenceComposition() {
  return (
    <section className="bg-[var(--tge-surface-card)] p-6">
      <div className={tgeTypography.pageLabel}>Dashboard Intelligence Headline</div>
      <h2 className={`${tgeTypography.intelligenceHeadline} mt-3 max-w-4xl ${tgeText.primary}`}>
        Drilling and funding signals point to renewed pipeline momentum in East Africa.
      </h2>
      <p className={`${tgeTypography.body} mt-4 max-w-3xl ${tgeText.secondary}`}>
        Typography should carry the hierarchy before borders, badges, or color
        enter the layout. The headline creates the entry point; metadata and
        tables support the intelligence without competing with it.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {[
          ["Operating Capacity", "17.4 GW", "+312 MW confirmed"],
          ["Pipeline Capacity", "38.2 GW", "+1.1 GW under review"],
          ["Active Markets", "102", "countries with geothermal signals"],
          ["Evidence Coverage", "71%", "priority profiles source-backed"],
        ].map(([label, value, context]) => (
          <div className="border-l-2 border-l-[var(--tge-brand-green)] bg-[var(--tge-surface-subtle)] px-4 py-3" key={label}>
            <div className={tgeTypography.tableHeader}>{label}</div>
            <div className="mt-2 text-2xl font-bold leading-none text-[var(--tge-text-primary)]">
              {value}
            </div>
            <div className={`${tgeTypography.metadata} mt-2`}>{context}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TableTextPreview() {
  return (
    <div className={`${tgeSurfaces.card} overflow-x-auto`}>
      <table className="w-full min-w-[760px] table-fixed text-left">
        <thead className={`${tgeSurfaces.tableHeader} ${tgeTypography.tableHeader} ${tgeText.muted}`}>
          <tr>
            <th className="px-4 py-3">Market</th>
            <th className="px-4 py-3 text-right">Operating MWe</th>
            <th className="px-4 py-3 text-right">Pipeline</th>
            <th className="px-4 py-3">Signal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--tge-governance-muted-border)]">
          {marketRows.map(([market, operating, pipeline, signal]) => (
            <tr className={tgeTypography.tableBody} key={market}>
              <td className={`px-4 py-3 font-bold ${tgeText.primary}`}>{market}</td>
              <td className={`px-4 py-3 text-right ${tgeText.primary}`}>{operating}</td>
              <td className={`px-4 py-3 text-right ${tgeText.secondary}`}>{pipeline}</td>
              <td className="px-4 py-3">
                <span className={tgeTypography.metadata}>{signal}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TypographyValidationPage() {
  return (
    <main className="space-y-10">
      <PageHeader
        label="Typography Validation"
        title="Hierarchy carried by type, not boxes"
        description="This page checks whether the platform can feel authoritative, readable, and intelligence-driven before color or heavy containers do the work."
        variant="brief"
      />

      <section className="grid gap-4 xl:grid-cols-2">
        <ScaleCard
          className={tgeTypography.intelligenceHeadline}
          label="H1"
          note="Used sparingly for Dashboard brief and major executive intelligence entry points."
          sample="What changed in geothermal this week?"
        />
        <ScaleCard
          className={tgeTypography.pageTitle}
          label="H2"
          note="Used for standard page titles. It orients the workspace without acting like a marketing hero."
          sample="Global Geothermal Markets"
        />
        <ScaleCard
          className={tgeTypography.sectionTitle}
          label="H3"
          note="Used for scanable intelligence sections and table modules."
          sample="Regional Momentum"
        />
        <ScaleCard
          className={tgeTypography.subsectionTitle}
          label="H4"
          note="Used for cards, compact modules, side panels, and supporting table blocks."
          sample="Operating Capacity"
        />
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Typography in context"
          description="A realistic intelligence block tests the full hierarchy without adding decorative framing."
        />
        <IntelligenceComposition />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <SectionHeader
            title="Body, metadata, badges"
            description="Long research sessions need clear body text and quiet metadata."
          />
          <div className="bg-[var(--tge-surface-card)] p-5">
            <p className={`${tgeTypography.body} ${tgeText.secondary}`}>
              Body text explains analytical meaning, methodology, or context.
              It should be readable enough for repeated use, but not so large
              that the interface becomes editorial.
            </p>
            <p className={`${tgeTypography.metadata} mt-4`}>
              Metadata handles source confidence, timestamps, derived status,
              and supporting context.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusBadge tone="operating">Operating</StatusBadge>
              <StatusBadge tone="pipeline">Pipeline</StatusBadge>
              <StatusBadge tone="review">Needs Review</StatusBadge>
              <StatusBadge tone="ai">AI Candidate</StatusBadge>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <SectionHeader
            title="Table text"
            description="Tables must stay readable and calm at high density."
          />
          <TableTextPreview />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Type scale specification"
          description="The design system should make page hierarchy clear even when color is removed."
        />
        <TypeSpecTable />
      </section>
    </main>
  );
}
