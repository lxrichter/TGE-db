from pathlib import Path
import sqlite3

project_root = Path(__file__).resolve().parent.parent
db_path = project_root / "web" / "data" / "tge.db"
schema_path = project_root / "web" / "data" / "schema.sql"

db_path.parent.mkdir(parents=True, exist_ok=True)

with open(schema_path, "r", encoding="utf-8") as f:
    schema_sql = f.read()

conn = sqlite3.connect(db_path)
conn.executescript(schema_sql)
conn.commit()
conn.close()

print(f"Database created at: {db_path}")