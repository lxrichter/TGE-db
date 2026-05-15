export type AssetCompanyRoleOption = {
  value: string;
  label: string;
};

export const ASSET_COMPANY_ROLE_OPTIONS: AssetCompanyRoleOption[] = [
  { value: "Owner", label: "Owner" },
  { value: "Operator", label: "Operator" },
  { value: "Operator Power", label: "Operator Power" },
  { value: "Operator Steam", label: "Operator Steam" },
  { value: "Developer", label: "Developer" },
  { value: "Resource Owner", label: "Resource Owner" },
  { value: "Investor", label: "Investor" },
  { value: "EPC", label: "EPC" },
  { value: "Drilling", label: "Drilling" },
  { value: "Turbine Supplier", label: "Turbine Supplier" },
  { value: "Supplier", label: "Supplier" },
  { value: "Consultant", label: "Consultant" },
  { value: "O&M Contractor", label: "O&M Contractor" },
];