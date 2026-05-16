import { queryPostgres } from "@/lib/postgres";

export type PostgresPreviewSummary = {
  projectCount: number;
  operatingAssetCount: number;
  companyCount: number;
  directUseComponentCount: number;
  companyProjectLinkCount: number;
  companyAssetLinkCount: number;
};

export type PostgresPreviewProject = {
  project_id: string;
  legacy_project_id: string | null;
  project_name: string;
  primary_use_type_code: string;
  lifecycle_phase_code: string;
  country: string | null;
  region: string | null;
  electric_capacity_mwe: number | null;
  thermal_capacity_mwth: number | null;
  annual_heat_supply_gwhth: number | null;
  review_status_code: string;
  research_status: string | null;
};

export type PostgresPreviewOperatingAsset = {
  operating_asset_id: string;
  legacy_plant_id: string | null;
  asset_name: string;
  primary_use_type_code: string;
  lifecycle_phase_code: string;
  country: string | null;
  region: string | null;
  electric_capacity_mwe: number | null;
  electric_capacity_running_mwe: number | null;
  thermal_capacity_mwth: number | null;
  annual_power_generation_gwhe: number | null;
  annual_heat_supply_gwhth: number | null;
  review_status_code: string;
  research_status: string | null;
};

export type PostgresPreviewCompany = {
  company_id: string;
  legacy_company_id: string | null;
  company_name: string;
  entity_type_code: string | null;
  company_type_primary_code: string | null;
  headquarters_country: string | null;
  geothermal_focus: string | null;
  review_status_code: string;
  research_status: string | null;
};

type CountRow = {
  count: number;
};

export async function getPostgresPreviewSummary(): Promise<PostgresPreviewSummary> {
  const [
    projects,
    operatingAssets,
    companies,
    directUseComponents,
    companyProjectLinks,
    companyAssetLinks,
  ] = await Promise.all([
    queryPostgres<CountRow>("SELECT COUNT(*)::int AS count FROM projects"),
    queryPostgres<CountRow>("SELECT COUNT(*)::int AS count FROM operating_assets"),
    queryPostgres<CountRow>("SELECT COUNT(*)::int AS count FROM companies"),
    queryPostgres<CountRow>("SELECT COUNT(*)::int AS count FROM asset_use_components"),
    queryPostgres<CountRow>("SELECT COUNT(*)::int AS count FROM company_project_links"),
    queryPostgres<CountRow>("SELECT COUNT(*)::int AS count FROM company_operating_asset_links"),
  ]);

  return {
    projectCount: projects.rows[0]?.count ?? 0,
    operatingAssetCount: operatingAssets.rows[0]?.count ?? 0,
    companyCount: companies.rows[0]?.count ?? 0,
    directUseComponentCount: directUseComponents.rows[0]?.count ?? 0,
    companyProjectLinkCount: companyProjectLinks.rows[0]?.count ?? 0,
    companyAssetLinkCount: companyAssetLinks.rows[0]?.count ?? 0,
  };
}

export async function listPostgresPreviewProjects(
  limit = 25
): Promise<PostgresPreviewProject[]> {
  const result = await queryPostgres<PostgresPreviewProject>(
    `
    SELECT
      project_id,
      legacy_project_id,
      project_name,
      primary_use_type_code,
      lifecycle_phase_code,
      country,
      region,
      electric_capacity_mwe,
      thermal_capacity_mwth,
      annual_heat_supply_gwhth,
      review_status_code,
      research_status
    FROM projects
    ORDER BY created_at DESC, project_name ASC
    LIMIT $1
    `,
    [limit]
  );

  return result.rows;
}

export async function listPostgresPreviewOperatingAssets(
  limit = 25
): Promise<PostgresPreviewOperatingAsset[]> {
  const result = await queryPostgres<PostgresPreviewOperatingAsset>(
    `
    SELECT
      operating_asset_id,
      legacy_plant_id,
      asset_name,
      primary_use_type_code,
      lifecycle_phase_code,
      country,
      region,
      electric_capacity_mwe,
      electric_capacity_running_mwe,
      thermal_capacity_mwth,
      annual_power_generation_gwhe,
      annual_heat_supply_gwhth,
      review_status_code,
      research_status
    FROM operating_assets
    ORDER BY created_at DESC, asset_name ASC
    LIMIT $1
    `,
    [limit]
  );

  return result.rows;
}

export async function listPostgresPreviewCompanies(
  limit = 25
): Promise<PostgresPreviewCompany[]> {
  const result = await queryPostgres<PostgresPreviewCompany>(
    `
    SELECT
      company_id,
      legacy_company_id,
      company_name,
      entity_type_code,
      company_type_primary_code,
      headquarters_country,
      geothermal_focus,
      review_status_code,
      research_status
    FROM companies
    ORDER BY created_at DESC, company_name ASC
    LIMIT $1
    `,
    [limit]
  );

  return result.rows;
}
