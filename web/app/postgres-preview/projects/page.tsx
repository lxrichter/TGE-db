import {
  parsePreviewListPage,
  parsePreviewListPageSize,
  parsePreviewTableDensity,
  PostgresPreviewListFilters,
  previewQueryHref,
  previewFilterOptions,
  PostgresPreviewQuickViews,
  ProjectsPreviewTable,
  PostgresPreviewListHeader,
  PostgresPreviewSetupNotice,
  type PreviewFilterOption,
  type PreviewQuickView,
  type PreviewTableDensity,
} from "@/components/postgres-preview/PostgresPreviewListTables";
import {
  countPostgresPreviewProjects,
  getPostgresPreviewProjectListFacets,
  listPostgresPreviewProjects,
  type PostgresPreviewListFacets,
  type PostgresPreviewProject,
  type PostgresPreviewProjectListFilters,
} from "@/lib/postgres-preview";

export const dynamic = "force-dynamic";

type PreviewListSearchParams = {
  page?: string;
  pageSize?: string;
  density?: string;
  search?: string;
  country?: string;
  review?: string;
  use?: string;
  status?: string;
  missing?: string;
};

type ProjectsListData =
  | {
      ok: true;
      projects: PostgresPreviewProject[];
      total: number;
      filters: PostgresPreviewProjectListFilters;
      facets: PostgresPreviewListFacets;
      page: number;
      pageSize: number;
      density: PreviewTableDensity;
    }
  | {
      ok: false;
      error: string;
    };

const projectMissingOptions: PreviewFilterOption[] = [
  { value: "country", label: "Missing Country" },
  { value: "coordinates", label: "Missing Coordinates" },
  { value: "capacity", label: "Missing Capacity / Output" },
  { value: "use_type", label: "Missing Use Type" },
  { value: "status", label: "Missing Lifecycle / Status" },
  { value: "source", label: "Missing Source" },
  { value: "company_link", label: "Missing Company Link" },
  { value: "research_issue", label: "Open Research Ops Issues" },
];

const projectQuickViews: PreviewQuickView[] = [
  {
    label: "All Projects",
    description: "Full project staging list.",
    query: {},
  },
  {
    label: "Needs Review",
    description: "Projects currently in validation review.",
    query: { review: "validation" },
  },
  {
    label: "Missing Source",
    description: "Records without confirmed evidence links.",
    query: { missing: "source" },
  },
  {
    label: "Missing Coordinates",
    description: "Projects not ready for coordinate-confirmed maps.",
    query: { missing: "coordinates" },
  },
  {
    label: "Missing Company Link",
    description: "Projects without structured company relationships.",
    query: { missing: "company_link" },
  },
  {
    label: "Open Issues",
    description: "Projects with persistent Research Ops follow-ups.",
    query: { missing: "research_issue" },
  },
  {
    label: "Direct-Use",
    description: "Direct-use project pipeline records.",
    query: { use: "direct_use" },
  },
  {
    label: "Needs Update",
    description: "Previously reviewed records requiring re-check.",
    query: { review: "needs_update" },
  },
];

function cleanParam(value: string | undefined) {
  return value?.trim() || undefined;
}

function getProjectFilters(
  params: PreviewListSearchParams
): PostgresPreviewProjectListFilters {
  return {
    search: cleanParam(params.search),
    country: cleanParam(params.country),
    reviewStatus: cleanParam(params.review),
    useType: cleanParam(params.use),
    status: cleanParam(params.status),
    missing: cleanParam(params.missing),
  };
}

async function getProjectsListData(
  params: PreviewListSearchParams
): Promise<ProjectsListData> {
  const page = parsePreviewListPage(params.page);
  const pageSize = parsePreviewListPageSize(params.pageSize);
  const density = parsePreviewTableDensity(params.density);
  const filters = getProjectFilters(params);
  const offset = (page - 1) * pageSize;

  try {
    const [projects, filteredCount, facets] = await Promise.all([
      listPostgresPreviewProjects({ limit: pageSize, offset, filters }),
      countPostgresPreviewProjects(filters),
      getPostgresPreviewProjectListFacets(),
    ]);

    return {
      ok: true,
      projects,
      total: filteredCount,
      filters,
      facets,
      page,
      pageSize,
      density,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export default async function PostgresProjectsListPage({
  searchParams,
}: {
  searchParams?: Promise<PreviewListSearchParams>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const data = await getProjectsListData(resolvedSearchParams);
  const exportFilters = getProjectFilters(resolvedSearchParams);

  return (
    <main className="space-y-8">
      <PostgresPreviewListHeader
        actions={[
          {
            href: "/postgres-preview",
            label: "Back to Preview",
          },
          {
            href: previewQueryHref("/api/postgres-preview/projects/export", {
              search: exportFilters.search,
              country: exportFilters.country,
              review: exportFilters.reviewStatus,
              use: exportFilters.useType,
              status: exportFilters.status,
              missing: exportFilters.missing,
            }),
            label: "Export Filtered CSV",
          },
          {
            href: "/postgres-preview/projects/new",
            label: "New Project",
            variant: "primary",
          },
        ]}
        description="PostgreSQL staging list for project records imported from the current SQLite platform and future PostgreSQL-native records."
        eyebrow="PostgreSQL Staging"
        title="Projects"
      />

      {!data.ok ? (
        <PostgresPreviewSetupNotice error={data.error} />
      ) : (
        <>
          <PostgresPreviewQuickViews
            basePath="/postgres-preview/projects"
            currentQuery={{
              search: data.filters.search,
              country: data.filters.country,
              review: data.filters.reviewStatus,
              use: data.filters.useType,
              status: data.filters.status,
              missing: data.filters.missing,
            }}
            density={data.density}
            pageSize={data.pageSize}
            views={projectQuickViews}
          />
          <PostgresPreviewListFilters
            basePath="/postgres-preview/projects"
            density={data.density}
            pageSize={data.pageSize}
            search={data.filters.search}
            selects={[
              {
                name: "country",
                label: "Country",
                value: data.filters.country,
                placeholder: "All Countries",
                options: previewFilterOptions(data.facets.countries),
              },
              {
                name: "review",
                label: "Review",
                value: data.filters.reviewStatus,
                placeholder: "All Review States",
                options: [
                  {
                    value: "draft_or_validation",
                    label: "Draft / Validation",
                  },
                  ...previewFilterOptions(data.facets.reviewStatuses),
                ],
              },
              {
                name: "use",
                label: "Use Type",
                value: data.filters.useType,
                placeholder: "All Use Types",
                options: previewFilterOptions(data.facets.useTypes),
              },
              {
                name: "status",
                label: "Lifecycle",
                value: data.filters.status,
                placeholder: "All Lifecycle States",
                options: previewFilterOptions(data.facets.statuses),
              },
              {
                name: "missing",
                label: "Missing Data",
                value: data.filters.missing,
                placeholder: "Any Completeness",
                options: projectMissingOptions,
              },
            ]}
          />
          <ProjectsPreviewTable
            pagination={{
              basePath: "/postgres-preview/projects",
              density: data.density,
              page: data.page,
              pageSize: data.pageSize,
              total: data.total,
              query: {
                search: data.filters.search,
                country: data.filters.country,
                review: data.filters.reviewStatus,
                use: data.filters.useType,
                status: data.filters.status,
                missing: data.filters.missing,
              },
            }}
            projects={data.projects}
            total={data.total}
          />
        </>
      )}
    </main>
  );
}
