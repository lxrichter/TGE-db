"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ActionButton from "@/components/ui/ActionButton";

type PreviewResponse = {
  plant_id: string;
};

type PromoteProjectButtonProps = {
  projectId: string;
  projectName: string | null;
  disabled?: boolean;
  promotedPlantId?: string | null;
};

export default function PromoteProjectButton({
  projectId,
  projectName,
  disabled = false,
  promotedPlantId = null,
}: PromoteProjectButtonProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [message, setMessage] = useState("");
  const [plantIdPreview, setPlantIdPreview] = useState("");
  const [plantName, setPlantName] = useState(projectName || "");

  useEffect(() => {
    if (!isOpen || disabled) return;

    fetch(`/api/projects/${projectId}/promote-preview`)
      .then((res) => res.json())
      .then((json: PreviewResponse) => {
        setPlantIdPreview(json.plant_id || "");
      })
      .catch(() => {
        setPlantIdPreview("");
      });
  }, [isOpen, projectId, disabled]);

  async function handlePromote() {
    if (disabled) return;

    try {
      setIsPromoting(true);
      setMessage("");

      const res = await fetch(`/api/projects/${projectId}/promote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plant_name: plantName,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Failed to promote project");
      }

      setMessage(`Project promoted successfully as ${json.plant_id}. Redirecting...`);

      setTimeout(() => {
        router.push(`/plants/${json.plant_id}`);
        router.refresh();
      }, 900);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to promote project"
      );
    } finally {
      setIsPromoting(false);
    }
  }

  if (disabled) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <ActionButton type="button" variant="secondary" disabled>
          Already Promoted
        </ActionButton>

        <div className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] p-4 text-sm text-[var(--tge-text-secondary)] shadow-sm">
          <div className="space-y-2">
            <p>This project has already been promoted to a plant.</p>
            {promotedPlantId ? (
              <p>
                Plant ID: <span className="font-medium">{promotedPlantId}</span>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <ActionButton
        type="button"
        variant="primary"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setMessage("");
          setPlantName(projectName || "");
        }}
      >
        Promote to Plant
      </ActionButton>

      {isOpen && (
        <div className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] p-5 shadow-sm">
          <div className="space-y-4">
            <p className="text-sm leading-6 text-[var(--tge-governance-neutral-text)]">
              This will create a new plant record from this project.
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-neutral-text)]">
                  New Plant ID
                </label>
                <input
                  type="text"
                  value={plantIdPreview}
                  readOnly
                  className="w-full border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-3 py-2 text-sm text-[var(--tge-text-secondary)] outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-neutral-text)]">
                  Plant Name
                </label>
                <input
                  type="text"
                  value={plantName}
                  onChange={(e) => setPlantName(e.target.value)}
                  className="w-full border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 py-2 text-sm text-[var(--tge-text-primary)] outline-none focus:border-[var(--tge-brand-green)]"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <ActionButton
                type="button"
                variant="primary"
                onClick={handlePromote}
                disabled={isPromoting}
              >
                {isPromoting ? "Promoting..." : "Confirm Promotion"}
              </ActionButton>

              <ActionButton
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsOpen(false);
                  setMessage("");
                }}
              >
                Cancel
              </ActionButton>
            </div>

            <div className="text-[11px] leading-5 text-[var(--tge-governance-muted-text)]">
              Plant ID is assigned automatically to the next available safe Plant ID. Existing Plant IDs will not be overwritten.
            </div>

            {message ? (
              <div className="text-sm font-medium text-[var(--tge-governance-neutral-text)]">
                {message}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
