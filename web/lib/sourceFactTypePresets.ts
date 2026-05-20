import { getArticleFactTypeDefinition } from "@/lib/articleFactTypeDefinitions";

export type SourceFactTypePreset = {
  label: string;
  evidenceType: string;
  linkedField: string;
  category: "core" | "money" | "classification" | "matching";
};

export const SOURCE_FACT_TYPE_PRESETS: SourceFactTypePreset[] = [
  {
    label: "Capacity",
    evidenceType: "capacity_signal",
    linkedField: "capacity",
    category: "core",
  },
  {
    label: "COD / Timing",
    evidenceType: "cod_year_signal",
    linkedField: "target_cod_year",
    category: "core",
  },
  {
    label: "Public Funding / Grant Amount",
    evidenceType: "public_funding_grant_amount_signal",
    linkedField: "public_funding_or_grant_amount",
    category: "money",
  },
  {
    label: "Financing / Investment Amount",
    evidenceType: "financing_investment_amount_signal",
    linkedField: "financing_or_investment_amount",
    category: "money",
  },
  {
    label: "Debt / Loan Amount",
    evidenceType: "debt_loan_amount_signal",
    linkedField: "debt_or_loan_amount",
    category: "money",
  },
  {
    label: "Contract Award Amount",
    evidenceType: "contract_award_amount_signal",
    linkedField: "contract_value",
    category: "money",
  },
  {
    label: "License / Lease Sale Amount",
    evidenceType: "license_lease_sale_amount_signal",
    linkedField: "license_or_lease_sale_amount",
    category: "money",
  },
  {
    label: "Funding Amount Fallback",
    evidenceType: "funding_amount_signal",
    linkedField: "funding_or_investment_amount",
    category: "money",
  },
  {
    label: "License / Permit Status",
    evidenceType: "license_permit_award_signal",
    linkedField: "license_or_permit_status",
    category: "core",
  },
  {
    label: "Ownership / Operator",
    evidenceType: "ownership_operator_signal",
    linkedField: "owner_operator",
    category: "core",
  },
  {
    label: "Direct-Use Category",
    evidenceType: "direct_use_category_signal",
    linkedField: "direct_use_category",
    category: "classification",
  },
  {
    label: "Technology / Resource",
    evidenceType: "technology_resource_signal",
    linkedField: "technology_or_resource",
    category: "classification",
  },
  {
    label: "Policy / Tariff",
    evidenceType: "policy_tariff_signal",
    linkedField: "policy_or_tariff",
    category: "classification",
  },
  {
    label: "Activity / Status",
    evidenceType: "activity_status_signal",
    linkedField: "activity_status",
    category: "classification",
  },
  {
    label: "Country",
    evidenceType: "country_signal",
    linkedField: "country",
    category: "matching",
  },
  {
    label: "Entity / Alias",
    evidenceType: "entity_signal",
    linkedField: "entity_alias",
    category: "matching",
  },
];

export function getSourceFactTypeDefinition(evidenceType: string | null | undefined) {
  return getArticleFactTypeDefinition(evidenceType || undefined);
}
