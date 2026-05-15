import type { SelectOption } from "./shared";

export const OWNERSHIP_TYPE_OPTIONS: SelectOption[] = [
  { value: "", label: "Select ownership type" },
  { value: "Private", label: "Private" },
  { value: "Public", label: "Public" },
  { value: "State-owned", label: "State-owned" },
  { value: "Publicly listed", label: "Publicly listed" },
  { value: "Joint venture", label: "Joint venture" },
  { value: "Non-profit", label: "Non-profit" },
  { value: "Mixed", label: "Mixed" },
];

export const ENTITY_TYPE_OPTIONS: SelectOption[] = [
  { value: "", label: "Select entity type" },
  { value: "Operating entity", label: "Operating entity" },
  { value: "Holding company", label: "Holding company" },
  { value: "Subsidiary", label: "Subsidiary" },
  { value: "Business unit", label: "Business unit" },
  { value: "Association", label: "Association" },
  { value: "Advocacy / non-profit", label: "Advocacy / non-profit" },
  { value: "Government / public agency", label: "Government / public agency" },
];

export const COMPANY_TYPE_PRIMARY_OPTIONS: SelectOption[] = [
  { value: "", label: "Select primary type" },
  { value: "Resource owner", label: "Resource owner" },
  { value: "Developer", label: "Developer" },
  { value: "Technology provider", label: "Technology provider" },
  { value: "Utility / IPP", label: "Utility / IPP" },
  { value: "Turbine supplier", label: "Turbine supplier" },
  { value: "OEM / Equipment supplier", label: "OEM / Equipment supplier" },
  { value: "Service provider", label: "Service provider" },
  { value: "Drilling company", label: "Drilling company" },
  { value: "EPC contractor", label: "EPC contractor" },
  { value: "Investment / finance", label: "Investment / finance" },
  { value: "Energy major", label: "Energy major" },
  { value: "Public / development institution", label: "Public / development institution" },
  { value: "Association / industry body", label: "Association / industry body" },
  { value: "Advocacy / non-profit", label: "Advocacy / non-profit" },
  { value: "Holding / group entity", label: "Holding / group entity" },
  { value: "SPV / project company", label: "SPV / project company" },
];