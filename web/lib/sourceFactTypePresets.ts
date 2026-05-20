export type SourceFactTypePreset = {
  label: string;
  evidenceType: string;
  linkedField: string;
};

export const SOURCE_FACT_TYPE_PRESETS: SourceFactTypePreset[] = [
  {
    label: "Capacity",
    evidenceType: "capacity_signal",
    linkedField: "capacity",
  },
  {
    label: "COD / Timing",
    evidenceType: "cod_year_signal",
    linkedField: "target_cod_year",
  },
  {
    label: "Public Funding / Grant Amount",
    evidenceType: "public_funding_grant_amount_signal",
    linkedField: "public_funding_or_grant_amount",
  },
  {
    label: "Financing / Investment Amount",
    evidenceType: "financing_investment_amount_signal",
    linkedField: "financing_or_investment_amount",
  },
  {
    label: "Debt / Loan Amount",
    evidenceType: "debt_loan_amount_signal",
    linkedField: "debt_or_loan_amount",
  },
  {
    label: "Contract Award Amount",
    evidenceType: "contract_award_amount_signal",
    linkedField: "contract_value",
  },
  {
    label: "License / Lease Sale Amount",
    evidenceType: "license_lease_sale_amount_signal",
    linkedField: "license_or_lease_sale_amount",
  },
  {
    label: "License / Permit Status",
    evidenceType: "license_permit_award_signal",
    linkedField: "license_or_permit_status",
  },
  {
    label: "Ownership / Operator",
    evidenceType: "ownership_operator_signal",
    linkedField: "owner_operator",
  },
  {
    label: "Direct-Use Category",
    evidenceType: "direct_use_category_signal",
    linkedField: "direct_use_category",
  },
  {
    label: "Technology / Resource",
    evidenceType: "technology_resource_signal",
    linkedField: "technology_or_resource",
  },
  {
    label: "Policy / Tariff",
    evidenceType: "policy_tariff_signal",
    linkedField: "policy_or_tariff",
  },
];

