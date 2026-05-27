"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import {
  type SourceDetail,
  type SourceFormReferenceData,
  type SourceLink,
} from "@/lib/services/sources";
import {
  getSourceFactTypeDefinition,
  SOURCE_FACT_TYPE_PRESETS,
  type SourceFactTypePreset,
} from "@/lib/sourceFactTypePresets";

type InitialLinkTarget = {
  entity_type: SourceLink["entity_type"];
  entity_id: string;
  label: string;
};

type SourceFormValues = {
  source_type_code: string;
  title: string;
  url: string;
  source_reference: string;
  publisher: string;
  author_organization: string;
  country: string;
  language_code: string;
  visibility_code: string;
  credibility_status_code: string;
  published_date: string;
  accessed_at: string;
  notes: string;
  extracted_summary: string;
  relevant_excerpt: string;
  attachment_url: string;
  duplicate_source_flag: boolean;
};

type SourceLinkFormValues = {
  entity_type: SourceLink["entity_type"];
  entity_id: string;
  evidence_type: string;
  evidence_note: string;
  confidence_status_code: string;
  linked_field: string;
  claim_text: string;
  extracted_value: string;
  is_primary_evidence: boolean;
};

type FieldTone = "critical" | "important" | "workflow";

type SourceChangeState = {
  changedFields: Set<keyof SourceFormValues>;
  approvalSensitiveChangedFields: Set<keyof SourceFormValues>;
};

const sourceApprovalSensitiveFields = new Set<keyof SourceFormValues>([
  "source_type_code",
  "title",
  "url",
  "source_reference",
  "publisher",
  "author_organization",
  "country",
  "language_code",
  "visibility_code",
  "credibility_status_code",
  "published_date",
  "accessed_at",
  "extracted_summary",
  "relevant_excerpt",
  "attachment_url",
  "duplicate_source_flag",
]);

const sourceRequiredFields = new Set<keyof SourceFormValues>([
  "source_type_code",
  "visibility_code",
  "credibility_status_code",
]);

const sourceImportantFields = new Set<keyof SourceFormValues>([
  "published_date",
  "accessed_at",
  "country",
  "publisher",
  "author_organization",
  "relevant_excerpt",
]);

function toDatetimeLocal(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 16);
}

function initialSourceValues(source?: SourceDetail | null): SourceFormValues {
  return {
    source_type_code: source?.source_type_code || "web",
    title: source?.title || "",
    url: source?.url || "",
    source_reference: source?.source_reference || "",
    publisher: source?.publisher || "",
    author_organization: source?.author_organization || "",
    country: source?.country || "",
    language_code: source?.language_code || "",
    visibility_code: source?.visibility_code || "public",
    credibility_status_code: source?.credibility_status_code || "needs_review",
    published_date: source?.published_date || "",
    accessed_at: toDatetimeLocal(source?.accessed_at),
    notes: source?.notes || "",
    extracted_summary: source?.extracted_summary || "",
    relevant_excerpt: source?.relevant_excerpt || "",
    attachment_url: source?.attachment_url || "",
    duplicate_source_flag: Boolean(source?.duplicate_source_flag),
  };
}

function initialLinkValues(): SourceLinkFormValues {
  return {
    entity_type: "project",
    entity_id: "",
    evidence_type: "",
    evidence_note: "",
    confidence_status_code: "unknown",
    linked_field: "",
    claim_text: "",
    extracted_value: "",
    is_primary_evidence: false,
  };
}

function normalizeChangeValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value).trim();
}

function useSourceChangeState(
  form: SourceFormValues,
  originalForm: SourceFormValues,
  mode: "create" | "edit"
): SourceChangeState {
  return useMemo(() => {
    const changedFields = new Set<keyof SourceFormValues>();
    const approvalSensitiveChangedFields = new Set<keyof SourceFormValues>();

    if (mode !== "edit") {
      return { changedFields, approvalSensitiveChangedFields };
    }

    (Object.keys(form) as Array<keyof SourceFormValues>).forEach((field) => {
      if (
        normalizeChangeValue(form[field]) !==
        normalizeChangeValue(originalForm[field])
      ) {
        changedFields.add(field);

        if (sourceApprovalSensitiveFields.has(field)) {
          approvalSensitiveChangedFields.add(field);
        }
      }
    });

    return { changedFields, approvalSensitiveChangedFields };
  }, [form, mode, originalForm]);
}

function sourceFieldMeta(
  name: keyof SourceFormValues,
  changeState: SourceChangeState,
  tone: FieldTone = "important"
) {
  return {
    changed: changeState.changedFields.has(name),
    required: sourceRequiredFields.has(name),
    important: sourceImportantFields.has(name),
    approvalSensitive: sourceApprovalSensitiveFields.has(name),
    tone,
  };
}

async function safeJson(res: Response) {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function Field({
  label,
  children,
  changed = false,
  required = false,
  important = false,
  approvalSensitive = false,
  tone = "important",
}: {
  label: string;
  children: React.ReactNode;
  changed?: boolean;
  required?: boolean;
  important?: boolean;
  approvalSensitive?: boolean;
  tone?: FieldTone;
}) {
  const toneClass =
    tone === "critical"
      ? "border-red-200 bg-red-50 text-red-800"
      : tone === "workflow"
        ? "border-blue-200 bg-blue-50 text-blue-800"
        : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <label
      className={`flex flex-col gap-2 border px-3 py-3 text-xs font-semibold uppercase tracking-wide ${
        changed
          ? "border-amber-300 bg-amber-50/60 text-gray-600"
          : "border-transparent text-gray-500"
      }`}
    >
      <span className="flex flex-wrap items-center gap-2">
        {label}
        {required ? (
          <span className="border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-800">
            Required
          </span>
        ) : null}
        {important ? (
          <span className="border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
            Important
          </span>
        ) : null}
        {approvalSensitive ? (
          <span className="border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
            Approval Field
          </span>
        ) : null}
        {changed ? (
          <span className={`border px-1.5 py-0.5 text-[10px] font-bold ${toneClass}`}>
            Edited
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

function inputClass() {
  return "min-h-10 border border-gray-300 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-[#1f2937] outline-none focus:border-[#8dc63f]";
}

function TextInput({
  name,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  name: keyof SourceFormValues;
  value: string;
  onChange: (name: keyof SourceFormValues, value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      className={inputClass()}
      name={name}
      placeholder={placeholder}
      type={type}
      value={value}
      onChange={(event) => onChange(name, event.target.value)}
    />
  );
}

function TextArea({
  name,
  value,
  onChange,
  placeholder,
}: {
  name: keyof SourceFormValues;
  value: string;
  onChange: (name: keyof SourceFormValues, value: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      className={`${inputClass()} min-h-[110px] resize-y`}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(name, event.target.value)}
    />
  );
}

function Section({
  title,
  description,
  collapsible = false,
  defaultOpen = true,
  children,
}: {
  title: string;
  description?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (collapsible) {
    return (
      <section className="border border-gray-200 bg-white">
        <button
          className="flex w-full flex-col gap-2 border-b border-gray-200 px-5 py-4 text-left sm:flex-row sm:items-start sm:justify-between"
          type="button"
          onClick={() => setIsOpen((current) => !current)}
        >
          <div>
            <h2 className="text-lg font-bold text-[#1f2937]">{title}</h2>
            {description ? (
              <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">
                {description}
              </p>
            ) : null}
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-[#4f7f1f]">
            {isOpen ? "Collapse" : "Expand"}
          </span>
        </button>
        {isOpen ? <div className="px-5 py-5">{children}</div> : null}
      </section>
    );
  }

  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-bold text-[#1f2937]">{title}</h2>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">
            {description}
          </p>
        ) : null}
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

function FactTypeDefinitionCard({
  evidenceType,
}: {
  evidenceType: string | null | undefined;
}) {
  const definition = getSourceFactTypeDefinition(evidenceType);

  if (!definition) {
    return null;
  }

  return (
    <div className="border border-[#d7e8bf] bg-[#f5faef] px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-[#4f7f1f]">
        Fact Type Definition
      </div>
      <div className="mt-2 text-sm font-bold text-[#1f2937]">
        {definition.label}
      </div>
      <p className="mt-1 text-xs leading-5 text-gray-600">
        {definition.purpose}
      </p>
      <p className="mt-2 text-xs font-semibold leading-5 text-gray-700">
        {definition.reviewQuestion}
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Accept When
          </div>
          <ul className="mt-1 space-y-1 text-xs leading-5 text-gray-600">
            {definition.accept.slice(0, 2).map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Avoid Mixing With
          </div>
          <ul className="mt-1 space-y-1 text-xs leading-5 text-gray-600">
            {definition.reject.slice(0, 2).map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function FormReadinessPanel({
  form,
  changeState,
  currentCredibilityStatus,
  mode,
  sourceId,
}: {
  form: SourceFormValues;
  changeState: SourceChangeState;
  currentCredibilityStatus?: string | null;
  mode: "create" | "edit";
  sourceId?: string;
}) {
  const router = useRouter();
  const [creatingIssue, setCreatingIssue] = useState(false);
  const [issueActionError, setIssueActionError] = useState("");
  const [issueActionMessage, setIssueActionMessage] = useState("");
  const hasIdentifier = Boolean(
    form.title.trim() || form.url.trim() || form.source_reference.trim()
  );
  const issues = [
    !form.source_type_code ? "Source type is required." : null,
    !hasIdentifier
      ? "Add at least a title, URL, or source reference before saving."
      : null,
    !form.visibility_code ? "Visibility is required." : null,
    !form.credibility_status_code ? "Credibility status is required." : null,
    form.credibility_status_code === "credible" &&
    !form.url.trim() &&
    !form.source_reference.trim()
      ? "Credible sources should normally include a URL or structured reference."
      : null,
    form.duplicate_source_flag
      ? "Duplicate suspected is set; review before relying on this source."
      : null,
  ].filter((issue): issue is string => Boolean(issue));

  const changedCount = changeState.changedFields.size;
  const approvalSensitiveCount = changeState.approvalSensitiveChangedFields.size;
  const reviewedSourceWillNeedReview =
    mode === "edit" &&
    approvalSensitiveCount > 0 &&
    currentCredibilityStatus !== "needs_review" &&
    form.credibility_status_code === currentCredibilityStatus;
  const canCreateSourceIssue =
    Boolean(sourceId) &&
    mode === "edit" &&
    (reviewedSourceWillNeedReview || form.duplicate_source_flag || issues.length > 0);

  async function createSourceReviewIssue() {
    if (!sourceId) {
      return;
    }

    setCreatingIssue(true);
    setIssueActionError("");
    setIssueActionMessage("");

    try {
      const res = await fetch("/api/postgres-preview/research-ops/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_type: "source",
          entity_id: sourceId,
          issue_type_code: form.duplicate_source_flag
            ? "duplicate_suspected"
            : "source_validation",
          title: form.duplicate_source_flag
            ? "Review possible duplicate source"
            : "Review source metadata changes",
          description:
            issues.length > 0
              ? issues.join(" ")
              : "Source metadata or credibility-relevant fields changed and should be reviewed.",
          linked_field: reviewedSourceWillNeedReview
            ? "source_metadata"
            : form.duplicate_source_flag
              ? "duplicate_source_flag"
              : "source_review",
          assign_to_self: true,
        }),
      });
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to create source review issue.");
      }

      setIssueActionMessage("Source review issue created and assigned to you.");
      router.refresh();
    } catch (error) {
      setIssueActionError(
        error instanceof Error
          ? error.message
          : "Failed to create source review issue."
      );
    } finally {
      setCreatingIssue(false);
    }
  }

  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-bold text-[#1f2937]">Source Readiness</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
          This panel keeps source metadata, credibility review, and evidence
          governance visible while editing. It does not apply extracted facts to
          entity records.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 px-5 py-5 md:grid-cols-4">
        <div className="border border-gray-200 bg-[#fbfbfb] px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Required Checks
          </div>
          <div className="mt-1 text-2xl font-bold text-[#1f2937]">
            {issues.length === 0 ? "Ready" : issues.length}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {issues.length === 0 ? "No blocking form issues" : "items need attention"}
          </div>
        </div>
        <div className="border border-gray-200 bg-[#fbfbfb] px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Edited Fields
          </div>
          <div className="mt-1 text-2xl font-bold text-[#1f2937]">
            {changedCount}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            highlighted in this form
          </div>
        </div>
        <div className="border border-gray-200 bg-[#fbfbfb] px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Approval Fields
          </div>
          <div className="mt-1 text-2xl font-bold text-[#1f2937]">
            {approvalSensitiveCount}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            edited metadata/evidence fields
          </div>
        </div>
        <div
          className={`border px-4 py-3 ${
            reviewedSourceWillNeedReview
              ? "border-amber-200 bg-amber-50"
              : "border-[#d9eac2] bg-[#f5faee]"
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Review Impact
          </div>
          <div className="mt-1 text-sm font-bold text-[#1f2937]">
            {reviewedSourceWillNeedReview
              ? "Returns to Needs Review"
              : "No review downgrade"}
          </div>
          <div className="mt-1 text-xs leading-5 text-gray-600">
            {reviewedSourceWillNeedReview
              ? "Saving governed metadata changes on a reviewed source will move credibility back to needs_review."
              : "Current changes do not trigger an automatic credibility reset."}
          </div>
        </div>
      </div>
      {issueActionError || issueActionMessage || canCreateSourceIssue ? (
        <div className="space-y-3 border-t border-gray-200 px-5 py-4">
          {issueActionError ? (
            <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {issueActionError}
            </div>
          ) : null}
          {issueActionMessage ? (
            <div className="border border-[#b9d98b] bg-[#f1f8e8] px-4 py-3 text-sm font-medium text-[#3f6f19]">
              {issueActionMessage}
            </div>
          ) : null}
          {canCreateSourceIssue ? (
            <button
              className="h-9 border border-[#8dc63f] bg-white px-4 text-sm font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={creatingIssue}
              type="button"
              onClick={createSourceReviewIssue}
            >
              {creatingIssue ? "Creating..." : "Add Source Review Issue"}
            </button>
          ) : null}
        </div>
      ) : null}
      {issues.length > 0 ? (
        <div className="border-t border-gray-200 px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Validation Notes
          </div>
          <ul className="mt-2 space-y-1 text-sm text-gray-700">
            {issues.map((issue) => (
              <li key={issue}>- {issue}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function formatEntityType(value: SourceLink["entity_type"]) {
  if (value === "operating_asset") {
    return "Plant";
  }

  if (value === "project") {
    return "Project";
  }

  return "Company";
}

function SourceLinkManager({
  source,
  referenceData,
}: {
  source: SourceDetail;
  referenceData: SourceFormReferenceData;
}) {
  const router = useRouter();
  const [linkForm, setLinkForm] = useState<SourceLinkFormValues>(
    initialLinkValues
  );
  const [savingLink, setSavingLink] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [linkMessage, setLinkMessage] = useState("");
  const factPresetGroups = useMemo(
    () =>
      [
        ["core", "Core Signals"],
        ["money", "Money / Funding"],
        ["classification", "Classification"],
        ["matching", "Matching"],
      ].map(([category, label]) => ({
        category,
        label,
        presets: SOURCE_FACT_TYPE_PRESETS.filter(
          (preset) => preset.category === category
        ),
      })),
    []
  );

  const targets = useMemo(
    () =>
      referenceData.linkTargets.filter(
        (target) => target.entity_type === linkForm.entity_type
      ),
    [linkForm.entity_type, referenceData.linkTargets]
  );

  async function handleAddLink(event: FormEvent) {
    event.preventDefault();
    setSavingLink(true);
    setLinkError("");
    setLinkMessage("");

    try {
      const res = await fetch("/api/postgres/source-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...linkForm,
          source_id: source.source_id,
        }),
      });
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to link source.");
      }

      setLinkForm(initialLinkValues());
      setLinkMessage("Source link added.");
      router.refresh();
    } catch (error) {
      setLinkError(error instanceof Error ? error.message : "Failed to link source.");
    } finally {
      setSavingLink(false);
    }
  }

  async function handleDeleteLink(linkId: string) {
    const link = source.links.find(
      (sourceLink) => sourceLink.entity_source_id === linkId
    );
    const confirmed = window.confirm(
      `Remove this evidence link${
        link?.entity_name ? ` to ${link.entity_name}` : ""
      }? This unlinks the source from the record but does not delete the source itself.`
    );

    if (!confirmed) {
      return;
    }

    setSavingLink(true);
    setLinkError("");
    setLinkMessage("");

    try {
      const res = await fetch(`/api/postgres/source-links/${linkId}`, {
        method: "DELETE",
      });
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to remove source link.");
      }

      setLinkMessage("Source link removed.");
      router.refresh();
    } catch (error) {
      setLinkError(
        error instanceof Error ? error.message : "Failed to remove source link."
      );
    } finally {
      setSavingLink(false);
    }
  }

  function applyFactTypePreset(preset: SourceFactTypePreset) {
    setLinkForm((prev) => ({
      ...prev,
      evidence_type: preset.evidenceType,
      linked_field: preset.linkedField,
    }));
  }

  return (
    <Section title="Linked Evidence">
      <div className="space-y-5">
        {linkError ? (
          <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {linkError}
          </div>
        ) : null}
        {linkMessage ? (
          <div className="border border-[#b9d98b] bg-[#f1f8e8] px-4 py-3 text-sm font-medium text-[#3f6f19]">
            {linkMessage}
          </div>
        ) : null}

        <div className="border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
          Evidence links are governed relationships between this source and a
          record. Creating a link does not update project, plant, or
          company fields; it only creates reviewed evidence context for later
          confirmation and audited field updates.
        </div>

        <div className="border border-gray-200 bg-[#fbfbfb] px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Quick Fact Type
          </div>
          <div className="mt-3 space-y-3">
            {factPresetGroups.map((group) => (
              <div key={group.category}>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  {group.label}
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {group.presets.map((preset) => {
                    const selected =
                      linkForm.evidence_type === preset.evidenceType;

                    return (
                      <button
                        key={preset.evidenceType}
                        className={`border px-3 py-1.5 text-xs font-semibold ${
                          selected
                            ? "border-[#8dc63f] bg-[#edf7df] text-[#4f7f1f]"
                            : "border-gray-200 bg-white text-gray-700 hover:border-[#8dc63f]"
                        }`}
                        type="button"
                        onClick={() => applyFactTypePreset(preset)}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Presets fill the fact/evidence type and linked field only. They do
            not confirm or apply extracted facts.
          </p>
          <div className="mt-3">
            <FactTypeDefinitionCard evidenceType={linkForm.evidence_type} />
          </div>
        </div>

        <form className="grid grid-cols-1 gap-4 xl:grid-cols-4" onSubmit={handleAddLink}>
          <Field label="Entity Type" approvalSensitive required tone="critical">
            <select
              className={inputClass()}
              value={linkForm.entity_type}
              onChange={(event) =>
                setLinkForm((prev) => ({
                  ...prev,
                  entity_type: event.target.value as SourceLink["entity_type"],
                  entity_id: "",
                }))
              }
            >
              <option value="project">Project</option>
              <option value="operating_asset">Plant</option>
              <option value="company">Company</option>
            </select>
          </Field>

          <Field label="Record" approvalSensitive required tone="critical">
            <select
              className={inputClass()}
              value={linkForm.entity_id}
              onChange={(event) =>
                setLinkForm((prev) => ({ ...prev, entity_id: event.target.value }))
              }
              required
            >
              <option value="">Select record</option>
              {targets.map((target) => (
                <option key={target.entity_id} value={target.entity_id}>
                  {target.label} {target.country ? `(${target.country})` : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Confidence" approvalSensitive important tone="workflow">
            <select
              className={inputClass()}
              value={linkForm.confidence_status_code}
              onChange={(event) =>
                setLinkForm((prev) => ({
                  ...prev,
                  confidence_status_code: event.target.value,
                }))
              }
            >
              {referenceData.confidenceStatuses.map((status) => (
                <option key={status.code} value={status.code}>
                  {status.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Linked Field" approvalSensitive important>
            <input
              className={inputClass()}
              placeholder="capacity, COD, owner..."
              value={linkForm.linked_field}
              onChange={(event) =>
                setLinkForm((prev) => ({
                  ...prev,
                  linked_field: event.target.value,
                }))
              }
            />
          </Field>

          <Field label="Fact / Evidence Type" approvalSensitive important>
            <input
              className={inputClass()}
              placeholder="capacity_signal, financing_investment_signal..."
              value={linkForm.evidence_type}
              onChange={(event) =>
                setLinkForm((prev) => ({
                  ...prev,
                  evidence_type: event.target.value,
                }))
              }
            />
          </Field>

          <Field label="Extracted Value" approvalSensitive important>
            <input
              className={inputClass()}
              placeholder="35 MWe, COD 2027..."
              value={linkForm.extracted_value}
              onChange={(event) =>
                setLinkForm((prev) => ({
                  ...prev,
                  extracted_value: event.target.value,
                }))
              }
            />
          </Field>

          <label className="flex min-h-10 items-center gap-2 self-end border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700">
            <input
              checked={linkForm.is_primary_evidence}
              className="h-4 w-4 accent-[#8dc63f]"
              type="checkbox"
              onChange={(event) =>
                setLinkForm((prev) => ({
                  ...prev,
                  is_primary_evidence: event.target.checked,
                }))
              }
            />
            Primary evidence
          </label>

          <button
            className="h-10 self-end border border-[#8dc63f] bg-[#8dc63f] px-4 text-sm font-semibold text-white hover:bg-[#78ad35] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={savingLink}
            type="submit"
          >
            {savingLink ? "Saving..." : "Add Link"}
          </button>

          <div className="xl:col-span-2">
            <Field label="Claim Text" approvalSensitive important>
              <textarea
                className={`${inputClass()} min-h-[86px] resize-y`}
                placeholder="What claim or data point does this source support?"
                value={linkForm.claim_text}
                onChange={(event) =>
                  setLinkForm((prev) => ({
                    ...prev,
                    claim_text: event.target.value,
                  }))
                }
              />
            </Field>
          </div>

          <div className="xl:col-span-2">
            <Field label="Evidence Note" approvalSensitive tone="workflow">
              <textarea
                className={`${inputClass()} min-h-[86px] resize-y`}
                placeholder="Internal note about this source-record link"
                value={linkForm.evidence_note}
                onChange={(event) =>
                  setLinkForm((prev) => ({
                    ...prev,
                    evidence_note: event.target.value,
                  }))
                }
              />
            </Field>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed text-left text-sm">
            <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
              <tr>
                <th className="w-[14%] px-4 py-3 font-semibold">Entity</th>
                <th className="w-[21%] px-4 py-3 font-semibold">Record</th>
                <th className="w-[14%] px-4 py-3 font-semibold">Fact Type</th>
                <th className="w-[14%] px-4 py-3 font-semibold">Field</th>
                <th className="w-[14%] px-4 py-3 font-semibold">Value</th>
                <th className="w-[13%] px-4 py-3 font-semibold">Confidence</th>
                <th className="w-[10%] px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {source.links.map((link) => (
                <tr key={link.entity_source_id} className="align-top">
                  <td className="px-4 py-3 text-gray-700">
                    {formatEntityType(link.entity_type)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[#1f2937]">
                      {link.entity_name || "Unnamed record"}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {link.legacy_id || link.entity_id}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {link.evidence_type || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {link.linked_field || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {link.extracted_value || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {link.confidence_status_code}
                    {link.is_primary_evidence ? (
                      <div className="mt-2 text-xs font-semibold text-[#4f7f1f]">
                        Primary
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="h-8 border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={savingLink}
                      type="button"
                      onClick={() => handleDeleteLink(link.entity_source_id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}

              {source.links.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                    No linked records yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </Section>
  );
}

export default function SourceForm({
  mode,
  source,
  referenceData,
  initialLinkTarget,
}: {
  mode: "create" | "edit";
  source?: SourceDetail | null;
  referenceData: SourceFormReferenceData;
  initialLinkTarget?: InitialLinkTarget | null;
}) {
  const router = useRouter();
  const originalForm = useMemo(() => initialSourceValues(source), [source]);
  const [form, setForm] = useState<SourceFormValues>(() =>
    initialSourceValues(source)
  );
  const changeState = useSourceChangeState(form, originalForm, mode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function setField(name: keyof SourceFormValues, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        ...form,
        accessed_at: form.accessed_at
          ? new Date(form.accessed_at).toISOString()
          : null,
      };
      const res = await fetch(
        mode === "create"
          ? "/api/postgres/sources"
          : `/api/postgres/sources/${source?.source_id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to save source.");
      }

      const sourceId = json.source.source_id as string;

      if (mode === "create" && initialLinkTarget) {
        const linkRes = await fetch("/api/postgres/source-links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source_id: sourceId,
            entity_type: initialLinkTarget.entity_type,
            entity_id: initialLinkTarget.entity_id,
            evidence_type: "record_source",
            evidence_note: "Linked during source creation from Research Ops.",
            confidence_status_code: "unknown",
            is_primary_evidence: true,
          }),
        });
        const linkJson = await safeJson(linkRes);

        if (!linkRes.ok || !linkJson?.success) {
          throw new Error(
            linkJson?.error || "Source saved, but linking the target record failed."
          );
        }
      }

      setMessage("Source saved.");
      router.push(`/sources/${sourceId}${initialLinkTarget ? "/edit" : ""}`);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save source.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
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
      {mode === "create" && initialLinkTarget ? (
        <div className="border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
          This source will be linked to{" "}
          <span className="font-semibold">{initialLinkTarget.label}</span> after
          creation.
        </div>
      ) : null}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <FormReadinessPanel
          changeState={changeState}
          currentCredibilityStatus={source?.credibility_status_code}
          form={form}
          mode={mode}
          sourceId={source?.source_id}
        />

        <Section title="Source Identity">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Field
              label="Source Type"
              {...sourceFieldMeta("source_type_code", changeState, "critical")}
            >
              <select
                className={inputClass()}
                value={form.source_type_code}
                onChange={(event) => setField("source_type_code", event.target.value)}
              >
                {referenceData.sourceTypes.map((type) => (
                  <option key={type.code} value={type.code}>
                    {type.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Title"
              approvalSensitive
              changed={changeState.changedFields.has("title")}
              important
              tone="critical"
            >
              <TextInput
                name="title"
                placeholder="Source title"
                value={form.title}
                onChange={setField}
              />
            </Field>
            <Field
              label="Source Reference"
              approvalSensitive
              changed={changeState.changedFields.has("source_reference")}
              important
              tone="critical"
            >
              <TextInput
                name="source_reference"
                placeholder="Citation, internal source ID, report reference"
                value={form.source_reference}
                onChange={setField}
              />
            </Field>
            <Field
              label="URL"
              approvalSensitive
              changed={changeState.changedFields.has("url")}
              important
              tone="critical"
            >
              <TextInput
                name="url"
                placeholder="https://..."
                value={form.url}
                onChange={setField}
              />
            </Field>
            <Field
              label="Publisher"
              {...sourceFieldMeta("publisher", changeState)}
            >
              <TextInput
                name="publisher"
                placeholder="Publisher"
                value={form.publisher}
                onChange={setField}
              />
            </Field>
            <Field
              label="Author / Organization"
              {...sourceFieldMeta("author_organization", changeState)}
            >
              <TextInput
                name="author_organization"
                placeholder="Author or organization"
                value={form.author_organization}
                onChange={setField}
              />
            </Field>
          </div>
        </Section>

        <Section title="Classification And Review">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <Field
              label="Visibility"
              {...sourceFieldMeta("visibility_code", changeState, "critical")}
            >
              <select
                className={inputClass()}
                value={form.visibility_code}
                onChange={(event) => setField("visibility_code", event.target.value)}
              >
                {referenceData.visibilityLevels.map((visibility) => (
                  <option key={visibility.code} value={visibility.code}>
                    {visibility.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Credibility Status"
              {...sourceFieldMeta(
                "credibility_status_code",
                changeState,
                "workflow"
              )}
            >
              <select
                className={inputClass()}
                value={form.credibility_status_code}
                onChange={(event) =>
                  setField("credibility_status_code", event.target.value)
                }
              >
                {referenceData.credibilityStatuses.map((status) => (
                  <option key={status.code} value={status.code}>
                    {status.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Market / Country"
              {...sourceFieldMeta("country", changeState)}
            >
              <TextInput
                name="country"
                placeholder="Market or country"
                value={form.country}
                onChange={setField}
              />
            </Field>
            <Field
              label="Language"
              {...sourceFieldMeta("language_code", changeState)}
            >
              <TextInput
                name="language_code"
                placeholder="en, es, tr..."
                value={form.language_code}
                onChange={setField}
              />
            </Field>
            <Field
              label="Published Date"
              {...sourceFieldMeta("published_date", changeState)}
            >
              <TextInput
                name="published_date"
                type="date"
                value={form.published_date}
                onChange={setField}
              />
            </Field>
            <Field
              label="Accessed At"
              {...sourceFieldMeta("accessed_at", changeState)}
            >
              <TextInput
                name="accessed_at"
                type="datetime-local"
                value={form.accessed_at}
                onChange={setField}
              />
            </Field>
            <label
              className={`flex min-h-10 items-center gap-2 self-end border px-3 text-sm font-semibold ${
                changeState.changedFields.has("duplicate_source_flag")
                  ? "border-amber-300 bg-amber-50 text-amber-800"
                  : "border-gray-300 bg-white text-gray-700"
              }`}
            >
              <input
                checked={form.duplicate_source_flag}
                className="h-4 w-4 accent-[#8dc63f]"
                type="checkbox"
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    duplicate_source_flag: event.target.checked,
                  }))
                }
              />
              Duplicate suspected
              {changeState.changedFields.has("duplicate_source_flag") ? (
                <span className="border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                  Edited
                </span>
              ) : null}
            </label>
          </div>
        </Section>

        <Section
          title="Summary And Notes"
          description="Research summary, relevant excerpt, internal notes, and attachment references."
          collapsible
          defaultOpen={
            changeState.changedFields.has("extracted_summary") ||
            changeState.changedFields.has("relevant_excerpt") ||
            changeState.changedFields.has("notes") ||
            changeState.changedFields.has("attachment_url")
          }
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Field
              label="Extracted Summary"
              {...sourceFieldMeta("extracted_summary", changeState, "workflow")}
            >
              <TextArea
                name="extracted_summary"
                placeholder="Short source summary or extracted finding"
                value={form.extracted_summary}
                onChange={setField}
              />
            </Field>
            <Field
              label="Relevant Excerpt"
              {...sourceFieldMeta("relevant_excerpt", changeState)}
            >
              <TextArea
                name="relevant_excerpt"
                placeholder="Short relevant excerpt or data point"
                value={form.relevant_excerpt}
                onChange={setField}
              />
            </Field>
            <Field
              label="Internal Notes"
              changed={changeState.changedFields.has("notes")}
              tone="workflow"
            >
              <TextArea
                name="notes"
                placeholder="Research notes, caveats, source quality context"
                value={form.notes}
                onChange={setField}
              />
            </Field>
            <Field
              label="Attachment URL"
              {...sourceFieldMeta("attachment_url", changeState)}
            >
              <TextInput
                name="attachment_url"
                placeholder="Internal attachment URL or future file reference"
                value={form.attachment_url}
                onChange={setField}
              />
            </Field>
          </div>
        </Section>

        <div className="flex flex-wrap items-center gap-3">
          <button
            className="inline-flex h-10 items-center justify-center border border-[#8dc63f] bg-[#8dc63f] px-5 text-sm font-semibold text-white hover:bg-[#78ad35] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving}
            type="submit"
          >
            {saving ? "Saving..." : mode === "create" ? "Create Source" : "Save Source"}
          </button>
          <Link
            href={source ? `/sources/${source.source_id}` : "/sources"}
            className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
          >
            Cancel
          </Link>
        </div>
      </form>

      {mode === "edit" && source ? (
        <SourceLinkManager source={source} referenceData={referenceData} />
      ) : null}
    </div>
  );
}
