import Link from "next/link";
import { PostgresCompanyForm } from "@/components/postgres-preview/PostgresEntityForm";
import { getPostgresEntityFormReferenceData } from "@/lib/postgres-preview";

export const dynamic = "force-dynamic";

type FormData =
  | {
      ok: true;
      referenceData: Awaited<ReturnType<typeof getPostgresEntityFormReferenceData>>;
    }
  | {
      ok: false;
      error: string;
    };

async function getFormData(): Promise<FormData> {
  try {
    const referenceData = await getPostgresEntityFormReferenceData();
    return { ok: true, referenceData };
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
        Company creation writes to Railway PostgreSQL staging. Run the app
        through Railway variables or set `DATABASE_PUBLIC_URL` / `DATABASE_URL`
        locally.
      </p>
      <p className="mt-3 text-xs text-amber-900">Error: {error}</p>
    </section>
  );
}

export default async function NewPostgresCompanyPage() {
  const data = await getFormData();

  return (
    <main className="space-y-8">
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-8 py-8">
          <Link
            href="/postgres-preview"
            className="text-sm font-semibold text-[#4f7f1f] hover:underline"
          >
            Back to PostgreSQL Preview
          </Link>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
            PostgreSQL Staging
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#1f2937]">
            Add Company
          </h1>
          <p className="mt-4 max-w-4xl text-base leading-7 text-gray-600">
            Create a staging company record. Company roles, ownership
            structures, source links, and group relationships remain separate
            workflow layers.
          </p>
        </div>
      </section>

      {!data.ok ? (
        <SetupNotice error={data.error} />
      ) : (
        <PostgresCompanyForm mode="create" referenceData={data.referenceData} />
      )}
    </main>
  );
}
