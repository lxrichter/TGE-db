"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import type {
  PostgresEntityFormReferenceData,
  PostgresPreviewCompanyDetail,
  PostgresPreviewOperatingAssetDetail,
  PostgresPreviewProjectDetail,
} from "@/lib/postgres-preview";

type EntityFormMode = "create" | "edit";
type EntityFormValues = Record<string, string>;
type FieldTone = "critical" | "important" | "workflow";
type FormReadinessIssue = {
  severity: "critical" | "important" | "workflow";
  label: string;
  detail: string;
  issueTypeCode?: string;
  linkedField?: string;
};
type EntityIssueContext = {
  entityType: "project" | "operating_asset" | "company";
  entityId: string;
};

function toInputValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

async function safeJson(res: Response) {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function inputClass() {
  return "min-h-10 border border-gray-300 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-[#1f2937] outline-none focus:border-[#8dc63f]";
}

function normalizeComparisonValue(value: string | undefined) {
  return (value || "").trim();
}

const projectApprovalSensitiveFields = new Set([
  "project_name",
  "country",
  "primary_use_type_code",
  "lifecycle_phase_code",
  "latitude",
  "longitude",
  "resource_type",
  "resource_temp_c",
  "potential_min_mwe",
  "potential_max_mwe",
  "electric_capacity_mwe",
  "thermal_capacity_mwth",
  "annual_power_generation_gwhe",
  "annual_heat_supply_gwhth",
  "annual_cooling_supply_gwhc",
  "capacity_estimate_status_code",
  "output_estimate_status_code",
  "start_dev_year",
  "target_cod_year",
  "target_cod_month",
  "cod_raw",
  "plant_technology",
  "turbine_supplier",
]);

const assetApprovalSensitiveFields = new Set([
  "asset_name",
  "country",
  "primary_use_type_code",
  "lifecycle_phase_code",
  "latitude",
  "longitude",
  "resource_type",
  "resource_temp_c",
  "electric_capacity_mwe",
  "electric_capacity_running_mwe",
  "thermal_capacity_mwth",
  "potential_min_mwe",
  "potential_max_mwe",
  "annual_power_generation_gwhe",
  "annual_heat_supply_gwhth",
  "annual_cooling_supply_gwhc",
  "capacity_estimate_status_code",
  "output_estimate_status_code",
  "cod_year",
  "cod_month",
  "cod_raw",
  "number_of_units",
  "plant_technology",
  "turbine_supplier",
]);

const companyApprovalSensitiveFields = new Set([
  "company_name",
  "company_legal_name",
  "website_url",
  "entity_type_code",
  "company_type_primary_code",
  "ownership_type",
  "company_status",
  "headquarters_country",
  "geothermal_focus",
  "technology_focus",
  "service_scope_summary",
  "operating_markets_summary",
]);

type FormChangeState = {
  changedFieldNames: string[];
  approvalSensitiveChangedFieldNames: string[];
  isChanged: (name: string) => boolean;
  isApprovalSensitive: (name: string) => boolean;
};

function useFormChangeState({
  enabled,
  form,
  originalForm,
  approvalSensitiveFields,
}: {
  enabled: boolean;
  form: EntityFormValues;
  originalForm: EntityFormValues;
  approvalSensitiveFields: Set<string>;
}): FormChangeState {
  const changedFieldNames = useMemo(() => {
    if (!enabled) {
      return [];
    }

    const fieldNames = new Set([
      ...Object.keys(originalForm),
      ...Object.keys(form),
    ]);

    return [...fieldNames].filter(
      (fieldName) =>
        normalizeComparisonValue(form[fieldName]) !==
        normalizeComparisonValue(originalForm[fieldName])
    );
  }, [enabled, form, originalForm]);

  const approvalSensitiveChangedFieldNames = useMemo(
    () =>
      changedFieldNames.filter((fieldName) =>
        approvalSensitiveFields.has(fieldName)
      ),
    [approvalSensitiveFields, changedFieldNames]
  );

  return {
    changedFieldNames,
    approvalSensitiveChangedFieldNames,
    isChanged: (name: string) => changedFieldNames.includes(name),
    isApprovalSensitive: (name: string) => approvalSensitiveFields.has(name),
  };
}

function fieldMeta(
  changeState: FormChangeState,
  name: string,
  options: {
    required?: boolean;
    important?: boolean;
    tone?: FieldTone;
  } = {}
) {
  return {
    approvalSensitive: changeState.isApprovalSensitive(name),
    changed: changeState.isChanged(name),
    required: options.required,
    important: options.important,
    tone: options.tone,
  };
}

function Field({
  label,
  children,
  changed = false,
  required = false,
  important = false,
  approvalSensitive = false,
  tone,
}: {
  label: string;
  children: React.ReactNode;
  changed?: boolean;
  required?: boolean;
  important?: boolean;
  approvalSensitive?: boolean;
  tone?: FieldTone;
}) {
  const toneLabel =
    tone === "critical"
      ? "Critical"
      : tone === "important"
        ? "Important"
        : tone === "workflow"
          ? "Workflow"
          : null;

  return (
    <label
      className={`flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 ${
        changed
          ? "border border-amber-200 bg-amber-50 px-3 py-3"
          : "border border-transparent"
      }`}
    >
      <span className="flex flex-wrap items-center gap-2">
        <span>{label}</span>
        {required ? (
          <span className="border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
            Required
          </span>
        ) : null}
        {important ? (
          <span className="border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
            Important
          </span>
        ) : null}
        {approvalSensitive ? (
          <span className="border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">
            Approval Field
          </span>
        ) : null}
        {toneLabel ? (
          <span className="border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
            {toneLabel}
          </span>
        ) : null}
        {changed ? (
          <span className="border border-amber-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
            Edited
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

function TextInput({
  name,
  form,
  setField,
  placeholder,
  required = false,
  type = "text",
}: {
  name: string;
  form: EntityFormValues;
  setField: (name: string, value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <input
      className={inputClass()}
      name={name}
      placeholder={placeholder}
      required={required}
      type={type}
      value={form[name] || ""}
      onChange={(event) => setField(name, event.target.value)}
    />
  );
}

function TextArea({
  name,
  form,
  setField,
  placeholder,
}: {
  name: string;
  form: EntityFormValues;
  setField: (name: string, value: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      className={`${inputClass()} min-h-[120px] resize-y`}
      name={name}
      placeholder={placeholder}
      value={form[name] || ""}
      onChange={(event) => setField(name, event.target.value)}
    />
  );
}

function SelectInput({
  name,
  form,
  setField,
  options,
}: {
  name: string;
  form: EntityFormValues;
  setField: (name: string, value: string) => void;
  options: Array<{ code: string; label: string }>;
}) {
  return (
    <select
      className={inputClass()}
      name={name}
      value={form[name] || ""}
      onChange={(event) => setField(name, event.target.value)}
    >
      {options.map((option) => (
        <option key={option.code} value={option.code}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-bold text-[#1f2937]">{title}</h2>
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

function FormNotice({
  error,
  message,
}: {
  error: string;
  message: string;
}) {
  return (
    <>
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
    </>
  );
}

function hasValue(form: EntityFormValues, name: string) {
  return Boolean((form[name] || "").trim());
}

function isUnknownCode(form: EntityFormValues, name: string) {
  const value = (form[name] || "").trim();
  return !value || value === "unknown";
}

function hasAnyValue(form: EntityFormValues, names: string[]) {
  return names.some((name) => hasValue(form, name));
}

function issueTone(severity: FormReadinessIssue["severity"]) {
  if (severity === "critical") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (severity === "important") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-blue-200 bg-blue-50 text-blue-800";
}

function formatFieldLabel(fieldName: string) {
  return fieldName
    .replace(/_/g, " ")
    .replace(/\bmwe\b/gi, "MWe")
    .replace(/\bmwth\b/gi, "MWth")
    .replace(/\bgwh(e|th|c)?\b/gi, (value) => value.toUpperCase())
    .replace(/\bcod\b/gi, "COD")
    .replace(/\bhq\b/gi, "HQ")
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

function FormReadinessPanel({
  issues,
  entityLabel,
  changeState,
  currentReviewStatus,
  issueContext,
}: {
  issues: FormReadinessIssue[];
  entityLabel: string;
  changeState?: FormChangeState;
  currentReviewStatus?: string;
  issueContext?: EntityIssueContext;
}) {
  const router = useRouter();
  const [creatingIssueKey, setCreatingIssueKey] = useState("");
  const [issueActionError, setIssueActionError] = useState("");
  const [issueActionMessage, setIssueActionMessage] = useState("");
  const criticalCount = issues.filter(
    (issue) => issue.severity === "critical"
  ).length;
  const importantCount = issues.filter(
    (issue) => issue.severity === "important"
  ).length;
  const changedCount = changeState?.changedFieldNames.length || 0;
  const approvalChangedCount =
    changeState?.approvalSensitiveChangedFieldNames.length || 0;
  const approvedStatus =
    currentReviewStatus === "approved" || currentReviewStatus === "export_ready";
  const approvalSensitiveFields =
    changeState?.approvalSensitiveChangedFieldNames || [];

  async function createIssue({
    key,
    issueTypeCode,
    title,
    description,
    linkedField,
  }: {
    key: string;
    issueTypeCode: string;
    title: string;
    description: string;
    linkedField?: string;
  }) {
    if (!issueContext) {
      return;
    }

    setCreatingIssueKey(key);
    setIssueActionError("");
    setIssueActionMessage("");

    try {
      const res = await fetch("/api/postgres-preview/research-ops/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_type: issueContext.entityType,
          entity_id: issueContext.entityId,
          issue_type_code: issueTypeCode,
          title,
          description,
          linked_field: linkedField,
          assign_to_self: true,
        }),
      });
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to create Research Ops issue.");
      }

      setIssueActionMessage("Research Ops issue created and assigned to you.");
      router.refresh();
    } catch (error) {
      setIssueActionError(
        error instanceof Error
          ? error.message
          : "Failed to create Research Ops issue."
      );
    } finally {
      setCreatingIssueKey("");
    }
  }

  async function createEditedFieldsIssue() {
    if (!approvalSensitiveFields.length) {
      return;
    }

    const fieldLabels = approvalSensitiveFields.map(formatFieldLabel);

    await createIssue({
      key: "edited-approval-fields",
      issueTypeCode: "research_note",
      title: "Review edited approval-sensitive fields",
      description: `${
        approvedStatus
          ? "Approved/export-ready record has edited approval-sensitive fields."
          : "Approval-sensitive fields were edited and should be reviewed."
      } Fields: ${fieldLabels.join(", ")}.`,
      linkedField: approvalSensitiveFields.slice(0, 8).join(", "),
    });
  }

  return (
    <section className="border border-gray-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1f2937]">Form Readiness</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Live guidance for this staging {entityLabel}. Drafts can still be
            saved while critical and important gaps remain.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex min-h-[28px] items-center border border-gray-200 bg-[#f7f7f7] px-2 text-xs font-semibold text-gray-700">
            {criticalCount} critical
          </span>
          <span className="inline-flex min-h-[28px] items-center border border-gray-200 bg-[#f7f7f7] px-2 text-xs font-semibold text-gray-700">
            {importantCount} important
          </span>
          {changeState ? (
            <span className="inline-flex min-h-[28px] items-center border border-amber-200 bg-amber-50 px-2 text-xs font-semibold text-amber-800">
              {changedCount} edited
            </span>
          ) : null}
        </div>
      </div>
      <div className="space-y-4 px-5 py-5">
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

        {changeState && changedCount > 0 ? (
          <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <span className="font-semibold">
                  {changedCount} field{changedCount === 1 ? "" : "s"} edited
                </span>
                {approvalChangedCount > 0 ? (
                  <>
                    {" "}
                    including {approvalChangedCount} approval-sensitive field
                    {approvalChangedCount === 1 ? "" : "s"}.
                  </>
                ) : (
                  "."
                )}{" "}
                {approvedStatus
                  ? "Saving changes to an approved/export-ready record will move it back to needs_update for review."
                  : "Edited fields are highlighted in the form below."}
                {approvalSensitiveFields.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {approvalSensitiveFields.slice(0, 8).map((fieldName) => (
                      <span
                        key={fieldName}
                        className="border border-amber-200 bg-white px-2 py-1 text-xs font-semibold text-amber-900"
                      >
                        {formatFieldLabel(fieldName)}
                      </span>
                    ))}
                    {approvalSensitiveFields.length > 8 ? (
                      <span className="border border-amber-200 bg-white px-2 py-1 text-xs font-semibold text-amber-900">
                        +{approvalSensitiveFields.length - 8} more
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
              {issueContext && approvalSensitiveFields.length > 0 ? (
                <button
                  className="h-9 shrink-0 border border-amber-300 bg-white px-3 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={Boolean(creatingIssueKey)}
                  type="button"
                  onClick={createEditedFieldsIssue}
                >
                  {creatingIssueKey === "edited-approval-fields"
                    ? "Creating..."
                    : "Add Re-review Issue"}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {issues.length === 0 ? (
          <div className="border border-[#b9d98b] bg-[#f1f8e8] px-4 py-3 text-sm font-medium text-[#3f6f19]">
            No form-level gaps detected. Source/evidence and company-role links
            are still checked in their separate workflows.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {issues.map((issue) => (
              <div
                key={`${issue.severity}-${issue.label}`}
                className={`border px-4 py-3 ${issueTone(issue.severity)}`}
              >
                <div className="text-xs font-semibold uppercase tracking-wide">
                  {issue.severity}
                </div>
                <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-sm font-bold">{issue.label}</div>
                    <div className="mt-1 text-xs leading-5">{issue.detail}</div>
                  </div>
                  {issueContext ? (
                    <button
                      className="h-8 shrink-0 border border-current bg-white/70 px-3 text-xs font-semibold hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={Boolean(creatingIssueKey)}
                      type="button"
                      onClick={() =>
                        createIssue({
                          key: `issue-${issue.label}`,
                          issueTypeCode: issue.issueTypeCode || "research_note",
                          title: issue.label,
                          description: issue.detail,
                          linkedField: issue.linkedField,
                        })
                      }
                    >
                      {creatingIssueKey === `issue-${issue.label}`
                        ? "Creating..."
                        : "Add Issue"}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function getProjectReadinessIssues(form: EntityFormValues): FormReadinessIssue[] {
  const issues: FormReadinessIssue[] = [];

  if (!hasValue(form, "project_name")) {
    issues.push({
      severity: "critical",
      label: "Missing project name",
      detail: "A project needs a stable name before it can be reviewed.",
      issueTypeCode: "research_note",
      linkedField: "project_name",
    });
  }

  if (!hasValue(form, "country")) {
    issues.push({
      severity: "critical",
      label: "Missing country",
      detail: "Country is required for market pages, maps, charts, and exports.",
      issueTypeCode: "missing_country_location",
      linkedField: "country",
    });
  }

  if (isUnknownCode(form, "primary_use_type_code")) {
    issues.push({
      severity: "critical",
      label: "Missing use type",
      detail: "Power, direct-use, hybrid, or mineral classification is required.",
      issueTypeCode: "missing_use_type",
      linkedField: "primary_use_type_code",
    });
  }

  if (
    isUnknownCode(form, "lifecycle_phase_code") ||
    form.lifecycle_phase_code === "prospect_tbd"
  ) {
    issues.push({
      severity: "critical",
      label: "Lifecycle needs classification",
      detail: "Prospect / TBD can be saved, but should stay visible as a review gap.",
      issueTypeCode: "missing_lifecycle_status",
      linkedField: "lifecycle_phase_code",
    });
  }

  if (
    !hasAnyValue(form, [
      "potential_min_mwe",
      "potential_max_mwe",
      "electric_capacity_mwe",
      "thermal_capacity_mwth",
      "annual_power_generation_gwhe",
      "annual_heat_supply_gwhth",
      "annual_cooling_supply_gwhc",
    ])
  ) {
    issues.push({
      severity: "important",
      label: "Missing capacity or output",
      detail: "Add MWe, MWth, GWh, or a potential range when credible data exists.",
      issueTypeCode: "missing_capacity_output",
      linkedField: "capacity_output",
    });
  }

  if (!hasValue(form, "latitude") || !hasValue(form, "longitude")) {
    issues.push({
      severity: "important",
      label: "Missing coordinates",
      detail: "Coordinate-confirmed map layers only show records with latitude and longitude.",
      issueTypeCode: "missing_coordinates",
      linkedField: "latitude, longitude",
    });
  }

  issues.push({
    severity: "workflow",
    label: "Source evidence handled separately",
    detail: "Add source/evidence links after saving the staging record.",
    issueTypeCode: "missing_source",
    linkedField: "sources",
  });

  issues.push({
    severity: "workflow",
    label: "Company roles handled separately",
    detail: "Developer, owner, operator, and supplier links are managed on the detail page.",
    issueTypeCode: "missing_company_link",
    linkedField: "company_links",
  });

  return issues;
}

function getAssetReadinessIssues(form: EntityFormValues): FormReadinessIssue[] {
  const issues: FormReadinessIssue[] = [];

  if (!hasValue(form, "asset_name")) {
    issues.push({
      severity: "critical",
      label: "Missing plant / facility name",
      detail: "An operating asset needs a stable name before review.",
      issueTypeCode: "research_note",
      linkedField: "asset_name",
    });
  }

  if (!hasValue(form, "country")) {
    issues.push({
      severity: "critical",
      label: "Missing country",
      detail: "Country is required for operating totals, maps, and exports.",
      issueTypeCode: "missing_country_location",
      linkedField: "country",
    });
  }

  if (isUnknownCode(form, "primary_use_type_code")) {
    issues.push({
      severity: "critical",
      label: "Missing use type",
      detail: "Power, direct-use, hybrid, or mineral classification is required.",
      issueTypeCode: "missing_use_type",
      linkedField: "primary_use_type_code",
    });
  }

  if (isUnknownCode(form, "lifecycle_phase_code")) {
    issues.push({
      severity: "critical",
      label: "Missing operating status",
      detail: "Operating, retired, offline, or refurbishment status is required.",
      issueTypeCode: "missing_lifecycle_status",
      linkedField: "lifecycle_phase_code",
    });
  }

  if (
    !hasAnyValue(form, [
      "electric_capacity_mwe",
      "electric_capacity_running_mwe",
      "thermal_capacity_mwth",
      "potential_min_mwe",
      "potential_max_mwe",
      "annual_power_generation_gwhe",
      "annual_heat_supply_gwhth",
      "annual_cooling_supply_gwhc",
    ])
  ) {
    issues.push({
      severity: "important",
      label: "Missing capacity or output",
      detail: "Add installed/running MWe, MWth, annual output, or a capacity note.",
      issueTypeCode: "missing_capacity_output",
      linkedField: "capacity_output",
    });
  }

  if (!hasValue(form, "latitude") || !hasValue(form, "longitude")) {
    issues.push({
      severity: "important",
      label: "Missing coordinates",
      detail: "Coordinate-confirmed map layers only show records with latitude and longitude.",
      issueTypeCode: "missing_coordinates",
      linkedField: "latitude, longitude",
    });
  }

  if (!hasValue(form, "cod_year") && !hasValue(form, "cod_raw")) {
    issues.push({
      severity: "important",
      label: "Missing COD / commissioning date",
      detail: "Add a structured COD year or raw commissioning note when known.",
      issueTypeCode: "research_note",
      linkedField: "cod_year, cod_raw",
    });
  }

  issues.push({
    severity: "workflow",
    label: "Source evidence handled separately",
    detail: "Add source/evidence links after saving the staging record.",
    issueTypeCode: "missing_source",
    linkedField: "sources",
  });

  issues.push({
    severity: "workflow",
    label: "Company roles handled separately",
    detail: "Owner, operator, supplier, and contractor links are managed on the detail page.",
    issueTypeCode: "missing_company_link",
    linkedField: "company_links",
  });

  return issues;
}

function getCompanyReadinessIssues(form: EntityFormValues): FormReadinessIssue[] {
  const issues: FormReadinessIssue[] = [];

  if (!hasValue(form, "company_name")) {
    issues.push({
      severity: "critical",
      label: "Missing company name",
      detail: "A company needs a stable name before it can be reviewed.",
      issueTypeCode: "research_note",
      linkedField: "company_name",
    });
  }

  if (isUnknownCode(form, "company_type_primary_code")) {
    issues.push({
      severity: "critical",
      label: "Missing primary company type",
      detail: "Primary category is required for company intelligence and filtering.",
      issueTypeCode: "missing_use_type",
      linkedField: "company_type_primary_code",
    });
  }

  if (isUnknownCode(form, "entity_type_code")) {
    issues.push({
      severity: "important",
      label: "Missing entity type",
      detail: "Legal entity, group, institution, or other entity type improves governance.",
      issueTypeCode: "research_note",
      linkedField: "entity_type_code",
    });
  }

  if (!hasValue(form, "headquarters_country")) {
    issues.push({
      severity: "important",
      label: "Missing headquarters country",
      detail: "HQ country helps company portfolio and market activity analysis.",
      issueTypeCode: "missing_country_location",
      linkedField: "headquarters_country",
    });
  }

  if (!hasValue(form, "website_url")) {
    issues.push({
      severity: "important",
      label: "Missing website",
      detail: "A company website or equivalent source improves validation confidence.",
      issueTypeCode: "source_validation",
      linkedField: "website_url",
    });
  }

  issues.push({
    severity: "workflow",
    label: "Source evidence handled separately",
    detail: "Add source/evidence links after saving the staging company record.",
    issueTypeCode: "missing_source",
    linkedField: "sources",
  });

  issues.push({
    severity: "workflow",
    label: "Project and asset roles handled separately",
    detail: "Company portfolios and ownership links are managed on the detail page.",
    issueTypeCode: "missing_company_link",
    linkedField: "company_roles",
  });

  return issues;
}

function FormActions({
  saving,
  backHref,
}: {
  saving: boolean;
  backHref: string;
}) {
  return (
    <div className="flex flex-col gap-3 border border-gray-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm leading-6 text-gray-600">
        PostgreSQL staging write path. Source links, company relationships, and
        promotion workflows stay separate.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
          href={backHref}
        >
          Cancel
        </Link>
        <button
          className="h-10 border border-[#8dc63f] bg-[#8dc63f] px-5 text-sm font-semibold text-white hover:bg-[#78ad35] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving}
          type="submit"
        >
          {saving ? "Saving..." : "Save Staging Record"}
        </button>
      </div>
    </div>
  );
}

function initialProjectValues(
  project?: PostgresPreviewProjectDetail | null
): EntityFormValues {
  return {
    project_name: project?.project_name || "",
    project_group: project?.project_group || "",
    primary_use_type_code: project?.primary_use_type_code || "unknown",
    lifecycle_phase_code: project?.lifecycle_phase_code || "prospect_tbd",
    location_text: project?.location_text || "",
    country: project?.country || "",
    region: project?.region || "",
    wb_region: project?.wb_region || "",
    latitude: toInputValue(project?.latitude),
    longitude: toInputValue(project?.longitude),
    resource_type: project?.resource_type || "",
    resource_temp_c: toInputValue(project?.resource_temp_c),
    potential_min_mwe: toInputValue(project?.potential_min_mwe),
    potential_max_mwe: toInputValue(project?.potential_max_mwe),
    electric_capacity_mwe: toInputValue(project?.electric_capacity_mwe),
    thermal_capacity_mwth: toInputValue(project?.thermal_capacity_mwth),
    annual_power_generation_gwhe: toInputValue(
      project?.annual_power_generation_gwhe
    ),
    annual_heat_supply_gwhth: toInputValue(project?.annual_heat_supply_gwhth),
    annual_cooling_supply_gwhc: toInputValue(
      project?.annual_cooling_supply_gwhc
    ),
    capacity_estimate_status_code:
      project?.capacity_estimate_status_code || "unknown",
    output_estimate_status_code: project?.output_estimate_status_code || "unknown",
    start_dev_year: toInputValue(project?.start_dev_year),
    target_cod_year: toInputValue(project?.target_cod_year),
    target_cod_month: toInputValue(project?.target_cod_month),
    cod_raw: project?.cod_raw || "",
    plant_technology: project?.plant_technology || "",
    turbine_supplier: project?.turbine_supplier || "",
    review_status_code: project?.review_status_code || "draft",
    research_status: project?.research_status || "",
    notes: project?.notes || "",
  };
}

function initialOperatingAssetValues(
  asset?: PostgresPreviewOperatingAssetDetail | null
): EntityFormValues {
  return {
    asset_name: asset?.asset_name || "",
    project_group: asset?.project_group || "",
    primary_use_type_code: asset?.primary_use_type_code || "unknown",
    lifecycle_phase_code: asset?.lifecycle_phase_code || "operating",
    location_text: asset?.location_text || "",
    country: asset?.country || "",
    region: asset?.region || "",
    wb_region: asset?.wb_region || "",
    latitude: toInputValue(asset?.latitude),
    longitude: toInputValue(asset?.longitude),
    resource_type: asset?.resource_type || "",
    resource_temp_c: toInputValue(asset?.resource_temp_c),
    potential_min_mwe: toInputValue(asset?.potential_min_mwe),
    potential_max_mwe: toInputValue(asset?.potential_max_mwe),
    electric_capacity_mwe: toInputValue(asset?.electric_capacity_mwe),
    electric_capacity_running_mwe: toInputValue(
      asset?.electric_capacity_running_mwe
    ),
    thermal_capacity_mwth: toInputValue(asset?.thermal_capacity_mwth),
    annual_power_generation_gwhe: toInputValue(
      asset?.annual_power_generation_gwhe
    ),
    annual_heat_supply_gwhth: toInputValue(asset?.annual_heat_supply_gwhth),
    annual_cooling_supply_gwhc: toInputValue(asset?.annual_cooling_supply_gwhc),
    capacity_estimate_status_code: asset?.capacity_estimate_status_code || "unknown",
    output_estimate_status_code: asset?.output_estimate_status_code || "unknown",
    start_dev_year: toInputValue(asset?.start_dev_year),
    cod_year: toInputValue(asset?.cod_year),
    cod_month: toInputValue(asset?.cod_month),
    cod_raw: asset?.cod_raw || "",
    number_of_units: asset?.number_of_units || "",
    plant_technology: asset?.plant_technology || "",
    turbine_supplier: asset?.turbine_supplier || "",
    review_status_code: asset?.review_status_code || "draft",
    research_status: asset?.research_status || "",
    notes: asset?.notes || "",
  };
}

function initialCompanyValues(
  company?: PostgresPreviewCompanyDetail | null
): EntityFormValues {
  return {
    company_name: company?.company_name || "",
    company_name_short: company?.company_name_short || "",
    company_legal_name: company?.company_legal_name || "",
    website_url: company?.website_url || "",
    linkedin_url: company?.linkedin_url || "",
    entity_type_code: company?.entity_type_code || "unknown",
    company_type_primary_code: company?.company_type_primary_code || "unknown",
    ownership_type: company?.ownership_type || "",
    company_status: company?.company_status || "active",
    headquarters_city: company?.headquarters_city || "",
    headquarters_country: company?.headquarters_country || "",
    region: company?.region || "",
    wb_region: company?.wb_region || "",
    geothermal_focus: company?.geothermal_focus || "",
    technology_focus: company?.technology_focus || "",
    service_scope_summary: company?.service_scope_summary || "",
    operating_markets_summary: company?.operating_markets_summary || "",
    review_status_code: company?.review_status_code || "draft",
    research_status: company?.research_status || "",
    notes: company?.notes || "",
  };
}

export function PostgresProjectForm({
  mode,
  project,
  referenceData,
}: {
  mode: EntityFormMode;
  project?: PostgresPreviewProjectDetail | null;
  referenceData: PostgresEntityFormReferenceData;
}) {
  const router = useRouter();
  const [originalForm] = useState<EntityFormValues>(() =>
    initialProjectValues(project)
  );
  const [form, setForm] = useState<EntityFormValues>(() =>
    initialProjectValues(project)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const endpoint =
    mode === "create"
      ? "/api/postgres-preview/projects"
      : `/api/postgres-preview/projects/${project?.project_id}`;
  const backHref = project
    ? `/postgres-preview/projects/${project.project_id}`
    : "/postgres-preview";
  const changeState = useFormChangeState({
    enabled: mode === "edit",
    form,
    originalForm,
    approvalSensitiveFields: projectApprovalSensitiveFields,
  });

  function setField(name: string, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to save project.");
      }

      setMessage("Project saved.");
      router.push(`/postgres-preview/projects/${json.project.project_id}`);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save project.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <FormNotice error={error} message={message} />

      <FormReadinessPanel
        changeState={mode === "edit" ? changeState : undefined}
        currentReviewStatus={originalForm.review_status_code}
        entityLabel="project"
        issueContext={
          mode === "edit" && project?.project_id
            ? { entityType: "project", entityId: project.project_id }
            : undefined
        }
        issues={getProjectReadinessIssues(form)}
      />

      <Section title="Identity And Location">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Field
            label="Project Name"
            {...fieldMeta(changeState, "project_name", {
              required: true,
              tone: "critical",
            })}
          >
            <TextInput
              form={form}
              name="project_name"
              required
              setField={setField}
            />
          </Field>
          <Field label="Project / Field Group" {...fieldMeta(changeState, "project_group")}>
            <TextInput form={form} name="project_group" setField={setField} />
          </Field>
          <Field
            label="Country"
            {...fieldMeta(changeState, "country", {
              required: true,
              tone: "critical",
            })}
          >
            <TextInput form={form} name="country" setField={setField} />
          </Field>
          <Field label="Region" {...fieldMeta(changeState, "region")}>
            <TextInput form={form} name="region" setField={setField} />
          </Field>
          <Field label="World Bank Region" {...fieldMeta(changeState, "wb_region")}>
            <TextInput form={form} name="wb_region" setField={setField} />
          </Field>
          <Field label="Location Text" {...fieldMeta(changeState, "location_text")}>
            <TextInput form={form} name="location_text" setField={setField} />
          </Field>
          <Field
            label="Latitude"
            {...fieldMeta(changeState, "latitude", {
              important: true,
              tone: "important",
            })}
          >
            <TextInput form={form} name="latitude" setField={setField} />
          </Field>
          <Field
            label="Longitude"
            {...fieldMeta(changeState, "longitude", {
              important: true,
              tone: "important",
            })}
          >
            <TextInput form={form} name="longitude" setField={setField} />
          </Field>
        </div>
      </Section>

      <Section title="Workflow And Classification">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Field
            label="Use Type"
            {...fieldMeta(changeState, "primary_use_type_code", {
              required: true,
              tone: "critical",
            })}
          >
            <SelectInput
              form={form}
              name="primary_use_type_code"
              options={referenceData.useTypes}
              setField={setField}
            />
          </Field>
          <Field
            label="Lifecycle Phase"
            {...fieldMeta(changeState, "lifecycle_phase_code", {
              required: true,
              tone: "critical",
            })}
          >
            <SelectInput
              form={form}
              name="lifecycle_phase_code"
              options={referenceData.lifecyclePhases}
              setField={setField}
            />
          </Field>
          <Field label="Review Status" {...fieldMeta(changeState, "review_status_code")}>
            <SelectInput
              form={form}
              name="review_status_code"
              options={referenceData.reviewStatuses}
              setField={setField}
            />
          </Field>
          <Field
            label="Capacity Confidence"
            {...fieldMeta(changeState, "capacity_estimate_status_code")}
          >
            <SelectInput
              form={form}
              name="capacity_estimate_status_code"
              options={referenceData.estimateStatuses}
              setField={setField}
            />
          </Field>
          <Field
            label="Output Confidence"
            {...fieldMeta(changeState, "output_estimate_status_code")}
          >
            <SelectInput
              form={form}
              name="output_estimate_status_code"
              options={referenceData.estimateStatuses}
              setField={setField}
            />
          </Field>
          <Field label="Research Status" {...fieldMeta(changeState, "research_status")}>
            <TextInput form={form} name="research_status" setField={setField} />
          </Field>
        </div>
      </Section>

      <Section title="Capacity And Output">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Field label="Potential Min MWe" {...fieldMeta(changeState, "potential_min_mwe")}>
            <TextInput form={form} name="potential_min_mwe" setField={setField} />
          </Field>
          <Field label="Potential Max MWe" {...fieldMeta(changeState, "potential_max_mwe")}>
            <TextInput form={form} name="potential_max_mwe" setField={setField} />
          </Field>
          <Field
            label="Planned MWe"
            {...fieldMeta(changeState, "electric_capacity_mwe", {
              important: true,
              tone: "important",
            })}
          >
            <TextInput
              form={form}
              name="electric_capacity_mwe"
              setField={setField}
            />
          </Field>
          <Field label="Thermal MWth" {...fieldMeta(changeState, "thermal_capacity_mwth")}>
            <TextInput
              form={form}
              name="thermal_capacity_mwth"
              setField={setField}
            />
          </Field>
          <Field
            label="Annual Power GWh"
            {...fieldMeta(changeState, "annual_power_generation_gwhe")}
          >
            <TextInput
              form={form}
              name="annual_power_generation_gwhe"
              setField={setField}
            />
          </Field>
          <Field
            label="Annual Heat GWhth"
            {...fieldMeta(changeState, "annual_heat_supply_gwhth")}
          >
            <TextInput
              form={form}
              name="annual_heat_supply_gwhth"
              setField={setField}
            />
          </Field>
          <Field
            label="Annual Cooling GWhc"
            {...fieldMeta(changeState, "annual_cooling_supply_gwhc")}
          >
            <TextInput
              form={form}
              name="annual_cooling_supply_gwhc"
              setField={setField}
            />
          </Field>
        </div>
      </Section>

      <Section title="Resource, Timeline, And Technology">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Field label="Resource Type" {...fieldMeta(changeState, "resource_type")}>
            <TextInput form={form} name="resource_type" setField={setField} />
          </Field>
          <Field label="Resource Temp C" {...fieldMeta(changeState, "resource_temp_c")}>
            <TextInput form={form} name="resource_temp_c" setField={setField} />
          </Field>
          <Field label="Start Dev Year" {...fieldMeta(changeState, "start_dev_year")}>
            <TextInput form={form} name="start_dev_year" setField={setField} />
          </Field>
          <Field label="Target COD Year" {...fieldMeta(changeState, "target_cod_year")}>
            <TextInput form={form} name="target_cod_year" setField={setField} />
          </Field>
          <Field label="Target COD Month" {...fieldMeta(changeState, "target_cod_month")}>
            <TextInput form={form} name="target_cod_month" setField={setField} />
          </Field>
          <Field label="COD Raw" {...fieldMeta(changeState, "cod_raw")}>
            <TextInput form={form} name="cod_raw" setField={setField} />
          </Field>
          <Field label="Plant Technology" {...fieldMeta(changeState, "plant_technology")}>
            <TextInput form={form} name="plant_technology" setField={setField} />
          </Field>
          <Field label="Turbine Supplier" {...fieldMeta(changeState, "turbine_supplier")}>
            <TextInput form={form} name="turbine_supplier" setField={setField} />
          </Field>
        </div>
      </Section>

      <Section title="Notes">
        <Field label="Notes" {...fieldMeta(changeState, "notes")}>
          <TextArea
            form={form}
            name="notes"
            placeholder="Research notes, assumptions, and missing-data comments."
            setField={setField}
          />
        </Field>
      </Section>

      <FormActions backHref={backHref} saving={saving} />
    </form>
  );
}

export function PostgresOperatingAssetForm({
  mode,
  asset,
  referenceData,
}: {
  mode: EntityFormMode;
  asset?: PostgresPreviewOperatingAssetDetail | null;
  referenceData: PostgresEntityFormReferenceData;
}) {
  const router = useRouter();
  const [originalForm] = useState<EntityFormValues>(() =>
    initialOperatingAssetValues(asset)
  );
  const [form, setForm] = useState<EntityFormValues>(() =>
    initialOperatingAssetValues(asset)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const endpoint =
    mode === "create"
      ? "/api/postgres-preview/operating-assets"
      : `/api/postgres-preview/operating-assets/${asset?.operating_asset_id}`;
  const backHref = asset
    ? `/postgres-preview/operating-assets/${asset.operating_asset_id}`
    : "/postgres-preview";
  const changeState = useFormChangeState({
    enabled: mode === "edit",
    form,
    originalForm,
    approvalSensitiveFields: assetApprovalSensitiveFields,
  });

  function setField(name: string, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to save plant / facility.");
      }

      setMessage("Plant / Facility saved.");
      router.push(
        `/postgres-preview/operating-assets/${json.operatingAsset.operating_asset_id}`
      );
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to save plant / facility."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <FormNotice error={error} message={message} />

      <FormReadinessPanel
        changeState={mode === "edit" ? changeState : undefined}
        currentReviewStatus={originalForm.review_status_code}
        entityLabel="plant / facility"
        issueContext={
          mode === "edit" && asset?.operating_asset_id
            ? {
                entityType: "operating_asset",
                entityId: asset.operating_asset_id,
              }
            : undefined
        }
        issues={getAssetReadinessIssues(form)}
      />

      <Section title="Identity And Location">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Field
            label="Plant / Facility Name"
            {...fieldMeta(changeState, "asset_name", {
              required: true,
              tone: "critical",
            })}
          >
            <TextInput form={form} name="asset_name" required setField={setField} />
          </Field>
          <Field label="Plant / Field Group" {...fieldMeta(changeState, "project_group")}>
            <TextInput form={form} name="project_group" setField={setField} />
          </Field>
          <Field
            label="Country"
            {...fieldMeta(changeState, "country", {
              required: true,
              tone: "critical",
            })}
          >
            <TextInput form={form} name="country" setField={setField} />
          </Field>
          <Field label="Region" {...fieldMeta(changeState, "region")}>
            <TextInput form={form} name="region" setField={setField} />
          </Field>
          <Field label="World Bank Region" {...fieldMeta(changeState, "wb_region")}>
            <TextInput form={form} name="wb_region" setField={setField} />
          </Field>
          <Field label="Location Text" {...fieldMeta(changeState, "location_text")}>
            <TextInput form={form} name="location_text" setField={setField} />
          </Field>
          <Field
            label="Latitude"
            {...fieldMeta(changeState, "latitude", {
              important: true,
              tone: "important",
            })}
          >
            <TextInput form={form} name="latitude" setField={setField} />
          </Field>
          <Field
            label="Longitude"
            {...fieldMeta(changeState, "longitude", {
              important: true,
              tone: "important",
            })}
          >
            <TextInput form={form} name="longitude" setField={setField} />
          </Field>
        </div>
      </Section>

      <Section title="Workflow And Classification">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Field
            label="Use Type"
            {...fieldMeta(changeState, "primary_use_type_code", {
              required: true,
              tone: "critical",
            })}
          >
            <SelectInput
              form={form}
              name="primary_use_type_code"
              options={referenceData.useTypes}
              setField={setField}
            />
          </Field>
          <Field
            label="Operating Status"
            {...fieldMeta(changeState, "lifecycle_phase_code", {
              required: true,
              tone: "critical",
            })}
          >
            <SelectInput
              form={form}
              name="lifecycle_phase_code"
              options={referenceData.lifecyclePhases}
              setField={setField}
            />
          </Field>
          <Field label="Review Status" {...fieldMeta(changeState, "review_status_code")}>
            <SelectInput
              form={form}
              name="review_status_code"
              options={referenceData.reviewStatuses}
              setField={setField}
            />
          </Field>
          <Field
            label="Capacity Confidence"
            {...fieldMeta(changeState, "capacity_estimate_status_code")}
          >
            <SelectInput
              form={form}
              name="capacity_estimate_status_code"
              options={referenceData.estimateStatuses}
              setField={setField}
            />
          </Field>
          <Field
            label="Output Confidence"
            {...fieldMeta(changeState, "output_estimate_status_code")}
          >
            <SelectInput
              form={form}
              name="output_estimate_status_code"
              options={referenceData.estimateStatuses}
              setField={setField}
            />
          </Field>
          <Field label="Research Status" {...fieldMeta(changeState, "research_status")}>
            <TextInput form={form} name="research_status" setField={setField} />
          </Field>
        </div>
      </Section>

      <Section title="Capacity And Output">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Field
            label="Installed MWe"
            {...fieldMeta(changeState, "electric_capacity_mwe", {
              important: true,
              tone: "important",
            })}
          >
            <TextInput
              form={form}
              name="electric_capacity_mwe"
              setField={setField}
            />
          </Field>
          <Field
            label="Running MWe"
            {...fieldMeta(changeState, "electric_capacity_running_mwe", {
              important: true,
              tone: "important",
            })}
          >
            <TextInput
              form={form}
              name="electric_capacity_running_mwe"
              setField={setField}
            />
          </Field>
          <Field label="Thermal MWth" {...fieldMeta(changeState, "thermal_capacity_mwth")}>
            <TextInput
              form={form}
              name="thermal_capacity_mwth"
              setField={setField}
            />
          </Field>
          <Field label="Potential Min MWe" {...fieldMeta(changeState, "potential_min_mwe")}>
            <TextInput form={form} name="potential_min_mwe" setField={setField} />
          </Field>
          <Field label="Potential Max MWe" {...fieldMeta(changeState, "potential_max_mwe")}>
            <TextInput form={form} name="potential_max_mwe" setField={setField} />
          </Field>
          <Field
            label="Annual Power GWh"
            {...fieldMeta(changeState, "annual_power_generation_gwhe")}
          >
            <TextInput
              form={form}
              name="annual_power_generation_gwhe"
              setField={setField}
            />
          </Field>
          <Field
            label="Annual Heat GWhth"
            {...fieldMeta(changeState, "annual_heat_supply_gwhth")}
          >
            <TextInput
              form={form}
              name="annual_heat_supply_gwhth"
              setField={setField}
            />
          </Field>
          <Field
            label="Annual Cooling GWhc"
            {...fieldMeta(changeState, "annual_cooling_supply_gwhc")}
          >
            <TextInput
              form={form}
              name="annual_cooling_supply_gwhc"
              setField={setField}
            />
          </Field>
        </div>
      </Section>

      <Section title="Resource, Operation, And Technology">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Field label="Resource Type" {...fieldMeta(changeState, "resource_type")}>
            <TextInput form={form} name="resource_type" setField={setField} />
          </Field>
          <Field label="Resource Temp C" {...fieldMeta(changeState, "resource_temp_c")}>
            <TextInput form={form} name="resource_temp_c" setField={setField} />
          </Field>
          <Field label="Start Dev Year" {...fieldMeta(changeState, "start_dev_year")}>
            <TextInput form={form} name="start_dev_year" setField={setField} />
          </Field>
          <Field
            label="COD Year"
            {...fieldMeta(changeState, "cod_year", {
              important: true,
              tone: "important",
            })}
          >
            <TextInput form={form} name="cod_year" setField={setField} />
          </Field>
          <Field label="COD Month" {...fieldMeta(changeState, "cod_month")}>
            <TextInput form={form} name="cod_month" setField={setField} />
          </Field>
          <Field label="COD Raw" {...fieldMeta(changeState, "cod_raw")}>
            <TextInput form={form} name="cod_raw" setField={setField} />
          </Field>
          <Field label="Units" {...fieldMeta(changeState, "number_of_units")}>
            <TextInput form={form} name="number_of_units" setField={setField} />
          </Field>
          <Field label="Plant Technology" {...fieldMeta(changeState, "plant_technology")}>
            <TextInput form={form} name="plant_technology" setField={setField} />
          </Field>
          <Field label="Turbine Supplier" {...fieldMeta(changeState, "turbine_supplier")}>
            <TextInput form={form} name="turbine_supplier" setField={setField} />
          </Field>
        </div>
      </Section>

      <Section title="Notes">
        <Field label="Notes" {...fieldMeta(changeState, "notes")}>
          <TextArea
            form={form}
            name="notes"
            placeholder="Operating history, capacity notes, and validation context."
            setField={setField}
          />
        </Field>
      </Section>

      <FormActions backHref={backHref} saving={saving} />
    </form>
  );
}

export function PostgresCompanyForm({
  mode,
  company,
  referenceData,
}: {
  mode: EntityFormMode;
  company?: PostgresPreviewCompanyDetail | null;
  referenceData: PostgresEntityFormReferenceData;
}) {
  const router = useRouter();
  const [originalForm] = useState<EntityFormValues>(() =>
    initialCompanyValues(company)
  );
  const [form, setForm] = useState<EntityFormValues>(() =>
    initialCompanyValues(company)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const endpoint =
    mode === "create"
      ? "/api/postgres-preview/companies"
      : `/api/postgres-preview/companies/${company?.company_id}`;
  const backHref = company
    ? `/postgres-preview/companies/${company.company_id}`
    : "/postgres-preview";
  const changeState = useFormChangeState({
    enabled: mode === "edit",
    form,
    originalForm,
    approvalSensitiveFields: companyApprovalSensitiveFields,
  });

  function setField(name: string, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to save company.");
      }

      setMessage("Company saved.");
      router.push(`/postgres-preview/companies/${json.company.company_id}`);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save company.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <FormNotice error={error} message={message} />

      <FormReadinessPanel
        changeState={mode === "edit" ? changeState : undefined}
        currentReviewStatus={originalForm.review_status_code}
        entityLabel="company"
        issueContext={
          mode === "edit" && company?.company_id
            ? { entityType: "company", entityId: company.company_id }
            : undefined
        }
        issues={getCompanyReadinessIssues(form)}
      />

      <Section title="Identity And Classification">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Field
            label="Company Name"
            {...fieldMeta(changeState, "company_name", {
              required: true,
              tone: "critical",
            })}
          >
            <TextInput
              form={form}
              name="company_name"
              required
              setField={setField}
            />
          </Field>
          <Field label="Short Name" {...fieldMeta(changeState, "company_name_short")}>
            <TextInput
              form={form}
              name="company_name_short"
              setField={setField}
            />
          </Field>
          <Field label="Legal Name" {...fieldMeta(changeState, "company_legal_name")}>
            <TextInput
              form={form}
              name="company_legal_name"
              setField={setField}
            />
          </Field>
          <Field
            label="Entity Type"
            {...fieldMeta(changeState, "entity_type_code", {
              important: true,
              tone: "important",
            })}
          >
            <SelectInput
              form={form}
              name="entity_type_code"
              options={referenceData.companyEntityTypes}
              setField={setField}
            />
          </Field>
          <Field
            label="Primary Company Type"
            {...fieldMeta(changeState, "company_type_primary_code", {
              required: true,
              tone: "critical",
            })}
          >
            <SelectInput
              form={form}
              name="company_type_primary_code"
              options={referenceData.companyPrimaryTypes}
              setField={setField}
            />
          </Field>
          <Field label="Review Status" {...fieldMeta(changeState, "review_status_code")}>
            <SelectInput
              form={form}
              name="review_status_code"
              options={referenceData.reviewStatuses}
              setField={setField}
            />
          </Field>
          <Field label="Company Status" {...fieldMeta(changeState, "company_status")}>
            <TextInput form={form} name="company_status" setField={setField} />
          </Field>
          <Field label="Ownership Type" {...fieldMeta(changeState, "ownership_type")}>
            <TextInput form={form} name="ownership_type" setField={setField} />
          </Field>
          <Field label="Research Status" {...fieldMeta(changeState, "research_status")}>
            <TextInput form={form} name="research_status" setField={setField} />
          </Field>
        </div>
      </Section>

      <Section title="Location And Links">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Field label="HQ City" {...fieldMeta(changeState, "headquarters_city")}>
            <TextInput
              form={form}
              name="headquarters_city"
              setField={setField}
            />
          </Field>
          <Field
            label="HQ Country"
            {...fieldMeta(changeState, "headquarters_country", {
              important: true,
              tone: "important",
            })}
          >
            <TextInput
              form={form}
              name="headquarters_country"
              setField={setField}
            />
          </Field>
          <Field label="Region" {...fieldMeta(changeState, "region")}>
            <TextInput form={form} name="region" setField={setField} />
          </Field>
          <Field label="World Bank Region" {...fieldMeta(changeState, "wb_region")}>
            <TextInput form={form} name="wb_region" setField={setField} />
          </Field>
          <Field
            label="Website"
            {...fieldMeta(changeState, "website_url", {
              important: true,
              tone: "important",
            })}
          >
            <TextInput form={form} name="website_url" setField={setField} />
          </Field>
          <Field label="LinkedIn" {...fieldMeta(changeState, "linkedin_url")}>
            <TextInput form={form} name="linkedin_url" setField={setField} />
          </Field>
        </div>
      </Section>

      <Section title="Geothermal Focus">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Field label="Geothermal Focus" {...fieldMeta(changeState, "geothermal_focus")}>
            <TextArea
              form={form}
              name="geothermal_focus"
              placeholder="Technology, market, and role focus."
              setField={setField}
            />
          </Field>
          <Field label="Technology Focus" {...fieldMeta(changeState, "technology_focus")}>
            <TextArea
              form={form}
              name="technology_focus"
              placeholder="Binary, flash, drilling, direct-use, software..."
              setField={setField}
            />
          </Field>
          <Field label="Service Scope" {...fieldMeta(changeState, "service_scope_summary")}>
            <TextArea
              form={form}
              name="service_scope_summary"
              placeholder="Capabilities and operating scope."
              setField={setField}
            />
          </Field>
          <Field
            label="Operating Markets"
            {...fieldMeta(changeState, "operating_markets_summary")}
          >
            <TextArea
              form={form}
              name="operating_markets_summary"
              placeholder="Countries and regions active in."
              setField={setField}
            />
          </Field>
        </div>
      </Section>

      <Section title="Notes">
        <Field label="Notes" {...fieldMeta(changeState, "notes")}>
          <TextArea
            form={form}
            name="notes"
            placeholder="Internal research notes and classification context."
            setField={setField}
          />
        </Field>
      </Section>

      <FormActions backHref={backHref} saving={saving} />
    </form>
  );
}
