import os
import sqlite3
import pandas as pd
from datetime import date, datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "web", "data", "tge.db")
EXCEL_PATH = os.path.join(BASE_DIR, "source-data", "geothermal_companies.xlsx")


def clean_value(value):
    if pd.isna(value):
        return None

    if isinstance(value, pd.Timestamp):
        return value.strftime("%Y-%m-%d")

    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d")

    if isinstance(value, date):
        return value.strftime("%Y-%m-%d")

    if isinstance(value, str):
        value = value.strip()
        return value if value != "" else None

    return value


def clean_int_flag(value, default=0):
    value = clean_value(value)
    if value is None:
        return default
    if isinstance(value, str):
        v = value.strip().lower()
        if v in ["1", "true", "yes", "y"]:
            return 1
        if v in ["0", "false", "no", "n"]:
            return 0
    try:
        return 1 if int(value) == 1 else 0
    except Exception:
        return default


def read_sheet(xls, sheet_name):
    if sheet_name not in xls.sheet_names:
        print(f"WARNING: Sheet '{sheet_name}' not found. Skipping.")
        return pd.DataFrame()
    df = pd.read_excel(xls, sheet_name=sheet_name)
    df.columns = [str(c).strip() for c in df.columns]
    print(f"Loaded sheet '{sheet_name}' with columns: {list(df.columns)}")
    return df


# -------------------------------
# REFERENCE TABLES
# -------------------------------

def import_ref_company_type_primary(conn, df):
    if df.empty:
        return

    cursor = conn.cursor()
    count = 0

    for _, row in df.iterrows():
        type_name = clean_value(row.get("company_type_primary"))

        if not type_name:
            continue

        cursor.execute("""
            INSERT OR REPLACE INTO ref_company_type_primary (
                type_name, sort_order, is_active
            ) VALUES (?, ?, ?)
        """, (type_name, None, 1))
        count += 1

    conn.commit()
    print(f"Imported ref_company_type_primary: {count}")


def import_ref_company_type_secondary(conn, df):
    if df.empty:
        return

    cursor = conn.cursor()
    count = 0

    for _, row in df.iterrows():
        type_name = clean_value(row.get("company_type_secondary"))

        if not type_name:
            continue

        cursor.execute("""
            INSERT OR REPLACE INTO ref_company_type_secondary (
                type_name, primary_type_name, sort_order, is_active
            ) VALUES (?, ?, ?, ?)
        """, (type_name, None, None, 1))
        count += 1

    conn.commit()
    print(f"Imported ref_company_type_secondary: {count}")


# -------------------------------
# COMPANIES (FIXED VERSION)
# -------------------------------

def import_companies(conn, df):
    if df.empty:
        return

    cursor = conn.cursor()
    count = 0

    # Load valid primary types (normalized)
    valid_primary_map = {}
    rows = cursor.execute(
        "SELECT type_name FROM ref_company_type_primary WHERE type_name IS NOT NULL"
    ).fetchall()

    for row in rows:
        original = row[0]
        normalized = str(original).strip().lower()
        valid_primary_map[normalized] = original

    # PASS 1 — insert without parent refs
    for _, row in df.iterrows():
        company_id = clean_value(row.get("company_id"))
        if not company_id:
            continue

        # --- PRIMARY TYPE FIX ---
        raw_primary = clean_value(row.get("company_type_primary"))
        company_type_primary = None

        if raw_primary:
            normalized = str(raw_primary).strip().lower()

            if normalized in valid_primary_map:
                company_type_primary = valid_primary_map[normalized]
            else:
                print(f"WARNING: Invalid company_type_primary '{raw_primary}' → {company_id}")

        # --- SECONDARY TYPE (FREE TEXT) ---
        company_type_secondary = clean_value(row.get("company_type_secondary"))

        cursor.execute("""
            INSERT OR REPLACE INTO companies (
                company_id,
                company_name,
                company_name_short,
                company_legal_name,
                company_name_clean,
                website_url,
                linkedin_url,
                entity_type,
                company_type_primary,
                company_type_secondary,
                ownership_type,
                is_active_company,
                company_status,
                parent_company_id,
                ultimate_parent_company_id,
                company_group_name,
                is_group_parent,
                is_operating_entity,
                headquarters_city,
                headquarters_country,
                region,
                wb_region,
                geothermal_focus,
                technology_focus,
                service_scope_summary,
                operating_markets_summary,
                research_status,
                date_created,
                date_edited,
                notes,
                information,
                internal_comments,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (
            company_id,
            clean_value(row.get("company_name")),
            clean_value(row.get("company_name_short")),
            clean_value(row.get("company_legal_name")),
            clean_value(row.get("company_name_clean")),
            clean_value(row.get("website_url")),
            clean_value(row.get("linkedin_url")),
            clean_value(row.get("entity_type")),
            company_type_primary,
            company_type_secondary,
            clean_value(row.get("ownership_type")),
            clean_int_flag(row.get("is_active_company"), 1),
            clean_value(row.get("company_status")),
            None,
            None,
            clean_value(row.get("company_group_name")),
            clean_int_flag(row.get("is_group_parent"), 0),
            clean_int_flag(row.get("is_operating_entity"), 0),
            clean_value(row.get("headquarters_city")),
            clean_value(row.get("headquarters_country")),
            clean_value(row.get("region")),
            clean_value(row.get("wb_region")),
            clean_value(row.get("geothermal_focus")),
            clean_value(row.get("technology_focus")),
            clean_value(row.get("service_scope_summary")),
            clean_value(row.get("operating_markets_summary")),
            clean_value(row.get("research_status")),
            clean_value(row.get("date_created")),
            clean_value(row.get("date_edited")),
            clean_value(row.get("notes")),
            clean_value(row.get("information")),
            clean_value(row.get("internal_comments")),
        ))

        count += 1

    conn.commit()

    # PASS 2 — parent linking
    updated = 0

    for _, row in df.iterrows():
        company_id = clean_value(row.get("company_id"))
        if not company_id:
            continue

        parent = clean_value(row.get("parent_company_id"))
        ultimate = clean_value(row.get("ultimate_parent_company_id"))

        if parent:
            exists = cursor.execute(
                "SELECT 1 FROM companies WHERE company_id = ?", (parent,)
            ).fetchone()
            if not exists:
                parent = None

        if ultimate:
            exists = cursor.execute(
                "SELECT 1 FROM companies WHERE company_id = ?", (ultimate,)
            ).fetchone()
            if not exists:
                ultimate = None

        cursor.execute("""
            UPDATE companies
            SET parent_company_id = ?,
                ultimate_parent_company_id = ?
            WHERE company_id = ?
        """, (parent, ultimate, company_id))

        updated += 1

    conn.commit()

    print(f"Imported companies: {count}")
    print(f"Updated parent links: {updated}")


# -------------------------------
# MAIN
# -------------------------------

def main():
    if not os.path.exists(EXCEL_PATH):
        print("Excel not found")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON;")

    xls = pd.ExcelFile(EXCEL_PATH)

    try:
        import_ref_company_type_primary(conn, read_sheet(xls, "ref_company_type_primary"))
        import_ref_company_type_secondary(conn, read_sheet(xls, "ref_company_type_secondary"))
        import_companies(conn, read_sheet(xls, "companies_master"))

        print("Company import completed successfully.")

    except Exception as e:
        print("ERROR:", e)
        raise

    finally:
        conn.close()


if __name__ == "__main__":
    main()