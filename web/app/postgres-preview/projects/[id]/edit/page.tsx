import Link from "next/link";
import {
  NotFoundNotice,
  StatusBadge,
} from "@/components/postgres-preview/PostgresEntityDetail";
import { PostgresProjectForm } from "@/components/postgres-preview/PostgresEntityForm";
import {
  getPostgresEntityFormReferenceData,
  getPostgresPreviewProjectById,
} from "@/lib/postgres-preview";

export const dynamic = "force-dynamic";

type FormData =
  | {
      ok: true;
      referenceData: Awaited<ReturnType<typeof getPostgresEntityFormReferenceData>>;
      project: NonNullable<Awaited<ReturnType<typeof getPostgresPreviewProjectById>>>;
    }
  | {
      ok: false;
      error: string;
    };

async function getFormData(projectId: string): Promise<FormData> {
  try {
    const [referenceData, project] = await Promise.all([
      getPostgresEntityFormReferenceData(),
      getPostgresPreviewProjectById(projectId),
    ]);

    if (!project) {
      return { ok: false, error: "not_found" };
    }

    return { ok: true, referenceData, project };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: message };
  }
}

function SetupNotice({ error }: { error: string }) {
  return (
    <section className="border border-amber-200 bg-amber-50 px-5 py-5">
      <h2 className="text-lg font-bold text-amber-900">PostgreSQL Not Connected</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
        Project editing writes to Railway PostgreSQL staging. Run the app
        through Railway variables or set `DATABASE_PUBLIC_URL` / `DATABASE_URL`
        locally.
      </p>
      <p className="mt-3 text-xs text-amber-900">Error: {error}</p>
    </section>
  );
}

export default async function EditPostgresProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getFormData(id);

  if (!data.ok && data.error === "not_found") {
    return <NotFoundNotice label="Project" backHref="/postgres-preview" />;
  }

  return (
    <main className="space-y-8">
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-8 py-8">
          <Link
            href={`/postgres-preview/projects/${id}`}
            className="text-sm font-semibold text-[#4f7f1f] hover:underline"
          >
            Back to Project
          </Link>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
            PostgreSQL Staging
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-[#1f2937]">
                Edit Project
              </h1>
              <p className="mt-4 max-w-4xl text-base leading-7 text-gray-600">
                Update the staging project record. Approved or export-ready
                records edited through this path are moved back toward review
                unless an editor keeps the approval status.
              </p>
            </div>
            {data.ok ? (
              <div className="flex flex-wrap gap-2">
                <StatusBadge value={data.project.primary_use_type_code} />
                <StatusBadge value={data.project.lifecycle_phase_code} />
                <StatusBadge value={data.project.review_status_code} />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {!data.ok ? (
        <SetupNotice error={data.error} />
      ) : (
        <PostgresProjectForm
          mode="edit"
          project={data.project}
          referenceData={data.referenceData}
        />
      )}
    </main>
  );
}
