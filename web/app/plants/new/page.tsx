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
import { validatePlantForm } from "@/lib/validation/plant";

type PlantFormData = {
  plant_name: string;
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

const emptyForm: PlantFormData = {
  plant_name: "",
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
      className={
        isAmber
          ? "border border-amber-200 bg-amber-50/60 shadow-sm"
          : "border border-gray-200 bg-white shadow-sm"
      }
    >
      <div
        className={
          isAmber
            ? "border-b border-amber-200 bg-amber-100 px-4 py-3 md:px-5"
            : "border-b border-gray-200 bg-[#f3f4f6] px-4 py-3 md:px-5"
        }
      >
        <h2
          className={
            isAmber
              ? "text-base font-semibold text-amber-900 md:text-lg"
              : "text-base font-semibold text-[#1f2937] md:text-lg"
          }
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

export default function NewPlantPage() {
  const router = useRouter();
  const [form, setForm] = useState<PlantFormData>(emptyForm);
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

      const validationErrors = validatePlantForm({
        plant_name: form.plant_name,
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

      const res = await fetch("/api/plants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await safeJson(res);

      if (!res.ok) {
        throw new Error(result?.error || "Failed to create plant");
      }

      router.push(`/plants/${result.plant.plant_id}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not create plant.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-8">
      <div className="mb-5 flex flex-col gap-4 md:mb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#1f2937] md:text-2xl">
            New Plant
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Create a new geothermal plant record.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <ActionButton href="/plants" variant="secondary">
            Cancel
          </ActionButton>
          <ActionButton
            type="button"
            variant="primary"
            onClick={() => handleSubmit()}
            disabled={saving}
          >
            {saving ? "Creating…" : "Create Plant"}
          </ActionButton>
        </div>
      </div>

      <div className="mb-6 border border-gray-200 bg-white p-4 shadow-sm md:mb-8 md:p-5">
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            New records are saved with system-managed metadata automatically.
            After creation, the plant can be reviewed and approved through the
            standard plant workflow.
          </p>
          <p>
            Linked companies and structured roles are added after creation on the
            plant edit page.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6 md:space-y-8">
        {error && (
          <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <FormSection title="Core Identification">
          <p className="mb-4 text-sm text-gray-600">
            Keep core plant naming here. Company roles such as owner, operator,
            developer, investor, or JV partner should be managed through
            structured company links after the plant is created.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Plant Name"
              name="plant_name"
              value={form.plant_name}
              onChange={handleChange}
              error={fieldErrors.plant_name}
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
            label="Plant Description"
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
              label="Potential Min MW"
              name="potential_min_mw"
              value={form.potential_min_mw}
              onChange={handleChange}
            />
            <Input
              label="Potential Max MW"
              name="potential_max_mw"
              value={form.potential_max_mw}
              onChange={handleChange}
              error={fieldErrors.potential_max_mw}
            />
            <Input
              label="Installed Capacity MW"
              name="installed_capacity_mw"
              value={form.installed_capacity_mw}
              onChange={handleChange}
              error={fieldErrors.installed_capacity_mw}
            />
            <Input
              label="Capacity Running MW"
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
              label="COD (YYYY)"
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
              label="Plant Phase"
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
          <p className="mb-4 text-sm text-gray-600">
            Use this section for technical and commercial plant information.
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
              label="Investor"
              name="investor"
              value={form.investor}
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
              <span className="ml-3 text-xs font-normal text-gray-500">
                Added after creation
              </span>
            </>
          }
        >
          <div className="rounded border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            <p className="mb-3">
              Company links are added after the plant has been created.
            </p>

            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Save the plant first</li>
              <li>
                • Then use the edit page to link owners, developers, investors,
                suppliers, EPC, drilling, and other participants
              </li>
              <li>
                • If a company is missing, create it first and return to the
                plant edit page
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
              <p className="mt-1 text-xs text-gray-500">
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
          <ActionButton href="/plants" variant="secondary">
            Cancel
          </ActionButton>

          <ActionButton type="submit" variant="primary" disabled={saving}>
            {saving ? "Creating…" : "Create Plant"}
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
      <label
        htmlFor={name}
        className="mb-1 block text-sm font-medium text-gray-700"
      >
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
            ? "border-red-500 bg-red-50 ring-2 ring-red-100"
            : disabled
            ? "border-gray-300 bg-gray-100 text-gray-500"
            : "border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        }`}
      />

      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
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
      <label
        htmlFor={name}
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        className="w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}