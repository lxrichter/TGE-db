import {
  parsePreviewListPage,
  parsePreviewListPageSize,
  parsePreviewTableDensity,
  ProjectsPreviewTable,
  PostgresPreviewListHeader,
  PostgresPreviewSetupNotice,
  type PreviewTableDensity,
} from "@/components/postgres-preview/PostgresPreviewListTables";
import {
  getPostgresPreviewSummary,
  listPostgresPreviewProjects,
  type PostgresPreviewProject,
} from "@/lib/postgres-preview";

export const dynamic = "force-dynamic";

type PreviewListSearchParams = {
  page?: string;
  pageSize?: string;
  density?: string;
};

type ProjectsListData =
  | {
      ok: true;
      projects: PostgresPreviewProject[];
      total: number;
      page: number;
      pageSize: number;
      density: PreviewTableDensity;
    }
  | {
      ok: false;
      error: string;
    };

async function getProjectsListData(
  params: PreviewListSearchParams
): Promise<ProjectsListData> {
  const page = parsePreviewListPage(params.page);
  const pageSize = parsePreviewListPageSize(params.pageSize);
  const density = parsePreviewTableDensity(params.density);
  const offset = (page - 1) * pageSize;

  try {
    const [summary, projects] = await Promise.all([
      getPostgresPreviewSummary(),
      listPostgresPreviewProjects({ limit: pageSize, offset }),
    ]);

    return {
      ok: true,
      projects,
      total: summary.projectCount,
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

  return (
    <main className="space-y-8">
      <PostgresPreviewListHeader
        actions={[
          {
            href: "/postgres-preview",
            label: "Back to Preview",
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
        <ProjectsPreviewTable
          pagination={{
            basePath: "/postgres-preview/projects",
            density: data.density,
            page: data.page,
            pageSize: data.pageSize,
            total: data.total,
          }}
          projects={data.projects}
          total={data.total}
        />
      )}
    </main>
  );
}
