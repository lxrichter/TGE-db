import { getPrismaClient } from "@/lib/db/prisma";

export type VocabularyGroupKey =
  | "geothermal_use_types"
  | "lifecycle_phases"
  | "review_statuses"
  | "estimate_statuses"
  | "company_entity_types"
  | "company_primary_types"
  | "company_roles"
  | "source_types"
  | "source_statuses"
  | "source_visibility_levels"
  | "article_fact_candidate_statuses"
  | "research_issue_types";

type VocabularyGroupConfig = {
  key: VocabularyGroupKey;
  table: string;
  title: string;
  description: string;
  hasDescription?: boolean;
  metadataColumns?: Array<{
    column: string;
    label: string;
  }>;
};

export type VocabularyItem = {
  code: string;
  label: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  metadata: Record<string, string | number | boolean | null>;
};

export type VocabularyGroup = {
  key: VocabularyGroupKey;
  title: string;
  description: string;
  hasDescription: boolean;
  metadataColumns: Array<{
    column: string;
    label: string;
  }>;
  items: VocabularyItem[];
};

export type VocabularyMutationInput = {
  groupKey: string;
  code: string;
  label: string;
  description?: string | null;
  sortOrder?: number | string | null;
  isActive?: boolean | null;
};

const VOCABULARY_GROUPS: VocabularyGroupConfig[] = [
  {
    key: "geothermal_use_types",
    table: "ref_geothermal_use_types",
    title: "Geothermal Use Types",
    description: "Power, direct-use, hybrid, mineral, and unknown classifications.",
    hasDescription: true,
  },
  {
    key: "lifecycle_phases",
    table: "ref_lifecycle_phases",
    title: "Lifecycle / Operating Statuses",
    description: "Shared status vocabulary for projects and operating assets.",
    metadataColumns: [{ column: "is_operating", label: "Operating" }],
  },
  {
    key: "review_statuses",
    table: "ref_review_statuses",
    title: "Entity Review Statuses",
    description: "Draft, validation, approved, export-ready, and archive states.",
    metadataColumns: [{ column: "is_terminal", label: "Terminal" }],
  },
  {
    key: "estimate_statuses",
    table: "ref_estimate_statuses",
    title: "Estimate / Confidence Statuses",
    description: "Confidence state for capacity, output, and evidence values.",
  },
  {
    key: "company_entity_types",
    table: "ref_company_entity_types",
    title: "Company Entity Types",
    description: "Legal entity, group, institution, SPV, and related company layers.",
  },
  {
    key: "company_primary_types",
    table: "ref_company_primary_types",
    title: "Company Primary Categories",
    description: "Dominant strategic company identity in the geothermal sector.",
  },
  {
    key: "company_roles",
    table: "ref_company_roles",
    title: "Company Relationship Roles",
    description: "Structured roles companies play on projects and operating assets.",
    hasDescription: true,
    metadataColumns: [{ column: "role_group", label: "Role Group" }],
  },
  {
    key: "source_types",
    table: "ref_source_types",
    title: "Source Types",
    description: "Evidence source classes including TGE articles, reports, filings, and notes.",
  },
  {
    key: "source_statuses",
    table: "ref_source_statuses",
    title: "Source Credibility Statuses",
    description: "Credibility workflow states for governed source records.",
    hasDescription: true,
    metadataColumns: [{ column: "is_export_eligible", label: "Export Eligible" }],
  },
  {
    key: "source_visibility_levels",
    table: "ref_source_visibility_levels",
    title: "Source Visibility Levels",
    description: "Visibility and confidentiality levels for source/evidence records.",
    hasDescription: true,
    metadataColumns: [{ column: "is_exportable", label: "Exportable" }],
  },
  {
    key: "article_fact_candidate_statuses",
    table: "ref_article_fact_candidate_statuses",
    title: "Article Fact Candidate Statuses",
    description: "Review states for local article extraction candidates.",
    hasDescription: true,
    metadataColumns: [{ column: "is_open", label: "Open" }],
  },
  {
    key: "research_issue_types",
    table: "ref_research_issue_types",
    title: "Research Ops Issue Types",
    description: "Persistent issue categories used in Research Ops workflows.",
    hasDescription: true,
    metadataColumns: [{ column: "severity", label: "Severity" }],
  },
];

const groupByKey = new Map(VOCABULARY_GROUPS.map((group) => [group.key, group]));

function getGroupConfig(groupKey: string) {
  return groupByKey.get(groupKey as VocabularyGroupKey) || null;
}

function metadataSelect(config: VocabularyGroupConfig) {
  return (config.metadataColumns || [])
    .map((column) => `${column.column} AS metadata_${column.column}`)
    .join(", ");
}

function rowToVocabularyItem(
  row: Record<string, unknown>,
  config: VocabularyGroupConfig
): VocabularyItem {
  const metadata: VocabularyItem["metadata"] = {};

  (config.metadataColumns || []).forEach((column) => {
    const value = row[`metadata_${column.column}`];
    metadata[column.column] =
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
        ? value
        : String(value ?? "");
  });

  return {
    code: String(row.code || ""),
    label: String(row.label || ""),
    description:
      typeof row.description === "string" && row.description.trim()
        ? row.description
        : null,
    sort_order: Number(row.sort_order || 0),
    is_active: Boolean(row.is_active),
    metadata,
  };
}

async function listVocabularyItems(
  config: VocabularyGroupConfig
): Promise<VocabularyItem[]> {
  const descriptionSelect = config.hasDescription
    ? "description"
    : "NULL::text AS description";
  const metadata = metadataSelect(config);
  const rows = await getPrismaClient().$queryRawUnsafe<Array<Record<string, unknown>>>(
    `
    SELECT
      code,
      label,
      ${descriptionSelect},
      sort_order,
      is_active
      ${metadata ? `, ${metadata}` : ""}
    FROM ${config.table}
    ORDER BY sort_order ASC, label ASC
    `
  );

  return rows.map((row) => rowToVocabularyItem(row, config));
}

export async function listVocabularyGroups(): Promise<VocabularyGroup[]> {
  const groups = await Promise.all(
    VOCABULARY_GROUPS.map(async (config) => ({
      key: config.key,
      title: config.title,
      description: config.description,
      hasDescription: Boolean(config.hasDescription),
      metadataColumns: config.metadataColumns || [],
      items: await listVocabularyItems(config),
    }))
  );

  return groups;
}

function cleanCode(code: string) {
  const normalized = code.trim().toLowerCase();

  if (!/^[a-z0-9_]+$/.test(normalized)) {
    throw new Error("Code must use lowercase letters, numbers, and underscores only.");
  }

  if (normalized.length < 2 || normalized.length > 80) {
    throw new Error("Code must be between 2 and 80 characters.");
  }

  return normalized;
}

function cleanLabel(label: string) {
  const normalized = label.trim();

  if (!normalized) {
    throw new Error("Label is required.");
  }

  if (normalized.length > 160) {
    throw new Error("Label must be 160 characters or fewer.");
  }

  return normalized;
}

function cleanDescription(description: string | null | undefined) {
  const normalized = String(description || "").trim();

  if (!normalized) {
    return null;
  }

  if (normalized.length > 1000) {
    throw new Error("Description must be 1000 characters or fewer.");
  }

  return normalized;
}

function cleanSortOrder(sortOrder: number | string | null | undefined) {
  const parsed = Number(sortOrder ?? 0);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.trunc(parsed);
}

export async function updateVocabularyItem(
  input: VocabularyMutationInput
): Promise<VocabularyItem> {
  const config = getGroupConfig(input.groupKey);

  if (!config) {
    throw new Error("Unknown vocabulary group.");
  }

  const code = cleanCode(input.code);
  const label = cleanLabel(input.label);
  const description = cleanDescription(input.description);
  const sortOrder = cleanSortOrder(input.sortOrder);
  const isActive = Boolean(input.isActive);

  if (config.hasDescription) {
    await getPrismaClient().$executeRawUnsafe(
      `
      UPDATE ${config.table}
      SET label = $1, description = $2, sort_order = $3, is_active = $4
      WHERE code = $5
      `,
      label,
      description,
      sortOrder,
      isActive,
      code
    );
  } else {
    await getPrismaClient().$executeRawUnsafe(
      `
      UPDATE ${config.table}
      SET label = $1, sort_order = $2, is_active = $3
      WHERE code = $4
      `,
      label,
      sortOrder,
      isActive,
      code
    );
  }

  const item = (await listVocabularyItems(config)).find(
    (entry) => entry.code === code
  );

  if (!item) {
    throw new Error("Vocabulary item not found.");
  }

  return item;
}

export async function createVocabularyItem(
  input: VocabularyMutationInput
): Promise<VocabularyItem> {
  const config = getGroupConfig(input.groupKey);

  if (!config) {
    throw new Error("Unknown vocabulary group.");
  }

  const code = cleanCode(input.code);
  const label = cleanLabel(input.label);
  const description = cleanDescription(input.description);
  const sortOrder = cleanSortOrder(input.sortOrder);
  const isActive = input.isActive ?? true;

  if (config.hasDescription) {
    await getPrismaClient().$executeRawUnsafe(
      `
      INSERT INTO ${config.table} (code, label, description, sort_order, is_active)
      VALUES ($1, $2, $3, $4, $5)
      `,
      code,
      label,
      description,
      sortOrder,
      isActive
    );
  } else {
    await getPrismaClient().$executeRawUnsafe(
      `
      INSERT INTO ${config.table} (code, label, sort_order, is_active)
      VALUES ($1, $2, $3, $4)
      `,
      code,
      label,
      sortOrder,
      isActive
    );
  }

  const item = (await listVocabularyItems(config)).find(
    (entry) => entry.code === code
  );

  if (!item) {
    throw new Error("Vocabulary item could not be reloaded.");
  }

  return item;
}
