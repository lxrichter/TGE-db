"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import ActionButton from "@/components/ui/ActionButton";
import PhaseBadge from "@/components/ui/PhaseBadge";
import ResearchStatusBadge from "@/components/ui/ResearchStatusBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import { canEdit, type UserRole } from "@/lib/auth/roles";

type PlantRow = {
  plant_id: string;
  plant_name: string | null;
  country: string | null;
  region: string | null;
  owner_operator: string | null;
  installed_capacity_mw: number | null;
  project_phase: string | null;
  plant_technology: string | null;
  research_status: string | null;
  review_status: string | null;
  location_x?: number | null;
  location_y?: number | null;
  website_information?: string | null;
  created_by_user_id?: string | null;
  last_updated_by_user_id?: string | null;
  approved_by_user_id?: string | null;
  created_by_name?: string | null;
  last_updated_by_name?: string | null;
  approved_by_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  promoted_from_project_id?: string | null;
  promoted_at?: string | null;
};

type OpsPreset =
  | "all"
  | "pending_review"
  | "need_info"
  | "missing_coordinates"
  | "missing_mw"
  | "missing_source"
  | "missing_operator"
  | "promoted_from_project"
  | "my_records";

function ReviewStatusBadge({ value }: { value: string | null }) {
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

  return <StatusBadge tone="neutralSoft">{value || "NA"}</StatusBadge>;
}

function formatCount(value: number) {
  return Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
}

function formatMw(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined) return "NA";
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function normalizePlantPhase(value: string | null) {
  const raw = (value || "").trim();
  const normalized = raw.toLowerCase();

  if (!normalized) return "NA";
  if (normalized.includes("operat")) return "Operating";
  if (normalized.includes("construct")) return "Construction";
  if (normalized.includes("explor")) return "Exploration";
  if (normalized.includes("pre-feas")) return "Pre-Feasibility";
  if (normalized === "feasibility" || normalized.includes("feas")) return "Feasibility";
  if (normalized.includes("stall")) return "Stalled";
  if (normalized.includes("tbd")) return "TBD";
  if (normalized.includes("cancel")) return "Cancelled";

  return raw;
}

function isMissingCoordinates(row: PlantRow) {
  return row.location_x == null && row.location_y == null;
}

function isMissingMw(row: PlantRow) {
  return row.installed_capacity_mw == null;
}

function isMissingSource(row: PlantRow) {
  return !(row.website_information || "").trim();
}

function isMissingOperator(row: PlantRow) {
  return !(row.owner_operator || "").trim();
}

function isNeedInfo(row: PlantRow) {
  return (row.research_status || "").toLowerCase().includes("need");
}

function isPendingReview(row: PlantRow) {
  return (row.review_status || "").trim().toLowerCase() === "pending_review";
}

function isPromotedFromProject(row: PlantRow) {
  return Boolean((row.promoted_from_project_id || "").trim());
}

function buildFlags(row: PlantRow) {
  const flags: string[] = [];

  if (isMissingCoordinates(row)) flags.push("Missing Coordinates");
  if (isMissingMw(row)) flags.push("Missing MW");
  if (isMissingSource(row)) flags.push("Missing Source");
  if (isMissingOperator(row)) flags.push("Missing Operator");
  if (isNeedInfo(row)) flags.push("Need Info");
  if (isPendingReview(row)) flags.push("Pending Review");
  if (isPromotedFromProject(row)) flags.push("Promoted from Project");

  return flags;
}

type EditorActivityRow = {
  userKey: string;
  displayName: string;
  created: number;
  updated: number;
  approved: number;
  pendingReview: number;
  needInfo: number;
};

function buildEditorActivity(rows: Array<{
  created_by_user_id?: string | null;
  last_updated_by_user_id?: string | null;
  approved_by_user_id?: string | null;
  created_by_name?: string | null;
  last_updated_by_name?: string | null;
  approved_by_name?: string | null;
  review_status?: string | null;
  research_status?: string | null;
}>): EditorActivityRow[] {
  const map = new Map<string, EditorActivityRow>();

  function normalizeKey(value: string | null | undefined) {
    const trimmed = (value || "").trim();
    return trimmed || "__na__";
  }

  function normalizeDisplayName(
    userKey: string,
    value: string | null | undefined
  ) {
    const trimmed = (value || "").trim();

    if (trimmed) return trimmed;
    if (userKey === "__na__") return "NA";

    // fallback so real user activity never collapses into NA
    return userKey;
  }

  function ensure(userKey: string, displayName: string): EditorActivityRow {
    const existing = map.get(userKey);

    if (existing) {
      // if we previously had only a fallback value and now got a proper name, upgrade it
      if (
        existing.displayName === "NA" ||
        existing.displayName === userKey
      ) {
        if (displayName && displayName !== "NA") {
          existing.displayName = displayName;
        }
      }
      return existing;
    }

    const row: EditorActivityRow = {
      userKey,
      displayName,
      created: 0,
      updated: 0,
      approved: 0,
      pendingReview: 0,
      needInfo: 0,
    };

    map.set(userKey, row);
    return row;
  }

  for (const row of rows) {
    const createdKey = normalizeKey(row.created_by_user_id);
    const updatedKey = normalizeKey(row.last_updated_by_user_id);
    const approvedKey = normalizeKey(row.approved_by_user_id);

    const createdName = normalizeDisplayName(createdKey, row.created_by_name);
    const updatedName = normalizeDisplayName(updatedKey, row.last_updated_by_name);
    const approvedName = normalizeDisplayName(approvedKey, row.approved_by_name);

    const rowIsPendingReview =
      (row.review_status || "").trim().toLowerCase() === "pending_review";

    const rowIsNeedInfo =
      (row.research_status || "").toLowerCase().includes("need");

    ensure(createdKey, createdName).created += 1;
    ensure(updatedKey, updatedName).updated += 1;
    ensure(approvedKey, approvedName).approved += 1;

    if (rowIsPendingReview) ensure(createdKey, createdName).pendingReview += 1;
    if (rowIsNeedInfo) ensure(createdKey, createdName).needInfo += 1;
  }

  return Array.from(map.values()).sort((a, b) => {
    const scoreA = a.created + a.updated + a.approved;
    const scoreB = b.created + b.updated + b.approved;
    return scoreB - scoreA;
  });
}

export default function ResearchOpsPlantsPage() {
  const { data: session } = useSession();
  const currentRole = ((session?.user as { role?: UserRole } | undefined)?.role ??
    null) as UserRole | null;

  const userCanAccessResearchOps = canEdit(currentRole);

  const [plants, setPlants] = useState<PlantRow[]>([]);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("All Countries");
  const [phaseFilter, setPhaseFilter] = useState("All Phases");
  const [researchStatusFilter, setResearchStatusFilter] =
    useState("All Research Status");
  const [reviewStatusFilter, setReviewStatusFilter] =
    useState("All Review Status");
  const [opsPreset, setOpsPreset] = useState<OpsPreset>("all");
  const [editorFilter, setEditorFilter] = useState<{
    user: string;
    mode: "created" | "updated" | "approved" | "pending" | "need_info";
  } | null>(null);

  useEffect(() => {
    fetch("/api/plants")
      .then((res) => res.json())
      .then((data) => setPlants(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error("Failed to load research ops plants:", error);
        setPlants([]);
      });
  }, []);

  const countryOptions = useMemo(() => {
    const countries = Array.from(
      new Set(
        plants
          .map((p) => (p.country || "").trim())
          .filter((c) => c !== "")
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    return ["All Countries", ...countries];
  }, [plants]);

  const phaseOptions = useMemo(() => {
    const phases = Array.from(
      new Set(
        plants
          .map((p) => normalizePlantPhase(p.project_phase))
          .filter((phase) => phase !== "NA")
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    return ["All Phases", ...phases];
  }, [plants]);

  const researchStatusOptions = [
    "All Research Status",
    "Done",
    "In Progress",
    "Need Info",
    "NA",
  ];

  const reviewStatusOptions = useMemo(() => {
    const statuses = Array.from(
      new Set(
        plants
          .map((p) => (p.review_status || "").trim())
          .filter((status) => status !== "")
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    return ["All Review Status", ...statuses];
  }, [plants]);

  const stats = useMemo(() => {
    return {
      total: plants.length,
      pendingReview: plants.filter(isPendingReview).length,
      needInfo: plants.filter(isNeedInfo).length,
      missingCoordinates: plants.filter(isMissingCoordinates).length,
      missingMw: plants.filter(isMissingMw).length,
      missingSource: plants.filter(isMissingSource).length,
      missingOperator: plants.filter(isMissingOperator).length,
      promotedFromProject: plants.filter(isPromotedFromProject).length,
    };
  }, [plants]);

  const editorActivity = useMemo(() => {
  if (!plants.length) return [];

  const activity = buildEditorActivity(plants);
    if (activity.length > 0) return activity;

    return [
      {
        userKey: "__na__",
        displayName: "NA",
        created: plants.length,
        updated: 0,
        approved: 0,
        pendingReview: plants.filter(
          (row) => (row.review_status || "").trim().toLowerCase() === "pending_review"
        ).length,
        needInfo: plants.filter((row) =>
          (row.research_status || "").toLowerCase().includes("need")
        ).length,
      },
    ];
  }, [plants]);

  const filteredPlants = useMemo(() => {
    const query = search.trim().toLowerCase();

    let filtered = plants.filter((row) => {
      if (!query) return true;

      return [
        row.plant_id,
        row.plant_name,
        row.country,
        row.region,
        row.owner_operator,
        row.project_phase,
        row.plant_technology,
        row.research_status,
        row.review_status,
        row.website_information,
        row.promoted_from_project_id,
      ]
        .map((v) => (v ?? "").toString().toLowerCase())
        .some((v) => v.includes(query));
    });

    if (countryFilter !== "All Countries") {
      filtered = filtered.filter(
        (row) => (row.country || "").trim() === countryFilter
      );
    }

    if (phaseFilter !== "All Phases") {
      filtered = filtered.filter(
        (row) => normalizePlantPhase(row.project_phase) === phaseFilter
      );
    }

    function normalizeResearchStatus(value: string | null) {
      const v = (value || "").trim().toLowerCase();

      if (!v || v === "na" || v === "n/a") return "NA";
      if (v.includes("done")) return "Done";
      if (v.includes("progress")) return "In Progress";
      if (v.includes("need")) return "Need Info";

      return "NA";
    }

    if (researchStatusFilter !== "All Research Status") {
      filtered = filtered.filter(
        (row) => normalizeResearchStatus(row.research_status) === researchStatusFilter
      );
    }

    if (reviewStatusFilter !== "All Review Status") {
      filtered = filtered.filter(
        (row) => (row.review_status || "").trim() === reviewStatusFilter
      );
    }

    if (opsPreset === "pending_review") {
      filtered = filtered.filter(isPendingReview);
    } else if (opsPreset === "need_info") {
      filtered = filtered.filter(isNeedInfo);
    } else if (opsPreset === "missing_coordinates") {
      filtered = filtered.filter(isMissingCoordinates);
    } else if (opsPreset === "missing_mw") {
      filtered = filtered.filter(isMissingMw);
    } else if (opsPreset === "missing_source") {
      filtered = filtered.filter(isMissingSource);
    } else if (opsPreset === "missing_operator") {
      filtered = filtered.filter(isMissingOperator);
    } else if (opsPreset === "promoted_from_project") {
      filtered = filtered.filter(isPromotedFromProject);
    } else if (opsPreset === "my_records") {
      const myUserId = String((session?.user as { id?: string } | undefined)?.id || "").trim();
      filtered = filtered.filter(
        (row) => String(row.created_by_user_id || "").trim() === myUserId
      );
    }

if (editorFilter) {
  filtered = filtered.filter((row) => {
    const createdKey = (row.created_by_user_id || "").trim();
    const updatedKey = (row.last_updated_by_user_id || "").trim();
    const approvedKey = (row.approved_by_user_id || "").trim();

    if (editorFilter.mode === "created") {
      return createdKey === editorFilter.user;
    }

    if (editorFilter.mode === "updated") {
      return updatedKey === editorFilter.user;
    }

    if (editorFilter.mode === "approved") {
      return approvedKey === editorFilter.user;
    }

    if (editorFilter.mode === "pending") {
      return (
        createdKey === editorFilter.user &&
        (row.review_status || "").trim().toLowerCase() === "pending_review"
      );
    }

    if (editorFilter.mode === "need_info") {
      return (
        createdKey === editorFilter.user &&
        (row.research_status || "").toLowerCase().includes("need")
      );
    }

    return true;
  });
}

    return filtered.sort((a, b) =>
      String(a.plant_name || "").localeCompare(String(b.plant_name || ""), undefined, {
        sensitivity: "base",
        numeric: true,
      })
    );
  }, [
  plants,
  search,
  countryFilter,
  phaseFilter,
  researchStatusFilter,
  reviewStatusFilter,
  opsPreset,
  editorFilter,
  session,
]);

  if (!userCanAccessResearchOps) {
    return (
      <main className="space-y-8">
        <section className="border border-gray-200 bg-white">
          <div className="border-l-4 border-l-red-500 px-8 py-8">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-red-600">
              Research Ops / Plants
            </p>
            <h1 className="mt-3 text-5xl font-bold tracking-tight text-[#1f2937]">
              Access Restricted
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-gray-600">
              Plants Ops is available only to editors and administrators.
            </p>
            <div className="mt-6">
              <ActionButton href="/research-ops" variant="secondary">
                Back to Research Ops
              </ActionButton>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-8">
      <div className="px-2">
        <Link
          href="/research-ops"
          className="inline-flex items-center text-sm font-medium text-[#8dc63f] hover:underline"
        >
          ← Back to Research Ops Dashboard
        </Link>
      </div>

      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-8 py-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
                Research Ops / Plants
              </p>
              <h1 className="mt-3 text-5xl font-bold tracking-tight text-[#1f2937]">
                Plant Research Operations
              </h1>
              <p className="mt-4 max-w-4xl text-lg leading-8 text-gray-600">
                Operational queue for missing plant data, research follow-up,
                review workflow, and promoted-from-project visibility.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 xl:justify-end">
              <ActionButton href="/research-ops/projects" variant="secondary">
                Projects Ops
              </ActionButton>
              <ActionButton href="/research-ops/plants" variant="primary">
                Plants Ops
              </ActionButton>
              <ActionButton href="/research-ops/companies" variant="secondary">
                Companies Ops
              </ActionButton>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-[#f7f7f7] px-8 py-5">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <div
              onClick={() => setOpsPreset("all")}
              className={`cursor-pointer rounded border p-3 ${
                opsPreset === "all"
                  ? "border-[#8dc63f] bg-[#f3f9e8]"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Total Plants
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {formatCount(stats.total)}
              </div>
            </div>

            <div
              onClick={() => setOpsPreset("pending_review")}
              className={`cursor-pointer rounded border p-3 ${
                opsPreset === "pending_review"
                  ? "border-[#8dc63f] bg-[#f3f9e8]"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Pending Review
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {formatCount(stats.pendingReview)}
              </div>
            </div>

            <div
              onClick={() => setOpsPreset("need_info")}
              className={`cursor-pointer rounded border p-3 ${
                opsPreset === "need_info"
                  ? "border-[#8dc63f] bg-[#f3f9e8]"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Need Info
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {formatCount(stats.needInfo)}
              </div>
            </div>

            <div
              onClick={() => setOpsPreset("missing_coordinates")}
              className={`cursor-pointer rounded border p-3 ${
                opsPreset === "missing_coordinates"
                  ? "border-[#8dc63f] bg-[#f3f9e8]"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Missing Coordinates
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {formatCount(stats.missingCoordinates)}
              </div>
            </div>

            <div
              onClick={() => setOpsPreset("missing_mw")}
              className={`cursor-pointer rounded border p-3 ${
                opsPreset === "missing_mw"
                  ? "border-[#8dc63f] bg-[#f3f9e8]"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Missing MW
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {formatCount(stats.missingMw)}
              </div>
            </div>

            <div
              onClick={() => setOpsPreset("missing_source")}
              className={`cursor-pointer rounded border p-3 ${
                opsPreset === "missing_source"
                  ? "border-[#8dc63f] bg-[#f3f9e8]"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Missing Source
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {formatCount(stats.missingSource)}
              </div>
            </div>

            <div
              onClick={() => setOpsPreset("missing_operator")}
              className={`cursor-pointer rounded border p-3 ${
                opsPreset === "missing_operator"
                  ? "border-[#8dc63f] bg-[#f3f9e8]"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Missing Operator / Owner
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {formatCount(stats.missingOperator)}
              </div>
            </div>

            <div
              onClick={() => setOpsPreset("promoted_from_project")}
              className={`cursor-pointer rounded border p-3 ${
                opsPreset === "promoted_from_project"
                  ? "border-[#8dc63f] bg-[#f3f9e8]"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Promoted from Project
              </div>
              <div className="mt-1 text-3xl font-bold text-[#1f2937]">
                {formatCount(stats.promotedFromProject)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-[#1f2937]">
            Editor Activity
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Overview of record creation, updates, approvals, and workflow concentration by user. Click a number to filter the table below.
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-left text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="border-b border-gray-200 px-4 py-2">User</th>
                  <th className="border-b border-gray-200 px-4 py-2 text-center">Created</th>
                  <th className="border-b border-gray-200 px-4 py-2 text-center">Updated</th>
                  <th className="border-b border-gray-200 px-4 py-2 text-center">Approved</th>
                  <th className="border-b border-gray-200 px-4 py-2 text-center">Pending</th>
                  <th className="border-b border-gray-200 px-4 py-2 text-center">Need Info</th>
                </tr>
              </thead>

              <tbody>
                {editorActivity.map((row) => (
                  <tr key={row.userKey} className="hover:bg-gray-50">
                    <td className="border-b border-gray-100 px-4 py-2.5 text-sm text-gray-700">
                      {row.userKey === String((session?.user as { id?: string } | undefined)?.id || "").trim()
                        ? String((session?.user as { name?: string } | undefined)?.name || row.displayName || row.userKey || "NA")
                        : row.displayName || row.userKey || "NA"}
                    </td>

                    <td className="border-b border-gray-100 px-4 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => setEditorFilter({ user: row.userKey, mode: "created" })}
                        className="inline-flex min-w-[32px] items-center justify-center border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-[#1f2937] hover:border-[#8dc63f] hover:bg-[#f3f9e8] hover:text-[#8dc63f]"
                      >
                        {row.created}
                      </button>
                    </td>

                    <td className="border-b border-gray-100 px-4 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => setEditorFilter({ user: row.userKey, mode: "updated" })}
                        className="inline-flex min-w-[32px] items-center justify-center border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-[#1f2937] hover:border-[#8dc63f] hover:bg-[#f3f9e8] hover:text-[#8dc63f]"
                      >
                        {row.updated}
                      </button>
                    </td>

                    <td className="border-b border-gray-100 px-4 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => setEditorFilter({ user: row.userKey, mode: "approved" })}
                        className="inline-flex min-w-[32px] items-center justify-center border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-[#1f2937] hover:border-[#8dc63f] hover:bg-[#f3f9e8] hover:text-[#8dc63f]"
                      >
                        {row.approved}
                      </button>
                    </td>

                    <td className="border-b border-gray-100 px-4 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => setEditorFilter({ user: row.userKey, mode: "pending" })}
                        className="inline-flex min-w-[32px] items-center justify-center border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-[#1f2937] hover:border-[#8dc63f] hover:bg-[#f3f9e8] hover:text-[#8dc63f]"
                      >
                        {row.pendingReview}
                      </button>
                    </td>

                    <td className="border-b border-gray-100 px-4 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => setEditorFilter({ user: row.userKey, mode: "need_info" })}
                        className="inline-flex min-w-[32px] items-center justify-center border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-[#1f2937] hover:border-[#8dc63f] hover:bg-[#f3f9e8] hover:text-[#8dc63f]"
                      >
                        {row.needInfo}
                      </button>
                    </td>
                  </tr>
                ))}

                {editorActivity.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                      No editor activity available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {editorFilter && (
        <div className="flex items-center justify-between rounded border border-[#8dc63f] bg-[#f3f9e8] px-4 py-3 text-sm">
          <div className="text-[#1f2937]">
            Editor filter active:
            <span className="ml-2 font-semibold">
              {editorFilter.user === String((session?.user as { id?: string } | undefined)?.id || "").trim()
                ? String((session?.user as { name?: string } | undefined)?.name || editorFilter.user || "NA")
                : editorActivity.find((x) => x.userKey === editorFilter.user)?.displayName || editorFilter.user || "NA"} / {editorFilter.mode}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setEditorFilter(null)}
            className="font-medium text-[#1f2937] underline"
          >
            Clear
          </button>
        </div>
      )}

      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-[#1f2937]">
            Plant Ops Queue
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Filter operationally relevant plants and jump directly into editing.
          </p>
        </div>

        <div className="space-y-3 border-b border-gray-200 bg-[#f7f7f7] px-6 py-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                Ops Preset
              </label>
              <select
                value={opsPreset}
                onChange={(e) => setOpsPreset(e.target.value as OpsPreset)}
                className="w-full border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#8dc63f]"
              >
                <option value="all">All</option>
                <option value="pending_review">Pending Review</option>
                <option value="need_info">Need Info</option>
                <option value="missing_coordinates">Missing Coordinates</option>
                <option value="missing_mw">Missing MW</option>
                <option value="missing_source">Missing Source</option>
                <option value="missing_operator">Missing Operator / Owner</option>
                <option value="promoted_from_project">Promoted from Project</option>
                <option value="my_records">My Records</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                Country
              </label>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="w-full border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#8dc63f]"
              >
                {countryOptions.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                Phase
              </label>
              <select
                value={phaseFilter}
                onChange={(e) => setPhaseFilter(e.target.value)}
                className="w-full border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#8dc63f]"
              >
                {phaseOptions.map((phase) => (
                  <option key={phase} value={phase}>
                    {phase}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                Research Status
              </label>
              <select
                value={researchStatusFilter}
                onChange={(e) => setResearchStatusFilter(e.target.value)}
                className="w-full border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#8dc63f]"
              >
                {researchStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                Review Status
              </label>
              <select
                value={reviewStatusFilter}
                onChange={(e) => setReviewStatusFilter(e.target.value)}
                className="w-full border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#8dc63f]"
              >
                {reviewStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, name, country, operator, phase, source..."
            className="w-full border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#8dc63f]"
          />
        </div>

        <div className="px-6 pt-3">
          <p className="text-xs text-gray-500">
            Scroll horizontally to view all columns.
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-max">
            <table className="min-w-[1700px] text-left text-sm">
              <colgroup>
                <col className="w-[120px]" />
                <col className="w-[260px]" />
                <col className="w-[140px]" />
                <col className="w-[140px]" />
                <col className="w-[220px]" />
                <col className="w-[140px]" />
                <col className="w-[150px]" />
                <col className="w-[150px]" />
                <col className="w-[320px]" />
                <col className="w-[100px]" />
              </colgroup>

              <thead className="bg-gray-100 text-left text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="border-b border-gray-200 px-4 py-2">Plant ID</th>
                  <th className="border-b border-gray-200 px-4 py-2">Name</th>
                  <th className="border-b border-gray-200 px-4 py-2">Country</th>
                  <th className="border-b border-gray-200 px-4 py-2">Phase</th>
                  <th className="border-b border-gray-200 px-4 py-2">Owner / Operator</th>
                  <th className="border-b border-gray-200 px-4 py-2">Installed MW</th>
                  <th className="border-b border-gray-200 px-4 py-2">Research Status</th>
                  <th className="border-b border-gray-200 px-4 py-2">Review Status</th>
                  <th className="border-b border-gray-200 px-4 py-2">Ops Flags</th>
                  <th className="border-b border-gray-200 px-4 py-2">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredPlants.map((plant) => {
                  const flags = buildFlags(plant);

                  return (
                    <tr key={plant.plant_id} className="hover:bg-gray-50">
                      <td className="border-b border-gray-100 px-4 py-2.5 font-mono text-xs text-gray-500">
                        {plant.plant_id}
                      </td>

                      <td className="border-b border-gray-100 px-4 py-2.5">
                        <Link
                          href={`/plants/${plant.plant_id}`}
                          className="font-medium text-[#1f2937] underline decoration-gray-300 underline-offset-4 hover:text-[#8dc63f]"
                        >
                          {plant.plant_name || "NA"}
                        </Link>
                      </td>

                      <td className="border-b border-gray-100 px-4 py-2.5 text-gray-700">
                        {plant.country || "NA"}
                      </td>

                      <td className="border-b border-gray-100 px-4 py-2.5">
                        <PhaseBadge value={normalizePlantPhase(plant.project_phase)} />
                      </td>

                      <td className="border-b border-gray-100 px-4 py-2.5 text-gray-700">
                        <div className="max-w-[220px] break-words">
                          {plant.owner_operator || "NA"}
                        </div>
                      </td>

                      <td className="border-b border-gray-100 px-4 py-2.5 text-gray-700">
                        {formatMw(plant.installed_capacity_mw, 1)}
                      </td>

                      <td className="border-b border-gray-100 px-4 py-2.5">
                        <ResearchStatusBadge value={plant.research_status} />
                      </td>

                      <td className="border-b border-gray-100 px-4 py-2.5">
                        <ReviewStatusBadge value={plant.review_status} />
                      </td>

                      <td className="border-b border-gray-100 px-4 py-2.5">
                        <div className="flex flex-wrap gap-2">
                          {flags.length > 0 ? (
                            flags.map((flag) => (
                              <span
                                key={`${plant.plant_id}-${flag}`}
                                className="inline-flex border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-700"
                              >
                                {flag}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>

                      <td className="border-b border-gray-100 px-4 py-2.5">
                        <Link
                          href={`/plants/${plant.plant_id}/edit`}
                          className="inline-flex min-h-[28px] items-center justify-center whitespace-nowrap border border-[#8dc63f] bg-[#8dc63f] px-3 py-1 text-[11px] font-semibold leading-none text-white hover:border-[#79b12f] hover:bg-[#79b12f]"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}

                {filteredPlants.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-8 text-center text-sm text-gray-500"
                    >
                      No plant records found for the current operational filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}