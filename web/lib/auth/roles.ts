export type CanonicalUserRole =
  | "researcher"
  | "editor"
  | "senior_editor"
  | "admin";

export type LegacyUserRole =
  | "viewer"
  | "analyst"
  | "reviewer"
  | "editor_export"
  | "administrator"
  | "editor_plus"
  | "editor+";

export type UserRole = CanonicalUserRole | LegacyUserRole;

export type RoleOption = {
  value: CanonicalUserRole;
  label: string;
  description: string;
};

export const ROLE_OPTIONS: RoleOption[] = [
  {
    value: "researcher",
    label: "Researcher",
    description:
      "View internal records, create drafts, edit non-approved records, and submit records for validation.",
  },
  {
    value: "editor",
    label: "Editor",
    description:
      "Create and edit records, approve records, manage validation work, and run standard exports.",
  },
  {
    value: "senior_editor",
    label: "Senior Editor",
    description:
      "Senior editorial/review role with approval, export, and elevated workflow permissions.",
  },
  {
    value: "admin",
    label: "Admin",
    description:
      "Full internal access including user management, governance, and system settings.",
  },
];

export function normalizeUserRole(
  role?: UserRole | string | null
): CanonicalUserRole | null {
  switch (role) {
    case "researcher":
    case "viewer":
    case "analyst":
      return "researcher";
    case "editor":
      return "editor";
    case "senior_editor":
    case "reviewer":
    case "editor_export":
    case "editor_plus":
    case "editor+":
      return "senior_editor";
    case "admin":
    case "administrator":
      return "admin";
    default:
      return null;
  }
}

export function isUserRole(role: string): role is UserRole {
  return normalizeUserRole(role) !== null;
}

export function isCanonicalUserRole(role: string): role is CanonicalUserRole {
  return (
    role === "researcher" ||
    role === "editor" ||
    role === "senior_editor" ||
    role === "admin"
  );
}

export function getRoleLabel(role?: UserRole | string | null) {
  const normalized = normalizeUserRole(role);
  return (
    ROLE_OPTIONS.find((option) => option.value === normalized)?.label ||
    "Unknown"
  );
}

export function canViewInternalRecords(role?: UserRole | string | null) {
  return normalizeUserRole(role) !== null;
}

export function canCreateDraft(role?: UserRole | string | null) {
  return normalizeUserRole(role) !== null;
}

export function canEdit(role?: UserRole | string | null) {
  return normalizeUserRole(role) !== null;
}

export function canExport(role?: UserRole | string | null) {
  const normalized = normalizeUserRole(role);
  return (
    normalized === "editor" ||
    normalized === "senior_editor" ||
    normalized === "admin"
  );
}

export function canPrint(role?: UserRole | string | null) {
  return canExport(role);
}

export function canPromoteProject(role?: UserRole | string | null) {
  const normalized = normalizeUserRole(role);
  return (
    normalized === "editor" ||
    normalized === "senior_editor" ||
    normalized === "admin"
  );
}

export function canAccessAdmin(role?: UserRole | string | null) {
  const normalized = normalizeUserRole(role);
  return (
    normalized === "editor" ||
    normalized === "senior_editor" ||
    normalized === "admin"
  );
}

export function canManageUsers(role?: UserRole | string | null) {
  return normalizeUserRole(role) === "admin";
}

export function canManageVocabularies(role?: UserRole | string | null) {
  return normalizeUserRole(role) === "admin";
}

export function canImport(role?: UserRole | string | null) {
  return normalizeUserRole(role) === "admin";
}

export function canReview(role?: UserRole | string | null) {
  const normalized = normalizeUserRole(role);
  return (
    normalized === "editor" ||
    normalized === "senior_editor" ||
    normalized === "admin"
  );
}

export function canApprove(role?: UserRole | string | null) {
  return canReview(role);
}

export function shouldSetPendingReview(role?: UserRole | string | null) {
  return normalizeUserRole(role) === "researcher";
}

export function canApproveRecord(params: {
  role?: UserRole | string | null;
  currentUserId: string;
  createdByUserId?: string | null;
  lastUpdatedByUserId?: string | null;
  createdByRole?: UserRole | string | null;
  lastUpdatedByRole?: UserRole | string | null;
}) {
  const {
    role,
    currentUserId,
    createdByUserId,
    lastUpdatedByUserId,
    createdByRole,
    lastUpdatedByRole,
  } = params;

  const normalizedRole = normalizeUserRole(role);

  if (!canApprove(normalizedRole)) {
    return false;
  }

  if (
    currentUserId === createdByUserId ||
    currentUserId === lastUpdatedByUserId
  ) {
    return false;
  }

  if (normalizedRole === "admin") {
    return true;
  }

  const createdRole = normalizeUserRole(createdByRole);
  const updatedRole = normalizeUserRole(lastUpdatedByRole);

  if (normalizedRole === "senior_editor") {
    return createdRole !== "senior_editor" && updatedRole !== "senior_editor";
  }

  if (normalizedRole === "editor") {
    return createdRole === "researcher" || updatedRole === "researcher";
  }

  return false;
}
