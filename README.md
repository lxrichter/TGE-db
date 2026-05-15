# TGE Database Platform

Internal ThinkGeoEnergy geothermal intelligence database platform.

## Scope

This repository contains the application code for the current Next.js + SQLite prototype, including:

- geothermal projects, plants, companies, and related company links
- authenticated editorial and admin workflows
- map, market, analysis, and export views
- SQLite schema and import/maintenance scripts

Local databases, database backups, source Excel imports, and generated build output are intentionally excluded from Git.

## Local Development

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

The app runs at `http://localhost:3000`.

By default, local development expects SQLite data at `../shared/data/tge.db`. Set `DB_PATH` in `web/.env.local` to override this path.
