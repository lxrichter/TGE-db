import { NextResponse } from "next/server";
import { canCreateDraft } from "@/lib/auth/roles";
import {
  createSourceLinkIfMissing,
  getTgeArticleByWordPressId,
  upsertTgeArticleSource,
} from "@/lib/services/tge-articles";
import {
  getCurrentSourceUser,
  parseSourceLinkMutationInput,
} from "@/lib/sources/source-api";

function asRecord(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  return body as Record<string, unknown>;
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanBoolean(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1";
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentSourceUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    if (!canCreateDraft(user.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions." },
        { status: 403 }
      );
    }

    const body = asRecord(await req.json());

    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid TGE article import payload." },
        { status: 400 }
      );
    }

    const wordpressId = Number(body.wordpress_id ?? body.wp_id);

    if (!Number.isFinite(wordpressId) || wordpressId <= 0) {
      return NextResponse.json(
        { success: false, error: "A valid TGE WordPress article ID is required." },
        { status: 400 }
      );
    }

    const article = await getTgeArticleByWordPressId(wordpressId);

    if (!article) {
      return NextResponse.json(
        { success: false, error: "ThinkGeoEnergy article not found." },
        { status: 404 }
      );
    }

    const sourceResult = await upsertTgeArticleSource({
      article,
      actorUserId: user.id,
    });

    const entityType = cleanString(body.entity_type);
    const entityId = cleanString(body.entity_id);
    let linkResult: Awaited<ReturnType<typeof createSourceLinkIfMissing>> | null =
      null;

    if (entityType || entityId) {
      const parsedLink = await parseSourceLinkMutationInput({
        source_id: sourceResult.source.source_id,
        entity_type: entityType,
        entity_id: entityId,
        evidence_type: cleanString(body.evidence_type) || "tge_article",
        evidence_note: cleanString(body.evidence_note),
        confidence_status_code:
          cleanString(body.confidence_status_code) || "unknown",
        linked_field: cleanString(body.linked_field),
        claim_text: cleanString(body.claim_text),
        extracted_value: cleanString(body.extracted_value),
        is_primary_evidence: cleanBoolean(body.is_primary_evidence),
      });

      if (!parsedLink.ok) {
        return NextResponse.json(
          { success: false, error: parsedLink.error },
          { status: 400 }
        );
      }

      linkResult = await createSourceLinkIfMissing({
        ...parsedLink.input,
        reviewedByUserId: user.id,
      });
    }

    return NextResponse.json(
      {
        success: true,
        article,
        source: sourceResult.source,
        source_created: sourceResult.created,
        link: linkResult?.link ?? null,
        link_created: linkResult?.created ?? false,
      },
      { status: sourceResult.created || linkResult?.created ? 201 : 200 }
    );
  } catch (error) {
    console.error("ThinkGeoEnergy article import error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to import ThinkGeoEnergy article." },
      { status: 500 }
    );
  }
}
