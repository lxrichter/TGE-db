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
