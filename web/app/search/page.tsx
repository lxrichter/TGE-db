import Link from "next/link";
import { searchGlobalRecords, type GlobalSearchResult } from "@/lib/services/global-search";
import { formatCount } from "@/lib/format";

export const dynamic = "force-dynamic";

type SearchPageParams = {
  q?: string;
};

type SearchPageData =
  | {
      ok: true;
      query: string;
      results: GlobalSearchResult[];
    }
  | {
      ok: false;
      query: string;
      error: string;
    };

const commandShortcuts = [
  {
    label: "Open Research Ops",
    href: "/postgres-preview/research-ops",
    note: "Queues, assignments, validation, missing data, and review actions.",
  },
  {
    label: "Add Project",
    href: "/postgres-preview/projects/new",
    note: "Create a new development pipeline record.",
  },
  {
    label: "Add Plant / Facility",
    href: "/postgres-preview/operating-assets/new",
    note: "Create a commissioned operating asset, unit, or direct-use facility.",
  },
  {
    label: "Add Company",
    href: "/postgres-preview/companies/new",
    note: "Create a legal entity, group, supplier, investor, or operator record.",
  },
  {
    label: "Review Article Matches",
    href: "/sources/matches",
    note: "Confirm or reject article-to-entity match candidates.",
  },
  {
    label: "Review Article Facts",
    href: "/sources/facts",
    note: "Train and review compact extracted article fact candidates.",
  },
  {
    label: "Manage Sources",
    href: "/sources",
    note: "Search source records and evidence-governance status.",
  },
  {
    label: "Admin Vocabularies",
    href: "/admin/vocabularies",
    note: "Govern controlled reference terms and active taxonomy labels.",
  },
];

function entityTypeLabel(value: GlobalSearchResult["entity_type"]) {
  if (value === "operating_asset") {
    return "Plant / Facility";
  }

  if (value === "country") {
    return "Country / Market";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function groupResults(results: GlobalSearchResult[]) {
  const grouped = new Map<GlobalSearchResult["entity_type"], GlobalSearchResult[]>();

  results.forEach((result) => {
    grouped.set(result.entity_type, [
      ...(grouped.get(result.entity_type) || []),
      result,
    ]);
  });

  return [...grouped.entries()];
}

async function getSearchPageData(params: SearchPageParams): Promise<SearchPageData> {
  const query = params.q?.trim() || "";

  if (query.length < 2) {
    return { ok: true, query, results: [] };
  }

  try {
    return {
      ok: true,
      query,
      results: await searchGlobalRecords({ query, limit: 40 }),
    };
  } catch (error) {
    return {
      ok: false,
      query,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function SearchForm({ query }: { query: string }) {
  return (
    <form action="/search" className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px]">
      <input
        autoFocus
        className="h-11 border border-gray-300 bg-white px-4 text-sm font-medium text-[#1f2937] outline-none focus:border-[#8dc63f]"
        defaultValue={query}
        name="q"
        placeholder="Search projects, plants/facilities, companies, sources, countries..."
        type="search"
      />
      <button
        className="h-11 border border-[#8dc63f] bg-[#8dc63f] px-4 text-sm font-semibold text-white hover:bg-[#78ad35]"
        type="submit"
      >
        Search
      </button>
    </form>
  );
}

function ResultCard({ result }: { result: GlobalSearchResult }) {
  return (
    <Link
      href={result.href}
      className="block border border-gray-200 bg-white px-4 py-4 hover:border-[#8dc63f]"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="border border-gray-200 bg-[#f7f7f7] px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
              {entityTypeLabel(result.entity_type)}
            </span>
            {result.status_code ? (
              <span className="border border-[#d7e8bf] bg-[#f5faef] px-2 py-1 text-[11px] font-semibold text-[#4f7f1f]">
                {result.status_code}
              </span>
            ) : null}
            {result.country ? (
              <span className="text-xs font-medium text-gray-500">
                {result.country}
              </span>
            ) : null}
          </div>
          <div className="mt-2 truncate text-base font-bold text-[#1f2937]">
            {result.title}
          </div>
          {result.subtitle ? (
            <div className="mt-1 text-sm leading-6 text-gray-600">
              {result.subtitle}
            </div>
          ) : null}
        </div>
        <div className="shrink-0 text-xs font-semibold text-[#4f7f1f]">
          Open
        </div>
      </div>
    </Link>
  );
}

export default async function GlobalSearchPage({
  searchParams,
}: {
  searchParams?: Promise<SearchPageParams>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const data = await getSearchPageData(resolvedSearchParams);
  const groupedResults = data.ok ? groupResults(data.results) : [];

  return (
    <main className="space-y-8">
      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-8 py-8">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
            Global Search
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#1f2937]">
            Search And Quick Actions
          </h1>
          <p className="mt-4 max-w-4xl text-base leading-7 text-gray-600">
            Fast internal lookup across PostgreSQL staging projects,
            plants/facilities, companies, sources, and country signals. This is
            the first simple step toward command-palette and semantic search.
          </p>
          <div className="mt-6 max-w-4xl">
            <SearchForm query={data.query} />
          </div>
        </div>
      </section>

      {!data.ok ? (
        <section className="border border-amber-200 bg-amber-50 px-5 py-5">
          <h2 className="text-lg font-bold text-amber-900">
            PostgreSQL Search Not Connected
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
            Global search reads from the PostgreSQL staging tables. Run the app
            with local `DATABASE_URL` or Railway PostgreSQL variables.
          </p>
          <p className="mt-3 text-xs text-amber-900">Error: {data.error}</p>
        </section>
      ) : data.query.length < 2 ? (
        <section className="border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-bold text-[#1f2937]">Quick Actions</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Use search for records, or jump directly into common operational
              workflows.
            </p>
          </div>
          <div className="grid gap-3 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
            {commandShortcuts.map((shortcut) => (
              <Link
                key={shortcut.href}
                href={shortcut.href}
                className="block border border-gray-200 bg-[#fbfbfb] px-4 py-4 hover:border-[#8dc63f]"
              >
                <div className="text-sm font-bold text-[#1f2937]">
                  {shortcut.label}
                </div>
                <p className="mt-2 text-xs leading-5 text-gray-600">
                  {shortcut.note}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="border border-gray-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#1f2937]">Results</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {formatCount(data.results.length)} result
                {data.results.length === 1 ? "" : "s"} for{" "}
                <span className="font-semibold">“{data.query}”</span>
              </p>
            </div>
          </div>

          {data.results.length === 0 ? (
            <div className="px-5 py-8 text-sm text-gray-600">
              No PostgreSQL staging records matched this search.
            </div>
          ) : (
            <div className="space-y-6 px-5 py-5">
              {groupedResults.map(([entityType, results]) => (
                <div key={entityType}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#1f2937]">
                      {entityTypeLabel(entityType)}
                    </h3>
                    <span className="text-xs font-semibold text-gray-500">
                      {formatCount(results.length)}
                    </span>
                  </div>
                  <div className="grid gap-3">
                    {results.map((result) => (
                      <ResultCard key={`${result.entity_type}-${result.entity_id}`} result={result} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
