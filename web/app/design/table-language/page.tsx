import type { ReactNode } from "react";
import {
  LifecycleBadge,
  PageHeader,
  SectionHeader,
  StatusBadge,
} from "@/components/design-system/TgeDesignSystem";
import {
  tgeSurfaces,
  tgeText,
  tgeTypography,
} from "@/lib/design-system";

const rankingRows = [
  ["1", "Indonesia", "2,744 MWe", "8.9 GW", 92],
  ["2", "United States", "2,587 MWe", "2.9 GW", 84],
  ["3", "Philippines", "1,928 MWe", "0.9 GW", 63],
  ["4", "Türkiye", "1,691 MWe", "2.1 GW", 56],
] as const;

const projectRows = [
  ["Dieng Expansion", "Indonesia", "Construction", "110 MWe", "High", "Review"],
  ["Menengai Phase II", "Kenya", "Feasibility", "70 MWe", "Medium", "Clean"],
  ["Nevada Binary Repower", "United States", "Pre-Feasibility", "24 MWe", "Low", "Review"],
  ["Northern Rift Prospect", "Kenya", "Exploration", "n.a.", "Medium", "Draft"],
  ["Legacy Concession", "Chile", "Cancelled", "n.a.", "Low", "Archived"],
] as const;

const companyRows = [
  ["Pertamina Geothermal Energy", "Indonesia", "Developer / Operator", "14 plants", "Active"],
  ["Ormat Technologies", "United States", "Technology / Operator", "21 plants", "Active"],
  ["KenGen", "Kenya", "Utility / Operator", "7 plants", "Active"],
  ["Baseload Capital", "Sweden", "Investor / Developer", "9 projects", "Watch"],
] as const;

const governanceRows = [
  ["Reuters article", "Capacity update", "High", "Needs Review", "Open"],
  ["TGE archive import", "Entity match", "Medium", "AI Candidate", "Review"],
  ["Company release", "Operator link", "High", "Approved", "Open"],
  ["Legacy source", "Missing date", "Low", "Blocked", "Resolve"],
] as const;

function ActionLink({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex min-h-7 items-center border border-[var(--tge-governance-neutral-border)] px-2 text-[11px] font-bold text-[var(--tge-brand-green-dark)]">
      {children}
    </span>
  );
}

function TableShell({
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
      <div className={`${tgeSurfaces.card} overflow-x-auto`}>{children}</div>
    </section>
  );
}

function RankingTablePreview() {
  return (
    <table className="w-full min-w-[820px] table-fixed text-left">
      <thead className={`${tgeSurfaces.tableHeader} ${tgeTypography.tableHeader} ${tgeText.muted}`}>
        <tr>
          <th className="w-16 px-4 py-3">Rank</th>
          <th className="px-4 py-3">Market</th>
          <th className="px-4 py-3 text-right">Operating</th>
          <th className="px-4 py-3 text-right">Pipeline</th>
          <th className="px-4 py-3">Share</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--tge-governance-muted-border)]">
        {rankingRows.map(([rank, market, operating, pipeline, share]) => (
          <tr className={tgeTypography.tableBody} key={market}>
            <td className={`px-4 py-3 font-bold ${tgeText.muted}`}>{rank}</td>
            <td className={`px-4 py-3 font-bold ${tgeText.primary}`}>{market}</td>
            <td className={`px-4 py-3 text-right font-bold ${tgeText.primary}`}>{operating}</td>
            <td className={`px-4 py-3 text-right ${tgeText.secondary}`}>{pipeline}</td>
            <td className="px-4 py-3">
              <div className="h-2 w-full bg-[var(--tge-governance-neutral-bg)]">
                <div
                  className="h-2 bg-[var(--tge-chart-ranking-installed-capacity)]"
                  style={{ width: `${share}%` }}
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ProjectTablePreview({ relaxed = false }: { relaxed?: boolean }) {
  return (
    <table className="w-full min-w-[980px] table-fixed text-left">
      <thead className={`${tgeSurfaces.tableHeader} ${tgeTypography.tableHeader} ${tgeText.muted}`}>
        <tr>
          <th className="px-4 py-3">Project</th>
          <th className="w-36 px-4 py-3">Country</th>
          <th className="w-44 px-4 py-3">Phase</th>
          <th className="w-32 px-4 py-3 text-right">MWe</th>
          <th className="w-32 px-4 py-3">Evidence</th>
          <th className="w-32 px-4 py-3">Review</th>
          <th className="w-28 px-4 py-3 text-right">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--tge-governance-muted-border)]">
        {projectRows.map(([name, country, phase, capacity, evidence, review]) => (
          <tr
            className={`${tgeTypography.tableBody} ${relaxed ? "min-h-16" : "min-h-11"}`}
            key={name}
          >
            <td className={`${relaxed ? "px-4 py-4" : "px-4 py-2.5"} font-bold ${tgeText.primary}`}>
              {name}
              <div className={tgeTypography.metadata}>Source-backed project profile</div>
            </td>
            <td className={`${relaxed ? "px-4 py-4" : "px-4 py-2.5"} ${tgeText.secondary}`}>
              {country}
            </td>
            <td className={relaxed ? "px-4 py-4" : "px-4 py-2.5"}>
              <LifecycleBadge
                phase={
                  phase as
                    | "Exploration"
                    | "Pre-Feasibility"
                    | "Feasibility"
                    | "Construction"
                    | "Cancelled"
                }
              />
            </td>
            <td className={`${relaxed ? "px-4 py-4" : "px-4 py-2.5"} text-right font-bold ${tgeText.primary}`}>
              {capacity}
            </td>
            <td className={relaxed ? "px-4 py-4" : "px-4 py-2.5"}>
              <span className={tgeTypography.metadata}>{evidence}</span>
            </td>
            <td className={relaxed ? "px-4 py-4" : "px-4 py-2.5"}>
              <StatusBadge tone={review === "Clean" ? "operating" : "review"}>{review}</StatusBadge>
            </td>
            <td className={`${relaxed ? "px-4 py-4" : "px-4 py-2.5"} text-right`}>
              <ActionLink>Open</ActionLink>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CompanyTablePreview() {
  return (
    <table className="w-full min-w-[920px] table-fixed text-left">
      <thead className={`${tgeSurfaces.tableHeader} ${tgeTypography.tableHeader} ${tgeText.muted}`}>
        <tr>
          <th className="px-4 py-3">Company</th>
          <th className="w-36 px-4 py-3">Country</th>
          <th className="w-56 px-4 py-3">Primary Role</th>
          <th className="w-36 px-4 py-3 text-right">Footprint</th>
          <th className="w-32 px-4 py-3">Status</th>
          <th className="w-28 px-4 py-3 text-right">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--tge-governance-muted-border)]">
        {companyRows.map(([name, country, role, footprint, status]) => (
          <tr className={tgeTypography.tableBody} key={name}>
            <td className={`px-4 py-3 font-bold ${tgeText.primary}`}>{name}</td>
            <td className={`px-4 py-3 ${tgeText.secondary}`}>{country}</td>
            <td className={`px-4 py-3 ${tgeText.primary}`}>{role}</td>
            <td className={`px-4 py-3 text-right font-bold ${tgeText.primary}`}>{footprint}</td>
            <td className="px-4 py-3">
              <StatusBadge tone={status === "Watch" ? "review" : "operating"}>{status}</StatusBadge>
            </td>
            <td className="px-4 py-3 text-right">
              <ActionLink>Open</ActionLink>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function GovernanceTablePreview() {
  return (
    <table className="w-full min-w-[920px] table-fixed text-left">
      <thead className={`${tgeSurfaces.tableHeader} ${tgeTypography.tableHeader} ${tgeText.muted}`}>
        <tr>
          <th className="px-4 py-3">Source / Candidate</th>
          <th className="w-44 px-4 py-3">Review Type</th>
          <th className="w-32 px-4 py-3">Confidence</th>
          <th className="w-36 px-4 py-3">Status</th>
          <th className="w-28 px-4 py-3 text-right">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--tge-governance-muted-border)]">
        {governanceRows.map(([source, type, confidence, status, action]) => (
          <tr className={tgeTypography.tableBody} key={`${source}-${type}`}>
            <td className={`px-4 py-3 font-bold ${tgeText.primary}`}>
              {source}
              <div className={tgeTypography.metadata}>Evidence and extraction queue</div>
            </td>
            <td className={`px-4 py-3 ${tgeText.secondary}`}>{type}</td>
            <td className={`px-4 py-3 font-bold ${tgeText.primary}`}>{confidence}</td>
            <td className="px-4 py-3">
              <StatusBadge
                tone={
                  status === "Approved"
                    ? "operating"
                    : status === "Blocked"
                      ? "danger"
                      : status === "AI Candidate"
                        ? "ai"
                        : "review"
                }
              >
                {status}
              </StatusBadge>
            </td>
            <td className="px-4 py-3 text-right">
              <ActionLink>{action}</ActionLink>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RulesGrid() {
  const rules = [
    ["Ranking tables", "Rank, market/entity, key metric, visual share, drilldown. Single metric bars use one color."],
    ["Entity tables", "Entity name dominates. Geography, phase/status, capacity, and action follow."],
    ["Governance tables", "Candidate/evidence dominates. Confidence and status support review decisions."],
    ["Column hierarchy", "Most important identity column left. Numeric values right. Actions quiet and right-aligned."],
    ["Status badges", "Short labels only. Avoid stacking many badges with equal visual weight."],
    ["Density", "Dense for review queues. Compact for entity workspaces. Relaxed only for executive summaries."],
  ] as const;

  return (
    <div className="grid gap-px border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-border)] md:grid-cols-2 xl:grid-cols-3">
      {rules.map(([title, text]) => (
        <article className="bg-[var(--tge-surface-card)] p-4" key={title}>
          <h3 className={`${tgeTypography.subsectionTitle} ${tgeText.primary}`}>{title}</h3>
          <p className={`${tgeTypography.metadata} mt-2`}>{text}</p>
        </article>
      ))}
    </div>
  );
}

export default function TableLanguagePage() {
  return (
    <main className="space-y-10">
      <PageHeader
        label="Table Language"
        title="Tables as intelligence workspaces"
        description="This page validates ranking, entity, company, and governance table patterns before the design system rolls into production pages."
        variant="brief"
      />

      <section className="space-y-4">
        <SectionHeader
          title="Table principles"
          description="The platform will be used heavily through tables, so table hierarchy is part of the product identity."
        />
        <RulesGrid />
      </section>

      <TableShell
        title="Ranking table"
        description="Used for Markets, countries, technology, developers, operators, owners, and suppliers."
      >
        <RankingTablePreview />
      </TableShell>

      <TableShell
        title="Project table"
        description="Entity table pattern: identity first, lifecycle second, governance supporting."
      >
        <ProjectTablePreview />
      </TableShell>

      <TableShell
        title="Company table"
        description="Companies should scan as ecosystem intelligence, not CRM narrative text."
      >
        <CompanyTablePreview />
      </TableShell>

      <TableShell
        title="Governance table"
        description="Review queues prioritize source, candidate value, confidence, status, and action."
      >
        <GovernanceTablePreview />
      </TableShell>

      <section className="grid gap-6 xl:grid-cols-2">
        <TableShell
          title="Dense review mode"
          description="Use where researchers are processing queues and need more rows above the fold."
        >
          <ProjectTablePreview />
        </TableShell>
        <TableShell
          title="Relaxed intelligence mode"
          description="Use sparingly for executive or overview surfaces where readability outranks row count."
        >
          <ProjectTablePreview relaxed />
        </TableShell>
      </section>
    </main>
  );
}
