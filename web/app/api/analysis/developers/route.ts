import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/auth";
import {
  DEVELOPER_ANALYSIS_ATTRIBUTION_RULE,
  DEVELOPER_ANALYSIS_ROLE_LABELS,
  isDeveloperAnalysisRole,
} from "@/lib/analysis/developer-attribution";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DeveloperLinkRow = {
  company_id: string;
  company_name: string | null;
  project_id: string;
  project_name: string | null;
  country: string | null;
  region: string | null;
  project_phase: string | null;
  role: string | null;
  is_primary: number | null;
  ownership_share: number | null;
  project_mw: number | null;
};

type ProjectGroup = {
  project_id: string;
  project_name: string;
  country: string | null;
  region: string | null;
  phase: string | null;
  project_mw: number | null;
  links: DeveloperLinkRow[];
};

type DeveloperAccumulator = {
  company_id: string;
  company_name: string;
  projectIds: Set<string>;
  countries: Set<string>;
  roles: Set<string>;
  attributed_mw: number;
  full_project_mw: number;
  weighted_project_count: number;
  equal_split_project_count: number;
  primary_link_count: number;
};

type SegmentAccumulator = {
  label: string;
  projectIds: Set<string>;
  developerIds: Set<string>;
  attributed_mw: number;
};

type RoleAccumulator = {
  role: string;
  link_count: number;
  projectIds: Set<string>;
  companyIds: Set<string>;
};

type ProjectQaRow = {
  project_id: string;
  project_name: string;
  country: string | null;
  phase: string | null;
  project_mw: number | null;
  developer_count: number;
  developer_names: string[];
  roles: string[];
};

function toNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();

    const links = (await db.all(`
      SELECT
        cpl.company_id,
        c.company_name,
        cpl.project_id,
        p.project_name,
        p.country,
        p.region,
        p.project_phase,
        cpl.role,
        cpl.is_primary,
        cpl.ownership_share,
        COALESCE(
          p.installed_capacity_mw,
          p.potential_max_mw,
          p.potential_min_mw
        ) AS project_mw
      FROM company_project_links cpl
      INNER JOIN projects p
        ON p.project_id = cpl.project_id
      INNER JOIN companies c
        ON c.company_id = cpl.company_id
    `)) as DeveloperLinkRow[];

    const developerLinks = links.filter((row) => isDeveloperAnalysisRole(row.role));

    const excludedLinks = links.filter(
      (row) => !isDeveloperAnalysisRole(row.role)
    );
    const excludedRoleCount = excludedLinks.length;
    const excludedRoles = new Map<string, RoleAccumulator>();

    for (const link of excludedLinks) {
      const role = link.role?.trim() || "Unspecified";
      const row =
        excludedRoles.get(role) ||
        ({
          role,
          link_count: 0,
          projectIds: new Set<string>(),
          companyIds: new Set<string>(),
        } satisfies RoleAccumulator);

      row.link_count += 1;
      row.projectIds.add(link.project_id);
      row.companyIds.add(link.company_id);
      excludedRoles.set(role, row);
    }

    const projects = new Map<string, ProjectGroup>();

    for (const link of developerLinks) {
      const projectName = link.project_name || link.project_id;
      const group =
        projects.get(link.project_id) ||
        ({
          project_id: link.project_id,
          project_name: projectName,
          country: link.country,
          region: link.region,
          phase: link.project_phase,
          project_mw: toNumber(link.project_mw),
          links: [],
        } satisfies ProjectGroup);

      group.links.push(link);
      projects.set(link.project_id, group);
    }

    const developers = new Map<string, DeveloperAccumulator>();
    const countrySegments = new Map<string, SegmentAccumulator>();
    const phaseSegments = new Map<string, SegmentAccumulator>();
    let weightedProjectCount = 0;
    let equalSplitProjectCount = 0;
    let projectsMissingMw = 0;
    let weightedLinkCount = 0;
    let equalSplitLinkCount = 0;
    let singleDeveloperProjectCount = 0;
    let multiDeveloperWeightedProjectCount = 0;
    let multiDeveloperEqualSplitProjectCount = 0;
    const missingMwProjects: ProjectQaRow[] = [];
    const equalSplitProjects: ProjectQaRow[] = [];

    const qaRowForProject = (project: ProjectGroup): ProjectQaRow => ({
      project_id: project.project_id,
      project_name: project.project_name,
      country: project.country,
      phase: project.phase,
      project_mw: toNumber(project.project_mw),
      developer_count: project.links.length,
      developer_names: project.links
        .map((link) => link.company_name || link.company_id)
        .sort(),
      roles: Array.from(
        new Set(project.links.map((link) => link.role || "Unspecified"))
      ).sort(),
    });

    for (const project of projects.values()) {
      const projectMw = toNumber(project.project_mw);

      if (projectMw === null || projectMw <= 0) {
        projectsMissingMw += 1;
        missingMwProjects.push(qaRowForProject(project));
        continue;
      }

      const weights = project.links.map((link) => toNumber(link.ownership_share));
      const positiveWeights = weights.filter(
        (weight): weight is number => weight !== null && weight > 0
      );
      const useWeightedSplit =
        project.links.length > 1 &&
        positiveWeights.length === project.links.length &&
        positiveWeights.reduce((sum, weight) => sum + weight, 0) > 0;

      const weightTotal = positiveWeights.reduce((sum, weight) => sum + weight, 0);
      const equalShare = 1 / project.links.length;

      if (useWeightedSplit) {
        weightedProjectCount += 1;
        multiDeveloperWeightedProjectCount += 1;
      } else {
        equalSplitProjectCount += 1;
        if (project.links.length > 1) {
          multiDeveloperEqualSplitProjectCount += 1;
          equalSplitProjects.push(qaRowForProject(project));
        } else {
          singleDeveloperProjectCount += 1;
        }
      }

      for (const [index, link] of project.links.entries()) {
        const companyId = link.company_id;
        const companyName = link.company_name || link.company_id;
        const developer =
          developers.get(companyId) ||
          ({
            company_id: companyId,
            company_name: companyName,
            projectIds: new Set<string>(),
            countries: new Set<string>(),
            roles: new Set<string>(),
            attributed_mw: 0,
            full_project_mw: 0,
            weighted_project_count: 0,
            equal_split_project_count: 0,
            primary_link_count: 0,
          } satisfies DeveloperAccumulator);

        const share = useWeightedSplit
          ? Number(weights[index] ?? 0) / weightTotal
          : equalShare;
        const attributedMw = projectMw * share;

        developer.projectIds.add(project.project_id);
        if (project.country) {
          developer.countries.add(project.country);
        }
        if (link.role) {
          developer.roles.add(link.role);
        }
        developer.attributed_mw += attributedMw;
        developer.full_project_mw += projectMw;
        developer.primary_link_count += Number(link.is_primary || 0) ? 1 : 0;

        if (useWeightedSplit) {
          developer.weighted_project_count += 1;
          weightedLinkCount += 1;
        } else {
          developer.equal_split_project_count += 1;
          equalSplitLinkCount += 1;
        }

        developers.set(companyId, developer);

        const countryLabel = project.country || "Unknown";
        const countrySegment =
          countrySegments.get(countryLabel) ||
          ({
            label: countryLabel,
            projectIds: new Set<string>(),
            developerIds: new Set<string>(),
            attributed_mw: 0,
          } satisfies SegmentAccumulator);
        countrySegment.projectIds.add(project.project_id);
        countrySegment.developerIds.add(companyId);
        countrySegment.attributed_mw += attributedMw;
        countrySegments.set(countryLabel, countrySegment);

        const phaseLabel = project.phase || "Unknown";
        const phaseSegment =
          phaseSegments.get(phaseLabel) ||
          ({
            label: phaseLabel,
            projectIds: new Set<string>(),
            developerIds: new Set<string>(),
            attributed_mw: 0,
          } satisfies SegmentAccumulator);
        phaseSegment.projectIds.add(project.project_id);
        phaseSegment.developerIds.add(companyId);
        phaseSegment.attributed_mw += attributedMw;
        phaseSegments.set(phaseLabel, phaseSegment);
      }
    }

    const rows = Array.from(developers.values())
      .map((developer) => ({
        company_id: developer.company_id,
        company_name: developer.company_name,
        project_count: developer.projectIds.size,
        country_count: developer.countries.size,
        roles: Array.from(developer.roles).sort(),
        attributed_mw: round(developer.attributed_mw),
        full_project_mw: round(developer.full_project_mw),
        weighted_project_count: developer.weighted_project_count,
        equal_split_project_count: developer.equal_split_project_count,
        primary_link_count: developer.primary_link_count,
      }))
      .filter((row) => row.attributed_mw > 0)
      .sort((a, b) => {
        if (b.attributed_mw !== a.attributed_mw) {
          return b.attributed_mw - a.attributed_mw;
        }

        return a.company_name.localeCompare(b.company_name);
      })
      .map((row, index) => ({
        rank: index + 1,
        ...row,
      }));

    const segmentRows = (segments: Map<string, SegmentAccumulator>) =>
      Array.from(segments.values())
        .map((segment) => ({
          label: segment.label,
          project_count: segment.projectIds.size,
          developer_count: segment.developerIds.size,
          attributed_mw: round(segment.attributed_mw),
        }))
        .filter((segment) => segment.attributed_mw > 0)
        .sort((a, b) => {
          if (b.attributed_mw !== a.attributed_mw) {
            return b.attributed_mw - a.attributed_mw;
          }

          return a.label.localeCompare(b.label);
        });
    const excludedRoleRows = Array.from(excludedRoles.values())
      .map((role) => ({
        role: role.role,
        link_count: role.link_count,
        project_count: role.projectIds.size,
        company_count: role.companyIds.size,
      }))
      .sort((a, b) => {
        if (b.link_count !== a.link_count) {
          return b.link_count - a.link_count;
        }

        return a.role.localeCompare(b.role);
      });

    const projectQaRows = (rowsToSort: ProjectQaRow[]) =>
      rowsToSort.sort((a, b) => {
        const aMw = toNumber(a.project_mw) || 0;
        const bMw = toNumber(b.project_mw) || 0;

        if (bMw !== aMw) {
          return bMw - aMw;
        }

        return a.project_name.localeCompare(b.project_name);
      });

    return NextResponse.json({
      summary: {
        roles_counted: DEVELOPER_ANALYSIS_ROLE_LABELS,
        attribution_rule: DEVELOPER_ANALYSIS_ATTRIBUTION_RULE,
        developer_link_count: developerLinks.length,
        excluded_non_developer_role_count: excludedRoleCount,
        linked_project_count: projects.size,
        included_project_count:
          weightedProjectCount + equalSplitProjectCount,
        projects_missing_mw: projectsMissingMw,
        weighted_project_count: weightedProjectCount,
        equal_split_project_count: equalSplitProjectCount,
        single_developer_project_count: singleDeveloperProjectCount,
        multi_developer_weighted_project_count: multiDeveloperWeightedProjectCount,
        multi_developer_equal_split_project_count:
          multiDeveloperEqualSplitProjectCount,
        weighted_link_count: weightedLinkCount,
        equal_split_link_count: equalSplitLinkCount,
      },
      rows,
      countryRows: segmentRows(countrySegments),
      phaseRows: segmentRows(phaseSegments),
      qa: {
        excludedRoleRows,
        equalSplitProjects: projectQaRows(equalSplitProjects).slice(0, 25),
        missingMwProjects: projectQaRows(missingMwProjects).slice(0, 25),
      },
    });
  } catch (error) {
    console.error("Error in /api/analysis/developers:", error);
    return NextResponse.json(
      { error: "Failed to load developer analysis." },
      { status: 500 }
    );
  }
}
