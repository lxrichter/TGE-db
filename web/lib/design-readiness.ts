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
      "Decide which governance pages are hidden from subscribers",
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
