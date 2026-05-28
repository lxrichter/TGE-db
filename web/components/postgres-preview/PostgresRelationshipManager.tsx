"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import type {
  PostgresCompanyOperatingAssetLink,
  PostgresCompanyProjectLink,
  PostgresCompanyRelationship,
  PostgresCompanyRelationshipReferenceData,
  PostgresEntitySourceLink,
  PostgresRelationshipSourceTargetType,
} from "@/lib/postgres-preview";
import { formatCount } from "@/lib/format";
import PostgresStatusBadge from "@/components/postgres-preview/PostgresStatusBadge";

type RoleLinkForm = {
  company_id: string;
  project_id: string;
  operating_asset_id: string;
  role_code: string;
  role_detail: string;
  ownership_share: string;
  is_primary: boolean;
  notes: string;
};

type RelationshipForm = {
  company_id_to: string;
  relationship_type_code: string;
  ownership_percentage: string;
  is_current: boolean;
  notes: string;
};

async function safeJson(res: Response) {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function inputClass() {
  return "min-h-10 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 py-2 text-sm font-medium normal-case tracking-normal text-[var(--tge-text-primary)] outline-none focus:border-[var(--tge-brand-green)]";
}

function primaryActionClass() {
  return "h-10 self-end border border-[var(--tge-brand-green)] bg-[var(--tge-brand-green)] px-4 text-sm font-semibold text-[var(--tge-surface-card)] hover:bg-[var(--tge-brand-green-dark)] disabled:cursor-not-allowed disabled:opacity-60";
}

function checkboxShellClass() {
  return "flex min-h-10 items-center justify-center gap-2 self-end border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 text-sm font-semibold text-[var(--tge-governance-neutral-text)] xl:justify-start";
}

function tableHeadClass() {
  return "bg-[var(--tge-governance-neutral-bg)] text-[11px] uppercase tracking-wide text-[var(--tge-governance-muted-text)]";
}

function tableBodyClass() {
  return "divide-y divide-[var(--tge-governance-muted-border)]";
}

function entityLinkClass() {
  return "font-semibold text-[var(--tge-text-primary)] hover:text-[var(--tge-brand-green-dark)] hover:underline";
}

function Field({
  label,
  children,
  required = false,
  important = false,
  approvalSensitive = false,
  workflow = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  important?: boolean;
  approvalSensitive?: boolean;
  workflow?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2 border border-transparent px-3 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
      <span className="flex flex-wrap items-center gap-2">
        {label}
        {required ? (
          <span className="border border-[var(--tge-governance-danger-border)] bg-[var(--tge-governance-danger-bg)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--tge-governance-danger-text)]">
            Required
          </span>
        ) : null}
        {important ? (
          <span className="border border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--tge-governance-attention-text)]">
            Important
          </span>
        ) : null}
        {approvalSensitive ? (
          <span className="border border-[var(--tge-governance-info-border)] bg-[var(--tge-governance-info-bg)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--tge-governance-info-text)]">
            Approval Field
          </span>
        ) : null}
        {workflow ? (
          <span className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--tge-governance-neutral-text)]">
            Workflow
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

function RelationshipGovernanceNotice({
  scope,
}: {
  scope: "project" | "asset" | "company";
}) {
  const title =
    scope === "project"
      ? "Project Relationship Rules"
      : scope === "asset"
        ? "Plant Relationship Rules"
        : "Company Relationship Rules";
  const primaryLabel =
    scope === "project"
      ? "Structured Roles"
      : scope === "asset"
        ? "Structured Roles"
        : "Ownership / Group Links";
  const primaryText =
    scope === "project"
      ? "Developer, owner, operator, supplier, investor, and similar roles belong here as structured links."
      : scope === "asset"
        ? "Owner, operator, supplier, EPC, offtaker, and O&M roles belong here as structured links."
        : "Parent, subsidiary, JV, consortium, acquisition, and shareholder links stay separate from activity roles.";
  const shareLabel =
    scope === "project"
      ? "Project Share"
      : scope === "asset"
        ? "Plant Share"
        : "Ownership Share";
  const shareText =
    scope === "company"
      ? "Use ownership percentage for company-to-company or group relationships where it is known."
      : "Use the percentage field only when the source supports a project or plant participation share.";

  return (
    <details className="group border border-[var(--tge-governance-info-border)] bg-[var(--tge-governance-info-bg)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 marker:hidden">
        <div className="max-w-sm">
          <h4 className="text-xs font-bold uppercase tracking-wide text-[var(--tge-governance-info-text)]">
            {title}
          </h4>
          <p className="mt-1 text-sm leading-6 text-[var(--tge-governance-info-text)]">
            Structured roles, shares, and evidence rules. Expand only when
            guidance is needed.
          </p>
        </div>
        <span className="shrink-0 border border-[var(--tge-governance-info-border)] bg-[var(--tge-surface-card)] px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--tge-governance-info-text)]">
          Details
        </span>
      </summary>
      <div className="border-t border-[var(--tge-governance-info-border)] px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm">
            <p className="text-sm leading-6 text-[var(--tge-governance-info-text)]">
              These links feed analytics, Research Ops, profile pages, and
              exports. Removing one does not delete the underlying project,
              plant, or company record.
            </p>
          </div>
          <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-3">
            <div className="border border-[var(--tge-governance-info-border)] bg-[var(--tge-surface-card)] px-3 py-2">
              <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--tge-governance-info-text)]">
                {primaryLabel}
              </div>
              <p className="mt-1 text-xs leading-5 text-[var(--tge-governance-info-text)]">
                {primaryText}
              </p>
            </div>
            <div className="border border-[var(--tge-governance-info-border)] bg-[var(--tge-surface-card)] px-3 py-2">
              <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--tge-governance-info-text)]">
                {shareLabel}
              </div>
              <p className="mt-1 text-xs leading-5 text-[var(--tge-governance-info-text)]">
                {shareText}
              </p>
            </div>
            <div className="border border-[var(--tge-governance-info-border)] bg-[var(--tge-surface-card)] px-3 py-2">
              <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--tge-governance-info-text)]">
                Evidence And Notes
              </div>
              <p className="mt-1 text-xs leading-5 text-[var(--tge-governance-info-text)]">
                Evidence should support important links. Notes explain
                uncertainty or context, but do not replace structured
                relationship data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]">
      <div className="border-b border-[var(--tge-governance-neutral-border)] px-5 py-4">
        <h2 className="text-lg font-bold text-[var(--tge-text-primary)]">
          {title}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--tge-text-secondary)]">
          {description}
        </p>
      </div>
      <div className="space-y-5 px-5 py-5">{children}</div>
    </section>
  );
}

function Notice({
  error,
  message,
}: {
  error: string;
  message: string;
}) {
  return (
    <>
      {error ? (
        <div className="border border-[var(--tge-governance-danger-border)] bg-[var(--tge-governance-danger-bg)] px-4 py-3 text-sm font-medium text-[var(--tge-governance-danger-text)]">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="border border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] px-4 py-3 text-sm font-medium text-[var(--tge-governance-success-text)]">
          {message}
        </div>
      ) : null}
    </>
  );
}

function formatPercent(value: number | null) {
  if (value === null || value === undefined) {
    return "-";
  }

  return `${value.toLocaleString(undefined, {
    maximumFractionDigits: 4,
  })}%`;
}

function firstRole(referenceData: PostgresCompanyRelationshipReferenceData) {
  return referenceData.companyRoles[0]?.code || "owner";
}

function firstRelationshipType(
  referenceData: PostgresCompanyRelationshipReferenceData
) {
  return referenceData.relationshipTypes[0]?.code || "ownership";
}

function initialRoleLinkForm(
  referenceData: PostgresCompanyRelationshipReferenceData
): RoleLinkForm {
  return {
    company_id: referenceData.companies[0]?.company_id || "",
    project_id: referenceData.projects[0]?.project_id || "",
    operating_asset_id: referenceData.operatingAssets[0]?.operating_asset_id || "",
    role_code: firstRole(referenceData),
    role_detail: "",
    ownership_share: "",
    is_primary: false,
    notes: "",
  };
}

function initialRelationshipForm(
  referenceData: PostgresCompanyRelationshipReferenceData,
  companyId: string
): RelationshipForm {
  const firstRelatedCompany = referenceData.companies.find(
    (company) => company.company_id !== companyId
  );

  return {
    company_id_to: firstRelatedCompany?.company_id || "",
    relationship_type_code: firstRelationshipType(referenceData),
    ownership_percentage: "",
    is_current: true,
    notes: "",
  };
}

function RoleOptions({
  value,
  onChange,
  referenceData,
}: {
  value: string;
  onChange: (value: string) => void;
  referenceData: PostgresCompanyRelationshipReferenceData;
}) {
  return (
    <select
      className={inputClass()}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {referenceData.companyRoles.map((role) => (
        <option key={role.code} value={role.code}>
          {role.label}
        </option>
      ))}
    </select>
  );
}

function RoleBadge({ role }: { role: string | null }) {
  return (
    <span className="inline-flex min-h-[28px] items-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] px-2 text-xs font-semibold text-[var(--tge-governance-neutral-text)]">
      {role || "unknown"}
    </span>
  );
}

function RelationshipEvidenceBadge({ count }: { count: number }) {
  return (
    <PostgresStatusBadge
      label={`${formatCount(count)} source${count === 1 ? "" : "s"}`}
      value={count > 0 ? "confirmed" : "evidence_pending"}
    />
  );
}

function sourceOptionLabel(source: PostgresEntitySourceLink) {
  return (
    source.source_title ||
    source.source_reference ||
    source.source_url ||
    source.source_id
  );
}

function uniqueSourceOptions(sources: PostgresEntitySourceLink[] = []) {
  const seen = new Set<string>();
  return sources.filter((source) => {
    if (seen.has(source.source_id)) {
      return false;
    }

    seen.add(source.source_id);
    return true;
  });
}

function RelationshipEvidenceLinker({
  evidenceType,
  sources = [],
  targetId,
  targetType,
}: {
  evidenceType: string;
  sources?: PostgresEntitySourceLink[];
  targetId: string;
  targetType: PostgresRelationshipSourceTargetType;
}) {
  const router = useRouter();
  const sourceOptions = useMemo(() => uniqueSourceOptions(sources), [sources]);
  const [sourceId, setSourceId] = useState(sourceOptions[0]?.source_id || "");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const selectedSourceId = sourceId || sourceOptions[0]?.source_id || "";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!selectedSourceId) {
      setError("Add entity-level source evidence first.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/postgres-preview/relationship-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_id: selectedSourceId,
          target_type: targetType,
          target_id: targetId,
          evidence_type: evidenceType,
          confidence_status_code: "reported",
        }),
      });
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to link evidence.");
      }

      setMessage("Evidence linked.");
      setExpanded(false);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to link evidence.");
    } finally {
      setSaving(false);
    }
  }

  if (sourceOptions.length === 0) {
    return (
      <div className="mt-2 text-[11px] font-medium leading-4 text-[var(--tge-governance-attention-text)]">
        Add record source first
      </div>
    );
  }

  if (!expanded) {
    return (
      <button
        className="mt-2 min-h-7 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-2 text-[11px] font-semibold text-[var(--tge-governance-neutral-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)]"
        type="button"
        onClick={() => setExpanded(true)}
      >
        Link evidence
      </button>
    );
  }

  return (
    <form
      className="mt-2 space-y-2 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] p-2"
      onSubmit={handleSubmit}
    >
      <select
        className="min-h-8 w-full border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-2 py-1 text-xs font-medium text-[var(--tge-text-primary)] outline-none focus:border-[var(--tge-brand-green)]"
        value={selectedSourceId}
        onChange={(event) => setSourceId(event.target.value)}
      >
        {sourceOptions.map((source) => (
          <option key={source.source_id} value={source.source_id}>
            {sourceOptionLabel(source)}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <button
          className="min-h-8 border border-[var(--tge-brand-green)] bg-[var(--tge-surface-card)] px-2 text-xs font-semibold text-[var(--tge-brand-green-dark)] hover:bg-[var(--tge-governance-success-bg)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving || !selectedSourceId}
          type="submit"
        >
          {saving ? "Linking..." : "Save"}
        </button>
        <button
          className="min-h-8 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-2 text-xs font-semibold text-[var(--tge-text-secondary)] hover:bg-[var(--tge-surface-subtle)]"
          type="button"
          onClick={() => {
            setExpanded(false);
            setError("");
          }}
        >
          Cancel
        </button>
      </div>
      {error ? (
        <div className="text-[11px] font-medium leading-4 text-[var(--tge-governance-danger-text)]">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="text-[11px] font-medium leading-4 text-[var(--tge-governance-success-text)]">
          {message}
        </div>
      ) : null}
    </form>
  );
}

function RelationshipSummaryTile({
  label,
  value,
  note,
  status,
}: {
  label: string;
  value: string;
  note: string;
  status?: string;
}) {
  return (
    <div className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
          {label}
        </div>
        {status ? <PostgresStatusBadge value={status} /> : null}
      </div>
      <div className="mt-2 text-2xl font-bold leading-none text-[var(--tge-text-primary)]">
        {value}
      </div>
      <div className="mt-2 text-xs leading-5 text-[var(--tge-governance-muted-text)]">
        {note}
      </div>
    </div>
  );
}

function RelationshipSupportSummary({
  activityLinkCount,
  companyRelationshipCount = 0,
  primaryOrCurrentCount,
  relationshipEvidenceCount,
  sources = [],
  scope,
}: {
  activityLinkCount: number;
  companyRelationshipCount?: number;
  primaryOrCurrentCount: number;
  relationshipEvidenceCount: number;
  sources?: PostgresEntitySourceLink[];
  scope: "project" | "asset" | "company";
}) {
  const credibleSourceCount = sources.filter(
    (source) => source.credibility_status_code === "credible"
  ).length;
  const totalRelationshipCount = activityLinkCount + companyRelationshipCount;
  const evidenceStatus =
    totalRelationshipCount === 0
      ? "draft"
      : sources.length === 0
        ? "needs_review"
        : relationshipEvidenceCount > 0 || credibleSourceCount > 0
          ? "credible"
          : "needs_review";
  const relationshipLabel =
    scope === "company" ? "Activity Roles" : "Structured Roles";
  const relationshipNote =
    scope === "project"
      ? "Developer, owner, operator, supplier, investor, or similar links."
      : scope === "asset"
        ? "Owner, operator, supplier, EPC, offtaker, or O&M links."
        : "Project and plant roles held by this company.";
  const governanceNote =
    scope === "company"
      ? "Current ownership, group, JV, or shareholder relationships."
      : "Primary roles or participation shares that need clear evidence.";
  const relationshipEvidenceNote =
    totalRelationshipCount === 0
      ? "No relationship evidence needed until structured links are added."
      : relationshipEvidenceCount > 0
        ? "Sources are linked to specific relationship rows."
        : "No sources are linked to specific relationship rows yet.";

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <RelationshipSummaryTile
        label={relationshipLabel}
        note={relationshipNote}
        status={totalRelationshipCount > 0 ? "active" : "needs_review"}
        value={formatCount(activityLinkCount)}
      />
      <RelationshipSummaryTile
        label="Record Sources"
        note={`${formatCount(credibleSourceCount)} credible source${
          credibleSourceCount === 1 ? "" : "s"
        } linked as general record evidence.`}
        status={evidenceStatus}
        value={formatCount(sources.length)}
      />
      <RelationshipSummaryTile
        label="Relationship Evidence"
        note={relationshipEvidenceNote}
        status={
          totalRelationshipCount === 0
            ? "draft"
            : relationshipEvidenceCount > 0
              ? "confirmed"
              : "evidence_pending"
        }
        value={formatCount(relationshipEvidenceCount)}
      />
      <RelationshipSummaryTile
        label={scope === "company" ? "Ownership / Group" : "Primary / Share"}
        note={governanceNote}
        status={
          (scope === "company" ? companyRelationshipCount : primaryOrCurrentCount) >
          0
            ? "confirmed"
            : "draft"
        }
        value={formatCount(
          scope === "company" ? companyRelationshipCount : primaryOrCurrentCount
        )}
      />
    </div>
  );
}

function confirmStructuredRelationshipRemoval(description: string) {
  return window.confirm(
    `Remove ${description}? This removes the structured relationship from this record but does not delete the underlying project, plant, or company.`
  );
}

function RemoveButton({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="h-8 border border-[var(--tge-governance-danger-border)] bg-[var(--tge-surface-card)] px-3 text-xs font-semibold text-[var(--tge-governance-danger-text)] hover:bg-[var(--tge-governance-danger-bg)] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      Remove
    </button>
  );
}

export function ProjectCompanyLinksPanel({
  projectId,
  links,
  referenceData,
  sources,
}: {
  projectId: string;
  links: PostgresCompanyProjectLink[];
  referenceData: PostgresCompanyRelationshipReferenceData;
  sources?: PostgresEntitySourceLink[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<RoleLinkForm>(() =>
    initialRoleLinkForm(referenceData)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/postgres-preview/company-project-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, project_id: projectId }),
      });
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to save company role.");
      }

      setForm(initialRoleLinkForm(referenceData));
      setMessage("Company role saved.");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to save company role."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(linkId: string) {
    const link = links.find(
      (companyLink) => companyLink.company_project_link_id === linkId
    );

    if (
      !confirmStructuredRelationshipRemoval(
        `the company role${link?.company_name ? ` for ${link.company_name}` : ""}`
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(
        `/api/postgres-preview/company-project-links/${linkId}`,
        { method: "DELETE" }
      );
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to remove company role.");
      }

      setMessage("Company role removed.");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to remove company role."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section
      title="Companies And Roles"
      description="Structured company-role links for this project."
    >
      <Notice error={error} message={message} />
      <RelationshipGovernanceNotice scope="project" />
      <RelationshipSupportSummary
        activityLinkCount={links.length}
        primaryOrCurrentCount={
          links.filter((link) => link.is_primary || link.ownership_share !== null)
            .length
        }
        relationshipEvidenceCount={links.reduce(
          (count, link) => count + link.relationship_source_count,
          0
        )}
        scope="project"
        sources={sources}
      />
      <form
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5"
        onSubmit={handleSubmit}
      >
        <Field label="Company" approvalSensitive required>
          <select
            className={inputClass()}
            value={form.company_id}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, company_id: event.target.value }))
            }
            required
          >
            {referenceData.companies.map((company) => (
              <option key={company.company_id} value={company.company_id}>
                {company.company_name}
                {company.headquarters_country
                  ? ` (${company.headquarters_country})`
                  : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Role" approvalSensitive required>
          <RoleOptions
            referenceData={referenceData}
            value={form.role_code}
            onChange={(value) => setForm((prev) => ({ ...prev, role_code: value }))}
          />
        </Field>
        <Field label="Role Detail" approvalSensitive important>
          <input
            className={inputClass()}
            value={form.role_detail}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, role_detail: event.target.value }))
            }
          />
        </Field>
        <Field label="Project Share %" approvalSensitive important>
          <input
            className={inputClass()}
            value={form.ownership_share}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, ownership_share: event.target.value }))
            }
          />
        </Field>
        <button
          className={primaryActionClass()}
          disabled={saving}
          type="submit"
        >
          {saving ? "Saving..." : "Add Role"}
        </button>
        <label className={checkboxShellClass()}>
          <input
            checked={form.is_primary}
            className="h-4 w-4 accent-[var(--tge-brand-green)]"
            type="checkbox"
            onChange={(event) =>
              setForm((prev) => ({ ...prev, is_primary: event.target.checked }))
            }
          />
          Primary role
        </label>
        <div className="xl:col-span-4">
          <Field label="Notes" workflow>
            <input
              className={inputClass()}
              value={form.notes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, notes: event.target.value }))
              }
            />
          </Field>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-[1120px] table-fixed text-left text-sm">
          <thead className={tableHeadClass()}>
            <tr>
              <th className="w-[24%] px-4 py-3 font-semibold">Company</th>
              <th className="w-[16%] px-4 py-3 font-semibold">Role</th>
              <th className="w-[12%] px-4 py-3 font-semibold">Share</th>
              <th className="w-[14%] px-4 py-3 font-semibold">Evidence</th>
              <th className="w-[22%] px-4 py-3 font-semibold">Notes</th>
              <th className="w-[12%] px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className={tableBodyClass()}>
            {links.map((link) => (
              <tr
                key={link.company_project_link_id}
                className="align-top hover:bg-[var(--tge-surface-subtle)]"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/postgres-preview/companies/${link.company_id}`}
                    className={entityLinkClass()}
                  >
                    {link.company_name}
                  </Link>
                  <div className="mt-1 text-xs text-[var(--tge-governance-muted-text)]">
                    {link.legacy_company_id || link.company_id}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <RoleBadge role={link.role_label || link.role_code} />
                  {link.is_primary ? (
                    <div className="mt-2 text-xs font-semibold text-[var(--tge-brand-green-dark)]">
                      Primary
                    </div>
                  ) : null}
                  {link.role_detail ? (
                    <div className="mt-1 text-xs text-[var(--tge-governance-muted-text)]">
                      {link.role_detail}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-[var(--tge-governance-neutral-text)]">
                  {formatPercent(link.ownership_share)}
                </td>
                <td className="px-4 py-3">
                  <RelationshipEvidenceBadge count={link.relationship_source_count} />
                  <RelationshipEvidenceLinker
                    evidenceType="project_company_role"
                    sources={sources}
                    targetId={link.company_project_link_id}
                    targetType="company_project_link"
                  />
                </td>
                <td className="px-4 py-3 text-[var(--tge-governance-neutral-text)]">
                  {link.notes || "-"}
                </td>
                <td className="px-4 py-3">
                  <RemoveButton
                    disabled={saving}
                    onClick={() => handleDelete(link.company_project_link_id)}
                  />
                </td>
              </tr>
            ))}
            {links.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-[var(--tge-governance-muted-text)]"
                >
                  No structured company roles linked yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

export function OperatingAssetCompanyLinksPanel({
  operatingAssetId,
  links,
  referenceData,
  sources,
}: {
  operatingAssetId: string;
  links: PostgresCompanyOperatingAssetLink[];
  referenceData: PostgresCompanyRelationshipReferenceData;
  sources?: PostgresEntitySourceLink[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<RoleLinkForm>(() =>
    initialRoleLinkForm(referenceData)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(
        "/api/postgres-preview/company-operating-asset-links",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            operating_asset_id: operatingAssetId,
          }),
        }
      );
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to save company role.");
      }

      setForm(initialRoleLinkForm(referenceData));
      setMessage("Company role saved.");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to save company role."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(linkId: string) {
    const link = links.find(
      (companyLink) => companyLink.company_operating_asset_link_id === linkId
    );

    if (
      !confirmStructuredRelationshipRemoval(
        `the company role${link?.company_name ? ` for ${link.company_name}` : ""}`
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(
        `/api/postgres-preview/company-operating-asset-links/${linkId}`,
        { method: "DELETE" }
      );
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to remove company role.");
      }

      setMessage("Company role removed.");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to remove company role."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section
      title="Companies And Roles"
      description="Structured company-role links for this plant."
    >
      <Notice error={error} message={message} />
      <RelationshipGovernanceNotice scope="asset" />
      <RelationshipSupportSummary
        activityLinkCount={links.length}
        primaryOrCurrentCount={
          links.filter((link) => link.is_primary || link.ownership_share !== null)
            .length
        }
        relationshipEvidenceCount={links.reduce(
          (count, link) => count + link.relationship_source_count,
          0
        )}
        scope="asset"
        sources={sources}
      />
      <form
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5"
        onSubmit={handleSubmit}
      >
        <Field label="Company" approvalSensitive required>
          <select
            className={inputClass()}
            value={form.company_id}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, company_id: event.target.value }))
            }
            required
          >
            {referenceData.companies.map((company) => (
              <option key={company.company_id} value={company.company_id}>
                {company.company_name}
                {company.headquarters_country
                  ? ` (${company.headquarters_country})`
                  : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Role" approvalSensitive required>
          <RoleOptions
            referenceData={referenceData}
            value={form.role_code}
            onChange={(value) => setForm((prev) => ({ ...prev, role_code: value }))}
          />
        </Field>
        <Field label="Role Detail" approvalSensitive important>
          <input
            className={inputClass()}
            value={form.role_detail}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, role_detail: event.target.value }))
            }
          />
        </Field>
        <Field label="Plant Share %" approvalSensitive important>
          <input
            className={inputClass()}
            value={form.ownership_share}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, ownership_share: event.target.value }))
            }
          />
        </Field>
        <button
          className={primaryActionClass()}
          disabled={saving}
          type="submit"
        >
          {saving ? "Saving..." : "Add Role"}
        </button>
        <label className={checkboxShellClass()}>
          <input
            checked={form.is_primary}
            className="h-4 w-4 accent-[var(--tge-brand-green)]"
            type="checkbox"
            onChange={(event) =>
              setForm((prev) => ({ ...prev, is_primary: event.target.checked }))
            }
          />
          Primary role
        </label>
        <div className="xl:col-span-4">
          <Field label="Notes" workflow>
            <input
              className={inputClass()}
              value={form.notes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, notes: event.target.value }))
              }
            />
          </Field>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-[1120px] table-fixed text-left text-sm">
          <thead className={tableHeadClass()}>
            <tr>
              <th className="w-[24%] px-4 py-3 font-semibold">Company</th>
              <th className="w-[16%] px-4 py-3 font-semibold">Role</th>
              <th className="w-[12%] px-4 py-3 font-semibold">Share</th>
              <th className="w-[14%] px-4 py-3 font-semibold">Evidence</th>
              <th className="w-[22%] px-4 py-3 font-semibold">Notes</th>
              <th className="w-[12%] px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className={tableBodyClass()}>
            {links.map((link) => (
              <tr
                key={link.company_operating_asset_link_id}
                className="align-top hover:bg-[var(--tge-surface-subtle)]"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/postgres-preview/companies/${link.company_id}`}
                    className={entityLinkClass()}
                  >
                    {link.company_name}
                  </Link>
                  <div className="mt-1 text-xs text-[var(--tge-governance-muted-text)]">
                    {link.legacy_company_id || link.company_id}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <RoleBadge role={link.role_label || link.role_code} />
                  {link.is_primary ? (
                    <div className="mt-2 text-xs font-semibold text-[var(--tge-brand-green-dark)]">
                      Primary
                    </div>
                  ) : null}
                  {link.role_detail ? (
                    <div className="mt-1 text-xs text-[var(--tge-governance-muted-text)]">
                      {link.role_detail}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-[var(--tge-governance-neutral-text)]">
                  {formatPercent(link.ownership_share)}
                </td>
                <td className="px-4 py-3">
                  <RelationshipEvidenceBadge count={link.relationship_source_count} />
                  <RelationshipEvidenceLinker
                    evidenceType="asset_company_role"
                    sources={sources}
                    targetId={link.company_operating_asset_link_id}
                    targetType="company_operating_asset_link"
                  />
                </td>
                <td className="px-4 py-3 text-[var(--tge-governance-neutral-text)]">
                  {link.notes || "-"}
                </td>
                <td className="px-4 py-3">
                  <RemoveButton
                    disabled={saving}
                    onClick={() =>
                      handleDelete(link.company_operating_asset_link_id)
                    }
                  />
                </td>
              </tr>
            ))}
            {links.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-[var(--tge-governance-muted-text)]"
                >
                  No structured company roles linked yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function CompanyProjectPortfolio({
  companyId,
  links,
  referenceData,
  sources,
}: {
  companyId: string;
  links: PostgresCompanyProjectLink[];
  referenceData: PostgresCompanyRelationshipReferenceData;
  sources?: PostgresEntitySourceLink[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<RoleLinkForm>(() =>
    initialRoleLinkForm(referenceData)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/postgres-preview/company-project-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, company_id: companyId }),
      });
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to save project role.");
      }

      setForm(initialRoleLinkForm(referenceData));
      setMessage("Project role saved.");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to save project role."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(linkId: string) {
    const link = links.find(
      (projectLink) => projectLink.company_project_link_id === linkId
    );

    if (
      !confirmStructuredRelationshipRemoval(
        `the project role${link?.project_name ? ` for ${link.project_name}` : ""}`
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(
        `/api/postgres-preview/company-project-links/${linkId}`,
        { method: "DELETE" }
      );
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to remove project role.");
      }

      setMessage("Project role removed.");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to remove project role."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Notice error={error} message={message} />
      <RelationshipGovernanceNotice scope="project" />
      <form
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5"
        onSubmit={handleSubmit}
      >
        <Field label="Project" approvalSensitive required>
          <select
            className={inputClass()}
            value={form.project_id}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, project_id: event.target.value }))
            }
            required
          >
            {referenceData.projects.map((project) => (
              <option key={project.project_id} value={project.project_id}>
                {project.project_name}
                {project.country ? ` (${project.country})` : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Role" approvalSensitive required>
          <RoleOptions
            referenceData={referenceData}
            value={form.role_code}
            onChange={(value) => setForm((prev) => ({ ...prev, role_code: value }))}
          />
        </Field>
        <Field label="Role Detail" approvalSensitive important>
          <input
            className={inputClass()}
            value={form.role_detail}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, role_detail: event.target.value }))
            }
          />
        </Field>
        <Field label="Project Share %" approvalSensitive important>
          <input
            className={inputClass()}
            value={form.ownership_share}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, ownership_share: event.target.value }))
            }
          />
        </Field>
        <button
          className={primaryActionClass()}
          disabled={saving}
          type="submit"
        >
          {saving ? "Saving..." : "Add Project Role"}
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-[1120px] table-fixed text-left text-sm">
          <tbody className={tableBodyClass()}>
            {links.map((link) => (
              <tr
                key={link.company_project_link_id}
                className="align-top hover:bg-[var(--tge-surface-subtle)]"
              >
                <td className="w-[34%] px-4 py-3">
                  <Link
                    href={`/postgres-preview/projects/${link.project_id}`}
                    className={entityLinkClass()}
                  >
                    {link.project_name}
                  </Link>
                  <div className="mt-1 text-xs text-[var(--tge-governance-muted-text)]">
                    {link.country || "-"}
                  </div>
                </td>
                <td className="w-[22%] px-4 py-3">
                  <RoleBadge role={link.role_label || link.role_code} />
                  <div className="mt-2">
                    <RelationshipEvidenceBadge
                      count={link.relationship_source_count}
                    />
                  </div>
                  <RelationshipEvidenceLinker
                    evidenceType="project_company_role"
                    sources={sources}
                    targetId={link.company_project_link_id}
                    targetType="company_project_link"
                  />
                </td>
                <td className="w-[18%] px-4 py-3 text-[var(--tge-governance-neutral-text)]">
                  {formatPercent(link.ownership_share)}
                </td>
                <td className="w-[16%] px-4 py-3 text-[var(--tge-governance-neutral-text)]">
                  {link.is_primary ? "Primary" : "-"}
                </td>
                <td className="w-[10%] px-4 py-3">
                  <RemoveButton
                    disabled={saving}
                    onClick={() => handleDelete(link.company_project_link_id)}
                  />
                </td>
              </tr>
            ))}
            {links.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-[var(--tge-governance-muted-text)]"
                >
                  No linked projects yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompanyAssetPortfolio({
  companyId,
  links,
  referenceData,
  sources,
}: {
  companyId: string;
  links: PostgresCompanyOperatingAssetLink[];
  referenceData: PostgresCompanyRelationshipReferenceData;
  sources?: PostgresEntitySourceLink[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<RoleLinkForm>(() =>
    initialRoleLinkForm(referenceData)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(
        "/api/postgres-preview/company-operating-asset-links",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, company_id: companyId }),
        }
      );
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to save plant role.");
      }

      setForm(initialRoleLinkForm(referenceData));
      setMessage("Plant role saved.");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save plant role."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(linkId: string) {
    const link = links.find(
      (assetLink) => assetLink.company_operating_asset_link_id === linkId
    );

    if (
      !confirmStructuredRelationshipRemoval(
        `the plant role${
          link?.asset_name ? ` for ${link.asset_name}` : ""
        }`
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(
        `/api/postgres-preview/company-operating-asset-links/${linkId}`,
        { method: "DELETE" }
      );
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to remove plant role.");
      }

      setMessage("Plant role removed.");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to remove plant role."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Notice error={error} message={message} />
      <RelationshipGovernanceNotice scope="asset" />
      <form
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5"
        onSubmit={handleSubmit}
      >
        <Field label="Plant" approvalSensitive required>
          <select
            className={inputClass()}
            value={form.operating_asset_id}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                operating_asset_id: event.target.value,
              }))
            }
            required
          >
            {referenceData.operatingAssets.map((asset) => (
              <option key={asset.operating_asset_id} value={asset.operating_asset_id}>
                {asset.asset_name}
                {asset.country ? ` (${asset.country})` : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Role" approvalSensitive required>
          <RoleOptions
            referenceData={referenceData}
            value={form.role_code}
            onChange={(value) => setForm((prev) => ({ ...prev, role_code: value }))}
          />
        </Field>
        <Field label="Role Detail" approvalSensitive important>
          <input
            className={inputClass()}
            value={form.role_detail}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, role_detail: event.target.value }))
            }
          />
        </Field>
        <Field label="Plant Share %" approvalSensitive important>
          <input
            className={inputClass()}
            value={form.ownership_share}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, ownership_share: event.target.value }))
            }
          />
        </Field>
        <button
          className={primaryActionClass()}
          disabled={saving}
          type="submit"
        >
          {saving ? "Saving..." : "Add Plant Role"}
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-[1120px] table-fixed text-left text-sm">
          <tbody className={tableBodyClass()}>
            {links.map((link) => (
              <tr
                key={link.company_operating_asset_link_id}
                className="align-top hover:bg-[var(--tge-surface-subtle)]"
              >
                <td className="w-[34%] px-4 py-3">
                  <Link
                    href={`/postgres-preview/operating-assets/${link.operating_asset_id}`}
                    className={entityLinkClass()}
                  >
                    {link.asset_name}
                  </Link>
                  <div className="mt-1 text-xs text-[var(--tge-governance-muted-text)]">
                    {link.country || "-"}
                  </div>
                </td>
                <td className="w-[22%] px-4 py-3">
                  <RoleBadge role={link.role_label || link.role_code} />
                  <div className="mt-2">
                    <RelationshipEvidenceBadge
                      count={link.relationship_source_count}
                    />
                  </div>
                  <RelationshipEvidenceLinker
                    evidenceType="asset_company_role"
                    sources={sources}
                    targetId={link.company_operating_asset_link_id}
                    targetType="company_operating_asset_link"
                  />
                </td>
                <td className="w-[18%] px-4 py-3 text-[var(--tge-governance-neutral-text)]">
                  {formatPercent(link.ownership_share)}
                </td>
                <td className="w-[16%] px-4 py-3 text-[var(--tge-governance-neutral-text)]">
                  {link.is_primary ? "Primary" : "-"}
                </td>
                <td className="w-[10%] px-4 py-3">
                  <RemoveButton
                    disabled={saving}
                    onClick={() =>
                      handleDelete(link.company_operating_asset_link_id)
                    }
                  />
                </td>
              </tr>
            ))}
            {links.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-[var(--tge-governance-muted-text)]"
                >
                  No linked plants yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CompanyRelationshipPanel({
  companyId,
  projectLinks,
  operatingAssetLinks,
  relationships,
  referenceData,
  sources,
}: {
  companyId: string;
  projectLinks: PostgresCompanyProjectLink[];
  operatingAssetLinks: PostgresCompanyOperatingAssetLink[];
  relationships: PostgresCompanyRelationship[];
  referenceData: PostgresCompanyRelationshipReferenceData;
  sources?: PostgresEntitySourceLink[];
}) {
  const router = useRouter();
  const relatedCompanyOptions = useMemo(
    () =>
      referenceData.companies.filter((company) => company.company_id !== companyId),
    [companyId, referenceData.companies]
  );
  const [form, setForm] = useState<RelationshipForm>(() =>
    initialRelationshipForm(referenceData, companyId)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/postgres-preview/company-relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          company_id_from: companyId,
        }),
      });
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to save company relationship.");
      }

      setForm(initialRelationshipForm(referenceData, companyId));
      setMessage("Company relationship saved.");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save company relationship."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(relationshipId: string) {
    const relationship = relationships.find(
      (companyRelationship) =>
        companyRelationship.company_relationship_id === relationshipId
    );

    if (
      !confirmStructuredRelationshipRemoval(
        `the company relationship${
          relationship?.company_name_from && relationship.company_name_to
            ? ` between ${relationship.company_name_from} and ${relationship.company_name_to}`
            : ""
        }`
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(
        `/api/postgres-preview/company-relationships/${relationshipId}`,
        { method: "DELETE" }
      );
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to remove company relationship.");
      }

      setMessage("Company relationship removed.");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to remove company relationship."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section
      title="Relationships And Portfolios"
      description="Structured project, plant, and company-relationship links for this company."
    >
      <RelationshipSupportSummary
        activityLinkCount={projectLinks.length + operatingAssetLinks.length}
        companyRelationshipCount={relationships.length}
        primaryOrCurrentCount={
          projectLinks.filter((link) => link.is_primary || link.ownership_share !== null)
            .length +
          operatingAssetLinks.filter(
            (link) => link.is_primary || link.ownership_share !== null
          ).length +
          relationships.filter((relationship) => relationship.is_current).length
        }
        relationshipEvidenceCount={
          projectLinks.reduce(
            (count, link) => count + link.relationship_source_count,
            0
          ) +
          operatingAssetLinks.reduce(
            (count, link) => count + link.relationship_source_count,
            0
          ) +
          relationships.reduce(
            (count, relationship) =>
              count + relationship.relationship_source_count,
            0
          )
        }
        scope="company"
        sources={sources}
      />

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
            Project Roles
          </h3>
          <CompanyProjectPortfolio
            companyId={companyId}
            links={projectLinks}
            referenceData={referenceData}
            sources={sources}
          />
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
            Plant Roles
          </h3>
          <CompanyAssetPortfolio
            companyId={companyId}
            links={operatingAssetLinks}
            referenceData={referenceData}
            sources={sources}
          />
        </div>
      </div>

      <div className="border-t border-[var(--tge-governance-neutral-border)] pt-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
          Company Relationships
        </h3>
        <div className="mt-4 space-y-4">
          <Notice error={error} message={message} />
          <RelationshipGovernanceNotice scope="company" />
          <form
            className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5"
            onSubmit={handleSubmit}
          >
            <Field label="Related Company" approvalSensitive required>
              <select
                className={inputClass()}
                value={form.company_id_to}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    company_id_to: event.target.value,
                  }))
                }
                required
              >
                {relatedCompanyOptions.map((company) => (
                  <option key={company.company_id} value={company.company_id}>
                    {company.company_name}
                    {company.headquarters_country
                      ? ` (${company.headquarters_country})`
                      : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Relationship Type" approvalSensitive required>
              <select
                className={inputClass()}
                value={form.relationship_type_code}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    relationship_type_code: event.target.value,
                  }))
                }
              >
                {referenceData.relationshipTypes.map((type) => (
                  <option key={type.code} value={type.code}>
                    {type.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Ownership %" approvalSensitive important>
              <input
                className={inputClass()}
                value={form.ownership_percentage}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    ownership_percentage: event.target.value,
                  }))
                }
              />
            </Field>
            <label className={checkboxShellClass()}>
              <input
                checked={form.is_current}
                className="h-4 w-4 accent-[var(--tge-brand-green)]"
                type="checkbox"
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    is_current: event.target.checked,
                  }))
                }
              />
              Current
            </label>
            <button
              className={primaryActionClass()}
              disabled={saving || relatedCompanyOptions.length === 0}
              type="submit"
            >
              {saving ? "Saving..." : "Add Relationship"}
            </button>
            <div className="xl:col-span-5">
              <Field label="Notes" workflow>
                <input
                  className={inputClass()}
                  value={form.notes}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                />
              </Field>
            </div>
          </form>

          <div className="overflow-x-auto">
            <table className="min-w-[1180px] table-fixed text-left text-sm">
              <thead className={tableHeadClass()}>
                <tr>
                  <th className="w-[23%] px-4 py-3 font-semibold">From</th>
                  <th className="w-[23%] px-4 py-3 font-semibold">To</th>
                  <th className="w-[15%] px-4 py-3 font-semibold">Type</th>
                  <th className="w-[12%] px-4 py-3 font-semibold">Ownership</th>
                  <th className="w-[12%] px-4 py-3 font-semibold">Evidence</th>
                  <th className="w-[8%] px-4 py-3 font-semibold">Current</th>
                  <th className="w-[7%] px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className={tableBodyClass()}>
                {relationships.map((relationship) => (
                  <tr
                    key={relationship.company_relationship_id}
                    className="align-top hover:bg-[var(--tge-surface-subtle)]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/postgres-preview/companies/${relationship.company_id_from}`}
                        className={entityLinkClass()}
                      >
                        {relationship.company_name_from}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/postgres-preview/companies/${relationship.company_id_to}`}
                        className={entityLinkClass()}
                      >
                        {relationship.company_name_to}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge
                        role={
                          relationship.relationship_type_label ||
                          relationship.relationship_type_code
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-[var(--tge-governance-neutral-text)]">
                      {formatPercent(relationship.ownership_percentage)}
                    </td>
                    <td className="px-4 py-3">
                      <RelationshipEvidenceBadge
                        count={relationship.relationship_source_count}
                      />
                      <RelationshipEvidenceLinker
                        evidenceType="company_relationship"
                        sources={sources}
                        targetId={relationship.company_relationship_id}
                        targetType="company_relationship"
                      />
                    </td>
                    <td className="px-4 py-3 text-[var(--tge-governance-neutral-text)]">
                      {relationship.is_current ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-3">
                      <RemoveButton
                        disabled={saving}
                        onClick={() =>
                          handleDelete(relationship.company_relationship_id)
                        }
                      />
                    </td>
                  </tr>
                ))}
                {relationships.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-[var(--tge-governance-muted-text)]"
                    >
                      No company relationships linked yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Section>
  );
}
