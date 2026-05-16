#!/usr/bin/env python3
"""Profile the current SQLite/reference database before migration.

This script is intentionally read-only. It reports aggregate structure and data
quality signals without printing project, plant, company, user, or source text.
"""

from __future__ import annotations

import argparse
import sqlite3
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DB_PATH = REPO_ROOT / "shared" / "data" / "tge.db"
DEFAULT_OUTPUT_DIR = REPO_ROOT / "migration" / "profile_reports"
MISSING_REFERENCE_VALUES = ("na", "n/a", "none", "null", "-", "--")

VALUE_DISTRIBUTIONS = {
    "projects": [
        "project_phase",
        "review_status",
        "research_status",
        "country",
        "region",
        "wb_region",
    ],
    "plants": [
        "project_phase",
        "review_status",
        "research_status",
        "country",
        "region",
        "wb_region",
    ],
    "companies": [
        "entity_type",
        "company_type_primary",
        "ownership_type",
        "company_status",
        "research_status",
        "review_status",
        "headquarters_country",
        "region",
    ],
    "company_project_links": ["role", "is_primary"],
    "company_plant_links": ["role", "is_primary"],
    "company_relationships": ["relationship_type", "is_current"],
    "company_roles": ["role_type", "role_subtype", "role_scope", "role_status"],
    "users": ["role", "is_active"],
}

ORPHAN_CHECKS = [
    ("company_project_links", "company_id", "companies", "company_id"),
    ("company_project_links", "project_id", "projects", "project_id"),
    ("company_plant_links", "company_id", "companies", "company_id"),
    ("company_plant_links", "plant_id", "plants", "plant_id"),
    ("company_relationships", "company_id_from", "companies", "company_id"),
    ("company_relationships", "company_id_to", "companies", "company_id"),
    ("company_roles", "company_id", "companies", "company_id"),
    ("plants", "promoted_from_project_id", "projects", "project_id"),
    ("projects", "promoted_plant_id", "plants", "plant_id"),
    ("companies", "parent_company_id", "companies", "company_id"),
    ("companies", "ultimate_parent_company_id", "companies", "company_id"),
]

RANGE_CHECKS = [
    ("projects", "location_x", -90, 90, "latitude candidate"),
    ("projects", "location_y", -180, 180, "longitude candidate"),
    ("plants", "location_x", -90, 90, "latitude candidate"),
    ("plants", "location_y", -180, 180, "longitude candidate"),
    ("projects", "potential_min_mw", 0, None, "non-negative capacity"),
    ("projects", "potential_max_mw", 0, None, "non-negative capacity"),
    ("projects", "installed_capacity_mw", 0, None, "non-negative capacity"),
    ("projects", "capacity_running_mw", 0, None, "non-negative capacity"),
    ("projects", "gross_production_gwh", 0, None, "non-negative output"),
    ("plants", "potential_min_mw", 0, None, "non-negative capacity"),
    ("plants", "potential_max_mw", 0, None, "non-negative capacity"),
    ("plants", "installed_capacity_mw", 0, None, "non-negative capacity"),
    ("plants", "capacity_running_mw", 0, None, "non-negative capacity"),
    ("plants", "gross_production_gwh", 0, None, "non-negative output"),
    ("company_project_links", "ownership_share", 0, 100, "ownership percent"),
    ("company_plant_links", "ownership_share", 0, 100, "ownership percent"),
    ("company_relationships", "ownership_percentage", 0, 100, "ownership percent"),
    ("companies", "group_reporting_weight", 0, 1, "group reporting weight"),
]


@dataclass(frozen=True)
class ColumnInfo:
    cid: int
    name: str
    data_type: str
    not_null: bool
    default_value: str | None
    primary_key_position: int


def quote_identifier(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'


def table_names(conn: sqlite3.Connection) -> list[str]:
    rows = conn.execute(
        """
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name NOT LIKE 'sqlite_%'
        ORDER BY name
        """
    ).fetchall()
    return [row[0] for row in rows]


def table_exists(conn: sqlite3.Connection, table: str) -> bool:
    return table in set(table_names(conn))


def column_infos(conn: sqlite3.Connection, table: str) -> list[ColumnInfo]:
    rows = conn.execute(f"PRAGMA table_info({quote_identifier(table)})").fetchall()
    return [
        ColumnInfo(
            cid=row[0],
            name=row[1],
            data_type=row[2] or "",
            not_null=bool(row[3]),
            default_value=row[4],
            primary_key_position=int(row[5] or 0),
        )
        for row in rows
    ]


def column_names(conn: sqlite3.Connection, table: str) -> set[str]:
    return {column.name for column in column_infos(conn, table)}


def scalar(conn: sqlite3.Connection, sql: str, params: tuple = ()) -> int | float | str | None:
    return conn.execute(sql, params).fetchone()[0]


def row_count(conn: sqlite3.Connection, table: str) -> int:
    return int(scalar(conn, f"SELECT COUNT(*) FROM {quote_identifier(table)}") or 0)


def null_or_blank_count(conn: sqlite3.Connection, table: str, column: str) -> int:
    table_sql = quote_identifier(table)
    column_sql = quote_identifier(column)
    return int(
        scalar(
            conn,
            f"""
            SELECT COUNT(*)
            FROM {table_sql}
            WHERE {column_sql} IS NULL
               OR TRIM(CAST({column_sql} AS TEXT)) = ''
            """,
        )
        or 0
    )


def distinct_non_blank_count(conn: sqlite3.Connection, table: str, column: str) -> int:
    table_sql = quote_identifier(table)
    column_sql = quote_identifier(column)
    return int(
        scalar(
            conn,
            f"""
            SELECT COUNT(DISTINCT TRIM(CAST({column_sql} AS TEXT)))
            FROM {table_sql}
            WHERE {column_sql} IS NOT NULL
              AND TRIM(CAST({column_sql} AS TEXT)) <> ''
            """,
        )
        or 0
    )


def primary_key_columns(conn: sqlite3.Connection, table: str) -> list[str]:
    columns = [column for column in column_infos(conn, table) if column.primary_key_position]
    columns.sort(key=lambda column: column.primary_key_position)
    return [column.name for column in columns]


def duplicate_key_value_count(conn: sqlite3.Connection, table: str, column: str) -> int:
    table_sql = quote_identifier(table)
    column_sql = quote_identifier(column)
    return int(
        scalar(
            conn,
            f"""
            SELECT COUNT(*)
            FROM (
              SELECT TRIM(CAST({column_sql} AS TEXT)) AS value
              FROM {table_sql}
              WHERE {column_sql} IS NOT NULL
                AND TRIM(CAST({column_sql} AS TEXT)) <> ''
              GROUP BY TRIM(CAST({column_sql} AS TEXT))
              HAVING COUNT(*) > 1
            )
            """,
        )
        or 0
    )


def value_distribution(
    conn: sqlite3.Connection,
    table: str,
    column: str,
    limit: int,
) -> list[tuple[str, int]]:
    table_sql = quote_identifier(table)
    column_sql = quote_identifier(column)
    rows = conn.execute(
        f"""
        SELECT TRIM(CAST({column_sql} AS TEXT)) AS value, COUNT(*) AS count
        FROM {table_sql}
        WHERE {column_sql} IS NOT NULL
          AND TRIM(CAST({column_sql} AS TEXT)) <> ''
        GROUP BY TRIM(CAST({column_sql} AS TEXT))
        ORDER BY count DESC, value ASC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    return [(str(row[0]), int(row[1])) for row in rows]


def orphan_count(
    conn: sqlite3.Connection,
    child_table: str,
    child_column: str,
    parent_table: str,
    parent_column: str,
) -> int:
    child_table_sql = quote_identifier(child_table)
    child_column_sql = quote_identifier(child_column)
    parent_table_sql = quote_identifier(parent_table)
    parent_column_sql = quote_identifier(parent_column)
    missing_placeholders = ", ".join(f"'{value}'" for value in MISSING_REFERENCE_VALUES)
    return int(
        scalar(
            conn,
            f"""
            SELECT COUNT(*)
            FROM {child_table_sql} child
            LEFT JOIN {parent_table_sql} parent
              ON TRIM(CAST(child.{child_column_sql} AS TEXT))
               = TRIM(CAST(parent.{parent_column_sql} AS TEXT))
            WHERE child.{child_column_sql} IS NOT NULL
              AND TRIM(CAST(child.{child_column_sql} AS TEXT)) <> ''
              AND LOWER(TRIM(CAST(child.{child_column_sql} AS TEXT))) NOT IN ({missing_placeholders})
              AND parent.{parent_column_sql} IS NULL
            """,
        )
        or 0
    )


def invalid_range_count(
    conn: sqlite3.Connection,
    table: str,
    column: str,
    min_value: float | None,
    max_value: float | None,
) -> int:
    table_sql = quote_identifier(table)
    column_sql = quote_identifier(column)
    checks = [f"{column_sql} IS NOT NULL", f"TRIM(CAST({column_sql} AS TEXT)) <> ''"]
    if min_value is not None:
        checks.append(f"CAST({column_sql} AS REAL) < {min_value}")
    if max_value is not None:
        checks.append(f"CAST({column_sql} AS REAL) > {max_value}")

    range_checks = checks[:2]
    if min_value is not None and max_value is not None:
        range_checks.append(
            f"(CAST({column_sql} AS REAL) < {min_value} OR CAST({column_sql} AS REAL) > {max_value})"
        )
    elif min_value is not None:
        range_checks.append(f"CAST({column_sql} AS REAL) < {min_value}")
    elif max_value is not None:
        range_checks.append(f"CAST({column_sql} AS REAL) > {max_value}")

    return int(
        scalar(
            conn,
            f"""
            SELECT COUNT(*)
            FROM {table_sql}
            WHERE {' AND '.join(range_checks)}
            """,
        )
        or 0
    )


def markdown_table(headers: list[str], rows: list[list[str]]) -> list[str]:
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join("---" for _ in headers) + " |",
    ]
    for row in rows:
        safe_row = [cell.replace("|", "\\|") for cell in row]
        lines.append("| " + " | ".join(safe_row) + " |")
    return lines


def build_report(conn: sqlite3.Connection, db_path: Path, value_limit: int) -> str:
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    tables = table_names(conn)
    lines: list[str] = [
        "# Current Database Profile",
        "",
        f"Generated: {now}",
        "",
        f"Database file: `{db_path}`",
        "",
        "Important: this report profiles the local/reference SQLite database only.",
        "The live server database must be exported and profiled before final migration.",
        "",
        "The report intentionally avoids printing record names, user emails, password hashes, notes, or source text.",
        "",
        "## Table Inventory",
        "",
    ]

    inventory_rows = [[table, str(row_count(conn, table)), str(len(column_infos(conn, table)))] for table in tables]
    lines.extend(markdown_table(["Table", "Rows", "Columns"], inventory_rows))

    lines.extend(["", "## Column Completeness", ""])
    for table in tables:
        total_rows = row_count(conn, table)
        lines.extend([f"### `{table}`", "", f"Rows: `{total_rows}`", ""])
        rows: list[list[str]] = []
        for column in column_infos(conn, table):
            rows.append(
                [
                    column.name,
                    column.data_type,
                    "yes" if column.not_null else "no",
                    "yes" if column.primary_key_position else "no",
                    str(null_or_blank_count(conn, table, column.name)),
                    str(distinct_non_blank_count(conn, table, column.name)),
                ]
            )
        lines.extend(
            markdown_table(
                ["Column", "Type", "Not Null", "PK", "Null/Blank", "Distinct Non-Blank"],
                rows,
            )
        )
        lines.append("")

    lines.extend(["## Selected Value Distributions", ""])
    for table, columns in VALUE_DISTRIBUTIONS.items():
        if not table_exists(conn, table):
            continue
        available_columns = column_names(conn, table)
        table_has_output = False
        section_lines: list[str] = [f"### `{table}`", ""]
        for column in columns:
            if column not in available_columns:
                continue
            rows = value_distribution(conn, table, column, value_limit)
            if not rows:
                continue
            table_has_output = True
            section_lines.extend([f"`{column}`", ""])
            section_lines.extend(markdown_table(["Value", "Rows"], [[value, str(count)] for value, count in rows]))
            section_lines.append("")
        if table_has_output:
            lines.extend(section_lines)

    lines.extend(["## Duplicate Primary Keys", ""])
    duplicate_rows: list[list[str]] = []
    for table in tables:
        for column in primary_key_columns(conn, table):
            duplicate_rows.append([table, column, str(duplicate_key_value_count(conn, table, column))])
    lines.extend(markdown_table(["Table", "Primary Key Column", "Duplicate Values"], duplicate_rows))

    lines.extend(["", "## Relationship Checks", ""])
    orphan_rows: list[list[str]] = []
    for child_table, child_column, parent_table, parent_column in ORPHAN_CHECKS:
        if not table_exists(conn, child_table) or not table_exists(conn, parent_table):
            continue
        if child_column not in column_names(conn, child_table):
            continue
        if parent_column not in column_names(conn, parent_table):
            continue
        orphan_rows.append(
            [
                f"{child_table}.{child_column}",
                f"{parent_table}.{parent_column}",
                str(orphan_count(conn, child_table, child_column, parent_table, parent_column)),
            ]
        )
    lines.extend(markdown_table(["Child Reference", "Parent Reference", "Orphan Rows"], orphan_rows))

    lines.extend(["", "## Basic Range Checks", ""])
    range_rows: list[list[str]] = []
    for table, column, min_value, max_value, note in RANGE_CHECKS:
        if not table_exists(conn, table) or column not in column_names(conn, table):
            continue
        if min_value is None:
            expected = f"<= {max_value}"
        elif max_value is None:
            expected = f">= {min_value}"
        else:
            expected = f"{min_value} to {max_value}"
        range_rows.append(
            [
                f"{table}.{column}",
                expected,
                note,
                str(invalid_range_count(conn, table, column, min_value, max_value)),
            ]
        )
    lines.extend(markdown_table(["Column", "Expected Range", "Note", "Invalid Rows"], range_rows))

    lines.extend(
        [
            "",
            "## Next Migration Actions",
            "",
            "1. Export the live server database.",
            "2. Run this profile against the exported live SQLite/database copy where possible.",
            "3. Compare live schema and local-reference schema.",
            "4. Resolve unmapped statuses, phases, roles, and company relationship values.",
            "5. Only then write staging import and PostgreSQL transformation scripts.",
            "",
        ]
    )

    return "\n".join(lines)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create a safe aggregate profile of the current SQLite database."
    )
    parser.add_argument(
        "--db",
        type=Path,
        default=DEFAULT_DB_PATH,
        help=f"Path to the SQLite database. Default: {DEFAULT_DB_PATH}",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Optional Markdown output path. Defaults to migration/profile_reports/current_db_profile_<timestamp>.md.",
    )
    parser.add_argument(
        "--stdout",
        action="store_true",
        help="Print the report instead of writing it to a file.",
    )
    parser.add_argument(
        "--value-limit",
        type=int,
        default=30,
        help="Maximum distinct values to show for selected controlled-value columns.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    db_path = args.db.expanduser().resolve()

    if not db_path.exists():
        raise FileNotFoundError(f"SQLite database not found: {db_path}")

    conn = sqlite3.connect(db_path)
    try:
        report = build_report(conn, db_path, args.value_limit)
    finally:
        conn.close()

    if args.stdout:
        print(report)
        return

    output_path = args.output
    if output_path is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = DEFAULT_OUTPUT_DIR / f"current_db_profile_{timestamp}.md"
    output_path = output_path.expanduser().resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(report, encoding="utf-8")
    print(f"Wrote profile report: {output_path}")


if __name__ == "__main__":
    main()
