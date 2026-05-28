"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import ActionButton from "@/components/ui/ActionButton";
import RelatedNewsCard from "@/components/detail/RelatedNewsCard";
import PrintButton from "@/components/PrintButton";

type Company = {
  company_id: string;
  company_name: string | null;
  company_name_short: string | null;
  company_legal_name: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  entity_type: string | null;
  company_type_primary: string | null;
  secondary_types: string | string[] | null;
  ownership_type: string | null;
  company_status: string | null;
  company_group_name: string | null;
  parent_company_id: string | null;
  parent_company_name: string | null;
  ultimate_parent_company_id: string | null;
  ultimate_parent_company_name: string | null;
  consolidation_method: string | null;
  headquarters_city: string | null;
  headquarters_country: string | null;
  region: string | null;
  wb_region: string | null;
  geothermal_focus: string | null;
  technology_focus: string | null;
  service_scope_summary: string | null;
  operating_markets_summary: string | null;
  research_status: string | null;
  information: string | null;
  notes: string | null;
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
};

type PlantLink = {
  company_plant_link_id: string;
  plant_id: string;
  plant_name: string | null;
  role: string | null;
  role_detail: string | null;
  is_primary: number | null;
  notes: string | null;
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
  company?: Company;
  roles: Role[];
  project_links: ProjectLink[];
  plant_links: PlantLink[];
  relationships_outgoing: Relationship[];
  relationships_incoming: Relationship[];
  error?: string;
};

type SortDirection = "asc" | "desc";
type CompanyTab =
  | "overview"
  | "projects"
  | "plants"
  | "roles"
  | "relationships"
  | "notes";

const companyDetailClass = {
  panel:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]",
  panelSubtle:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)]",
  header:
    "flex min-h-[48px] items-center border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-5",
  title: "text-[var(--tge-text-primary)]",
  body: "text-[var(--tge-text-secondary)]",
  muted: "text-[var(--tge-governance-muted-text)]",
  link:
    "underline decoration-[var(--tge-governance-muted-border)] underline-offset-4 hover:text-[var(--tge-brand-green-dark)]",
  utilityButton:
    "inline-flex min-h-[32px] items-center justify-center whitespace-nowrap border border-[var(--tge-border-strong)] bg-[var(--tge-surface-card)] px-3 py-1 text-[11px] font-semibold leading-none text-[var(--tge-governance-neutral-text)] transition hover:bg-[var(--tge-surface-subtle)]",
};

function StatusBadge({ value }: { value: string | null }) {
  const text = value || "NA";
  const normalized = text.toLowerCase();

  let classes = "inline-flex border px-2 py-0.5 text-[11px] font-semibold ";

  if (normalized.includes("done")) {
    classes +=
      "border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] text-[var(--tge-governance-success-text)]";
  } else if (normalized.includes("progress")) {
    classes +=
      "border-[var(--tge-governance-info-border)] bg-[var(--tge-governance-info-bg)] text-[var(--tge-governance-info-text)]";
  } else if (normalized.includes("need")) {
    classes +=
      "border-[var(--tge-governance-danger-border)] bg-[var(--tge-governance-danger-bg)] text-[var(--tge-governance-danger-text)]";
  } else {
    classes +=
      "border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] text-[var(--tge-governance-neutral-text)]";
  }

  return <span className={classes}>{text}</span>;
}

function sortRows<T>(rows: T[], key: keyof T, direction: SortDirection) {
  return [...rows].sort((a, b) => {
    const aValue = String(a[key] ?? "").toLowerCase();
    const bValue = String(b[key] ?? "").toLowerCase();

    if (aValue < bValue) return direction === "asc" ? -1 : 1;
    if (aValue > bValue) return direction === "asc" ? 1 : -1;
    return 0;
  });
}

function formatSecondaryTypes(value: string | string[] | null | undefined) {
  if (!value) return "NA";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "NA";

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.length ? parsed.join(", ") : "NA";
    }
  } catch {}

  return String(value);
}

function extractLinks(value: any): string[] {
  const text = value ? String(value).trim() : "";

  if (!text || text === "NA") return [];

  const normalized = text
    .replace(/\r/g, "\n")
    .replace(/,\s*(https?:\/\/)/g, "\n$1")
    .replace(/;\s*(https?:\/\/)/g, "\n$1")
    .replace(/\s+(https?:\/\/)/g, "\n$1");

  const candidates = normalized
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  const urls = candidates.filter((item) => /^https?:\/\//i.test(item));

  return Array.from(new Set(urls));
}

function renderLinkedText(value: any) {
  const text = value ? String(value).trim() : "";

  if (!text || text === "NA") {
    return <span className={companyDetailClass.body}>NA</span>;
  }

  const urls = extractLinks(text);

  if (!urls.length) {
    return <span className={companyDetailClass.body}>{text}</span>;
  }

  return (
    <ul className="space-y-1">
      {urls.map((url, index) => (
        <li key={index}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--tge-brand-green-dark)] underline hover:text-[var(--tge-brand-green)]"
          >
            {url}
          </a>
        </li>
      ))}
    </ul>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div>
      <div className={`text-[10px] font-semibold uppercase tracking-wide ${companyDetailClass.muted}`}>
        {label}
      </div>
      <div className={`mt-1 text-[28px] font-bold leading-none ${companyDetailClass.title}`}>
        {value ?? "NA"}
      </div>
    </div>
  );
}

function DetailLine({
  label,
  value,
  isLink = false,
}: {
  label: string;
  value: any;
  isLink?: boolean;
}) {
  const text = value ? String(value) : "NA";

  return (
    <div className="text-[13px] leading-6">
      <span className={`font-semibold ${companyDetailClass.title}`}>{label}: </span>
      {isLink && text !== "NA" ? (
        <a
          href={text}
          target="_blank"
          rel="noopener noreferrer"
          className={companyDetailClass.link}
        >
          {text}
        </a>
      ) : (
        <span className={companyDetailClass.body}>{text}</span>
      )}
    </div>
  );
}

function DetailBlock({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  const text = value ? String(value).trim() : "";

  return (
    <div>
      <div className={`font-semibold ${companyDetailClass.title}`}>{label}</div>
      <div className={`mt-1 whitespace-pre-wrap text-[13px] leading-6 ${companyDetailClass.body}`}>
        {extractLinks(text).length > 0 ? renderLinkedText(text) : text || "NA"}
      </div>
    </div>
  );
}

function TabSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={companyDetailClass.panel}>
      <div className={companyDetailClass.header}>
        <h2 className={`text-lg font-bold leading-none ${companyDetailClass.title}`}>
          {title}
        </h2>
      </div>
      <div className="px-5 py-3">{children}</div>
    </section>
  );
}

function CompactRoleCards({ roles }: { roles: Role[] }) {
  if (roles.length === 0) {
    return <div className={`text-sm ${companyDetailClass.muted}`}>No role records available.</div>;
  }

  return (
    <div className="space-y-2">
      {roles.map((role) => (
        <div
          key={role.company_role_id}
          className={`${companyDetailClass.panelSubtle} px-4 py-3`}
        >
          <div className={`text-[14px] font-semibold ${companyDetailClass.title}`}>
            {role.role_type || "NA"}
            {role.role_subtype ? ` · ${role.role_subtype}` : ""}
          </div>
          <div className={`mt-1 text-[12px] ${companyDetailClass.body}`}>
            Scope: {role.role_scope || "NA"} | Status: {role.role_status || "NA"}
          </div>
          {role.notes ? (
            <div className={`mt-1 text-[12px] ${companyDetailClass.muted}`}>{role.notes}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function PrintRow({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div className="print-row">
      <span>{label}</span>
      <strong>{value || "NA"}</strong>
    </div>
  );
}

export default function CompanyDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<CompanyDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([]);
  const [plantOptions, setPlantOptions] = useState<PlantOption[]>([]);
  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);

  const [activeTab, setActiveTab] = useState<CompanyTab>("overview");

  const [linkProjectForm, setLinkProjectForm] = useState({
    project_id: "",
    role: "",
    role_detail: "",
    is_primary: false,
    notes: "",
  });

  const [linkPlantForm, setLinkPlantForm] = useState({
    plant_id: "",
    role: "",
    role_detail: "",
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

  const [projectSearch, setProjectSearch] = useState("");
  const [plantSearch, setPlantSearch] = useState("");

  const [projectSortKey, setProjectSortKey] =
    useState<keyof ProjectLink>("project_name");
  const [projectSortDirection, setProjectSortDirection] =
    useState<SortDirection>("asc");

  const [plantSortKey, setPlantSortKey] =
    useState<keyof PlantLink>("plant_name");
  const [plantSortDirection, setPlantSortDirection] =
    useState<SortDirection>("asc");

  const utilityButtonClass =
    companyDetailClass.utilityButton;

  useEffect(() => {
    if (!id) return;

    fetch(`/api/companies/${id}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading company detail:", err);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    fetch("/api/projects/options")
      .then((res) => res.json())
      .then((json) => setProjectOptions(json))
      .catch((err) => console.error("Error loading project options:", err));
  }, []);

  useEffect(() => {
    fetch("/api/plants/options")
      .then((res) => res.json())
      .then((json) => setPlantOptions(json))
      .catch((err) => console.error("Error loading plant options:", err));
  }, []);

  useEffect(() => {
    fetch("/api/companies/options")
      .then((res) => res.json())
      .then((json) => setCompanyOptions(json))
      .catch((err) => console.error("Error loading company options:", err));
  }, []);

  const filteredProjects = useMemo(() => {
    if (!data) return [];
    const rows = data.project_links.filter((row) => {
      const q = projectSearch.toLowerCase();
      return (
        String(row.project_id ?? "").toLowerCase().includes(q) ||
        String(row.project_name ?? "").toLowerCase().includes(q) ||
        String(row.role ?? "").toLowerCase().includes(q) ||
        String(row.role_detail ?? "").toLowerCase().includes(q) ||
        String(row.notes ?? "").toLowerCase().includes(q)
      );
    });

    return sortRows(rows, projectSortKey, projectSortDirection);
  }, [data, projectSearch, projectSortKey, projectSortDirection]);

  const filteredPlants = useMemo(() => {
    if (!data) return [];
    const rows = data.plant_links.filter((row) => {
      const q = plantSearch.toLowerCase();
      return (
        String(row.plant_id ?? "").toLowerCase().includes(q) ||
        String(row.plant_name ?? "").toLowerCase().includes(q) ||
        String(row.role ?? "").toLowerCase().includes(q) ||
        String(row.role_detail ?? "").toLowerCase().includes(q) ||
        String(row.notes ?? "").toLowerCase().includes(q)
      );
    });

    return sortRows(rows, plantSortKey, plantSortDirection);
  }, [data, plantSearch, plantSortKey, plantSortDirection]);

  function toggleProjectSort(key: keyof ProjectLink) {
    if (projectSortKey === key) {
      setProjectSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setProjectSortKey(key);
      setProjectSortDirection("asc");
    }
  }

  function togglePlantSort(key: keyof PlantLink) {
    if (plantSortKey === key) {
      setPlantSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setPlantSortKey(key);
      setPlantSortDirection("asc");
    }
  }

  async function addProjectLink() {
    if (!data?.company) return;

    try {
      setIsLinkingProject(true);
      setLinkProjectMessage("");

      const res = await fetch("/api/company-project-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: data.company.company_id,
          project_id: linkProjectForm.project_id,
          role: linkProjectForm.role,
          role_detail: linkProjectForm.role_detail,
          is_primary: linkProjectForm.is_primary,
          notes: linkProjectForm.notes,
        }),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json?.error || "Failed to create project link");

      setData((prev) =>
        prev ? { ...prev, project_links: [...prev.project_links, json.link] } : prev
      );

      setLinkProjectForm({
        project_id: "",
        role: "",
        role_detail: "",
        is_primary: false,
        notes: "",
      });

      setLinkProjectMessage("Project link added successfully.");
    } catch (error) {
      console.error(error);
      setLinkProjectMessage(
        error instanceof Error ? error.message : "Failed to create project link."
      );
    } finally {
      setIsLinkingProject(false);
    }
  }

  async function addPlantLink() {
    if (!data?.company) return;

    try {
      setIsLinkingPlant(true);
      setLinkPlantMessage("");

      const res = await fetch("/api/company-plant-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: data.company.company_id,
          plant_id: linkPlantForm.plant_id,
          role: linkPlantForm.role,
          role_detail: linkPlantForm.role_detail,
          is_primary: linkPlantForm.is_primary,
          notes: linkPlantForm.notes,
        }),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json?.error || "Failed to create plant link");

      setData((prev) =>
        prev ? { ...prev, plant_links: [...prev.plant_links, json.link] } : prev
      );

      setLinkPlantForm({
        plant_id: "",
        role: "",
        role_detail: "",
        is_primary: false,
        notes: "",
      });

      setLinkPlantMessage("Plant link added successfully.");
    } catch (error) {
      console.error(error);
      setLinkPlantMessage(
        error instanceof Error ? error.message : "Failed to create plant link."
      );
    } finally {
      setIsLinkingPlant(false);
    }
  }

  async function addCompanyRelationship() {
    if (!data?.company) return;

    try {
      setIsLinkingRelationship(true);
      setRelationshipMessage("");

      const res = await fetch("/api/company-relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id_from: data.company.company_id,
          company_id_to: relationshipForm.company_id_to,
          relationship_type: relationshipForm.relationship_type,
          ownership_percentage: relationshipForm.ownership_percentage,
          is_current: relationshipForm.is_current,
          notes: relationshipForm.notes,
        }),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json?.error || "Failed to create relationship");

      setData((prev) =>
        prev
          ? {
              ...prev,
              relationships_outgoing: [...prev.relationships_outgoing, json.relationship],
            }
          : prev
      );

      setRelationshipForm({
        company_id_to: "",
        relationship_type: "",
        ownership_percentage: "",
        is_current: true,
        notes: "",
      });

      setRelationshipMessage("Company relationship added successfully.");
    } catch (error) {
      console.error(error);
      setRelationshipMessage(
        error instanceof Error ? error.message : "Failed to create relationship."
      );
    } finally {
      setIsLinkingRelationship(false);
    }
  }

  if (loading) {
    return (
      <main className="screen-only space-y-6">
        <section className={`px-6 py-6 text-sm ${companyDetailClass.body} ${companyDetailClass.panel}`}>
          Loading company...
        </section>
      </main>
    );
  }

  if (!data?.company) {
    return (
      <>
        <main className="screen-only space-y-6">
          <section className={`px-6 py-6 ${companyDetailClass.panel}`}>
            <h1 className={`text-2xl font-bold ${companyDetailClass.title}`}>Company not found</h1>
          </section>
        </main>

        <main className="print-only">
          <div className="print-doc">
            <div className="print-header">
              <div className="print-header-main">
                <div className="print-brand-block">
                  <img src="/tge_logo.png" className="print-logo" alt="ThinkGeoEnergy" />
                  <div className="print-brand-copy">
                    <div className="print-brand-line">Internal Database</div>
                    <div className="print-brand-line">Platform</div>
                  </div>
                </div>

                <div className="print-header-divider" />

                <div className="print-title-block">
                  <div className="print-type">Company Overview</div>
                  <h1 className="print-title">Company not found</h1>
                </div>
              </div>
            </div>

            <footer className="print-footer">
              © {new Date().getFullYear()} ThinkGeoEnergy ehf. All rights reserved.
            </footer>
          </div>
        </main>
      </>
    );
  }

  const company = data.company;

  const statCards = [
    { label: "Linked Projects", value: data.project_links.length },
    { label: "Linked Plants", value: data.plant_links.length },
    { label: "Role Records", value: data.roles.length },
    {
      label: "Explicit Relationships",
      value: data.relationships_outgoing.length + data.relationships_incoming.length,
    },
  ];

  return (
    <>
      <main className="screen-only space-y-6">
        <div>
          <Link
            href="/companies"
            className="text-sm font-medium text-[var(--tge-brand-green-dark)] hover:underline"
          >
            ← Back to companies
          </Link>
        </div>

        <section className={companyDetailClass.panel}>
          <div className="border-l-4 border-l-[var(--tge-brand-green)] px-6 py-6">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-5xl">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]">
                  Company Profile
                </p>
                <h1 className={`mt-2 text-4xl font-bold tracking-tight ${companyDetailClass.title} xl:text-5xl`}>
                  {company.company_name || company.company_id}
                </h1>
                <div className={`mt-3 flex flex-wrap items-center gap-2 text-sm ${companyDetailClass.body}`}>
                  <span>{company.headquarters_country || "NA"}</span>
                  <span className="text-[var(--tge-governance-muted-border)]">|</span>
                  <span>{company.region || "NA"}</span>
                  <span className="text-[var(--tge-governance-muted-border)]">|</span>
                  <span>{company.company_type_primary || "NA"}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusBadge value={company.research_status} />
                </div>
              </div>

              <div className="flex w-full max-w-[880px] flex-col gap-3 xl:w-auto xl:min-w-[640px] xl:items-end">
                <div className="flex flex-wrap gap-2 xl:justify-end">
                  <PrintButton className={utilityButtonClass} />
                </div>

                <div className="flex flex-wrap gap-3 xl:justify-end">
                  <ActionButton
                    href={`/companies/${company.company_id}/edit`}
                    variant="primary"
                  >
                    Edit Company
                  </ActionButton>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-6 py-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 xl:grid-cols-4">
              {statCards.map((card) => (
                <SummaryItem key={card.label} label={card.label} value={card.value} />
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_420px]">
          <div className={companyDetailClass.panel}>
            <div className={companyDetailClass.header}>
              <h2 className={`text-lg font-bold leading-none ${companyDetailClass.title}`}>
                Company Overview
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 px-5 py-4 xl:grid-cols-2">
              <div>
                <h3 className={`mb-3 text-sm font-semibold uppercase tracking-wide ${companyDetailClass.muted}`}>
                  Core Company Information
                </h3>
                <div className="grid grid-cols-1 gap-x-8 gap-y-2 md:grid-cols-2">
                  <DetailLine label="Company ID" value={company.company_id} />
                  <DetailLine label="Short Name" value={company.company_name_short} />
                  <DetailLine label="Legal Name" value={company.company_legal_name} />
                  <DetailLine label="Entity Type" value={company.entity_type} />
                  <DetailLine label="Primary Type" value={company.company_type_primary} />
                  <DetailLine
                    label="Secondary Types"
                   value={formatSecondaryTypes(company.secondary_types)}
                  />
                  <DetailLine label="Ownership Type" value={company.ownership_type} />
                  <DetailLine label="Company Status" value={company.company_status} />
                  <DetailLine label="HQ City" value={company.headquarters_city} />
                  <DetailLine label="HQ Country" value={company.headquarters_country} />
                  <DetailLine label="Region" value={company.region} />
                  <DetailLine label="WB Region" value={company.wb_region} />
                  <div className="md:col-span-2">
                    <DetailLine label="Website" value={company.website_url} isLink />
                  </div>
                  <div className="md:col-span-2">
                    <DetailLine label="LinkedIn" value={company.linkedin_url} isLink />
                  </div>
                </div>
              </div>

              <div>
                <h3 className={`mb-3 text-sm font-semibold uppercase tracking-wide ${companyDetailClass.muted}`}>
                  Group / Parent Structure
                </h3>
                <div className="grid grid-cols-1 gap-y-2">
                  <DetailLine
                    label="Parent Company"
                    value={company.parent_company_name || company.parent_company_id}
                  />
                  <DetailLine
                    label="Ultimate Parent Company"
                    value={
                      company.ultimate_parent_company_name || company.ultimate_parent_company_id
                    }
                  />
                  <DetailLine label="Reporting Group" value={company.company_group_name} />
                  <DetailLine
                    label="Consolidation Method"
                    value={company.consolidation_method}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={companyDetailClass.panel}>
            <div className={companyDetailClass.header}>
              <h2 className={`text-lg font-bold leading-none ${companyDetailClass.title}`}>
                Focus & Scope
              </h2>
            </div>
            <div className="space-y-4 px-5 py-4">
              <DetailBlock label="Geothermal Focus" value={company.geothermal_focus} />
              <DetailBlock label="Technology Focus" value={company.technology_focus} />
              <DetailBlock
                label="Service Scope Summary"
                value={company.service_scope_summary}
              />
              <DetailBlock
                label="Operating Markets Summary"
                value={company.operating_markets_summary}
              />
            </div>
          </div>
        </section>

        <section className={companyDetailClass.panel}>
          <div className="border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-5 py-1">
            <div className="flex flex-wrap">
              {[
                { key: "overview", label: "Overview" },
                { key: "projects", label: "Projects" },
                { key: "plants", label: "Plants" },
                { key: "roles", label: "Roles & Capabilities" },
                { key: "relationships", label: "Relationships" },
                { key: "notes", label: "Notes & Information" },
              ].map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key as CompanyTab)}
                    className={`border-r border-[var(--tge-governance-neutral-border)] px-3 py-2.5 text-[12px] font-semibold ${
                      isActive
                        ? "bg-[var(--tge-surface-card)] text-[var(--tge-text-primary)]"
                        : "text-[var(--tge-governance-neutral-text)] hover:bg-[var(--tge-governance-neutral-bg)]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-0">
            {activeTab === "overview" && (
              <TabSection title="Overview">
                <div className="grid gap-6 xl:grid-cols-2">
                  <div>
                    <h3 className={`mb-3 text-sm font-semibold uppercase tracking-wide ${companyDetailClass.muted}`}>
                      Roles & Capabilities
                    </h3>
                    <CompactRoleCards roles={data.roles} />
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className={`mb-3 text-sm font-semibold uppercase tracking-wide ${companyDetailClass.muted}`}>
                        Connections
                      </h3>

                      <div className="grid grid-cols-1 gap-3">
                        <button
                          onClick={() => setActiveTab("projects")}
                          className="flex items-center justify-between border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-4 py-3 text-left hover:border-[var(--tge-brand-green)] hover:bg-[var(--tge-surface-card)]"
                        >
                          <div>
                            <div className={`text-[13px] font-semibold ${companyDetailClass.title}`}>
                              Linked Projects
                            </div>
                            <div className={`text-[12px] ${companyDetailClass.muted}`}>
                              View all project relationships
                            </div>
                          </div>
                          <div className={`text-lg font-bold ${companyDetailClass.title}`}>
                            {data.project_links.length}
                          </div>
                        </button>

                        <button
                          onClick={() => setActiveTab("plants")}
                          className="flex items-center justify-between border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-4 py-3 text-left hover:border-[var(--tge-brand-green)] hover:bg-[var(--tge-surface-card)]"
                        >
                          <div>
                            <div className={`text-[13px] font-semibold ${companyDetailClass.title}`}>
                              Linked Plants
                            </div>
                            <div className={`text-[12px] ${companyDetailClass.muted}`}>
                              View all plant relationships
                            </div>
                          </div>
                          <div className={`text-lg font-bold ${companyDetailClass.title}`}>
                            {data.plant_links.length}
                          </div>
                        </button>

                        <button
                          onClick={() => setActiveTab("relationships")}
                          className="flex items-center justify-between border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-4 py-3 text-left hover:border-[var(--tge-brand-green)] hover:bg-[var(--tge-surface-card)]"
                        >
                          <div>
                            <div className={`text-[13px] font-semibold ${companyDetailClass.title}`}>
                              Related Companies
                            </div>
                            <div className={`text-[12px] ${companyDetailClass.muted}`}>
                              Ownership & partnerships
                            </div>
                          </div>
                          <div className={`text-lg font-bold ${companyDetailClass.title}`}>
                            {data.relationships_outgoing.length +
                              data.relationships_incoming.length}
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabSection>
            )}

            {activeTab === "projects" && (
              <TabSection title="Linked Projects">
                <div className="border border-gray-200 bg-[#fafafa] px-5 py-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                    Add Project Link
                  </h3>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <div className="xl:col-span-2">
                      <label className="mb-1 block text-sm font-semibold">Project</label>
                      <select
                        className="w-full border border-gray-300 bg-white px-3 py-2 text-sm"
                        value={linkProjectForm.project_id}
                        onChange={(e) =>
                          setLinkProjectForm((prev) => ({
                            ...prev,
                            project_id: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select project...</option>
                        {projectOptions.map((project) => (
                          <option key={project.project_id} value={project.project_id}>
                            {project.project_name || project.project_id}
                            {project.country ? ` (${project.country})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold">Role</label>
                      <input
                        className="w-full border border-gray-300 px-3 py-2 text-sm"
                        value={linkProjectForm.role}
                        onChange={(e) =>
                          setLinkProjectForm((prev) => ({ ...prev, role: e.target.value }))
                        }
                        placeholder="e.g. Developer"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold">Role Detail</label>
                      <input
                        className="w-full border border-gray-300 px-3 py-2 text-sm"
                        value={linkProjectForm.role_detail}
                        onChange={(e) =>
                          setLinkProjectForm((prev) => ({
                            ...prev,
                            role_detail: e.target.value,
                          }))
                        }
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold">Notes</label>
                      <input
                        className="w-full border border-gray-300 px-3 py-2 text-sm"
                        value={linkProjectForm.notes}
                        onChange={(e) =>
                          setLinkProjectForm((prev) => ({ ...prev, notes: e.target.value }))
                        }
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={linkProjectForm.is_primary}
                        onChange={(e) =>
                          setLinkProjectForm((prev) => ({
                            ...prev,
                            is_primary: e.target.checked,
                          }))
                        }
                      />
                      Mark as primary
                    </label>
                    <button
                      type="button"
                      onClick={addProjectLink}
                      disabled={isLinkingProject}
                      className="bg-[#8dc63f] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                      {isLinkingProject ? "Adding..." : "Add Project Link"}
                    </button>
                    {linkProjectMessage ? (
                      <div className="text-sm font-medium text-[#1f2937]">
                        {linkProjectMessage}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 border border-gray-200">
                  <div className="border-b border-gray-200 bg-[#f7f7f7] px-5 py-3">
                    <input
                      type="text"
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      placeholder="Search by project ID, project name, role..."
                      className="w-full border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#8dc63f]"
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full table-fixed text-left text-[12px]">
                      <colgroup>
                        <col className="w-[16%]" />
                        <col className="w-[28%]" />
                        <col className="w-[18%]" />
                        <col className="w-[26%]" />
                        <col className="w-[12%]" />
                      </colgroup>
                      <thead className="bg-white">
                        <tr className="border-b border-gray-200">
                          <th className="px-5 py-2.5 font-semibold text-gray-700">
                            <button
                              type="button"
                              onClick={() => toggleProjectSort("project_id")}
                            >
                              Project ID
                            </button>
                          </th>
                          <th className="px-5 py-2.5 font-semibold text-gray-700">
                            <button
                              type="button"
                              onClick={() => toggleProjectSort("project_name")}
                            >
                              Project Name
                            </button>
                          </th>
                          <th className="px-5 py-2.5 font-semibold text-gray-700">Role</th>
                          <th className="px-5 py-2.5 font-semibold text-gray-700">
                            Role Detail
                          </th>
                          <th className="px-5 py-2.5 font-semibold text-gray-700">
                            Primary
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProjects.map((row) => (
                          <tr key={row.company_project_link_id} className="border-b border-gray-200">
                            <td className="px-5 py-2.5 font-mono text-[11px] text-gray-500">
                              {row.project_id}
                            </td>
                            <td className="px-5 py-2.5">
                              <Link
                                href={`/projects/${row.project_id}`}
                                className="font-medium text-[#1f2937] hover:text-[#8dc63f] hover:underline"
                              >
                                {row.project_name || row.project_id}
                              </Link>
                            </td>
                            <td className="px-5 py-2.5 text-gray-600">{row.role || "NA"}</td>
                            <td className="px-5 py-2.5 text-gray-600">
                              {row.role_detail || "NA"}
                            </td>
                            <td className="px-5 py-2.5 text-gray-600">
                              {row.is_primary ? "Yes" : "NA"}
                            </td>
                          </tr>
                        ))}
                        {filteredProjects.length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-5 py-8 text-center text-sm text-gray-500"
                            >
                              No matching linked project records found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabSection>
            )}

            {activeTab === "plants" && (
              <TabSection title="Linked Plants">
                <div className="border border-gray-200 bg-[#fafafa] px-5 py-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                    Add Plant Link
                  </h3>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <div className="xl:col-span-2">
                      <label className="mb-1 block text-sm font-semibold">Plant</label>
                      <select
                        className="w-full border border-gray-300 bg-white px-3 py-2 text-sm"
                        value={linkPlantForm.plant_id}
                        onChange={(e) =>
                          setLinkPlantForm((prev) => ({
                            ...prev,
                            plant_id: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select plant...</option>
                        {plantOptions.map((plant) => (
                          <option key={plant.plant_id} value={plant.plant_id}>
                            {plant.plant_name || plant.plant_id}
                            {plant.country ? ` (${plant.country})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold">Role</label>
                      <input
                        className="w-full border border-gray-300 px-3 py-2 text-sm"
                        value={linkPlantForm.role}
                        onChange={(e) =>
                          setLinkPlantForm((prev) => ({ ...prev, role: e.target.value }))
                        }
                        placeholder="e.g. Owner / Operator"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold">Role Detail</label>
                      <input
                        className="w-full border border-gray-300 px-3 py-2 text-sm"
                        value={linkPlantForm.role_detail}
                        onChange={(e) =>
                          setLinkPlantForm((prev) => ({
                            ...prev,
                            role_detail: e.target.value,
                          }))
                        }
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold">Notes</label>
                      <input
                        className="w-full border border-gray-300 px-3 py-2 text-sm"
                        value={linkPlantForm.notes}
                        onChange={(e) =>
                          setLinkPlantForm((prev) => ({ ...prev, notes: e.target.value }))
                        }
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={linkPlantForm.is_primary}
                        onChange={(e) =>
                          setLinkPlantForm((prev) => ({
                            ...prev,
                            is_primary: e.target.checked,
                          }))
                        }
                      />
                      Mark as primary
                    </label>
                    <button
                      type="button"
                      onClick={addPlantLink}
                      disabled={isLinkingPlant}
                      className="bg-[#8dc63f] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                      {isLinkingPlant ? "Adding..." : "Add Plant Link"}
                    </button>
                    {linkPlantMessage ? (
                      <div className="text-sm font-medium text-[#1f2937]">
                        {linkPlantMessage}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 border border-gray-200">
                  <div className="border-b border-gray-200 bg-[#f7f7f7] px-5 py-3">
                    <input
                      type="text"
                      value={plantSearch}
                      onChange={(e) => setPlantSearch(e.target.value)}
                      placeholder="Search by plant ID, plant name, role..."
                      className="w-full border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#8dc63f]"
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full table-fixed text-left text-[12px]">
                      <colgroup>
                        <col className="w-[16%]" />
                        <col className="w-[28%]" />
                        <col className="w-[18%]" />
                        <col className="w-[26%]" />
                        <col className="w-[12%]" />
                      </colgroup>
                      <thead className="bg-white">
                        <tr className="border-b border-gray-200">
                          <th className="px-5 py-2.5 font-semibold text-gray-700">
                            <button
                              type="button"
                              onClick={() => togglePlantSort("plant_id")}
                            >
                              Plant ID
                            </button>
                          </th>
                          <th className="px-5 py-2.5 font-semibold text-gray-700">
                            <button
                              type="button"
                              onClick={() => togglePlantSort("plant_name")}
                            >
                              Plant Name
                            </button>
                          </th>
                          <th className="px-5 py-2.5 font-semibold text-gray-700">Role</th>
                          <th className="px-5 py-2.5 font-semibold text-gray-700">
                            Role Detail
                          </th>
                          <th className="px-5 py-2.5 font-semibold text-gray-700">
                            Primary
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPlants.map((row) => (
                          <tr key={row.company_plant_link_id} className="border-b border-gray-200">
                            <td className="px-5 py-2.5 font-mono text-[11px] text-gray-500">
                              {row.plant_id}
                            </td>
                            <td className="px-5 py-2.5">
                              <Link
                                href={`/plants/${row.plant_id}`}
                                className="font-medium text-[#1f2937] hover:text-[#8dc63f] hover:underline"
                              >
                                {row.plant_name || row.plant_id}
                              </Link>
                            </td>
                            <td className="px-5 py-2.5 text-gray-600">{row.role || "NA"}</td>
                            <td className="px-5 py-2.5 text-gray-600">
                              {row.role_detail || "NA"}
                            </td>
                            <td className="px-5 py-2.5 text-gray-600">
                              {row.is_primary ? "Yes" : "NA"}
                            </td>
                          </tr>
                        ))}
                        {filteredPlants.length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-5 py-8 text-center text-sm text-gray-500"
                            >
                              No matching linked plant records found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabSection>
            )}

            {activeTab === "roles" && (
              <TabSection title="Roles & Capabilities">
                <CompactRoleCards roles={data.roles} />
              </TabSection>
            )}

            {activeTab === "relationships" && (
              <TabSection title="Relationships">
                <div className="mb-4 border border-gray-200 bg-[#fafafa] px-4 py-3 text-sm text-gray-600">
                  Parent-company hierarchy is managed in the Company Overview under Group / Parent Structure. This tab only shows explicit relationship records such as ownership, JV, affiliate, investor, and partner relationships.
                </div>
                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="border border-gray-200 bg-[#fafafa] px-5 py-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                      Add Company Relationship
                    </h3>
                    <div className="mt-4 grid grid-cols-1 gap-4">
                      <div>
                        <label className="mb-1 block text-sm font-semibold">
                          Related Company
                        </label>
                        <select
                          className="w-full border border-gray-300 bg-white px-3 py-2 text-sm"
                          value={relationshipForm.company_id_to}
                          onChange={(e) =>
                            setRelationshipForm((prev) => ({
                              ...prev,
                              company_id_to: e.target.value,
                            }))
                          }
                        >
                          <option value="">Select company...</option>
                          {companyOptions
                            .filter((option) => option.company_id !== company.company_id)
                            .map((option) => (
                              <option key={option.company_id} value={option.company_id}>
                                {option.company_name || option.company_id}
                                {option.headquarters_country
                                  ? ` (${option.headquarters_country})`
                                  : ""}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-semibold">
                          Relationship Type
                        </label>
                        <input
                          className="w-full border border-gray-300 px-3 py-2 text-sm"
                          value={relationshipForm.relationship_type}
                          onChange={(e) =>
                            setRelationshipForm((prev) => ({
                              ...prev,
                              relationship_type: e.target.value,
                            }))
                          }
                          placeholder="e.g. Owned by"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-semibold">
                          Ownership %
                        </label>
                        <input
                          className="w-full border border-gray-300 px-3 py-2 text-sm"
                          value={relationshipForm.ownership_percentage}
                          onChange={(e) =>
                            setRelationshipForm((prev) => ({
                              ...prev,
                              ownership_percentage: e.target.value,
                            }))
                          }
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-semibold">Notes</label>
                        <input
                          className="w-full border border-gray-300 px-3 py-2 text-sm"
                          value={relationshipForm.notes}
                          onChange={(e) =>
                            setRelationshipForm((prev) => ({
                              ...prev,
                              notes: e.target.value,
                            }))
                          }
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={relationshipForm.is_current}
                          onChange={(e) =>
                            setRelationshipForm((prev) => ({
                              ...prev,
                              is_current: e.target.checked,
                            }))
                          }
                        />
                        Current relationship
                      </label>
                      <button
                        type="button"
                        onClick={addCompanyRelationship}
                        disabled={isLinkingRelationship}
                        className="bg-[#8dc63f] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                      >
                        {isLinkingRelationship ? "Adding..." : "Add Relationship"}
                      </button>
                      {relationshipMessage ? (
                        <div className="text-sm font-medium text-[#1f2937]">
                          {relationshipMessage}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">
                        Outgoing Relationships
                      </h3>
                      <div className="space-y-2">
                        {data.relationships_outgoing.length === 0 ? (
                          <div className="text-sm text-gray-500">
                            No outgoing relationships recorded.
                          </div>
                        ) : (
                          data.relationships_outgoing.map((row) => (
                            <div
                              key={row.company_relationship_id}
                              className="border border-gray-200 bg-[#fafafa] px-4 py-3"
                            >
                              <div className="text-[13px] font-semibold text-[#1f2937]">
                                {row.relationship_type || "NA"} →{" "}
                                {row.related_company_name || row.related_company_id || "NA"}
                              </div>
                              <div className="mt-1 text-[12px] text-gray-600">
                                Ownership: {row.ownership_percentage ?? "NA"} | Current:{" "}
                                {row.is_current ? "Yes" : "No"}
                              </div>
                              {row.notes ? (
                                <div className="mt-1 text-[12px] text-gray-500">
                                  {row.notes}
                                </div>
                              ) : null}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">
                        Incoming Relationships
                      </h3>
                      <div className="space-y-2">
                        {data.relationships_incoming.length === 0 ? (
                          <div className="text-sm text-gray-500">
                            No incoming relationships recorded.
                          </div>
                        ) : (
                          data.relationships_incoming.map((row) => (
                            <div
                              key={row.company_relationship_id}
                              className="border border-gray-200 bg-[#fafafa] px-4 py-3"
                            >
                              <div className="text-[13px] font-semibold text-[#1f2937]">
                                {row.related_company_name || row.related_company_id || "NA"} →{" "}
                                {row.relationship_type || "NA"}
                              </div>
                              <div className="mt-1 text-[12px] text-gray-600">
                                Ownership: {row.ownership_percentage ?? "NA"} | Current:{" "}
                                {row.is_current ? "Yes" : "No"}
                              </div>
                              {row.notes ? (
                                <div className="mt-1 text-[12px] text-gray-500">
                                  {row.notes}
                                </div>
                              ) : null}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabSection>
            )}

            {activeTab === "notes" && (
              <TabSection title="Notes & Information">
                <div className="space-y-6">
                  <DetailBlock
                    label="Information"
                    value={company.information || "No information available."}
                  />
                  <DetailBlock
                    label="Notes"
                    value={company.notes || "No notes available."}
                  />
                </div>
              </TabSection>
            )}
          </div>
        </section>

        <RelatedNewsCard
          name={company.company_name}
          group={company.company_group_name}
          country={company.headquarters_country}
          owner={company.company_name}
        />

        <div className="h-6" />
      </main>

      <main className="print-only">
        <div className="print-doc">
          <div className="print-header">
            <div className="print-header-main">
              <div className="print-brand-block">
                <img src="/tge_logo.png" className="print-logo" alt="ThinkGeoEnergy" />
                <div className="print-brand-copy">
                  <div className="print-brand-line">Internal Database</div>
                  <div className="print-brand-line">Platform</div>
                </div>
              </div>

              <div className="print-header-divider" />

              <div className="print-title-block">
                <div className="print-type">Company Overview</div>
                <h1 className="print-title">
                  {company.company_name || company.company_id}
                </h1>
                <p className="print-subtitle">
                  {company.headquarters_country || "NA"} | {company.region || "NA"} |{" "}
                  {company.company_type_primary || "NA"}
                </p>
              </div>
            </div>

            <div className="print-summary-grid">
              <div className="print-summary-item">
                <div className="print-summary-label">Company ID</div>
                <div className="print-summary-value">{company.company_id || "NA"}</div>
              </div>

              <div className="print-summary-item">
                <div className="print-summary-label">Primary Type</div>
                <div className="print-summary-value">
                  {company.company_type_primary || "NA"}
                </div>
              </div>

              <div className="print-summary-item">
                <div className="print-summary-label">Secondary Type</div>
                <div className="print-summary-value">
                  {formatSecondaryTypes(company.secondary_types)}
                </div>
              </div>

              <div className="print-summary-item">
                <div className="print-summary-label">HQ Country</div>
                <div className="print-summary-value">
                  {company.headquarters_country || "NA"}
                </div>
              </div>

              <div className="print-summary-item">
                <div className="print-summary-label">Linked Projects</div>
                <div className="print-summary-value">{data.project_links.length}</div>
              </div>

              <div className="print-summary-item">
                <div className="print-summary-label">Linked Plants</div>
                <div className="print-summary-value">{data.plant_links.length}</div>
              </div>
            </div>
          </div>

          <section className="print-section">
            <h2 className="print-section-title">Company Overview</h2>
            <div className="print-grid">
              <PrintRow label="Company ID" value={company.company_id} />
              <PrintRow label="Short Name" value={company.company_name_short} />
              <PrintRow label="Legal Name" value={company.company_legal_name} />
              <PrintRow label="Entity Type" value={company.entity_type} />
              <PrintRow label="Primary Type" value={company.company_type_primary} />
              <PrintRow
                label="Secondary Types"
                value={formatSecondaryTypes(company.secondary_types)}
              />
              <PrintRow
                label="Parent Company"
                value={company.parent_company_name || company.parent_company_id}
              />
              <PrintRow
                label="Ultimate Parent Company"
                value={company.ultimate_parent_company_name || company.ultimate_parent_company_id}
              />
              <PrintRow label="Reporting Group" value={company.company_group_name} />
              <PrintRow label="Consolidation Method" value={company.consolidation_method} />
              <PrintRow label="Ownership Type" value={company.ownership_type} />
              <PrintRow label="Company Status" value={company.company_status} />
              <PrintRow label="Group Name" value={company.company_group_name} />
              <PrintRow label="HQ City" value={company.headquarters_city} />
              <PrintRow label="HQ Country" value={company.headquarters_country} />
              <PrintRow label="WB Region" value={company.wb_region} />
              <PrintRow label="Website" value={company.website_url} />
              <PrintRow label="LinkedIn" value={company.linkedin_url} />
            </div>
          </section>

          <section className="print-section">
            <h2 className="print-section-title">Focus & Scope</h2>
            <div className="space-y-3">
              <div className="print-paragraph">
                <strong>Geothermal Focus:</strong> {company.geothermal_focus || "NA"}
              </div>
              <div className="print-paragraph">
                <strong>Technology Focus:</strong> {company.technology_focus || "NA"}
              </div>
              <div className="print-paragraph">
                <strong>Service Scope Summary:</strong>{" "}
                {company.service_scope_summary || "NA"}
              </div>
              <div className="print-paragraph">
                <strong>Operating Markets Summary:</strong>{" "}
                {company.operating_markets_summary || "NA"}
              </div>
            </div>
          </section>

          <section className="print-section">
            <h2 className="print-section-title">Roles & Capabilities</h2>
            <div className="space-y-2">
              {data.roles.length === 0 ? (
                <p className="print-paragraph">No role records available.</p>
              ) : (
                data.roles.map((role) => (
                  <div key={role.company_role_id} className="print-paragraph">
                    <strong>{role.role_type || "NA"}</strong>
                    {role.role_subtype ? ` · ${role.role_subtype}` : ""}
                    {" | "}Scope: {role.role_scope || "NA"}
                    {" | "}Status: {role.role_status || "NA"}
                    {role.notes ? ` | ${role.notes}` : ""}
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="print-section">
            <h2 className="print-section-title">Linked Projects</h2>
            <div className="space-y-2">
              {data.project_links.length === 0 ? (
                <p className="print-paragraph">No linked projects.</p>
              ) : (
                data.project_links.map((row) => (
                  <div key={row.company_project_link_id} className="print-paragraph">
                    <strong>{row.project_name || row.project_id || "NA"}</strong>
                    {" | "}ID: {row.project_id || "NA"}
                    {" | "}Role: {row.role || "NA"}
                    {row.role_detail ? ` | ${row.role_detail}` : ""}
                    {row.is_primary ? " | Primary" : ""}
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="print-section">
            <h2 className="print-section-title">Linked Plants</h2>
            <div className="space-y-2">
              {data.plant_links.length === 0 ? (
                <p className="print-paragraph">No linked plants.</p>
              ) : (
                data.plant_links.map((row) => (
                  <div key={row.company_plant_link_id} className="print-paragraph">
                    <strong>{row.plant_name || row.plant_id || "NA"}</strong>
                    {" | "}ID: {row.plant_id || "NA"}
                    {" | "}Role: {row.role || "NA"}
                    {row.role_detail ? ` | ${row.role_detail}` : ""}
                    {row.is_primary ? " | Primary" : ""}
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="print-section">
            <h2 className="print-section-title">Relationships</h2>
            <div className="space-y-3">
              <div>
                <p className="print-paragraph">
                  <strong>Outgoing Relationships</strong>
                </p>
                <div className="space-y-2">
                  {data.relationships_outgoing.length === 0 ? (
                    <p className="print-paragraph">
                      No outgoing relationships recorded.
                    </p>
                  ) : (
                    data.relationships_outgoing.map((row) => (
                      <div key={row.company_relationship_id} className="print-paragraph">
                        {row.relationship_type || "NA"} →{" "}
                        {row.related_company_name || row.related_company_id || "NA"}
                        {" | "}Ownership: {row.ownership_percentage ?? "NA"}
                        {" | "}Current: {row.is_current ? "Yes" : "No"}
                        {row.notes ? ` | ${row.notes}` : ""}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <p className="print-paragraph">
                  <strong>Incoming Relationships</strong>
                </p>
                <div className="space-y-2">
                  {data.relationships_incoming.length === 0 ? (
                    <p className="print-paragraph">
                      No incoming relationships recorded.
                    </p>
                  ) : (
                    data.relationships_incoming.map((row) => (
                      <div key={row.company_relationship_id} className="print-paragraph">
                        {row.related_company_name || row.related_company_id || "NA"} →{" "}
                        {row.relationship_type || "NA"}
                        {" | "}Ownership: {row.ownership_percentage ?? "NA"}
                        {" | "}Current: {row.is_current ? "Yes" : "No"}
                        {row.notes ? ` | ${row.notes}` : ""}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="print-section">
            <h2 className="print-section-title">Notes & Information</h2>
            <div className="space-y-3">
              <div className="print-paragraph">
                <strong>Information:</strong>{" "}
                {company.information || "No information available."}
              </div>
              <div className="print-paragraph">
                <strong>Notes:</strong> {company.notes || "No notes available."}
              </div>
            </div>
          </section>

          <footer className="print-footer">
            © {new Date().getFullYear()} ThinkGeoEnergy ehf. All rights reserved.
          </footer>
        </div>
      </main>
    </>
  );
}
