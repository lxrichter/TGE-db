"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import type {
  PostgresCompanyOperatingAssetLink,
  PostgresCompanyProjectLink,
  PostgresCompanyRelationship,
  PostgresCompanyRelationshipReferenceData,
} from "@/lib/postgres-preview";

type RoleLinkForm = {
  company_id: string;
  project_id: string;
  operating_asset_id: string;
  role_code: string;
  role_detail: string;
  ownership_share: string;
  is_primary: boolean;
  notes: string;
};

type RelationshipForm = {
  company_id_to: string;
  relationship_type_code: string;
  ownership_percentage: string;
  is_current: boolean;
  notes: string;
};

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

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-bold text-[#1f2937]">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
          {description}
        </p>
      </div>
      <div className="space-y-5 px-5 py-5">{children}</div>
    </section>
  );
}

function Notice({
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

function formatPercent(value: number | null) {
  if (value === null || value === undefined) {
    return "-";
  }

  return `${value.toLocaleString(undefined, {
    maximumFractionDigits: 4,
  })}%`;
}

function firstRole(referenceData: PostgresCompanyRelationshipReferenceData) {
  return referenceData.companyRoles[0]?.code || "owner";
}

function firstRelationshipType(
  referenceData: PostgresCompanyRelationshipReferenceData
) {
  return referenceData.relationshipTypes[0]?.code || "ownership";
}

function initialRoleLinkForm(
  referenceData: PostgresCompanyRelationshipReferenceData
): RoleLinkForm {
  return {
    company_id: referenceData.companies[0]?.company_id || "",
    project_id: referenceData.projects[0]?.project_id || "",
    operating_asset_id: referenceData.operatingAssets[0]?.operating_asset_id || "",
    role_code: firstRole(referenceData),
    role_detail: "",
    ownership_share: "",
    is_primary: false,
    notes: "",
  };
}

function initialRelationshipForm(
  referenceData: PostgresCompanyRelationshipReferenceData,
  companyId: string
): RelationshipForm {
  const firstRelatedCompany = referenceData.companies.find(
    (company) => company.company_id !== companyId
  );

  return {
    company_id_to: firstRelatedCompany?.company_id || "",
    relationship_type_code: firstRelationshipType(referenceData),
    ownership_percentage: "",
    is_current: true,
    notes: "",
  };
}

function RoleOptions({
  value,
  onChange,
  referenceData,
}: {
  value: string;
  onChange: (value: string) => void;
  referenceData: PostgresCompanyRelationshipReferenceData;
}) {
  return (
    <select
      className={inputClass()}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {referenceData.companyRoles.map((role) => (
        <option key={role.code} value={role.code}>
          {role.label}
        </option>
      ))}
    </select>
  );
}

function RoleBadge({ role }: { role: string | null }) {
  return (
    <span className="inline-flex min-h-[28px] items-center border border-gray-200 bg-[#f7f7f7] px-2 text-xs font-semibold text-gray-700">
      {role || "unknown"}
    </span>
  );
}

function confirmStructuredRelationshipRemoval(description: string) {
  return window.confirm(
    `Remove ${description}? This removes the structured relationship from this record but does not delete the underlying project, plant/facility, or company.`
  );
}

function RemoveButton({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="h-8 border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      Remove
    </button>
  );
}

export function ProjectCompanyLinksPanel({
  projectId,
  links,
  referenceData,
}: {
  projectId: string;
  links: PostgresCompanyProjectLink[];
  referenceData: PostgresCompanyRelationshipReferenceData;
}) {
  const router = useRouter();
  const [form, setForm] = useState<RoleLinkForm>(() =>
    initialRoleLinkForm(referenceData)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/postgres-preview/company-project-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, project_id: projectId }),
      });
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to save company role.");
      }

      setForm(initialRoleLinkForm(referenceData));
      setMessage("Company role saved.");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to save company role."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(linkId: string) {
    const link = links.find(
      (companyLink) => companyLink.company_project_link_id === linkId
    );

    if (
      !confirmStructuredRelationshipRemoval(
        `the company role${link?.company_name ? ` for ${link.company_name}` : ""}`
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(
        `/api/postgres-preview/company-project-links/${linkId}`,
        { method: "DELETE" }
      );
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to remove company role.");
      }

      setMessage("Company role removed.");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to remove company role."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section
      title="Companies And Roles"
      description="Structured company-role links for this PostgreSQL staging project."
    >
      <Notice error={error} message={message} />
      <form className="grid grid-cols-1 gap-4 xl:grid-cols-5" onSubmit={handleSubmit}>
        <Field label="Company">
          <select
            className={inputClass()}
            value={form.company_id}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, company_id: event.target.value }))
            }
            required
          >
            {referenceData.companies.map((company) => (
              <option key={company.company_id} value={company.company_id}>
                {company.company_name}
                {company.headquarters_country
                  ? ` (${company.headquarters_country})`
                  : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Role">
          <RoleOptions
            referenceData={referenceData}
            value={form.role_code}
            onChange={(value) => setForm((prev) => ({ ...prev, role_code: value }))}
          />
        </Field>
        <Field label="Role Detail">
          <input
            className={inputClass()}
            value={form.role_detail}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, role_detail: event.target.value }))
            }
          />
        </Field>
        <Field label="Ownership %">
          <input
            className={inputClass()}
            value={form.ownership_share}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, ownership_share: event.target.value }))
            }
          />
        </Field>
        <button
          className="h-10 self-end border border-[#8dc63f] bg-[#8dc63f] px-4 text-sm font-semibold text-white hover:bg-[#78ad35] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving}
          type="submit"
        >
          {saving ? "Saving..." : "Add Role"}
        </button>
        <label className="flex min-h-10 items-center gap-2 self-end border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700">
          <input
            checked={form.is_primary}
            className="h-4 w-4 accent-[#8dc63f]"
            type="checkbox"
            onChange={(event) =>
              setForm((prev) => ({ ...prev, is_primary: event.target.checked }))
            }
          />
          Primary role
        </label>
        <div className="xl:col-span-4">
          <Field label="Notes">
            <input
              className={inputClass()}
              value={form.notes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, notes: event.target.value }))
              }
            />
          </Field>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed text-left text-sm">
          <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-[28%] px-4 py-3 font-semibold">Company</th>
              <th className="w-[16%] px-4 py-3 font-semibold">Role</th>
              <th className="w-[16%] px-4 py-3 font-semibold">Ownership</th>
              <th className="w-[24%] px-4 py-3 font-semibold">Notes</th>
              <th className="w-[16%] px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {links.map((link) => (
              <tr key={link.company_project_link_id} className="align-top">
                <td className="px-4 py-3">
                  <Link
                    href={`/postgres-preview/companies/${link.company_id}`}
                    className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                  >
                    {link.company_name}
                  </Link>
                  <div className="mt-1 text-xs text-gray-500">
                    {link.legacy_company_id || link.company_id}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <RoleBadge role={link.role_label || link.role_code} />
                  {link.is_primary ? (
                    <div className="mt-2 text-xs font-semibold text-[#4f7f1f]">
                      Primary
                    </div>
                  ) : null}
                  {link.role_detail ? (
                    <div className="mt-1 text-xs text-gray-500">
                      {link.role_detail}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {formatPercent(link.ownership_share)}
                </td>
                <td className="px-4 py-3 text-gray-700">{link.notes || "-"}</td>
                <td className="px-4 py-3">
                  <RemoveButton
                    disabled={saving}
                    onClick={() => handleDelete(link.company_project_link_id)}
                  />
                </td>
              </tr>
            ))}
            {links.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  No structured company roles linked yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

export function OperatingAssetCompanyLinksPanel({
  operatingAssetId,
  links,
  referenceData,
}: {
  operatingAssetId: string;
  links: PostgresCompanyOperatingAssetLink[];
  referenceData: PostgresCompanyRelationshipReferenceData;
}) {
  const router = useRouter();
  const [form, setForm] = useState<RoleLinkForm>(() =>
    initialRoleLinkForm(referenceData)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(
        "/api/postgres-preview/company-operating-asset-links",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            operating_asset_id: operatingAssetId,
          }),
        }
      );
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to save company role.");
      }

      setForm(initialRoleLinkForm(referenceData));
      setMessage("Company role saved.");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to save company role."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(linkId: string) {
    const link = links.find(
      (companyLink) => companyLink.company_operating_asset_link_id === linkId
    );

    if (
      !confirmStructuredRelationshipRemoval(
        `the company role${link?.company_name ? ` for ${link.company_name}` : ""}`
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(
        `/api/postgres-preview/company-operating-asset-links/${linkId}`,
        { method: "DELETE" }
      );
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to remove company role.");
      }

      setMessage("Company role removed.");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to remove company role."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section
      title="Companies And Roles"
      description="Structured company-role links for this PostgreSQL staging plant/facility."
    >
      <Notice error={error} message={message} />
      <form className="grid grid-cols-1 gap-4 xl:grid-cols-5" onSubmit={handleSubmit}>
        <Field label="Company">
          <select
            className={inputClass()}
            value={form.company_id}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, company_id: event.target.value }))
            }
            required
          >
            {referenceData.companies.map((company) => (
              <option key={company.company_id} value={company.company_id}>
                {company.company_name}
                {company.headquarters_country
                  ? ` (${company.headquarters_country})`
                  : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Role">
          <RoleOptions
            referenceData={referenceData}
            value={form.role_code}
            onChange={(value) => setForm((prev) => ({ ...prev, role_code: value }))}
          />
        </Field>
        <Field label="Role Detail">
          <input
            className={inputClass()}
            value={form.role_detail}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, role_detail: event.target.value }))
            }
          />
        </Field>
        <Field label="Ownership %">
          <input
            className={inputClass()}
            value={form.ownership_share}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, ownership_share: event.target.value }))
            }
          />
        </Field>
        <button
          className="h-10 self-end border border-[#8dc63f] bg-[#8dc63f] px-4 text-sm font-semibold text-white hover:bg-[#78ad35] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving}
          type="submit"
        >
          {saving ? "Saving..." : "Add Role"}
        </button>
        <label className="flex min-h-10 items-center gap-2 self-end border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700">
          <input
            checked={form.is_primary}
            className="h-4 w-4 accent-[#8dc63f]"
            type="checkbox"
            onChange={(event) =>
              setForm((prev) => ({ ...prev, is_primary: event.target.checked }))
            }
          />
          Primary role
        </label>
        <div className="xl:col-span-4">
          <Field label="Notes">
            <input
              className={inputClass()}
              value={form.notes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, notes: event.target.value }))
              }
            />
          </Field>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed text-left text-sm">
          <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-[28%] px-4 py-3 font-semibold">Company</th>
              <th className="w-[16%] px-4 py-3 font-semibold">Role</th>
              <th className="w-[16%] px-4 py-3 font-semibold">Ownership</th>
              <th className="w-[24%] px-4 py-3 font-semibold">Notes</th>
              <th className="w-[16%] px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {links.map((link) => (
              <tr key={link.company_operating_asset_link_id} className="align-top">
                <td className="px-4 py-3">
                  <Link
                    href={`/postgres-preview/companies/${link.company_id}`}
                    className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                  >
                    {link.company_name}
                  </Link>
                  <div className="mt-1 text-xs text-gray-500">
                    {link.legacy_company_id || link.company_id}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <RoleBadge role={link.role_label || link.role_code} />
                  {link.is_primary ? (
                    <div className="mt-2 text-xs font-semibold text-[#4f7f1f]">
                      Primary
                    </div>
                  ) : null}
                  {link.role_detail ? (
                    <div className="mt-1 text-xs text-gray-500">
                      {link.role_detail}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {formatPercent(link.ownership_share)}
                </td>
                <td className="px-4 py-3 text-gray-700">{link.notes || "-"}</td>
                <td className="px-4 py-3">
                  <RemoveButton
                    disabled={saving}
                    onClick={() =>
                      handleDelete(link.company_operating_asset_link_id)
                    }
                  />
                </td>
              </tr>
            ))}
            {links.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  No structured company roles linked yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function CompanyProjectPortfolio({
  companyId,
  links,
  referenceData,
}: {
  companyId: string;
  links: PostgresCompanyProjectLink[];
  referenceData: PostgresCompanyRelationshipReferenceData;
}) {
  const router = useRouter();
  const [form, setForm] = useState<RoleLinkForm>(() =>
    initialRoleLinkForm(referenceData)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/postgres-preview/company-project-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, company_id: companyId }),
      });
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to save project role.");
      }

      setForm(initialRoleLinkForm(referenceData));
      setMessage("Project role saved.");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to save project role."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(linkId: string) {
    const link = links.find(
      (projectLink) => projectLink.company_project_link_id === linkId
    );

    if (
      !confirmStructuredRelationshipRemoval(
        `the project role${link?.project_name ? ` for ${link.project_name}` : ""}`
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(
        `/api/postgres-preview/company-project-links/${linkId}`,
        { method: "DELETE" }
      );
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to remove project role.");
      }

      setMessage("Project role removed.");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to remove project role."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Notice error={error} message={message} />
      <form className="grid grid-cols-1 gap-4 xl:grid-cols-5" onSubmit={handleSubmit}>
        <Field label="Project">
          <select
            className={inputClass()}
            value={form.project_id}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, project_id: event.target.value }))
            }
            required
          >
            {referenceData.projects.map((project) => (
              <option key={project.project_id} value={project.project_id}>
                {project.project_name}
                {project.country ? ` (${project.country})` : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Role">
          <RoleOptions
            referenceData={referenceData}
            value={form.role_code}
            onChange={(value) => setForm((prev) => ({ ...prev, role_code: value }))}
          />
        </Field>
        <Field label="Role Detail">
          <input
            className={inputClass()}
            value={form.role_detail}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, role_detail: event.target.value }))
            }
          />
        </Field>
        <Field label="Ownership %">
          <input
            className={inputClass()}
            value={form.ownership_share}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, ownership_share: event.target.value }))
            }
          />
        </Field>
        <button
          className="h-10 self-end border border-[#8dc63f] bg-[#8dc63f] px-4 text-sm font-semibold text-white hover:bg-[#78ad35] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving}
          type="submit"
        >
          {saving ? "Saving..." : "Add Project Role"}
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed text-left text-sm">
          <tbody className="divide-y divide-gray-100">
            {links.map((link) => (
              <tr key={link.company_project_link_id} className="align-top">
                <td className="w-[34%] px-4 py-3">
                  <Link
                    href={`/postgres-preview/projects/${link.project_id}`}
                    className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                  >
                    {link.project_name}
                  </Link>
                  <div className="mt-1 text-xs text-gray-500">
                    {link.country || "-"}
                  </div>
                </td>
                <td className="w-[22%] px-4 py-3">
                  <RoleBadge role={link.role_label || link.role_code} />
                </td>
                <td className="w-[18%] px-4 py-3 text-gray-700">
                  {formatPercent(link.ownership_share)}
                </td>
                <td className="w-[16%] px-4 py-3 text-gray-700">
                  {link.is_primary ? "Primary" : "-"}
                </td>
                <td className="w-[10%] px-4 py-3">
                  <RemoveButton
                    disabled={saving}
                    onClick={() => handleDelete(link.company_project_link_id)}
                  />
                </td>
              </tr>
            ))}
            {links.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  No linked projects yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompanyAssetPortfolio({
  companyId,
  links,
  referenceData,
}: {
  companyId: string;
  links: PostgresCompanyOperatingAssetLink[];
  referenceData: PostgresCompanyRelationshipReferenceData;
}) {
  const router = useRouter();
  const [form, setForm] = useState<RoleLinkForm>(() =>
    initialRoleLinkForm(referenceData)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(
        "/api/postgres-preview/company-operating-asset-links",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, company_id: companyId }),
        }
      );
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to save plant/facility role.");
      }

      setForm(initialRoleLinkForm(referenceData));
      setMessage("Plant/facility role saved.");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save plant/facility role."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(linkId: string) {
    const link = links.find(
      (assetLink) => assetLink.company_operating_asset_link_id === linkId
    );

    if (
      !confirmStructuredRelationshipRemoval(
        `the plant/facility role${
          link?.asset_name ? ` for ${link.asset_name}` : ""
        }`
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(
        `/api/postgres-preview/company-operating-asset-links/${linkId}`,
        { method: "DELETE" }
      );
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to remove plant/facility role.");
      }

      setMessage("Plant/facility role removed.");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to remove plant/facility role."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Notice error={error} message={message} />
      <form className="grid grid-cols-1 gap-4 xl:grid-cols-5" onSubmit={handleSubmit}>
        <Field label="Plant / Facility">
          <select
            className={inputClass()}
            value={form.operating_asset_id}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                operating_asset_id: event.target.value,
              }))
            }
            required
          >
            {referenceData.operatingAssets.map((asset) => (
              <option key={asset.operating_asset_id} value={asset.operating_asset_id}>
                {asset.asset_name}
                {asset.country ? ` (${asset.country})` : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Role">
          <RoleOptions
            referenceData={referenceData}
            value={form.role_code}
            onChange={(value) => setForm((prev) => ({ ...prev, role_code: value }))}
          />
        </Field>
        <Field label="Role Detail">
          <input
            className={inputClass()}
            value={form.role_detail}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, role_detail: event.target.value }))
            }
          />
        </Field>
        <Field label="Ownership %">
          <input
            className={inputClass()}
            value={form.ownership_share}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, ownership_share: event.target.value }))
            }
          />
        </Field>
        <button
          className="h-10 self-end border border-[#8dc63f] bg-[#8dc63f] px-4 text-sm font-semibold text-white hover:bg-[#78ad35] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving}
          type="submit"
        >
          {saving ? "Saving..." : "Add Asset Role"}
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed text-left text-sm">
          <tbody className="divide-y divide-gray-100">
            {links.map((link) => (
              <tr
                key={link.company_operating_asset_link_id}
                className="align-top"
              >
                <td className="w-[34%] px-4 py-3">
                  <Link
                    href={`/postgres-preview/operating-assets/${link.operating_asset_id}`}
                    className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                  >
                    {link.asset_name}
                  </Link>
                  <div className="mt-1 text-xs text-gray-500">
                    {link.country || "-"}
                  </div>
                </td>
                <td className="w-[22%] px-4 py-3">
                  <RoleBadge role={link.role_label || link.role_code} />
                </td>
                <td className="w-[18%] px-4 py-3 text-gray-700">
                  {formatPercent(link.ownership_share)}
                </td>
                <td className="w-[16%] px-4 py-3 text-gray-700">
                  {link.is_primary ? "Primary" : "-"}
                </td>
                <td className="w-[10%] px-4 py-3">
                  <RemoveButton
                    disabled={saving}
                    onClick={() =>
                      handleDelete(link.company_operating_asset_link_id)
                    }
                  />
                </td>
              </tr>
            ))}
            {links.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  No linked plants/facilities yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CompanyRelationshipPanel({
  companyId,
  projectLinks,
  operatingAssetLinks,
  relationships,
  referenceData,
}: {
  companyId: string;
  projectLinks: PostgresCompanyProjectLink[];
  operatingAssetLinks: PostgresCompanyOperatingAssetLink[];
  relationships: PostgresCompanyRelationship[];
  referenceData: PostgresCompanyRelationshipReferenceData;
}) {
  const router = useRouter();
  const relatedCompanyOptions = useMemo(
    () =>
      referenceData.companies.filter((company) => company.company_id !== companyId),
    [companyId, referenceData.companies]
  );
  const [form, setForm] = useState<RelationshipForm>(() =>
    initialRelationshipForm(referenceData, companyId)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/postgres-preview/company-relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          company_id_from: companyId,
        }),
      });
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to save company relationship.");
      }

      setForm(initialRelationshipForm(referenceData, companyId));
      setMessage("Company relationship saved.");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save company relationship."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(relationshipId: string) {
    const relationship = relationships.find(
      (companyRelationship) =>
        companyRelationship.company_relationship_id === relationshipId
    );

    if (
      !confirmStructuredRelationshipRemoval(
        `the company relationship${
          relationship?.company_name_from && relationship.company_name_to
            ? ` between ${relationship.company_name_from} and ${relationship.company_name_to}`
            : ""
        }`
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(
        `/api/postgres-preview/company-relationships/${relationshipId}`,
        { method: "DELETE" }
      );
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to remove company relationship.");
      }

      setMessage("Company relationship removed.");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to remove company relationship."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section
      title="Relationships And Portfolios"
      description="Structured project, plant/facility, and company-relationship links for this PostgreSQL staging company."
    >
      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">
            Project Roles
          </h3>
          <CompanyProjectPortfolio
            companyId={companyId}
            links={projectLinks}
            referenceData={referenceData}
          />
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">
            Plant / Facility Roles
          </h3>
          <CompanyAssetPortfolio
            companyId={companyId}
            links={operatingAssetLinks}
            referenceData={referenceData}
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">
          Company Relationships
        </h3>
        <div className="mt-4 space-y-4">
          <Notice error={error} message={message} />
          <form
            className="grid grid-cols-1 gap-4 xl:grid-cols-5"
            onSubmit={handleSubmit}
          >
            <Field label="Related Company">
              <select
                className={inputClass()}
                value={form.company_id_to}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    company_id_to: event.target.value,
                  }))
                }
                required
              >
                {relatedCompanyOptions.map((company) => (
                  <option key={company.company_id} value={company.company_id}>
                    {company.company_name}
                    {company.headquarters_country
                      ? ` (${company.headquarters_country})`
                      : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Relationship Type">
              <select
                className={inputClass()}
                value={form.relationship_type_code}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    relationship_type_code: event.target.value,
                  }))
                }
              >
                {referenceData.relationshipTypes.map((type) => (
                  <option key={type.code} value={type.code}>
                    {type.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Ownership %">
              <input
                className={inputClass()}
                value={form.ownership_percentage}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    ownership_percentage: event.target.value,
                  }))
                }
              />
            </Field>
            <label className="flex min-h-10 items-center gap-2 self-end border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700">
              <input
                checked={form.is_current}
                className="h-4 w-4 accent-[#8dc63f]"
                type="checkbox"
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    is_current: event.target.checked,
                  }))
                }
              />
              Current
            </label>
            <button
              className="h-10 self-end border border-[#8dc63f] bg-[#8dc63f] px-4 text-sm font-semibold text-white hover:bg-[#78ad35] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving || relatedCompanyOptions.length === 0}
              type="submit"
            >
              {saving ? "Saving..." : "Add Relationship"}
            </button>
            <div className="xl:col-span-5">
              <Field label="Notes">
                <input
                  className={inputClass()}
                  value={form.notes}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                />
              </Field>
            </div>
          </form>

          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed text-left text-sm">
              <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="w-[26%] px-4 py-3 font-semibold">From</th>
                  <th className="w-[26%] px-4 py-3 font-semibold">To</th>
                  <th className="w-[16%] px-4 py-3 font-semibold">Type</th>
                  <th className="w-[14%] px-4 py-3 font-semibold">Ownership</th>
                  <th className="w-[10%] px-4 py-3 font-semibold">Current</th>
                  <th className="w-[8%] px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {relationships.map((relationship) => (
                  <tr
                    key={relationship.company_relationship_id}
                    className="align-top"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/postgres-preview/companies/${relationship.company_id_from}`}
                        className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                      >
                        {relationship.company_name_from}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/postgres-preview/companies/${relationship.company_id_to}`}
                        className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                      >
                        {relationship.company_name_to}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge
                        role={
                          relationship.relationship_type_label ||
                          relationship.relationship_type_code
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatPercent(relationship.ownership_percentage)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {relationship.is_current ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-3">
                      <RemoveButton
                        disabled={saving}
                        onClick={() =>
                          handleDelete(relationship.company_relationship_id)
                        }
                      />
                    </td>
                  </tr>
                ))}
                {relationships.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-gray-500"
                    >
                      No company relationships linked yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Section>
  );
}
