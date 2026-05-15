import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

function getDbPath() {
  const envPath = process.env.DB_PATH;

  if (envPath && envPath.trim() !== "") {
    // If absolute path → use directly
    if (path.isAbsolute(envPath)) {
      return envPath;
    }
    // If relative → resolve from current working directory
    return path.resolve(process.cwd(), envPath);
  }

  // Fallback for local development
  return path.resolve(process.cwd(), "../shared/data/tge.db");
}

export async function getDb() {
  const dbPath = getDbPath();

  console.log("[DB] Using database at:", dbPath);

  return open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
}