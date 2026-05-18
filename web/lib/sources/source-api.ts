import { getCurrentPostgresPreviewUser } from "@/lib/postgres-preview/entity-api";
import {
  getSourceFormReferenceData,
  getSourceReferenceData,
  type SourceLinkMutationInput,
  type SourceMutationInput,
} from "@/lib/services/sources";
import type { UserRole } from "@/lib/auth/roles";

export type SourceSessionUser = {
  id: string;
  role: UserRole;
};

export type ParsedSourceInput =
  | {
      ok: true;
      input: SourceMutationInput;
    }
  | {
      ok: false;
      error: string;
    };

export type ParsedSourceLinkInput =
  | {
      ok: true;
      input: SourceLinkMutationInput;
    }
  | {
      ok: false;
      error: string;
    };

export async function getCurrentSourceUser(): Promise<SourceSessionUser | null> {
  const user = await getCurrentPostgresPreviewUser();
  return user ? { id: user.id, role: user.role } : null;
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

function cleanBoolean(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1";
}

export async function parseSourceMutationInput(
  body: unknown,
  canSetCredibilityStatus: boolean
): Promise<ParsedSourceInput> {
  const inputBody = asRecord(body);

  if (!inputBody) {
    return { ok: false, error: "Invalid source payload." };
  }

  const referenceData = await getSourceReferenceData();
  const sourceTypes = new Set(referenceData.sourceTypes.map((item) => item.code));
  const visibilityLevels = new Set(
    referenceData.visibilityLevels.map((item) => item.code)
  );
  const credibilityStatuses = new Set(
    referenceData.credibilityStatuses.map((item) => item.code)
  );

  const sourceType = cleanString(inputBody.source_type_code) || "web";
  const visibility = cleanString(inputBody.visibility_code) || "public";
  const requestedCredibility =
    cleanString(inputBody.credibility_status_code) || "needs_review";
  const credibility = canSetCredibilityStatus
    ? requestedCredibility
    : "needs_review";

  if (!sourceTypes.has(sourceType)) {
    return { ok: false, error: "Invalid source type." };
  }

  if (!visibilityLevels.has(visibility)) {
    return { ok: false, error: "Invalid source visibility level." };
  }

  if (!credibilityStatuses.has(credibility)) {
    return { ok: false, error: "Invalid source credibility status." };
  }

  const title = cleanOptionalString(inputBody.title);
  const url = cleanOptionalString(inputBody.url);
  const sourceReference = cleanOptionalString(inputBody.source_reference);

  if (!title && !url && !sourceReference) {
    return {
      ok: false,
      error: "Add at least a source title, URL, or source reference.",
    };
  }

  return {
    ok: true,
    input: {
      source_type_code: sourceType,
      title,
      url,
      source_reference: sourceReference,
      publisher: cleanOptionalString(inputBody.publisher),
      author_organization: cleanOptionalString(inputBody.author_organization),
      country: cleanOptionalString(inputBody.country),
      language_code: cleanOptionalString(inputBody.language_code),
      visibility_code: visibility,
      credibility_status_code: credibility,
      published_date: cleanOptionalString(inputBody.published_date),
      accessed_at: cleanOptionalString(inputBody.accessed_at),
      notes: cleanOptionalString(inputBody.notes),
      extracted_summary: cleanOptionalString(inputBody.extracted_summary),
      relevant_excerpt: cleanOptionalString(inputBody.relevant_excerpt),
      attachment_url: cleanOptionalString(inputBody.attachment_url),
      duplicate_source_flag: cleanBoolean(inputBody.duplicate_source_flag),
    },
  };
}

export async function parseSourceLinkMutationInput(
  body: unknown
): Promise<ParsedSourceLinkInput> {
  const inputBody = asRecord(body);

  if (!inputBody) {
    return { ok: false, error: "Invalid source-link payload." };
  }

  const sourceId = cleanString(inputBody.source_id);
  const entityType = cleanString(inputBody.entity_type);
  const entityId = cleanString(inputBody.entity_id);
  const confidenceStatus =
    cleanString(inputBody.confidence_status_code) || "unknown";

  if (!sourceId || !entityType || !entityId) {
    return {
      ok: false,
      error: "Source ID, entity type, and entity ID are required.",
    };
  }

  if (
    entityType !== "project" &&
    entityType !== "operating_asset" &&
    entityType !== "company"
  ) {
    return { ok: false, error: "Invalid source-link entity type." };
  }

  const referenceData = await getSourceFormReferenceData();
  const targetExists = referenceData.linkTargets.some(
    (target) =>
      target.entity_type === entityType && target.entity_id === entityId
  );
  const confidenceExists = referenceData.confidenceStatuses.some(
    (status) => status.code === confidenceStatus
  );

  if (!targetExists) {
    return { ok: false, error: "Selected linked record was not found." };
  }

  if (!confidenceExists) {
    return { ok: false, error: "Invalid evidence confidence status." };
  }

  return {
    ok: true,
    input: {
      source_id: sourceId,
      entity_type: entityType,
      entity_id: entityId,
      evidence_type: cleanOptionalString(inputBody.evidence_type),
      evidence_note: cleanOptionalString(inputBody.evidence_note),
      confidence_status_code: confidenceStatus,
      linked_field: cleanOptionalString(inputBody.linked_field),
      claim_text: cleanOptionalString(inputBody.claim_text),
      extracted_value: cleanOptionalString(inputBody.extracted_value),
      is_primary_evidence: cleanBoolean(inputBody.is_primary_evidence),
    },
  };
}
