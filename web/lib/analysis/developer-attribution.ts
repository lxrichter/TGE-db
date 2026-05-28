export type DeveloperAnalysisRole = {
  label: string;
  normalizedKeys: string[];
};

export const DEVELOPER_ANALYSIS_ROLES: DeveloperAnalysisRole[] = [
  {
    label: "Developer",
    normalizedKeys: ["developer"],
  },
  {
    label: "Co-Developer",
    normalizedKeys: ["co-developer", "co developer"],
  },
  {
    label: "Project Sponsor",
    normalizedKeys: ["project sponsor"],
  },
  {
    label: "Lead Developer",
    normalizedKeys: ["lead developer"],
  },
];

export const DEVELOPER_ANALYSIS_ROLE_LABELS = DEVELOPER_ANALYSIS_ROLES.map(
  (role) => role.label
);

export const DEVELOPER_ANALYSIS_ROLE_KEYS = new Set(
  DEVELOPER_ANALYSIS_ROLES.flatMap((role) => role.normalizedKeys)
);

export const DEVELOPER_ANALYSIS_ATTRIBUTION_RULE =
  "Single developer receives 100%. Multiple developers use valid link weights where all are present; otherwise project MWe is split equally among developer links.";

export function normalizeDeveloperAnalysisRole(value: string | null) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function isDeveloperAnalysisRole(value: string | null) {
  return DEVELOPER_ANALYSIS_ROLE_KEYS.has(normalizeDeveloperAnalysisRole(value));
}
