import { getDb } from "./db";

export async function initDb() {
  const db = await getDb();

  await db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS ref_company_type_primary (
      type_name TEXT PRIMARY KEY,
      sort_order INTEGER,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS ref_company_type_secondary (
      type_name TEXT PRIMARY KEY,
      primary_type_name TEXT,
      sort_order INTEGER,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS plants (
      plant_id TEXT PRIMARY KEY,
      plant_name TEXT,
      project_group TEXT,
      other_name TEXT,
      owner_operator TEXT,
      developer TEXT,
      location_text TEXT,
      country TEXT,
      region TEXT,
      wb_region TEXT,
      potential_min_mw REAL,
      potential_max_mw REAL,
      installed_capacity_mw REAL,
      capacity_running_mw REAL,
      gross_production_gwh REAL,
      start_dev_year TEXT,
      cod TEXT,
      resource_type TEXT,
      resource_temp_c REAL,
      project_phase TEXT,
      phase_historical TEXT,
      field_name TEXT,
      wells_total REAL,
      wells_prod_active REAL,
      wells_reinj_active REAL,
      wells_inactive_standby REAL,
      wells_other_exploration REAL,
      well_depth_prod_m REAL,
      temp_prod_well_c REAL,
      flow_rate_ls REAL,
      number_of_unit TEXT,
      plant_technology TEXT,
      turbine_supplier TEXT,
      epc_suppliers TEXT,
      investor TEXT,
      ppa_usd_kwh TEXT,
      total_investment_cost TEXT,
      notes TEXT,
      location_x REAL,
      location_y REAL,
      website_information TEXT,
      date_created TEXT,
      date_edited TEXT,
      edited_description TEXT,
      research_status TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

      promoted_from_project_id TEXT,
      promoted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS projects (
      project_id TEXT PRIMARY KEY,
      project_name TEXT,
      project_group TEXT,
      other_name TEXT,
      owner_operator TEXT,
      developer TEXT,
      location_text TEXT,
      country TEXT,
      region TEXT,
      wb_region TEXT,
      potential_min_mw REAL,
      potential_max_mw REAL,
      installed_capacity_mw REAL,
      capacity_running_mw REAL,
      gross_production_gwh REAL,
      start_dev_year TEXT,
      cod TEXT,
      resource_type TEXT,
      resource_temp_c REAL,
      project_phase TEXT,
      phase_historical TEXT,
      field_name TEXT,
      wells_total REAL,
      wells_prod_active REAL,
      wells_reinj_active REAL,
      wells_inactive_standby REAL,
      wells_other_exploration REAL,
      well_depth_prod_m REAL,
      temp_prod_well_c REAL,
      flow_rate_ls REAL,
      number_of_unit TEXT,
      plant_technology TEXT,
      turbine_supplier TEXT,
      epc_suppliers TEXT,
      investor TEXT,
      ppa_usd_kwh TEXT,
      total_investment_cost TEXT,
      notes TEXT,
      location_x REAL,
      location_y REAL,
      website_information TEXT,
      date_created TEXT,
      date_edited TEXT,
      edited_description TEXT,
      research_status TEXT,
      is_promoted_to_plant INTEGER DEFAULT 0,
      promoted_plant_id TEXT,
      promoted_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS companies (
      company_id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      company_name_short TEXT,
      company_legal_name TEXT,
      company_name_clean TEXT,
      website_url TEXT,
      linkedin_url TEXT,
      entity_type TEXT,
      company_type_primary TEXT,
      company_type_secondary TEXT,
      ownership_type TEXT,
      is_active_company INTEGER DEFAULT 1,
      company_status TEXT,
      parent_company_id TEXT,
      ultimate_parent_company_id TEXT,
      company_group_name TEXT,
      is_group_parent INTEGER DEFAULT 0,
      is_operating_entity INTEGER DEFAULT 0,
      headquarters_city TEXT,
      headquarters_country TEXT,
      region TEXT,
      wb_region TEXT,
      geothermal_focus TEXT,
      technology_focus TEXT,
      service_scope_summary TEXT,
      operating_markets_summary TEXT,
      research_status TEXT DEFAULT 'Need Info',
      date_created TEXT,
      date_edited TEXT,
      notes TEXT,
      information TEXT,
      internal_comments TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_company_id) REFERENCES companies(company_id),
      FOREIGN KEY (ultimate_parent_company_id) REFERENCES companies(company_id),
      FOREIGN KEY (company_type_primary) REFERENCES ref_company_type_primary(type_name)
    );

    CREATE TABLE IF NOT EXISTS company_roles (
      company_role_id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      role_type TEXT NOT NULL,
      role_subtype TEXT,
      role_scope TEXT,
      role_status TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS company_relationships (
      company_relationship_id TEXT PRIMARY KEY,
      company_id_from TEXT NOT NULL,
      company_id_to TEXT NOT NULL,
      relationship_type TEXT NOT NULL,
      ownership_percentage REAL,
      is_current INTEGER DEFAULT 1,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id_from) REFERENCES companies(company_id) ON DELETE CASCADE,
      FOREIGN KEY (company_id_to) REFERENCES companies(company_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS company_project_links (
      company_project_link_id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      role TEXT NOT NULL,
      role_detail TEXT,
      is_primary INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS company_plant_links (
      company_plant_link_id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      plant_id TEXT NOT NULL,
      role TEXT NOT NULL,
      role_detail TEXT,
      is_primary INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
      FOREIGN KEY (plant_id) REFERENCES plants(plant_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_plants_name ON plants(plant_name);
    CREATE INDEX IF NOT EXISTS idx_plants_country ON plants(country);
    CREATE INDEX IF NOT EXISTS idx_plants_region ON plants(region);
    CREATE INDEX IF NOT EXISTS idx_plants_phase ON plants(project_phase);
    CREATE INDEX IF NOT EXISTS idx_plants_owner_operator ON plants(owner_operator);

    CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(project_name);
    CREATE INDEX IF NOT EXISTS idx_projects_country ON projects(country);
    CREATE INDEX IF NOT EXISTS idx_projects_region ON projects(region);
    CREATE INDEX IF NOT EXISTS idx_projects_phase ON projects(project_phase);
    CREATE INDEX IF NOT EXISTS idx_projects_developer ON projects(developer);

    CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(company_name);
    CREATE INDEX IF NOT EXISTS idx_companies_clean ON companies(company_name_clean);
    CREATE INDEX IF NOT EXISTS idx_companies_country ON companies(headquarters_country);
    CREATE INDEX IF NOT EXISTS idx_companies_primary_type ON companies(company_type_primary);
    CREATE INDEX IF NOT EXISTS idx_companies_parent ON companies(parent_company_id);

    CREATE INDEX IF NOT EXISTS idx_company_roles_company ON company_roles(company_id);
    CREATE INDEX IF NOT EXISTS idx_company_roles_type ON company_roles(role_type);

    CREATE INDEX IF NOT EXISTS idx_company_relationships_from ON company_relationships(company_id_from);
    CREATE INDEX IF NOT EXISTS idx_company_relationships_to ON company_relationships(company_id_to);
    CREATE INDEX IF NOT EXISTS idx_company_relationships_type ON company_relationships(relationship_type);

    CREATE INDEX IF NOT EXISTS idx_company_project_links_company ON company_project_links(company_id);
    CREATE INDEX IF NOT EXISTS idx_company_project_links_project ON company_project_links(project_id);
    CREATE INDEX IF NOT EXISTS idx_company_project_links_role ON company_project_links(role);

    CREATE INDEX IF NOT EXISTS idx_company_plant_links_company ON company_plant_links(company_id);
    CREATE INDEX IF NOT EXISTS idx_company_plant_links_plant ON company_plant_links(plant_id);
    CREATE INDEX IF NOT EXISTS idx_company_plant_links_role ON company_plant_links(role);
  `);

  return { success: true };
}