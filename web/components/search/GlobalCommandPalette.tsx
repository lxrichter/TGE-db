"use client";

import { useRouter } from "next/navigation";
import {
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { GlobalSearchResult } from "@/lib/services/global-search";

type CommandGroup =
  | "Intelligence / Research"
  | "Research Operations"
  | "Platform / Admin";

type CommandItem = {
  type: "command";
  key: string;
  group: CommandGroup;
  label: string;
  note: string;
  href: string;
};

type ResultItem = {
  type: "result";
  key: string;
  result: GlobalSearchResult;
};

type PaletteItem = CommandItem | ResultItem;

const baseCommands: CommandItem[] = [
  {
    type: "command",
    key: "dashboard",
    group: "Intelligence / Research",
    label: "Open Dashboard",
    note: "Executive geothermal intelligence overview.",
    href: "/",
  },
  {
    type: "command",
    key: "markets",
    group: "Intelligence / Research",
    label: "Open Markets",
    note: "Market intelligence, country worklists, and source-gap signals.",
    href: "/postgres-preview/markets",
  },
  {
    type: "command",
    key: "analysis",
    group: "Intelligence / Research",
    label: "Open Analysis",
    note: "Cross-database benchmarking and geothermal intelligence analysis.",
    href: "/postgres-preview/analysis",
  },
  {
    type: "command",
    key: "map",
    group: "Intelligence / Research",
    label: "Open Map",
    note: "Spatial intelligence for coordinate-confirmed projects and plants.",
    href: "/postgres-preview/map",
  },
  {
    type: "command",
    key: "projects",
    group: "Intelligence / Research",
    label: "Open Projects",
    note: "Review and edit the development pipeline.",
    href: "/postgres-preview/projects",
  },
  {
    type: "command",
    key: "operating-assets",
    group: "Intelligence / Research",
    label: "Open Plants",
    note: "Review plants, units, direct-use plants, and capacity.",
    href: "/postgres-preview/operating-assets",
  },
  {
    type: "command",
    key: "companies",
    group: "Intelligence / Research",
    label: "Open Companies",
    note: "Review companies, roles, ownership, and evidence.",
    href: "/postgres-preview/companies",
  },
  {
    type: "command",
    key: "research-ops",
    group: "Research Operations",
    label: "Open Research Ops",
    note: "Queues, missing data, assignments, validation, and review actions.",
    href: "/postgres-preview/research-ops",
  },
  {
    type: "command",
    key: "sources",
    group: "Research Operations",
    label: "Open Sources / Documents",
    note: "Manage governed sources and evidence.",
    href: "/sources",
  },
  {
    type: "command",
    key: "add-source",
    group: "Research Operations",
    label: "Add Source",
    note: "Create a governed source/evidence entry.",
    href: "/sources/new",
  },
  {
    type: "command",
    key: "article-matches",
    group: "Research Operations",
    label: "Review Article Matches",
    note: "Confirm or reject article-to-entity candidates.",
    href: "/sources/matches",
  },
  {
    type: "command",
    key: "article-facts",
    group: "Research Operations",
    label: "Review Article Facts",
    note: "Train and review compact extracted article fact candidates.",
    href: "/sources/facts",
  },
  {
    type: "command",
    key: "field-suggestions",
    group: "Research Operations",
    label: "Review Field Suggestions",
    note: "Open human-confirmed AI field suggestions in Research Ops.",
    href: "/postgres-preview/research-ops#field-suggestion-review",
  },
  {
    type: "command",
    key: "add-project",
    group: "Research Operations",
    label: "Add Project",
    note: "Create a project pipeline entry.",
    href: "/postgres-preview/projects/new",
  },
  {
    type: "command",
    key: "add-asset",
    group: "Research Operations",
    label: "Add Plant",
    note: "Create a plant, unit, or direct-use plant.",
    href: "/postgres-preview/operating-assets/new",
  },
  {
    type: "command",
    key: "add-company",
    group: "Research Operations",
    label: "Add Company",
    note: "Create a company, group, supplier, operator, or investor.",
    href: "/postgres-preview/companies/new",
  },
  {
    type: "command",
    key: "command-center",
    group: "Platform / Admin",
    label: "Open Command Center",
    note: "Operational navigation across PostgreSQL staging modules.",
    href: "/postgres-preview",
  },
  {
    type: "command",
    key: "readiness",
    group: "Platform / Admin",
    label: "Open Replacement Readiness",
    note: "Cutover signals, data quality gates, and migration readiness.",
    href: "/postgres-preview/readiness",
  },
];

const adminCommands: CommandItem[] = [
  {
    type: "command",
    key: "admin",
    group: "Platform / Admin",
    label: "Open Admin",
    note: "Govern users, permissions, and platform controls.",
    href: "/admin",
  },
  {
    type: "command",
    key: "admin-vocabularies",
    group: "Platform / Admin",
    label: "Manage Vocabularies",
    note: "Edit controlled taxonomy labels, ordering, and active terms.",
    href: "/admin/vocabularies",
  },
];

function entityTypeLabel(value: GlobalSearchResult["entity_type"]) {
  if (value === "operating_asset") {
    return "Plant";
  }

  if (value === "country") {
    return "Market";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function resultKey(result: GlobalSearchResult) {
  return `${result.entity_type}-${result.entity_id}`;
}

function itemLabel(item: PaletteItem) {
  return item.type === "command" ? item.label : item.result.title;
}

function itemHref(item: PaletteItem) {
  return item.type === "command" ? item.href : item.result.href;
}

function itemMatchesQuery(item: CommandItem, query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  return `${item.group} ${item.label} ${item.note}`
    .toLowerCase()
    .includes(normalized);
}

async function readJson(res: Response) {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export default function GlobalCommandPalette({
  showAdmin,
}: {
  showAdmin: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const commands = useMemo(
    () => (showAdmin ? [...baseCommands, ...adminCommands] : baseCommands),
    [showAdmin]
  );
  const visibleCommands = useMemo(
    () => commands.filter((command) => itemMatchesQuery(command, query)).slice(0, 6),
    [commands, query]
  );
  const items: PaletteItem[] = useMemo(
    () => [
      ...visibleCommands,
      ...results.map((result) => ({
        type: "result" as const,
        key: resultKey(result),
        result,
      })),
    ],
    [results, visibleCommands]
  );

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeout = window.setTimeout(() => inputRef.current?.focus(), 25);
    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const trimmed = query.trim();
    setSelectedIndex(0);

    if (trimmed.length < 2) {
      setResults([]);
      setError("");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({ q: trimmed, limit: "12" });
        const res = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
        });
        const json = await readJson(res);

        if (!res.ok || !json?.success) {
          throw new Error(json?.error || "Search failed.");
        }

        setResults(json.results || []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setError(error instanceof Error ? error.message : "Search failed.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [open, query]);

  function closePalette() {
    setOpen(false);
    setQuery("");
    setResults([]);
    setSelectedIndex(0);
    setError("");
  }

  function openItem(item: PaletteItem) {
    router.push(itemHref(item));
    closePalette();
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((current) =>
        items.length === 0 ? 0 : Math.min(current + 1, items.length - 1)
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((current) => Math.max(current - 1, 0));
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const selectedItem = items[selectedIndex];

      if (selectedItem) {
        openItem(selectedItem);
      } else if (query.trim().length >= 2) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        closePalette();
      }
    }
  }

  return (
    <>
      <button
        className="h-[28px] shrink-0 border border-[#b7cf8b] bg-white px-3 text-[11px] font-semibold text-[#3f4a35] hover:bg-[#e9f3d8]"
        type="button"
        onClick={() => setOpen(true)}
      >
        Commands Ctrl K
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] bg-black/30 px-4 py-12">
          <div className="mx-auto max-w-3xl border border-gray-300 bg-white shadow-xl">
            <div className="border-b border-gray-200 px-4 py-4">
              <div className="flex items-center gap-3">
                <input
                  ref={inputRef}
                  className="h-11 min-w-0 flex-1 border border-gray-300 bg-white px-4 text-sm font-medium text-[#1f2937] outline-none focus:border-[#8dc63f]"
                  placeholder="Search projects, plants, companies, sources, or commands..."
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                />
                <button
                  className="h-11 border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f]"
                  type="button"
                  onClick={closePalette}
                >
                  Close
                </button>
              </div>
              <div className="mt-2 text-xs leading-5 text-gray-500">
                Use arrow keys and Enter, or search for projects, plants,
                companies, sources, markets, and operational actions.
              </div>
            </div>

            <div className="max-h-[62vh] overflow-y-auto px-3 py-3">
              {error ? (
                <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : null}

              {loading ? (
                <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>
              ) : null}

              {items.length === 0 && !loading ? (
                <div className="px-3 py-8 text-center text-sm text-gray-500">
                  No commands or results matched this query.
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item, index) => {
                    const selected = index === selectedIndex;

                    return (
                      <button
                        key={item.key}
                        className={`block w-full border px-4 py-3 text-left ${
                          selected
                            ? "border-[#8dc63f] bg-[#f5faef]"
                            : "border-gray-200 bg-white hover:border-[#8dc63f]"
                        }`}
                        type="button"
                        onMouseEnter={() => setSelectedIndex(index)}
                        onClick={() => openItem(item)}
                      >
                        {item.type === "command" ? (
                          <>
                            <div className="flex items-center justify-between gap-3">
                              <div className="font-semibold text-[#1f2937]">
                                {item.label}
                              </div>
                              <span className="border border-gray-200 bg-[#f7f7f7] px-2 py-1 text-[11px] font-semibold text-gray-600">
                                {item.group}
                              </span>
                            </div>
                            <div className="mt-1 text-xs leading-5 text-gray-600">
                              {item.note}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="border border-gray-200 bg-[#f7f7f7] px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                                {entityTypeLabel(item.result.entity_type)}
                              </span>
                              {item.result.status_code ? (
                                <span className="border border-[#d7e8bf] bg-[#f5faef] px-2 py-1 text-[11px] font-semibold text-[#4f7f1f]">
                                  {item.result.status_code}
                                </span>
                              ) : null}
                              {item.result.country ? (
                                <span className="text-xs font-medium text-gray-500">
                                  {item.result.country}
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-2 font-semibold text-[#1f2937]">
                              {itemLabel(item)}
                            </div>
                            {item.result.subtitle ? (
                              <div className="mt-1 text-xs leading-5 text-gray-600">
                                {item.result.subtitle}
                              </div>
                            ) : null}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 bg-[#f7f7f7] px-4 py-3 text-xs text-gray-500">
              Enter opens the selected item. Escape closes the palette.
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
