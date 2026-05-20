"use client";

import { useMemo, useState, useTransition } from "react";
import type {
  VocabularyGroup,
  VocabularyItem,
} from "@/lib/services/admin-vocabularies";

type EditableItem = {
  code: string;
  label: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
};

function toEditableItem(item: VocabularyItem): EditableItem {
  return {
    code: item.code,
    label: item.label,
    description: item.description || "",
    sortOrder: String(item.sort_order),
    isActive: item.is_active,
  };
}

function formatMetadataValue(value: string | number | boolean | null) {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value === null || value === "") {
    return "-";
  }

  return String(value);
}

async function readJson(res: Response) {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export default function VocabularyManagementPanel({
  initialGroups,
}: {
  initialGroups: VocabularyGroup[];
}) {
  const [groups, setGroups] = useState(initialGroups);
  const [activeGroupKey, setActiveGroupKey] = useState(initialGroups[0]?.key || "");
  const [editing, setEditing] = useState<Record<string, EditableItem>>({});
  const [newItem, setNewItem] = useState<EditableItem>({
    code: "",
    label: "",
    description: "",
    sortOrder: "0",
    isActive: true,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const activeGroup = useMemo(
    () => groups.find((group) => group.key === activeGroupKey) || groups[0],
    [activeGroupKey, groups]
  );

  function replaceItem(groupKey: string, item: VocabularyItem) {
    setGroups((current) =>
      current.map((group) =>
        group.key === groupKey
          ? {
              ...group,
              items: group.items
                .map((entry) => (entry.code === item.code ? item : entry))
                .sort((a, b) => {
                  if (a.sort_order !== b.sort_order) {
                    return a.sort_order - b.sort_order;
                  }

                  return a.label.localeCompare(b.label);
                }),
            }
          : group
      )
    );
  }

  function appendItem(groupKey: string, item: VocabularyItem) {
    setGroups((current) =>
      current.map((group) =>
        group.key === groupKey
          ? {
              ...group,
              items: [...group.items, item].sort((a, b) => {
                if (a.sort_order !== b.sort_order) {
                  return a.sort_order - b.sort_order;
                }

                return a.label.localeCompare(b.label);
              }),
            }
          : group
      )
    );
  }

  function getEditable(item: VocabularyItem) {
    return editing[item.code] || toEditableItem(item);
  }

  function setEditable(code: string, patch: Partial<EditableItem>) {
    setEditing((current) => ({
      ...current,
      [code]: {
        ...(current[code] || toEditableItem(activeGroup.items.find((item) => item.code === code)!)),
        ...patch,
      },
    }));
  }

  function saveItem(item: VocabularyItem) {
    if (!activeGroup) {
      return;
    }

    const editable = getEditable(item);
    setError("");
    setMessage("");

    startTransition(async () => {
      const res = await fetch("/api/admin/vocabularies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupKey: activeGroup.key,
          code: editable.code,
          label: editable.label,
          description: editable.description,
          sortOrder: editable.sortOrder,
          isActive: editable.isActive,
        }),
      });
      const payload = await readJson(res);

      if (!res.ok || !payload?.success) {
        setError(payload?.error || "Could not update vocabulary item.");
        return;
      }

      replaceItem(activeGroup.key, payload.item as VocabularyItem);
      setEditing((current) => {
        const next = { ...current };
        delete next[item.code];
        return next;
      });
      setMessage("Vocabulary item updated.");
    });
  }

  function createItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeGroup) {
      return;
    }

    setError("");
    setMessage("");

    startTransition(async () => {
      const res = await fetch("/api/admin/vocabularies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupKey: activeGroup.key,
          code: newItem.code,
          label: newItem.label,
          description: newItem.description,
          sortOrder: newItem.sortOrder,
          isActive: newItem.isActive,
        }),
      });
      const payload = await readJson(res);

      if (!res.ok || !payload?.success) {
        setError(payload?.error || "Could not create vocabulary item.");
        return;
      }

      appendItem(activeGroup.key, payload.item as VocabularyItem);
      setNewItem({
        code: "",
        label: "",
        description: "",
        sortOrder: "0",
        isActive: true,
      });
      setMessage("Vocabulary item created.");
    });
  }

  if (!activeGroup) {
    return null;
  }

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-[#f7f7f7] px-5 py-4">
          <h2 className="text-lg font-bold text-[#1f2937]">Vocabulary Groups</h2>
          <p className="mt-1 text-sm text-gray-500">
            Admin-only governance surface for active controlled terms.
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {groups.map((group) => {
            const selected = group.key === activeGroup.key;

            return (
              <button
                key={group.key}
                className={`block w-full px-5 py-4 text-left ${
                  selected
                    ? "bg-[#f3f8ec] text-[#1f2937]"
                    : "bg-white text-gray-700 hover:bg-[#fbfff7]"
                }`}
                type="button"
                onClick={() => {
                  setActiveGroupKey(group.key);
                  setEditing({});
                  setMessage("");
                  setError("");
                }}
              >
                <span className="block text-sm font-bold">{group.title}</span>
                <span className="mt-1 block text-xs text-gray-500">
                  {group.items.length} term{group.items.length === 1 ? "" : "s"}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="space-y-5">
        <section className="border border-gray-200 bg-white">
          <div className="border-l-4 border-l-[#8dc63f] px-6 py-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#1f2937]">
                  {activeGroup.title}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                  {activeGroup.description}
                </p>
              </div>
              <span className="inline-flex h-8 items-center border border-[#d7e8bf] bg-[#f5faef] px-3 text-xs font-semibold uppercase tracking-wide text-[#4f7f1f]">
                Admin controlled
              </span>
            </div>
          </div>
        </section>

        {error ? (
          <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="border border-[#b9d98b] bg-[#f1f8e8] px-4 py-3 text-sm font-medium text-[#3f6f19]">
            {message}
          </div>
        ) : null}

        <section className="border border-gray-200 bg-white">
          <div className="border-b border-gray-200 bg-[#f7f7f7] px-5 py-4">
            <h3 className="text-lg font-bold text-[#1f2937]">Add Term</h3>
            <p className="mt-1 text-sm text-gray-500">
              Codes are stable identifiers. Use lowercase letters, numbers, and
              underscores only.
            </p>
          </div>
          <form
            className="grid grid-cols-1 gap-4 px-5 py-5 lg:grid-cols-[180px_minmax(180px,1fr)_120px_140px] xl:grid-cols-[180px_minmax(180px,1fr)_minmax(220px,1fr)_120px_140px]"
            onSubmit={createItem}
          >
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Code
              <input
                className="h-10 border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-[#1f2937] outline-none focus:border-[#8dc63f]"
                value={newItem.code}
                onChange={(event) =>
                  setNewItem((current) => ({ ...current, code: event.target.value }))
                }
              />
            </label>
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Label
              <input
                className="h-10 border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-[#1f2937] outline-none focus:border-[#8dc63f]"
                value={newItem.label}
                onChange={(event) =>
                  setNewItem((current) => ({ ...current, label: event.target.value }))
                }
              />
            </label>
            {activeGroup.hasDescription ? (
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Description
                <input
                  className="h-10 border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-[#1f2937] outline-none focus:border-[#8dc63f]"
                  value={newItem.description}
                  onChange={(event) =>
                    setNewItem((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>
            ) : null}
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Sort
              <input
                className="h-10 border border-gray-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-[#1f2937] outline-none focus:border-[#8dc63f]"
                inputMode="numeric"
                value={newItem.sortOrder}
                onChange={(event) =>
                  setNewItem((current) => ({
                    ...current,
                    sortOrder: event.target.value,
                  }))
                }
              />
            </label>
            <button
              className="h-10 self-end border border-[#8dc63f] bg-[#8dc63f] px-4 text-sm font-semibold text-white hover:bg-[#78ad35] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
              type="submit"
            >
              Add Term
            </button>
          </form>
        </section>

        <section className="overflow-x-auto border border-gray-200 bg-white">
          <table className="min-w-[980px] table-fixed text-left text-sm">
            <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
              <tr>
                <th className="w-[18%] px-4 py-3 font-semibold">Code</th>
                <th className="w-[24%] px-4 py-3 font-semibold">Label</th>
                {activeGroup.hasDescription ? (
                  <th className="w-[28%] px-4 py-3 font-semibold">
                    Description
                  </th>
                ) : null}
                {activeGroup.metadataColumns.map((column) => (
                  <th key={column.column} className="w-[12%] px-4 py-3 font-semibold">
                    {column.label}
                  </th>
                ))}
                <th className="w-[9%] px-4 py-3 font-semibold">Sort</th>
                <th className="w-[9%] px-4 py-3 font-semibold">Active</th>
                <th className="w-[10%] px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeGroup.items.map((item) => {
                const editable = getEditable(item);

                return (
                  <tr key={item.code} className="align-top">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">
                      {item.code}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className="h-9 w-full border border-gray-300 bg-white px-2 text-sm font-medium text-[#1f2937] outline-none focus:border-[#8dc63f]"
                        value={editable.label}
                        onChange={(event) =>
                          setEditable(item.code, { label: event.target.value })
                        }
                      />
                    </td>
                    {activeGroup.hasDescription ? (
                      <td className="px-4 py-3">
                        <input
                          className="h-9 w-full border border-gray-300 bg-white px-2 text-sm text-[#1f2937] outline-none focus:border-[#8dc63f]"
                          value={editable.description}
                          onChange={(event) =>
                            setEditable(item.code, {
                              description: event.target.value,
                            })
                          }
                        />
                      </td>
                    ) : null}
                    {activeGroup.metadataColumns.map((column) => (
                      <td key={column.column} className="px-4 py-3 text-gray-700">
                        {formatMetadataValue(item.metadata[column.column])}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <input
                        className="h-9 w-full border border-gray-300 bg-white px-2 text-sm text-[#1f2937] outline-none focus:border-[#8dc63f]"
                        inputMode="numeric"
                        value={editable.sortOrder}
                        onChange={(event) =>
                          setEditable(item.code, { sortOrder: event.target.value })
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <label className="inline-flex h-9 items-center gap-2 border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700">
                        <input
                          checked={editable.isActive}
                          className="h-4 w-4 accent-[#8dc63f]"
                          type="checkbox"
                          onChange={(event) =>
                            setEditable(item.code, {
                              isActive: event.target.checked,
                            })
                          }
                        />
                        Active
                      </label>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="h-9 border border-[#8dc63f] bg-white px-3 text-xs font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isPending}
                        type="button"
                        onClick={() => saveItem(item)}
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </section>
    </section>
  );
}
