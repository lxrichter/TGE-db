export type PostgresStatusTone =
  | "success"
  | "attention"
  | "danger"
  | "info"
  | "neutral"
  | "muted";

export type PostgresStatusDomain =
  | "generic"
  | "review"
  | "lifecycle"
  | "source"
  | "confidence"
  | "severity";

const toneClasses: Record<PostgresStatusTone, string> = {
  success: "border-[#b9d98b] bg-[#f1f8e8] text-[#3f6f19]",
  attention: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-700",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  neutral: "border-gray-200 bg-[#f7f7f7] text-gray-700",
  muted: "border-gray-200 bg-gray-50 text-gray-500",
};

const reviewStatusTones: Record<string, PostgresStatusTone> = {
  draft: "neutral",
  validation: "info",
  approved: "success",
  export_ready: "success",
  needs_update: "attention",
  archived: "muted",
};

const lifecycleStatusTones: Record<string, PostgresStatusTone> = {
  prospect_tbd: "neutral",
  exploration: "info",
  pre_feasibility: "info",
  feasibility: "info",
  construction: "attention",
  operating: "success",
  cancelled: "danger",
};

const sourceStatusTones: Record<string, PostgresStatusTone> = {
  credible: "success",
  needs_review: "attention",
  weak: "danger",
  outdated: "attention",
  rejected: "danger",
};

const confidenceStatusTones: Record<string, PostgresStatusTone> = {
  high: "success",
  medium: "attention",
  low: "danger",
  unknown: "neutral",
  confirmed: "success",
  suggested_high_confidence: "success",
  suggested_medium_confidence: "attention",
  suggested_low_confidence: "danger",
};

const severityTones: Record<string, PostgresStatusTone> = {
  critical: "danger",
  blocker: "danger",
  error: "danger",
  important: "attention",
  warning: "attention",
  workflow: "info",
  useful: "neutral",
};

const genericStatusTones: Record<string, PostgresStatusTone> = {
  active: "success",
  applied: "success",
  clean: "success",
  complete: "success",
  completed: "success",
  dismissed: "muted",
  done: "success",
  in_progress: "info",
  new: "info",
  open: "info",
  pending: "attention",
  rejected: "danger",
  resolved: "success",
  reviewed: "success",
  superseded: "muted",
};

function normalizeStatus(value: string | null | undefined) {
  return String(value || "unknown").trim().toLowerCase().replace(/\s+/g, "_");
}

export function formatStatusLabel(value: string | null | undefined) {
  const normalized = String(value || "unknown").trim();

  if (!normalized) {
    return "Unknown";
  }

  return normalized
    .replaceAll("_", " ")
    .replace(/\bmw\b/gi, "MW")
    .replace(/\bmwe\b/gi, "MWe")
    .replace(/\bmwth\b/gi, "MWth")
    .replace(/\bcod\b/gi, "COD")
    .replace(/\btge\b/gi, "TGE")
    .replace(/\bai\b/gi, "AI")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function postgresStatusTone(
  value: string | null | undefined,
  domain: PostgresStatusDomain = "generic"
): PostgresStatusTone {
  const normalized = normalizeStatus(value);

  if (domain === "review") {
    return reviewStatusTones[normalized] || "neutral";
  }

  if (domain === "lifecycle") {
    return lifecycleStatusTones[normalized] || "neutral";
  }

  if (domain === "source") {
    return sourceStatusTones[normalized] || "neutral";
  }

  if (domain === "confidence") {
    return confidenceStatusTones[normalized] || "neutral";
  }

  if (domain === "severity") {
    return severityTones[normalized] || "neutral";
  }

  if (reviewStatusTones[normalized]) return reviewStatusTones[normalized];
  if (lifecycleStatusTones[normalized]) return lifecycleStatusTones[normalized];
  if (sourceStatusTones[normalized]) return sourceStatusTones[normalized];
  if (confidenceStatusTones[normalized]) return confidenceStatusTones[normalized];
  if (severityTones[normalized]) return severityTones[normalized];
  if (genericStatusTones[normalized]) return genericStatusTones[normalized];
  if (normalized === "ready") return "success";
  if (normalized === "not_ready") return "danger";

  return "neutral";
}

export function postgresStatusToneClass(tone: PostgresStatusTone) {
  return toneClasses[tone];
}

export default function PostgresStatusBadge({
  value,
  label,
  domain = "generic",
  tone,
}: {
  value: string | null | undefined;
  label?: string;
  domain?: PostgresStatusDomain;
  tone?: PostgresStatusTone;
}) {
  const resolvedTone = tone || postgresStatusTone(value, domain);

  return (
    <span
      className={`inline-flex min-h-[28px] items-center border px-2 text-xs font-semibold ${postgresStatusToneClass(
        resolvedTone
      )}`}
    >
      {label || formatStatusLabel(value)}
    </span>
  );
}
