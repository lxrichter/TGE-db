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

type CommandItem = {
  type: "command";
  key: string;
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
    key: "research-ops",
    label: "Open Research Ops",
    note: "Queues, missing data, assignments, validation, and review actions.",
    href: "/postgres-preview/research-ops",
  },
  {
    type: "command",
    key: "add-project",
    label: "Add Project",
    note: "Create a project pipeline record.",
    href: "/postgres-preview/projects/new",
  },
  {
    type: "command",
    key: "add-asset",
    label: "Add Plant / Facility",
    note: "Create an operating asset, unit, or direct-use facility.",
    href: "/postgres-preview/operating-assets/new",
  },
  {
    type: "command",
    key: "add-company",
    label: "Add Company",
    note: "Create a company, group, supplier, operator, or investor record.",
    href: "/postgres-preview/companies/new",
  },
  {
    type: "command",
    key: "sources",
    label: "Open Sources",
    note: "Manage governed source/evidence records.",
    href: "/sources",
  },
  {
    type: "command",
    key: "article-matches",
    label: "Review Article Matches",
    note: "Confirm or reject article-to-entity candidates.",
    href: "/sources/matches",
  },
  {
    type: "command",
    key: "article-facts",
    label: "Review Article Facts",
    note: "Train and review compact extracted article fact candidates.",
    href: "/sources/facts",
  },
];

const adminCommands: CommandItem[] = [
  {
    type: "command",
    key: "admin",
    label: "Open Admin",
    note: "Govern users, permissions, and platform controls.",
    href: "/admin",
  },
  {
    type: "command",
    key: "admin-vocabularies",
    label: "Manage Vocabularies",
    note: "Edit controlled taxonomy labels, ordering, and active terms.",
    href: "/admin/vocabularies",
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

  return `${item.label} ${item.note}`.toLowerCase().includes(normalized);
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
                  placeholder="Search records or type a command..."
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
                companies, sources, countries, and operational actions.
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
                  No commands or records matched this query.
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
                                Command
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
