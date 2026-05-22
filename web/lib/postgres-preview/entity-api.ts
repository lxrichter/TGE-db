import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { getPrismaClient } from "@/lib/db/prisma";
import {
  getPostgresEntityFormReferenceData,
  type PostgresCompanyMutationInput,
  type PostgresOperatingAssetMutationInput,
  type PostgresProjectMutationInput,
} from "@/lib/postgres-preview";
import { normalizeUserRole, type UserRole } from "@/lib/auth/roles";

export type PostgresPreviewSessionUser = {
  id: string;
  role: UserRole;
  name: string | null;
  email: string | null;
};

export type ParsedProjectInput =
  | {
      ok: true;
      input: PostgresProjectMutationInput;
    }
  | {
      ok: false;
      error: string;
    };

export type ParsedOperatingAssetInput =
  | {
      ok: true;
      input: PostgresOperatingAssetMutationInput;
    }
  | {
      ok: false;
      error: string;
    };

export type ParsedCompanyInput =
  | {
      ok: true;
      input: PostgresCompanyMutationInput;
    }
  | {
      ok: false;
      error: string;
    };

function isUuid(value: string | null | undefined) {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(
        value
      )
  );
}

function normalizeEmail(value: string | null | undefined) {
  const trimmed = value?.trim().toLowerCase();
  return trimmed || null;
}

function normalizeName(value: string | null | undefined, email: string | null) {
  const trimmed = value?.trim();
  return trimmed || email || "PostgreSQL Preview User";
}

async function resolvePostgresAppUserId({
  legacyUserId,
  email,
  name,
  role,
}: {
  legacyUserId: string;
  email: string | null;
  name: string | null;
  role: UserRole;
}) {
  const prisma = getPrismaClient();
  const uuidUserId = isUuid(legacyUserId) ? legacyUserId : null;
  const existingRows = await prisma.$queryRawUnsafe<Array<{ user_id: string }>>(
    `
    SELECT user_id::text
    FROM app_users
    WHERE ($1::uuid IS NOT NULL AND user_id = $1::uuid)
      OR ($2::text IS NOT NULL AND legacy_user_id = $2::text)
      OR ($3::text IS NOT NULL AND lower(email::text) = lower($3::text))
    ORDER BY
      CASE
        WHEN $1::uuid IS NOT NULL AND user_id = $1::uuid THEN 1
        WHEN $2::text IS NOT NULL AND legacy_user_id = $2::text THEN 2
        ELSE 3
      END
    LIMIT 1
    `,
    uuidUserId,
    legacyUserId || null,
    email
  );
  const existingUserId = existingRows[0]?.user_id;

  if (existingUserId) {
    await prisma.$executeRawUnsafe(
      `
      UPDATE app_users
      SET
        legacy_user_id = COALESCE(legacy_user_id, $2::text),
        role_code = $3,
        is_active = TRUE,
        updated_at = now()
      WHERE user_id = $1::uuid
      `,
      existingUserId,
      legacyUserId || null,
      role
    );

    return existingUserId;
  }

  if (!email) {
    return null;
  }

  const insertedRows = await prisma.$queryRawUnsafe<Array<{ user_id: string }>>(
    `
    INSERT INTO app_users (
      legacy_user_id,
      name,
      email,
      role_code,
      is_active
    )
    VALUES ($1, $2, $3, $4, TRUE)
    ON CONFLICT (email) DO UPDATE
    SET
      legacy_user_id = COALESCE(app_users.legacy_user_id, EXCLUDED.legacy_user_id),
      role_code = EXCLUDED.role_code,
      is_active = TRUE,
      updated_at = now()
    RETURNING user_id::text
    `,
    legacyUserId || null,
    normalizeName(name, email),
    email,
    role
  );

  return insertedRows[0]?.user_id ?? null;
}

export async function getCurrentPostgresPreviewUser(): Promise<PostgresPreviewSessionUser | null> {
  const session = await getServerSession(authOptions);
  const user =
    session?.user as
      | (Partial<PostgresPreviewSessionUser> & {
          name?: string | null;
          email?: string | null;
        })
      | undefined;
  const role = normalizeUserRole(user?.role);

  if (!user?.id || !role) {
    return null;
  }

  const email = normalizeEmail(user.email);
  const name = normalizeName(user.name, email);
  const postgresUserId = await resolvePostgresAppUserId({
    legacyUserId: user.id,
    email,
    name,
    role,
  });

  if (!postgresUserId) {
    return null;
  }

  return {
    id: postgresUserId,
    role,
    name,
    email,
  };
}

function asRecord(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  return body as Record<string, unknown>;
}

function cleanString(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function cleanOptionalString(value: unknown) {
  return cleanString(value) || null;
}

function readNumber(
  body: Record<string, unknown>,
  key: string,
  label: string
): { ok: true; value: number | null } | { ok: false; error: string } {
  const raw = body[key];

  if (raw === null || raw === undefined || raw === "") {
    return { ok: true, value: null };
  }

  const value = typeof raw === "number" ? raw : Number(cleanString(raw));

  if (!Number.isFinite(value)) {
    return { ok: false, error: `${label} must be numeric.` };
  }

  return { ok: true, value };
}

function readInteger(
  body: Record<string, unknown>,
  key: string,
  label: string
): { ok: true; value: number | null } | { ok: false; error: string } {
  const parsed = readNumber(body, key, label);

  if (!parsed.ok || parsed.value === null) {
    return parsed;
  }

  if (!Number.isInteger(parsed.value)) {
    return { ok: false, error: `${label} must be a whole number.` };
  }

  return parsed;
}

function numberValue(
  result: { ok: true; value: number | null } | { ok: false; error: string }
) {
  return result.ok ? result.value : null;
}

function codeSet(options: Array<{ code: string }>) {
  return new Set(options.map((option) => option.code));
}

function resolveReviewStatus(
  requested: string,
  reviewStatusCodes: Set<string>,
  canSetReviewStatus: boolean
) {
  const allowedResearcherStatuses = new Set(["draft", "validation", "needs_update"]);
  const reviewStatus = canSetReviewStatus
    ? requested || "draft"
    : allowedResearcherStatuses.has(requested)
      ? requested
      : "draft";

  if (!reviewStatusCodes.has(reviewStatus)) {
    return null;
  }

  return reviewStatus;
}

function hasCode(codes: Set<string>, value: string | null) {
  return Boolean(value && codes.has(value));
}

export async function parseProjectMutationInput(
  body: unknown,
  canSetReviewStatus: boolean
): Promise<ParsedProjectInput> {
  const inputBody = asRecord(body);

  if (!inputBody) {
    return { ok: false, error: "Invalid project payload." };
  }

  const referenceData = await getPostgresEntityFormReferenceData();
  const useTypeCodes = codeSet(referenceData.useTypes);
  const lifecycleCodes = codeSet(referenceData.lifecyclePhases);
  const reviewStatusCodes = codeSet(referenceData.reviewStatuses);
  const estimateStatusCodes = codeSet(referenceData.estimateStatuses);

  const projectName = cleanString(inputBody.project_name);

  if (!projectName) {
    return { ok: false, error: "Project name is required." };
  }

  const useType = cleanString(inputBody.primary_use_type_code) || "unknown";
  const lifecycle = cleanString(inputBody.lifecycle_phase_code) || "prospect_tbd";
  const capacityStatus =
    cleanString(inputBody.capacity_estimate_status_code) || "unknown";
  const outputStatus =
    cleanString(inputBody.output_estimate_status_code) || "unknown";
  const reviewStatus = resolveReviewStatus(
    cleanString(inputBody.review_status_code),
    reviewStatusCodes,
    canSetReviewStatus
  );

  if (!hasCode(useTypeCodes, useType)) {
    return { ok: false, error: "Invalid geothermal use type." };
  }

  if (!hasCode(lifecycleCodes, lifecycle)) {
    return { ok: false, error: "Invalid lifecycle phase." };
  }

  if (!hasCode(estimateStatusCodes, capacityStatus)) {
    return { ok: false, error: "Invalid capacity confidence status." };
  }

  if (!hasCode(estimateStatusCodes, outputStatus)) {
    return { ok: false, error: "Invalid output confidence status." };
  }

  if (!reviewStatus) {
    return { ok: false, error: "Invalid review status." };
  }

  const numericFields = {
    latitude: readNumber(inputBody, "latitude", "Latitude"),
    longitude: readNumber(inputBody, "longitude", "Longitude"),
    resource_temp_c: readNumber(inputBody, "resource_temp_c", "Resource temp"),
    potential_min_mwe: readNumber(inputBody, "potential_min_mwe", "Potential min"),
    potential_max_mwe: readNumber(inputBody, "potential_max_mwe", "Potential max"),
    electric_capacity_mwe: readNumber(
      inputBody,
      "electric_capacity_mwe",
      "Electric capacity"
    ),
    thermal_capacity_mwth: readNumber(
      inputBody,
      "thermal_capacity_mwth",
      "Thermal capacity"
    ),
    annual_power_generation_gwhe: readNumber(
      inputBody,
      "annual_power_generation_gwhe",
      "Annual power generation"
    ),
    annual_heat_supply_gwhth: readNumber(
      inputBody,
      "annual_heat_supply_gwhth",
      "Annual heat supply"
    ),
    annual_cooling_supply_gwhc: readNumber(
      inputBody,
      "annual_cooling_supply_gwhc",
      "Annual cooling supply"
    ),
    start_dev_year: readInteger(inputBody, "start_dev_year", "Start dev year"),
    target_cod_year: readInteger(inputBody, "target_cod_year", "Target COD year"),
    target_cod_month: readInteger(
      inputBody,
      "target_cod_month",
      "Target COD month"
    ),
  };

  for (const result of Object.values(numericFields)) {
    if (!result.ok) {
      return result;
    }
  }

  return {
    ok: true,
    input: {
      project_name: projectName,
      project_group: cleanOptionalString(inputBody.project_group),
      primary_use_type_code: useType,
      lifecycle_phase_code: lifecycle,
      location_text: cleanOptionalString(inputBody.location_text),
      country: cleanOptionalString(inputBody.country),
      region: cleanOptionalString(inputBody.region),
      wb_region: cleanOptionalString(inputBody.wb_region),
      latitude: numberValue(numericFields.latitude),
      longitude: numberValue(numericFields.longitude),
      resource_type: cleanOptionalString(inputBody.resource_type),
      resource_temp_c: numberValue(numericFields.resource_temp_c),
      potential_min_mwe: numberValue(numericFields.potential_min_mwe),
      potential_max_mwe: numberValue(numericFields.potential_max_mwe),
      electric_capacity_mwe: numberValue(numericFields.electric_capacity_mwe),
      thermal_capacity_mwth: numberValue(numericFields.thermal_capacity_mwth),
      annual_power_generation_gwhe:
        numberValue(numericFields.annual_power_generation_gwhe),
      annual_heat_supply_gwhth: numberValue(numericFields.annual_heat_supply_gwhth),
      annual_cooling_supply_gwhc:
        numberValue(numericFields.annual_cooling_supply_gwhc),
      capacity_estimate_status_code: capacityStatus,
      output_estimate_status_code: outputStatus,
      start_dev_year: numberValue(numericFields.start_dev_year),
      target_cod_year: numberValue(numericFields.target_cod_year),
      target_cod_month: numberValue(numericFields.target_cod_month),
      cod_raw: cleanOptionalString(inputBody.cod_raw),
      plant_technology: cleanOptionalString(inputBody.plant_technology),
      turbine_supplier: cleanOptionalString(inputBody.turbine_supplier),
      review_status_code: reviewStatus,
      research_status: cleanOptionalString(inputBody.research_status),
      notes: cleanOptionalString(inputBody.notes),
    },
  };
}

export async function parseOperatingAssetMutationInput(
  body: unknown,
  canSetReviewStatus: boolean
): Promise<ParsedOperatingAssetInput> {
  const inputBody = asRecord(body);

  if (!inputBody) {
    return { ok: false, error: "Invalid plant payload." };
  }

  const referenceData = await getPostgresEntityFormReferenceData();
  const useTypeCodes = codeSet(referenceData.useTypes);
  const lifecycleCodes = codeSet(referenceData.lifecyclePhases);
  const reviewStatusCodes = codeSet(referenceData.reviewStatuses);
  const estimateStatusCodes = codeSet(referenceData.estimateStatuses);

  const assetName = cleanString(inputBody.asset_name);

  if (!assetName) {
    return { ok: false, error: "Plant name is required." };
  }

  const useType = cleanString(inputBody.primary_use_type_code) || "unknown";
  const lifecycle = cleanString(inputBody.lifecycle_phase_code) || "operating";
  const capacityStatus =
    cleanString(inputBody.capacity_estimate_status_code) || "unknown";
  const outputStatus =
    cleanString(inputBody.output_estimate_status_code) || "unknown";
  const reviewStatus = resolveReviewStatus(
    cleanString(inputBody.review_status_code),
    reviewStatusCodes,
    canSetReviewStatus
  );

  if (!hasCode(useTypeCodes, useType)) {
    return { ok: false, error: "Invalid geothermal use type." };
  }

  if (!hasCode(lifecycleCodes, lifecycle)) {
    return { ok: false, error: "Invalid operating status." };
  }

  if (!hasCode(estimateStatusCodes, capacityStatus)) {
    return { ok: false, error: "Invalid capacity confidence status." };
  }

  if (!hasCode(estimateStatusCodes, outputStatus)) {
    return { ok: false, error: "Invalid output confidence status." };
  }

  if (!reviewStatus) {
    return { ok: false, error: "Invalid review status." };
  }

  const numericFields = {
    latitude: readNumber(inputBody, "latitude", "Latitude"),
    longitude: readNumber(inputBody, "longitude", "Longitude"),
    resource_temp_c: readNumber(inputBody, "resource_temp_c", "Resource temp"),
    potential_min_mwe: readNumber(inputBody, "potential_min_mwe", "Potential min"),
    potential_max_mwe: readNumber(inputBody, "potential_max_mwe", "Potential max"),
    electric_capacity_mwe: readNumber(
      inputBody,
      "electric_capacity_mwe",
      "Installed capacity"
    ),
    electric_capacity_running_mwe: readNumber(
      inputBody,
      "electric_capacity_running_mwe",
      "Running capacity"
    ),
    thermal_capacity_mwth: readNumber(
      inputBody,
      "thermal_capacity_mwth",
      "Thermal capacity"
    ),
    annual_power_generation_gwhe: readNumber(
      inputBody,
      "annual_power_generation_gwhe",
      "Annual power generation"
    ),
    annual_heat_supply_gwhth: readNumber(
      inputBody,
      "annual_heat_supply_gwhth",
      "Annual heat supply"
    ),
    annual_cooling_supply_gwhc: readNumber(
      inputBody,
      "annual_cooling_supply_gwhc",
      "Annual cooling supply"
    ),
    start_dev_year: readInteger(inputBody, "start_dev_year", "Start dev year"),
    cod_year: readInteger(inputBody, "cod_year", "COD year"),
    cod_month: readInteger(inputBody, "cod_month", "COD month"),
  };

  for (const result of Object.values(numericFields)) {
    if (!result.ok) {
      return result;
    }
  }

  return {
    ok: true,
    input: {
      asset_name: assetName,
      project_group: cleanOptionalString(inputBody.project_group),
      primary_use_type_code: useType,
      lifecycle_phase_code: lifecycle,
      location_text: cleanOptionalString(inputBody.location_text),
      country: cleanOptionalString(inputBody.country),
      region: cleanOptionalString(inputBody.region),
      wb_region: cleanOptionalString(inputBody.wb_region),
      latitude: numberValue(numericFields.latitude),
      longitude: numberValue(numericFields.longitude),
      resource_type: cleanOptionalString(inputBody.resource_type),
      resource_temp_c: numberValue(numericFields.resource_temp_c),
      potential_min_mwe: numberValue(numericFields.potential_min_mwe),
      potential_max_mwe: numberValue(numericFields.potential_max_mwe),
      electric_capacity_mwe: numberValue(numericFields.electric_capacity_mwe),
      electric_capacity_running_mwe:
        numberValue(numericFields.electric_capacity_running_mwe),
      thermal_capacity_mwth: numberValue(numericFields.thermal_capacity_mwth),
      annual_power_generation_gwhe:
        numberValue(numericFields.annual_power_generation_gwhe),
      annual_heat_supply_gwhth: numberValue(numericFields.annual_heat_supply_gwhth),
      annual_cooling_supply_gwhc:
        numberValue(numericFields.annual_cooling_supply_gwhc),
      capacity_estimate_status_code: capacityStatus,
      output_estimate_status_code: outputStatus,
      start_dev_year: numberValue(numericFields.start_dev_year),
      cod_year: numberValue(numericFields.cod_year),
      cod_month: numberValue(numericFields.cod_month),
      cod_raw: cleanOptionalString(inputBody.cod_raw),
      number_of_units: cleanOptionalString(inputBody.number_of_units),
      plant_technology: cleanOptionalString(inputBody.plant_technology),
      turbine_supplier: cleanOptionalString(inputBody.turbine_supplier),
      review_status_code: reviewStatus,
      research_status: cleanOptionalString(inputBody.research_status),
      notes: cleanOptionalString(inputBody.notes),
    },
  };
}

export async function parseCompanyMutationInput(
  body: unknown,
  canSetReviewStatus: boolean
): Promise<ParsedCompanyInput> {
  const inputBody = asRecord(body);

  if (!inputBody) {
    return { ok: false, error: "Invalid company payload." };
  }

  const referenceData = await getPostgresEntityFormReferenceData();
  const companyEntityTypeCodes = codeSet(referenceData.companyEntityTypes);
  const companyPrimaryTypeCodes = codeSet(referenceData.companyPrimaryTypes);
  const reviewStatusCodes = codeSet(referenceData.reviewStatuses);

  const companyName = cleanString(inputBody.company_name);

  if (!companyName) {
    return { ok: false, error: "Company name is required." };
  }

  const entityType = cleanString(inputBody.entity_type_code) || "unknown";
  const primaryType = cleanString(inputBody.company_type_primary_code) || "unknown";
  const reviewStatus = resolveReviewStatus(
    cleanString(inputBody.review_status_code),
    reviewStatusCodes,
    canSetReviewStatus
  );

  if (!hasCode(companyEntityTypeCodes, entityType)) {
    return { ok: false, error: "Invalid company entity type." };
  }

  if (!hasCode(companyPrimaryTypeCodes, primaryType)) {
    return { ok: false, error: "Invalid primary company type." };
  }

  if (!reviewStatus) {
    return { ok: false, error: "Invalid review status." };
  }

  return {
    ok: true,
    input: {
      company_name: companyName,
      company_name_short: cleanOptionalString(inputBody.company_name_short),
      company_legal_name: cleanOptionalString(inputBody.company_legal_name),
      website_url: cleanOptionalString(inputBody.website_url),
      linkedin_url: cleanOptionalString(inputBody.linkedin_url),
      entity_type_code: entityType,
      company_type_primary_code: primaryType,
      ownership_type: cleanOptionalString(inputBody.ownership_type),
      company_status: cleanOptionalString(inputBody.company_status),
      headquarters_city: cleanOptionalString(inputBody.headquarters_city),
      headquarters_country: cleanOptionalString(inputBody.headquarters_country),
      region: cleanOptionalString(inputBody.region),
      wb_region: cleanOptionalString(inputBody.wb_region),
      geothermal_focus: cleanOptionalString(inputBody.geothermal_focus),
      technology_focus: cleanOptionalString(inputBody.technology_focus),
      service_scope_summary: cleanOptionalString(inputBody.service_scope_summary),
      operating_markets_summary: cleanOptionalString(
        inputBody.operating_markets_summary
      ),
      review_status_code: reviewStatus,
      research_status: cleanOptionalString(inputBody.research_status),
      notes: cleanOptionalString(inputBody.notes),
    },
  };
}
