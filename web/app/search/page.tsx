import Link from "next/link";
import { getServerSession } from "next-auth";
import { searchGlobalRecords, type GlobalSearchResult } from "@/lib/services/global-search";
import { formatCount } from "@/lib/format";
import { authOptions } from "@/lib/auth/auth";
import { getVisiblePlatformNavigationGroups } from "@/lib/platform-navigation";

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

function getCommandShortcutGroups(role?: string | null) {
  return getVisiblePlatformNavigationGroups(role, { target: "command" }).map((group) => ({
    group: group.label,
    shortcuts: group.items.map((item) => ({
      label: item.commandLabel,
      href: item.href,
      note: item.note,
    })),
  }));
}

const searchPageClass = {
  panel:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]",
  hero:
    "border-l-4 border-l-[var(--tge-brand-green)] px-8 py-8",
  sectionHeader:
    "border-b border-[var(--tge-governance-neutral-border)] px-5 py-4",
  title: "text-[var(--tge-text-primary)]",
  body: "text-[var(--tge-text-secondary)]",
  muted: "text-[var(--tge-governance-muted-text)]",
  kicker:
    "text-sm font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]",
  input:
    "h-11 border border-[var(--tge-border-strong)] bg-[var(--tge-surface-card)] px-4 text-sm font-medium text-[var(--tge-text-primary)] outline-none focus:border-[var(--tge-brand-green)]",
  primaryButton:
    "h-11 border border-[var(--tge-brand-green)] bg-[var(--tge-brand-green)] px-4 text-sm font-semibold text-[var(--tge-surface-card)] hover:bg-[var(--tge-brand-green-dark)]",
  resultCard:
    "block border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-4 py-4 hover:border-[var(--tge-brand-green)]",
  shortcutCard:
    "block border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-4 py-4 hover:border-[var(--tge-brand-green)]",
  entityBadge:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-neutral-text)]",
  statusBadge:
    "border border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] px-2 py-1 text-[11px] font-semibold text-[var(--tge-governance-success-text)]",
  openLink:
    "shrink-0 text-xs font-semibold text-[var(--tge-brand-green-dark)]",
  warningPanel:
    "border border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] px-5 py-5",
  warningText: "text-[var(--tge-governance-attention-text)]",
};

function entityTypeLabel(value: GlobalSearchResult["entity_type"]) {
  if (value === "operating_asset") {
    return "Plant";
  }

  if (value === "country") {
    return "Market";
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
        className={searchPageClass.input}
        defaultValue={query}
        name="q"
        placeholder="Search projects, plants, companies, sources, markets..."
        type="search"
      />
      <button
        className={searchPageClass.primaryButton}
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
      className={searchPageClass.resultCard}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={searchPageClass.entityBadge}>
              {entityTypeLabel(result.entity_type)}
            </span>
            {result.status_code ? (
              <span className={searchPageClass.statusBadge}>
                {result.status_code}
              </span>
            ) : null}
            {result.country ? (
              <span className={`text-xs font-medium ${searchPageClass.muted}`}>
                {result.country}
              </span>
            ) : null}
          </div>
          <div className={`mt-2 truncate text-base font-bold ${searchPageClass.title}`}>
            {result.title}
          </div>
          {result.subtitle ? (
            <div className={`mt-1 text-sm leading-6 ${searchPageClass.body}`}>
              {result.subtitle}
            </div>
          ) : null}
        </div>
        <div className={searchPageClass.openLink}>
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
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string | null } | undefined)?.role ?? null;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const data = await getSearchPageData(resolvedSearchParams);
  const groupedResults = data.ok ? groupResults(data.results) : [];
  const commandShortcutGroups = getCommandShortcutGroups(role);

  return (
    <main className="space-y-8">
      <section className={searchPageClass.panel}>
        <div className={searchPageClass.hero}>
          <p className={searchPageClass.kicker}>
            Global Search
          </p>
          <h1 className={`mt-3 text-4xl font-bold tracking-tight ${searchPageClass.title}`}>
            Search And Quick Actions
          </h1>
          <p className={`mt-4 max-w-4xl text-base leading-7 ${searchPageClass.body}`}>
            Fast internal lookup across PostgreSQL staging projects,
            plants, companies, sources, and country signals. This is
            the first simple step toward command-palette and semantic search.
          </p>
          <div className="mt-6 max-w-4xl">
            <SearchForm query={data.query} />
          </div>
        </div>
      </section>

      {!data.ok ? (
        <section className={searchPageClass.warningPanel}>
          <h2 className={`text-lg font-bold ${searchPageClass.warningText}`}>
            PostgreSQL Search Not Connected
          </h2>
          <p className={`mt-2 max-w-3xl text-sm leading-6 ${searchPageClass.warningText}`}>
            Global search reads from the PostgreSQL staging tables. Run the app
            with local `DATABASE_URL` or Railway PostgreSQL variables.
          </p>
          <p className={`mt-3 text-xs ${searchPageClass.warningText}`}>Error: {data.error}</p>
        </section>
      ) : data.query.length < 2 ? (
        <section className={searchPageClass.panel}>
          <div className={searchPageClass.sectionHeader}>
            <h2 className={`text-lg font-bold ${searchPageClass.title}`}>Quick Actions</h2>
            <p className={`mt-2 max-w-3xl text-sm leading-6 ${searchPageClass.body}`}>
              Use search to find projects, plants, companies, sources, and
              markets, or jump directly into common operational workflows.
            </p>
          </div>
          <div className="space-y-6 px-5 py-5">
            {commandShortcutGroups.map((group) => (
              <div key={group.group}>
                <div className={`mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] ${searchPageClass.muted}`}>
                  {group.group}
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {group.shortcuts.map((shortcut) => (
                    <Link
                      key={shortcut.href}
                      href={shortcut.href}
                      className={searchPageClass.shortcutCard}
                    >
                      <div className={`text-sm font-bold ${searchPageClass.title}`}>
                        {shortcut.label}
                      </div>
                      <p className={`mt-2 text-xs leading-5 ${searchPageClass.body}`}>
                        {shortcut.note}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className={searchPageClass.panel}>
          <div className={`flex flex-col gap-3 md:flex-row md:items-start md:justify-between ${searchPageClass.sectionHeader}`}>
            <div>
              <h2 className={`text-lg font-bold ${searchPageClass.title}`}>Results</h2>
              <p className={`mt-2 text-sm leading-6 ${searchPageClass.body}`}>
                {formatCount(data.results.length)} result
                {data.results.length === 1 ? "" : "s"} for{" "}
                <span className="font-semibold">“{data.query}”</span>
              </p>
            </div>
          </div>

          {data.results.length === 0 ? (
            <div className={`px-5 py-8 text-sm ${searchPageClass.body}`}>
              No projects, plants, companies, sources, or markets matched this search.
            </div>
          ) : (
            <div className="space-y-6 px-5 py-5">
              {groupedResults.map(([entityType, results]) => (
                <div key={entityType}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className={`text-sm font-bold ${searchPageClass.title}`}>
                      {entityTypeLabel(entityType)}
                    </h3>
                    <span className={`text-xs font-semibold ${searchPageClass.muted}`}>
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
