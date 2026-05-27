"use client";

import FormSelect from "@/components/forms/FormSelect";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  PROJECT_PHASE_OPTIONS,
  REGION_OPTIONS,
  RESOURCE_TYPE_OPTIONS,
  RESEARCH_STATUS_OPTIONS,
  WB_REGION_OPTIONS,
  PLANT_TECHNOLOGY_OPTIONS,
  withCurrentValue,
} from "@/lib/options/shared";
import { ASSET_COMPANY_ROLE_OPTIONS } from "@/lib/options/companyAssetRoles";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ActionButton from "@/components/ui/ActionButton";
import { validateProjectForm } from "@/lib/validation/project";
import { validateAssetLinkForm } from "@/lib/validation/assetLinks";

type ProjectFormData = {
  project_id: string;
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
  review_status: string;
  created_by_user_id: string;
  last_updated_by_user_id: string;
  approved_by_user_id: string;
  approved_at: string;
  date_created: string;
  date_edited: string;
  created_by_name: string;
  last_updated_by_name: string;
  approved_by_name: string;
  created_at?: string;
  updated_at?: string;
  promoted_at: string;
  is_promoted_to_plant: number;
  promoted_plant_id: string;
};

type CompanyOption = {
  company_id: string;
  company_name: string | null;
  headquarters_country: string | null;
};

type ProjectCompanyLinkForm = {
  company_id: string;
  role: string;
  role_detail: string;
  ownership_share: string;
  is_primary: boolean;
  notes: string;
};

type ExistingProjectCompanyLink = {
  company_project_link_id: string;
  company_id: string;
  company_name: string | null;
  role: string | null;
  role_detail: string | null;
  ownership_share: number | null;
  is_primary: number | boolean | null;
  notes: string | null;
};

const emptyForm: ProjectFormData = {
  project_id: "",
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
  research_status: "",
  review_status: "",
  created_by_user_id: "",
  last_updated_by_user_id: "",
  approved_by_user_id: "",
  approved_at: "",
  date_created: "",
  date_edited: "",
  created_by_name: "",
  last_updated_by_name: "",
  approved_by_name: "",
  created_at: "",
  updated_at: "",
  promoted_at: "",
  is_promoted_to_plant: 0,
  promoted_plant_id: "",
};

const emptyProjectCompanyLinkForm: ProjectCompanyLinkForm = {
  company_id: "",
  role: "",
  role_detail: "",
  ownership_share: "",
  is_primary: false,
  notes: "",
};

function toInputValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function ReviewStatusBadge({ value }: { value: string }) {
  const normalized = (value || "").trim().toLowerCase();

  if (!normalized) {
    return <StatusBadge tone="neutralSoft">NA</StatusBadge>;
  }

  if (normalized === "approved") {
    return <StatusBadge tone="successSoft">Approved</StatusBadge>;
  }

  if (normalized === "pending_review") {
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

function displayUser(name: string, userId: string) {
  if (name?.trim()) return name;
  if (userId?.trim()) return userId;
  return "NA";
}

function formatDisplayDate(value: string) {
  if (!value?.trim()) return "NA";
  return value.slice(0, 10);
}

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

export default function EditProjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params.id;

  const [form, setForm] = useState<ProjectFormData>(emptyForm);
  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
  const [projectCompanyLinkForm, setProjectCompanyLinkForm] =
    useState<ProjectCompanyLinkForm>(emptyProjectCompanyLinkForm);
  const [isLinkingCompany, setIsLinkingCompany] = useState(false);
  const [linkCompanyMessage, setLinkCompanyMessage] = useState("");
  const [existingCompanyLinks, setExistingCompanyLinks] = useState<
    ExistingProjectCompanyLink[]
  >([]);
  const [deletingCompanyLinkId, setDeletingCompanyLinkId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    async function loadProject() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/projects/${projectId}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to load project");
        }

        const data = await safeJson(res);

        setExistingCompanyLinks(Array.isArray(data.company_links) ? data.company_links : []);
        setForm({
          project_id: toInputValue(data.project_id),
          project_name: toInputValue(data.project_name),
          project_group: toInputValue(data.project_group),
          other_name: toInputValue(data.other_name),
          owner_operator: toInputValue(data.owner_operator),
          developer: toInputValue(data.developer),
          location_text: toInputValue(data.location_text),
          country: toInputValue(data.country),
          region: toInputValue(data.region),
          wb_region: toInputValue(data.wb_region),
          potential_min_mw: toInputValue(data.potential_min_mw),
          potential_max_mw: toInputValue(data.potential_max_mw),
          installed_capacity_mw: toInputValue(data.installed_capacity_mw),
          capacity_running_mw: toInputValue(data.capacity_running_mw),
          gross_production_gwh: toInputValue(data.gross_production_gwh),
          start_dev_year: toInputValue(data.start_dev_year),
          cod: toInputValue(data.cod),
          resource_type: toInputValue(data.resource_type),
          resource_temp_c: toInputValue(data.resource_temp_c),
          project_phase: toInputValue(data.project_phase),
          phase_historical: toInputValue(data.phase_historical),
          field_name: toInputValue(data.field_name),
          wells_total: toInputValue(data.wells_total),
          wells_prod_active: toInputValue(data.wells_prod_active),
          wells_reinj_active: toInputValue(data.wells_reinj_active),
          wells_inactive_standby: toInputValue(data.wells_inactive_standby),
          wells_other_exploration: toInputValue(data.wells_other_exploration),
          well_depth_prod_m: toInputValue(data.well_depth_prod_m),
          temp_prod_well_c: toInputValue(data.temp_prod_well_c),
          flow_rate_ls: toInputValue(data.flow_rate_ls),
          number_of_unit: toInputValue(data.number_of_unit),
          plant_technology: toInputValue(data.plant_technology),
          turbine_supplier: toInputValue(data.turbine_supplier),
          epc_suppliers: toInputValue(data.epc_suppliers),
          investor: toInputValue(data.investor),
          ppa_usd_kwh: toInputValue(data.ppa_usd_kwh),
          total_investment_cost: toInputValue(data.total_investment_cost),
          notes: toInputValue(data.notes),
          location_x: toInputValue(data.location_x),
          location_y: toInputValue(data.location_y),
          website_information: toInputValue(data.website_information),
          edited_description: toInputValue(data.edited_description),
          research_status: toInputValue(data.research_status),
          review_status: toInputValue(data.review_status),
          created_by_user_id: toInputValue(data.created_by_user_id),
          last_updated_by_user_id: toInputValue(data.last_updated_by_user_id),
          approved_by_user_id: toInputValue(data.approved_by_user_id),
          approved_at: toInputValue(data.approved_at),
          date_created: toInputValue(data.date_created),
          date_edited: toInputValue(data.date_edited),
          created_by_name: toInputValue(data.created_by_name),
          last_updated_by_name: toInputValue(data.last_updated_by_name),
          approved_by_name: toInputValue(data.approved_by_name),
          created_at: toInputValue(data.created_at),
          updated_at: toInputValue(data.updated_at),
          promoted_at: toInputValue(data.promoted_at),
          is_promoted_to_plant: Number(data.is_promoted_to_plant ?? 0),
          promoted_plant_id: toInputValue(data.promoted_plant_id),
        });
        setHasUnsavedChanges(false);
      } catch (err) {
        console.error(err);
        setError("Could not load project.");
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [projectId]);

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
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setHasUnsavedChanges(true);
  }

  function markUnsavedChanges() {
    setHasUnsavedChanges(true);
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

      const payload = {
        project_name: form.project_name,
        project_group: form.project_group,
        other_name: form.other_name,
        owner_operator: form.owner_operator,
        developer: form.developer,
        location_text: form.location_text,
        country: form.country,
        region: form.region,
        wb_region: form.wb_region,
        potential_min_mw: form.potential_min_mw,
        potential_max_mw: form.potential_max_mw,
        installed_capacity_mw: form.installed_capacity_mw,
        capacity_running_mw: form.capacity_running_mw,
        gross_production_gwh: form.gross_production_gwh,
        start_dev_year: form.start_dev_year,
        cod: form.cod,
        resource_type: form.resource_type,
        resource_temp_c: form.resource_temp_c,
        project_phase: form.project_phase,
        phase_historical: form.phase_historical,
        field_name: form.field_name,
        wells_total: form.wells_total,
        wells_prod_active: form.wells_prod_active,
        wells_reinj_active: form.wells_reinj_active,
        wells_inactive_standby: form.wells_inactive_standby,
        wells_other_exploration: form.wells_other_exploration,
        well_depth_prod_m: form.well_depth_prod_m,
        temp_prod_well_c: form.temp_prod_well_c,
        flow_rate_ls: form.flow_rate_ls,
        number_of_unit: form.number_of_unit,
        plant_technology: form.plant_technology,
        turbine_supplier: form.turbine_supplier,
        epc_suppliers: form.epc_suppliers,
        investor: form.investor,
        ppa_usd_kwh: form.ppa_usd_kwh,
        total_investment_cost: form.total_investment_cost,
        notes: form.notes,
        location_x: form.location_x,
        location_y: form.location_y,
        website_information: form.website_information,
        edited_description: form.edited_description,
        research_status: form.research_status,
      };

      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await safeJson(res);

      if (!res.ok) {
        throw new Error(result?.error || "Failed to update project");
      }

      setHasUnsavedChanges(false);
      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not save project.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete project "${form.project_name || form.project_id}"?`
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");

      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      let result = null;

      try {
        const text = await res.text();
        result = text ? JSON.parse(text) : null;
      } catch {
        result = null;
      }

      if (!res.ok) {
        throw new Error(result?.error || "Failed to delete project");
      }

      router.push("/projects");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not delete project.");
    } finally {
      setSaving(false);
    }
  }

  async function addProjectCompanyLink() {
    try {
      setIsLinkingCompany(true);
      setLinkCompanyMessage("");

    if (!projectId) {
      setLinkCompanyMessage("Project ID is missing.");
      setIsLinkingCompany(false);
      return;
    }

    const selectedRole = String(projectCompanyLinkForm.role || "").trim();

    if (!projectCompanyLinkForm.company_id) {
      setLinkCompanyMessage("Please select a company.");
      setIsLinkingCompany(false);
      return;
    }

    if (!selectedRole) {
      setLinkCompanyMessage("Please select a role for the project link.");
      setIsLinkingCompany(false);
      return;
    }

    const validationErrors = validateAssetLinkForm({
      assetLabel: "project",
      assetId: projectId,
      role: selectedRole,
      ownershipShare: projectCompanyLinkForm.ownership_share,
    });

    if (validationErrors.length > 0) {
      setLinkCompanyMessage(validationErrors[0]);
      setIsLinkingCompany(false);
      return;
    }

      const res = await fetch("/api/company-project-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: projectCompanyLinkForm.company_id,
          project_id: projectId,
          role: selectedRole,
          role_detail: projectCompanyLinkForm.role_detail.trim() || null,
          ownership_share:
            projectCompanyLinkForm.ownership_share.trim() === "" ||
            isNaN(Number(projectCompanyLinkForm.ownership_share))
              ? null
              : Number(projectCompanyLinkForm.ownership_share),
          is_primary: projectCompanyLinkForm.is_primary,
          notes: projectCompanyLinkForm.notes.trim() || null,
        }),
      });

      let json = null;

      try {
        const text = await res.text();
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }

      if (!res.ok) {
        throw new Error(json?.error || "Failed to create company link");
      }

      setExistingCompanyLinks((prev) => [
        ...prev,
        {
          company_project_link_id: json.link.company_project_link_id,
          company_id: json.link.company_id,
          company_name: json.link.company_name || null,
          role: json.link.role || null,
          role_detail: json.link.role_detail || null,
          ownership_share: json.link.ownership_share ?? null,
          is_primary: json.link.is_primary ?? 0,
          notes: json.link.notes || null,
        },
      ]);
      setProjectCompanyLinkForm(emptyProjectCompanyLinkForm);
      setLinkCompanyMessage("Company link added successfully.");
    } catch (err: any) {
      setLinkCompanyMessage(err?.message || "Failed to create company link.");
    } finally {
      setIsLinkingCompany(false);
    }
  }

  async function deleteProjectCompanyLink(linkId: string) {
    const confirmed = window.confirm("Delete this company link?");
    if (!confirmed) return;

    try {
      setDeletingCompanyLinkId(linkId);
      setLinkCompanyMessage("");

      const res = await fetch(`/api/company-project-links/${linkId}`, {
        method: "DELETE",
      });

      const json = await safeJson(res);

      if (!res.ok) {
        throw new Error(json?.error || "Failed to delete company link");
      }

      setExistingCompanyLinks((prev) =>
        prev.filter((row) => row.company_project_link_id !== linkId)
      );
      setLinkCompanyMessage("Company link deleted successfully.");
    } catch (err: any) {
      console.error(err);
      setLinkCompanyMessage(err?.message || "Failed to delete company link.");
    } finally {
      setDeletingCompanyLinkId(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-8">
        <p className="text-sm text-gray-600">Loading project…</p>
      </div>
    );
  }

  if (error && !form.project_id) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-8">
        <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
        <div className="mt-4">
          <Link
            href="/projects"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Back to projects
          </Link>
        </div>
      </div>
    );
  }

  const pendingReview = form.review_status === "pending_review";

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-8">
      <div className="mb-5 flex flex-col gap-4 md:mb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#1f2937] md:text-2xl">
            Edit Project
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Update project details safely. Project ID and promotion fields are locked.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <ActionButton href={`/projects/${projectId}`} variant="secondary">
            Cancel
          </ActionButton>
          <ActionButton
            type="button"
            variant="primary"
            onClick={() => handleSubmit()}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Changes"}
          </ActionButton>
        </div>
      </div>

      <div className="mb-6 border border-gray-200 bg-white p-4 shadow-sm md:mb-8 md:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <ReviewStatusBadge value={form.review_status} />
          <ResearchStatusBadge value={form.research_status} />
        </div>

        {pendingReview && (
          <div className="mb-4 border border-rose-300 bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-800">
            Pending review — this record was recently updated and requires validation before approval.
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <ReviewMetaItem
            label="Created by"
            value={displayUser(form.created_by_name, form.created_by_user_id)}
          />
          <ReviewMetaItem
            label="Last updated by"
            value={displayUser(form.last_updated_by_name, form.last_updated_by_user_id)}
          />
          <ReviewMetaItem
            label="Approved by"
            value={displayUser(form.approved_by_name, form.approved_by_user_id)}
          />
          <ReviewMetaItem
            label="Date created"
            value={formatDisplayDate(form.date_created)}
          />
          <ReviewMetaItem
            label="Date edited"
            value={formatDisplayDate(form.date_edited)}
          />
          <ReviewMetaItem
            label="Approved on"
            value={formatDisplayDate(form.approved_at)}
          />
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
            Keep core project naming here. Company roles such as owner, operator, developer,
            investor, or JV partner should be managed through structured company links rather
            than free text.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Project ID" name="project_id" value={form.project_id} disabled />
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
              options={withCurrentValue(REGION_OPTIONS, form.region)}
            />
            <FormSelect
              label="World Bank Region"
              name="wb_region"
              value={form.wb_region}
              onChange={handleChange}
              options={withCurrentValue(WB_REGION_OPTIONS, form.wb_region)}
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
              label="Planned Capacity MWe"
              name="installed_capacity_mw"
              value={form.installed_capacity_mw}
              onChange={handleChange}
            />
            <Input
              label="Planned Capacity Running MWe"
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
              options={withCurrentValue(RESOURCE_TYPE_OPTIONS, form.resource_type)}
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
              options={withCurrentValue(PROJECT_PHASE_OPTIONS, form.project_phase)}
              error={fieldErrors.project_phase}
            />
            <FormSelect
              label="Research Status"
              name="research_status"
              value={form.research_status}
              onChange={handleChange}
              options={withCurrentValue(RESEARCH_STATUS_OPTIONS, form.research_status)}
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
            Use this section for technical and commercial project information.
            Company participation should be managed through structured company links.
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
              options={withCurrentValue(PLANT_TECHNOLOGY_OPTIONS, form.plant_technology)}
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
              <span className="ml-3 text-xs font-normal text-gray-500">
                Roles & ownership participation
              </span>
            </>
          }
        >
          <div className="mb-6 rounded border border-gray-200 bg-gray-50 p-4 text-xs text-gray-600 md:mb-8">
            <ul className="space-y-1">
              <li>• Use for Owner, Operator, Operator Power, Operator Steam, Developer, Resource Owner, Investor, EPC, Drilling, Turbine Supplier, Supplier, Consultant, and O&amp;M Contractor</li>
              <li>• Use Operator for integrated operation</li>
              <li>• Use Operator Power / Operator Steam only when operation is split</li>
              <li>• Do NOT add generic Operator if split operator roles are already used</li>
              <li>• Do NOT use for company structure (parent / subsidiary / group)</li>
              <li>• Ownership % is only for economic participation, mainly Owner and sometimes Investor</li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-gray-800">Add Company</h3>

            <div className="mb-4 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <a
                href="/companies/new"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#8dc63f] underline"
              >
                + Add New Company
              </a>
              <span className="text-gray-500">
                Create company if missing, then return here to link it.
              </span>
            </div>

            <p className="mb-4 text-xs text-gray-500">
              Use Operator only for normal integrated operation. Use Operator Power and Operator Steam only where operation is split.
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Company *
                </label>
                <select
                  className="w-full border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={projectCompanyLinkForm.company_id}
                  onChange={(e) => {
                    setProjectCompanyLinkForm((prev) => ({
                      ...prev,
                      company_id: e.target.value,
                    }));
                    markUnsavedChanges();
                  }}
                >
                  <option value="">Select company...</option>
                  {companyOptions.map((company) => (
                    <option key={company.company_id} value={company.company_id}>
                      {company.company_name || company.company_id}
                      {company.headquarters_country
                        ? ` (${company.headquarters_country})`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Role *
                </label>
              <select
                className="w-full border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={projectCompanyLinkForm.role}
                onChange={(e) => {
                  setProjectCompanyLinkForm((prev) => ({
                    ...prev,
                    role: e.target.value,
                  }));
                  markUnsavedChanges();
                }}
              >
                <option value="">Select role...</option>
                {ASSET_COMPANY_ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Role Detail
                </label>
                <input
                  className="w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={projectCompanyLinkForm.role_detail}
                  onChange={(e) =>
                    setProjectCompanyLinkForm((prev) => ({
                      ...prev,
                      role_detail: e.target.value,
                    }))
                  }
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use for more specific scope only, e.g. exploration drilling, steamfield design, turbine supply, financing, or engineering.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4 rounded border border-gray-200 p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">
              Ownership / Additional Details
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Ownership / Economic Share (%)
                </label>
                <input
                  className="w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={projectCompanyLinkForm.ownership_share}
                  onChange={(e) =>
                    setProjectCompanyLinkForm((prev) => ({
                      ...prev,
                      ownership_share: e.target.value,
                    }))
                  }
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use mainly for Owner, and where relevant Investor. Leave blank for Operator, Operator Power, Operator Steam, EPC, drilling, supplier, consultant, and similar service roles.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <input
                  className="w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={projectCompanyLinkForm.notes}
                  onChange={(e) =>
                    setProjectCompanyLinkForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={projectCompanyLinkForm.is_primary}
                    onChange={(e) =>
                      setProjectCompanyLinkForm((prev) => ({
                        ...prev,
                        is_primary: e.target.checked,
                      }))
                    }
                  />
                  Set as primary linked company
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  Main company reference for this project (not limited to ownership).
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <ActionButton
              type="button"
              variant="primary"
              onClick={addProjectCompanyLink}
              disabled={isLinkingCompany}
            >
              {isLinkingCompany ? "Adding..." : "Add Company Link"}
            </ActionButton>
          </div>

          {linkCompanyMessage && (
            <div
              className={`mb-4 rounded px-3 py-2 text-sm font-medium ${
                linkCompanyMessage.toLowerCase().includes("success")
                  ? "border border-green-200 bg-green-50 text-green-700"
                  : "border border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {linkCompanyMessage}
            </div>
          )}

          <div className="mt-6 overflow-x-auto border border-gray-200">
            <table className="min-w-full table-fixed text-left text-[12px]">
              <thead className="bg-[#f7f7f7]">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-2.5 font-semibold text-gray-700">Company</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-700">Role</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-700">Role Detail</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-700">Ownership %</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-700">Primary</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>

              <tbody>
                {existingCompanyLinks.map((row) => (
                  <tr key={row.company_project_link_id} className="border-b border-gray-200">
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/companies/${row.company_id}`}
                        className="font-medium text-[#1f2937] hover:text-[#8dc63f] hover:underline"
                      >
                        {row.company_name || row.company_id}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{row.role || "NA"}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.role_detail || "NA"}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.ownership_share ?? "NA"}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.is_primary ? "Yes" : "NA"}</td>
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => deleteProjectCompanyLink(row.company_project_link_id)}
                        disabled={deletingCompanyLinkId === row.company_project_link_id}
                        className="border border-red-300 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingCompanyLinkId === row.company_project_link_id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}

                {existingCompanyLinks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                      No linked companies yet. Add participants above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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

        <FormSection title="Lifecycle / Promotion Status" tone="amber">
          <div className="space-y-4">
            <p className="text-sm text-amber-900">
              Relevant only if this project has been promoted to a plant.
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input
                label="Promoted to Plant"
                name="is_promoted_to_plant"
                value={String(form.is_promoted_to_plant)}
                disabled
              />
              <Input
                label="Promoted Plant ID"
                name="promoted_plant_id"
                value={form.promoted_plant_id}
                disabled
              />
              <Input
                label="Promoted At"
                name="promoted_at"
                value={form.promoted_at}
                disabled
              />
            </div>

            {form.is_promoted_to_plant === 1 && form.promoted_plant_id && (
              <p className="text-sm text-amber-900">
                Linked plant:{" "}
                <Link
                  href={`/plants/${form.promoted_plant_id}`}
                  className="font-medium underline"
                >
                  {form.promoted_plant_id}
                </Link>
              </p>
            )}
          </div>
        </FormSection>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <ActionButton
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={saving}
          >
            Delete Project
          </ActionButton>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:gap-3">
            <button
              type="button"
              onClick={() => {
                if (!hasUnsavedChanges || confirm("You have unsaved changes. Leave anyway?")) {
                  router.push(`/projects/${projectId}`);
                }
              }}
              className="inline-flex items-center justify-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <ActionButton type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </ActionButton>
          </div>
        </div>
      </form>
    </div>
  );
}

function ReviewMetaItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border border-gray-200 bg-[#fafafa] px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-[#1f2937]">{value || "NA"}</div>
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
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700">
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
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700">
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
