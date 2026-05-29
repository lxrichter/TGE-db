import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import ActionButton from "@/components/ui/ActionButton";
import PostgresStatusLegend from "@/components/postgres-preview/PostgresStatusLegend";
import {
  analysisCategoryLabels,
  analysisCategoryOrder,
  analysisModules,
  analysisModulesByCategory,
  analysisModulesByStatus,
} from "@/lib/analysis/modules";
import { ARTICLE_FACT_TYPE_DEFINITIONS } from "@/lib/articleFactTypeDefinitions";
import { authOptions } from "@/lib/auth/auth";
import {
  canAccessAdmin,
  canManageUsers,
  canManageVocabularies,
} from "@/lib/auth/roles";
import {
  designAudienceEntryPoints,
  designComponentInventory,
  designEntryGates,
  designPassSequence,
  designReadinessPriorities,
  designReviewPageSet,
  semanticDesignRules,
  type DesignEntryGateStatus,
  type DesignComponentInventoryStatus,
} from "@/lib/design-readiness";
import { designTokenGroups } from "@/lib/design-tokens";
import { platformNavigationGroups } from "@/lib/platform-navigation";
import { SOURCE_FACT_TYPE_PRESETS } from "@/lib/sourceFactTypePresets";
import { getPostgresEntityFormReferenceData } from "@/lib/postgres-preview";
import { listArticleFactCandidateStatusOptions } from "@/lib/services/article-facts";
import { getSourceReferenceData } from "@/lib/services/sources";
import { getUserSummary } from "@/lib/db/users";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const adminClass = {
  panel:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]",
  panelSubtle:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)]",
  header:
    "border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-5 py-3 md:px-6 md:py-4",
  title: "text-[var(--tge-text-primary)]",
  body: "text-[var(--tge-text-secondary)]",
  muted: "text-[var(--tge-governance-muted-text)]",
  routeLink:
    "rounded-sm border border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] px-4 py-2 text-sm font-semibold text-[var(--tge-text-primary)] transition hover:border-[var(--tge-brand-green)] hover:bg-[var(--tge-surface-card)]",
  chip:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-2 py-1 text-[11px] font-semibold text-[var(--tge-text-secondary)]",
  warningPanel:
    "border border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] text-[var(--tge-governance-attention-text)]",
  successPanel:
    "border border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)]",
};

function SectionCard({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`scroll-mt-24 ${adminClass.panel}`}>
      <div className={adminClass.header}>
        <h2 className={`text-xl font-bold ${adminClass.title}`}>{title}</h2>
        {description ? (
          <p className={`mt-1 text-sm ${adminClass.muted}`}>{description}</p>
        ) : null}
      </div>
      <div className="px-5 py-5 md:px-6">{children}</div>
    </section>
  );
}

function TocLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      className={adminClass.routeLink}
    >
      {label}
    </a>
  );
}

function WorkflowBox({
  step,
  title,
  text,
}: {
  step: string;
  title: string;
  text: string;
}) {
  return (
    <div className={`flex items-center gap-4 px-4 py-4 ${adminClass.panelSubtle}`}>
      <div className="min-w-[28px] text-3xl font-bold leading-none text-[var(--tge-brand-green)]">
        {step}
      </div>
      <div>
        <div className={`text-sm font-bold ${adminClass.title}`}>{title}</div>
        <div className={`text-xs ${adminClass.muted}`}>{text}</div>
      </div>
    </div>
  );
}

function RuleCard({
  title,
  subtitle,
  examples,
}: {
  title: string;
  subtitle: string;
  examples: string;
}) {
  return (
    <div className={`${adminClass.panelSubtle} p-4`}>
      <div className={`text-sm font-bold ${adminClass.title}`}>{title}</div>
      <div className={`mt-1 text-sm ${adminClass.body}`}>{subtitle}</div>
      <div className={`mt-2 text-xs leading-5 ${adminClass.muted}`}>{examples}</div>
    </div>
  );
}

type GovernanceSnapshot =
  | {
      ok: true;
      entityVocabularyCount: number;
      sourceVocabularyCount: number;
      articleFactTypeCount: number;
      sourceFactPresetCount: number;
      reviewStatusCount: number;
      sourceStatusCount: number;
      articleFactStatusCount: number;
    }
  | {
      ok: false;
      error: string;
    };

async function getGovernanceSnapshot(): Promise<GovernanceSnapshot> {
  try {
    const [entityReferenceData, sourceReferenceData, articleFactStatuses] =
      await Promise.all([
        getPostgresEntityFormReferenceData(),
        getSourceReferenceData(),
        listArticleFactCandidateStatusOptions(),
      ]);

    return {
      ok: true,
      entityVocabularyCount:
        entityReferenceData.useTypes.length +
        entityReferenceData.lifecyclePhases.length +
        entityReferenceData.estimateStatuses.length +
        entityReferenceData.companyEntityTypes.length +
        entityReferenceData.companyPrimaryTypes.length,
      sourceVocabularyCount:
        sourceReferenceData.sourceTypes.length +
        sourceReferenceData.visibilityLevels.length,
      articleFactTypeCount: ARTICLE_FACT_TYPE_DEFINITIONS.length,
      sourceFactPresetCount: SOURCE_FACT_TYPE_PRESETS.length,
      reviewStatusCount: entityReferenceData.reviewStatuses.length,
      sourceStatusCount: sourceReferenceData.credibilityStatuses.length,
      articleFactStatusCount: articleFactStatuses.length,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown PostgreSQL error",
    };
  }
}

function GovernanceMetric({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note: string;
}) {
  return (
    <div className={`${adminClass.panelSubtle} px-4 py-4`}>
      <div className={`text-xs font-semibold uppercase tracking-wide ${adminClass.muted}`}>
        {label}
      </div>
      <div className={`mt-2 text-3xl font-bold leading-none ${adminClass.title}`}>
        {value}
      </div>
      <div className={`mt-2 text-xs leading-5 ${adminClass.muted}`}>{note}</div>
    </div>
  );
}

function GovernanceRule({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className={`${adminClass.successPanel} px-4 py-3`}>
      <div className={`text-sm font-bold ${adminClass.title}`}>{title}</div>
      <div className={`mt-1 text-xs leading-5 ${adminClass.body}`}>{text}</div>
    </div>
  );
}

function AnalysisRegistryOverview() {
  const liveCount = analysisModulesByStatus("live").length;
  const definitionCount = analysisModulesByStatus("definition_next").length;
  const plannedCount = analysisModulesByStatus("planned").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <GovernanceMetric
          label="Analysis Modules"
          value={analysisModules.length}
          note="Live, definition, and planned modules"
        />
        <GovernanceMetric
          label="Live"
          value={liveCount}
          note="Available in the analysis workspace"
        />
        <GovernanceMetric
          label="Define Next"
          value={definitionCount}
          note="Needs scope before implementation"
        />
        <GovernanceMetric
          label="Planned"
          value={plannedCount}
          note="Visible backlog for future analysis"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <div className={`${adminClass.panelSubtle} p-4`}>
          <div className={`text-sm font-bold ${adminClass.title}`}>
            Domain Coverage
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {analysisCategoryOrder.map((category) => {
              const modules = analysisModulesByCategory(category);
              const live = modules.filter(
                (module) => module.status === "live"
              ).length;
              const definition = modules.filter(
                (module) => module.status === "definition_next"
              ).length;
              const planned = modules.filter(
                (module) => module.status === "planned"
              ).length;

              return (
                <div key={category} className={`${adminClass.panel} px-3 py-2`}>
                  <div className={`text-xs font-bold ${adminClass.title}`}>
                    {analysisCategoryLabels[category]}
                  </div>
                  <div className={`mt-1 text-[11px] ${adminClass.muted}`}>
                    {live} live · {definition} define · {planned} planned
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <GovernanceRule
            title="Analysis pages need definition before build"
            text="New analysis modules should define source basis, primary measures, weighting logic, and data prerequisites before becoming live."
          />
          <GovernanceRule
            title="Design doctrine should map to modules"
            text="The design phase can style live modules consistently because each analysis page now belongs to a governed domain."
          />
          <div className={`flex flex-wrap items-center gap-3 px-4 py-3 ${adminClass.panelSubtle}`}>
            <ActionButton href="/analysis" variant="primary">
              Open Analysis Workspace
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function componentInventoryStatusLabel(status: DesignComponentInventoryStatus) {
  if (status === "token_ready") {
    return "Token Ready";
  }

  if (status === "partial") {
    return "Partial";
  }

  if (status === "pending") {
    return "Pending";
  }

  return "Design Phase";
}

function componentInventoryStatusClass(status: DesignComponentInventoryStatus) {
  if (status === "token_ready") {
    return "border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] text-[var(--tge-governance-success-text)]";
  }

  if (status === "partial") {
    return "border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] text-[var(--tge-governance-attention-text)]";
  }

  if (status === "pending") {
    return "border-[var(--tge-governance-danger-border)] bg-[var(--tge-governance-danger-bg)] text-[var(--tge-governance-danger-text)]";
  }

  return "border-[var(--tge-governance-info-border)] bg-[var(--tge-governance-info-bg)] text-[var(--tge-governance-info-text)]";
}

function designEntryGateStatusLabel(status: DesignEntryGateStatus) {
  if (status === "accepted") return "Accepted";
  if (status === "confirm") return "Confirm";
  return "Design Phase";
}

function designEntryGateStatusClass(status: DesignEntryGateStatus) {
  if (status === "accepted") {
    return "border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] text-[var(--tge-governance-success-text)]";
  }

  if (status === "confirm") {
    return "border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] text-[var(--tge-governance-attention-text)]";
  }

  return "border-[var(--tge-governance-info-border)] bg-[var(--tge-governance-info-bg)] text-[var(--tge-governance-info-text)]";
}

function DesignReadinessOverview() {
  const inventorySummary = {
    tokenReady: designComponentInventory.filter(
      (item) => item.status === "token_ready"
    ).length,
    partial: designComponentInventory.filter((item) => item.status === "partial")
      .length,
    designPhase: designComponentInventory.filter(
      (item) => item.status === "design_phase"
    ).length,
  };
  const designGuardrails = [
    {
      title: "Design Token Contract",
      reference: "docs/DESIGN_TOKEN_CONTRACT.md",
      note: "Maps the formal design doctrine to CSS variables, semantic token families, and the token audit guardrail.",
    },
    {
      title: "Design Handoff Index",
      reference: "docs/DESIGN_HANDOFF_INDEX.md",
      note: "Provides the recommended reading order, design-pass sequence, and first visual review page set.",
    },
    {
      title: "Design Pass 1 Concept Brief",
      reference: "docs/DESIGN_PASS_1_CONCEPT_BRIEF.md",
      note: "Documents the scope and acceptance signals for the app shell, intelligence pages, map, palettes, charts, and mobile concept route.",
    },
    {
      title: "Analysis Module Contract",
      reference: "docs/ANALYSIS_MODULE_CONTRACT.md",
      note: "Defines how new analysis pages declare source basis, measures, attribution logic, segmentation, and Governance QA.",
    },
    {
      title: "Route IA Contract",
      reference: "docs/ROUTE_IA_CONTRACT.md",
      note: "Defines clean top-level entry points, PostgreSQL staging routes, and the future route-promotion path.",
    },
    {
      title: "Role Visibility Contract",
      reference: "docs/ROLE_VISIBILITY_CONTRACT.md",
      note: "Defines subscriber, researcher, editor, and administrator visibility boundaries for shared pages and navigation.",
    },
    {
      title: "App Shell Navigation Contract",
      reference: "docs/APP_SHELL_NAVIGATION_CONTRACT.md",
      note: "Defines the future left-sidebar shell, top-bar utility layer, role defaults, and mobile navigation behavior.",
    },
    {
      title: "Design Phase Entry Checklist",
      reference: "docs/DESIGN_PHASE_ENTRY_CHECKLIST.md",
      note: "Defines the acceptance gate, review page set, and boundaries for starting broad visual design.",
    },
    {
      title: "Evidence Governance Contract",
      reference: "docs/EVIDENCE_GOVERNANCE_CONTRACT.md",
      note: "Defines the governed source-to-evidence-to-candidate-to-confirmed-update pipeline.",
    },
    {
      title: "Form Field State Contract",
      reference: "docs/FORM_FIELD_STATE_CONTRACT.md",
      note: "Defines required, edited, pending approval, approved, blocked, advisory, AI-suggested, and source-backed field states.",
    },
    {
      title: "Intelligence Layer Contract",
      reference: "docs/INTELLIGENCE_LAYER_CONTRACT.md",
      note: "Defines how Dashboard, Markets, Analysis, and Map differ while remaining connected as the intelligence product layer.",
    },
    {
      title: "Map Spatial Intelligence Contract",
      reference: "docs/MAP_SPATIAL_INTELLIGENCE_CONTRACT.md",
      note: "Defines standard, expanded, and mobile map modes, filter taxonomy, marker semantics, and popup priorities.",
    },
    {
      title: "Status Badge Hierarchy",
      reference: "docs/STATUS_BADGE_HIERARCHY.md",
      note: "Locks the operational meaning of lifecycle, review, source, confidence, and severity status colors.",
    },
    {
      title: "Table And List View Contract",
      reference: "docs/TABLE_LIST_VIEW_CONTRACT.md",
      note: "Defines overview-first table strategy, default columns, density modes, mobile cards, and long-text handling.",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
        {designAudienceEntryPoints.map((entry) => (
          <div key={entry.audience} className={`${adminClass.panelSubtle} p-4`}>
            <div className={`text-xs font-semibold uppercase tracking-wide ${adminClass.muted}`}>
              {entry.audience}
            </div>
            <div className={`mt-2 text-lg font-bold ${adminClass.title}`}>
              {entry.defaultEntry}
            </div>
            <p className={`mt-2 text-xs leading-5 ${adminClass.body}`}>
              {entry.designGoal}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {entry.primaryPages.map((page) => (
                <span key={page} className={adminClass.chip}>
                  {page}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <PostgresStatusLegend
        compact
        description="These meanings should become design-system rules, not one-off page styling."
        groups={["lifecycle", "review", "severity", "source", "confidence"]}
        title="Current Semantic Status Language"
      />

      <div className={adminClass.panel}>
        <div className={adminClass.header}>
          <h3 className={`text-sm font-bold ${adminClass.title}`}>
            Navigation Architecture
          </h3>
          <p className={`mt-1 text-xs leading-5 ${adminClass.muted}`}>
            Doctrine-aligned grouping for the current top nav and future
            left-side navigation.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 p-4 xl:grid-cols-3">
          {platformNavigationGroups.map((group) => (
            <div key={group.id} className={`${adminClass.panelSubtle} p-4`}>
              <div className={`text-xs font-semibold uppercase tracking-wide ${adminClass.muted}`}>
                {group.label}
              </div>
              <h4 className={`mt-2 text-sm font-bold ${adminClass.title}`}>
                {group.doctrineLayer}
              </h4>
              <p className={`mt-2 text-xs leading-5 ${adminClass.body}`}>
                {group.designIntent}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {group.items
                  .filter((item) => item.showInHeader)
                  .map((item) => (
                    <span key={item.key} className={adminClass.chip}>
                      {item.label}
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={adminClass.panel}>
        <div className={adminClass.header}>
          <h3 className={`text-sm font-bold ${adminClass.title}`}>
            Design Pass Sequence
          </h3>
          <p className={`mt-1 text-xs leading-5 ${adminClass.muted}`}>
            Recommended order for the visual design phase, keeping broad
            product identity ahead of dense operational and governance pages.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 p-4 xl:grid-cols-3">
          {designPassSequence.map((pass) => (
            <div key={pass.phase} className={`${adminClass.panelSubtle} p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--tge-brand-green)]">
                    {pass.phase}
                  </div>
                  <h4 className={`mt-1 text-sm font-bold ${adminClass.title}`}>
                    {pass.target}
                  </h4>
                </div>
                <span className={adminClass.chip}>
                  {pass.pages.length} areas
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {pass.pages.map((page) => (
                  <span key={`${pass.phase}-${page}`} className={adminClass.chip}>
                    {page}
                  </span>
                ))}
              </div>
              <p className={`mt-3 text-xs leading-5 ${adminClass.body}`}>
                {pass.purpose}
              </p>
              <div className="mt-3 border-l-2 border-[var(--tge-brand-green)] pl-3 text-xs leading-5 text-[var(--tge-text-secondary)]">
                <span className="font-semibold text-[var(--tge-text-primary)]">
                  Acceptance:
                </span>{" "}
                {pass.acceptanceSignal}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={adminClass.panel}>
        <div className={adminClass.header}>
          <h3 className={`text-sm font-bold ${adminClass.title}`}>
            Design Entry Gate
          </h3>
          <p className={`mt-1 text-xs leading-5 ${adminClass.muted}`}>
            Practical acceptance state before moving from functional staging to
            broad visual design.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-2 xl:grid-cols-3">
          {designEntryGates.map((gate) => (
            <div key={gate.area} className={`${adminClass.panelSubtle} p-4`}>
              <div className="flex items-start justify-between gap-3">
                <h4 className={`text-sm font-bold ${adminClass.title}`}>
                  {gate.area}
                </h4>
                <span
                  className={`inline-flex min-h-6 shrink-0 items-center border px-2 text-[10px] font-semibold uppercase tracking-wide ${designEntryGateStatusClass(
                    gate.status
                  )}`}
                >
                  {designEntryGateStatusLabel(gate.status)}
                </span>
              </div>
              <p className={`mt-2 text-xs leading-5 ${adminClass.body}`}>
                {gate.note}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className={adminClass.panel}>
        <div className={adminClass.header}>
          <h3 className={`text-sm font-bold ${adminClass.title}`}>
            Design Review Page Set
          </h3>
          <p className={`mt-1 text-xs leading-5 ${adminClass.muted}`}>
            Use this page set for the first visual design review so the app
            shell, intelligence pages, operations pages, evidence flows, and
            governance pages are tested together.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-2 xl:grid-cols-4">
          {designReviewPageSet.map((page) => (
            <a
              key={`${page.group}-${page.href}`}
              href={page.href}
              className={`${adminClass.panelSubtle} block p-4 transition hover:border-[var(--tge-brand-green)] hover:bg-[var(--tge-governance-success-bg)]`}
            >
              <div className={`text-[10px] font-semibold uppercase tracking-wide ${adminClass.muted}`}>
                {page.group}
              </div>
              <h4 className={`mt-1 text-sm font-bold ${adminClass.title}`}>
                {page.label}
              </h4>
              <p className={`mt-2 text-xs leading-5 ${adminClass.body}`}>
                {page.note}
              </p>
              <div className="mt-3 font-mono text-[11px] text-[var(--tge-governance-muted-text)]">
                {page.href}
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className={adminClass.panel}>
        <div className={adminClass.header}>
          <h3 className={`text-sm font-bold ${adminClass.title}`}>
            Design Guardrails
          </h3>
          <p className={`mt-1 text-xs leading-5 ${adminClass.muted}`}>
            Current implementation contracts that should guide visual design
            without forcing page-by-page reinvention.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-3">
          {designGuardrails.map((guardrail) => (
            <div key={guardrail.title} className={`${adminClass.panelSubtle} p-4`}>
              <h4 className={`text-sm font-bold ${adminClass.title}`}>
                {guardrail.title}
              </h4>
              <div className="mt-2 font-mono text-[11px] text-[var(--tge-governance-muted-text)]">
                {guardrail.reference}
              </div>
              <p className={`mt-2 text-xs leading-5 ${adminClass.body}`}>
                {guardrail.note}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        {semanticDesignRules.map((rule) => (
          <div key={rule.label} className={`${adminClass.panel} px-4 py-3`}>
            <div className={`text-sm font-bold ${adminClass.title}`}>
              {rule.label}
            </div>
            <p className={`mt-1 text-xs leading-5 ${adminClass.body}`}>
              {rule.meaning}
            </p>
          </div>
        ))}
      </div>

      <div className={adminClass.panel}>
        <div className={adminClass.header}>
          <h3 className={`text-sm font-bold ${adminClass.title}`}>
            Semantic Token Foundation
          </h3>
          <p className={`mt-1 text-xs leading-5 ${adminClass.muted}`}>
            First implementation layer from the doctrine: semantic CSS tokens
            before broad visual redesign.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-2 xl:grid-cols-4">
          {designTokenGroups.map((group) => (
            <div key={group.title} className={`${adminClass.panelSubtle} p-4`}>
              <h4 className={`text-sm font-bold ${adminClass.title}`}>
                {group.title}
              </h4>
              <p className={`mt-1 text-xs leading-5 ${adminClass.muted}`}>
                {group.description}
              </p>
              <div className="mt-3 space-y-2">
                {group.tokens.map((token) => (
                  <div
                    key={`${group.title}-${token.name}`}
                    className={`${adminClass.panel} px-3 py-2`}
                  >
                    <div className={`text-xs font-bold ${adminClass.title}`}>
                      {token.name}
                    </div>
                    <div className={`mt-0.5 font-mono text-[11px] ${adminClass.muted}`}>
                      {token.cssVariable}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]">
        <div className="flex flex-col gap-3 border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-page)] px-4 py-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--tge-text-primary)]">
              Component Design Inventory
            </h3>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--tge-text-secondary)]">
              Live map of reusable UI layers before the design phase. This
              separates token-ready foundations from areas that should be
              handled in the visual design pass.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="border border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] px-3 py-2">
              <div className="text-lg font-bold leading-none text-[var(--tge-governance-success-text)]">
                {inventorySummary.tokenReady}
              </div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--tge-governance-success-text)]">
                Ready
              </div>
            </div>
            <div className="border border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] px-3 py-2">
              <div className="text-lg font-bold leading-none text-[var(--tge-governance-attention-text)]">
                {inventorySummary.partial}
              </div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--tge-governance-attention-text)]">
                Partial
              </div>
            </div>
            <div className="border border-[var(--tge-governance-info-border)] bg-[var(--tge-governance-info-bg)] px-3 py-2">
              <div className="text-lg font-bold leading-none text-[var(--tge-governance-info-text)]">
                {inventorySummary.designPhase}
              </div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--tge-governance-info-text)]">
                Design
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-2">
          {designComponentInventory.map((item) => (
            <div
              key={item.area}
              className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[var(--tge-text-primary)]">
                    {item.area}
                  </h4>
                  <p className="mt-1 text-xs leading-5 text-[var(--tge-text-secondary)]">
                    {item.scope}
                  </p>
                </div>
                <span
                  className={`inline-flex min-h-7 shrink-0 items-center justify-center border px-2 text-[11px] font-semibold ${componentInventoryStatusClass(
                    item.status
                  )}`}
                >
                  {componentInventoryStatusLabel(item.status)}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-xs leading-5 text-[var(--tge-text-secondary)]">
                <div>
                  <span className="font-semibold text-[var(--tge-text-primary)]">
                    Current:
                  </span>{" "}
                  {item.currentState}
                </div>
                <div>
                  <span className="font-semibold text-[var(--tge-text-primary)]">
                    Next:
                  </span>{" "}
                  {item.nextAction}
                </div>
              </div>
              <div className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-[var(--tge-text-secondary)]">
                Priority: {item.priority}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {designReadinessPriorities.map((priority) => (
          <div key={priority.title} className={`${adminClass.panelSubtle} p-4`}>
            <h3 className={`text-sm font-bold ${adminClass.title}`}>
              {priority.title}
            </h3>
            <p className={`mt-2 text-xs leading-5 ${adminClass.body}`}>
              {priority.description}
            </p>
            <ul className={`mt-3 space-y-1.5 text-xs leading-5 ${adminClass.muted}`}>
              {priority.decisions.map((decision) => (
                <li key={decision}>{decision}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function FaqItem({
  question,
  children,
  defaultOpen = false,
}: {
  question: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className={`group ${adminClass.panel} open:bg-[var(--tge-surface-page)]`}
    >
      <summary className="cursor-pointer list-none px-4 py-3 md:px-5 md:py-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className={`flex items-center gap-2 text-[15px] font-bold ${adminClass.title}`}>
            {question}
            <span className="text-lg font-bold leading-none text-[var(--tge-brand-green)] group-open:hidden">
              +
            </span>
            <span className="hidden text-lg font-bold leading-none text-[var(--tge-brand-green)] group-open:inline">
              −
            </span>
          </h3>
        </div>
      </summary>
      <div className={`border-t border-[var(--tge-governance-neutral-border)] px-4 py-3 text-sm leading-7 ${adminClass.body} md:px-5 md:py-4`}>
        {children}
      </div>
    </details>
  );
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as { role?: string | null }).role;
  const isUserManager = canManageUsers(role);
  const isVocabularyManager = canManageVocabularies(role);

  if (!canAccessAdmin(role)) {
    redirect("/");
  }

  const [governanceSnapshot, userSummary] = await Promise.all([
    getGovernanceSnapshot(),
    isUserManager ? getUserSummary() : Promise.resolve(null),
  ]);

  return (
    <main className="space-y-8">
      <section className={adminClass.panel}>
        <div className="grid grid-cols-1 xl:grid-cols-[1.45fr_0.9fr]">
          <div className="border-l-4 border-l-[var(--tge-brand-green)] px-6 py-6 md:px-8 md:py-8">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]">
              ADMIN
            </p>
            <h1 className={`mt-3 text-3xl font-bold tracking-tight ${adminClass.title} md:text-4xl xl:text-[42px]`}>
              Platform Guide & Control Center
            </h1>
            <p className={`mt-4 max-w-3xl text-base leading-7 ${adminClass.body}`}>
              Internal guide for workflow, company categorization, company link roles,
              ownership/operator logic, and relationship structure across the geothermal database.
            </p>
            <p className="mt-3 text-sm font-semibold text-[var(--tge-brand-green)]">
              Always structure data → never describe structure in text.
            </p>
          </div>

          <div className="border-t border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-6 py-6 xl:border-l xl:border-t-0">
            <div className="flex flex-wrap items-start justify-start gap-3 xl:justify-end">
              {isUserManager ? (
                <ActionButton href="/admin/users" variant="primary">
                  Open User Management
                </ActionButton>
              ) : null}
              {isVocabularyManager ? (
                <ActionButton href="/admin/vocabularies" variant="secondary">
                  Manage Vocabularies
                </ActionButton>
              ) : null}
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-6 py-4 md:px-8">
          <div className="flex flex-wrap gap-3">
            {isUserManager ? <TocLink href="#access" label="User Access" /> : null}
            <TocLink href="#workflow" label="Workflow" />
            <TocLink href="#governance" label="Governance" />
            <TocLink href="#analysis-registry" label="Analysis Registry" />
            <TocLink href="#design-readiness" label="Design Readiness" />
            <TocLink href="#classification" label="Company Logic" />
            <TocLink href="#linking" label="Linking Rules" />
            <TocLink href="#company-link-roles" label="Company Link Roles" />
            <TocLink href="#relationships" label="Relationships" />
            <TocLink href="#faq" label="FAQ" />
          </div>
        </div>
      </section>

      {isUserManager && userSummary ? (
        <SectionCard
          id="access"
          title="Platform Access Snapshot"
          description="Administrator-only overview of user access before managing accounts, roles, and deactivation."
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <GovernanceMetric
              label="Total Users"
              value={userSummary.total}
              note="All user accounts stored in the platform"
            />
            <GovernanceMetric
              label="Active Users"
              value={userSummary.active}
              note="Users currently able to sign in"
            />
            <GovernanceMetric
              label="Admins"
              value={userSummary.admins}
              note="Full access including users and vocabularies"
            />
            <GovernanceMetric
              label="Editors"
              value={userSummary.editors}
              note="Review, approval, and export-capable users"
            />
            <GovernanceMetric
              label="Researchers"
              value={userSummary.researchers}
              note="Research, draft, and data-entry users"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[1fr_1fr_0.75fr]">
            <GovernanceRule
              title="Admin-only account control"
              text="Only administrators can add users, reset passwords, change roles, or deactivate access."
            />
            <GovernanceRule
              title="Role-aware platform"
              text="Navigation and actions increasingly separate researcher, editor, senior editor, admin, and future subscriber experiences."
            />
            <div className={`flex items-center justify-start px-4 py-3 xl:justify-end ${adminClass.panelSubtle}`}>
              <ActionButton href="/admin/users" variant="primary">
                Manage Users
              </ActionButton>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard
        id="governance"
        title="PostgreSQL Governance Snapshot"
        description="Read-only MVP control layer for taxonomy coverage, review states, export gates, and AI/source workflow readiness."
      >
        {governanceSnapshot.ok ? (
          <>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <GovernanceMetric
                label="Entity Vocabularies"
                value={governanceSnapshot.entityVocabularyCount}
                note="Use types, lifecycle phases, estimate states, and company categories"
              />
              <GovernanceMetric
                label="Source Vocabularies"
                value={governanceSnapshot.sourceVocabularyCount}
                note="Source types and visibility levels"
              />
              <GovernanceMetric
                label="Review States"
                value={
                  governanceSnapshot.reviewStatusCount +
                  governanceSnapshot.sourceStatusCount +
                  governanceSnapshot.articleFactStatusCount
                }
                note="Entity, source, and article-fact review workflows"
              />
              <GovernanceMetric
                label="Fact Presets"
                value={
                  governanceSnapshot.articleFactTypeCount +
                  governanceSnapshot.sourceFactPresetCount
                }
                note="Article fact definitions and source evidence presets"
              />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
              <GovernanceRule
                title="Approval Gate"
                text="Projects, plants, and companies cannot move to approved/export-ready without required identity, classification, and linked evidence."
              />
              <GovernanceRule
                title="Evidence Governance"
                text="Source links create evidence context only; they do not overwrite entity fields without separate human-confirmed review."
              />
              <GovernanceRule
                title="Export Permissions"
                text="Broad PostgreSQL exports are limited to editor, senior editor, and admin roles."
              />
            </div>
          </>
        ) : (
          <div className={`px-4 py-3 text-sm leading-6 ${adminClass.warningPanel}`}>
            PostgreSQL governance snapshot is unavailable in this environment.
            Error: {governanceSnapshot.error}
          </div>
        )}
      </SectionCard>

      <SectionCard
        id="analysis-registry"
        title="Analysis Registry Governance"
        description="Admin overview of live analysis pages, definition-next modules, and future benchmark domains."
      >
        <AnalysisRegistryOverview />
      </SectionCard>

      <SectionCard
        id="design-readiness"
        title="Design Readiness"
        description="Bridge between the functional platform and the upcoming visual design doctrine."
      >
        <DesignReadinessOverview />
      </SectionCard>

      <SectionCard
        id="workflow"
        title="Standard Workflow"
        description="Recommended sequence for data entry and updates."
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <WorkflowBox
            step="1"
            title="Check existing"
            text="Search first to avoid duplicates."
          />
          <WorkflowBox
            step="2"
            title="Create / edit"
            text="Enter core structured data."
          />
          <WorkflowBox
            step="3"
            title="Link companies"
            text="Assign structured asset roles."
          />
          <WorkflowBox
            step="4"
            title="Review logic"
            text="Check ownership, operator, and relationship structure."
          />
          <WorkflowBox
            step="5"
            title="Validate"
            text="Check naming, logic, and completeness."
          />
        </div>
      </SectionCard>

      <SectionCard
        id="classification"
        title="Company Classification"
        description="Keep company identity separate from project and plant participation."
      >
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          <RuleCard
            title="Company Type"
            subtitle="What the company is in general."
            examples="Developer, EPC Contractor, Drilling Company, Utility / IPP, Investor"
          />
          <RuleCard
            title="Project / Plant Role"
            subtitle="What the company does on a specific project or plant."
            examples="Owner, Operator, Operator Power, Operator Steam, Developer, EPC"
          />
          <RuleCard
            title="Secondary Types"
            subtitle="Capabilities only, not asset-level participation."
            examples="Engineering, Construction, Infrastructure finance, Reservoir engineering"
          />
        </div>

        <div className={`mt-3 px-4 py-3 text-sm ${adminClass.warningPanel}`}>
          Never use company type to describe project or plant participation. Project and plant participation should live in linked projects and linked plants.
        </div>
      </SectionCard>

      <SectionCard
        id="linking"
        title="Project & Plant Linking Rules"
        description="Use structured linking after the project or plant record exists."
      >
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <div className={`${adminClass.panelSubtle} p-4`}>
            <div className={`text-sm font-bold ${adminClass.title}`}>
              Each linked company should include
            </div>
            <ul className={`mt-2 list-disc space-y-1 pl-5 text-sm ${adminClass.body}`}>
              <li>Role (required)</li>
              <li>Role detail (optional)</li>
              <li>Ownership % only if there is an economic stake</li>
              <li>Notes only for useful context</li>
            </ul>
          </div>

          <div className={`${adminClass.panelSubtle} p-4`}>
            <div className={`text-sm font-bold ${adminClass.title}`}>
              Quick example
            </div>
            <div className={`mt-2 space-y-1 text-sm ${adminClass.body}`}>
              <div>Ormat → Owner</div>
              <div>Ormat → Operator</div>
              <div>Ormat → Developer</div>
              <div>Ormat → Turbine Supplier</div>
              <div>Ownership % → only where an economic stake is known</div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        id="company-link-roles"
        title="Company Link Roles — How to Use Them"
        description="Structured company links are now the source of truth for owner, operator, developer, and related asset-role analytics."
      >
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <div className={`${adminClass.panelSubtle} p-4`}>
            <div className={`text-sm font-bold ${adminClass.title}`}>
              Core asset-control roles
            </div>
            <ul className={`mt-3 list-disc space-y-1 pl-5 text-sm ${adminClass.body}`}>
              <li>Owner</li>
              <li>Operator</li>
              <li>Operator Power</li>
              <li>Operator Steam</li>
              <li>Developer</li>
              <li>Resource Owner</li>
            </ul>
          </div>

          <div className={`${adminClass.panelSubtle} p-4`}>
            <div className={`text-sm font-bold ${adminClass.title}`}>
              Financial / delivery / technical roles
            </div>
            <ul className={`mt-3 list-disc space-y-1 pl-5 text-sm ${adminClass.body}`}>
              <li>Investor</li>
              <li>EPC</li>
              <li>Drilling</li>
              <li>Turbine Supplier</li>
              <li>Supplier</li>
              <li>Consultant</li>
              <li>O&amp;M Contractor</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
          <RuleCard
            title="Operator"
            subtitle="Use only for normal integrated operation."
            examples="Use when one company operates the plant or project as a whole."
          />
          <RuleCard
            title="Operator Power / Operator Steam"
            subtitle="Use only where operation is split."
            examples="Example: one entity runs the power plant, another controls the steamfield or resource operations."
          />
          <RuleCard
            title="Ownership Share"
            subtitle="Use mainly for Owner, and where relevant Investor."
            examples="Leave blank for Operator, Operator Power, Operator Steam, EPC, drilling, supplier, consultant, and other service roles."
          />
        </div>

        <div className={`mt-4 px-4 py-3 text-sm ${adminClass.warningPanel}`}>
          Do not add generic <strong>Operator</strong> if <strong>Operator Power</strong> and/or <strong>Operator Steam</strong> are already used for the same asset, unless there is a very specific reason.
        </div>

        <div className={`mt-4 p-4 ${adminClass.panelSubtle}`}>
          <div className={`text-sm font-bold ${adminClass.title}`}>
            Transition rule
          </div>
          <p className={`mt-2 text-sm leading-6 ${adminClass.body}`}>
            Legacy free-text fields such as Owner/Operator and Developer remain in the database for continuity,
            but linked company roles should now be used as the analytical source of truth for future owner,
            operator, and developer analysis.
          </p>
        </div>
      </SectionCard>

      <SectionCard
        id="relationships"
        title="Company Relationships"
        description="Use only for company-to-company structure."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className={`${adminClass.panelSubtle} p-4`}>
            <div className={`text-sm font-bold ${adminClass.title}`}>Use for</div>
            <ul className={`mt-3 list-disc space-y-1 pl-5 text-sm ${adminClass.body}`}>
              <li>Parent / subsidiary</li>
              <li>Ownership stakes</li>
              <li>Holding structures</li>
              <li>Group reporting structure</li>
            </ul>
          </div>

          <div className={`${adminClass.panelSubtle} p-4`}>
            <div className={`text-sm font-bold ${adminClass.title}`}>
              Do NOT use for
            </div>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--tge-governance-danger-text)]">
              <li>Project roles</li>
              <li>Plant participation</li>
              <li>Owner / operator logic on a specific asset</li>
            </ul>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        id="faq"
        title="Quick FAQ"
        description="Common questions for researchers and temporary data-entry support."
      >
        <div className="space-y-3">
          <FaqItem question="When do I create a new company?" defaultOpen>
            Always search first. Create a new company only if it does not already
            exist under a different spelling, legal suffix, or subsidiary name.
          </FaqItem>

          <FaqItem question="When do I use ownership %?">
            Use ownership % mainly when the company has a direct economic stake,
            especially for Owner and sometimes Investor. Do not use it for most
            technical or service roles.
          </FaqItem>

          <FaqItem question="What is the difference between company type and role?">
            Company type describes what the company is in general. Role describes
            what the company does on a specific project or plant.
          </FaqItem>

          <FaqItem question="When do I use Operator vs Operator Power / Operator Steam?">
            Use Operator only for normal integrated operation. Use Operator Power
            and Operator Steam only where the power plant and steamfield/resource
            operations are split between entities.
          </FaqItem>

          <FaqItem question="Can one company have multiple roles on the same asset?">
            Yes. Use one row per role. For example, a company can be Owner,
            Operator, and Developer on the same plant or project.
          </FaqItem>

          <FaqItem question="Should I add companies before or after creating a project or plant?">
            Create the project or plant first. Then use the edit page to add
            structured linked companies and assign roles.
          </FaqItem>

          <FaqItem question="What if I do not know all information yet?">
            Enter what is known, but structure it correctly. Missing data can be
            added later. Partial but well-structured data is better than complete
            free-text notes.
          </FaqItem>
        </div>
      </SectionCard>
    </main>
  );
}
