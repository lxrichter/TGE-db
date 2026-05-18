import pg from "pg";

const { Pool } = pg;

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_PUBLIC_URL or DATABASE_URL is not configured.");
  }

  return databaseUrl;
}

function getSslConfig(databaseUrl) {
  const sslMode = process.env.DATABASE_SSL || process.env.PGSSLMODE;

  if (sslMode === "false" || sslMode === "disable") {
    return false;
  }

  if (sslMode === "true" || sslMode === "require") {
    return { rejectUnauthorized: false };
  }

  if (databaseUrl.includes("railway.internal") || databaseUrl.includes("rlwy.net")) {
    return { rejectUnauthorized: false };
  }

  return false;
}

const databaseUrl = getDatabaseUrl();
const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
  ssl: getSslConfig(databaseUrl),
});

try {
  const identity = await pool.query(`
    SELECT
      current_database() AS database_name,
      current_user AS user_name,
      version() AS version
  `);

  const tableCount = await pool.query(`
    SELECT COUNT(*)::int AS count
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
  `);

  const refs = await pool.query(`
    SELECT 'ref_geothermal_use_types' AS table_name, COUNT(*)::int AS row_count
    FROM ref_geothermal_use_types
    UNION ALL
    SELECT 'ref_direct_use_categories', COUNT(*)::int
    FROM ref_direct_use_categories
    UNION ALL
    SELECT 'ref_company_roles', COUNT(*)::int
    FROM ref_company_roles
    ORDER BY table_name
  `);

  const coreEntities = await pool.query(`
    SELECT 'projects' AS table_name, COUNT(*)::int AS row_count
    FROM projects
    UNION ALL
    SELECT 'operating_assets', COUNT(*)::int
    FROM operating_assets
    UNION ALL
    SELECT 'companies', COUNT(*)::int
    FROM companies
    UNION ALL
    SELECT 'asset_use_components', COUNT(*)::int
    FROM asset_use_components
    UNION ALL
    SELECT 'company_project_links', COUNT(*)::int
    FROM company_project_links
    UNION ALL
    SELECT 'company_operating_asset_links', COUNT(*)::int
    FROM company_operating_asset_links
    UNION ALL
    SELECT 'sources', COUNT(*)::int
    FROM sources
    UNION ALL
    SELECT 'entity_sources', COUNT(*)::int
    FROM entity_sources
    ORDER BY table_name
  `);

  console.log("PostgreSQL connection ok");
  console.log(`Database: ${identity.rows[0].database_name}`);
  console.log(`User: ${identity.rows[0].user_name}`);
  console.log(`Public tables: ${tableCount.rows[0].count}`);
  console.log("Reference table counts:");
  for (const row of refs.rows) {
    console.log(`- ${row.table_name}: ${row.row_count}`);
  }
  console.log("Core entity counts:");
  for (const row of coreEntities.rows) {
    console.log(`- ${row.table_name}: ${row.row_count}`);
  }
} finally {
  await pool.end();
}
