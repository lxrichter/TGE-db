export type SelectOption = {
  value: string;
  label: string;
};

export function withCurrentValue(
  options: SelectOption[],
  currentValue?: string | null
): SelectOption[] {
  const current = (currentValue || "").trim();

  if (!current) return options;

  const exists = options.some((option) => option.value === current);
  if (exists) return options;

  return [{ value: current, label: `${current} (current)` }, ...options];
}

export const RESEARCH_STATUS_OPTIONS: SelectOption[] = [
  { value: "", label: "Select status" },
  { value: "Done", label: "Done" },
  { value: "In Progress", label: "In Progress" },
  { value: "Need Info", label: "Need Info" },
];

export const WB_REGION_OPTIONS: SelectOption[] = [
  { value: "", label: "Select WB region" },
  { value: "East Asia & Pacific", label: "East Asia & Pacific" },
  { value: "Europe & Central Asia", label: "Europe & Central Asia" },
  { value: "Latin America & Caribbean", label: "Latin America & Caribbean" },
  { value: "Middle East & North Africa", label: "Middle East & North Africa" },
  { value: "North America", label: "North America" },
  { value: "South Asia", label: "South Asia" },
  { value: "Sub-Saharan Africa", label: "Sub-Saharan Africa" },
];

export const REGION_OPTIONS: SelectOption[] = [
  { value: "", label: "Select region" },
  { value: "Africa", label: "Africa" },
  { value: "Asia", label: "Asia" },
  { value: "Central America & Caribbean", label: "Central America & Caribbean" },
  { value: "Europe", label: "Europe" },
  { value: "Middle East", label: "Middle East" },
  { value: "North America", label: "North America" },
  { value: "Oceania", label: "Oceania" },
  { value: "South America", label: "South America" },
  { value: "Southeast Asia", label: "Southeast Asia" },
];

export const PROJECT_PHASE_OPTIONS: SelectOption[] = [
  { value: "", label: "Select phase" },
  { value: "Prospect / TBD", label: "Prospect / TBD" },
  { value: "Exploration", label: "Exploration" },
  { value: "Feasibility", label: "Feasibility" },
  { value: "Construction", label: "Construction" },
  { value: "Operational", label: "Operational" },
  { value: "Cancelled", label: "Cancelled" },
];

export const RESOURCE_TYPE_OPTIONS = [
  { value: "", label: "Select resource type" },
  { value: "Hydrothermal", label: "Hydrothermal" },
  { value: "EGS", label: "EGS" },
  { value: "Closed-Loop", label: "Closed-Loop" },
  { value: "Superhot Rock", label: "Superhot Rock" },
  { value: "Superhot + EGS", label: "Superhot + EGS" },
  { value: "Geo-pressured", label: "Geo-pressured" },
  { value: "Co-production", label: "Co-production" },
];

export const PLANT_TECHNOLOGY_OPTIONS: SelectOption[] = [
  { value: "", label: "Select plant technology" },
  { value: "Single Flash", label: "Single Flash" },
  { value: "Double Flash", label: "Double Flash" },
  { value: "B-ORC", label: "B-ORC" },
  { value: "ORC", label: "ORC" },
  { value: "Kalina", label: "Kalina" },
  { value: "Dry Steam", label: "Dry Steam" },
  { value: "Hybrid", label: "Hybrid" },
];

export const YES_NO_OPTIONS: SelectOption[] = [
  { value: "1", label: "Yes / True" },
  { value: "0", label: "No / False" },
];

export const ASSET_COMPANY_ROLE_OPTIONS: SelectOption[] = [
  { value: "", label: "Select role" },
  { value: "Owner", label: "Owner" },
  { value: "Operator", label: "Operator" },
  { value: "Developer", label: "Developer" },
  { value: "Investor / Finance", label: "Investor / Finance" },
  { value: "EPC Contractor", label: "EPC Contractor" },
  { value: "Drilling Contractor", label: "Drilling Contractor" },
  { value: "Engineering / Consultant", label: "Engineering / Consultant" },
  { value: "Technology Supplier", label: "Technology Supplier" },
  { value: "Equipment Supplier", label: "Equipment Supplier" },
  { value: "O&M Provider", label: "O&M Provider" },
  { value: "Utility / Offtaker", label: "Utility / Offtaker" },
  { value: "Government / Public Support", label: "Government / Public Support" },
  { value: "Other", label: "Other" },
];