"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import type {
  PostgresCompanyOperatingAssetLink,
  PostgresCompanyProjectLink,
  PostgresCompanyRelationship,
  PostgresCountryReference,
  PostgresEntityFormReferenceData,
  PostgresPromotedOperatingAsset,
  PostgresPreviewCompanyDetail,
  PostgresPreviewOperatingAssetDetail,
  PostgresPreviewProjectDetail,
} from "@/lib/postgres-preview";
import PostgresStatusBadge from "@/components/postgres-preview/PostgresStatusBadge";

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
type ReadinessRelationshipContext = {
  sourceCount?: number;
  companyLinkCount?: number;
  activityLinkCount?: number;
};
type CompanyWorkflowPreview = {
  projectLinks: PostgresCompanyProjectLink[];
  operatingAssetLinks: PostgresCompanyOperatingAssetLink[];
  relationships: PostgresCompanyRelationship[];
};
type ProjectWorkflowPreview = {
  companyLinks: PostgresCompanyProjectLink[];
  promotedAssets: PostgresPromotedOperatingAsset[];
};
type AssetWorkflowPreview = {
  companyLinks: PostgresCompanyOperatingAssetLink[];
  originatingProject?: {
    project_id: string;
    project_name: string;
    country: string | null;
  } | null;
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

function getApiIssues(json: unknown) {
  if (!json || typeof json !== "object" || !("issues" in json)) {
    return [];
  }

  const issues = (json as { issues?: unknown }).issues;
  if (!Array.isArray(issues)) {
    return [];
  }

  return issues.filter((issue): issue is string => typeof issue === "string");
}

function getApiError(json: unknown, fallback: string) {
  if (!json || typeof json !== "object" || !("error" in json)) {
    return fallback;
  }

  const error = (json as { error?: unknown }).error;
  return typeof error === "string" && error.trim() ? error : fallback;
}

function inputClass() {
  return "min-h-10 scroll-mt-24 border border-gray-300 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-[#1f2937] outline-none focus:border-[#8dc63f]";
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
  help,
  changed = false,
  required = false,
  important = false,
  approvalSensitive = false,
  tone,
}: {
  label: string;
  children: React.ReactNode;
  help?: string;
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
      {help ? (
        <span className="text-[11px] font-medium normal-case leading-4 tracking-normal text-gray-500">
          {help}
        </span>
      ) : null}
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
      id={`field-${name}`}
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
      id={`field-${name}`}
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
      id={`field-${name}`}
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

function normalizeCountryOptionValue(value: string) {
  const normalized = value
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

  if (normalized === "turkey") {
    return "turkiye";
  }

  return normalized;
}

function findSelectedCountry({
  countries,
  countryId,
  countryName,
}: {
  countries: PostgresCountryReference[];
  countryId?: string;
  countryName?: string;
}) {
  if (countryId) {
    const match = countries.find((country) => country.country_id === countryId);

    if (match) {
      return match;
    }
  }

  if (!countryName) {
    return null;
  }

  const countryKey = normalizeCountryOptionValue(countryName);
  return (
    countries.find(
      (country) =>
        normalizeCountryOptionValue(country.country_name) === countryKey ||
        country.iso3.toLowerCase() === countryName.trim().toLowerCase()
    ) || null
  );
}

function CountryReferenceSelect({
  countryIdName,
  countryName,
  form,
  referenceData,
  setField,
}: {
  countryIdName: string;
  countryName: string;
  form: EntityFormValues;
  referenceData: PostgresEntityFormReferenceData;
  setField: (name: string, value: string) => void;
}) {
  const selectedCountry = findSelectedCountry({
    countries: referenceData.countries,
    countryId: form[countryIdName],
    countryName: form[countryName],
  });
  const hasUnmatchedCountryText = Boolean(form[countryName] && !selectedCountry);

  function handleCountryChange(countryId: string) {
    const country = referenceData.countries.find(
      (option) => option.country_id === countryId
    );

    if (!country) {
      setField(countryIdName, "");
      setField(countryName, "");
      setField("region", "");
      setField("wb_region", "");
      return;
    }

    setField(countryIdName, country.country_id);
    setField(countryName, country.country_name);
    setField("region", country.tge_region);
    setField("wb_region", country.wb_region);
  }

  return (
    <>
      <select
        className={inputClass()}
        id={`field-${countryIdName}`}
        name={countryIdName}
        value={selectedCountry?.country_id || ""}
        onChange={(event) => handleCountryChange(event.target.value)}
      >
        <option value="">
          {hasUnmatchedCountryText
            ? `Unmatched: ${form[countryName]}`
            : "Select country"}
        </option>
        {referenceData.countries.map((country) => (
          <option key={country.country_id} value={country.country_id}>
            {country.country_name} ({country.iso3})
          </option>
        ))}
      </select>
      {hasUnmatchedCountryText ? (
        <span className="text-[11px] leading-4 text-amber-700">
          This legacy country text is not yet linked to the canonical country
          reference. Selecting a country will auto-fill ISO3, TGE region, and
          World Bank region.
        </span>
      ) : selectedCountry ? (
        <span className="text-[11px] leading-4 text-gray-500">
          ISO3 {selectedCountry.iso3} · regions are derived from the country
          reference.
        </span>
      ) : null}
    </>
  );
}

function DerivedGeographyField({ value }: { value?: string }) {
  return (
    <div className="min-h-10 border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700">
      {value || "Auto-filled after country selection"}
    </div>
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
    <details
      className="group scroll-mt-6 border border-gray-200 bg-white"
      id={sectionAnchorId(title)}
      open
    >
      <summary className="flex cursor-pointer list-none flex-col gap-3 border-b border-gray-200 px-5 py-4 marker:hidden sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-[#1f2937]">{title}</h2>
        <span className="w-full shrink-0 border border-gray-200 bg-[#fafafa] px-2 py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-600 sm:w-auto">
          Toggle
        </span>
      </summary>
      <div className="px-5 py-5">{children}</div>
    </details>
  );
}

function sectionAnchorId(title: string) {
  return `form-section-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

function newSourceHref(
  entityType?: "project" | "operating_asset" | "company",
  entityId?: string
) {
  if (!entityType || !entityId) {
    return "/sources/new";
  }

  const params = new URLSearchParams({
    entityType,
    entityId,
  });

  return `/sources/new?${params.toString()}`;
}

function FormBodyLayout({
  children,
  rail,
}: {
  children: React.ReactNode;
  rail: React.ReactNode;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
      <div className="space-y-6">{children}</div>
      <aside className="order-first xl:sticky xl:top-4 xl:order-last">{rail}</aside>
    </div>
  );
}

function FormWorkflowRail({
  entityLabel,
  issues,
  changeState,
  sections,
  backHref,
  saving,
  error,
  message,
}: {
  entityLabel: string;
  issues: FormReadinessIssue[];
  changeState?: FormChangeState;
  sections: string[];
  backHref: string;
  saving: boolean;
  error?: string;
  message?: string;
}) {
  const criticalCount = issues.filter(
    (issue) => issue.severity === "critical"
  ).length;
  const importantCount = issues.filter(
    (issue) => issue.severity === "important"
  ).length;
  const workflowCount = issues.filter(
    (issue) => issue.severity === "workflow"
  ).length;
  const changedCount = changeState?.changedFieldNames.length || 0;
  const approvalChangedCount =
    changeState?.approvalSensitiveChangedFieldNames.length || 0;

  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
          Workflow Summary
        </p>
        <h2 className="mt-1 text-base font-bold text-[#1f2937]">
          {entityLabel} edit guide
        </h2>
        <p className="mt-2 text-xs leading-5 text-gray-600">
          Save drafts freely. Resolve critical blockers before review,
          approval, export-ready use, or promotion workflows.
        </p>
      </div>
      <div className="space-y-4 px-4 py-4">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="border border-red-100 bg-white px-3 py-2">
            <div className="text-lg font-bold text-red-800">{criticalCount}</div>
            <div className="font-semibold text-gray-700">Critical</div>
          </div>
          <div className="border border-amber-100 bg-white px-3 py-2">
            <div className="text-lg font-bold text-amber-800">{importantCount}</div>
            <div className="font-semibold text-gray-700">Important</div>
          </div>
          <div className="border border-blue-100 bg-white px-3 py-2">
            <div className="text-lg font-bold text-blue-800">{workflowCount}</div>
            <div className="font-semibold text-gray-700">Workflow</div>
          </div>
          <div className="border border-gray-200 bg-[#fafafa] px-3 py-2">
            <div className="text-lg font-bold text-[#1f2937]">{changedCount}</div>
            <div className="font-semibold text-gray-700">Edited</div>
          </div>
        </div>

        {approvalChangedCount > 0 ? (
          <div className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
            {approvalChangedCount} approval-sensitive field
            {approvalChangedCount === 1 ? "" : "s"} edited. Approved records
            should be re-reviewed before export-ready use.
          </div>
        ) : null}

        <div className="border-t border-gray-200 pt-4">
          <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Actions
          </div>
          <p className="mt-1 text-xs leading-5 text-gray-600">
            Same save action as the bottom form button; review and approval stay
            separate.
          </p>
          <div className="mt-3 grid gap-2">
            <button
              className="h-10 border border-[#8dc63f] bg-[#8dc63f] px-4 text-sm font-semibold text-white hover:bg-[#78ad35] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
              type="submit"
            >
              {saving ? "Saving..." : "Save Draft / Staging Record"}
            </button>
            <Link
              className="inline-flex h-9 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
              href={backHref}
            >
              Cancel
            </Link>
          </div>
          {error || message ? (
            <div
              className={`mt-3 border px-3 py-2 text-xs leading-5 ${
                error
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-green-200 bg-green-50 text-green-800"
              }`}
            >
              {error || message}
            </div>
          ) : null}
        </div>

        <nav className="space-y-1">
          <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Sections
          </div>
          {sections.map((section) => (
            <a
              className="block border border-transparent px-2 py-1.5 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:bg-[#f3f8ec] hover:text-[#4f7f1f]"
              href={`#${sectionAnchorId(section)}`}
              key={section}
            >
              {section}
            </a>
          ))}
        </nav>
      </div>
    </section>
  );
}

function FormNotice({
  error,
  errorIssues = [],
  message,
}: {
  error: string;
  errorIssues?: string[];
  message: string;
}) {
  return (
    <>
      {error ? (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <div>{error}</div>
          {errorIssues.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5">
              {errorIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          ) : null}
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
    return "border-red-200 bg-white text-red-800";
  }

  if (severity === "important") {
    return "border-amber-200 bg-white text-amber-900";
  }

  return "border-blue-200 bg-white text-blue-900";
}

function issueMeaning(severity: FormReadinessIssue["severity"]) {
  if (severity === "critical") {
    return "Blocks submit for review, approval, and export-ready use. Draft saving remains allowed.";
  }

  if (severity === "important") {
    return "Does not block draft saving. It should be resolved or explicitly accepted during review.";
  }

  return "Separate workflow item. Usually handled after saving on the detail page.";
}

function ReadinessMeaningCard({
  severity,
  label,
  children,
}: {
  severity: FormReadinessIssue["severity"];
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 bg-white px-3 py-2.5">
      <PostgresStatusBadge domain="severity" label={label} value={severity} />
      <p className="mt-2 text-xs leading-5 text-gray-600">{children}</p>
    </div>
  );
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

const readinessFieldAnchorOverrides: Record<string, string | null> = {
  capacity_output: "electric_capacity_mwe",
  sources: null,
  company_links: null,
  company_roles: null,
};

function issueFieldHref(issue: FormReadinessIssue) {
  const fieldName = issue.linkedField?.split(",")[0]?.trim();

  if (!fieldName) {
    return null;
  }

  const targetField = readinessFieldAnchorOverrides[fieldName] ?? fieldName;

  return targetField ? `#field-${targetField}` : null;
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
            saved while critical and important gaps remain; review, approval,
            and export-ready actions apply stricter checks.
          </p>
        </div>
        <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-3 md:flex md:flex-wrap md:justify-end">
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
      <div className="space-y-3 px-4 py-4 sm:px-5">
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
          <ReadinessMeaningCard label="Critical" severity="critical">
            Blocks review, approval, and export-ready use. Save draft remains
            allowed.
          </ReadinessMeaningCard>
          <ReadinessMeaningCard label="Important" severity="important">
            Should be fixed or accepted during review, but does not block draft
            saving.
          </ReadinessMeaningCard>
          <ReadinessMeaningCard label="Workflow" severity="workflow">
            Handled through linked source, relationship, or Research Ops
            workflows.
          </ReadinessMeaningCard>
        </div>

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
          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
            {issues.map((issue) => {
              const fieldHref = issueFieldHref(issue);

              return (
                <div
                  key={`${issue.severity}-${issue.label}`}
                  className={`border px-3 py-3 ${issueTone(issue.severity)}`}
                >
                  <div className="text-xs font-semibold uppercase tracking-wide">
                    {issue.severity}
                  </div>
                  <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm font-bold">{issue.label}</div>
                      <div className="mt-1 text-xs leading-5">
                        {issue.detail}
                      </div>
                      <div className="mt-2 text-[11px] leading-5 opacity-80">
                        {issueMeaning(issue.severity)}
                      </div>
                    </div>
                    <div className="grid shrink-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                      {fieldHref ? (
                        <a
                          className="inline-flex h-8 items-center justify-center border border-current bg-white/70 px-3 text-xs font-semibold hover:bg-white"
                          href={fieldHref}
                        >
                          Go To Field
                        </a>
                      ) : null}
                      {issueContext ? (
                        <button
                          className="h-8 border border-current bg-white/70 px-3 text-xs font-semibold hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={Boolean(creatingIssueKey)}
                          type="button"
                          onClick={() =>
                            createIssue({
                              key: `issue-${issue.label}`,
                              issueTypeCode:
                                issue.issueTypeCode || "research_note",
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function getProjectReadinessIssues(
  form: EntityFormValues,
  relationships: ReadinessRelationshipContext = {}
): FormReadinessIssue[] {
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

  if (isUnknownCode(form, "lifecycle_phase_code")) {
    issues.push({
      severity: "critical",
      label: "Missing project phase",
      detail: "A project phase is required before review, approval, or export-ready use.",
      issueTypeCode: "missing_lifecycle_status",
      linkedField: "lifecycle_phase_code",
    });
  }

  if (form.lifecycle_phase_code === "prospect_tbd") {
    issues.push({
      severity: "important",
      label: "Project phase is Prospect",
      detail:
        "Prospect is valid for early-stage projects, but should remain visible for editor review and later classification.",
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

  if ((relationships.sourceCount || 0) === 0) {
    issues.push({
      severity: "workflow",
      label: "Source evidence needed",
      detail: "Add at least one source/evidence link before review or export readiness.",
      issueTypeCode: "missing_source",
      linkedField: "sources",
    });
  }

  if ((relationships.companyLinkCount || 0) === 0) {
    issues.push({
      severity: "workflow",
      label: "Company role links needed",
      detail:
        "Developer, owner, operator, and supplier links are managed on the detail page.",
      issueTypeCode: "missing_company_link",
      linkedField: "company_links",
    });
  }

  return issues;
}

function getAssetReadinessIssues(
  form: EntityFormValues,
  relationships: ReadinessRelationshipContext = {}
): FormReadinessIssue[] {
  const issues: FormReadinessIssue[] = [];

  if (!hasValue(form, "asset_name")) {
    issues.push({
      severity: "critical",
      label: "Missing plant name",
      detail: "A plant record needs a stable name before review.",
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

  if ((relationships.sourceCount || 0) === 0) {
    issues.push({
      severity: "workflow",
      label: "Source evidence needed",
      detail: "Add at least one source/evidence link before review or export readiness.",
      issueTypeCode: "missing_source",
      linkedField: "sources",
    });
  }

  if ((relationships.companyLinkCount || 0) === 0) {
    issues.push({
      severity: "workflow",
      label: "Company role links needed",
      detail:
        "Owner, operator, supplier, and contractor links are managed on the detail page.",
      issueTypeCode: "missing_company_link",
      linkedField: "company_links",
    });
  }

  return issues;
}

function getCompanyReadinessIssues(
  form: EntityFormValues,
  relationships: ReadinessRelationshipContext = {}
): FormReadinessIssue[] {
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
      label: "Missing primary business identity",
      detail:
        "Primary business identity is required for company intelligence and filtering.",
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

  if ((relationships.sourceCount || 0) === 0) {
    issues.push({
      severity: "workflow",
      label: "Source evidence needed",
      detail: "Add at least one source/evidence link before review or export readiness.",
      issueTypeCode: "missing_source",
      linkedField: "sources",
    });
  }

  if ((relationships.activityLinkCount || 0) === 0) {
    issues.push({
      severity: "workflow",
      label: "Project or plant role links needed",
      detail: "Company portfolios and ownership links are managed on the detail page.",
      issueTypeCode: "missing_company_link",
      linkedField: "company_roles",
    });
  }

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
        Save writes a governed draft even when non-critical fields are
        incomplete. Submit/review, approval, export-ready status, source links,
        company relationships, and promotion workflows stay governed separately.
      </p>
      <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-2 sm:flex sm:flex-wrap">
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
          {saving ? "Saving..." : "Save Draft"}
        </button>
      </div>
    </div>
  );
}

type WorkflowQuickAction = {
  label: string;
  description: string;
  href: string | null;
  group?: WorkflowQuickActionGroup;
};

type WorkflowQuickActionGroup =
  | "record"
  | "evidence"
  | "relationships"
  | "governance";

const workflowQuickActionGroupOrder: WorkflowQuickActionGroup[] = [
  "record",
  "evidence",
  "relationships",
  "governance",
];

const workflowQuickActionGroupMeta: Record<
  WorkflowQuickActionGroup,
  { eyebrow: string; title: string; description: string }
> = {
  record: {
    eyebrow: "Core",
    title: "Core Data",
    description: "Open the saved profile and continue core review.",
  },
  evidence: {
    eyebrow: "Evidence",
    title: "Sources & Evidence",
    description: "Attach governed sources and review evidence.",
  },
  relationships: {
    eyebrow: "Workflow",
    title: "Relationships",
    description: "Connect companies, projects, plants, and roles.",
  },
  governance: {
    eyebrow: "Governance",
    title: "Review & Readiness",
    description: "Route follow-up work into Research Ops.",
  },
};

function WorkflowQuickActions({
  entityLabel,
  mode,
  actions,
}: {
  entityLabel: string;
  mode: EntityFormMode;
  actions: WorkflowQuickAction[];
}) {
  const saved = actions.some((action) => action.href);
  const groupedActions = workflowQuickActionGroupOrder
    .map((group) => ({
      group,
      actions: actions.filter((action) => (action.group || "record") === group),
    }))
    .filter((group) => group.actions.length > 0);

  return (
    <div className="mb-3 border border-blue-100 bg-blue-50 px-3 py-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-sm font-bold text-blue-950">
            Post-save workflow actions
          </h3>
          <p className="mt-1 text-[11px] leading-5 text-blue-900">
            {saved
              ? `Move this ${entityLabel.toLowerCase()} from draft editing into evidence, relationships, and review.`
              : `Save the ${entityLabel.toLowerCase()} draft first to unlock evidence, relationships, and review workspaces.`}
          </p>
        </div>
        {mode === "create" ? (
          <span className="inline-flex min-h-7 items-center justify-center border border-blue-200 bg-white px-2 text-[11px] font-semibold uppercase tracking-wide text-blue-900">
            Save first
          </span>
        ) : null}
      </div>
      <div className="mt-3 space-y-2">
        {groupedActions.map(({ group, actions: groupActions }) => {
          const meta = workflowQuickActionGroupMeta[group];

          return (
            <section
              className="border border-blue-100 bg-white/50 px-2.5 py-2.5"
              key={group}
            >
              <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-700">
                    {meta.eyebrow}
                  </div>
                  <h4 className="mt-1 text-xs font-bold text-blue-950">
                    {meta.title}
                  </h4>
                </div>
                <p className="max-w-xl text-[11px] leading-5 text-blue-800">
                  {meta.description}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
                {groupActions.map((action) =>
                  action.href ? (
                    <Link
                      className="border border-blue-200 bg-white px-2.5 py-1.5 text-[11px] leading-5 text-blue-950 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                      href={action.href}
                      key={action.label}
                    >
                      <div className="font-bold">{action.label}</div>
                      <div className="mt-0.5 text-blue-800">
                        {action.description}
                      </div>
                    </Link>
                  ) : (
                    <div
                      className="border border-blue-100 bg-white/70 px-2.5 py-1.5 text-[11px] leading-5 text-blue-700 opacity-70"
                      key={action.label}
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold">{action.label}</span>
                        <span className="border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                          After Save
                        </span>
                      </div>
                      <div className="mt-0.5">{action.description}</div>
                    </div>
                  )
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ProjectWorkflowBridge({
  mode,
  project,
  relationshipPreview,
}: {
  mode: EntityFormMode;
  project?: PostgresPreviewProjectDetail | null;
  relationshipPreview?: ProjectWorkflowPreview;
}) {
  const projectHref = project
    ? `/postgres-preview/projects/${project.project_id}`
    : null;
  const evidenceHref = projectHref ? `${projectHref}#project-source-evidence` : null;
  const sourceCreateHref = newSourceHref("project", project?.project_id);
  const relationshipsHref = projectHref
    ? `${projectHref}#project-company-links`
    : null;
  const linkedAssetHref = projectHref ? `${projectHref}#project-promotion` : null;
  const sourcePreview = project?.sources?.slice(0, 2) || [];
  const sourceCount = project?.source_count || 0;
  const companyLinkCount =
    relationshipPreview?.companyLinks.length ?? project?.company_link_count ?? 0;
  const companyPreview = relationshipPreview?.companyLinks.slice(0, 3) || [];
  const promotedAssetCount = relationshipPreview?.promotedAssets.length || 0;
  const promotedAssetPreview =
    relationshipPreview?.promotedAssets.slice(0, 3) || [];

  return (
    <Section title="Evidence And Relationship Workflow">
      <WorkflowQuickActions
        actions={[
          {
            label: "Open Project",
            description: "Review profile, audit, and readiness.",
            href: projectHref,
            group: "record",
          },
          {
            label: "Evidence",
            description: "Add source links and field evidence.",
            href: evidenceHref,
            group: "evidence",
          },
          {
            label: "Company Roles",
            description: "Link developers, owners, operators, suppliers.",
            href: relationshipsHref,
            group: "relationships",
          },
          {
            label: "Related Plants",
            description: "Review promotion and plant links.",
            href: linkedAssetHref,
            group: "relationships",
          },
          {
            label: "Research Ops",
            description: "Create or review operational follow-ups.",
            href: projectHref ? "/postgres-preview/research-ops#persistent-issues" : null,
            group: "governance",
          },
        ]}
        entityLabel="Project"
        mode={mode}
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="border border-gray-200 bg-[#fafafa] px-4 py-4">
          <h3 className="text-sm font-bold text-[#1f2937]">
            Evidence / Source
          </h3>
          <p className="mt-2 text-xs leading-5 text-gray-600">
            Source URL, source title, date, source type, linked field, extracted
            value, claim text, and confidence note are managed as evidence links.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            {evidenceHref ? (
              <Link
                className="inline-flex h-8 items-center justify-center border border-[#8dc63f] bg-white px-3 text-xs font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec]"
                href={evidenceHref}
              >
                Add / Review Project Evidence
              </Link>
            ) : (
              <span className="inline-flex min-h-8 items-center justify-center border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-500">
                Save first to add evidence
              </span>
            )}
            <Link
              className="inline-flex h-8 items-center justify-center border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
              href={sourceCreateHref}
            >
              New Source
            </Link>
          </div>
          {project ? (
            <div className="mt-3 border border-gray-200 bg-white px-3 py-2 text-xs leading-5 text-gray-600">
              <div className="font-semibold text-[#1f2937]">
                {sourceCount} linked evidence record{sourceCount === 1 ? "" : "s"}
              </div>
              {sourcePreview.length > 0 ? (
                <ul className="mt-1 space-y-1">
                  {sourcePreview.map((source) => (
                    <li key={source.entity_source_id} className="truncate">
                      {source.source_title ||
                        source.source_reference ||
                        source.source_url}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-1 text-gray-500">
                  No evidence links yet.
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="border border-gray-200 bg-[#fafafa] px-4 py-4">
          <h3 className="text-sm font-bold text-[#1f2937]">
            Related Companies
          </h3>
          <p className="mt-2 text-xs leading-5 text-gray-600">
            Developer, owner, operator, investor, offtaker, supplier, and other
            company roles are structured relationship records, not free-text
            project fields.
          </p>
          <div className="mt-3">
            {relationshipsHref ? (
              <Link
                className="inline-flex h-8 items-center justify-center border border-[#8dc63f] bg-white px-3 text-xs font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec]"
                href={relationshipsHref}
              >
                Add Company Roles
              </Link>
            ) : (
              <span className="inline-flex min-h-8 items-center justify-center border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-500">
                Save first to add company roles
              </span>
            )}
          </div>
          {project ? (
            <div className="mt-3 border border-gray-200 bg-white px-3 py-2 text-xs leading-5 text-gray-600">
              <div className="font-semibold text-[#1f2937]">
                {companyLinkCount} structured company role
                {companyLinkCount === 1 ? "" : "s"}
              </div>
              {companyPreview.length > 0 ? (
                <ul className="mt-1 space-y-1">
                  {companyPreview.map((link) => (
                    <li key={link.company_project_link_id}>
                      <Link
                        className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                        href={`/postgres-preview/companies/${link.company_id}`}
                      >
                        {link.company_name}
                      </Link>
                      <div className="truncate text-gray-500">
                        {link.role_label || link.role_code}
                        {link.ownership_share !== null
                          ? ` / ${link.ownership_share}%`
                          : ""}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-1 text-gray-500">
                  No company roles linked yet.
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="border border-gray-200 bg-[#fafafa] px-4 py-4">
          <h3 className="text-sm font-bold text-[#1f2937]">
            Related Plant
          </h3>
          <p className="mt-2 text-xs leading-5 text-gray-600">
            Linked plant, promotion, expansion, and historical
            project-to-plant relationships stay in the project detail workflow.
          </p>
          <div className="mt-3">
            {linkedAssetHref ? (
              <Link
                className="inline-flex h-8 items-center justify-center border border-[#8dc63f] bg-white px-3 text-xs font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec]"
                href={linkedAssetHref}
              >
                Review Related Plants
              </Link>
            ) : (
              <span className="inline-flex min-h-8 items-center justify-center border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-500">
                Save first to link plants
              </span>
            )}
          </div>
          {project ? (
            <div className="mt-3 border border-gray-200 bg-white px-3 py-2 text-xs leading-5 text-gray-600">
              <div className="font-semibold text-[#1f2937]">
                {promotedAssetCount} linked plant promotion
                {promotedAssetCount === 1 ? "" : "s"}
              </div>
              {promotedAssetPreview.length > 0 ? (
                <ul className="mt-1 space-y-1">
                  {promotedAssetPreview.map((asset) => (
                    <li key={asset.operating_asset_id}>
                      <Link
                        className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                        href={`/postgres-preview/operating-assets/${asset.operating_asset_id}`}
                      >
                        {asset.asset_name}
                      </Link>
                      <div className="truncate text-gray-500">
                        {asset.link_type}
                        {asset.country ? ` / ${asset.country}` : ""}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-1 text-gray-500">
                  No linked plant yet.
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
      {mode === "create" ? (
        <p className="mt-4 border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-900">
          For new records, save the draft first. The saved detail page then
          exposes evidence, company-role, Research Ops, and promotion workflows
          against the new project ID.
        </p>
      ) : null}
    </Section>
  );
}

function AssetWorkflowBridge({
  mode,
  asset,
  relationshipPreview,
}: {
  mode: EntityFormMode;
  asset?: PostgresPreviewOperatingAssetDetail | null;
  relationshipPreview?: AssetWorkflowPreview;
}) {
  const assetHref = asset
    ? `/postgres-preview/operating-assets/${asset.operating_asset_id}`
    : null;
  const evidenceHref = assetHref ? `${assetHref}#asset-source-evidence` : null;
  const sourceCreateHref = newSourceHref(
    "operating_asset",
    asset?.operating_asset_id
  );
  const relationshipsHref = assetHref ? `${assetHref}#asset-company-links` : null;
  const linkedProjectHref = assetHref ? `${assetHref}#asset-workflow-actions` : null;
  const sourcePreview = asset?.sources?.slice(0, 2) || [];
  const sourceCount = asset?.source_count || 0;
  const companyLinkCount =
    relationshipPreview?.companyLinks.length ?? asset?.company_link_count ?? 0;
  const companyPreview = relationshipPreview?.companyLinks.slice(0, 3) || [];
  const originatingProject = relationshipPreview?.originatingProject;

  return (
    <Section title="Evidence And Relationship Workflow">
      <WorkflowQuickActions
        actions={[
          {
            label: "Open Plant",
            description: "Review profile, audit, and readiness.",
            href: assetHref,
            group: "record",
          },
          {
            label: "Evidence",
            description: "Add source links and field evidence.",
            href: evidenceHref,
            group: "evidence",
          },
          {
            label: "Company Roles",
            description: "Link owners, operators, suppliers, offtakers.",
            href: relationshipsHref,
            group: "relationships",
          },
          {
            label: "Project Origin & Units",
            description: "Review originating project and group logic.",
            href: linkedProjectHref,
            group: "relationships",
          },
          {
            label: "Research Ops",
            description: "Create or review operational follow-ups.",
            href: assetHref ? "/postgres-preview/research-ops#persistent-issues" : null,
            group: "governance",
          },
        ]}
        entityLabel="Plant"
        mode={mode}
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="border border-gray-200 bg-[#fafafa] px-4 py-4">
          <h3 className="text-sm font-bold text-[#1f2937]">
            Evidence / Source
          </h3>
          <p className="mt-2 text-xs leading-5 text-gray-600">
            Source URL, source title, date, source type, linked field, extracted
            value, claim text, and confidence note are managed as evidence links.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            {evidenceHref ? (
              <Link
                className="inline-flex h-8 items-center justify-center border border-[#8dc63f] bg-white px-3 text-xs font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec]"
                href={evidenceHref}
              >
                Add / Review Plant Evidence
              </Link>
            ) : (
              <span className="inline-flex min-h-8 items-center justify-center border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-500">
                Save first to add evidence
              </span>
            )}
            <Link
              className="inline-flex h-8 items-center justify-center border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
              href={sourceCreateHref}
            >
              New Source
            </Link>
          </div>
          {asset ? (
            <div className="mt-3 border border-gray-200 bg-white px-3 py-2 text-xs leading-5 text-gray-600">
              <div className="font-semibold text-[#1f2937]">
                {sourceCount} linked evidence record{sourceCount === 1 ? "" : "s"}
              </div>
              {sourcePreview.length > 0 ? (
                <ul className="mt-1 space-y-1">
                  {sourcePreview.map((source) => (
                    <li key={source.entity_source_id} className="truncate">
                      {source.source_title || source.source_reference || source.source_url}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-1 text-gray-500">
                  No evidence links yet.
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="border border-gray-200 bg-[#fafafa] px-4 py-4">
          <h3 className="text-sm font-bold text-[#1f2937]">
            Related Companies
          </h3>
          <p className="mt-2 text-xs leading-5 text-gray-600">
            Owner, operator, developer, turbine supplier, EPC, drilling
            contractor, direct-use operator, and offtaker roles are structured
            relationship records, not free-text plant fields.
          </p>
          <div className="mt-3">
            {relationshipsHref ? (
              <Link
                className="inline-flex h-8 items-center justify-center border border-[#8dc63f] bg-white px-3 text-xs font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec]"
                href={relationshipsHref}
              >
                Add Company Roles
              </Link>
            ) : (
              <span className="inline-flex min-h-8 items-center justify-center border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-500">
                Save first to add company roles
              </span>
            )}
          </div>
          {asset ? (
            <div className="mt-3 border border-gray-200 bg-white px-3 py-2 text-xs leading-5 text-gray-600">
              <div className="font-semibold text-[#1f2937]">
                {companyLinkCount} structured company role
                {companyLinkCount === 1 ? "" : "s"}
              </div>
              {companyPreview.length > 0 ? (
                <ul className="mt-1 space-y-1">
                  {companyPreview.map((link) => (
                    <li key={link.company_operating_asset_link_id}>
                      <Link
                        className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                        href={`/postgres-preview/companies/${link.company_id}`}
                      >
                        {link.company_name}
                      </Link>
                      <div className="truncate text-gray-500">
                        {link.role_label || link.role_code}
                        {link.ownership_share !== null
                          ? ` / ${link.ownership_share}%`
                          : ""}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-1 text-gray-500">
                  No owner/operator/company roles linked yet.
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="border border-gray-200 bg-[#fafafa] px-4 py-4">
          <h3 className="text-sm font-bold text-[#1f2937]">
            Originating Project / Units
          </h3>
          <p className="mt-2 text-xs leading-5 text-gray-600">
            Originating project, expansion, unit, plant group, field group, and
            promotion history stay in the saved plant detail workflow.
          </p>
          <div className="mt-3">
            {linkedProjectHref ? (
              <Link
                className="inline-flex h-8 items-center justify-center border border-[#8dc63f] bg-white px-3 text-xs font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec]"
                href={linkedProjectHref}
              >
                Review Plant Workflow
              </Link>
            ) : (
              <span className="inline-flex min-h-8 items-center justify-center border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-500">
                Save first to link projects or units
              </span>
            )}
          </div>
          {asset ? (
            <div className="mt-3 border border-gray-200 bg-white px-3 py-2 text-xs leading-5 text-gray-600">
              <div className="font-semibold text-[#1f2937]">
                {originatingProject || asset.promoted_from_project_id
                  ? "Originating project linked"
                  : "No originating project link yet"}
              </div>
              {originatingProject ? (
                <Link
                  className="mt-1 block truncate font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                  href={`/postgres-preview/projects/${originatingProject.project_id}`}
                >
                  {originatingProject.project_name}
                </Link>
              ) : null}
              <div className="mt-1">
                Plant / field group: {asset.project_group || "not set"}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {mode === "create" ? (
        <p className="mt-4 border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-900">
          For new records, save the draft first. The saved detail page then
          exposes evidence, owner/operator, Research Ops, and linked-project or
          unit workflows against the new plant ID.
        </p>
      ) : null}
    </Section>
  );
}

function CompanyWorkflowBridge({
  mode,
  company,
  relationshipPreview,
}: {
  mode: EntityFormMode;
  company?: PostgresPreviewCompanyDetail | null;
  relationshipPreview?: CompanyWorkflowPreview;
}) {
  const companyHref = company
    ? `/postgres-preview/companies/${company.company_id}`
    : null;
  const evidenceHref = companyHref ? `${companyHref}#company-source-evidence` : null;
  const sourceCreateHref = newSourceHref("company", company?.company_id);
  const relationshipsHref = companyHref ? `${companyHref}#company-relationships` : null;
  const sourcePreview = company?.sources?.slice(0, 2) || [];
  const sourceCount = company?.source_count || 0;
  const projectRoleCount =
    relationshipPreview?.projectLinks.length ?? company?.project_link_count ?? 0;
  const assetRoleCount =
    relationshipPreview?.operatingAssetLinks.length ??
    company?.operating_asset_link_count ??
    0;
  const companyRelationshipCount = relationshipPreview?.relationships.length || 0;
  const activityRoleCount = projectRoleCount + assetRoleCount;
  const activityPreview = [
    ...(relationshipPreview?.projectLinks || []).map((link) => ({
      href: `/postgres-preview/projects/${link.project_id}`,
      name: link.project_name,
      meta: `${link.role_label || link.role_code}${link.country ? ` / ${link.country}` : ""}`,
      key: `project-${link.company_project_link_id}`,
    })),
    ...(relationshipPreview?.operatingAssetLinks || []).map((link) => ({
      href: `/postgres-preview/operating-assets/${link.operating_asset_id}`,
      name: link.asset_name,
      meta: `${link.role_label || link.role_code}${link.country ? ` / ${link.country}` : ""}`,
      key: `asset-${link.company_operating_asset_link_id}`,
    })),
  ].slice(0, 3);
  const relationshipRows = relationshipPreview?.relationships.slice(0, 3) || [];

  return (
    <Section title="Evidence, Roles, And Company Structure Workflow">
      <WorkflowQuickActions
        actions={[
          {
            label: "Open Company",
            description: "Review profile, audit, and readiness.",
            href: companyHref,
            group: "record",
          },
          {
            label: "Evidence",
            description: "Add source links and company evidence.",
            href: evidenceHref,
            group: "evidence",
          },
          {
            label: "Activity Roles",
            description: "Review project and plant roles.",
            href: relationshipsHref,
            group: "relationships",
          },
          {
            label: "Ownership",
            description: "Review group and company relationships.",
            href: relationshipsHref,
            group: "relationships",
          },
          {
            label: "Research Ops",
            description: "Create or review operational follow-ups.",
            href: companyHref
              ? "/postgres-preview/research-ops#persistent-issues"
              : null,
            group: "governance",
          },
        ]}
        entityLabel="Company"
        mode={mode}
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="border border-gray-200 bg-[#fafafa] px-4 py-4">
          <h3 className="text-sm font-bold text-[#1f2937]">
            Evidence / Source
          </h3>
          <p className="mt-2 text-xs leading-5 text-gray-600">
            Company website, reports, filings, TGE articles, stakeholder notes,
            and ownership evidence are governed source links, not pasted into
            category fields.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            {evidenceHref ? (
              <Link
                className="inline-flex h-8 items-center justify-center border border-[#8dc63f] bg-white px-3 text-xs font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec]"
                href={evidenceHref}
              >
                Add / Review Company Evidence
              </Link>
            ) : (
              <span className="inline-flex min-h-8 items-center justify-center border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-500">
                Save first to add evidence
              </span>
            )}
            <Link
              className="inline-flex h-8 items-center justify-center border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
              href={sourceCreateHref}
            >
              New Source
            </Link>
          </div>
          {company ? (
            <div className="mt-3 border border-gray-200 bg-white px-3 py-2 text-xs leading-5 text-gray-600">
              <div className="font-semibold text-[#1f2937]">
                {sourceCount} linked evidence record{sourceCount === 1 ? "" : "s"}
              </div>
              {sourcePreview.length > 0 ? (
                <ul className="mt-1 space-y-1">
                  {sourcePreview.map((source) => (
                    <li key={source.entity_source_id} className="truncate">
                      {source.source_title ||
                        source.source_reference ||
                        source.source_url}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-1 text-gray-500">
                  No evidence links yet.
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="border border-gray-200 bg-[#fafafa] px-4 py-4">
          <h3 className="text-sm font-bold text-[#1f2937]">
            Roles On Projects / Plants
          </h3>
          <p className="mt-2 text-xs leading-5 text-gray-600">
            Primary business identity describes the company&apos;s dominant market
            position. Developer, owner, operator, supplier, investor, and
            offtaker remain structured roles on specific projects or
            plants.
          </p>
          <div className="mt-3">
            {relationshipsHref ? (
              <Link
                className="inline-flex h-8 items-center justify-center border border-[#8dc63f] bg-white px-3 text-xs font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec]"
                href={relationshipsHref}
              >
                Add Project / Plant Roles
              </Link>
            ) : (
              <span className="inline-flex min-h-8 items-center justify-center border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-500">
                Save first to add roles
              </span>
            )}
          </div>
          {company ? (
            <div className="mt-3 border border-gray-200 bg-white px-3 py-2 text-xs leading-5 text-gray-600">
              <div className="font-semibold text-[#1f2937]">
                {activityRoleCount} structured activity role
                {activityRoleCount === 1 ? "" : "s"}
              </div>
              <div className="mt-1">
                {projectRoleCount} project role
                {projectRoleCount === 1 ? "" : "s"} /{" "}
                {assetRoleCount} plant role
                {assetRoleCount === 1 ? "" : "s"}
              </div>
              {activityPreview.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {activityPreview.map((link) => (
                    <li key={link.key}>
                      <Link
                        className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                        href={link.href}
                      >
                        {link.name}
                      </Link>
                      <div className="truncate text-gray-500">{link.meta}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-2 text-gray-500">
                  No project or plant roles linked yet.
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="border border-gray-200 bg-[#fafafa] px-4 py-4">
          <h3 className="text-sm font-bold text-[#1f2937]">
            Group / Ownership Structure
          </h3>
          <p className="mt-2 text-xs leading-5 text-gray-600">
            Parent, subsidiary, affiliate, JV, shareholder, acquisition, and SPV
            relationships are managed as company-to-company relationship records.
          </p>
          <div className="mt-3">
            {relationshipsHref ? (
              <Link
                className="inline-flex h-8 items-center justify-center border border-[#8dc63f] bg-white px-3 text-xs font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec]"
                href={relationshipsHref}
              >
                Review Company Structure
              </Link>
            ) : (
              <span className="inline-flex min-h-8 items-center justify-center border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-500">
                Save first to add relationships
              </span>
            )}
          </div>
          {company ? (
            <div className="mt-3 border border-gray-200 bg-white px-3 py-2 text-xs leading-5 text-gray-600">
              <div className="font-semibold text-[#1f2937]">
                Current identity
              </div>
              <div className="mt-1">
                {company.company_type_primary_code || "No primary identity"} /{" "}
                {company.entity_type_code || "No record type"}
              </div>
              <div className="mt-2 font-semibold text-[#1f2937]">
                {companyRelationshipCount} company relationship
                {companyRelationshipCount === 1 ? "" : "s"}
              </div>
              {relationshipRows.length > 0 ? (
                <ul className="mt-1 space-y-1">
                  {relationshipRows.map((relationship) => (
                    <li
                      key={relationship.company_relationship_id}
                      className="truncate"
                    >
                      {relationship.company_name_from} /{" "}
                      {relationship.company_name_to}
                      <div className="text-gray-500">
                        {relationship.relationship_type_label ||
                          relationship.relationship_type_code}
                        {relationship.is_current ? " / current" : ""}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-1 text-gray-500">
                  No ownership/group relationships linked yet.
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
      {mode === "create" ? (
        <p className="mt-4 border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-900">
          For new records, save the company draft first. The saved detail page
          then exposes evidence, project/plant roles, ownership, group, and JV
          relationship workflows against the new company ID.
        </p>
      ) : null}
    </Section>
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
    country_id: project?.country_id || "",
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
    country_id: asset?.country_id || "",
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
    headquarters_country_id: company?.headquarters_country_id || "",
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
  relationshipPreview,
}: {
  mode: EntityFormMode;
  project?: PostgresPreviewProjectDetail | null;
  referenceData: PostgresEntityFormReferenceData;
  relationshipPreview?: ProjectWorkflowPreview;
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
  const [errorIssues, setErrorIssues] = useState<string[]>([]);
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
    setErrorIssues([]);
    setMessage("");

    try {
      const res = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        setErrorIssues(getApiIssues(json));
        throw new Error(getApiError(json, "Failed to save project."));
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

  const readinessIssues = getProjectReadinessIssues(form, {
    sourceCount: project?.source_count,
    companyLinkCount: project?.company_link_count,
  });
  const formSections = [
    "Evidence And Relationship Workflow",
    "Identity And Location",
    "Workflow And Classification",
    "Capacity And Output",
    "Resource, Timeline, And Technology",
    "Notes",
  ];

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <FormNotice error={error} errorIssues={errorIssues} message={message} />

      <FormBodyLayout
        rail={
          <FormWorkflowRail
            backHref={backHref}
            changeState={mode === "edit" ? changeState : undefined}
            entityLabel="Project"
            error={error}
            issues={readinessIssues}
            message={message}
            saving={saving}
            sections={formSections}
          />
        }
      >
      <FormReadinessPanel
        changeState={mode === "edit" ? changeState : undefined}
        currentReviewStatus={originalForm.review_status_code}
        entityLabel="project"
        issueContext={
          mode === "edit" && project?.project_id
            ? { entityType: "project", entityId: project.project_id }
            : undefined
        }
        issues={readinessIssues}
      />

      <ProjectWorkflowBridge
        mode={mode}
        project={project}
        relationshipPreview={relationshipPreview}
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
            help="Select from the canonical country reference. TGE and World Bank regions are derived automatically."
            {...fieldMeta(changeState, "country", {
              required: true,
              tone: "critical",
            })}
          >
            <CountryReferenceSelect
              countryIdName="country_id"
              countryName="country"
              form={form}
              referenceData={referenceData}
              setField={setField}
            />
          </Field>
          <Field
            label="TGE Region"
            help="Derived from selected country; not manually edited."
            {...fieldMeta(changeState, "region")}
          >
            <DerivedGeographyField value={form.region} />
          </Field>
          <Field
            label="World Bank Region"
            help="Derived from selected country; kept for donor and external benchmarking views."
            {...fieldMeta(changeState, "wb_region")}
          >
            <DerivedGeographyField value={form.wb_region} />
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
            label="Geothermal Use Category"
            {...fieldMeta(changeState, "primary_use_type_code", {
              required: true,
              tone: isUnknownCode(form, "primary_use_type_code")
                ? "critical"
                : undefined,
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
            label="Project Phase"
            {...fieldMeta(changeState, "lifecycle_phase_code", {
              required: true,
              tone: isUnknownCode(form, "lifecycle_phase_code")
                ? "critical"
                : form.lifecycle_phase_code === "prospect_tbd"
                  ? "important"
                  : undefined,
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
            label="Estimated Capacity Range Min MWe"
            {...fieldMeta(changeState, "potential_min_mwe")}
          >
            <TextInput form={form} name="potential_min_mwe" setField={setField} />
          </Field>
          <Field
            label="Estimated Capacity Range Max MWe"
            {...fieldMeta(changeState, "potential_max_mwe")}
          >
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
          <Field
            label="COD Source Text / Original Wording"
            {...fieldMeta(changeState, "cod_raw")}
          >
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
      </FormBodyLayout>
    </form>
  );
}

export function PostgresOperatingAssetForm({
  mode,
  asset,
  referenceData,
  relationshipPreview,
}: {
  mode: EntityFormMode;
  asset?: PostgresPreviewOperatingAssetDetail | null;
  referenceData: PostgresEntityFormReferenceData;
  relationshipPreview?: AssetWorkflowPreview;
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
  const [errorIssues, setErrorIssues] = useState<string[]>([]);
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
    setErrorIssues([]);
    setMessage("");

    try {
      const res = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        setErrorIssues(getApiIssues(json));
        throw new Error(getApiError(json, "Failed to save plant."));
      }

      setMessage("Plant saved.");
      router.push(
        `/postgres-preview/operating-assets/${json.operatingAsset.operating_asset_id}`
      );
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to save plant."
      );
    } finally {
      setSaving(false);
    }
  }

  const readinessIssues = getAssetReadinessIssues(form, {
    sourceCount: asset?.source_count,
    companyLinkCount: asset?.company_link_count,
  });
  const formSections = [
    "Evidence And Relationship Workflow",
    "Identity And Location",
    "Workflow And Classification",
    "Capacity And Output",
    "Resource, Operation, And Technology",
    "Notes",
  ];

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <FormNotice error={error} errorIssues={errorIssues} message={message} />

      <FormBodyLayout
        rail={
          <FormWorkflowRail
            backHref={backHref}
            changeState={mode === "edit" ? changeState : undefined}
            entityLabel="Plant"
            error={error}
            issues={readinessIssues}
            message={message}
            saving={saving}
            sections={formSections}
          />
        }
      >
      <FormReadinessPanel
        changeState={mode === "edit" ? changeState : undefined}
        currentReviewStatus={originalForm.review_status_code}
        entityLabel="plant"
        issueContext={
          mode === "edit" && asset?.operating_asset_id
            ? {
                entityType: "operating_asset",
                entityId: asset.operating_asset_id,
              }
            : undefined
        }
        issues={readinessIssues}
      />

      <AssetWorkflowBridge
        asset={asset}
        mode={mode}
        relationshipPreview={relationshipPreview}
      />

      <Section title="Identity And Location">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Field
            label="Plant Name"
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
            help="Select from the canonical country reference. TGE and World Bank regions are derived automatically."
            {...fieldMeta(changeState, "country", {
              required: true,
              tone: "critical",
            })}
          >
            <CountryReferenceSelect
              countryIdName="country_id"
              countryName="country"
              form={form}
              referenceData={referenceData}
              setField={setField}
            />
          </Field>
          <Field
            label="TGE Region"
            help="Derived from selected country; not manually edited."
            {...fieldMeta(changeState, "region")}
          >
            <DerivedGeographyField value={form.region} />
          </Field>
          <Field
            label="World Bank Region"
            help="Derived from selected country; kept for donor and external benchmarking views."
            {...fieldMeta(changeState, "wb_region")}
          >
            <DerivedGeographyField value={form.wb_region} />
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
            label="Geothermal Use Category"
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
            label="Installed Electric Capacity MWe"
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
            label="Active Operating Capacity MWe"
            help="Use for current online/available electric capacity when it differs from installed capacity; note derating, outages, or uncertainty below."
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
          <Field
            label="Thermal Capacity MWth"
            {...fieldMeta(changeState, "thermal_capacity_mwth")}
          >
            <TextInput
              form={form}
              name="thermal_capacity_mwth"
              setField={setField}
            />
          </Field>
          <Field
            label="Estimated Capacity Range Min MWe"
            {...fieldMeta(changeState, "potential_min_mwe")}
          >
            <TextInput form={form} name="potential_min_mwe" setField={setField} />
          </Field>
          <Field
            label="Estimated Capacity Range Max MWe"
            {...fieldMeta(changeState, "potential_max_mwe")}
          >
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
            label="Commissioning / COD Year"
            {...fieldMeta(changeState, "cod_year", {
              important: true,
              tone: "important",
            })}
          >
            <TextInput form={form} name="cod_year" setField={setField} />
          </Field>
          <Field label="Commissioning / COD Month" {...fieldMeta(changeState, "cod_month")}>
            <TextInput form={form} name="cod_month" setField={setField} />
          </Field>
          <Field
            label="COD Source Text / Original Wording"
            {...fieldMeta(changeState, "cod_raw")}
          >
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
      </FormBodyLayout>
    </form>
  );
}

export function PostgresCompanyForm({
  mode,
  company,
  referenceData,
  relationshipPreview,
}: {
  mode: EntityFormMode;
  company?: PostgresPreviewCompanyDetail | null;
  referenceData: PostgresEntityFormReferenceData;
  relationshipPreview?: CompanyWorkflowPreview;
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
  const [errorIssues, setErrorIssues] = useState<string[]>([]);
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
    setErrorIssues([]);
    setMessage("");

    try {
      const res = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        setErrorIssues(getApiIssues(json));
        throw new Error(getApiError(json, "Failed to save company."));
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

  const readinessIssues = getCompanyReadinessIssues(form, {
    sourceCount: company?.source_count,
    activityLinkCount:
      (company?.project_link_count || 0) +
      (company?.operating_asset_link_count || 0),
  });
  const formSections = [
    "Evidence, Roles, And Company Structure Workflow",
    "Identity And Classification",
    "Location And Links",
    "Geothermal Focus",
    "Notes",
  ];

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <FormNotice error={error} errorIssues={errorIssues} message={message} />

      <FormBodyLayout
        rail={
          <FormWorkflowRail
            backHref={backHref}
            changeState={mode === "edit" ? changeState : undefined}
            entityLabel="Company"
            error={error}
            issues={readinessIssues}
            message={message}
            saving={saving}
            sections={formSections}
          />
        }
      >
      <FormReadinessPanel
        changeState={mode === "edit" ? changeState : undefined}
        currentReviewStatus={originalForm.review_status_code}
        entityLabel="company"
        issueContext={
          mode === "edit" && company?.company_id
            ? { entityType: "company", entityId: company.company_id }
            : undefined
        }
        issues={readinessIssues}
      />

      <CompanyWorkflowBridge
        company={company}
        mode={mode}
        relationshipPreview={relationshipPreview}
      />

      <Section title="Identity And Classification">
        <div className="mb-5 grid grid-cols-1 gap-3 border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-950 xl:grid-cols-3">
          <div>
            <div className="font-bold uppercase tracking-wide">Record Type</div>
            <p className="mt-1">
              What kind of company record this is: legal entity, group, SPV,
              institution, association, or similar.
            </p>
          </div>
          <div>
            <div className="font-bold uppercase tracking-wide">
              Business Identity
            </div>
            <p className="mt-1">
              The company&apos;s dominant geothermal market identity for
              filtering and analytics.
            </p>
          </div>
          <div>
            <div className="font-bold uppercase tracking-wide">
              Roles On Records
            </div>
            <p className="mt-1">
              Developer, owner, operator, supplier, investor, and similar roles
              belong on project/plant relationship links after save.
            </p>
          </div>
        </div>
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
            label="Company Record Type"
            help="Use for legal entity, company group, institution, SPV, association, or other record-level identity."
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
            label="Primary Business Identity"
            help="Choose the dominant market identity for filtering and analysis. A company can still hold many project/plant roles separately."
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
            help="Select from the canonical country reference. TGE and World Bank regions are derived automatically."
            {...fieldMeta(changeState, "headquarters_country", {
              important: true,
              tone: "important",
            })}
          >
            <CountryReferenceSelect
              countryIdName="headquarters_country_id"
              countryName="headquarters_country"
              form={form}
              referenceData={referenceData}
              setField={setField}
            />
          </Field>
          <Field
            label="TGE Region"
            help="Derived from selected HQ country; not manually edited."
            {...fieldMeta(changeState, "region")}
          >
            <DerivedGeographyField value={form.region} />
          </Field>
          <Field
            label="World Bank Region"
            help="Derived from selected HQ country; kept for donor and external benchmarking views."
            {...fieldMeta(changeState, "wb_region")}
          >
            <DerivedGeographyField value={form.wb_region} />
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
      </FormBodyLayout>
    </form>
  );
}
