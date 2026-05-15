import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizePhase(value: unknown) {
  const raw = String(value ?? "").trim().toLowerCase();

  if (!raw) return "tbd";
  if (raw.includes("explor")) return "exploration";
  if (raw.includes("feas")) return "feasibility";
  if (raw.includes("construct")) return "construction";
  return "other";
}

export async function GET() {
  const db = await getDb();

  const plants = await db.all(`
    SELECT
      country,
      region,
      installed_capacity_mw
    FROM plants
  `);

  const projects = await db.all(`
    SELECT
      country,
      region,
      installed_capacity_mw,
      project_phase
    FROM projects
  `);

  const countryMap = new Map<
    string,
    {
      country: string;
      region: string;
      installed_mw: number;
      planned_mw: number;
      plant_count: number;
      project_count: number;
      exploration_mw: number;
      feasibility_mw: number;
      construction_mw: number;
      other_mw: number;
    }
  >();

  const regionMap = new Map<
    string,
    {
      region: string;
      installed_mw: number;
      plant_count: number;
      countries: Set<string>;
    }
  >();

  plants.forEach((row: any) => {
    const country = String(row.country ?? "").trim() || "NA";
    const region = String(row.region ?? "").trim() || "NA";
    const installed = toNumber(row.installed_capacity_mw);

    if (!countryMap.has(country)) {
      countryMap.set(country, {
        country,
        region,
        installed_mw: 0,
        planned_mw: 0,
        plant_count: 0,
        project_count: 0,
        exploration_mw: 0,
        feasibility_mw: 0,
        construction_mw: 0,
        other_mw: 0,
      });
    }

    const countryEntry = countryMap.get(country)!;
    countryEntry.installed_mw += installed;
    countryEntry.plant_count += 1;
    if (!countryEntry.region || countryEntry.region === "NA") {
      countryEntry.region = region;
    }

    if (!regionMap.has(region)) {
      regionMap.set(region, {
        region,
        installed_mw: 0,
        plant_count: 0,
        countries: new Set<string>(),
      });
    }

    const regionEntry = regionMap.get(region)!;
    regionEntry.installed_mw += installed;
    regionEntry.plant_count += 1;
    regionEntry.countries.add(country);
  });

  projects.forEach((row: any) => {
    const country = String(row.country ?? "").trim() || "NA";
    const region = String(row.region ?? "").trim() || "NA";
    const planned = toNumber(row.installed_capacity_mw);
    const phase = normalizePhase(row.project_phase);

    if (!countryMap.has(country)) {
      countryMap.set(country, {
        country,
        region,
        installed_mw: 0,
        planned_mw: 0,
        plant_count: 0,
        project_count: 0,
        exploration_mw: 0,
        feasibility_mw: 0,
        construction_mw: 0,
        other_mw: 0,
      });
    }

    const countryEntry = countryMap.get(country)!;
    countryEntry.planned_mw += planned;
    countryEntry.project_count += 1;
    if (!countryEntry.region || countryEntry.region === "NA") {
      countryEntry.region = region;
    }

    if (phase === "exploration") countryEntry.exploration_mw += planned;
    else if (phase === "feasibility") countryEntry.feasibility_mw += planned;
    else if (phase === "construction") countryEntry.construction_mw += planned;
    else countryEntry.other_mw += planned;
  });

  const countrySummary = Array.from(countryMap.values())
    .map((row) => ({
      ...row,
      installed_mw: Number(row.installed_mw.toFixed(1)),
      planned_mw: Number(row.planned_mw.toFixed(1)),
      exploration_mw: Number(row.exploration_mw.toFixed(1)),
      feasibility_mw: Number(row.feasibility_mw.toFixed(1)),
      construction_mw: Number(row.construction_mw.toFixed(1)),
      other_mw: Number(row.other_mw.toFixed(1)),
    }))
    .sort((a, b) => b.installed_mw - a.installed_mw);

  const regionSummary = Array.from(regionMap.values())
    .map((row) => ({
      region: row.region,
      installed_mw: Number(row.installed_mw.toFixed(1)),
      plant_count: row.plant_count,
      country_count: row.countries.size,
    }))
    .sort((a, b) => b.installed_mw - a.installed_mw);

  const projectPhaseByCountry = countrySummary
    .map((row) => ({
      country: row.country,
      region: row.region,
      exploration_mw: row.exploration_mw,
      feasibility_mw: row.feasibility_mw,
      construction_mw: row.construction_mw,
      other_mw: row.other_mw,
      total_planned_mw: Number(
        (
          row.exploration_mw +
          row.feasibility_mw +
          row.construction_mw +
          row.other_mw
        ).toFixed(1)
      ),
    }))
    .sort((a, b) => b.total_planned_mw - a.total_planned_mw);

  return NextResponse.json({
    countrySummary,
    regionSummary,
    projectPhaseByCountry,
  });
}