export type DesignReadinessPriority = {
  title: string;
  description: string;
  decisions: string[];
};

export type DesignAudienceEntryPoint = {
  audience: string;
  defaultEntry: string;
  primaryPages: string[];
  designGoal: string;
};

export type DesignComponentInventoryStatus =
  | "token_ready"
  | "partial"
  | "pending"
  | "design_phase";

export type DesignComponentInventoryPriority = "high" | "medium" | "low";

export type DesignComponentInventoryItem = {
  area: string;
  status: DesignComponentInventoryStatus;
  priority: DesignComponentInventoryPriority;
  scope: string;
  currentState: string;
  nextAction: string;
};

export const designAudienceEntryPoints: DesignAudienceEntryPoint[] = [
  {
    audience: "Subscribers",
    defaultEntry: "Dashboard",
    primaryPages: ["Dashboard", "Markets", "Analysis", "Map"],
    designGoal:
      "Show trusted geothermal intelligence first, with operational governance mostly hidden unless it affects confidence.",
  },
  {
    audience: "Researchers",
    defaultEntry: "Research Ops",
    primaryPages: ["Research Ops", "Projects", "Plants", "Companies", "Sources"],
    designGoal:
      "Make data entry, evidence linking, assigned work, and next required action fast and unmistakable.",
  },
  {
    audience: "Editors",
    defaultEntry: "Research Ops",
    primaryPages: [
      "Research Ops",
      "Sources",
      "Article Matches",
      "Fact Review",
      "Entity Review",
    ],
    designGoal:
      "Prioritize review queues, approval readiness, source quality, and governance exceptions.",
  },
  {
    audience: "Administrators",
    defaultEntry: "Command Center",
    primaryPages: ["Command Center", "Readiness", "Admin", "Users", "Vocabularies"],
    designGoal:
      "Expose platform health, access control, taxonomy governance, and cutover readiness without cluttering research workflows.",
  },
];

export const designReadinessPriorities: DesignReadinessPriority[] = [
  {
    title: "Information Architecture",
    description:
      "Define how the platform separates intelligence pages, research workspaces, evidence governance, and administration.",
    decisions: [
      "Confirm role-specific default landing pages",
      "Confirm primary navigation groups",
      "Confirm transition path from grouped top navigation to future left sidebar / mobile drawer",
      "Decide which governance pages are hidden from subscribers",
    ],
  },
  {
    title: "Role And Visibility Model",
    description:
      "Make subscriber, researcher, editor, and administrator views intentionally different without fragmenting the shared platform language.",
    decisions: [
      "Confirm subscribers see intelligence pages without Research Ops, audit logs, or reviewer uncertainty",
      "Confirm researchers see assigned work, entity editing, source linking, and queue actions first",
      "Confirm editors see validation, approval, export readiness, and evidence governance first",
      "Confirm administrators see users, vocabularies, platform health, readiness, and full routing",
    ],
  },
  {
    title: "Semantic Color Language",
    description:
      "Map color to meaning before styling individual pages, especially lifecycle, review state, severity, confidence, and source credibility.",
    decisions: [
      "Confirm project phase colors",
      "Confirm plant operating-status colors",
      "Confirm green / blue / amber / red / gray meaning",
    ],
  },
  {
    title: "Responsive Hierarchy",
    description:
      "Decide how dense tables, maps, forms, and review queues collapse from desktop to tablet and mobile.",
    decisions: [
      "Define mobile card priority for projects, plants, and companies",
      "Define map expanded mode and mobile filter drawer behavior",
      "Define which governance sections collapse by default",
    ],
  },
  {
    title: "Entity Workspaces",
    description:
      "Standardize Projects, Plants, Companies, Sources, and Markets around overview first, operational table second, detail workspace third.",
    decisions: [
      "Confirm default table columns",
      "Confirm edited / required / approval field states",
      "Confirm evidence and relationship panel hierarchy",
    ],
  },
  {
    title: "Analysis Visual Language",
    description:
      "Define how benchmark pages should show MWe, MWth, counts, shares, confidence, and attribution caveats.",
    decisions: [
      "Confirm bar/table/chart patterns for analysis modules",
      "Confirm governance QA visual treatment",
      "Confirm how subscriber-facing analysis differs from internal logic validation",
    ],
  },
  {
    title: "Forms And Approval",
    description:
      "Make create/edit workflows clearly separate draft saving, human review, approval, and audited application.",
    decisions: [
      "Define required-field visual states",
      "Define edited-field and pending-approval highlights",
      "Define save draft vs submit vs approve button hierarchy",
    ],
  },
];

export const semanticDesignRules = [
  {
    label: "Green",
    meaning: "Approved, usable, operating, complete, export-ready, or high confidence.",
  },
  {
    label: "Blue",
    meaning: "Active workflow, validation in progress, or structured process state.",
  },
  {
    label: "Amber",
    meaning: "Needs review, weak evidence, fallback logic, warning, or incomplete confidence.",
  },
  {
    label: "Red",
    meaning: "Rejected, blocker, restricted, cancelled, or not output-safe.",
  },
  {
    label: "Gray",
    meaning: "Draft, inactive, archived, historical, advisory, unknown, or neutral context.",
  },
];

export const designComponentInventory: DesignComponentInventoryItem[] = [
  {
    area: "Platform Shell",
    status: "token_ready",
    priority: "high",
    scope: "Header, grouped navigation, user bar, command palette",
    currentState:
      "Navigation architecture is centralized and shell colors now reference semantic tokens.",
    nextAction:
      "Use this registry when designing the future left-side navigation and role-aware entry points.",
  },
  {
    area: "Shared Page Primitives",
    status: "token_ready",
    priority: "high",
    scope: "Action buttons, page headers, overview bars, status badges, next-action strips",
    currentState:
      "Core reusable primitives have moved from hard-coded colors to semantic tokens.",
    nextAction:
      "Design phase can refine spacing, typography, and component proportions without changing page logic.",
  },
  {
    area: "Status, Phase, Governance",
    status: "token_ready",
    priority: "high",
    scope: "Lifecycle badges, review badges, governance cards, evidence snapshots",
    currentState:
      "Lifecycle, evidence, severity, confidence, and governance UI now share the token language.",
    nextAction:
      "Confirm final lifecycle and governance palette, then tune contrast and visual weight.",
  },
  {
    area: "Entity Tables",
    status: "partial",
    priority: "high",
    scope: "Projects, Plants, Companies list tables and quick-view cards",
    currentState:
      "Functionally strong, but table surfaces still include local spacing and color decisions.",
    nextAction:
      "Define default columns, density modes, mobile card collapse, and row-status hierarchy in design.",
  },
  {
    area: "Entity Edit Forms",
    status: "partial",
    priority: "high",
    scope: "Project, Plant, Company create/edit workflows, readiness rails, field states",
    currentState:
      "Workflow logic is mature, but required/edited/approval states need formal visual treatment.",
    nextAction:
      "Define form field tokens for required, edited, pending approval, blocked, and approved states.",
  },
  {
    area: "Relationship Workspaces",
    status: "partial",
    priority: "medium",
    scope: "Company roles, ownership links, project-plant links, relationship evidence",
    currentState:
      "Relationship logic is coherent, but dense relationship rows still need progressive-disclosure design.",
    nextAction:
      "Design compact relationship cards/tables with source status and role hierarchy built in.",
  },
  {
    area: "Sources Review Layer",
    status: "partial",
    priority: "medium",
    scope: "Sources, article matches, article facts, source forms, review pagination",
    currentState:
      "Workflow architecture is strong; review rows still need final density, grouping, and status hierarchy.",
    nextAction:
      "Design review-queue rows around status first, confidence second, evidence details expandable.",
  },
  {
    area: "Research Ops Queues",
    status: "partial",
    priority: "medium",
    scope: "Operational queues, researcher activity, persistent issues, AI review blocks",
    currentState:
      "Command-center hierarchy works; dense tables need compact mode and role-aware defaults.",
    nextAction:
      "Define queue cards, sticky subnavigation, researcher activity lens, and collapsed secondary queues.",
  },
  {
    area: "Analysis Modules",
    status: "partial",
    priority: "medium",
    scope: "Developer, owner/operator, turbine, country, lifecycle, benchmark pages",
    currentState:
      "Analysis definitions and governance QA exist; charts and ranking tables need final visual grammar.",
    nextAction:
      "Define analysis chart tokens, MWe/MWth hierarchy, table bars, attribution caveats, and QA treatment.",
  },
  {
    area: "Map Explorer",
    status: "design_phase",
    priority: "medium",
    scope: "Spatial filters, markers, popups, expanded map mode, future layers",
    currentState:
      "Expanded map mode and scalable filter architecture exist, but final map styling should wait for design.",
    nextAction:
      "Design standard vs expanded map modes, collapsible filters, marker taxonomy, and popup action hierarchy.",
  },
];
