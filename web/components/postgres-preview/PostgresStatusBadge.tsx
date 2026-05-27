export type PostgresStatusTone =
  | "success"
  | "attention"
  | "danger"
  | "info"
  | "neutral"
  | "muted"
  | "prospect"
  | "exploration"
  | "pre_feasibility"
  | "feasibility"
  | "construction"
  | "operating"
  | "cancelled"
  | "retired"
  | "pilot";

export type PostgresStatusDomain =
  | "generic"
  | "review"
  | "lifecycle"
  | "source"
  | "visibility"
  | "confidence"
  | "severity";

/**
 * Shared badge tone language:
 * success = usable, reviewed, operating, or completed
 * info = active workflow or active development state
 * attention = needs human review, transition, or watch item
 * danger = blocker, rejected, cancelled, or not export-safe
 * neutral = contextual/default state
 * muted = historical, inactive, superseded, or archived
 * prospect/exploration/pre_feasibility/feasibility/construction =
 *   geothermal development-stage semantics
 * operating/cancelled/retired/pilot = operating asset and lifecycle semantics
 */
const toneClasses: Record<PostgresStatusTone, string> = {
  success: "border-[#b9d98b] bg-[#f1f8e8] text-[#3f6f19]",
  attention: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-700",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  neutral: "border-gray-200 bg-[#f7f7f7] text-gray-700",
  muted: "border-gray-200 bg-gray-50 text-gray-500",
  prospect: "border-slate-200 bg-slate-50 text-slate-700",
  exploration: "border-blue-200 bg-blue-50 text-blue-800",
  pre_feasibility: "border-violet-200 bg-violet-50 text-violet-800",
  feasibility: "border-teal-200 bg-teal-50 text-teal-800",
  construction: "border-[#b9d98b] bg-[#f1f8e8] text-[#3f6f19]",
  operating: "border-[#a9cf7a] bg-[#f1f8e8] text-[#356d1c]",
  cancelled: "border-red-200 bg-red-50 text-red-700",
  retired: "border-gray-200 bg-gray-50 text-gray-500",
  pilot: "border-amber-200 bg-amber-50 text-amber-800",
};

const toneBarClasses: Record<PostgresStatusTone, string> = {
  success: "bg-[#8dc63f]",
  attention: "bg-amber-400",
  danger: "bg-red-500",
  info: "bg-blue-400",
  neutral: "bg-gray-300",
  muted: "bg-gray-300",
  prospect: "bg-slate-300",
  exploration: "bg-blue-400",
  pre_feasibility: "bg-violet-400",
  feasibility: "bg-teal-400",
  construction: "bg-[#8dc63f]",
  operating: "bg-[#3f8f2f]",
  cancelled: "bg-red-500",
  retired: "bg-gray-400",
  pilot: "bg-amber-400",
};

const reviewStatusTones: Record<string, PostgresStatusTone> = {
  draft: "muted",
  needs_review: "attention",
  validation: "info",
  ready_for_validation: "info",
  approved: "success",
  export_ready: "success",
  needs_update: "attention",
  returned_for_review: "attention",
  archived: "muted",
  rejected: "danger",
};

const lifecycleStatusTones: Record<string, PostgresStatusTone> = {
  prospect_tbd: "prospect",
  prospect: "prospect",
  exploration: "exploration",
  pre_feasibility: "pre_feasibility",
  feasibility: "feasibility",
  construction: "construction",
  under_construction: "construction",
  operating: "operating",
  partially_operating: "attention",
  temporarily_offline: "pilot",
  idle_suspended: "pilot",
  suspended: "pilot",
  test_pilot: "pilot",
  pilot: "pilot",
  retired_decommissioned: "retired",
  retired: "retired",
  decommissioned: "retired",
  under_refurbishment: "pilot",
  under_rehabilitation: "pilot",
  cancelled: "cancelled",
  cancelled_before_operation: "cancelled",
  unknown: "neutral",
};

const sourceStatusTones: Record<string, PostgresStatusTone> = {
  credible: "success",
  needs_review: "attention",
  weak: "attention",
  outdated: "attention",
  rejected: "danger",
  archived: "muted",
};

const visibilityStatusTones: Record<string, PostgresStatusTone> = {
  public: "success",
  internal_only: "info",
  stakeholder_confirmation: "attention",
  ai_generated_needs_review: "attention",
  client_confidential: "danger",
  not_for_publication: "danger",
};

const confidenceStatusTones: Record<string, PostgresStatusTone> = {
  high: "success",
  medium: "attention",
  low: "danger",
  unknown: "neutral",
  verified: "success",
  reported: "attention",
  estimated: "attention",
  inferred: "attention",
  confirmed: "success",
  open_review: "info",
  confirmed_not_written: "info",
  apply_ready: "attention",
  ready_to_apply: "attention",
  applied_to_record: "success",
  applied: "success",
  rejected: "danger",
  superseded: "muted",
  needs_review: "attention",
  suggested_high_confidence: "success",
  suggested_medium_confidence: "attention",
  suggested_low_confidence: "danger",
  suggested_needs_review: "attention",
};

const severityTones: Record<string, PostgresStatusTone> = {
  critical: "danger",
  blocker: "danger",
  error: "danger",
  important: "attention",
  warning: "attention",
  export_blocker: "danger",
  blocks_export: "danger",
  workflow: "info",
  review_workflow: "info",
  useful: "neutral",
  advisory: "neutral",
};

const genericStatusTones: Record<string, PostgresStatusTone> = {
  active: "success",
  applied: "success",
  clean: "success",
  complete: "success",
  completed: "success",
  confirmed: "success",
  dismissed: "muted",
  done: "success",
  evidence_pending: "attention",
  in_progress: "info",
  new: "info",
  open: "info",
  pending: "attention",
  rejected: "danger",
  resolved: "success",
  reviewed: "success",
  review: "attention",
  suggested: "attention",
  superseded: "muted",
  blocked: "danger",
  blocker: "danger",
  warning: "attention",
  ready: "success",
  not_ready: "danger",
};

const statusLabelOverrides: Record<string, string> = {
  ai_generated_needs_review: "AI Generated - Needs Review",
  applied_to_record: "Applied To Record",
  apply_ready: "Ready To Apply",
  blocks_export: "Blocks Export",
  client_confidential: "Client Confidential",
  confirmed_not_written: "Confirmed - Not Written",
  export_blocker: "Export Blocker",
  export_ready: "Export Ready",
  internal_only: "Internal Only",
  idle_suspended: "Idle / Suspended",
  needs_review: "Needs Review",
  needs_update: "Needs Update",
  not_for_publication: "Not For Publication",
  not_ready: "Not Ready",
  open_review: "Open Review",
  partially_operating: "Partially Operating",
  pre_feasibility: "Pre-Feasibility",
  prospect_tbd: "Prospect",
  ready_for_validation: "Ready For Validation",
  ready_to_apply: "Ready To Apply",
  retired_decommissioned: "Retired / Decommissioned",
  returned_for_review: "Returned For Review",
  review_workflow: "Review Workflow",
  stakeholder_confirmation: "Stakeholder Confirmation",
  suggested_high_confidence: "Suggested - High Confidence",
  suggested_low_confidence: "Suggested - Low Confidence",
  suggested_medium_confidence: "Suggested - Medium Confidence",
  suggested_needs_review: "Suggested - Needs Review",
  temporarily_offline: "Temporarily Offline",
  test_pilot: "Test / Pilot",
  under_construction: "Under Construction",
  under_rehabilitation: "Under Rehabilitation",
  under_refurbishment: "Under Refurbishment",
};

function normalizeStatus(value: string | null | undefined) {
  return String(value || "unknown").trim().toLowerCase().replace(/\s+/g, "_");
}

export function formatStatusLabel(value: string | null | undefined) {
  const normalized = String(value || "unknown").trim();

  if (!normalized) {
    return "Unknown";
  }

  const normalizedKey = normalizeStatus(normalized);

  if (statusLabelOverrides[normalizedKey]) {
    return statusLabelOverrides[normalizedKey];
  }

  return normalized
    .replaceAll("_", " ")
    .replace(/\bmw\b/gi, "MWe")
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

  if (domain === "visibility") {
    return visibilityStatusTones[normalized] || "neutral";
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
  if (visibilityStatusTones[normalized]) return visibilityStatusTones[normalized];
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

export function postgresStatusBarClass(tone: PostgresStatusTone) {
  return toneBarClasses[tone];
}

export function postgresStatusClassForValue(
  value: string | null | undefined,
  domain: PostgresStatusDomain = "generic"
) {
  return postgresStatusToneClass(postgresStatusTone(value, domain));
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
