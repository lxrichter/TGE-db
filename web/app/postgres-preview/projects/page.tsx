import {
  ProjectsPreviewTable,
  PostgresPreviewListHeader,
  PostgresPreviewSetupNotice,
} from "@/components/postgres-preview/PostgresPreviewListTables";
import {
  getPostgresPreviewSummary,
  listPostgresPreviewProjects,
  type PostgresPreviewProject,
} from "@/lib/postgres-preview";

export const dynamic = "force-dynamic";

const LIST_LIMIT = 500;

type ProjectsListData =
  | {
      ok: true;
      projects: PostgresPreviewProject[];
      total: number;
    }
  | {
      ok: false;
      error: string;
    };

async function getProjectsListData(): Promise<ProjectsListData> {
  try {
    const [summary, projects] = await Promise.all([
      getPostgresPreviewSummary(),
      listPostgresPreviewProjects(LIST_LIMIT),
    ]);

    return {
      ok: true,
      projects,
      total: summary.projectCount,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export default async function PostgresProjectsListPage() {
  const data = await getProjectsListData();

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
        <ProjectsPreviewTable projects={data.projects} total={data.total} />
      )}
    </main>
  );
}
