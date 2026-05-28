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
  success:
    "border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] text-[var(--tge-governance-success-text)]",
  attention:
    "border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] text-[var(--tge-governance-attention-text)]",
  danger:
    "border-[var(--tge-governance-danger-border)] bg-[var(--tge-governance-danger-bg)] text-[var(--tge-governance-danger-text)]",
  info:
    "border-[var(--tge-governance-info-border)] bg-[var(--tge-governance-info-bg)] text-[var(--tge-governance-info-text)]",
  neutral:
    "border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] text-[var(--tge-governance-neutral-text)]",
  muted:
    "border-[var(--tge-governance-muted-border)] bg-[var(--tge-governance-muted-bg)] text-[var(--tge-governance-muted-text)]",
  prospect:
    "border-[var(--tge-lifecycle-prospect-border)] bg-[var(--tge-lifecycle-prospect-bg)] text-[var(--tge-lifecycle-prospect-text)]",
  exploration:
    "border-[var(--tge-lifecycle-exploration-border)] bg-[var(--tge-lifecycle-exploration-bg)] text-[var(--tge-lifecycle-exploration-text)]",
  pre_feasibility:
    "border-[var(--tge-lifecycle-pre-feasibility-border)] bg-[var(--tge-lifecycle-pre-feasibility-bg)] text-[var(--tge-lifecycle-pre-feasibility-text)]",
  feasibility:
    "border-[var(--tge-lifecycle-feasibility-border)] bg-[var(--tge-lifecycle-feasibility-bg)] text-[var(--tge-lifecycle-feasibility-text)]",
  construction:
    "border-[var(--tge-lifecycle-construction-border)] bg-[var(--tge-lifecycle-construction-bg)] text-[var(--tge-lifecycle-construction-text)]",
  operating:
    "border-[var(--tge-lifecycle-operating-border)] bg-[var(--tge-lifecycle-operating-bg)] text-[var(--tge-lifecycle-operating-text)]",
  cancelled:
    "border-[var(--tge-lifecycle-cancelled-border)] bg-[var(--tge-lifecycle-cancelled-bg)] text-[var(--tge-lifecycle-cancelled-text)]",
  retired:
    "border-[var(--tge-lifecycle-retired-border)] bg-[var(--tge-lifecycle-retired-bg)] text-[var(--tge-lifecycle-retired-text)]",
  pilot:
    "border-[var(--tge-lifecycle-pilot-border)] bg-[var(--tge-lifecycle-pilot-bg)] text-[var(--tge-lifecycle-pilot-text)]",
};

const toneBarClasses: Record<PostgresStatusTone, string> = {
  success: "bg-[var(--tge-status-bar-success)]",
  attention: "bg-[var(--tge-status-bar-attention)]",
  danger: "bg-[var(--tge-status-bar-danger)]",
  info: "bg-[var(--tge-status-bar-info)]",
  neutral: "bg-[var(--tge-status-bar-neutral)]",
  muted: "bg-[var(--tge-status-bar-muted)]",
  prospect: "bg-[var(--tge-status-bar-muted)]",
  exploration: "bg-[var(--tge-status-bar-info)]",
  pre_feasibility: "bg-[var(--tge-status-bar-pre-feasibility)]",
  feasibility: "bg-[var(--tge-status-bar-feasibility)]",
  construction: "bg-[var(--tge-status-bar-success)]",
  operating: "bg-[var(--tge-status-bar-operating)]",
  cancelled: "bg-[var(--tge-status-bar-danger)]",
  retired: "bg-[var(--tge-status-bar-muted)]",
  pilot: "bg-[var(--tge-status-bar-attention)]",
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
