export const COMPANY_RELATIONSHIP_TYPES = [
  "parent",
  "subsidiary",
  "affiliate",
  "joint_venture",
  "investor",
  "investee",
  "brand",
  "group_member",
  "other",
] as const;

export const COMPANY_ASSET_ROLES = [
  "owner",
  "operator",
  "developer",
  "investor",
  "epc",
  "supplier",
  "turbine_supplier",
  "drilling_contractor",
  "consultant",
  "other",
] as const;

export const COMPANY_ROLE_STATUS = [
  "active",
  "inactive",
  "historical",
  "uncertain",
] as const;

export const COMPANY_RESEARCH_STATUS = [
  "Done",
  "Need Info",
  "In Progress",
] as const;