import StatusBadge from "@/components/ui/StatusBadge";

export default function ResearchStatusBadge({
  value,
}: {
  value: string | null;
}) {
  const raw = (value || "").trim();
  const normalized = raw.toLowerCase();

  if (!normalized || normalized === "na" || normalized === "n/a") {
    return <StatusBadge tone="neutralSoft">NA</StatusBadge>;
  }

  if (normalized.includes("done")) {
    return <StatusBadge tone="success">Done</StatusBadge>;
  }

  if (normalized.includes("progress")) {
    return <StatusBadge tone="info">In Progress</StatusBadge>;
  }

  if (normalized.includes("need")) {
    return <StatusBadge tone="danger">Need Info</StatusBadge>;
  }

  if (normalized.includes("tbd")) {
    return <StatusBadge tone="neutralSoft">tbd</StatusBadge>;
  }

  return <StatusBadge tone="neutralSoft">{raw}</StatusBadge>;
}
