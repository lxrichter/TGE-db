export type DesignToken = {
  name: string;
  cssVariable: string;
  doctrineCategory: string;
  intent: string;
};

export type DesignTokenGroup = {
  title: string;
  description: string;
  tokens: DesignToken[];
};

export const designTokenGroups: DesignTokenGroup[] = [
  {
    title: "Brand / Core",
    description:
      "Base ThinkGeoEnergy platform identity and neutral intelligence surfaces.",
    tokens: [
      {
        name: "brand-green",
        cssVariable: "--tge-brand-green",
        doctrineCategory: "Brand / Core",
        intent: "Primary ThinkGeoEnergy action and accent color.",
      },
      {
        name: "brand-dark",
        cssVariable: "--tge-brand-dark",
        doctrineCategory: "Brand / Core",
        intent: "Header, platform shell, and high-confidence dark neutral.",
      },
      {
        name: "surface-page",
        cssVariable: "--tge-surface-page",
        doctrineCategory: "Brand / Core",
        intent: "Calm workspace background.",
      },
      {
        name: "surface-card",
        cssVariable: "--tge-surface-card",
        doctrineCategory: "Brand / Core",
        intent: "Primary modular intelligence surface.",
      },
    ],
  },
  {
    title: "Lifecycle",
    description:
      "Market/development reality. These tokens must not imply evidence quality.",
    tokens: [
      {
        name: "lifecycle-prospect",
        cssVariable: "--tge-lifecycle-prospect-bg",
        doctrineCategory: "Lifecycle",
        intent: "Early-stage or not fully classified projects.",
      },
      {
        name: "lifecycle-exploration",
        cssVariable: "--tge-lifecycle-exploration-bg",
        doctrineCategory: "Lifecycle",
        intent: "Active exploration or early development.",
      },
      {
        name: "lifecycle-feasibility",
        cssVariable: "--tge-lifecycle-feasibility-bg",
        doctrineCategory: "Lifecycle",
        intent: "Feasibility and advanced pre-construction work.",
      },
      {
        name: "lifecycle-construction",
        cssVariable: "--tge-lifecycle-construction-bg",
        doctrineCategory: "Lifecycle",
        intent: "Construction or near-operational state.",
      },
      {
        name: "lifecycle-operating",
        cssVariable: "--tge-lifecycle-operating-bg",
        doctrineCategory: "Lifecycle",
        intent: "Operating plant or commissioned capacity.",
      },
      {
        name: "lifecycle-cancelled",
        cssVariable: "--tge-lifecycle-cancelled-bg",
        doctrineCategory: "Lifecycle",
        intent: "Cancelled, discontinued, or not proceeding.",
      },
    ],
  },
  {
    title: "Governance / Review",
    description:
      "Human workflow, approval, blockers, and internal governance state.",
    tokens: [
      {
        name: "governance-success",
        cssVariable: "--tge-governance-success-bg",
        doctrineCategory: "Governance",
        intent: "Approved, complete, export-ready, or high confidence.",
      },
      {
        name: "governance-info",
        cssVariable: "--tge-governance-info-bg",
        doctrineCategory: "Governance",
        intent: "Active workflow, validation, or process state.",
      },
      {
        name: "governance-attention",
        cssVariable: "--tge-governance-attention-bg",
        doctrineCategory: "Governance",
        intent: "Needs review, incomplete, weak evidence, or fallback logic.",
      },
      {
        name: "governance-danger",
        cssVariable: "--tge-governance-danger-bg",
        doctrineCategory: "Governance",
        intent: "Rejected, blocker, restricted, or not output-safe.",
      },
      {
        name: "governance-muted",
        cssVariable: "--tge-governance-muted-bg",
        doctrineCategory: "Governance",
        intent: "Draft, archived, historical, or advisory context.",
      },
    ],
  },
  {
    title: "AI / Evidence",
    description:
      "Secondary internal assistance and source-confidence states. Human-confirmed content stays visually dominant.",
    tokens: [
      {
        name: "ai-suggested",
        cssVariable: "--tge-ai-suggested-bg",
        doctrineCategory: "AI",
        intent: "AI-proposed or candidate content pending human review.",
      },
      {
        name: "evidence-supported",
        cssVariable: "--tge-governance-success-bg",
        doctrineCategory: "Evidence",
        intent: "Credible or supported evidence.",
      },
      {
        name: "evidence-partial",
        cssVariable: "--tge-governance-attention-bg",
        doctrineCategory: "Evidence",
        intent: "Partial, stale, weak, or review-needed evidence.",
      },
      {
        name: "evidence-rejected",
        cssVariable: "--tge-governance-danger-bg",
        doctrineCategory: "Evidence",
        intent: "Rejected or not usable evidence.",
      },
    ],
  },
];
