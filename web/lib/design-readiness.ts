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

export type DesignEntryGateStatus = "accepted" | "confirm" | "design_phase";

export type DesignEntryGate = {
  area: string;
  status: DesignEntryGateStatus;
  note: string;
};

export type DesignReviewPage = {
  label: string;
  href: string;
  group: "Design" | "Intelligence" | "Operations" | "Evidence" | "Governance";
  note: string;
};

export type DesignPassSequenceItem = {
  phase: string;
  target: string;
  pages: string[];
  purpose: string;
  acceptanceSignal: string;
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

export const designEntryGates: DesignEntryGate[] = [
  {
    area: "Route and navigation architecture",
    status: "accepted",
    note: "Clean routes, PostgreSQL staging routes, role-aware command search, and future sidebar contract are documented.",
  },
  {
    area: "Role entry points and visibility",
    status: "confirm",
    note: "Subscriber, researcher, editor, and administrator defaults are defined; final role-specific emphasis should be confirmed in design.",
  },
  {
    area: "Semantic color meaning",
    status: "accepted",
    note: "Lifecycle, governance, source, confidence, and severity meanings are tokenized and documented.",
  },
  {
    area: "Entity and evidence workflow",
    status: "accepted",
    note: "Projects, Plants, Companies, Sources, Research Ops, and review flows have stable functional architecture.",
  },
  {
    area: "Responsive and density behavior",
    status: "design_phase",
    note: "Table density, mobile cards, map drawer behavior, and review queue ergonomics should be finalized in visual design.",
  },
  {
    area: "Form field states",
    status: "design_phase",
    note: "Required, edited, pending approval, approved, rejected, and blocked states need final visual treatment.",
  },
];

export const designPassSequence: DesignPassSequenceItem[] = [
  {
    phase: "Pass 1",
    target: "Product Shell And Intelligence Layer",
    pages: ["App shell", "Dashboard", "Markets", "Analysis", "Map"],
    purpose:
      "Set the core platform identity, executive rhythm, market intelligence language, chart grammar, map treatment, and role-aware navigation shell.",
    acceptanceSignal:
      "The platform reads as a geothermal intelligence product before it reads as an internal database.",
  },
  {
    phase: "Pass 2",
    target: "Entity Workspaces And Evidence Backbone",
    pages: ["Projects", "Plants", "Companies", "Sources", "Research Ops"],
    purpose:
      "Carry the intelligence language into dense operational workspaces while preserving edit speed, evidence linkage, relationship workflows, and queue clarity.",
    acceptanceSignal:
      "Researchers can scan, edit, link evidence, and move to the next action without fighting table density.",
  },
  {
    phase: "Pass 3",
    target: "Governance, Review Queues, And Administration",
    pages: [
      "Article Matches",
      "Article Facts",
      "AI Field Suggestions",
      "Readiness",
      "Admin",
    ],
    purpose:
      "Finalize governance visual language for human confirmation, source quality, AI-assisted review, cutover readiness, and platform administration.",
    acceptanceSignal:
      "Editors and administrators can distinguish suggestion, confirmation, approval, rejection, blocker, and audit states instantly.",
  },
];

export const designReviewPageSet: DesignReviewPage[] = [
  {
    label: "Pass 1 Design Concept",
    href: "/design/pass-1",
    group: "Design",
    note: "Non-production mockup lab for app shell, dashboard, markets, analysis, map, palette, and mobile behavior.",
  },
  {
    label: "Dashboard",
    href: "/",
    group: "Intelligence",
    note: "Executive geothermal intelligence entry point.",
  },
  {
    label: "Markets",
    href: "/markets",
    group: "Intelligence",
    note: "Market and regional intelligence parent layer.",
  },
  {
    label: "Analysis",
    href: "/analysis",
    group: "Intelligence",
    note: "Analysis module registry and benchmark entry point.",
  },
  {
    label: "Developer Analysis",
    href: "/analysis/developers",
    group: "Intelligence",
    note: "Relationship-driven attribution module.",
  },
  {
    label: "Owners & Operators",
    href: "/analysis/owners-operators",
    group: "Intelligence",
    note: "Owner/operator analysis module.",
  },
  {
    label: "Turbine Technology",
    href: "/analysis/turbine-technology",
    group: "Intelligence",
    note: "Technology and supplier benchmark module.",
  },
  {
    label: "Map",
    href: "/map",
    group: "Intelligence",
    note: "Spatial intelligence and future expanded map shell.",
  },
  {
    label: "Projects",
    href: "/postgres-preview/projects",
    group: "Operations",
    note: "Pipeline worklist and project editing surface.",
  },
  {
    label: "Plants",
    href: "/postgres-preview/operating-assets",
    group: "Operations",
    note: "Operating fleet worklist and plant editing surface.",
  },
  {
    label: "Companies",
    href: "/postgres-preview/companies",
    group: "Operations",
    note: "Company ecosystem and relationship workspace.",
  },
  {
    label: "Research Ops",
    href: "/postgres-preview/research-ops",
    group: "Operations",
    note: "Queue, assignment, validation, and activity command center.",
  },
  {
    label: "Sources",
    href: "/sources",
    group: "Evidence",
    note: "Evidence backbone and source governance.",
  },
  {
    label: "Article Matches",
    href: "/sources/matches",
    group: "Evidence",
    note: "Article-to-entity review queue.",
  },
  {
    label: "Article Facts",
    href: "/sources/facts",
    group: "Evidence",
    note: "Extracted fact candidate review queue.",
  },
  {
    label: "Readiness",
    href: "/postgres-preview/readiness",
    group: "Governance",
    note: "Replacement readiness and cutover governance.",
  },
  {
    label: "Admin",
    href: "/admin",
    group: "Governance",
    note: "Platform administration and design-readiness overview.",
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
