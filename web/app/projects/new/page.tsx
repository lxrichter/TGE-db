"use client";

import FormSelect from "@/components/forms/FormSelect";
import {
  PROJECT_PHASE_OPTIONS,
  REGION_OPTIONS,
  RESOURCE_TYPE_OPTIONS,
  RESEARCH_STATUS_OPTIONS,
  WB_REGION_OPTIONS,
  PLANT_TECHNOLOGY_OPTIONS,
} from "@/lib/options/shared";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import ActionButton from "@/components/ui/ActionButton";
import { validateProjectForm } from "@/lib/validation/project";

type ProjectFormData = {
  project_name: string;
  project_group: string;
  other_name: string;
  owner_operator: string;
  developer: string;
  location_text: string;
  country: string;
  region: string;
  wb_region: string;
  potential_min_mw: string;
  potential_max_mw: string;
  installed_capacity_mw: string;
  capacity_running_mw: string;
  gross_production_gwh: string;
  start_dev_year: string;
  cod: string;
  resource_type: string;
  resource_temp_c: string;
  project_phase: string;
  phase_historical: string;
  field_name: string;
  wells_total: string;
  wells_prod_active: string;
  wells_reinj_active: string;
  wells_inactive_standby: string;
  wells_other_exploration: string;
  well_depth_prod_m: string;
  temp_prod_well_c: string;
  flow_rate_ls: string;
  number_of_unit: string;
  plant_technology: string;
  turbine_supplier: string;
  epc_suppliers: string;
  investor: string;
  ppa_usd_kwh: string;
  total_investment_cost: string;
  notes: string;
  location_x: string;
  location_y: string;
  website_information: string;
  edited_description: string;
  research_status: string;
};

const emptyForm: ProjectFormData = {
  project_name: "",
  project_group: "",
  other_name: "",
  owner_operator: "",
  developer: "",
  location_text: "",
  country: "",
  region: "",
  wb_region: "",
  potential_min_mw: "",
  potential_max_mw: "",
  installed_capacity_mw: "",
  capacity_running_mw: "",
  gross_production_gwh: "",
  start_dev_year: "",
  cod: "",
  resource_type: "",
  resource_temp_c: "",
  project_phase: "",
  phase_historical: "",
  field_name: "",
  wells_total: "",
  wells_prod_active: "",
  wells_reinj_active: "",
  wells_inactive_standby: "",
  wells_other_exploration: "",
  well_depth_prod_m: "",
  temp_prod_well_c: "",
  flow_rate_ls: "",
  number_of_unit: "",
  plant_technology: "",
  turbine_supplier: "",
  epc_suppliers: "",
  investor: "",
  ppa_usd_kwh: "",
  total_investment_cost: "",
  notes: "",
  location_x: "",
  location_y: "",
  website_information: "",
  edited_description: "",
  research_status: "Need Info",
};

const formClass = {
  panel:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] shadow-sm",
  attentionPanel:
    "border border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] shadow-sm",
  sectionHeader:
    "border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-4 py-3 md:px-5",
  attentionHeader:
    "border-b border-[var(--tge-governance-attention-border)] bg-[var(--tge-governance-attention-bg)] px-4 py-3 md:px-5",
  title: "text-[var(--tge-text-primary)]",
  body: "text-[var(--tge-text-secondary)]",
  muted: "text-[var(--tge-governance-muted-text)]",
  label: "mb-1 block text-sm font-medium text-[var(--tge-text-primary)]",
  input:
    "border border-[var(--tge-border-strong)] bg-[var(--tge-surface-card)] text-[var(--tge-text-primary)] outline-none focus:border-[var(--tge-brand-green)] focus:ring-2 focus:ring-[var(--tge-governance-success-border)]",
  disabledInput:
    "border border-[var(--tge-border-strong)] bg-[var(--tge-surface-subtle)] text-[var(--tge-governance-muted-text)]",
  errorInput:
    "border border-[var(--tge-governance-danger-border)] bg-[var(--tge-governance-danger-bg)] text-[var(--tge-text-primary)] ring-2 ring-[var(--tge-governance-danger-border)]",
};

type FormSectionProps = {
  title: React.ReactNode;
  children: React.ReactNode;
  tone?: "default" | "amber";
};

function FormSection({
  title,
  children,
  tone = "default",
}: FormSectionProps) {
  const isAmber = tone === "amber";

  return (
    <section
      className={isAmber ? formClass.attentionPanel : formClass.panel}
    >
      <div
        className={isAmber ? formClass.attentionHeader : formClass.sectionHeader}
      >
        <h2
          className={`text-base font-semibold md:text-lg ${
            isAmber ? "text-[var(--tge-governance-attention-text)]" : formClass.title
          }`}
        >
          {title}
        </h2>
      </div>
      <div className="p-4 md:p-6">{children}</div>
    </section>
  );
}

async function safeJson(res: Response) {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function focusField(fieldName: string) {
  const el = document.querySelector(`[name="${fieldName}"]`) as HTMLElement | null;
  if (!el) return;

  const rect = el.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const offset = 140;

  window.scrollTo({
    top: rect.top + scrollTop - offset,
    behavior: "smooth",
  });

  window.setTimeout(() => {
    el.focus();
  }, 150);
}

export default function NewProjectPage() {
  const router = useRouter();
  const [form, setForm] = useState<ProjectFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();

    try {
      setSaving(true);
      setError("");
      setFieldErrors({});

      const validationErrors = validateProjectForm({
        project_name: form.project_name,
        country: form.country,
        project_phase: form.project_phase,
        start_dev_year: form.start_dev_year,
        cod: form.cod,
        potential_min_mw: form.potential_min_mw,
        potential_max_mw: form.potential_max_mw,
        installed_capacity_mw: form.installed_capacity_mw,
        capacity_running_mw: form.capacity_running_mw,
        gross_production_gwh: form.gross_production_gwh,
        resource_temp_c: form.resource_temp_c,
        wells_total: form.wells_total,
        wells_prod_active: form.wells_prod_active,
        wells_reinj_active: form.wells_reinj_active,
        wells_inactive_standby: form.wells_inactive_standby,
        wells_other_exploration: form.wells_other_exploration,
        well_depth_prod_m: form.well_depth_prod_m,
        temp_prod_well_c: form.temp_prod_well_c,
        flow_rate_ls: form.flow_rate_ls,
        location_x: form.location_x,
        location_y: form.location_y,
      });

      if (validationErrors.length > 0) {
        const fieldMap: Record<string, string> = {};
        validationErrors.forEach((err) => {
          fieldMap[err.field] = err.message;
        });

        setFieldErrors(fieldMap);
        setError(
          validationErrors.length === 1
            ? validationErrors[0].message
            : `Please correct ${validationErrors.length} highlighted field(s) before saving.`
        );
        focusField(validationErrors[0].field);
        return;
      }

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await safeJson(res);

      if (!res.ok) {
        throw new Error(result?.error || "Failed to create project");
      }

      router.push(`/projects/${result.project.project_id}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not create project.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-8">
      <div className="mb-5 flex flex-col gap-4 md:mb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className={`text-xl font-semibold tracking-tight md:text-2xl ${formClass.title}`}>
            New Project
          </h1>
          <p className={`mt-1 text-sm ${formClass.body}`}>
            Create a new geothermal project record.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <ActionButton href="/projects" variant="secondary">
            Cancel
          </ActionButton>
          <ActionButton
            type="button"
            variant="primary"
            onClick={() => handleSubmit()}
            disabled={saving}
          >
            {saving ? "Creating…" : "Create Project"}
          </ActionButton>
        </div>
      </div>

      <div className={`mb-6 p-4 md:mb-8 md:p-5 ${formClass.panel}`}>
        <div className={`space-y-2 text-sm ${formClass.body}`}>
          <p>
            New records are saved with system-managed metadata automatically.
            After creation, the project can be reviewed and approved through the
            standard project workflow.
          </p>
          <p>
            Linked companies and structured roles are added after creation on the
            project edit page.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6 md:space-y-8">
        {error && (
          <div className="border border-[var(--tge-governance-danger-border)] bg-[var(--tge-governance-danger-bg)] p-4 text-sm text-[var(--tge-governance-danger-text)]">
            {error}
          </div>
        )}

        <FormSection title="Core Identification">
          <p className={`mb-4 text-sm ${formClass.body}`}>
            Keep core project naming here. Company roles such as owner, operator,
            developer, investor, or JV partner should be managed through
            structured company links after the project is created.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Project Name"
              name="project_name"
              value={form.project_name}
              onChange={handleChange}
              error={fieldErrors.project_name}
            />
            <Input
              label="Project Group"
              name="project_group"
              value={form.project_group}
              onChange={handleChange}
            />
            <Input
              label="Other Name"
              name="other_name"
              value={form.other_name}
              onChange={handleChange}
            />
          </div>
        </FormSection>

        <FormSection title="Description">
          <Textarea
            label="Project Description"
            name="edited_description"
            value={form.edited_description}
            onChange={handleChange}
            rows={5}
          />
        </FormSection>

        <FormSection title="Location">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Input
                label="Location Text"
                name="location_text"
                value={form.location_text}
                onChange={handleChange}
              />
            </div>
            <Input
              label="Country"
              name="country"
              value={form.country}
              onChange={handleChange}
              error={fieldErrors.country}
            />
            <FormSelect
              label="Region"
              name="region"
              value={form.region}
              onChange={handleChange}
              options={REGION_OPTIONS}
            />
            <FormSelect
              label="World Bank Region"
              name="wb_region"
              value={form.wb_region}
              onChange={handleChange}
              options={WB_REGION_OPTIONS}
            />
            <div className="grid grid-cols-1 gap-4 md:col-span-2 md:grid-cols-2">
              <Input
                label="Latitude (location_x)"
                name="location_x"
                value={form.location_x}
                onChange={handleChange}
                error={fieldErrors.location_x}
              />
              <Input
                label="Longitude (location_y)"
                name="location_y"
                value={form.location_y}
                onChange={handleChange}
                error={fieldErrors.location_y}
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Capacity & Timeline">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              label="Potential Min MWe"
              name="potential_min_mw"
              value={form.potential_min_mw}
              onChange={handleChange}
            />
            <Input
              label="Potential Max MWe"
              name="potential_max_mw"
              value={form.potential_max_mw}
              onChange={handleChange}
              error={fieldErrors.potential_max_mw}
            />
            <Input
              label="Installed Capacity MWe"
              name="installed_capacity_mw"
              value={form.installed_capacity_mw}
              onChange={handleChange}
            />
            <Input
              label="Capacity Running MWe"
              name="capacity_running_mw"
              value={form.capacity_running_mw}
              onChange={handleChange}
              error={fieldErrors.capacity_running_mw}
            />
            <Input
              label="Gross Production GWh"
              name="gross_production_gwh"
              value={form.gross_production_gwh}
              onChange={handleChange}
            />
            <Input
              label="Start Development Year"
              name="start_dev_year"
              value={form.start_dev_year}
              onChange={handleChange}
              error={fieldErrors.start_dev_year}
            />
            <Input
              label="Planned COD (YYYY)"
              name="cod"
              value={form.cod}
              onChange={handleChange}
              error={fieldErrors.cod}
            />
          </div>
        </FormSection>

        <FormSection title="Resource & Project Status">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormSelect
              label="Resource Type"
              name="resource_type"
              value={form.resource_type}
              onChange={handleChange}
              options={RESOURCE_TYPE_OPTIONS}
            />
            <Input
              label="Resource Temp C"
              name="resource_temp_c"
              value={form.resource_temp_c}
              onChange={handleChange}
            />
            <Input
              label="Field Name"
              name="field_name"
              value={form.field_name}
              onChange={handleChange}
            />
            <FormSelect
              label="Project Phase"
              name="project_phase"
              value={form.project_phase}
              onChange={handleChange}
              options={PROJECT_PHASE_OPTIONS}
              error={fieldErrors.project_phase}
            />
            <FormSelect
              label="Research Status"
              name="research_status"
              value={form.research_status}
              onChange={handleChange}
              options={RESEARCH_STATUS_OPTIONS}
            />
            <Input
              label="Phase Historical"
              name="phase_historical"
              value={form.phase_historical}
              onChange={handleChange}
            />
          </div>
        </FormSection>

        <FormSection title="Wellfield Data">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              label="Wells Total"
              name="wells_total"
              value={form.wells_total}
              onChange={handleChange}
            />
            <Input
              label="Wells Prod Active"
              name="wells_prod_active"
              value={form.wells_prod_active}
              onChange={handleChange}
            />
            <Input
              label="Wells Reinj Active"
              name="wells_reinj_active"
              value={form.wells_reinj_active}
              onChange={handleChange}
            />
            <Input
              label="Wells Inactive / Standby"
              name="wells_inactive_standby"
              value={form.wells_inactive_standby}
              onChange={handleChange}
            />
            <Input
              label="Wells Other / Exploration"
              name="wells_other_exploration"
              value={form.wells_other_exploration}
              onChange={handleChange}
            />
            <Input
              label="Well Depth Prod M"
              name="well_depth_prod_m"
              value={form.well_depth_prod_m}
              onChange={handleChange}
            />
            <Input
              label="Temp Prod Well C"
              name="temp_prod_well_c"
              value={form.temp_prod_well_c}
              onChange={handleChange}
            />
            <Input
              label="Flow Rate L/s"
              name="flow_rate_ls"
              value={form.flow_rate_ls}
              onChange={handleChange}
            />
          </div>
        </FormSection>

        <FormSection title="Plant / Technology / Commercial">
          <p className={`mb-4 text-sm ${formClass.body}`}>
            Use this section for technical and commercial project information.
            Company participation should be managed through structured company
            links after creation.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              label="Number of Unit"
              name="number_of_unit"
              value={form.number_of_unit}
              onChange={handleChange}
            />
            <FormSelect
              label="Plant Technology"
              name="plant_technology"
              value={form.plant_technology}
              onChange={handleChange}
              options={PLANT_TECHNOLOGY_OPTIONS}
            />
            <Input
              label="Turbine Supplier"
              name="turbine_supplier"
              value={form.turbine_supplier}
              onChange={handleChange}
            />
            <Input
              label="EPC Suppliers"
              name="epc_suppliers"
              value={form.epc_suppliers}
              onChange={handleChange}
            />
            <Input
              label="PPA USD/kWh"
              name="ppa_usd_kwh"
              value={form.ppa_usd_kwh}
              onChange={handleChange}
            />
            <Input
              label="Total Investment Cost"
              name="total_investment_cost"
              value={form.total_investment_cost}
              onChange={handleChange}
            />
          </div>
        </FormSection>

        <FormSection
          title={
            <>
              Linked Companies
              <span className={`ml-3 text-xs font-normal ${formClass.muted}`}>
                Added after creation
              </span>
            </>
          }
        >
          <div className={`border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] p-4 text-sm ${formClass.body}`}>
            <p className="mb-3">
              Company links are added after the project has been created.
            </p>

            <ul className={`space-y-1 text-sm ${formClass.body}`}>
              <li>• Save the project first</li>
              <li>
                • Then use the edit page to link owners, developers, investors,
                suppliers, EPC, drilling, and other participants
              </li>
              <li>
                • If a company is missing, create it first and return to the
                project edit page
              </li>
            </ul>
          </div>
        </FormSection>

        <FormSection title="Sources & Editorial">
          <div className="space-y-4">
            <div>
              <Textarea
                label="Website Information"
                name="website_information"
                value={form.website_information}
                onChange={handleChange}
                rows={4}
              />
              <p className={`mt-1 text-xs ${formClass.muted}`}>
                Enter one link per line.
              </p>
            </div>

            <Textarea
              label="Notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={6}
            />
          </div>
        </FormSection>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <ActionButton href="/projects" variant="secondary">
            Cancel
          </ActionButton>

          <ActionButton type="submit" variant="primary" disabled={saving}>
            {saving ? "Creating…" : "Create Project"}
          </ActionButton>
        </div>
      </form>
    </div>
  );
}

type InputProps = {
  label: string;
  name: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
};

function Input({
  label,
  name,
  value,
  onChange,
  disabled = false,
  required = false,
  error,
}: InputProps) {
  return (
    <div>
      <label htmlFor={name} className={formClass.label}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`w-full border px-3 py-2 text-sm outline-none ${
          error
            ? formClass.errorInput
            : disabled
            ? formClass.disabledInput
            : formClass.input
        }`}
      />

      {error ? (
        <p className="mt-1 text-xs text-[var(--tge-governance-danger-text)]">{error}</p>
      ) : null}
    </div>
  );
}

type TextareaProps = {
  label: string;
  name: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
};

function Textarea({ label, name, value, onChange, rows = 5 }: TextareaProps) {
  return (
    <div>
      <label htmlFor={name} className={formClass.label}>
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        className={`w-full px-3 py-2 text-sm ${formClass.input}`}
      />
    </div>
  );
}
