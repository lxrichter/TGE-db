import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const TECHNOLOGY_ORDER = [
  "Back Pressure",
  "B-Kalina",
  "B-ORC",
  "Single Flash",
  "Double Flash",
  "Triple Flash",
  "Dry Steam",
  "tbd",
] as const;

type TechnologyName = (typeof TECHNOLOGY_ORDER)[number];

type SupplierByCountryRow = {
  country: string;
  turbine_supplier: string;
  installed_capacity_mw: number;
};

function normalizeTechnology(value: unknown): TechnologyName {
  const raw = String(value ?? "").trim();

  if (!raw) return "tbd";

  const lower = raw.toLowerCase();

  if (lower === "backpressure" || lower === "back pressure") {
    return "Back Pressure";
  }
  if (lower === "b-kalina" || lower === "binary kalina" || lower === "kalina") {
    return "B-Kalina";
  }
  if (lower === "b-orc" || lower === "binary orc" || lower === "orc") {
    return "B-ORC";
  }
  if (lower === "single flash") return "Single Flash";
  if (lower === "double flash") return "Double Flash";
  if (lower === "triple flash") return "Triple Flash";
  if (lower === "dry steam") return "Dry Steam";

  return "tbd";
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function GET() {
  const db = await getDb();

  const rows = await db.all(`
    SELECT
      country,
      plant_technology,
      turbine_supplier,
      installed_capacity_mw,
      capacity_running_mw,
      number_of_unit
    FROM plants
  `);

  const totalInstalled = rows.reduce(
    (sum: number, row: any) => sum + toNumber(row.installed_capacity_mw),
    0
  );

  const technologyMap = new Map<
    TechnologyName,
    {
      technology: TechnologyName;
      installed_mw: number;
      operating_mw: number;
      units: number;
    }
  >();

  TECHNOLOGY_ORDER.forEach((tech) => {
    technologyMap.set(tech, {
      technology: tech,
      installed_mw: 0,
      operating_mw: 0,
      units: 0,
    });
  });

  const supplierMap = new Map<
    string,
    {
      turbine_supplier: string;
      installed_capacity_mw: number;
      units: number;
    }
  >();

  const countryMap = new Map<string, Record<TechnologyName, number>>();

  rows.forEach((row: any) => {
    const technology = normalizeTechnology(row.plant_technology);
    const installed = toNumber(row.installed_capacity_mw);
    const operating = toNumber(row.capacity_running_mw);
    const units = toNumber(row.number_of_unit);
    const supplier = String(row.turbine_supplier ?? "").trim() || "NA";
    const country = String(row.country ?? "").trim() || "NA";

    const techEntry = technologyMap.get(technology)!;
    techEntry.installed_mw += installed;
    techEntry.operating_mw += operating;
    techEntry.units += units;

    if (!supplierMap.has(supplier)) {
      supplierMap.set(supplier, {
        turbine_supplier: supplier,
        installed_capacity_mw: 0,
        units: 0,
      });
    }

    const supplierEntry = supplierMap.get(supplier)!;
    supplierEntry.installed_capacity_mw += installed;
    supplierEntry.units += units;

    if (!countryMap.has(country)) {
      countryMap.set(country, {
        "Back Pressure": 0,
        "B-Kalina": 0,
        "B-ORC": 0,
        "Single Flash": 0,
        "Double Flash": 0,
        "Triple Flash": 0,
        "Dry Steam": 0,
        tbd: 0,
      });
    }

    countryMap.get(country)![technology] += installed;
  });

  const technologySummary = TECHNOLOGY_ORDER.map((tech) => {
    const entry = technologyMap.get(tech)!;
    const avgSizeInstalledMw =
      entry.units > 0 ? entry.installed_mw / entry.units : 0;
    const shareInstalledPct =
      totalInstalled > 0 ? (entry.installed_mw / totalInstalled) * 100 : 0;

    return {
      technology: entry.technology,
      installed_mw: Number(entry.installed_mw.toFixed(1)),
      operating_mw: Number(entry.operating_mw.toFixed(1)),
      units: Number(entry.units.toFixed(0)),
      avg_size_installed_mw: Number(avgSizeInstalledMw.toFixed(1)),
      share_installed_pct: Number(shareInstalledPct.toFixed(1)),
    };
  });

  const supplierSummary = Array.from(supplierMap.values())
    .map((entry) => ({
      turbine_supplier: entry.turbine_supplier,
      installed_capacity_mw: Number(entry.installed_capacity_mw.toFixed(1)),
      units: Number(entry.units.toFixed(0)),
      avg_size_turbine_mw:
        entry.units > 0
          ? Number((entry.installed_capacity_mw / entry.units).toFixed(2))
          : 0,
    }))
    .sort((a, b) => b.installed_capacity_mw - a.installed_capacity_mw);

  const technologyByCountryMw = Array.from(countryMap.entries())
    .map(([country, techs]) => ({
      country,
      ...Object.fromEntries(
        TECHNOLOGY_ORDER.map((tech) => [tech, Number(techs[tech].toFixed(1))])
      ),
      total_mw: Number(
        TECHNOLOGY_ORDER.reduce((sum, tech) => sum + techs[tech], 0).toFixed(1)
      ),
    }))
    .sort((a, b) => b.total_mw - a.total_mw);

  const technologyByCountryPct = Array.from(countryMap.entries())
    .map(([country, techs]) => {
      const total = TECHNOLOGY_ORDER.reduce((sum, tech) => sum + techs[tech], 0);

      return {
        country,
        ...Object.fromEntries(
          TECHNOLOGY_ORDER.map((tech) => [
            tech,
            total > 0 ? Number(((techs[tech] / total) * 100).toFixed(1)) : 0,
          ])
        ),
        total_mw: Number(total.toFixed(1)),
      };
    })
    .sort((a, b) => b.total_mw - a.total_mw);

  const supplierByCountryMw = (await db.all(`
    SELECT
      country,
      COALESCE(NULLIF(TRIM(turbine_supplier), ''), 'NA') AS turbine_supplier,
      SUM(COALESCE(installed_capacity_mw, 0)) AS installed_capacity_mw
    FROM plants
    WHERE country IS NOT NULL
      AND TRIM(country) != ''
    GROUP BY
      country,
      COALESCE(NULLIF(TRIM(turbine_supplier), ''), 'NA')
    ORDER BY
      country ASC,
      installed_capacity_mw DESC
  `)) as SupplierByCountryRow[];

  return NextResponse.json({
    technologyOrder: TECHNOLOGY_ORDER,
    technologySummary,
    supplierSummary,
    supplierByCountryMw,
    technologyByCountryMw,
    technologyByCountryPct,
  });
}