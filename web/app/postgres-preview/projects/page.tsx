import {
  activePreviewQuickView,
  parsePreviewListPage,
  parsePreviewListPageSize,
  parsePreviewTableDensity,
  PostgresPreviewListContext,
  PostgresPreviewListFilters,
  previewQueryHref,
  previewFilterOptionLabel,
  previewFilterOptions,
  PostgresPreviewQuickViews,
  ProjectsPreviewTable,
  PostgresPreviewListHeader,
  PostgresPreviewSetupNotice,
  type PreviewFilterOption,
  type PreviewQuickView,
  type PreviewActiveFilter,
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
  const exportHref = previewQueryHref("/api/postgres-preview/projects/export", {
    search: exportFilters.search,
    country: exportFilters.country,
    review: exportFilters.reviewStatus,
    use: exportFilters.useType,
    status: exportFilters.status,
    missing: exportFilters.missing,
  });
  const currentQuery = data.ok
    ? {
        search: data.filters.search,
        country: data.filters.country,
        review: data.filters.reviewStatus,
        use: data.filters.useType,
        status: data.filters.status,
        missing: data.filters.missing,
      }
    : {};
  const reviewOptions = data.ok
    ? [
        {
          value: "draft_or_validation",
          label: "Draft / Validation",
        },
        ...previewFilterOptions(data.facets.reviewStatuses),
      ]
    : [];
  const useOptions = data.ok ? previewFilterOptions(data.facets.useTypes) : [];
  const statusOptions = data.ok ? previewFilterOptions(data.facets.statuses) : [];
  const countryOptions = data.ok ? previewFilterOptions(data.facets.countries) : [];
  const activeFilters: PreviewActiveFilter[] = data.ok
    ? [
        data.filters.search
          ? { label: "Search", value: data.filters.search }
          : null,
        data.filters.country
          ? {
              label: "Country",
              value:
                previewFilterOptionLabel(countryOptions, data.filters.country) ||
                data.filters.country,
            }
          : null,
        data.filters.reviewStatus
          ? {
              label: "Review",
              value:
                previewFilterOptionLabel(reviewOptions, data.filters.reviewStatus) ||
                data.filters.reviewStatus,
            }
          : null,
        data.filters.useType
          ? {
              label: "Use Type",
              value:
                previewFilterOptionLabel(useOptions, data.filters.useType) ||
                data.filters.useType,
            }
          : null,
        data.filters.status
          ? {
              label: "Lifecycle",
              value:
                previewFilterOptionLabel(statusOptions, data.filters.status) ||
                data.filters.status,
            }
          : null,
        data.filters.missing
          ? {
              label: "Missing Data",
              value:
                previewFilterOptionLabel(
                  projectMissingOptions,
                  data.filters.missing
                ) || data.filters.missing,
            }
          : null,
      ].filter((filter): filter is PreviewActiveFilter => Boolean(filter))
    : [];
  const activeView = data.ok
    ? activePreviewQuickView({
        currentQuery,
        views: projectQuickViews,
      })
    : null;

  return (
    <main className="space-y-8">
      <PostgresPreviewListHeader
        actions={[
          {
            href: "/postgres-preview",
            label: "Back to Preview",
          },
          {
            href: exportHref,
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
            currentQuery={currentQuery}
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
                options: countryOptions,
              },
              {
                name: "review",
                label: "Review",
                value: data.filters.reviewStatus,
                placeholder: "All Review States",
                options: reviewOptions,
              },
              {
                name: "use",
                label: "Use Type",
                value: data.filters.useType,
                placeholder: "All Use Types",
                options: useOptions,
              },
              {
                name: "status",
                label: "Lifecycle",
                value: data.filters.status,
                placeholder: "All Lifecycle States",
                options: statusOptions,
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
          <PostgresPreviewListContext
            activeFilters={activeFilters}
            activeViewLabel={activeView?.label || "Custom Project View"}
            entityLabel="projects"
            exportHref={exportHref}
            page={data.page}
            pageSize={data.pageSize}
            shownCount={data.projects.length}
            total={data.total}
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
