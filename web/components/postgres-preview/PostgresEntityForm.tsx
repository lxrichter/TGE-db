"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type {
  PostgresEntityFormReferenceData,
  PostgresPreviewCompanyDetail,
  PostgresPreviewOperatingAssetDetail,
  PostgresPreviewProjectDetail,
} from "@/lib/postgres-preview";

type EntityFormMode = "create" | "edit";
type EntityFormValues = Record<string, string>;
type FormReadinessIssue = {
  severity: "critical" | "important" | "workflow";
  label: string;
  detail: string;
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
      {label}
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

function FormReadinessPanel({
  issues,
  entityLabel,
}: {
  issues: FormReadinessIssue[];
  entityLabel: string;
}) {
  const criticalCount = issues.filter(
    (issue) => issue.severity === "critical"
  ).length;
  const importantCount = issues.filter(
    (issue) => issue.severity === "important"
  ).length;

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
        </div>
      </div>
      <div className="space-y-4 px-5 py-5">
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
                <div className="mt-1 text-sm font-bold">{issue.label}</div>
                <div className="mt-1 text-xs leading-5">{issue.detail}</div>
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
    });
  }

  if (!hasValue(form, "country")) {
    issues.push({
      severity: "critical",
      label: "Missing country",
      detail: "Country is required for market pages, maps, charts, and exports.",
    });
  }

  if (isUnknownCode(form, "primary_use_type_code")) {
    issues.push({
      severity: "critical",
      label: "Missing use type",
      detail: "Power, direct-use, hybrid, or mineral classification is required.",
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
    });
  }

  if (!hasValue(form, "latitude") || !hasValue(form, "longitude")) {
    issues.push({
      severity: "important",
      label: "Missing coordinates",
      detail: "Coordinate-confirmed map layers only show records with latitude and longitude.",
    });
  }

  issues.push({
    severity: "workflow",
    label: "Source evidence handled separately",
    detail: "Add source/evidence links after saving the staging record.",
  });

  issues.push({
    severity: "workflow",
    label: "Company roles handled separately",
    detail: "Developer, owner, operator, and supplier links are managed on the detail page.",
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
    });
  }

  if (!hasValue(form, "country")) {
    issues.push({
      severity: "critical",
      label: "Missing country",
      detail: "Country is required for operating totals, maps, and exports.",
    });
  }

  if (isUnknownCode(form, "primary_use_type_code")) {
    issues.push({
      severity: "critical",
      label: "Missing use type",
      detail: "Power, direct-use, hybrid, or mineral classification is required.",
    });
  }

  if (isUnknownCode(form, "lifecycle_phase_code")) {
    issues.push({
      severity: "critical",
      label: "Missing operating status",
      detail: "Operating, retired, offline, or refurbishment status is required.",
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
    });
  }

  if (!hasValue(form, "latitude") || !hasValue(form, "longitude")) {
    issues.push({
      severity: "important",
      label: "Missing coordinates",
      detail: "Coordinate-confirmed map layers only show records with latitude and longitude.",
    });
  }

  if (!hasValue(form, "cod_year") && !hasValue(form, "cod_raw")) {
    issues.push({
      severity: "important",
      label: "Missing COD / commissioning date",
      detail: "Add a structured COD year or raw commissioning note when known.",
    });
  }

  issues.push({
    severity: "workflow",
    label: "Source evidence handled separately",
    detail: "Add source/evidence links after saving the staging record.",
  });

  issues.push({
    severity: "workflow",
    label: "Company roles handled separately",
    detail: "Owner, operator, supplier, and contractor links are managed on the detail page.",
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
    });
  }

  if (isUnknownCode(form, "company_type_primary_code")) {
    issues.push({
      severity: "critical",
      label: "Missing primary company type",
      detail: "Primary category is required for company intelligence and filtering.",
    });
  }

  if (isUnknownCode(form, "entity_type_code")) {
    issues.push({
      severity: "important",
      label: "Missing entity type",
      detail: "Legal entity, group, institution, or other entity type improves governance.",
    });
  }

  if (!hasValue(form, "headquarters_country")) {
    issues.push({
      severity: "important",
      label: "Missing headquarters country",
      detail: "HQ country helps company portfolio and market activity analysis.",
    });
  }

  if (!hasValue(form, "website_url")) {
    issues.push({
      severity: "important",
      label: "Missing website",
      detail: "A company website or equivalent source improves validation confidence.",
    });
  }

  issues.push({
    severity: "workflow",
    label: "Source evidence handled separately",
    detail: "Add source/evidence links after saving the staging company record.",
  });

  issues.push({
    severity: "workflow",
    label: "Project and asset roles handled separately",
    detail: "Company portfolios and ownership links are managed on the detail page.",
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
        entityLabel="project"
        issues={getProjectReadinessIssues(form)}
      />

      <Section title="Identity And Location">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Field label="Project Name">
            <TextInput
              form={form}
              name="project_name"
              required
              setField={setField}
            />
          </Field>
          <Field label="Project / Field Group">
            <TextInput form={form} name="project_group" setField={setField} />
          </Field>
          <Field label="Country">
            <TextInput form={form} name="country" setField={setField} />
          </Field>
          <Field label="Region">
            <TextInput form={form} name="region" setField={setField} />
          </Field>
          <Field label="World Bank Region">
            <TextInput form={form} name="wb_region" setField={setField} />
          </Field>
          <Field label="Location Text">
            <TextInput form={form} name="location_text" setField={setField} />
          </Field>
          <Field label="Latitude">
            <TextInput form={form} name="latitude" setField={setField} />
          </Field>
          <Field label="Longitude">
            <TextInput form={form} name="longitude" setField={setField} />
          </Field>
        </div>
      </Section>

      <Section title="Workflow And Classification">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Field label="Use Type">
            <SelectInput
              form={form}
              name="primary_use_type_code"
              options={referenceData.useTypes}
              setField={setField}
            />
          </Field>
          <Field label="Lifecycle Phase">
            <SelectInput
              form={form}
              name="lifecycle_phase_code"
              options={referenceData.lifecyclePhases}
              setField={setField}
            />
          </Field>
          <Field label="Review Status">
            <SelectInput
              form={form}
              name="review_status_code"
              options={referenceData.reviewStatuses}
              setField={setField}
            />
          </Field>
          <Field label="Capacity Confidence">
            <SelectInput
              form={form}
              name="capacity_estimate_status_code"
              options={referenceData.estimateStatuses}
              setField={setField}
            />
          </Field>
          <Field label="Output Confidence">
            <SelectInput
              form={form}
              name="output_estimate_status_code"
              options={referenceData.estimateStatuses}
              setField={setField}
            />
          </Field>
          <Field label="Research Status">
            <TextInput form={form} name="research_status" setField={setField} />
          </Field>
        </div>
      </Section>

      <Section title="Capacity And Output">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Field label="Potential Min MWe">
            <TextInput form={form} name="potential_min_mwe" setField={setField} />
          </Field>
          <Field label="Potential Max MWe">
            <TextInput form={form} name="potential_max_mwe" setField={setField} />
          </Field>
          <Field label="Planned MWe">
            <TextInput
              form={form}
              name="electric_capacity_mwe"
              setField={setField}
            />
          </Field>
          <Field label="Thermal MWth">
            <TextInput
              form={form}
              name="thermal_capacity_mwth"
              setField={setField}
            />
          </Field>
          <Field label="Annual Power GWh">
            <TextInput
              form={form}
              name="annual_power_generation_gwhe"
              setField={setField}
            />
          </Field>
          <Field label="Annual Heat GWhth">
            <TextInput
              form={form}
              name="annual_heat_supply_gwhth"
              setField={setField}
            />
          </Field>
          <Field label="Annual Cooling GWhc">
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
          <Field label="Resource Type">
            <TextInput form={form} name="resource_type" setField={setField} />
          </Field>
          <Field label="Resource Temp C">
            <TextInput form={form} name="resource_temp_c" setField={setField} />
          </Field>
          <Field label="Start Dev Year">
            <TextInput form={form} name="start_dev_year" setField={setField} />
          </Field>
          <Field label="Target COD Year">
            <TextInput form={form} name="target_cod_year" setField={setField} />
          </Field>
          <Field label="Target COD Month">
            <TextInput form={form} name="target_cod_month" setField={setField} />
          </Field>
          <Field label="COD Raw">
            <TextInput form={form} name="cod_raw" setField={setField} />
          </Field>
          <Field label="Plant Technology">
            <TextInput form={form} name="plant_technology" setField={setField} />
          </Field>
          <Field label="Turbine Supplier">
            <TextInput form={form} name="turbine_supplier" setField={setField} />
          </Field>
        </div>
      </Section>

      <Section title="Notes">
        <TextArea
          form={form}
          name="notes"
          placeholder="Research notes, assumptions, and missing-data comments."
          setField={setField}
        />
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
        entityLabel="plant / facility"
        issues={getAssetReadinessIssues(form)}
      />

      <Section title="Identity And Location">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Field label="Plant / Facility Name">
            <TextInput form={form} name="asset_name" required setField={setField} />
          </Field>
          <Field label="Plant / Field Group">
            <TextInput form={form} name="project_group" setField={setField} />
          </Field>
          <Field label="Country">
            <TextInput form={form} name="country" setField={setField} />
          </Field>
          <Field label="Region">
            <TextInput form={form} name="region" setField={setField} />
          </Field>
          <Field label="World Bank Region">
            <TextInput form={form} name="wb_region" setField={setField} />
          </Field>
          <Field label="Location Text">
            <TextInput form={form} name="location_text" setField={setField} />
          </Field>
          <Field label="Latitude">
            <TextInput form={form} name="latitude" setField={setField} />
          </Field>
          <Field label="Longitude">
            <TextInput form={form} name="longitude" setField={setField} />
          </Field>
        </div>
      </Section>

      <Section title="Workflow And Classification">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Field label="Use Type">
            <SelectInput
              form={form}
              name="primary_use_type_code"
              options={referenceData.useTypes}
              setField={setField}
            />
          </Field>
          <Field label="Operating Status">
            <SelectInput
              form={form}
              name="lifecycle_phase_code"
              options={referenceData.lifecyclePhases}
              setField={setField}
            />
          </Field>
          <Field label="Review Status">
            <SelectInput
              form={form}
              name="review_status_code"
              options={referenceData.reviewStatuses}
              setField={setField}
            />
          </Field>
          <Field label="Capacity Confidence">
            <SelectInput
              form={form}
              name="capacity_estimate_status_code"
              options={referenceData.estimateStatuses}
              setField={setField}
            />
          </Field>
          <Field label="Output Confidence">
            <SelectInput
              form={form}
              name="output_estimate_status_code"
              options={referenceData.estimateStatuses}
              setField={setField}
            />
          </Field>
          <Field label="Research Status">
            <TextInput form={form} name="research_status" setField={setField} />
          </Field>
        </div>
      </Section>

      <Section title="Capacity And Output">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Field label="Installed MWe">
            <TextInput
              form={form}
              name="electric_capacity_mwe"
              setField={setField}
            />
          </Field>
          <Field label="Running MWe">
            <TextInput
              form={form}
              name="electric_capacity_running_mwe"
              setField={setField}
            />
          </Field>
          <Field label="Thermal MWth">
            <TextInput
              form={form}
              name="thermal_capacity_mwth"
              setField={setField}
            />
          </Field>
          <Field label="Potential Min MWe">
            <TextInput form={form} name="potential_min_mwe" setField={setField} />
          </Field>
          <Field label="Potential Max MWe">
            <TextInput form={form} name="potential_max_mwe" setField={setField} />
          </Field>
          <Field label="Annual Power GWh">
            <TextInput
              form={form}
              name="annual_power_generation_gwhe"
              setField={setField}
            />
          </Field>
          <Field label="Annual Heat GWhth">
            <TextInput
              form={form}
              name="annual_heat_supply_gwhth"
              setField={setField}
            />
          </Field>
          <Field label="Annual Cooling GWhc">
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
          <Field label="Resource Type">
            <TextInput form={form} name="resource_type" setField={setField} />
          </Field>
          <Field label="Resource Temp C">
            <TextInput form={form} name="resource_temp_c" setField={setField} />
          </Field>
          <Field label="Start Dev Year">
            <TextInput form={form} name="start_dev_year" setField={setField} />
          </Field>
          <Field label="COD Year">
            <TextInput form={form} name="cod_year" setField={setField} />
          </Field>
          <Field label="COD Month">
            <TextInput form={form} name="cod_month" setField={setField} />
          </Field>
          <Field label="COD Raw">
            <TextInput form={form} name="cod_raw" setField={setField} />
          </Field>
          <Field label="Units">
            <TextInput form={form} name="number_of_units" setField={setField} />
          </Field>
          <Field label="Plant Technology">
            <TextInput form={form} name="plant_technology" setField={setField} />
          </Field>
          <Field label="Turbine Supplier">
            <TextInput form={form} name="turbine_supplier" setField={setField} />
          </Field>
        </div>
      </Section>

      <Section title="Notes">
        <TextArea
          form={form}
          name="notes"
          placeholder="Operating history, capacity notes, and validation context."
          setField={setField}
        />
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
        entityLabel="company"
        issues={getCompanyReadinessIssues(form)}
      />

      <Section title="Identity And Classification">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Field label="Company Name">
            <TextInput
              form={form}
              name="company_name"
              required
              setField={setField}
            />
          </Field>
          <Field label="Short Name">
            <TextInput
              form={form}
              name="company_name_short"
              setField={setField}
            />
          </Field>
          <Field label="Legal Name">
            <TextInput
              form={form}
              name="company_legal_name"
              setField={setField}
            />
          </Field>
          <Field label="Entity Type">
            <SelectInput
              form={form}
              name="entity_type_code"
              options={referenceData.companyEntityTypes}
              setField={setField}
            />
          </Field>
          <Field label="Primary Company Type">
            <SelectInput
              form={form}
              name="company_type_primary_code"
              options={referenceData.companyPrimaryTypes}
              setField={setField}
            />
          </Field>
          <Field label="Review Status">
            <SelectInput
              form={form}
              name="review_status_code"
              options={referenceData.reviewStatuses}
              setField={setField}
            />
          </Field>
          <Field label="Company Status">
            <TextInput form={form} name="company_status" setField={setField} />
          </Field>
          <Field label="Ownership Type">
            <TextInput form={form} name="ownership_type" setField={setField} />
          </Field>
          <Field label="Research Status">
            <TextInput form={form} name="research_status" setField={setField} />
          </Field>
        </div>
      </Section>

      <Section title="Location And Links">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Field label="HQ City">
            <TextInput
              form={form}
              name="headquarters_city"
              setField={setField}
            />
          </Field>
          <Field label="HQ Country">
            <TextInput
              form={form}
              name="headquarters_country"
              setField={setField}
            />
          </Field>
          <Field label="Region">
            <TextInput form={form} name="region" setField={setField} />
          </Field>
          <Field label="World Bank Region">
            <TextInput form={form} name="wb_region" setField={setField} />
          </Field>
          <Field label="Website">
            <TextInput form={form} name="website_url" setField={setField} />
          </Field>
          <Field label="LinkedIn">
            <TextInput form={form} name="linkedin_url" setField={setField} />
          </Field>
        </div>
      </Section>

      <Section title="Geothermal Focus">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Field label="Geothermal Focus">
            <TextArea
              form={form}
              name="geothermal_focus"
              placeholder="Technology, market, and role focus."
              setField={setField}
            />
          </Field>
          <Field label="Technology Focus">
            <TextArea
              form={form}
              name="technology_focus"
              placeholder="Binary, flash, drilling, direct-use, software..."
              setField={setField}
            />
          </Field>
          <Field label="Service Scope">
            <TextArea
              form={form}
              name="service_scope_summary"
              placeholder="Capabilities and operating scope."
              setField={setField}
            />
          </Field>
          <Field label="Operating Markets">
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
        <TextArea
          form={form}
          name="notes"
          placeholder="Internal research notes and classification context."
          setField={setField}
        />
      </Section>

      <FormActions backHref={backHref} saving={saving} />
    </form>
  );
}
