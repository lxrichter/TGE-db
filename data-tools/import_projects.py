from pathlib import Path
import sqlite3
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
DB_FILE = BASE_DIR / "web" / "data" / "tge.db"
EXCEL_FILE = BASE_DIR / "source-data" / "geothermal_projects.xlsx"
SHEET_NAME = "projects"

COLUMN_ALIASES = {
    "project_id": ["project_id", "Project ID"],
    "project_name": [
        "Plant/ Project Name",
        "Plant / Project Name",
        "Project Name",
        "Project/Plant Name",
        "Project / Plant Name",
        "Plant/Project Name",
    ],
    "project_group": ["Project Group"],
    "other_name": ["Other Name"],
    "owner_operator": ["Owner/Operator"],
    "developer": ["Developer"],
    "location_text": ["Location (County/City, Province)"],
    "country": ["Country"],
    "region": ["Region"],
    "wb_region": ["WB Region", "WB region"],
    "potential_min_mw": ["Potential min (MW)"],
    "potential_max_mw": ["Potential max (MW)"],
    "installed_capacity_mw": [
        "Installed Capacity",
        "Planned Capacity",
        "Planned Capacity (MW)",
        "Planned Installed Capacity",
        "Planned Installed Capacity (MW)",
        "Installed / Planned Capacity",
    ],
    "capacity_running_mw": ["Capacity Running", "Planned Capacity Running"],
    "gross_production_gwh": ["Gross Production (GWh)"],
    "start_dev_year": ["Start of Dev. (year)"],
    "cod": ["COD", "Planned COD"],
    "resource_type": ["Resource Type"],
    "resource_temp_c": ["Resource Temp. (°C)"],
    "project_phase": ["Project Phase"],
    "phase_historical": ["T: Phase (historical)"],
    "field_name": ["Field Name"],
    "wells_total": ["#Wells Total"],
    "wells_prod_active": ["# Wells Prod. Active"],
    "wells_reinj_active": ["#Wells Reinj Active"],
    "wells_inactive_standby": ["#Wells inactive/ standby"],
    "wells_other_exploration": ["#Wells Other/ Explor."],
    "well_depth_prod_m": ["Well Depth Prod. (m)"],
    "temp_prod_well_c": ["Temp. Prod. Well (°C)"],
    "flow_rate_ls": ["Flow rate (l/s)"],
    "number_of_unit": ["Number of Unit", "Number of Units"],
    "plant_technology": ["Plant Technology"],
    "turbine_supplier": ["Turbine Supplier"],
    "epc_suppliers": ["EPC/Suppliers"],
    "investor": ["Investor"],
    "ppa_usd_kwh": ["PPA, USD/ kWh", "PPA, USD/kWh"],
    "total_investment_cost": ["Total Investment Cost"],
    "notes": ["Notes"],
    "location_x": ["Location X"],
    "location_y": ["Location Y"],
    "website_information": ["Website/ information", "Website/Information"],
    "date_created": ["Date Created"],
    "date_edited": ["Date Edited"],
    "edited_description": ["Edited Description"],
    "research_status": ["Research Status (Done/ need info)", "Research Status"],
}


def clean_column_name(name: str) -> str:
    text = str(name).replace("\n", " ").replace("\r", " ").replace("\xa0", " ")
    text = " ".join(text.split())
    return text.strip()


def clean_value(value):
    if pd.isna(value):
        return None
    if isinstance(value, pd.Timestamp):
        return value.strftime("%Y-%m-%d")
    if isinstance(value, str):
        value = value.strip()
        return value if value != "" else None
    return value


def resolve_mapping(df_columns: list[str]) -> dict[str, str]:
    mapping = {}

    for target, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in df_columns:
                mapping[alias] = target
                break

    return mapping


def normalize_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [clean_column_name(col) for col in df.columns]

    print("Cleaned columns found:")
    for i, col in enumerate(df.columns, start=1):
        print(f" {i:02d}. {col}")

    drop_candidates = [col for col in df.columns if str(col).startswith("Unnamed:")]
    if "#" in df.columns:
        drop_candidates.append("#")

    drop_candidates = list(dict.fromkeys(drop_candidates))
    if drop_candidates:
        df = df.drop(columns=drop_candidates, errors="ignore")

    resolved = resolve_mapping(list(df.columns))

    if not resolved:
        raise ValueError(
            "No matching project columns found. Check sheet name/header row and column names."
        )

    print("Resolved column mapping:")
    for source, target in resolved.items():
        print(f" - {source} -> {target}")

    df = df[list(resolved.keys())].rename(columns=resolved)
    df = df.apply(lambda col: col.map(clean_value))

    if "project_id" not in df.columns:
        raise ValueError("Required column 'project_id' was not found in the Excel sheet.")

    if "project_name" not in df.columns:
        raise ValueError("Could not map a source column to 'project_name'.")

    if "installed_capacity_mw" not in df.columns:
        raise ValueError("Could not map a source column to 'installed_capacity_mw'.")

    if df["project_id"].isnull().any():
        missing_count = int(df["project_id"].isnull().sum())
        raise ValueError(
            f"Found {missing_count} rows with missing project_id. Every project must have a stable project_id."
        )

    duplicate_ids = df["project_id"][df["project_id"].duplicated()].unique().tolist()
    if duplicate_ids:
        raise ValueError(
            f"Duplicate project_id values found: {duplicate_ids[:10]}"
        )

    return df


def main() -> None:
    if not EXCEL_FILE.exists():
        raise FileNotFoundError(f"Excel file not found: {EXCEL_FILE}")

    if not DB_FILE.exists():
        raise FileNotFoundError(f"Database file not found: {DB_FILE}")

    print(f"Reading Excel file: {EXCEL_FILE} | sheet: {SHEET_NAME}")
    df = pd.read_excel(EXCEL_FILE, sheet_name=SHEET_NAME, header=0)

    df = normalize_dataframe(df)

    conn = sqlite3.connect(DB_FILE)
    try:
        table_info = conn.execute("PRAGMA table_info(projects)").fetchall()
        table_columns = [row[1] for row in table_info]

        print("Projects table columns in database:")
        for col in table_columns:
            print(f" - {col}")

        missing_in_db = [col for col in df.columns if col not in table_columns]
        if missing_in_db:
            raise ValueError(
                f"The following columns exist in Excel but not in the projects table: {missing_in_db}"
            )

        conn.execute("DELETE FROM projects")
        df.to_sql("projects", conn, if_exists="append", index=False)
        conn.commit()

        check = conn.execute("""
            SELECT
              COUNT(*) as total_rows,
              SUM(CASE WHEN project_name IS NULL OR TRIM(project_name) = '' THEN 1 ELSE 0 END) as missing_names,
              SUM(CASE WHEN installed_capacity_mw IS NULL THEN 1 ELSE 0 END) as missing_capacity
            FROM projects
        """).fetchone()

        print("")
        print("Post-import checks:")
        print(f" - total rows: {check[0]}")
        print(f" - missing project_name: {check[1]}")
        print(f" - missing installed_capacity_mw: {check[2]}")

    finally:
        conn.close()

    print(f"Imported {len(df)} project rows into {DB_FILE}")


if __name__ == "__main__":
    main()