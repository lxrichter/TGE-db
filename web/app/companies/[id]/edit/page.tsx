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
import { ASSET_COMPANY_ROLE_OPTIONS } from "@/lib/options/companyAssetRoles";
import {
  ENTITY_TYPE_OPTIONS,
  OWNERSHIP_TYPE_OPTIONS,
} from "@/lib/options/companies";
import { COMPANY_TYPE_SECONDARY_GROUPS } from "@/lib/options/companySecondaryTypes";
import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";
import { validateCompanyForm } from "@/lib/validation/company";
import { validateAssetLinkForm } from "@/lib/validation/assetLinks";
import { validateCompanyRelationshipForm } from "@/lib/validation/companyRelationships";

type CompanyFormData = {
  company_id: string;
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
  is_group_parent: string;
  is_operating_entity: string;
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
  date_edited: string;
  notes: string;
  information: string;
  internal_comments: string;
  edited_description: string;
  created_at?: string;
  updated_at?: string;
};

type Role = {
  company_role_id: string;
  role_type: string | null;
  role_subtype: string | null;
  role_scope: string | null;
  role_status: string | null;
  notes: string | null;
};

type ProjectLink = {
  company_project_link_id: string;
  project_id: string;
  project_name: string | null;
  role: string | null;
  role_detail: string | null;
  is_primary: number | null;
  notes: string | null;
  ownership_share?: number | null;
};

type PlantLink = {
  company_plant_link_id: string;
  plant_id: string;
  plant_name: string | null;
  role: string | null;
  role_detail: string | null;
  is_primary: number | null;
  notes: string | null;
  ownership_share?: number | null;
};

type Relationship = {
  company_relationship_id: string;
  relationship_type: string | null;
  ownership_percentage: number | null;
  is_current: number | null;
  notes: string | null;
  related_company_id: string | null;
  related_company_name: string | null;
};

type ProjectOption = {
  project_id: string;
  project_name: string | null;
  country: string | null;
};

type PlantOption = {
  plant_id: string;
  plant_name: string | null;
  country: string | null;
};

type CompanyOption = {
  company_id: string;
  company_name: string | null;
  headquarters_country: string | null;
};

type CompanyDetailResponse = {
  company?: any;
  roles: Role[];
  project_links: ProjectLink[];
  plant_links: PlantLink[];
  relationships_outgoing: Relationship[];
  relationships_incoming: Relationship[];
  error?: string;
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

const RELATIONSHIP_TYPE_OPTIONS = [
  { value: "", label: "Select relationship type" },
  { value: "Parent of", label: "Parent of" },
  { value: "Subsidiary of", label: "Subsidiary of" },
  { value: "Owned by", label: "Owned by" },
  { value: "Owns", label: "Owns" },
  { value: "Ultimate parent of", label: "Ultimate parent of" },
  { value: "Joint venture with", label: "Joint venture with" },
  { value: "Affiliate of", label: "Affiliate of" },
  { value: "Minority shareholder in", label: "Minority shareholder in" },
  { value: "Majority shareholder in", label: "Majority shareholder in" },
  { value: "Investor in", label: "Investor in" },
  { value: "Project partner of", label: "Project partner of" },
  { value: "Technology partner of", label: "Technology partner of" },
];

const emptyForm: CompanyFormData = {
  company_id: "",
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
  is_group_parent: "0",
  is_operating_entity: "0",
  headquarters_city: "",
  headquarters_country: "",
  region: "",
  wb_region: "",
  geothermal_focus: "",
  technology_focus: "",
  service_scope_summary: "",
  operating_markets_summary: "",
  research_status: "",
  date_created: "",
  date_edited: "",
  notes: "",
  information: "",
  internal_comments: "",
  edited_description: "",
  created_at: "",
  updated_at: "",
};

function toInputValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function formatDisplayDate(value: unknown): string {
  if (!value) return "NA";
  const str = String(value).trim();
  if (!str) return "NA";
  return str.length >= 10 ? str.slice(0, 10) : str;
}

function ReviewStatusBadge({ value }: { value: string }) {
  const normalized = (value || "").trim().toLowerCase();

  if (!normalized || normalized === "na") {
    return <StatusBadge tone="neutralSoft">NA</StatusBadge>;
  }

  if (normalized === "approved") {
    return <StatusBadge tone="successSoft">Approved</StatusBadge>;
  }

  if (normalized === "pending review" || normalized === "pending_review") {
    return <StatusBadge tone="warningSoft">Pending Review</StatusBadge>;
  }

  return <StatusBadge tone="neutralSoft">{value}</StatusBadge>;
}

function ResearchStatusBadge({ value }: { value: string }) {
  const normalized = (value || "").trim().toLowerCase();

  if (!normalized || normalized === "na" || normalized === "n/a") {
    return <StatusBadge tone="neutralSoft">NA</StatusBadge>;
  }

  if (normalized.includes("done")) {
    return <StatusBadge tone="success">Done</StatusBadge>;
  }

  if (normalized.includes("progress")) {
    return <StatusBadge tone="info">In Progress</StatusBadge>;
  }

  if (normalized.includes("need")) {
    return <StatusBadge tone="danger">Need Info</StatusBadge>;
  }

  return <StatusBadge tone="neutralSoft">{value}</StatusBadge>;
}

type SectionProps = {
  title: React.ReactNode;
  children: React.ReactNode;
};

function Section({ title, children }: SectionProps) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-[#f7f7f7] px-4 py-3 md:px-5">
        <h2 className="text-base font-semibold text-[#1f2937] md:text-lg">{title}</h2>
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
        className={`w-full rounded-none border px-3 py-2 text-sm outline-none ${
          error
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
};

function Textarea({ label, name, value, onChange, rows = 5 }: TextareaProps) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        className="w-full rounded-none border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#8dc63f]"
      />
    </div>
  );
}

function MetadataCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border border-gray-200 bg-[#fafafa] px-4 py-4">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="text-sm text-[#1f2937]">{value || "NA"}</div>
    </div>
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

export default function EditCompanyPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = params.id;
  const justCreated = searchParams.get("created") === "1";

  const [form, setForm] = useState<CompanyFormData>(emptyForm);
  const [detailData, setDetailData] = useState<CompanyDetailResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([]);
  const [plantOptions, setPlantOptions] = useState<PlantOption[]>([]);
  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);

  const [linkProjectForm, setLinkProjectForm] = useState({
    project_id: "",
    role: "",
    role_detail: "",
    ownership_share: "",
    is_primary: false,
    notes: "",
  });

  const [linkPlantForm, setLinkPlantForm] = useState({
    plant_id: "",
    role: "",
    role_detail: "",
    ownership_share: "",
    is_primary: false,
    notes: "",
  });

  const [relationshipForm, setRelationshipForm] = useState({
    company_id_to: "",
    relationship_type: "",
    ownership_percentage: "",
    is_current: true,
    notes: "",
  });

  const [isLinkingProject, setIsLinkingProject] = useState(false);
  const [linkProjectMessage, setLinkProjectMessage] = useState("");

  const [isLinkingPlant, setIsLinkingPlant] = useState(false);
  const [linkPlantMessage, setLinkPlantMessage] = useState("");

  const [isLinkingRelationship, setIsLinkingRelationship] = useState(false);
  const [relationshipMessage, setRelationshipMessage] = useState("");

  const [editingProjectLinkId, setEditingProjectLinkId] = useState<string | null>(null);
  const [editingPlantLinkId, setEditingPlantLinkId] = useState<string | null>(null);
  const [editingRelationshipId, setEditingRelationshipId] = useState<string | null>(null);

  const availableProjectOptions = useMemo(() => {
    if (editingProjectLinkId) return projectOptions;
    const linkedIds = new Set(detailData?.project_links.map((p) => p.project_id) || []);
    return projectOptions.filter((p) => !linkedIds.has(p.project_id));
  }, [projectOptions, detailData, editingProjectLinkId]);

  const availablePlantOptions = useMemo(() => {
    if (editingPlantLinkId) return plantOptions;
    const linkedIds = new Set(detailData?.plant_links.map((p) => p.plant_id) || []);
    return plantOptions.filter((p) => !linkedIds.has(p.plant_id));
  }, [plantOptions, detailData, editingPlantLinkId]);

  useEffect(() => {
    if (!companyId) return;

    async function loadCompany() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/companies/${companyId}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load company");

        const data = await safeJson(res);
        const company = data?.company;
        if (!company) throw new Error("Company not found");

        setDetailData(data);

        setForm({
          company_id: toInputValue(company.company_id),
          company_name: toInputValue(company.company_name),
          company_name_short: toInputValue(company.company_name_short),
          company_legal_name: toInputValue(company.company_legal_name),
          company_name_clean: toInputValue(company.company_name_clean),
          website_url: toInputValue(company.website_url),
          linkedin_url: toInputValue(company.linkedin_url),
          entity_type: toInputValue(company.entity_type),
          company_type_primary: toInputValue(company.company_type_primary),
          company_type_secondary: Array.isArray(company.secondary_types)
            ? company.secondary_types
            : [],
          ownership_type: toInputValue(company.ownership_type),
          is_spv: toInputValue(company.is_spv ?? 0),
          is_active_company: toInputValue(company.is_active_company ?? 1),
          company_status: toInputValue(company.company_status),
          parent_company_id: toInputValue(company.parent_company_id),
          ultimate_parent_company_id: toInputValue(company.ultimate_parent_company_id),
          company_group_name: toInputValue(company.company_group_name),
          group_inclusion_type: toInputValue(
            company.consolidation_method || company.group_inclusion_type || "Full"
          ),
          group_reporting_weight: toInputValue(company.group_reporting_weight ?? 1.0),
          is_group_parent: toInputValue(company.is_group_parent ?? 0),
          is_operating_entity: toInputValue(company.is_operating_entity ?? 0),
          headquarters_city: toInputValue(company.headquarters_city),
          headquarters_country: toInputValue(company.headquarters_country),
          region: toInputValue(company.region),
          wb_region: toInputValue(company.wb_region),
          geothermal_focus: toInputValue(company.geothermal_focus),
          technology_focus: toInputValue(company.technology_focus),
          service_scope_summary: toInputValue(company.service_scope_summary),
          operating_markets_summary: toInputValue(company.operating_markets_summary),
          research_status: toInputValue(company.research_status),
          date_created: toInputValue(company.date_created),
          date_edited: toInputValue(company.date_edited),
          notes: toInputValue(company.notes),
          information: toInputValue(company.information),
          internal_comments: toInputValue(company.internal_comments),
          edited_description: toInputValue(company.edited_description),
          created_at: toInputValue(company.created_at),
          updated_at: toInputValue(company.updated_at),
        });
        setHasUnsavedChanges(false);
      } catch (err) {
        console.error(err);
        setError("Could not load company.");
      } finally {
        setLoading(false);
      }
    }

    loadCompany();
  }, [companyId]);

  useEffect(() => {
    async function loadProjectOptions() {
      try {
        const res = await fetch("/api/projects/options");
        if (!res.ok) throw new Error("Failed to load project options");
        const json = await safeJson(res);
        setProjectOptions(Array.isArray(json) ? json : []);
      } catch (err) {
        console.error("Error loading project options:", err);
        setProjectOptions([]);
      }
    }

    loadProjectOptions();
  }, []);

  useEffect(() => {
    async function loadPlantOptions() {
      try {
        const res = await fetch("/api/plants/options");
        if (!res.ok) throw new Error("Failed to load plant options");
        const json = await safeJson(res);
        setPlantOptions(Array.isArray(json) ? json : []);
      } catch (err) {
        console.error("Error loading plant options:", err);
        setPlantOptions([]);
      }
    }

    loadPlantOptions();
  }, []);

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

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges || saving) return;

      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges, saving]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setHasUnsavedChanges(true);
  }

  function markUnsavedChanges() {
    setHasUnsavedChanges(true);
  }

  function startEditProjectLink(row: ProjectLink) {
    setEditingProjectLinkId(row.company_project_link_id);
    setLinkProjectMessage("");
    setLinkProjectForm({
      project_id: row.project_id || "",
      role: row.role || "",
      role_detail: row.role_detail || "",
      ownership_share:
        row.ownership_share === null || row.ownership_share === undefined
          ? ""
          : String(row.ownership_share),
      is_primary: Boolean(row.is_primary),
      notes: row.notes || "",
    });
  }

  function cancelEditProjectLink() {
    setEditingProjectLinkId(null);
    setLinkProjectMessage("");
    setLinkProjectForm({
      project_id: "",
      role: "",
      role_detail: "",
      ownership_share: "",
      is_primary: false,
      notes: "",
    });
  }

  function startEditPlantLink(row: PlantLink) {
    setEditingPlantLinkId(row.company_plant_link_id);
    setLinkPlantMessage("");
    setLinkPlantForm({
      plant_id: row.plant_id || "",
      role: row.role || "",
      role_detail: row.role_detail || "",
      ownership_share:
        row.ownership_share === null || row.ownership_share === undefined
          ? ""
          : String(row.ownership_share),
      is_primary: Boolean(row.is_primary),
      notes: row.notes || "",
    });
  }

  function cancelEditPlantLink() {
    setEditingPlantLinkId(null);
    setLinkPlantMessage("");
    setLinkPlantForm({
      plant_id: "",
      role: "",
      role_detail: "",
      ownership_share: "",
      is_primary: false,
      notes: "",
    });
  }

  function startEditRelationship(row: Relationship) {
    setEditingRelationshipId(row.company_relationship_id);
    setRelationshipMessage("");
    setRelationshipForm({
      company_id_to: row.related_company_id || "",
      relationship_type: row.relationship_type || "",
      ownership_percentage:
        row.ownership_percentage === null || row.ownership_percentage === undefined
          ? ""
          : String(row.ownership_percentage),
      is_current: Boolean(row.is_current),
      notes: row.notes || "",
    });
  }

  function cancelEditRelationship() {
    setEditingRelationshipId(null);
    setRelationshipMessage("");
    setRelationshipForm({
      company_id_to: "",
      relationship_type: "",
      ownership_percentage: "",
      is_current: true,
      notes: "",
    });
  }

  async function handleApprove() {
    try {
      setApproving(true);
      setError("");

      const res = await fetch(`/api/companies/${companyId}/approve`, {
        method: "POST",
      });

      const json = await safeJson(res);

      if (!res.ok) throw new Error(json?.error || "Failed to approve company");

      setDetailData((prev) =>
        prev
          ? {
            ...prev,
            company: {
              ...prev.company,
              ...json.company,
            },
          }
          : prev
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not approve company.");
    } finally {
      setApproving(false);
    }
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
          form.group_reporting_weight.trim() === "" ? null : Number(form.group_reporting_weight),
        headquarters_city: form.headquarters_city,
        headquarters_country: form.headquarters_country,
        region: form.region,
        wb_region: form.wb_region,
        geothermal_focus: form.geothermal_focus,
        technology_focus: form.technology_focus,
        service_scope_summary: form.service_scope_summary,
        operating_markets_summary: form.operating_markets_summary,
        research_status: form.research_status,
        notes: form.notes,
        information: form.information,
        internal_comments: form.internal_comments,
        edited_description: form.edited_description,
      };

      const res = await fetch(`/api/companies/${companyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await safeJson(res);

      if (!res.ok) throw new Error(result?.error || "Failed to update company");

      setHasUnsavedChanges(false);
      router.push(`/companies/${companyId}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not save company.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete company "${form.company_name || form.company_id}"?`
    );
    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");

      const res = await fetch(`/api/companies/${companyId}`, { method: "DELETE" });
      const result = await safeJson(res);
      if (!res.ok) throw new Error(result?.error || "Failed to delete company");

      router.push("/companies");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not delete company.");
    } finally {
      setSaving(false);
    }
  }

  async function addProjectLink() {
    try {
      setIsLinkingProject(true);
      setLinkProjectMessage("");

      if (!companyId) throw new Error("Company ID is missing.");
      if (!linkProjectForm.project_id) throw new Error("Please select a project.");
      if (!linkProjectForm.role.trim()) throw new Error("Please enter a role for the project link.");

      const validationErrors = validateAssetLinkForm({
        assetLabel: "project",
        assetId: linkProjectForm.project_id,
        role: linkProjectForm.role,
        ownershipShare: linkProjectForm.ownership_share,
      });

      if (validationErrors.length > 0) {
        setLinkProjectMessage(validationErrors[0]);
        setIsLinkingProject(false);
        return;
      }

      const res = await fetch("/api/company-project-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: companyId,
          project_id: linkProjectForm.project_id,
          role: linkProjectForm.role.trim(),
          role_detail: linkProjectForm.role_detail.trim() || null,
          ownership_share:
            linkProjectForm.ownership_share.trim() === ""
              ? null
              : Number(linkProjectForm.ownership_share),
          is_primary: linkProjectForm.is_primary,
          notes: linkProjectForm.notes.trim() || null,
        }),
      });

      const json = await safeJson(res);
      if (!res.ok) throw new Error(json?.error || "Failed to create project link");

      setDetailData((prev) =>
        prev ? { ...prev, project_links: [...prev.project_links, json.link] } : prev
      );

      cancelEditProjectLink();
      setLinkProjectMessage("Project link added successfully.");
        } catch (error) {
      setLinkProjectMessage(
        error instanceof Error ? error.message : "Failed to create project link."
      );
    } finally {
      setIsLinkingProject(false);
    }
  }

  async function updateProjectLink() {
    if (!editingProjectLinkId) return;

    try {
      setIsLinkingProject(true);
      setLinkProjectMessage("");

      if (!linkProjectForm.project_id) throw new Error("Please select a project.");
      if (!linkProjectForm.role.trim()) throw new Error("Please enter a role for the project link.");

      const validationErrors = validateAssetLinkForm({
        assetLabel: "project",
        assetId: linkProjectForm.project_id,
        role: linkProjectForm.role,
        ownershipShare: linkProjectForm.ownership_share,
      });

      if (validationErrors.length > 0) {
        setLinkProjectMessage(validationErrors[0]);
        setIsLinkingProject(false);
        return;
      }

      const res = await fetch(`/api/company-project-links/${editingProjectLinkId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: linkProjectForm.project_id,
          role: linkProjectForm.role.trim(),
          role_detail: linkProjectForm.role_detail.trim() || null,
          ownership_share:
            linkProjectForm.ownership_share.trim() === "" ||
              isNaN(Number(linkProjectForm.ownership_share))
              ? null
              : Number(linkProjectForm.ownership_share),
          is_primary: linkProjectForm.is_primary,
          notes: linkProjectForm.notes.trim() || null,
        }),
      });

      const json = await safeJson(res);
      if (!res.ok) throw new Error(json?.error || "Failed to update project link");

      setDetailData((prev) =>
        prev
          ? {
            ...prev,
            project_links: prev.project_links.map((row) =>
              row.company_project_link_id === editingProjectLinkId ? json.link : row
            ),
          }
          : prev
      );

      cancelEditProjectLink();
      setLinkProjectMessage("Project link updated successfully.");
    } catch (error) {
      setLinkProjectMessage(
        error instanceof Error ? error.message : "Failed to update project link."
      );
    } finally {
      setIsLinkingProject(false);
    }
  }

  async function deleteProjectLink(linkId: string) {
    const confirmed = window.confirm("Delete this project link?");
    if (!confirmed) return;

    try {
      setLinkProjectMessage("");

      const res = await fetch(`/api/company-project-links/${linkId}`, {
        method: "DELETE",
      });

      const json = await safeJson(res);
      if (!res.ok) throw new Error(json?.error || "Failed to delete project link");

      setDetailData((prev) =>
        prev
          ? {
            ...prev,
            project_links: prev.project_links.filter(
              (row) => row.company_project_link_id !== linkId
            ),
          }
          : prev
      );

      if (editingProjectLinkId === linkId) cancelEditProjectLink();
      setLinkProjectMessage("Project link deleted successfully.");
    } catch (error) {
      setLinkProjectMessage(
        error instanceof Error ? error.message : "Failed to delete project link."
      );
    }
  }

  async function addPlantLink() {
    try {
      setIsLinkingPlant(true);
      setLinkPlantMessage("");

      if (!companyId) throw new Error("Company ID is missing.");
      if (!linkPlantForm.plant_id) throw new Error("Please select a plant.");
      if (!linkPlantForm.role.trim()) throw new Error("Please enter a role for the plant link.");

      const validationErrors = validateAssetLinkForm({
        assetLabel: "plant",
        assetId: linkPlantForm.plant_id,
        role: linkPlantForm.role,
        ownershipShare: linkPlantForm.ownership_share,
      });

      if (validationErrors.length > 0) {
        setLinkPlantMessage(validationErrors[0]);
        setIsLinkingPlant(false);
        return;
      }

      const res = await fetch("/api/company-plant-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: companyId,
          plant_id: linkPlantForm.plant_id,
          role: linkPlantForm.role.trim(),
          role_detail: linkPlantForm.role_detail.trim() || null,
          ownership_share:
            linkPlantForm.ownership_share.trim() === ""
              ? null
              : Number(linkPlantForm.ownership_share),
          is_primary: linkPlantForm.is_primary,
          notes: linkPlantForm.notes.trim() || null,
        }),
      });

      const json = await safeJson(res);
      if (!res.ok) throw new Error(json?.error || "Failed to create plant link");

      setDetailData((prev) =>
        prev ? { ...prev, plant_links: [...prev.plant_links, json.link] } : prev
      );

      cancelEditPlantLink();
      setLinkPlantMessage("Plant link added successfully.");
    } catch (error) {
      setLinkPlantMessage(
        error instanceof Error ? error.message : "Failed to create plant link."
      );
    } finally {
      setIsLinkingPlant(false);
    }
  }

  async function updatePlantLink() {
    if (!editingPlantLinkId) return;

    try {
      setIsLinkingPlant(true);
      setLinkPlantMessage("");

      if (!linkPlantForm.plant_id) throw new Error("Please select a plant.");
      if (!linkPlantForm.role.trim()) throw new Error("Please enter a role for the plant link.");

      const validationErrors = validateAssetLinkForm({
        assetLabel: "plant",
        assetId: linkPlantForm.plant_id,
        role: linkPlantForm.role,
        ownershipShare: linkPlantForm.ownership_share,
      });

      if (validationErrors.length > 0) {
        setLinkPlantMessage(validationErrors[0]);
        setIsLinkingPlant(false);
        return;
      }

      const res = await fetch(`/api/company-plant-links/${editingPlantLinkId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plant_id: linkPlantForm.plant_id,
          role: linkPlantForm.role.trim(),
          role_detail: linkPlantForm.role_detail.trim() || null,
          ownership_share:
            linkPlantForm.ownership_share.trim() === "" ||
              isNaN(Number(linkPlantForm.ownership_share))
              ? null
              : Number(linkPlantForm.ownership_share),
          is_primary: linkPlantForm.is_primary,
          notes: linkPlantForm.notes.trim() || null,
        }),
      });

      const json = await safeJson(res);
      if (!res.ok) throw new Error(json?.error || "Failed to update plant link");

      setDetailData((prev) =>
        prev
          ? {
            ...prev,
            plant_links: prev.plant_links.map((row) =>
              row.company_plant_link_id === editingPlantLinkId ? json.link : row
            ),
          }
          : prev
      );

      cancelEditPlantLink();
      setLinkPlantMessage("Plant link updated successfully.");
    } catch (error) {
      setLinkPlantMessage(
        error instanceof Error ? error.message : "Failed to update plant link."
      );
    } finally {
      setIsLinkingPlant(false);
    }
  }

  async function deletePlantLink(linkId: string) {
    const confirmed = window.confirm("Delete this plant link?");
    if (!confirmed) return;

    try {
      setLinkPlantMessage("");

      const res = await fetch(`/api/company-plant-links/${linkId}`, {
        method: "DELETE",
      });

      const json = await safeJson(res);
      if (!res.ok) throw new Error(json?.error || "Failed to delete plant link");

      setDetailData((prev) =>
        prev
          ? {
            ...prev,
            plant_links: prev.plant_links.filter(
              (row) => row.company_plant_link_id !== linkId
            ),
          }
          : prev
      );

      if (editingPlantLinkId === linkId) cancelEditPlantLink();
      setLinkPlantMessage("Plant link deleted successfully.");
    } catch (error) {
      setLinkPlantMessage(
        error instanceof Error ? error.message : "Failed to delete plant link."
      );
    }
  }

  async function addCompanyRelationship() {
    try {
      setIsLinkingRelationship(true);
      setRelationshipMessage("");

      if (!companyId) {
        setRelationshipMessage("Company ID is missing.");
        setIsLinkingRelationship(false);
        return;
      }

      if (!relationshipForm.company_id_to) {
        setRelationshipMessage("Please select a related company.");
        setIsLinkingRelationship(false);
        return;
      }

      if (!relationshipForm.relationship_type.trim()) {
        setRelationshipMessage("Please select a relationship type.");
        setIsLinkingRelationship(false);
        return;
      }

      const validationErrors = validateCompanyRelationshipForm({
        currentCompanyId: companyId,
        relatedCompanyId: relationshipForm.company_id_to,
        relationshipType: relationshipForm.relationship_type,
        ownershipPercentage: relationshipForm.ownership_percentage,
      });

      if (validationErrors.length > 0) {
        setRelationshipMessage(validationErrors[0]);
        setIsLinkingRelationship(false);
        return;
      }

      const res = await fetch("/api/company-relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id_from: companyId,
          company_id_to: relationshipForm.company_id_to,
          relationship_type: relationshipForm.relationship_type.trim(),
          ownership_percentage:
            relationshipForm.ownership_percentage.trim() === ""
              ? null
              : Number(relationshipForm.ownership_percentage),
          is_current: relationshipForm.is_current,
          notes: relationshipForm.notes.trim() || null,
        }),
      });

      const json = await safeJson(res);
      if (!res.ok) throw new Error(json?.error || "Failed to create relationship");

      setDetailData((prev) =>
        prev
          ? {
            ...prev,
            relationships_outgoing: [...prev.relationships_outgoing, json.relationship],
          }
          : prev
      );

      cancelEditRelationship();
      setRelationshipMessage("Company relationship added successfully.");
    } catch (error) {
      setRelationshipMessage(
        error instanceof Error ? error.message : "Failed to create relationship."
      );
    } finally {
      setIsLinkingRelationship(false);
    }
  }

  async function updateRelationship() {
    if (!editingRelationshipId) return;

    try {
      setIsLinkingRelationship(true);
      setRelationshipMessage("");

      if (!companyId) {
        setRelationshipMessage("Company ID is missing.");
        setIsLinkingRelationship(false);
        return;
      }

      if (!relationshipForm.company_id_to) {
        setRelationshipMessage("Please select a related company.");
        setIsLinkingRelationship(false);
        return;
      }

      if (!relationshipForm.relationship_type.trim()) {
        setRelationshipMessage("Please select a relationship type.");
        setIsLinkingRelationship(false);
        return;
      }

      const validationErrors = validateCompanyRelationshipForm({
        currentCompanyId: companyId,
        relatedCompanyId: relationshipForm.company_id_to,
        relationshipType: relationshipForm.relationship_type,
        ownershipPercentage: relationshipForm.ownership_percentage,
      });

      if (validationErrors.length > 0) {
        setRelationshipMessage(validationErrors[0]);
        setIsLinkingRelationship(false);
        return;
      }

      const res = await fetch(`/api/company-relationships/${editingRelationshipId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id_from: companyId,
          company_id_to: relationshipForm.company_id_to,
          relationship_type: relationshipForm.relationship_type.trim(),
          ownership_percentage:
            relationshipForm.ownership_percentage.trim() === ""
              ? null
              : Number(relationshipForm.ownership_percentage),
          is_current: relationshipForm.is_current,
          notes: relationshipForm.notes.trim() || null,
        }),
      });

      const json = await safeJson(res);
      if (!res.ok) throw new Error(json?.error || "Failed to update relationship");

      setDetailData((prev) =>
        prev
          ? {
            ...prev,
            relationships_outgoing: prev.relationships_outgoing.map((row) =>
              row.company_relationship_id === editingRelationshipId ? json.relationship : row
            ),
          }
          : prev
      );

      cancelEditRelationship();
      setRelationshipMessage("Relationship updated successfully.");
    } catch (error) {
      setRelationshipMessage(
        error instanceof Error ? error.message : "Failed to update relationship."
      );
    } finally {
      setIsLinkingRelationship(false);
    }
  }

  async function deleteRelationship(relationshipId: string) {
    const confirmed = window.confirm("Delete this company relationship?");
    if (!confirmed) return;

    try {
      setRelationshipMessage("");

      const res = await fetch(`/api/company-relationships/${relationshipId}`, {
        method: "DELETE",
      });

      const json = await safeJson(res);
      if (!res.ok) throw new Error(json?.error || "Failed to delete relationship");

      setDetailData((prev) =>
        prev
          ? {
            ...prev,
            relationships_outgoing: prev.relationships_outgoing.filter(
              (row) => row.company_relationship_id !== relationshipId
            ),
            relationships_incoming: prev.relationships_incoming.filter(
              (row) => row.company_relationship_id !== relationshipId
            ),
          }
          : prev
      );

      if (editingRelationshipId === relationshipId) cancelEditRelationship();
      setRelationshipMessage("Relationship deleted successfully.");
    } catch (error) {
      setRelationshipMessage(
        error instanceof Error ? error.message : "Failed to delete relationship."
      );
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-8">
        <p className="text-sm text-gray-600">Loading company...</p>
      </div>
    );
  }

  if (error && !form.company_id) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-8">
        <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
        <div className="mt-4">
          <Link href="/companies" className="text-sm font-medium text-[#8dc63f] hover:underline">
            Back to companies
          </Link>
        </div>
      </div>
    );
  }

  const projectLinks = detailData?.project_links || [];
  const plantLinks = detailData?.plant_links || [];
  const outgoingRelationships = detailData?.relationships_outgoing || [];
  const incomingRelationships = detailData?.relationships_incoming || [];

  const metadataCompany = detailData?.company || {};
  const reviewStatus = metadataCompany.review_status || "NA";
  const isPendingReview =
    String(reviewStatus).trim().toLowerCase() === "pending review" ||
    String(reviewStatus).trim().toLowerCase() === "pending_review";
  const researchStatus = metadataCompany.research_status || "NA";
  const createdByName = metadataCompany.created_by_name || "NA";
  const lastUpdatedByName = metadataCompany.last_updated_by_name || "NA";
  const approvedByName = metadataCompany.approved_by_name || "NA";
  const dateCreatedDisplay = formatDisplayDate(metadataCompany.date_created || form.date_created);
  const dateEditedDisplay = formatDisplayDate(metadataCompany.date_edited || form.date_edited);
  const approvedAtDisplay = formatDisplayDate(metadataCompany.approved_at);

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="mb-5 flex flex-col gap-4 md:mb-6 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[#1f2937] md:text-2xl">
              Edit Company
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Update company profile details and manage links to projects, plants, and related companies.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
            {isPendingReview ? (
              <button
                type="button"
                onClick={handleApprove}
                disabled={approving}
                className="border border-[#8dc63f] bg-white px-4 py-2 text-sm font-semibold text-[#6ea62d] transition hover:bg-[#f6fbef] disabled:opacity-50"
              >
                {approving ? "Approving..." : "Approve"}
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => {
                if (!hasUnsavedChanges || confirm("You have unsaved changes. Leave anyway?")) {
                  router.push(`/companies/${companyId}`);
                }
              }}
              className="inline-flex items-center justify-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <ActionButton type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </ActionButton>
          </div>
        </div>

        {justCreated ? (
          <div className="border-l-4 border-l-[#8dc63f] bg-[#f6fbef] px-4 py-3 md:px-5">
            <p className="text-sm leading-relaxed text-[#1f2937]">
              <span className="font-semibold">Company created successfully.</span>{" "}
              You can now add linked projects, linked plants, and company relationships below.
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="border border-gray-200 bg-white">
          <div className="px-4 py-4 md:px-5 md:py-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <ReviewStatusBadge value={reviewStatus} />
              <ResearchStatusBadge value={researchStatus} />
            </div>

            {isPendingReview ? (
              <div className="mb-4 border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                Pending review — this record was recently updated and requires validation before approval.
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              <MetadataCard label="Created By" value={createdByName} />
              <MetadataCard label="Last Updated By" value={lastUpdatedByName} />
              <MetadataCard label="Approved By" value={approvedByName} />
              <MetadataCard label="Date Created" value={dateCreatedDisplay} />
              <MetadataCard label="Date Edited" value={dateEditedDisplay} />
              <MetadataCard label="Approved On" value={approvedAtDisplay} />
            </div>
          </div>
        </section>

        <Section title="Core Identification">
          <p className="mb-4 text-sm text-gray-600">
            Enter the legal company identity and standard naming fields used across the database.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Company ID" name="company_id" value={form.company_id} disabled />
            <Input
              label="Company Name"
              name="company_name"
              value={form.company_name}
              onChange={handleChange}
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
            <Input label="Website URL" name="website_url" value={form.website_url} onChange={handleChange} />
            <Input label="LinkedIn URL" name="linkedin_url" value={form.linkedin_url} onChange={handleChange} />
          </div>
        </Section>

        <Section title="Entity & Classification">
          <p className="mb-4 text-sm text-gray-600">
            Use this section to describe what the company broadly is. Do not use it for project- or plant-specific participation such as owner, operator, EPC, drilling, investor, or supplier roles — those belong in the linked projects and plants sections below.
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            {/* ENTITY TYPE */}
            <FormSelect
              label="Entity Type"
              name="entity_type"
              value={form.entity_type}
              onChange={handleChange}
              options={withCurrentValue(ENTITY_TYPE_OPTIONS, form.entity_type)}
            />

            {/* PRIMARY TYPE — FIXED */}
            <FormSelect
              label="Primary Type"
              name="company_type_primary"
              value={form.company_type_primary}
              onChange={handleChange}
              options={withCurrentValue(
                COMPANY_TYPE_PRIMARY_OPTIONS,
                form.company_type_primary
              )}
              helpText="Use one broad company identity only. Asset-specific roles belong in linked projects and plants."
              error={fieldErrors.company_type_primary}
            />

            {/* SECONDARY TYPES — FIXED */}
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
                  setHasUnsavedChanges(true);
                }}
                className={`min-h-[180px] w-full rounded-none border px-3 py-2 text-sm outline-none md:min-h-[220px] ${
                  fieldErrors.company_type_secondary
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

              {/* INLINE ERROR */}
              {fieldErrors.company_type_secondary && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.company_type_secondary}
                </p>
              )}

              <p className="mt-1 text-xs text-gray-500">
                Hold Ctrl/Cmd to select multiple. Maximum 3 selections. Use for capabilities, not asset-level roles.
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

            {/* OWNERSHIP TYPE */}
            <FormSelect
              label="Ownership Type"
              name="ownership_type"
              value={form.ownership_type}
              onChange={handleChange}
              options={withCurrentValue(
                OWNERSHIP_TYPE_OPTIONS,
                form.ownership_type
              )}
            />

            {/* IS SPV */}
            <FormSelect
              label="Is SPV"
              name="is_spv"
              value={form.is_spv}
              onChange={handleChange}
              options={YES_NO_OPTIONS}
            />

            {/* COMPANY STATUS */}
            <Input
              label="Company Status"
              name="company_status"
              value={form.company_status}
              onChange={handleChange}
            />

            {/* RESEARCH STATUS */}
            <FormSelect
              label="Research Status"
              name="research_status"
              value={form.research_status}
              onChange={handleChange}
              options={withCurrentValue(
                RESEARCH_STATUS_OPTIONS,
                form.research_status
              )}
            />

            {/* IS ACTIVE */}
            <FormSelect
              label="Is Active Company"
              name="is_active_company"
              value={form.is_active_company}
              onChange={handleChange}
              options={YES_NO_OPTIONS}
            />

            {/* GROUP PARENT */}
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
            Use this section only for company-to-company hierarchy and reporting structure. Do not use it for project or plant participation roles.
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
                {companyOptions
                  .filter((option) => option.company_id !== companyId)
                  .map((option) => (
                    <option key={option.company_id} value={option.company_id}>
                      {option.company_name || option.company_id}
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
                {companyOptions
                  .filter((option) => option.company_id !== companyId)
                  .map((option) => (
                    <option key={option.company_id} value={option.company_id}>
                      {option.company_name || option.company_id}
                      {option.headquarters_country ? ` (${option.headquarters_country})` : ""}
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
            Capture the company’s focus areas, capabilities, and market footprint in concise narrative form.
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
            />
            <Input label="Date Edited" name="date_edited" value={form.date_edited} disabled />
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

        <Section title="Linked Projects">
          <p className="mb-4 text-sm text-gray-600">
            Link this company to projects using structured asset-level roles. Use Operator for integrated operation. Use Operator Power and Operator Steam only where operation is split. Do not add generic Operator if split operator roles are already used. Use Ownership % mainly for Owner, and where relevant Investor.
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
            <div className="xl:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Project *</label>
              <select
                className="w-full rounded-none border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#8dc63f]"
                value={linkProjectForm.project_id}
                onChange={(e) => {
                  setLinkProjectForm((prev) => ({
                    ...prev,
                    project_id: e.target.value,
                  }));
                  markUnsavedChanges();
                }}
              >
                <option value="">Select project...</option>
                {availableProjectOptions.map((project) => (
                  <option key={project.project_id} value={project.project_id}>
                    {project.project_name || project.project_id}
                    {project.country ? ` (${project.country})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Role *</label>
              <select
                className="w-full rounded-none border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#8dc63f]"
                value={linkProjectForm.role}
                onChange={(e) => {
                  setLinkProjectForm((prev) => ({
                    ...prev,
                    role: e.target.value,
                  }));
                  markUnsavedChanges();
                }}
              >
                {ASSET_COMPANY_ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Role Detail"
              name="project_link_role_detail"
              value={linkProjectForm.role_detail}
              onChange={(e) => {
                setLinkProjectForm((prev) => ({
                  ...prev,
                  role_detail: e.target.value,
                }));
                markUnsavedChanges();
              }}
              helpTitle="Role Detail"
              helpContent="Use for more specific scope only, e.g. power plant O&M, steamfield management, turbine supply, drilling campaign, reservoir work, or development finance."
            />

            <Input
              label="Ownership Share (%)"
              name="project_link_ownership_share"
              value={linkProjectForm.ownership_share}
              onChange={(e) => {
                setLinkProjectForm((prev) => ({
                  ...prev,
                  ownership_share: e.target.value,
                }));
                markUnsavedChanges();
              }}
              helpTitle="Ownership / Economic Share (%)"
              helpContent="Use mainly for Owner, and where relevant Investor. Leave blank for Operator, Operator Power, Operator Steam, EPC, drilling, supplier, consultant, and other service roles."
            />

            <Input
              label="Notes"
              name="project_link_notes"
              value={linkProjectForm.notes}
              onChange={(e) => {
                setLinkProjectForm((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }));
                markUnsavedChanges();
              }}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={linkProjectForm.is_primary}
                onChange={(e) => {
                  setLinkProjectForm((prev) => ({
                    ...prev,
                    is_primary: e.target.checked,
                  }));
                  markUnsavedChanges();
                }}
              />
              Set as primary linked company
            </label>

            <button
              type="button"
              onClick={editingProjectLinkId ? updateProjectLink : addProjectLink}
              disabled={isLinkingProject}
              className="bg-[#8dc63f] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {isLinkingProject
                ? editingProjectLinkId
                  ? "Saving..."
                  : "Adding..."
                : editingProjectLinkId
                ? "Save Project Link"
                : "Add Project Link"}
            </button>

            {editingProjectLinkId ? (
              <button
                type="button"
                onClick={cancelEditProjectLink}
                className="border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel Edit
              </button>
            ) : null}

            {linkProjectMessage ? (
              <div
                className={`rounded px-3 py-2 text-sm font-medium ${
                  linkProjectMessage.toLowerCase().includes("success")
                    ? "border border-green-200 bg-green-50 text-green-700"
                    : "border border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {linkProjectMessage}
              </div>
            ) : null}
          </div>

          <div className="mt-6 overflow-x-auto border border-gray-200">
            <table className="min-w-full table-fixed text-left text-[12px]">
              <colgroup>
                <col className="w-[12%]" />
                <col className="w-[22%]" />
                <col className="w-[14%]" />
                <col className="w-[16%]" />
                <col className="w-[10%]" />
                <col className="w-[8%]" />
                <col className="w-[18%]" />
              </colgroup>
              <thead className="bg-[#f7f7f7]">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-2.5 font-semibold text-gray-700">Project ID</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-700">Project Name</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-700">Role</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-700">Role Detail</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-700">Ownership %</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-700">Primary</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {projectLinks.map((row) => (
                  <tr key={row.company_project_link_id} className="border-b border-gray-200">
                    <td className="px-4 py-2.5 font-mono text-[11px] text-gray-500">
                      {row.project_id}
                    </td>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/projects/${row.project_id}`}
                        className="font-medium text-[#1f2937] hover:text-[#8dc63f] hover:underline"
                      >
                        {row.project_name || row.project_id}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{row.role || "NA"}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.role_detail || "NA"}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.ownership_share ?? "NA"}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.is_primary ? "Yes" : "NA"}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEditProjectLink(row)}
                          className="border border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProjectLink(row.company_project_link_id)}
                          className="border border-red-300 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {projectLinks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                      No project links yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Linked Plants">
          <p className="mb-4 text-sm text-gray-600">
            Link this company to plants using structured asset-level roles. Use Operator for integrated operation. Use Operator Power and Operator Steam only where operation is split. Do not add generic Operator if split operator roles are already used. Use Ownership % mainly for Owner, and where relevant Investor.
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
            <div className="xl:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Plant *</label>
              <select
                className="w-full rounded-none border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#8dc63f]"
                value={linkPlantForm.plant_id}
                onChange={(e) => {
                  setLinkPlantForm((prev) => ({
                    ...prev,
                    plant_id: e.target.value,
                  }));
                  markUnsavedChanges();
                }}
              >
                <option value="">Select plant...</option>
                {availablePlantOptions.map((plant) => (
                  <option key={plant.plant_id} value={plant.plant_id}>
                    {plant.plant_name || plant.plant_id}
                    {plant.country ? ` (${plant.country})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Role *</label>
              <select
                className="w-full rounded-none border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#8dc63f]"
                value={linkPlantForm.role}
                onChange={(e) => {
                  setLinkPlantForm((prev) => ({
                    ...prev,
                    role: e.target.value,
                  }));
                  markUnsavedChanges();
                }}
              >
                {ASSET_COMPANY_ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Role Detail"
              name="plant_link_role_detail"
              value={linkPlantForm.role_detail}
              onChange={(e) => {
                setLinkPlantForm((prev) => ({
                  ...prev,
                  role_detail: e.target.value,
                }));
                markUnsavedChanges();
              }}
              helpTitle="Role Detail"
              helpContent="Use for the specific scope, e.g. O&M, turbine supply, drilling campaign, reservoir work, or development finance."
            />

            <Input
              label="Ownership Share (%)"
              name="plant_link_ownership_share"
              value={linkPlantForm.ownership_share}
              onChange={(e) => {
                setLinkPlantForm((prev) => ({
                  ...prev,
                  ownership_share: e.target.value,
                }));
                markUnsavedChanges();
              }}
              helpTitle="Ownership / Economic Share (%)"
              helpContent="Use mainly for Owner, and where relevant Investor. Leave blank for Operator, Operator Power, Operator Steam, EPC, drilling, supplier, consultant, O&M Contractor, and other service roles."
            />

            <Input
              label="Notes"
              name="plant_link_notes"
              value={linkPlantForm.notes}
              onChange={(e) => {
                setLinkPlantForm((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }));
                markUnsavedChanges();
              }}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={linkPlantForm.is_primary}
                onChange={(e) => {
                  setLinkPlantForm((prev) => ({
                    ...prev,
                    is_primary: e.target.checked,
                  }));
                  markUnsavedChanges();
                }}
              />
              Set as primary linked company
            </label>

            <button
              type="button"
              onClick={editingPlantLinkId ? updatePlantLink : addPlantLink}
              disabled={isLinkingPlant}
              className="bg-[#8dc63f] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {isLinkingPlant
                ? editingPlantLinkId
                  ? "Saving..."
                  : "Adding..."
                : editingPlantLinkId
                ? "Save Plant Link"
                : "Add Plant Link"}
            </button>

            {editingPlantLinkId ? (
              <button
                type="button"
                onClick={cancelEditPlantLink}
                className="border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel Edit
              </button>
            ) : null}

            {linkPlantMessage ? (
              <div
                className={`rounded px-3 py-2 text-sm font-medium ${
                  linkPlantMessage.toLowerCase().includes("success")
                    ? "border border-green-200 bg-green-50 text-green-700"
                    : "border border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {linkPlantMessage}
              </div>
            ) : null}
          </div>

          <div className="mt-6 overflow-x-auto border border-gray-200">
            <table className="min-w-full table-fixed text-left text-[12px]">
              <colgroup>
                <col className="w-[12%]" />
                <col className="w-[22%]" />
                <col className="w-[14%]" />
                <col className="w-[16%]" />
                <col className="w-[10%]" />
                <col className="w-[8%]" />
                <col className="w-[18%]" />
              </colgroup>
              <thead className="bg-[#f7f7f7]">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-2.5 font-semibold text-gray-700">Plant ID</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-700">Plant Name</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-700">Role</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-700">Role Detail</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-700">Ownership %</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-700">Primary</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {plantLinks.map((row) => (
                  <tr key={row.company_plant_link_id} className="border-b border-gray-200">
                    <td className="px-4 py-2.5 font-mono text-[11px] text-gray-500">
                      {row.plant_id}
                    </td>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/plants/${row.plant_id}`}
                        className="font-medium text-[#1f2937] hover:text-[#8dc63f] hover:underline"
                      >
                        {row.plant_name || row.plant_id}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{row.role || "NA"}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.role_detail || "NA"}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.ownership_share ?? "NA"}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.is_primary ? "Yes" : "NA"}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEditPlantLink(row)}
                          className="border border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePlantLink(row.company_plant_link_id)}
                          className="border border-red-300 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {plantLinks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                      No plant links yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Company Relationships">
          <p className="mb-4 text-sm text-gray-600">
            Record company-to-company relationships here, such as parent, subsidiary, affiliate,
            investor, or shareholder relationships. Do not use this section for project or plant
            participation roles.
          </p>

          <div className="mb-4 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <div className="font-semibold">How to use relationship direction</div>
            <div className="mt-1 space-y-1 text-xs md:text-sm">
              <div>
                <strong>Parent of</strong> = this company is the parent / group company of the selected company.
              </div>
              <div>
                <strong>Owned by</strong> = this company is owned by the selected company.
              </div>
              <div>
                <strong>Owns</strong> = this company owns the selected company.
              </div>
              <div>
                Ownership % is usually required for <strong>Owns</strong>, <strong>Owned by</strong>,
                <strong> Investor in</strong>, and shareholder-style relationships.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Related Company
              </label>
              <select
                className="w-full rounded-none border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#8dc63f]"
                value={relationshipForm.company_id_to}
                onChange={(e) => {
                  setRelationshipForm((prev) => ({
                    ...prev,
                    company_id_to: e.target.value,
                  }));
                  markUnsavedChanges();
                }}
              >
                <option value="">Select company...</option>
                {companyOptions
                  .filter((option) => option.company_id !== companyId)
                  .map((option) => (
                    <option key={option.company_id} value={option.company_id}>
                      {option.company_name || option.company_id}
                      {option.headquarters_country ? ` (${option.headquarters_country})` : ""}
                    </option>
                  ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                The current company is intentionally excluded to prevent self-links.
              </p>
            </div>

            <FormSelect
              label="Relationship Type (from this company)"
              name="relationship_type"
              value={relationshipForm.relationship_type}
              onChange={(e) => {
                setRelationshipForm((prev) => ({
                  ...prev,
                  relationship_type: e.target.value,
                }));
                markUnsavedChanges();
              }}
              options={RELATIONSHIP_TYPE_OPTIONS}
              helpText="Define the relationship from the perspective of the company currently being edited."
            />

            <Input
              label="Ownership %"
              name="ownership_percentage"
              value={relationshipForm.ownership_percentage}
              onChange={(e) => {
                setRelationshipForm((prev) => ({
                  ...prev,
                  ownership_percentage: e.target.value,
                }));
                markUnsavedChanges();
              }}
              helpTitle="Ownership Percentage"
              helpContent="Use when there is a direct ownership or equity stake. Usually required for Owns, Owned by, Investor in, and shareholder relationships. Leave blank for Parent of, Subsidiary of, Affiliate of, or Project partner of."
            />

            <div className="md:col-span-2">
              <Input
                label="Notes"
                name="relationship_notes"
                value={relationshipForm.notes}
                onChange={(e) => {
                  setRelationshipForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }));
                  markUnsavedChanges();
                }}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={relationshipForm.is_current}
                onChange={(e) => {
                  setRelationshipForm((prev) => ({
                    ...prev,
                    is_current: e.target.checked,
                  }));
                  markUnsavedChanges();
                }}
              />
              Current relationship
            </label>

            <button
              type="button"
              onClick={editingRelationshipId ? updateRelationship : addCompanyRelationship}
              disabled={isLinkingRelationship}
              className="bg-[#8dc63f] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {isLinkingRelationship
                ? editingRelationshipId
                  ? "Saving..."
                  : "Adding..."
                : editingRelationshipId
                ? "Save Relationship"
                : "Add Relationship"}
            </button>

            {editingRelationshipId ? (
              <button
                type="button"
                onClick={cancelEditRelationship}
                className="border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel Edit
              </button>
            ) : null}

            {relationshipMessage ? (
              <div
                className={`rounded px-3 py-2 text-sm font-medium ${
                  relationshipMessage.toLowerCase().includes("success")
                    ? "border border-green-200 bg-green-50 text-green-700"
                    : "border border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {relationshipMessage}
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <div className="overflow-x-auto border border-gray-200">
              <div className="border-b border-gray-200 bg-[#f7f7f7] px-4 py-2.5 text-sm font-semibold text-gray-700">
                Outgoing Relationships
              </div>
              <table className="min-w-full table-fixed text-left text-[12px]">
                <colgroup>
                  <col className="w-[24%]" />
                  <col className="w-[28%]" />
                  <col className="w-[16%]" />
                  <col className="w-[14%]" />
                  <col className="w-[18%]" />
                </colgroup>
                <thead className="bg-[#f7f7f7]">
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2.5 font-semibold text-gray-700">Relationship</th>
                    <th className="px-4 py-2.5 font-semibold text-gray-700">Related Company</th>
                    <th className="px-4 py-2.5 font-semibold text-gray-700">Ownership</th>
                    <th className="px-4 py-2.5 font-semibold text-gray-700">Current</th>
                    <th className="px-4 py-2.5 font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {outgoingRelationships.map((row) => (
                    <tr key={row.company_relationship_id} className="border-b border-gray-200">
                      <td className="px-4 py-2.5 text-gray-600">
                        {row.relationship_type || "NA"}
                      </td>
                      <td className="px-4 py-2.5">
                        {row.related_company_id ? (
                          <Link
                            href={`/companies/${row.related_company_id}`}
                            className="font-medium text-[#1f2937] hover:text-[#8dc63f] hover:underline"
                          >
                            {row.related_company_name || row.related_company_id}
                          </Link>
                        ) : (
                          <span className="text-gray-600">
                            {row.related_company_name || "NA"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">
                        {row.ownership_percentage ?? "NA"}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">
                        {row.is_current ? "Yes" : "No"}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEditRelationship(row)}
                            className="border border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteRelationship(row.company_relationship_id)}
                            className="border border-red-300 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {outgoingRelationships.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                        No outgoing relationships yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="overflow-x-auto border border-gray-200">
              <div className="border-b border-gray-200 bg-[#f7f7f7] px-4 py-2.5 text-sm font-semibold text-gray-700">
                Incoming Relationships
              </div>
              <table className="min-w-full table-fixed text-left text-[12px]">
                <colgroup>
                  <col className="w-[24%]" />
                  <col className="w-[28%]" />
                  <col className="w-[16%]" />
                  <col className="w-[14%]" />
                  <col className="w-[18%]" />
                </colgroup>
                <thead className="bg-[#f7f7f7]">
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2.5 font-semibold text-gray-700">Relationship</th>
                    <th className="px-4 py-2.5 font-semibold text-gray-700">Related Company</th>
                    <th className="px-4 py-2.5 font-semibold text-gray-700">Ownership</th>
                    <th className="px-4 py-2.5 font-semibold text-gray-700">Current</th>
                    <th className="px-4 py-2.5 font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {incomingRelationships.map((row) => (
                    <tr key={row.company_relationship_id} className="border-b border-gray-200">
                      <td className="px-4 py-2.5 text-gray-600">
                        {row.relationship_type || "NA"}
                      </td>
                      <td className="px-4 py-2.5">
                        {row.related_company_id ? (
                          <Link
                            href={`/companies/${row.related_company_id}`}
                            className="font-medium text-[#1f2937] hover:text-[#8dc63f] hover:underline"
                          >
                            {row.related_company_name || row.related_company_id}
                          </Link>
                        ) : (
                          <span className="text-gray-600">
                            {row.related_company_name || "NA"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">
                        {row.ownership_percentage ?? "NA"}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">
                        {row.is_current ? "Yes" : "No"}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500">
                        Manage from source company
                      </td>
                    </tr>
                  ))}

                  {incomingRelationships.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                        No incoming relationships yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <ActionButton
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={saving}
          >
            Delete Company
          </ActionButton>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:gap-3">
            {isPendingReview ? (
              <button
                type="button"
                onClick={handleApprove}
                disabled={approving}
                className="border border-[#8dc63f] bg-white px-4 py-2 text-sm font-semibold text-[#6ea62d] transition hover:bg-[#f6fbef] disabled:opacity-50"
              >
                {approving ? "Approving..." : "Approve"}
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => {
                if (!hasUnsavedChanges || confirm("You have unsaved changes. Leave anyway?")) {
                  router.push(`/companies/${companyId}`);
                }
              }}
              className="inline-flex items-center justify-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <ActionButton type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </ActionButton>
          </div>
        </div>
      </form>
    </div>
  );
}