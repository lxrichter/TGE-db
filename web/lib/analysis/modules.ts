export type AnalysisModuleStatus = "live" | "definition_next" | "planned";

export type AnalysisModuleCategory =
  | "market"
  | "technology"
  | "company_roles"
  | "pipeline"
  | "resource"
  | "operations";

export type AnalysisModule = {
  id: string;
  title: string;
  description: string;
  href?: string;
  status: AnalysisModuleStatus;
  category: AnalysisModuleCategory;
  sourceBasis: string;
  primaryMeasures: string[];
  nextDefinition?: string;
  definitionQuestions?: string[];
  dataPrerequisites?: string[];
};

export const analysisStatusLabels: Record<AnalysisModuleStatus, string> = {
  live: "Live",
  definition_next: "Define Next",
  planned: "Planned",
};

export const analysisStatusDescriptions: Record<AnalysisModuleStatus, string> = {
  live: "Available now in the analysis workspace.",
  definition_next: "Needs scope, measures, and source logic confirmed before build-out.",
  planned: "Future analysis module once source fields and roll-up logic are ready.",
};

export const analysisModules: AnalysisModule[] = [
  {
    id: "country-markets",
    title: "Country Market Analysis",
    description:
      "Installed capacity by country market and TGE region, planned project MWe, and market-level project phase distribution.",
    href: "/analysis/countries",
    status: "live",
    category: "market",
    sourceBasis: "Plants, projects, countries, and market taxonomy",
    primaryMeasures: [
      "Installed MWe",
      "Pipeline MWe",
      "Project count",
      "Plant count",
    ],
  },
  {
    id: "turbine-technology",
    title: "Turbine Technology Analysis",
    description:
      "Installed capacity, operating capacity, unit counts, and supplier overview derived from plant technology and turbine supplier fields.",
    href: "/analysis/turbine-technology",
    status: "live",
    category: "technology",
    sourceBasis: "Plants database: plant technology, turbine supplier, installed MWe, running MWe, units",
    primaryMeasures: [
      "Installed MWe",
      "Operating MWe",
      "Units",
      "Supplier share",
    ],
  },
  {
    id: "owners-operators",
    title: "Owners & Operators Analysis",
    description:
      "Weighted owner MWe and operator-linked installed MWe based on structured company-to-plant links.",
    href: "/analysis/operators",
    status: "live",
    category: "company_roles",
    sourceBasis: "Company-to-plant links: owner/operator roles, ownership share, installed MWe",
    primaryMeasures: [
      "Weighted owner MWe",
      "Operator-linked MWe",
      "Linked plants",
      "Ownership share",
    ],
  },
  {
    id: "developer-analysis",
    title: "Developer Analysis",
    description:
      "Developer exposure across projects and plants, including planned MWe, project counts, and phase distribution.",
    status: "definition_next",
    category: "company_roles",
    sourceBasis: "Company-to-project links, company-to-plant links, project phase, planned MWe",
    primaryMeasures: [
      "Pipeline MWe",
      "Project count",
      "Construction MWe",
      "Country exposure",
    ],
    nextDefinition:
      "Confirm which relationship roles count as developer, co-developer, resource owner, or sponsor.",
    definitionQuestions: [
      "Which company-to-project roles count as developer, co-developer, resource owner, sponsor, or public agency?",
      "Should planned MWe be fully attributed to every developer link, or weighted when a role/share field exists?",
      "Should construction-stage projects be separated from earlier pipeline phases in the primary ranking?",
    ],
    dataPrerequisites: [
      "Normalized company-to-project role vocabulary",
      "Project phase and planned MWe coverage",
      "Country and TGE region references for market drilldowns",
    ],
  },
  {
    id: "company-role-analysis",
    title: "Company Roles Analysis",
    description:
      "Cross-role view of EPC, drilling, turbine supply, investor, O&M, developer, owner, and operator participation.",
    status: "definition_next",
    category: "company_roles",
    sourceBasis: "Structured company-to-project and company-to-plant role links",
    primaryMeasures: [
      "Role count",
      "Linked MWe",
      "Country footprint",
      "Evidence coverage",
    ],
    nextDefinition:
      "Define role grouping rules so similar roles roll up consistently across projects and plants.",
    definitionQuestions: [
      "Which roles should be grouped under developer, operator, owner, EPC, drilling, supplier, investor, utility, and public agency?",
      "Should project roles and plant roles appear in one combined view or separate benchmark tabs?",
      "Which role groups should count MWe and which should only count linked profiles or activity footprint?",
    ],
    dataPrerequisites: [
      "Normalized role group taxonomy",
      "Evidence-linked company-to-project and company-to-plant relationships",
      "Consistent plant installed MWe and project planned MWe fields",
    ],
  },
  {
    id: "project-phase-analysis",
    title: "Project Phase Analysis",
    description:
      "Pipeline overview by development phase, including counts and MWe by prospect, exploration, feasibility, construction, operating, and cancelled states.",
    status: "planned",
    category: "pipeline",
    sourceBasis: "Projects database: project phase, planned MWe, country, region, review status",
    primaryMeasures: [
      "Phase MWe",
      "Project count",
      "Phase share",
      "Source gaps",
    ],
    definitionQuestions: [
      "Which project phases should be part of the public-facing lifecycle vocabulary?",
      "Should Prospect/TBD be shown as Prospect, Unknown, or excluded from strategic pipeline charts?",
      "Which phases should be considered export-ready without additional review?",
    ],
    dataPrerequisites: [
      "Normalized project phase values",
      "Project planned MWe coverage",
      "Project evidence/source readiness indicators",
    ],
  },
  {
    id: "resource-type-analysis",
    title: "Resource Type Analysis",
    description:
      "Breakdown of hydrothermal, EGS, AGS, closed-loop, superhot, and other geothermal resource categories across projects and plants.",
    status: "planned",
    category: "resource",
    sourceBasis: "Project and plant resource-type fields after taxonomy normalization",
    primaryMeasures: [
      "Installed MWe",
      "Pipeline MWe",
      "Record count",
      "Country footprint",
    ],
    definitionQuestions: [
      "Which resource categories should be first-class filters: hydrothermal, EGS, AGS, closed-loop, superhot, or other?",
      "Should resource type be allowed at both project and plant level?",
      "How should unknown or mixed resource systems be shown in analysis tables?",
    ],
    dataPrerequisites: [
      "Resource type taxonomy",
      "Project and plant resource type coverage",
      "Country and TGE region references for aggregation",
    ],
  },
  {
    id: "direct-use-analysis",
    title: "Direct Use & Heat Analysis",
    description:
      "Future heat-focused analysis for district heating, industrial heat, cooling, agricultural use, and other direct-use categories.",
    status: "planned",
    category: "operations",
    sourceBasis: "Projects and plants with geothermal use category, MWth, annual heat output, and source confidence",
    primaryMeasures: [
      "MWth",
      "Use category",
      "Country footprint",
      "Source coverage",
    ],
    definitionQuestions: [
      "Which heat-use categories should be first-class: district heating, industrial heat, agriculture, cooling, balneology, or other?",
      "Should heat projects and heat plants be analyzed together or separated like power projects and plants?",
      "Which MWth and annual heat-output fields are reliable enough for benchmark views?",
    ],
    dataPrerequisites: [
      "Normalized geothermal use category",
      "MWth and heat-output coverage",
      "Evidence/source confidence for direct-use records",
    ],
  },
  {
    id: "wellfield-analysis",
    title: "Wellfield Analysis",
    description:
      "Well-related analysis covering total wells, production wells, reinjection wells, depth, and selected resource indicators.",
    status: "planned",
    category: "operations",
    sourceBasis: "Project and plant wellfield fields after validation and unit normalization",
    primaryMeasures: [
      "Total wells",
      "Production wells",
      "Reinjection wells",
      "Depth indicators",
    ],
    definitionQuestions: [
      "Which well metrics should be mandatory for the first analysis: total wells, production wells, reinjection wells, or drilling depth?",
      "Should well counts be tied to projects, plants, fields, or all three depending on source context?",
      "How should historic, planned, and currently active wells be separated?",
    ],
    dataPrerequisites: [
      "Wellfield field normalization",
      "Unit and depth standardization",
      "Evidence references for well counts and drilling indicators",
    ],
  },
];

export function analysisModulesByStatus(status: AnalysisModuleStatus) {
  return analysisModules.filter((module) => module.status === status);
}

export function getAnalysisModule(id: string) {
  return analysisModules.find((module) => module.id === id);
}

export function getRequiredAnalysisModule(id: string) {
  const module = getAnalysisModule(id);

  if (!module) {
    throw new Error(`Missing analysis module definition: ${id}`);
  }

  return module;
}
