import {
  getPostgresCompanyRelationshipReferenceData,
  type PostgresCompanyOperatingAssetLinkMutationInput,
  type PostgresCompanyProjectLinkMutationInput,
  type PostgresCompanyRelationshipMutationInput,
} from "@/lib/postgres-preview";

type ParsedProjectLinkInput =
  | {
      ok: true;
      input: PostgresCompanyProjectLinkMutationInput;
    }
  | {
      ok: false;
      error: string;
    };

type ParsedOperatingAssetLinkInput =
  | {
      ok: true;
      input: PostgresCompanyOperatingAssetLinkMutationInput;
    }
  | {
      ok: false;
      error: string;
    };

type ParsedCompanyRelationshipInput =
  | {
      ok: true;
      input: PostgresCompanyRelationshipMutationInput;
    }
  | {
      ok: false;
      error: string;
    };

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

function cleanBoolean(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function codeSet(options: Array<{ code: string }>) {
  return new Set(options.map((option) => option.code));
}

function parsePercent(value: unknown, label: string) {
  if (value === undefined || value === null || value === "") {
    return { ok: true as const, value: null };
  }

  const parsed = typeof value === "number" ? value : Number(cleanString(value));

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    return { ok: false as const, error: `${label} must be between 0 and 100.` };
  }

  return { ok: true as const, value: parsed };
}

export async function parseCompanyProjectLinkMutationInput(
  body: unknown
): Promise<ParsedProjectLinkInput> {
  const inputBody = asRecord(body);

  if (!inputBody) {
    return { ok: false, error: "Invalid company-project link payload." };
  }

  const referenceData = await getPostgresCompanyRelationshipReferenceData();
  const companyIds = new Set(
    referenceData.companies.map((company) => company.company_id)
  );
  const projectIds = new Set(
    referenceData.projects.map((project) => project.project_id)
  );
  const roleCodes = codeSet(referenceData.companyRoles);
  const companyId = cleanString(inputBody.company_id);
  const projectId = cleanString(inputBody.project_id);
  const roleCode = cleanString(inputBody.role_code);
  const ownershipShare = parsePercent(inputBody.ownership_share, "Ownership share");

  if (!companyId || !projectId || !roleCode) {
    return {
      ok: false,
      error: "Company, project, and role are required.",
    };
  }

  if (!companyIds.has(companyId)) {
    return { ok: false, error: "Selected company was not found." };
  }

  if (!projectIds.has(projectId)) {
    return { ok: false, error: "Selected project was not found." };
  }

  if (!roleCodes.has(roleCode)) {
    return { ok: false, error: "Invalid company role." };
  }

  if (!ownershipShare.ok) {
    return ownershipShare;
  }

  return {
    ok: true,
    input: {
      company_id: companyId,
      project_id: projectId,
      role_code: roleCode,
      role_detail: cleanOptionalString(inputBody.role_detail),
      ownership_share: ownershipShare.value,
      is_primary: cleanBoolean(inputBody.is_primary),
      notes: cleanOptionalString(inputBody.notes),
    },
  };
}

export async function parseCompanyOperatingAssetLinkMutationInput(
  body: unknown
): Promise<ParsedOperatingAssetLinkInput> {
  const inputBody = asRecord(body);

  if (!inputBody) {
    return { ok: false, error: "Invalid company-asset link payload." };
  }

  const referenceData = await getPostgresCompanyRelationshipReferenceData();
  const companyIds = new Set(
    referenceData.companies.map((company) => company.company_id)
  );
  const operatingAssetIds = new Set(
    referenceData.operatingAssets.map((asset) => asset.operating_asset_id)
  );
  const roleCodes = codeSet(referenceData.companyRoles);
  const companyId = cleanString(inputBody.company_id);
  const operatingAssetId = cleanString(inputBody.operating_asset_id);
  const roleCode = cleanString(inputBody.role_code);
  const ownershipShare = parsePercent(inputBody.ownership_share, "Ownership share");

  if (!companyId || !operatingAssetId || !roleCode) {
    return {
      ok: false,
      error: "Company, plant/facility, and role are required.",
    };
  }

  if (!companyIds.has(companyId)) {
    return { ok: false, error: "Selected company was not found." };
  }

  if (!operatingAssetIds.has(operatingAssetId)) {
    return { ok: false, error: "Selected plant/facility was not found." };
  }

  if (!roleCodes.has(roleCode)) {
    return { ok: false, error: "Invalid company role." };
  }

  if (!ownershipShare.ok) {
    return ownershipShare;
  }

  return {
    ok: true,
    input: {
      company_id: companyId,
      operating_asset_id: operatingAssetId,
      role_code: roleCode,
      role_detail: cleanOptionalString(inputBody.role_detail),
      ownership_share: ownershipShare.value,
      is_primary: cleanBoolean(inputBody.is_primary),
      notes: cleanOptionalString(inputBody.notes),
    },
  };
}

export async function parseCompanyRelationshipMutationInput(
  body: unknown
): Promise<ParsedCompanyRelationshipInput> {
  const inputBody = asRecord(body);

  if (!inputBody) {
    return { ok: false, error: "Invalid company relationship payload." };
  }

  const referenceData = await getPostgresCompanyRelationshipReferenceData();
  const companyIds = new Set(
    referenceData.companies.map((company) => company.company_id)
  );
  const relationshipTypeCodes = codeSet(referenceData.relationshipTypes);
  const companyIdFrom = cleanString(inputBody.company_id_from);
  const companyIdTo = cleanString(inputBody.company_id_to);
  const relationshipTypeCode = cleanString(inputBody.relationship_type_code);
  const ownershipPercentage = parsePercent(
    inputBody.ownership_percentage,
    "Ownership percentage"
  );

  if (!companyIdFrom || !companyIdTo || !relationshipTypeCode) {
    return {
      ok: false,
      error: "Source company, related company, and relationship type are required.",
    };
  }

  if (companyIdFrom === companyIdTo) {
    return { ok: false, error: "A company cannot relate to itself." };
  }

  if (!companyIds.has(companyIdFrom) || !companyIds.has(companyIdTo)) {
    return { ok: false, error: "Selected company was not found." };
  }

  if (!relationshipTypeCodes.has(relationshipTypeCode)) {
    return { ok: false, error: "Invalid company relationship type." };
  }

  if (!ownershipPercentage.ok) {
    return ownershipPercentage;
  }

  return {
    ok: true,
    input: {
      company_id_from: companyIdFrom,
      company_id_to: companyIdTo,
      relationship_type_code: relationshipTypeCode,
      ownership_percentage: ownershipPercentage.value,
      is_current:
        inputBody.is_current === undefined || inputBody.is_current === null
          ? true
          : cleanBoolean(inputBody.is_current),
      notes: cleanOptionalString(inputBody.notes),
    },
  };
}
