"use client";

import FormSelect from "@/components/forms/FormSelect";
import FieldHelp from "@/components/ui/FieldHelp";
import ActionButton from "@/components/ui/ActionButton";
import { COMPANY_FIELD_HELP } from "@/lib/companyFieldHelp";
import {
  REGION_OPTIONS,
  RESEARCH_STATUS_OPTIONS,
  WB_REGION_OPTIONS,
  YES_NO_OPTIONS,
  withCurrentValue,
} from "@/lib/options/shared";
import {
  ENTITY_TYPE_OPTIONS,
  OWNERSHIP_TYPE_OPTIONS,
} from "@/lib/options/companies";
import { COMPANY_TYPE_SECONDARY_GROUPS } from "@/lib/options/companySecondaryTypes";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { validateCompanyForm } from "@/lib/validation/company";

type CompanyOption = {
  company_id: string;
  company_name: string | null;
  headquarters_country: string | null;
};

type CompanyFormData = {
  company_name: string;
  company_name_short: string;
  company_legal_name: string;
  company_name_clean: string;
  website_url: string;
  linkedin_url: string;
  entity_type: string;
  company_type_primary: string;
  company_type_secondary: string[];
  ownership_type: string;
  is_spv: string;
  is_active_company: string;
  company_status: string;
  parent_company_id: string;
  ultimate_parent_company_id: string;
  company_group_name: string;
  group_inclusion_type: string;
  group_reporting_weight: string;
  headquarters_city: string;
  headquarters_country: string;
  region: string;
  wb_region: string;
  geothermal_focus: string;
  technology_focus: string;
  service_scope_summary: string;
  operating_markets_summary: string;
  research_status: string;
  date_created: string;
  notes: string;
  information: string;
  internal_comments: string;
  edited_description: string;
};

const COMPANY_TYPE_PRIMARY_OPTIONS = [
  { value: "", label: "Select primary type" },
  { value: "Developer", label: "Developer" },
  { value: "Resource owner", label: "Resource owner" },
  { value: "Technology provider", label: "Technology provider" },
  { value: "Turbine supplier", label: "Turbine supplier" },
  { value: "OEM / Equipment supplier", label: "OEM / Equipment supplier" },
  { value: "Service provider", label: "Service provider" },
  { value: "Drilling company", label: "Drilling company" },
  { value: "EPC contractor", label: "EPC contractor" },
  { value: "Investment / finance", label: "Investment / finance" },
  { value: "Utility / IPP", label: "Utility / IPP" },
  { value: "Public / development institution", label: "Public / development institution" },
  { value: "Association / industry body", label: "Association / industry body" },
  { value: "Advocacy / non-profit", label: "Advocacy / non-profit" },
];

const GROUP_INCLUSION_OPTIONS = [
  { value: "", label: "Select option" },
  { value: "Full", label: "Full" },
  { value: "Equity", label: "Equity" },
  { value: "Non-consolidated", label: "Non-consolidated" },
  { value: "Unknown", label: "Unknown" },
];

const emptyForm: CompanyFormData = {
  company_name: "",
  company_name_short: "",
  company_legal_name: "",
  company_name_clean: "",
  website_url: "",
  linkedin_url: "",
  entity_type: "",
  company_type_primary: "",
  company_type_secondary: [],
  ownership_type: "",
  is_spv: "0",
  is_active_company: "1",
  company_status: "",
  parent_company_id: "",
  ultimate_parent_company_id: "",
  company_group_name: "",
  group_inclusion_type: "Full",
  group_reporting_weight: "1.0",
  headquarters_city: "",
  headquarters_country: "",
  region: "",
  wb_region: "",
  geothermal_focus: "",
  technology_focus: "",
  service_scope_summary: "",
  operating_markets_summary: "",
  research_status: "Need Info",
  date_created: "",
  notes: "",
  information: "",
  internal_comments: "",
  edited_description: "Initial company record created",
};

async function safeJson(res: Response) {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export default function NewCompanyPage() {
  const router = useRouter();

  const [form, setForm] = useState<CompanyFormData>(emptyForm);
  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadCompanyOptions() {
      try {
        const res = await fetch("/api/companies/options");
        if (!res.ok) throw new Error("Failed to load company options");
        const json = await safeJson(res);
        setCompanyOptions(Array.isArray(json) ? json : []);
      } catch (err) {
        console.error("Error loading company options:", err);
        setCompanyOptions([]);
      }
    }

    loadCompanyOptions();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setFieldErrors({});

      const validationErrors = validateCompanyForm({
        company_name: form.company_name,
        company_type_primary: form.company_type_primary,
        company_type_secondary: form.company_type_secondary,
        group_reporting_weight: form.group_reporting_weight,
        date_created: form.date_created,
      });

      if (validationErrors.length > 0) {
        const fieldMap: Record<string, string> = {};
        validationErrors.forEach((err) => {
          fieldMap[err.field] = err.message;
        });

        setFieldErrors(fieldMap);
        setError(`Please correct ${validationErrors.length} highlighted field(s) before saving.`);
        focusField(validationErrors[0].field);
        return;
      }

      const payload = {
        company_name: form.company_name,
        company_name_short: form.company_name_short,
        company_legal_name: form.company_legal_name,
        company_name_clean: form.company_name_clean,
        website_url: form.website_url,
        linkedin_url: form.linkedin_url,
        entity_type: form.entity_type,
        company_type_primary: form.company_type_primary,
        secondary_types: form.company_type_secondary,
        ownership_type: form.ownership_type,
        is_spv: form.is_spv,
        is_active_company: form.is_active_company,
        company_status: form.company_status,
        parent_company_id: form.parent_company_id,
        ultimate_parent_company_id: form.ultimate_parent_company_id,
        company_group_name: form.company_group_name,
        consolidation_method: form.group_inclusion_type,
        group_inclusion_type: form.group_inclusion_type,
        group_reporting_weight:
          form.group_reporting_weight.trim() === ""
            ? null
            : Number(form.group_reporting_weight),
        headquarters_city: form.headquarters_city,
        headquarters_country: form.headquarters_country,
        region: form.region,
        wb_region: form.wb_region,
        geothermal_focus: form.geothermal_focus,
        technology_focus: form.technology_focus,
        service_scope_summary: form.service_scope_summary,
        operating_markets_summary: form.operating_markets_summary,
        research_status: form.research_status,
        date_created: form.date_created,
        notes: form.notes,
        information: form.information,
        internal_comments: form.internal_comments,
        edited_description: form.edited_description,
      };

      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await safeJson(res);

      if (!res.ok) {
        throw new Error(result?.error || "Failed to create company");
      }

      const newCompanyId =
        result?.company?.company_id || result?.company_id || result?.id;

      if (!newCompanyId) {
        throw new Error("Company created, but no company_id was returned.");
      }

      router.push(`/companies/${newCompanyId}/edit?created=1`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Could not create company.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-8">
      <div className="mb-5 flex flex-col gap-4 md:mb-8 md:flex-row md:items-start md:justify-between md:gap-6">
        <div className="max-w-3xl space-y-3">
          <h1 className="text-2xl font-bold tracking-tight text-[#1f2937] md:text-3xl">
            New Company
          </h1>

          <p className="text-sm text-gray-600">
            Create a new company profile.
          </p>

          <div className="border-l-4 border-l-[#8dc63f] bg-[#f6fbef] px-4 py-3 md:px-5">
            <p className="text-sm leading-relaxed text-[#1f2937]">
              <span className="font-semibold">Workflow:</span>{" "}
              {COMPANY_FIELD_HELP.workflowNew}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-start">
          <ActionButton href="/companies" variant="secondary">
            Cancel
          </ActionButton>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {error ? (
          <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <Section title="Core Identification">
          <p className="mb-4 text-sm text-gray-600">
            Enter the legal company identity and standard naming fields used
            across the database.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Company Name"
              name="company_name"
              value={form.company_name}
              onChange={handleChange}
              helpTitle="Company Name"
              helpContent={COMPANY_FIELD_HELP.companyName}
              error={fieldErrors.company_name}
            />
            <Input
              label="Short Name"
              name="company_name_short"
              value={form.company_name_short}
              onChange={handleChange}
              helpTitle="Short Name"
              helpContent={COMPANY_FIELD_HELP.shortName}
            />
            <Input
              label="Legal Name"
              name="company_legal_name"
              value={form.company_legal_name}
              onChange={handleChange}
              helpTitle="Legal Name"
              helpContent={COMPANY_FIELD_HELP.legalName}
            />
            <Input
              label="Clean Name"
              name="company_name_clean"
              value={form.company_name_clean}
              onChange={handleChange}
              helpTitle="Clean Name"
              helpContent={COMPANY_FIELD_HELP.cleanName}
            />
          </div>
        </Section>

        <Section title="Web & External Presence">
          <p className="mb-4 text-sm text-gray-600">
            Add official public links and core external references for the company.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Website URL"
              name="website_url"
              value={form.website_url}
              onChange={handleChange}
            />
            <Input
              label="LinkedIn URL"
              name="linkedin_url"
              value={form.linkedin_url}
              onChange={handleChange}
            />
          </div>
        </Section>

        <Section title="Entity & Classification">
          <p className="mb-4 text-sm text-gray-600">
            Use this section to describe what the company broadly is. Do not use
            it for project- or plant-specific participation such as owner,
            operator, EPC, drilling, investor, or supplier roles — those are
            assigned after creation in linked projects and plants.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormSelect
              label="Entity Type"
              name="entity_type"
              value={form.entity_type}
              onChange={handleChange}
              options={withCurrentValue(ENTITY_TYPE_OPTIONS, form.entity_type)}
            />

            <FormSelect
              label="Primary Type"
              name="company_type_primary"
              value={form.company_type_primary}
              onChange={handleChange}
              options={withCurrentValue(COMPANY_TYPE_PRIMARY_OPTIONS, form.company_type_primary)}
              helpText="Use one broad company identity only. Project- and plant-specific roles belong in linked projects and plants."
              error={fieldErrors.company_type_primary}
            />

            <div>
              <label className="mb-1 flex items-center text-sm font-medium text-gray-700">
                <span>Secondary Types</span>
                <FieldHelp
                  title="Secondary Types"
                  content="Select up to 3 secondary types for capabilities only. Do not duplicate the primary type, and do not use secondary types for project- or plant-specific roles."
                />
              </label>

              <select
                multiple
                name="company_type_secondary"
                value={form.company_type_secondary}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map(
                    (opt) => opt.value
                  );
                  setForm((prev) => ({
                    ...prev,
                    company_type_secondary: selected.slice(0, 3),
                  }));
                }}
                className={`min-h-[180px] w-full rounded-none border px-3 py-2 text-sm outline-none md:min-h-[220px] ${fieldErrors.company_type_secondary
                  ? "border-red-500 bg-red-50 ring-2 ring-red-100"
                  : "border-gray-300 bg-white focus:border-[#8dc63f]"
                  }`}
              >
                {COMPANY_TYPE_SECONDARY_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              {fieldErrors.company_type_secondary ? (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.company_type_secondary}
                </p>
              ) : null}

              <p className="mt-1 text-xs text-gray-500">
                Hold Ctrl/Cmd to select multiple. Maximum 3 selections. Use for
                capabilities, not asset-level roles.
              </p>

              {form.company_type_secondary.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {form.company_type_secondary.map((item) => (
                    <span
                      key={item}
                      className="inline-flex border border-gray-300 bg-gray-50 px-2 py-1 text-xs text-gray-700"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <FormSelect
              label="Ownership Type"
              name="ownership_type"
              value={form.ownership_type}
              onChange={handleChange}
              options={withCurrentValue(OWNERSHIP_TYPE_OPTIONS, form.ownership_type)}
            />

            <FormSelect
              label="Is SPV"
              name="is_spv"
              value={form.is_spv}
              onChange={handleChange}
              options={YES_NO_OPTIONS}
            />

            <Input
              label="Company Status"
              name="company_status"
              value={form.company_status}
              onChange={handleChange}
            />

            <FormSelect
              label="Research Status"
              name="research_status"
              value={form.research_status}
              onChange={handleChange}
              options={withCurrentValue(RESEARCH_STATUS_OPTIONS, form.research_status)}
            />

            <FormSelect
              label="Is Active Company"
              name="is_active_company"
              value={form.is_active_company}
              onChange={handleChange}
              options={YES_NO_OPTIONS}
            />

            <div>
              <label className="mb-1 flex items-center text-sm font-medium text-gray-700">
                <span>Is Group Parent</span>
                <FieldHelp
                  title="Is Group Parent"
                  content="Automatically determined. A company is considered a group parent if no parent company is assigned."
                />
              </label>

              <select
                value={form.parent_company_id ? "0" : "1"}
                disabled
                className="w-full rounded-none border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-500"
              >
                {YES_NO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Section>

        <Section title="Group / Parent Structure">
          <p className="mb-4 text-sm text-gray-600">
            Use this section only for company-to-company hierarchy and reporting
            structure. Do not use it for project or plant participation roles.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Parent Company
              </label>
              <select
                name="parent_company_id"
                value={form.parent_company_id}
                onChange={handleChange}
                className="w-full rounded-none border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#8dc63f]"
              >
                <option value="">Select parent company...</option>
                {companyOptions.map((option) => (
                  <option key={option.company_id} value={option.company_id}>
                    {option.company_name || option.company_id}
                    {option.headquarters_country
                      ? ` (${option.headquarters_country})`
                      : ""}
                  </option>
                ))}
              </select>

              <p className="mt-1 text-xs text-gray-500">
                If no parent is selected, this company is treated as the top-level entity.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Ultimate Parent Company
              </label>
              <select
                name="ultimate_parent_company_id"
                value={form.ultimate_parent_company_id}
                onChange={handleChange}
                className="w-full rounded-none border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#8dc63f]"
              >
                <option value="">Select ultimate parent...</option>
                {companyOptions.map((option) => (
                  <option key={option.company_id} value={option.company_id}>
                    {option.company_name || option.company_id}
                    {option.headquarters_country
                      ? ` (${option.headquarters_country})`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Reporting Group"
              name="company_group_name"
              value={form.company_group_name}
              onChange={handleChange}
              helpTitle="Reporting Group"
              helpContent="Use this as the portfolio roll-up label for reporting and aggregation. It may match the legal parent name, but it is not meant to replace legal ownership logic."
            />

            <FormSelect
              label="Consolidation Method"
              name="group_inclusion_type"
              value={form.group_inclusion_type}
              onChange={handleChange}
              options={withCurrentValue(GROUP_INCLUSION_OPTIONS, form.group_inclusion_type)}
              helpText="Defines how this company should be counted in reporting roll-up."
            />

            <Input
              label="Reporting Weight"
              name="group_reporting_weight"
              value={form.group_reporting_weight}
              onChange={handleChange}
              helpTitle="Reporting Weight"
              helpContent="Optional advanced value used for reporting roll-up. Use 1.0 for full consolidation unless a specific adjustment is needed."
              error={fieldErrors.group_reporting_weight}
            />
          </div>
        </Section>

        <Section title="Headquarters & Geography">
          <p className="mb-4 text-sm text-gray-600">
            Record the company’s main geographic base and reporting regions.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Headquarters City"
              name="headquarters_city"
              value={form.headquarters_city}
              onChange={handleChange}
            />
            <Input
              label="Headquarters Country"
              name="headquarters_country"
              value={form.headquarters_country}
              onChange={handleChange}
            />
            <FormSelect
              label="Region"
              name="region"
              value={form.region}
              onChange={handleChange}
              options={withCurrentValue(REGION_OPTIONS, form.region)}
            />
            <FormSelect
              label="WB Region"
              name="wb_region"
              value={form.wb_region}
              onChange={handleChange}
              options={withCurrentValue(WB_REGION_OPTIONS, form.wb_region)}
            />
          </div>
        </Section>

        <Section title="Strategic / Market Focus">
          <p className="mb-4 text-sm text-gray-600">
            Capture the company’s focus areas, capabilities, and market footprint
            in concise narrative form.
          </p>
          <div className="space-y-4">
            <Input
              label="Geothermal Focus"
              name="geothermal_focus"
              value={form.geothermal_focus}
              onChange={handleChange}
            />
            <Input
              label="Technology Focus"
              name="technology_focus"
              value={form.technology_focus}
              onChange={handleChange}
            />
            <Textarea
              label="Service Scope Summary"
              name="service_scope_summary"
              value={form.service_scope_summary}
              onChange={handleChange}
              rows={4}
            />
            <Textarea
              label="Operating Markets Summary"
              name="operating_markets_summary"
              value={form.operating_markets_summary}
              onChange={handleChange}
              rows={4}
            />
          </div>
        </Section>

        <Section title="Research & Editorial">
          <p className="mb-4 text-sm text-gray-600">
            Use this section for research notes, editorial context, and internal tracking.
          </p>
          <div className="space-y-4">
            <Input
              label="Date Created"
              name="date_created"
              value={form.date_created}
              onChange={handleChange}
              error={fieldErrors.date_created}
            />
            <Textarea
              label="Information"
              name="information"
              value={form.information}
              onChange={handleChange}
              rows={5}
            />
            <Textarea
              label="Notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={5}
            />
            <Textarea
              label="Internal Comments"
              name="internal_comments"
              value={form.internal_comments}
              onChange={handleChange}
              rows={5}
            />
            <Textarea
              label="Edited Description"
              name="edited_description"
              value={form.edited_description}
              onChange={handleChange}
              rows={3}
            />
          </div>
        </Section>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <ActionButton href="/companies" variant="secondary">
            Cancel
          </ActionButton>

          <ActionButton type="submit" variant="primary" disabled={saving}>
            {saving ? "Creating..." : "Create Company"}
          </ActionButton>
        </div>
      </form>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-[#f7f7f7] px-4 py-3 md:px-5">
        <h2 className="text-base font-semibold text-[#1f2937] md:text-lg">
          {title}
        </h2>
      </div>
      <div className="px-4 py-4 md:px-5 md:py-5">{children}</div>
    </section>
  );
}

type InputProps = {
  label: string;
  name: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  helpTitle?: string;
  helpContent?: string;
  error?: string;
};

function Input({
  label,
  name,
  value,
  onChange,
  disabled = false,
  required = false,
  helpTitle,
  helpContent,
  error,
}: InputProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1 flex items-center text-sm font-medium text-gray-700"
      >
        <span>{label}</span>
        {helpContent ? (
          <FieldHelp title={helpTitle || label} content={helpContent} />
        ) : null}
      </label>
      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`w-full rounded-none border px-3 py-2 text-sm outline-none ${error
          ? "border-red-500 bg-red-50 ring-2 ring-red-100"
          : disabled
            ? "border-gray-300 bg-gray-100 text-gray-500"
            : "border-gray-300 bg-white focus:border-[#8dc63f]"
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
  disabled?: boolean;
};

function Textarea({
  label,
  name,
  value,
  onChange,
  rows = 5,
  disabled = false,
}: TextareaProps) {
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
        disabled={disabled}
        className={`w-full rounded-none border px-3 py-2 text-sm outline-none ${disabled
          ? "border-gray-300 bg-gray-100 text-gray-500"
          : "border-gray-300 bg-white focus:border-[#8dc63f]"
          }`}
      />
    </div>
  );
}
