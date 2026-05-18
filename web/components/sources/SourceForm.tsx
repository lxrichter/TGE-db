"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import {
  type SourceDetail,
  type SourceFormReferenceData,
  type SourceLink,
} from "@/lib/services/sources";

type InitialLinkTarget = {
  entity_type: SourceLink["entity_type"];
  entity_id: string;
  label: string;
};

type SourceFormValues = {
  source_type_code: string;
  title: string;
  url: string;
  source_reference: string;
  publisher: string;
  author_organization: string;
  country: string;
  language_code: string;
  visibility_code: string;
  credibility_status_code: string;
  published_date: string;
  accessed_at: string;
  notes: string;
  extracted_summary: string;
  relevant_excerpt: string;
  attachment_url: string;
  duplicate_source_flag: boolean;
};

type SourceLinkFormValues = {
  entity_type: SourceLink["entity_type"];
  entity_id: string;
  evidence_type: string;
  evidence_note: string;
  confidence_status_code: string;
  linked_field: string;
  claim_text: string;
  extracted_value: string;
  is_primary_evidence: boolean;
};

function toDatetimeLocal(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 16);
}

function initialSourceValues(source?: SourceDetail | null): SourceFormValues {
  return {
    source_type_code: source?.source_type_code || "web",
    title: source?.title || "",
    url: source?.url || "",
    source_reference: source?.source_reference || "",
    publisher: source?.publisher || "",
    author_organization: source?.author_organization || "",
    country: source?.country || "",
    language_code: source?.language_code || "",
    visibility_code: source?.visibility_code || "public",
    credibility_status_code: source?.credibility_status_code || "needs_review",
    published_date: source?.published_date || "",
    accessed_at: toDatetimeLocal(source?.accessed_at),
    notes: source?.notes || "",
    extracted_summary: source?.extracted_summary || "",
    relevant_excerpt: source?.relevant_excerpt || "",
    attachment_url: source?.attachment_url || "",
    duplicate_source_flag: Boolean(source?.duplicate_source_flag),
  };
}

function initialLinkValues(): SourceLinkFormValues {
  return {
    entity_type: "project",
    entity_id: "",
    evidence_type: "",
    evidence_note: "",
    confidence_status_code: "unknown",
    linked_field: "",
    claim_text: "",
    extracted_value: "",
    is_primary_evidence: false,
  };
}

async function safeJson(res: Response) {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
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

function inputClass() {
  return "min-h-10 border border-gray-300 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-[#1f2937] outline-none focus:border-[#8dc63f]";
}

function TextInput({
  name,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  name: keyof SourceFormValues;
  value: string;
  onChange: (name: keyof SourceFormValues, value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      className={inputClass()}
      name={name}
      placeholder={placeholder}
      type={type}
      value={value}
      onChange={(event) => onChange(name, event.target.value)}
    />
  );
}

function TextArea({
  name,
  value,
  onChange,
  placeholder,
}: {
  name: keyof SourceFormValues;
  value: string;
  onChange: (name: keyof SourceFormValues, value: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      className={`${inputClass()} min-h-[110px] resize-y`}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(name, event.target.value)}
    />
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

function formatEntityType(value: SourceLink["entity_type"]) {
  if (value === "operating_asset") {
    return "Plant / Facility";
  }

  if (value === "project") {
    return "Project";
  }

  return "Company";
}

function SourceLinkManager({
  source,
  referenceData,
}: {
  source: SourceDetail;
  referenceData: SourceFormReferenceData;
}) {
  const router = useRouter();
  const [linkForm, setLinkForm] = useState<SourceLinkFormValues>(
    initialLinkValues
  );
  const [savingLink, setSavingLink] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [linkMessage, setLinkMessage] = useState("");

  const targets = useMemo(
    () =>
      referenceData.linkTargets.filter(
        (target) => target.entity_type === linkForm.entity_type
      ),
    [linkForm.entity_type, referenceData.linkTargets]
  );

  async function handleAddLink(event: FormEvent) {
    event.preventDefault();
    setSavingLink(true);
    setLinkError("");
    setLinkMessage("");

    try {
      const res = await fetch("/api/postgres/source-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...linkForm,
          source_id: source.source_id,
        }),
      });
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to link source.");
      }

      setLinkForm(initialLinkValues());
      setLinkMessage("Source link added.");
      router.refresh();
    } catch (error) {
      setLinkError(error instanceof Error ? error.message : "Failed to link source.");
    } finally {
      setSavingLink(false);
    }
  }

  async function handleDeleteLink(linkId: string) {
    setSavingLink(true);
    setLinkError("");
    setLinkMessage("");

    try {
      const res = await fetch(`/api/postgres/source-links/${linkId}`, {
        method: "DELETE",
      });
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to remove source link.");
      }

      setLinkMessage("Source link removed.");
      router.refresh();
    } catch (error) {
      setLinkError(
        error instanceof Error ? error.message : "Failed to remove source link."
      );
    } finally {
      setSavingLink(false);
    }
  }

  return (
    <Section title="Linked Evidence">
      <div className="space-y-5">
        {linkError ? (
          <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {linkError}
          </div>
        ) : null}
        {linkMessage ? (
          <div className="border border-[#b9d98b] bg-[#f1f8e8] px-4 py-3 text-sm font-medium text-[#3f6f19]">
            {linkMessage}
          </div>
        ) : null}

        <form className="grid grid-cols-1 gap-4 xl:grid-cols-4" onSubmit={handleAddLink}>
          <Field label="Entity Type">
            <select
              className={inputClass()}
              value={linkForm.entity_type}
              onChange={(event) =>
                setLinkForm((prev) => ({
                  ...prev,
                  entity_type: event.target.value as SourceLink["entity_type"],
                  entity_id: "",
                }))
              }
            >
              <option value="project">Project</option>
              <option value="operating_asset">Plant / Facility</option>
              <option value="company">Company</option>
            </select>
          </Field>

          <Field label="Record">
            <select
              className={inputClass()}
              value={linkForm.entity_id}
              onChange={(event) =>
                setLinkForm((prev) => ({ ...prev, entity_id: event.target.value }))
              }
              required
            >
              <option value="">Select record</option>
              {targets.map((target) => (
                <option key={target.entity_id} value={target.entity_id}>
                  {target.label} {target.country ? `(${target.country})` : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Confidence">
            <select
              className={inputClass()}
              value={linkForm.confidence_status_code}
              onChange={(event) =>
                setLinkForm((prev) => ({
                  ...prev,
                  confidence_status_code: event.target.value,
                }))
              }
            >
              {referenceData.confidenceStatuses.map((status) => (
                <option key={status.code} value={status.code}>
                  {status.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Linked Field">
            <input
              className={inputClass()}
              placeholder="capacity, COD, owner..."
              value={linkForm.linked_field}
              onChange={(event) =>
                setLinkForm((prev) => ({
                  ...prev,
                  linked_field: event.target.value,
                }))
              }
            />
          </Field>

          <Field label="Evidence Type">
            <input
              className={inputClass()}
              placeholder="source, claim, confirmation..."
              value={linkForm.evidence_type}
              onChange={(event) =>
                setLinkForm((prev) => ({
                  ...prev,
                  evidence_type: event.target.value,
                }))
              }
            />
          </Field>

          <Field label="Extracted Value">
            <input
              className={inputClass()}
              placeholder="35 MWe, COD 2027..."
              value={linkForm.extracted_value}
              onChange={(event) =>
                setLinkForm((prev) => ({
                  ...prev,
                  extracted_value: event.target.value,
                }))
              }
            />
          </Field>

          <label className="flex min-h-10 items-center gap-2 self-end border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700">
            <input
              checked={linkForm.is_primary_evidence}
              className="h-4 w-4 accent-[#8dc63f]"
              type="checkbox"
              onChange={(event) =>
                setLinkForm((prev) => ({
                  ...prev,
                  is_primary_evidence: event.target.checked,
                }))
              }
            />
            Primary evidence
          </label>

          <button
            className="h-10 self-end border border-[#8dc63f] bg-[#8dc63f] px-4 text-sm font-semibold text-white hover:bg-[#78ad35] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={savingLink}
            type="submit"
          >
            {savingLink ? "Saving..." : "Add Link"}
          </button>

          <div className="xl:col-span-2">
            <Field label="Claim Text">
              <textarea
                className={`${inputClass()} min-h-[86px] resize-y`}
                placeholder="What claim or data point does this source support?"
                value={linkForm.claim_text}
                onChange={(event) =>
                  setLinkForm((prev) => ({
                    ...prev,
                    claim_text: event.target.value,
                  }))
                }
              />
            </Field>
          </div>

          <div className="xl:col-span-2">
            <Field label="Evidence Note">
              <textarea
                className={`${inputClass()} min-h-[86px] resize-y`}
                placeholder="Internal note about this source-record link"
                value={linkForm.evidence_note}
                onChange={(event) =>
                  setLinkForm((prev) => ({
                    ...prev,
                    evidence_note: event.target.value,
                  }))
                }
              />
            </Field>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed text-left text-sm">
            <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
              <tr>
                <th className="w-[16%] px-4 py-3 font-semibold">Entity</th>
                <th className="w-[24%] px-4 py-3 font-semibold">Record</th>
                <th className="w-[16%] px-4 py-3 font-semibold">Field</th>
                <th className="w-[16%] px-4 py-3 font-semibold">Value</th>
                <th className="w-[16%] px-4 py-3 font-semibold">Confidence</th>
                <th className="w-[12%] px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {source.links.map((link) => (
                <tr key={link.entity_source_id} className="align-top">
                  <td className="px-4 py-3 text-gray-700">
                    {formatEntityType(link.entity_type)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[#1f2937]">
                      {link.entity_name || "Unnamed record"}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {link.legacy_id || link.entity_id}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {link.linked_field || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {link.extracted_value || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {link.confidence_status_code}
                    {link.is_primary_evidence ? (
                      <div className="mt-2 text-xs font-semibold text-[#4f7f1f]">
                        Primary
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="h-8 border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={savingLink}
                      type="button"
                      onClick={() => handleDeleteLink(link.entity_source_id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}

              {source.links.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    No linked records yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </Section>
  );
}

export default function SourceForm({
  mode,
  source,
  referenceData,
  initialLinkTarget,
}: {
  mode: "create" | "edit";
  source?: SourceDetail | null;
  referenceData: SourceFormReferenceData;
  initialLinkTarget?: InitialLinkTarget | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState<SourceFormValues>(() =>
    initialSourceValues(source)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function setField(name: keyof SourceFormValues, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        ...form,
        accessed_at: form.accessed_at
          ? new Date(form.accessed_at).toISOString()
          : null,
      };
      const res = await fetch(
        mode === "create"
          ? "/api/postgres/sources"
          : `/api/postgres/sources/${source?.source_id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = await safeJson(res);

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to save source.");
      }

      const sourceId = json.source.source_id as string;

      if (mode === "create" && initialLinkTarget) {
        const linkRes = await fetch("/api/postgres/source-links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source_id: sourceId,
            entity_type: initialLinkTarget.entity_type,
            entity_id: initialLinkTarget.entity_id,
            evidence_type: "record_source",
            evidence_note: "Linked during source creation from Research Ops.",
            confidence_status_code: "unknown",
            is_primary_evidence: true,
          }),
        });
        const linkJson = await safeJson(linkRes);

        if (!linkRes.ok || !linkJson?.success) {
          throw new Error(
            linkJson?.error || "Source saved, but linking the target record failed."
          );
        }
      }

      setMessage("Source saved.");
      router.push(`/sources/${sourceId}${initialLinkTarget ? "/edit" : ""}`);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save source.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
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
      {mode === "create" && initialLinkTarget ? (
        <div className="border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
          This source will be linked to{" "}
          <span className="font-semibold">{initialLinkTarget.label}</span> after
          creation.
        </div>
      ) : null}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <Section title="Source Identity">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Field label="Source Type">
              <select
                className={inputClass()}
                value={form.source_type_code}
                onChange={(event) => setField("source_type_code", event.target.value)}
              >
                {referenceData.sourceTypes.map((type) => (
                  <option key={type.code} value={type.code}>
                    {type.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Title">
              <TextInput
                name="title"
                placeholder="Source title"
                value={form.title}
                onChange={setField}
              />
            </Field>
            <Field label="Source Reference">
              <TextInput
                name="source_reference"
                placeholder="Citation, internal source ID, report reference"
                value={form.source_reference}
                onChange={setField}
              />
            </Field>
            <Field label="URL">
              <TextInput
                name="url"
                placeholder="https://..."
                value={form.url}
                onChange={setField}
              />
            </Field>
            <Field label="Publisher">
              <TextInput
                name="publisher"
                placeholder="Publisher"
                value={form.publisher}
                onChange={setField}
              />
            </Field>
            <Field label="Author / Organization">
              <TextInput
                name="author_organization"
                placeholder="Author or organization"
                value={form.author_organization}
                onChange={setField}
              />
            </Field>
          </div>
        </Section>

        <Section title="Classification And Review">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <Field label="Visibility">
              <select
                className={inputClass()}
                value={form.visibility_code}
                onChange={(event) => setField("visibility_code", event.target.value)}
              >
                {referenceData.visibilityLevels.map((visibility) => (
                  <option key={visibility.code} value={visibility.code}>
                    {visibility.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Credibility Status">
              <select
                className={inputClass()}
                value={form.credibility_status_code}
                onChange={(event) =>
                  setField("credibility_status_code", event.target.value)
                }
              >
                {referenceData.credibilityStatuses.map((status) => (
                  <option key={status.code} value={status.code}>
                    {status.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Country / Market">
              <TextInput
                name="country"
                placeholder="Country"
                value={form.country}
                onChange={setField}
              />
            </Field>
            <Field label="Language">
              <TextInput
                name="language_code"
                placeholder="en, es, tr..."
                value={form.language_code}
                onChange={setField}
              />
            </Field>
            <Field label="Published Date">
              <TextInput
                name="published_date"
                type="date"
                value={form.published_date}
                onChange={setField}
              />
            </Field>
            <Field label="Accessed At">
              <TextInput
                name="accessed_at"
                type="datetime-local"
                value={form.accessed_at}
                onChange={setField}
              />
            </Field>
            <label className="flex min-h-10 items-center gap-2 self-end border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700">
              <input
                checked={form.duplicate_source_flag}
                className="h-4 w-4 accent-[#8dc63f]"
                type="checkbox"
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    duplicate_source_flag: event.target.checked,
                  }))
                }
              />
              Duplicate suspected
            </label>
          </div>
        </Section>

        <Section title="Summary And Notes">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Field label="Extracted Summary">
              <TextArea
                name="extracted_summary"
                placeholder="Short source summary or extracted finding"
                value={form.extracted_summary}
                onChange={setField}
              />
            </Field>
            <Field label="Relevant Excerpt">
              <TextArea
                name="relevant_excerpt"
                placeholder="Short relevant excerpt or data point"
                value={form.relevant_excerpt}
                onChange={setField}
              />
            </Field>
            <Field label="Internal Notes">
              <TextArea
                name="notes"
                placeholder="Research notes, caveats, source quality context"
                value={form.notes}
                onChange={setField}
              />
            </Field>
            <Field label="Attachment URL">
              <TextInput
                name="attachment_url"
                placeholder="Internal attachment URL or future file reference"
                value={form.attachment_url}
                onChange={setField}
              />
            </Field>
          </div>
        </Section>

        <div className="flex flex-wrap items-center gap-3">
          <button
            className="inline-flex h-10 items-center justify-center border border-[#8dc63f] bg-[#8dc63f] px-5 text-sm font-semibold text-white hover:bg-[#78ad35] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving}
            type="submit"
          >
            {saving ? "Saving..." : mode === "create" ? "Create Source" : "Save Source"}
          </button>
          <Link
            href={source ? `/sources/${source.source_id}` : "/sources"}
            className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
          >
            Cancel
          </Link>
        </div>
      </form>

      {mode === "edit" && source ? (
        <SourceLinkManager source={source} referenceData={referenceData} />
      ) : null}
    </div>
  );
}
