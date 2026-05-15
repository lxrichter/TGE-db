from pathlib import Path
import sqlite3
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
DB_FILE = BASE_DIR / "web" / "data" / "tge.db"
EXCEL_FILE = BASE_DIR / "source-data" / "geothermal_plants.xlsx"
SHEET_NAME = "plants"

COLUMN_MAPPING = {
    "plant_id": "plant_id",
    "Plant/ Project Name": "plant_name",
    "Project Group": "project_group",
    "Other Name": "other_name",
    "Owner/Operator": "owner_operator",
    "Developer": "developer",
    "Location (County/City, Province)": "location_text",
    "Country": "country",
    "Region": "region",
    "WB Region": "wb_region",
    "Potential min (MW)": "potential_min_mw",
    "Potential max (MW)": "potential_max_mw",
    "Installed Capacity": "installed_capacity_mw",
    "Capacity Running": "capacity_running_mw",
    "Gross Production (GWh)": "gross_production_gwh",
    "Start of Dev. (year)": "start_dev_year",
    "COD": "cod",
    "Resource Type": "resource_type",
    "Resource Temp. (°C)": "resource_temp_c",
    "Project Phase": "project_phase",
    "T: Phase (historical)": "phase_historical",
    "Field Name": "field_name",
    "#Wells Total": "wells_total",
    "# Wells Prod. Active": "wells_prod_active",
    "#Wells Reinj Active": "wells_reinj_active",
    "#Wells inactive/ standby": "wells_inactive_standby",
    "#Wells Other/ Explor.": "wells_other_exploration",
    "Well Depth Prod. (m)": "well_depth_prod_m",
    "Temp. Prod. Well (°C)": "temp_prod_well_c",
    "Flow rate (l/s)": "flow_rate_ls",
    "Number of Unit": "number_of_unit",
    "Plant Technology": "plant_technology",
    "Turbine Supplier": "turbine_supplier",
    "EPC/Suppliers": "epc_suppliers",
    "Investor": "investor",
    "PPA, USD/ kWh": "ppa_usd_kwh",
    "Total Investment Cost": "total_investment_cost",
    "Notes": "notes",
    "Location X": "location_x",
    "Location Y": "location_y",
    "Website/ information": "website_information",
    "Date Created": "date_created",
    "Date Edited": "date_edited",
    "Edited Description": "edited_description",
    "Research Status (Done/ need info)": "research_status",
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


def normalize_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [clean_column_name(col) for col in df.columns]

    print("Cleaned columns found:")
    for col in df.columns:
        print(f" - {col}")

    drop_candidates = [col for col in df.columns if str(col).startswith("Unnamed:")]
    if "#" in df.columns:
        drop_candidates.append("#")

    drop_candidates = list(dict.fromkeys(drop_candidates))
    if drop_candidates:
        df = df.drop(columns=drop_candidates, errors="ignore")

    available_mapping = {
        source: target
        for source, target in COLUMN_MAPPING.items()
        if source in df.columns
    }

    if not available_mapping:
        raise ValueError(
            "No matching plant columns found. Check sheet name/header row and column names."
        )

    df = df[list(available_mapping.keys())].rename(columns=available_mapping)
    df = df.apply(lambda col: col.map(clean_value))

    if "plant_id" not in df.columns:
        raise ValueError(
            "Required column 'Plant ID' was not found in the Excel sheet."
        )

    if df["plant_id"].isnull().any():
        missing_count = int(df["plant_id"].isnull().sum())
        raise ValueError(
            f"Found {missing_count} rows with missing plant_id. Every plant must have a stable Plant ID."
        )

    duplicate_ids = df["plant_id"][df["plant_id"].duplicated()].unique().tolist()
    if duplicate_ids:
        raise ValueError(
            f"Duplicate plant_id values found: {duplicate_ids[:10]}"
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
        table_info = conn.execute("PRAGMA table_info(plants)").fetchall()
        table_columns = [row[1] for row in table_info]

        print("Plants table columns in database:")
        for col in table_columns:
            print(f" - {col}")

        missing_in_db = [col for col in df.columns if col not in table_columns]
        if missing_in_db:
            raise ValueError(
                f"The following columns exist in Excel but not in the plants table: {missing_in_db}"
            )

        conn.execute("DELETE FROM plants")
        df.to_sql("plants", conn, if_exists="append", index=False)
        conn.commit()
    finally:
        conn.close()

    print(f"Imported {len(df)} plant rows into {DB_FILE}")


if __name__ == "__main__":
    main()