#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_INPUT = path.resolve(
  "..",
  "source-data",
  "tge-news-article-fact-import-pack",
  "article_fact_candidates_reviewed_import.ndjson"
);

const VALID_STATUSES = new Set([
  "suggested",
  "needs_review",
  "confirmed",
  "rejected",
  "superseded",
]);

const IMPORT_PACK_STATUSES = new Set(["confirmed", "rejected", "needs_review"]);

const REQUIRED_FIELDS = [
  "fact_key",
  "source_reference",
  "fact_type_code",
  "extracted_value",
  "confidence_score",
  "fact_status_code",
  "extraction_method",
];

const SAFETY_FLAGS = [
  "body_text_stored",
  "article_body_exported",
  "entity_fields_updated",
  "database_write_performed",
];

const FORBIDDEN_METADATA_KEYS = [
  "body",
  "body_text",
  "article_body",
  "content",
  "full_text",
  "full_article",
  "markdown",
  "raw_markdown",
];

function parseArgs(argv) {
  const args = {
    input: process.env.TGE_ARTICLE_FACT_IMPORT_PACK_INPUT || DEFAULT_INPUT,
    out: process.env.TGE_ARTICLE_FACT_IMPORT_PACK_AUDIT_OUT || "",
    confirmedOnly: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--input" && next) {
      args.input = path.resolve(next);
      index += 1;
    } else if (arg === "--out" && next) {
      args.out = path.resolve(next);
      index += 1;
    } else if (arg === "--confirmed-only") {
      args.confirmedOnly = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  args.input = path.resolve(args.input);
  args.out = path.resolve(args.out || path.dirname(args.input));

  return args;
}

function printHelp() {
  console.log(`
Usage:
  npm run tge-news:fact-import-audit -- --input "../source-data/.../article_fact_candidates_reviewed_import.ndjson"

Options:
  --input <file>       Import pack NDJSON file.
  --out <dir>          Output directory. Defaults to the input file directory.
  --confirmed-only     Fail if the pack contains rejected or needs_review rows.

Output:
  article_fact_import_pack_audit.json
  article_fact_import_pack_audit.md

Privacy:
  Local-only. No database writes, no network calls, no full article body text.
`);
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readNdjson(input) {
  const text = await fs.readFile(input, "utf8");
  const rows = [];
  const errors = [];
  const lines = text.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (!line) {
      continue;
    }

    try {
      rows.push(JSON.parse(line));
    } catch (error) {
      errors.push({
        row: index + 1,
        issue: "invalid_json",
        detail: error.message,
      });
    }
  }

  return { rows, errors };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function countBy(rows, key) {
  const counts = new Map();

  for (const row of rows) {
    const value = row[key] || "unknown";
    counts.set(value, (counts.get(value) || 0) + 1);
  }

  return Object.fromEntries(
    [...counts.entries()].sort(([a], [b]) => String(a).localeCompare(String(b)))
  );
}

function findForbiddenMetadataKeys(value, prefix = "") {
  if (!isPlainObject(value)) {
    return [];
  }

  const matches = [];

  for (const [key, nestedValue] of Object.entries(value)) {
    const lowerKey = key.toLowerCase();
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (FORBIDDEN_METADATA_KEYS.includes(lowerKey)) {
      matches.push(fullKey);
    }

    matches.push(...findForbiddenMetadataKeys(nestedValue, fullKey));
  }

  return matches;
}

function validateDate(value) {
  if (value === null || value === undefined || value === "") {
    return true;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime());
}

function validateRows(rows, args) {
  const errors = [];
  const warnings = [];
  const seenFactKeys = new Set();

  rows.forEach((row, index) => {
    const rowNumber = index + 1;

    for (const field of REQUIRED_FIELDS) {
      if (row[field] === null || row[field] === undefined || row[field] === "") {
        errors.push({ row: rowNumber, fact_key: row.fact_key, issue: `missing_${field}` });
      }
    }

    if (row.fact_key) {
      if (seenFactKeys.has(row.fact_key)) {
        errors.push({
          row: rowNumber,
          fact_key: row.fact_key,
          issue: "duplicate_fact_key",
        });
      }

      seenFactKeys.add(row.fact_key);
    }

    if (!VALID_STATUSES.has(row.fact_status_code)) {
      errors.push({
        row: rowNumber,
        fact_key: row.fact_key,
        issue: "invalid_fact_status_code",
        value: row.fact_status_code,
      });
    } else if (!IMPORT_PACK_STATUSES.has(row.fact_status_code)) {
      warnings.push({
        row: rowNumber,
        fact_key: row.fact_key,
        issue: "unexpected_import_pack_status",
        value: row.fact_status_code,
      });
    }

    if (args.confirmedOnly && row.fact_status_code !== "confirmed") {
      errors.push({
        row: rowNumber,
        fact_key: row.fact_key,
        issue: "non_confirmed_row_in_confirmed_only_pack",
        value: row.fact_status_code,
      });
    }

    const confidenceScore = Number(row.confidence_score);
    if (
      !Number.isFinite(confidenceScore) ||
      confidenceScore < 0 ||
      confidenceScore > 1
    ) {
      errors.push({
        row: rowNumber,
        fact_key: row.fact_key,
        issue: "invalid_confidence_score",
        value: row.confidence_score,
      });
    }

    if (row.evidence_snippet && String(row.evidence_snippet).length > 500) {
      errors.push({
        row: rowNumber,
        fact_key: row.fact_key,
        issue: "evidence_snippet_too_long",
        length: String(row.evidence_snippet).length,
      });
    }

    if (!isPlainObject(row.normalized_value)) {
      errors.push({
        row: rowNumber,
        fact_key: row.fact_key,
        issue: "normalized_value_not_object",
      });
    }

    if (!isPlainObject(row.extraction_metadata)) {
      errors.push({
        row: rowNumber,
        fact_key: row.fact_key,
        issue: "extraction_metadata_not_object",
      });
    } else {
      for (const flag of SAFETY_FLAGS) {
        if (row.extraction_metadata[flag] !== false) {
          errors.push({
            row: rowNumber,
            fact_key: row.fact_key,
            issue: `safety_flag_not_false_${flag}`,
            value: row.extraction_metadata[flag],
          });
        }
      }

      const forbiddenKeys = findForbiddenMetadataKeys(row.extraction_metadata);
      if (forbiddenKeys.length) {
        errors.push({
          row: rowNumber,
          fact_key: row.fact_key,
          issue: "forbidden_metadata_keys",
          keys: forbiddenKeys,
        });
      }
    }

    if (!validateDate(row.published_date)) {
      errors.push({
        row: rowNumber,
        fact_key: row.fact_key,
        issue: "invalid_published_date",
        value: row.published_date,
      });
    }
  });

  return { errors, warnings };
}

function markdownReport(summary) {
  const lines = [
    "# Article Fact Import Pack Audit",
    "",
    `Generated: ${summary.generated_at}`,
    "",
    "## Result",
    "",
    `- passed: ${summary.passed}`,
    `- input rows: ${summary.counts.input_rows}`,
    `- errors: ${summary.counts.error_count}`,
    `- warnings: ${summary.counts.warning_count}`,
    `- confirmed rows: ${summary.counts.by_fact_status.confirmed || 0}`,
    `- rejected rows: ${summary.counts.by_fact_status.rejected || 0}`,
    `- needs review rows: ${summary.counts.by_fact_status.needs_review || 0}`,
    "",
    "## Privacy",
    "",
    `- local only: ${summary.privacy.local_only}`,
    `- network calls: ${summary.privacy.network_calls}`,
    `- database writes: ${summary.privacy.database_writes}`,
    `- full article body output: ${summary.privacy.full_article_body_output}`,
    "",
    "## Counts By Fact Type",
    "",
  ];

  for (const [key, value] of Object.entries(summary.counts.by_fact_type)) {
    lines.push(`- ${key}: ${value}`);
  }

  if (summary.errors.length) {
    lines.push("", "## Errors", "");
    for (const error of summary.errors.slice(0, 50)) {
      lines.push(`- row ${error.row}: ${error.issue} (${error.fact_key || "no fact key"})`);
    }
  }

  if (summary.warnings.length) {
    lines.push("", "## Warnings", "");
    for (const warning of summary.warnings.slice(0, 50)) {
      lines.push(
        `- row ${warning.row}: ${warning.issue} (${warning.fact_key || "no fact key"})`
      );
    }
  }

  lines.push("");

  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!(await pathExists(args.input))) {
    throw new Error(`Input file does not exist: ${args.input}`);
  }

  const { rows, errors: parseErrors } = await readNdjson(args.input);
  const { errors: validationErrors, warnings } = validateRows(rows, args);
  const errors = [...parseErrors, ...validationErrors];
  const summary = {
    generated_at: new Date().toISOString(),
    input_file: args.input,
    output_directory: args.out,
    confirmed_only_mode: args.confirmedOnly,
    passed: errors.length === 0,
    privacy: {
      local_only: true,
      network_calls: false,
      database_writes: false,
      full_article_body_output: false,
    },
    counts: {
      input_rows: rows.length,
      error_count: errors.length,
      warning_count: warnings.length,
      by_fact_status: countBy(rows, "fact_status_code"),
      by_fact_type: countBy(rows, "fact_type_code"),
      by_field_name: countBy(rows, "field_name"),
    },
    errors,
    warnings,
  };

  await fs.mkdir(args.out, { recursive: true });
  await fs.writeFile(
    path.join(args.out, "article_fact_import_pack_audit.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8"
  );
  await fs.writeFile(
    path.join(args.out, "article_fact_import_pack_audit.md"),
    markdownReport(summary),
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        passed: summary.passed,
        input_rows: summary.counts.input_rows,
        errors: summary.counts.error_count,
        warnings: summary.counts.warning_count,
        by_fact_status: summary.counts.by_fact_status,
        output_directory: summary.output_directory,
        privacy: summary.privacy,
      },
      null,
      2
    )
  );

  if (!summary.passed) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
