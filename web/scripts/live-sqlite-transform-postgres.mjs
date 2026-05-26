#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import {
  cleanString,
  createPool,
  ensureMigrationSchema,
  findRun,
  insertRows,
  insertWarnings,
  normalizeName,
  parseBoolean,
  parseCommonArgs,
  parseStrictNumber,
  parseTimestamp,
  parseYearMonth,
  rawRowsByTable,
  warningCounter,
  writeJson,
} from "./live-sqlite-migration-utils.mjs";

const COMPANY_TYPE_MAP = new Map([
  ["developer", "developer"],
  ["portfolio developer", "developer"],
  ["investment firm", "investment_finance"],
  ["investment / finance", "investment_finance"],
  ["utility / ipp", "utility_ipp"],
  ["service provider", "service_provider"],
  ["oem / supplier", "oem_equipment_supplier"],
  ["epc contractor", "epc_contractor"],
  ["technology developer", "technology_provider"],
  ["technology provider", "technology_provider"],
  ["resource owner", "resource_owner"],
  ["turbine supplier", "turbine_supplier"],
  ["advocacy / non-profit", "advocacy_non_profit"],
  ["energy major", "energy_major"],
]);

const ENTITY_TYPE_MAP = new Map([
  ["operating company", "operating_entity"],
  ["operating entity", "operating_entity"],
  ["subsidiary", "subsidiary"],
  ["holding company", "holding_company"],
  ["fund / investor vehicle", "business_unit"],
  ["government / public agency", "government_public_agency"],
  ["spv / project company", "business_unit"],
]);

const REVIEW_STATUS_MAP = new Map([
  ["pending_review", "validation"],
  ["pending review", "validation"],
  ["approved", "approved"],
  ["done", "approved"],
  ["need info", "needs_update"],
  ["need data", "needs_update"],
  ["in progress", "validation"],
]);

const LIFECYCLE_MAP = new Map([
  ["prospect", "prospect_tbd"],
  ["tbd", "prospect_tbd"],
  ["prospect / tbd", "prospect_tbd"],
  ["exploration", "exploration"],
  ["pre-feasibility", "pre_feasibility"],
  ["feasibility", "feasibility"],
  ["construction", "construction"],
  ["operational", "operating"],
  ["operating", "operating"],
  ["cancelled", "cancelled"],
  ["decomissioned", "cancelled"],
  ["not operating", "cancelled"],
]);

const ROLE_MAP = new Map([
  ["owner", "owner"],
  ["operator", "operator"],
  ["developer", "developer"],
  ["investor", "investor"],
  ["epc", "epc_contractor"],
  ["epc contractor", "epc_contractor"],
  ["drilling", "drilling_contractor"],
  ["drilling contractor", "drilling_contractor"],
  ["turbine supplier", "technology_supplier"],
  ["technology supplier", "technology_supplier"],
  ["engineering consultant", "engineering_consultant"],
  ["service provider", "other"],
  ["oem", "equipment_supplier"],
  ["resource partner", "resource_owner"],
  ["operator steam", "operator"],
  ["operator power", "operator"],
  ["owner/ operator", "operator"],
  ["other", "other"],
]);

const REVIEW_ROLE_VALUES = new Set([
  "service provider",
  "resource partner",
  "owner/ operator",
  "operator steam",
  "operator power",
]);

const RELATIONSHIP_MAP = new Map([
  ["parent of", { code: "parent_subsidiary", reverse: false }],
  ["subsidiary of", { code: "parent_subsidiary", reverse: true }],
  ["owned by", { code: "ownership", reverse: true }],
  ["owns", { code: "ownership", reverse: false }],
  ["majority shareholder in", { code: "ownership", reverse: false }],
  ["investor in", { code: "ownership", reverse: false }],
  ["technology partner of", { code: "other", reverse: false }],
  ["project partner of", { code: "joint_venture", reverse: false }],
  ["owner", { code: "ownership", reverse: false }],
]);

function printHelp() {
  console.log(`
Usage:
  railway run --service Postgres -- npm run live-sqlite:transform -- --run-label "tge_live_20260518_213034" --reset-target
  railway run --service Postgres -- npm run live-sqlite:transform -- --run-label "tge_live_20260518_213034" --reset-target --execute

Options:
  --run-label <label>  Migration run label. Defaults to latest run.
  --run-id <uuid>      Migration run id. Overrides run label.
  --out <dir>          Local ignored output directory.
  --batch-size <n>     PostgreSQL write batch size. Defaults to 500.
  --reset-target       Delete previous transformed rows for this staging run before inserting.
  --execute            Commit transformation. Without this, the script rolls back after a full dry run.
  --no-ensure-schema   Do not apply the idempotent staging-table SQL first.

Safety:
  Without --execute, this performs a full transaction dry run and rolls back.
  With --execute, it writes normalized records into PostgreSQL staging/final tables.
`);
}

function warning(warnings, warningCode, sourceTable, legacyPrimaryKey, fieldName, warningNote, details = {}) {
  warnings.push({
    severity: "warning",
    warning_code: warningCode,
    source_table: sourceTable,
    legacy_primary_key: legacyPrimaryKey,
    field_name: fieldName,
    warning_note: warningNote,
    details,
  });
}

function mapReviewStatus(value, fallback, warnings, sourceTable, legacyPrimaryKey) {
  const text = cleanString(value);

  if (!text) {
    warning(warnings, "missing_review_status", sourceTable, legacyPrimaryKey, "review_status", "Missing review status; fallback applied.", { fallback });
    return fallback;
  }

  const mapped = REVIEW_STATUS_MAP.get(text.toLowerCase());

  if (!mapped) {
    warning(warnings, "unmapped_review_status", sourceTable, legacyPrimaryKey, "review_status", "Unmapped review status; fallback applied.", { value: text, fallback });
    return fallback;
  }

  return mapped;
}

function mapLifecycle(value, fallback, warnings, sourceTable, legacyPrimaryKey, options = {}) {
  const text = cleanString(value);

  if (!text) {
    warning(warnings, "missing_lifecycle_status", sourceTable, legacyPrimaryKey, "project_phase", "Missing lifecycle/status; fallback applied.", { fallback });
    return fallback;
  }

  const mapped = LIFECYCLE_MAP.get(text.toLowerCase());

  if (!mapped) {
    warning(warnings, "unmapped_lifecycle_status", sourceTable, legacyPrimaryKey, "project_phase", "Unmapped lifecycle/status; fallback applied.", { value: text, fallback });
    return fallback;
  }

  if (options.reviewValues?.has(text.toLowerCase())) {
    warning(warnings, "lifecycle_status_needs_review", sourceTable, legacyPrimaryKey, "project_phase", "Lifecycle/status imported but needs editorial review.", { value: text, mapped });
  }

  return mapped;
}

function mapCompanyType(value, warnings, legacyPrimaryKey) {
  const text = cleanString(value);

  if (!text) {
    warning(warnings, "missing_company_type", "companies", legacyPrimaryKey, "company_type_primary", "Missing company primary type; set to unknown.", {});
    return "unknown";
  }

  const mapped = COMPANY_TYPE_MAP.get(text.toLowerCase());

  if (!mapped) {
    warning(warnings, "unmapped_company_type", "companies", legacyPrimaryKey, "company_type_primary", "Unmapped company primary type; set to unknown.", { value: text });
    return "unknown";
  }

  if (mapped !== text.toLowerCase().replaceAll(" ", "_")) {
    warning(warnings, "normalized_company_type", "companies", legacyPrimaryKey, "company_type_primary", "Company primary type normalized during transform.", { value: text, mapped });
  }

  return mapped;
}

function mapEntityType(value, warnings, legacyPrimaryKey) {
  const text = cleanString(value);

  if (!text) {
    return "unknown";
  }

  const mapped = ENTITY_TYPE_MAP.get(text.toLowerCase());

  if (!mapped) {
    warning(warnings, "unmapped_entity_type", "companies", legacyPrimaryKey, "entity_type", "Unmapped company entity type; set to unknown.", { value: text });
    return "unknown";
  }

  return mapped;
}

function mapRole(value, warnings, sourceTable, legacyPrimaryKey) {
  const text = cleanString(value);

  if (!text) {
    warning(warnings, "missing_company_role", sourceTable, legacyPrimaryKey, "role", "Missing company role; set to other.", {});
    return { roleCode: "other", roleDetail: null };
  }

  const normalized = text.toLowerCase();
  const roleCode = ROLE_MAP.get(normalized);

  if (!roleCode) {
    warning(warnings, "unmapped_company_role", sourceTable, legacyPrimaryKey, "role", "Unmapped company role; set to other.", { value: text });
    return { roleCode: "other", roleDetail: text };
  }

  if (REVIEW_ROLE_VALUES.has(normalized)) {
    warning(warnings, "company_role_needs_review", sourceTable, legacyPrimaryKey, "role", "Company role normalized but should be reviewed.", { value: text, mapped: roleCode });
  }

  return {
    roleCode,
    roleDetail: roleCode === normalized ? null : text,
  };
}

function mapRelationship(value, warnings, legacyPrimaryKey) {
  const text = cleanString(value);
  const mapped = RELATIONSHIP_MAP.get(text?.toLowerCase() || "");

  if (!mapped) {
    warning(warnings, "unmapped_company_relationship_type", "company_relationships", legacyPrimaryKey, "relationship_type", "Unmapped company relationship type; set to other.", { value: text });
    return { code: "other", reverse: false };
  }

  if (mapped.code === "other") {
    warning(warnings, "company_relationship_needs_review", "company_relationships", legacyPrimaryKey, "relationship_type", "Relationship imported as other; needs review.", { value: text });
  }

  return mapped;
}

function safeNumber(value, warnings, sourceTable, legacyPrimaryKey, fieldName, options = {}) {
  const text = cleanString(value);

  if (!text) {
    return null;
  }

  const number = parseStrictNumber(text);

  if (number === null) {
    warning(warnings, "invalid_numeric_value", sourceTable, legacyPrimaryKey, fieldName, "Numeric value could not be parsed; set to null.", { value: text });
    return null;
  }

  if (options.nonNegative && number < 0) {
    warning(warnings, "negative_numeric_value", sourceTable, legacyPrimaryKey, fieldName, "Negative numeric value cannot be loaded; set to null.", { value: number });
    return null;
  }

  return number;
}

function normalizeCapacityRow(row, warnings, sourceTable, legacyPrimaryKey) {
  const potentialMin = safeNumber(row.potential_min_mw, warnings, sourceTable, legacyPrimaryKey, "potential_min_mw", { nonNegative: true });
  let potentialMax = safeNumber(row.potential_max_mw, warnings, sourceTable, legacyPrimaryKey, "potential_max_mw", { nonNegative: true });
  const electricCapacity = safeNumber(row.installed_capacity_mw, warnings, sourceTable, legacyPrimaryKey, "installed_capacity_mw", { nonNegative: true });
  let runningCapacity = safeNumber(row.capacity_running_mw, warnings, sourceTable, legacyPrimaryKey, "capacity_running_mw", { nonNegative: true });

  if (potentialMin !== null && potentialMax !== null && potentialMax < potentialMin) {
    warning(warnings, "capacity_range_invalid", sourceTable, legacyPrimaryKey, "potential_max_mw", "Potential max is below min; max set to null.", { potential_min_mw: potentialMin, potential_max_mw: potentialMax });
    potentialMax = null;
  }

  if (electricCapacity !== null && runningCapacity !== null && runningCapacity > electricCapacity) {
    warning(warnings, "running_capacity_above_installed", sourceTable, legacyPrimaryKey, "capacity_running_mw", "Running capacity is above installed capacity; running capacity set to null.", { installed_capacity_mw: electricCapacity, capacity_running_mw: runningCapacity });
    runningCapacity = null;
  }

  return {
    potential_min_mwe: potentialMin,
    potential_max_mwe: potentialMax,
    electric_capacity_mwe: electricCapacity,
    electric_capacity_running_mwe: runningCapacity,
    annual_power_generation_gwhe: safeNumber(row.gross_production_gwh, warnings, sourceTable, legacyPrimaryKey, "gross_production_gwh", { nonNegative: true }),
  };
}

function parseIntegerRange(value, min, max, warnings, sourceTable, legacyPrimaryKey, fieldName) {
  const number = safeNumber(value, warnings, sourceTable, legacyPrimaryKey, fieldName);

  if (number === null) {
    return null;
  }

  const integer = Math.trunc(number);

  if (integer < min || integer > max) {
    warning(warnings, "integer_out_of_range", sourceTable, legacyPrimaryKey, fieldName, "Integer value outside accepted range; set to null.", { value: integer, min, max });
    return null;
  }

  return integer;
}

function dateFields(row, codField = "cod") {
  return parseYearMonth(row[codField]);
}

function combineNotes(...values) {
  return values.map(cleanString).filter(Boolean).join("\n\n") || null;
}

async function loadRawTables(client, runId) {
  const tableNames = [
    "companies",
    "projects",
    "plants",
    "company_project_links",
    "company_plant_links",
    "company_relationships",
    "company_roles",
  ];
  const tables = {};

  for (const tableName of tableNames) {
    tables[tableName] = (await rawRowsByTable(client, runId, tableName)).map((row) => row.row_data);
  }

  return tables;
}

async function existingUserMap(client) {
  const result = await client.query(`
    SELECT legacy_user_id, user_id
    FROM app_users
    WHERE legacy_user_id IS NOT NULL
  `);

  return new Map(result.rows.map((row) => [row.legacy_user_id, row.user_id]));
}

function mappedUserId(userMap, value) {
  const legacyId = cleanString(value);
  return legacyId ? userMap.get(legacyId) || null : null;
}

async function resetTargetRows(client, tables) {
  const projectIds = tables.projects.map((row) => cleanString(row.project_id)).filter(Boolean);
  const plantIds = tables.plants.map((row) => cleanString(row.plant_id)).filter(Boolean);
  const companyIds = tables.companies.map((row) => cleanString(row.company_id)).filter(Boolean);
  const projectLinkIds = tables.company_project_links.map((row) => cleanString(row.company_project_link_id)).filter(Boolean);
  const plantLinkIds = tables.company_plant_links.map((row) => cleanString(row.company_plant_link_id)).filter(Boolean);
  const relationshipIds = tables.company_relationships.map((row) => cleanString(row.company_relationship_id)).filter(Boolean);
  const roleIds = tables.company_roles.map((row) => cleanString(row.company_role_id)).filter(Boolean);

  await client.query("DELETE FROM project_operating_asset_links WHERE project_id IN (SELECT project_id FROM projects WHERE legacy_project_id = ANY($1)) OR operating_asset_id IN (SELECT operating_asset_id FROM operating_assets WHERE legacy_plant_id = ANY($2))", [projectIds, plantIds]);
  await client.query("DELETE FROM company_project_links WHERE legacy_company_project_link_id = ANY($1) OR project_id IN (SELECT project_id FROM projects WHERE legacy_project_id = ANY($2)) OR company_id IN (SELECT company_id FROM companies WHERE legacy_company_id = ANY($3))", [projectLinkIds, projectIds, companyIds]);
  await client.query("DELETE FROM company_operating_asset_links WHERE legacy_company_plant_link_id = ANY($1) OR operating_asset_id IN (SELECT operating_asset_id FROM operating_assets WHERE legacy_plant_id = ANY($2)) OR company_id IN (SELECT company_id FROM companies WHERE legacy_company_id = ANY($3))", [plantLinkIds, plantIds, companyIds]);
  await client.query("DELETE FROM company_relationships WHERE legacy_company_relationship_id = ANY($1) OR company_id_from IN (SELECT company_id FROM companies WHERE legacy_company_id = ANY($2)) OR company_id_to IN (SELECT company_id FROM companies WHERE legacy_company_id = ANY($2))", [relationshipIds, companyIds]);
  await client.query("DELETE FROM company_role_profiles WHERE legacy_company_role_id = ANY($1) OR company_id IN (SELECT company_id FROM companies WHERE legacy_company_id = ANY($2))", [roleIds, companyIds]);
  await client.query("DELETE FROM company_secondary_types WHERE company_id IN (SELECT company_id FROM companies WHERE legacy_company_id = ANY($1))", [companyIds]);
  await client.query("DELETE FROM asset_use_components WHERE project_id IN (SELECT project_id FROM projects WHERE legacy_project_id = ANY($1)) OR operating_asset_id IN (SELECT operating_asset_id FROM operating_assets WHERE legacy_plant_id = ANY($2))", [projectIds, plantIds]);
  await client.query("DELETE FROM operating_assets WHERE legacy_plant_id = ANY($1)", [plantIds]);
  await client.query("DELETE FROM projects WHERE legacy_project_id = ANY($1)", [projectIds]);
  await client.query("DELETE FROM companies WHERE legacy_company_id = ANY($1)", [companyIds]);
}

async function idMap(client, tableName, legacyColumn, idColumn, legacyValues) {
  const result = await client.query(
    `
    SELECT ${legacyColumn} AS legacy_id, ${idColumn} AS id
    FROM ${tableName}
    WHERE ${legacyColumn} = ANY($1)
    `,
    [legacyValues.filter(Boolean)]
  );

  return new Map(result.rows.map((row) => [row.legacy_id, row.id]));
}

async function transformRun(client, run, args) {
  const tables = await loadRawTables(client, run.run_id);
  const userMap = await existingUserMap(client);
  const warnings = [];

  if (args.resetTarget) {
    await resetTargetRows(client, tables);
  }

  const companyRows = tables.companies.map((row) => {
    const legacyId = cleanString(row.company_id);
    const rawEntityType = cleanString(row.entity_type);
    const rawSecondaryTypes = cleanString(row.secondary_types);

    if (rawEntityType?.toLowerCase() === "spv / project company") {
      warning(warnings, "spv_entity_type_mapped_to_business_unit", "companies", legacyId, "entity_type", "SPV entity type mapped to business_unit until PostgreSQL taxonomy is refined.", {});
    }

    if (rawSecondaryTypes) {
      warning(warnings, "secondary_types_preserved_for_review", "companies", legacyId, "secondary_types", "Legacy secondary types require controlled parsing after first import.", {});
    }

    return {
      legacy_company_id: legacyId,
      company_name: cleanString(row.company_name) || "Unnamed Company",
      company_name_short: cleanString(row.company_name_short),
      company_legal_name: cleanString(row.company_legal_name),
      company_name_clean: normalizeName(row.company_name_clean || row.company_name),
      website_url: cleanString(row.website_url),
      linkedin_url: cleanString(row.linkedin_url),
      entity_type_code: mapEntityType(row.entity_type, warnings, legacyId),
      company_type_primary_code: mapCompanyType(row.company_type_primary, warnings, legacyId),
      ownership_type: cleanString(row.ownership_type),
      company_status: cleanString(row.company_status),
      is_active_company: parseBoolean(row.is_active_company, true),
      is_spv: parseBoolean(row.is_spv, false) || rawEntityType?.toLowerCase() === "spv / project company",
      is_group_parent: parseBoolean(row.is_group_parent, false),
      is_operating_entity: parseBoolean(row.is_operating_entity, false),
      company_group_name: cleanString(row.company_group_name),
      group_inclusion_type: cleanString(row.group_inclusion_type),
      group_reporting_weight: safeNumber(row.group_reporting_weight, warnings, "companies", legacyId, "group_reporting_weight", { nonNegative: true }) ?? 1,
      consolidation_method: cleanString(row.consolidation_method),
      headquarters_city: cleanString(row.headquarters_city),
      headquarters_country: cleanString(row.headquarters_country),
      region: cleanString(row.region),
      wb_region: cleanString(row.wb_region),
      geothermal_focus: cleanString(row.geothermal_focus),
      technology_focus: cleanString(row.technology_focus),
      service_scope_summary: cleanString(row.service_scope_summary),
      operating_markets_summary: cleanString(row.operating_markets_summary),
      source_evidence_note: cleanString(row.website_url),
      notes: cleanString(row.notes),
      information: cleanString(row.information),
      internal_comments: combineNotes(row.internal_comments, rawSecondaryTypes ? `Legacy secondary types: ${rawSecondaryTypes}` : null),
      review_status_code: mapReviewStatus(row.review_status, "draft", warnings, "companies", legacyId),
      research_status: cleanString(row.research_status),
      created_by_user_id: mappedUserId(userMap, row.created_by_user_id),
      last_updated_by_user_id: mappedUserId(userMap, row.last_updated_by_user_id),
      approved_by_user_id: mappedUserId(userMap, row.approved_by_user_id),
      approved_at: parseTimestamp(row.approved_at),
      legacy_created_at: cleanString(row.created_at || row.date_created),
      legacy_updated_at: cleanString(row.updated_at || row.date_edited),
    };
  });

  await insertRows(client, "companies", Object.keys(companyRows[0] || {}), companyRows, {
    batchSize: args.batchSize,
    conflictColumns: ["legacy_company_id"],
  });

  const companyMap = await idMap(
    client,
    "companies",
    "legacy_company_id",
    "company_id",
    tables.companies.map((row) => cleanString(row.company_id))
  );

  for (const row of tables.companies) {
    const legacyId = cleanString(row.company_id);
    const companyId = companyMap.get(legacyId);
    const parentId = companyMap.get(cleanString(row.parent_company_id));
    const ultimateParentId = companyMap.get(cleanString(row.ultimate_parent_company_id));

    await client.query(
      `
      UPDATE companies
      SET parent_company_id = $2,
          ultimate_parent_company_id = $3,
          updated_at = now()
      WHERE company_id = $1
      `,
      [companyId, parentId || null, ultimateParentId || null]
    );
  }

  const projectRows = tables.projects.map((row) => {
    const legacyId = cleanString(row.project_id);
    const cod = dateFields(row);
    const capacity = normalizeCapacityRow(row, warnings, "projects", legacyId);

    return {
      legacy_project_id: legacyId,
      project_name: cleanString(row.project_name) || "Unnamed Project",
      project_name_clean: normalizeName(row.project_name),
      project_group: cleanString(row.project_group),
      other_name: cleanString(row.other_name),
      primary_use_type_code: "power",
      lifecycle_phase_code: mapLifecycle(row.project_phase, "prospect_tbd", warnings, "projects", legacyId, {
        reviewValues: new Set(["operational"]),
      }),
      location_text: cleanString(row.location_text),
      country: cleanString(row.country),
      region: cleanString(row.region),
      wb_region: cleanString(row.wb_region),
      latitude: safeNumber(row.location_x, warnings, "projects", legacyId, "location_x"),
      longitude: safeNumber(row.location_y, warnings, "projects", legacyId, "location_y"),
      field_name: cleanString(row.field_name),
      resource_type: cleanString(row.resource_type),
      resource_temp_c: safeNumber(row.resource_temp_c, warnings, "projects", legacyId, "resource_temp_c"),
      ...capacity,
      capacity_estimate_status_code: "unknown",
      output_estimate_status_code: "unknown",
      start_dev_year: parseIntegerRange(row.start_dev_year, 1900, 2100, warnings, "projects", legacyId, "start_dev_year"),
      target_cod_year: cod.year,
      target_cod_month: cod.month,
      cod_raw: cod.raw,
      wells_total: safeNumber(row.wells_total, warnings, "projects", legacyId, "wells_total", { nonNegative: true }),
      wells_prod_active: safeNumber(row.wells_prod_active, warnings, "projects", legacyId, "wells_prod_active", { nonNegative: true }),
      wells_reinj_active: safeNumber(row.wells_reinj_active, warnings, "projects", legacyId, "wells_reinj_active", { nonNegative: true }),
      wells_inactive_standby: safeNumber(row.wells_inactive_standby, warnings, "projects", legacyId, "wells_inactive_standby", { nonNegative: true }),
      wells_other_exploration: safeNumber(row.wells_other_exploration, warnings, "projects", legacyId, "wells_other_exploration", { nonNegative: true }),
      well_depth_prod_m: safeNumber(row.well_depth_prod_m, warnings, "projects", legacyId, "well_depth_prod_m", { nonNegative: true }),
      temp_prod_well_c: safeNumber(row.temp_prod_well_c, warnings, "projects", legacyId, "temp_prod_well_c"),
      flow_rate_ls: safeNumber(row.flow_rate_ls, warnings, "projects", legacyId, "flow_rate_ls", { nonNegative: true }),
      plant_technology: cleanString(row.plant_technology),
      turbine_supplier: cleanString(row.turbine_supplier),
      epc_suppliers: cleanString(row.epc_suppliers),
      ppa_usd_kwh: safeNumber(row.ppa_usd_kwh, warnings, "projects", legacyId, "ppa_usd_kwh", { nonNegative: true }),
      total_investment_cost: cleanString(row.total_investment_cost),
      website_information: cleanString(row.website_information),
      source_evidence_note: cleanString(row.website_information),
      notes: cleanString(row.notes),
      internal_comments: combineNotes(row.edited_description, row.phase_historical),
      review_status_code: mapReviewStatus(row.review_status, "draft", warnings, "projects", legacyId),
      research_status: cleanString(row.research_status),
      created_by_user_id: mappedUserId(userMap, row.created_by_user_id),
      last_updated_by_user_id: mappedUserId(userMap, row.last_updated_by_user_id),
      approved_by_user_id: mappedUserId(userMap, row.approved_by_user_id),
      approved_at: parseTimestamp(row.approved_at),
      legacy_created_at: cleanString(row.created_at || row.date_created),
      legacy_updated_at: cleanString(row.updated_at || row.date_edited),
    };
  });

  await insertRows(client, "projects", Object.keys(projectRows[0] || {}), projectRows, {
    batchSize: args.batchSize,
    conflictColumns: ["legacy_project_id"],
  });

  const projectMap = await idMap(
    client,
    "projects",
    "legacy_project_id",
    "project_id",
    tables.projects.map((row) => cleanString(row.project_id))
  );

  const assetRows = tables.plants.map((row) => {
    const legacyId = cleanString(row.plant_id);
    const cod = dateFields(row);
    const capacity = normalizeCapacityRow(row, warnings, "plants", legacyId);

    return {
      legacy_plant_id: legacyId,
      asset_name: cleanString(row.plant_name) || "Unnamed Plant",
      asset_name_clean: normalizeName(row.plant_name),
      project_group: cleanString(row.project_group),
      other_name: cleanString(row.other_name),
      primary_use_type_code: "power",
      lifecycle_phase_code: mapLifecycle(row.project_phase, "operating", warnings, "plants", legacyId, {
        reviewValues: new Set(["construction", "cancelled", "prospect / tbd", "not operating", "exploration", "decomissioned"]),
      }),
      location_text: cleanString(row.location_text),
      country: cleanString(row.country),
      region: cleanString(row.region),
      wb_region: cleanString(row.wb_region),
      latitude: safeNumber(row.location_x, warnings, "plants", legacyId, "location_x"),
      longitude: safeNumber(row.location_y, warnings, "plants", legacyId, "location_y"),
      field_name: cleanString(row.field_name),
      resource_type: cleanString(row.resource_type),
      resource_temp_c: safeNumber(row.resource_temp_c, warnings, "plants", legacyId, "resource_temp_c"),
      ...capacity,
      capacity_estimate_status_code: "unknown",
      output_estimate_status_code: "unknown",
      start_dev_year: parseIntegerRange(row.start_dev_year, 1900, 2100, warnings, "plants", legacyId, "start_dev_year"),
      cod_year: cod.year,
      cod_month: cod.month,
      cod_raw: cod.raw,
      wells_total: safeNumber(row.wells_total, warnings, "plants", legacyId, "wells_total", { nonNegative: true }),
      wells_prod_active: safeNumber(row.wells_prod_active, warnings, "plants", legacyId, "wells_prod_active", { nonNegative: true }),
      wells_reinj_active: safeNumber(row.wells_reinj_active, warnings, "plants", legacyId, "wells_reinj_active", { nonNegative: true }),
      wells_inactive_standby: safeNumber(row.wells_inactive_standby, warnings, "plants", legacyId, "wells_inactive_standby", { nonNegative: true }),
      wells_other_exploration: safeNumber(row.wells_other_exploration, warnings, "plants", legacyId, "wells_other_exploration", { nonNegative: true }),
      well_depth_prod_m: safeNumber(row.well_depth_prod_m, warnings, "plants", legacyId, "well_depth_prod_m", { nonNegative: true }),
      temp_prod_well_c: safeNumber(row.temp_prod_well_c, warnings, "plants", legacyId, "temp_prod_well_c"),
      flow_rate_ls: safeNumber(row.flow_rate_ls, warnings, "plants", legacyId, "flow_rate_ls", { nonNegative: true }),
      number_of_units: cleanString(row.number_of_unit),
      plant_technology: cleanString(row.plant_technology),
      turbine_supplier: cleanString(row.turbine_supplier),
      epc_suppliers: cleanString(row.epc_suppliers),
      ppa_usd_kwh: safeNumber(row.ppa_usd_kwh, warnings, "plants", legacyId, "ppa_usd_kwh", { nonNegative: true }),
      total_investment_cost: cleanString(row.total_investment_cost),
      promoted_from_project_id: projectMap.get(cleanString(row.promoted_from_project_id)) || null,
      promoted_at: parseTimestamp(row.promoted_at),
      website_information: cleanString(row.website_information),
      source_evidence_note: cleanString(row.website_information),
      notes: cleanString(row.notes),
      internal_comments: combineNotes(row.edited_description, row.phase_historical),
      review_status_code: mapReviewStatus(row.review_status, "draft", warnings, "plants", legacyId),
      research_status: cleanString(row.research_status),
      created_by_user_id: mappedUserId(userMap, row.created_by_user_id),
      last_updated_by_user_id: mappedUserId(userMap, row.last_updated_by_user_id),
      approved_by_user_id: mappedUserId(userMap, row.approved_by_user_id),
      approved_at: parseTimestamp(row.approved_at),
      legacy_created_at: cleanString(row.created_at || row.date_created),
      legacy_updated_at: cleanString(row.updated_at || row.date_edited),
    };
  });

  await insertRows(client, "operating_assets", Object.keys(assetRows[0] || {}), assetRows, {
    batchSize: args.batchSize,
    conflictColumns: ["legacy_plant_id"],
  });

  const assetMap = await idMap(
    client,
    "operating_assets",
    "legacy_plant_id",
    "operating_asset_id",
    tables.plants.map((row) => cleanString(row.plant_id))
  );

  const promotionRows = tables.plants
    .map((row) => ({
      project_id: projectMap.get(cleanString(row.promoted_from_project_id)),
      operating_asset_id: assetMap.get(cleanString(row.plant_id)),
      link_type: "promotion",
      notes: "Imported from legacy promoted_from_project_id.",
    }))
    .filter((row) => row.project_id && row.operating_asset_id);

  await insertRows(
    client,
    "project_operating_asset_links",
    ["project_id", "operating_asset_id", "link_type", "notes"],
    promotionRows,
    {
      batchSize: args.batchSize,
      conflictColumns: ["project_id", "operating_asset_id", "link_type"],
    }
  );

  const companyProjectRows = tables.company_project_links
    .map((row) => {
      const legacyId = cleanString(row.company_project_link_id);
      const role = mapRole(row.role, warnings, "company_project_links", legacyId);
      const companyId = companyMap.get(cleanString(row.company_id));
      const projectId = projectMap.get(cleanString(row.project_id));

      if (!companyId || !projectId) {
        warning(warnings, "missing_company_project_link_target", "company_project_links", legacyId, null, "Company-project link target missing after transform.", {});
        return null;
      }

      return {
        legacy_company_project_link_id: legacyId,
        company_id: companyId,
        project_id: projectId,
        role_code: role.roleCode,
        role_detail: combineNotes(row.role_detail, role.roleDetail),
        ownership_share: safeNumber(row.ownership_share, warnings, "company_project_links", legacyId, "ownership_share", { nonNegative: true }),
        is_primary: parseBoolean(row.is_primary, false),
        notes: cleanString(row.notes),
      };
    })
    .filter(Boolean);

  await insertRows(client, "company_project_links", Object.keys(companyProjectRows[0] || {}), companyProjectRows, {
    batchSize: args.batchSize,
    conflictColumns: ["company_id", "project_id", "role_code"],
  });

  const companyAssetRows = tables.company_plant_links
    .map((row) => {
      const legacyId = cleanString(row.company_plant_link_id);
      const role = mapRole(row.role, warnings, "company_plant_links", legacyId);
      const companyId = companyMap.get(cleanString(row.company_id));
      const assetId = assetMap.get(cleanString(row.plant_id));

      if (!legacyId) {
        warning(warnings, "blank_company_plant_link_id", "company_plant_links", null, "company_plant_link_id", "Blank legacy link ID; PostgreSQL UUID will be generated.", {});
      }

      if (!companyId || !assetId) {
        warning(warnings, "missing_company_asset_link_target", "company_plant_links", legacyId, null, "Company-asset link target missing after transform.", {});
        return null;
      }

      return {
        legacy_company_plant_link_id: legacyId,
        company_id: companyId,
        operating_asset_id: assetId,
        role_code: role.roleCode,
        role_detail: combineNotes(row.role_detail, role.roleDetail),
        ownership_share: safeNumber(row.ownership_share, warnings, "company_plant_links", legacyId, "ownership_share", { nonNegative: true }),
        is_primary: parseBoolean(row.is_primary, false),
        notes: cleanString(row.notes),
      };
    })
    .filter(Boolean);

  await insertRows(client, "company_operating_asset_links", Object.keys(companyAssetRows[0] || {}), companyAssetRows, {
    batchSize: args.batchSize,
    conflictColumns: ["company_id", "operating_asset_id", "role_code"],
  });

  const relationshipRows = tables.company_relationships
    .map((row) => {
      const legacyId = cleanString(row.company_relationship_id);
      const relationship = mapRelationship(row.relationship_type, warnings, legacyId);
      const fromLegacy = relationship.reverse ? cleanString(row.company_id_to) : cleanString(row.company_id_from);
      const toLegacy = relationship.reverse ? cleanString(row.company_id_from) : cleanString(row.company_id_to);
      const fromId = companyMap.get(fromLegacy);
      const toId = companyMap.get(toLegacy);

      if (!fromId || !toId) {
        warning(warnings, "missing_company_relationship_target", "company_relationships", legacyId, null, "Company relationship target missing after transform.", {});
        return null;
      }

      return {
        legacy_company_relationship_id: legacyId,
        company_id_from: fromId,
        company_id_to: toId,
        relationship_type_code: relationship.code,
        ownership_percentage: safeNumber(row.ownership_percentage, warnings, "company_relationships", legacyId, "ownership_percentage", { nonNegative: true }),
        is_current: parseBoolean(row.is_current, true),
        notes: combineNotes(row.notes, `Legacy relationship type: ${cleanString(row.relationship_type) || "unknown"}`),
      };
    })
    .filter(Boolean);

  await insertRows(client, "company_relationships", Object.keys(relationshipRows[0] || {}), relationshipRows, {
    batchSize: args.batchSize,
    conflictColumns: ["legacy_company_relationship_id"],
  });

  const roleProfileRows = tables.company_roles
    .map((row) => {
      const legacyId = cleanString(row.company_role_id);
      const role = mapRole(row.role_type, warnings, "company_roles", legacyId);
      const companyId = companyMap.get(cleanString(row.company_id));

      if (!companyId) {
        warning(warnings, "missing_company_role_profile_target", "company_roles", legacyId, null, "Company role profile target missing after transform.", {});
        return null;
      }

      return {
        legacy_company_role_id: legacyId,
        company_id: companyId,
        role_code: role.roleCode,
        role_subtype: cleanString(row.role_subtype),
        role_scope: cleanString(row.role_scope),
        role_status: cleanString(row.role_status),
        notes: combineNotes(row.notes, role.roleDetail),
      };
    })
    .filter(Boolean);

  await insertRows(client, "company_role_profiles", Object.keys(roleProfileRows[0] || {}), roleProfileRows, {
    batchSize: args.batchSize,
    conflictColumns: ["legacy_company_role_id"],
  });

  await insertWarnings(client, run.run_id, warnings, args.batchSize);

  await client.query(
    `
    UPDATE live_sqlite_migration_runs
    SET status = $2,
        transform_completed_at = CASE WHEN $2 = 'transformed' THEN now() ELSE transform_completed_at END,
        updated_at = now()
    WHERE run_id = $1
    `,
    [run.run_id, args.execute ? "transformed" : "transform_dry_run"]
  );

  return {
    transformed_counts: {
      companies: companyRows.length,
      projects: projectRows.length,
      operating_assets: assetRows.length,
      project_operating_asset_links: promotionRows.length,
      company_project_links: companyProjectRows.length,
      company_operating_asset_links: companyAssetRows.length,
      company_relationships: relationshipRows.length,
      company_role_profiles: roleProfileRows.length,
    },
    warnings,
  };
}

const args = parseCommonArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const pool = createPool();
const client = await pool.connect();

try {
  await client.query("BEGIN");

  if (args.ensureSchema) {
    await ensureMigrationSchema(client);
  }

  const run = await findRun(client, args);

  if (!run) {
    throw new Error("Migration run not found. Run live-sqlite:stage first.");
  }

  await client.query(
    "UPDATE live_sqlite_migration_runs SET transform_started_at = now(), status = 'transforming', updated_at = now() WHERE run_id = $1",
    [run.run_id]
  );
  await client.query("DELETE FROM live_sqlite_migration_warnings WHERE run_id = $1", [run.run_id]);

  const result = await transformRun(client, run, args);
  const report = {
    generated_at: new Date().toISOString(),
    execute: args.execute,
    transaction: args.execute ? "committed" : "rolled_back",
    run_id: run.run_id,
    run_label: run.run_label,
    transformed_counts: result.transformed_counts,
    warning_counts: warningCounter(result.warnings),
    warning_total: result.warnings.length,
  };

  await writeJson(path.join(args.out, "transform_result.json"), report);

  if (args.execute) {
    await client.query("COMMIT");
  } else {
    await client.query("ROLLBACK");
  }

  console.log(`${args.execute ? "Transformed" : "Dry-run transformed"} live SQLite staging run ${run.run_label}`);
  console.log(`Transaction: ${report.transaction}`);
  for (const [name, count] of Object.entries(result.transformed_counts)) {
    console.log(`- ${name}: ${count}`);
  }
  console.log(`Warnings: ${result.warnings.length}`);
  console.log(`Wrote ${path.join(args.out, "transform_result.json")}`);
} catch (error) {
  await client.query("ROLLBACK");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
