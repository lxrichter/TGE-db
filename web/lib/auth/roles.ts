export type UserRole =
  | "viewer"
  | "editor"
  | "editor_export" // Editor+
  | "administrator";

/**
 * -----------------------------
 * BASIC CAPABILITIES (EXISTING)
 * -----------------------------
 */

export function canEdit(role?: UserRole | null) {
  return (
    role === "editor" ||
    role === "editor_export" ||
    role === "administrator"
  );
}

export function canExport(role?: UserRole | string | null) {
  return (
    role === "editor_export" ||
    role === "administrator" ||
    role === "admin" ||
    role === "editor_plus" ||
    role === "editor+"
  );
}

export function canPrint(role?: UserRole | null) {
  return role === "editor_export" || role === "administrator";
}

export function canPromoteProject(role?: UserRole | null) {
  return (
    role === "editor" ||
    role === "editor_export" ||
    role === "administrator"
  );
}

/**
 * Access to the general /admin page:
 * Editor, Editor+, Administrator
 */
export function canAccessAdmin(role?: UserRole | null) {
  return (
    role === "editor" ||
    role === "editor_export" ||
    role === "administrator"
  );
}

/**
 * Access to /admin/users:
 * Administrator only
 */
export function canManageUsers(role?: UserRole | null) {
  return role === "administrator";
}

export function canImport(role?: UserRole | null) {
  return role === "administrator";
}

/**
 * -----------------------------
 * NEW: REVIEW & APPROVAL CAPABILITIES
 * -----------------------------
 */

/**
 * Can access QA / review features
 */
export function canReview(role?: UserRole | null) {
  return role === "editor_export" || role === "administrator";
}

/**
 * Can approve records (general capability)
 */
export function canApprove(role?: UserRole | null) {
  return role === "editor_export" || role === "administrator";
}

/**
 * -----------------------------
 * NEW: WORKFLOW LOGIC
 * -----------------------------
 */

/**
 * Should a change trigger "pending_review"?
 *
 * Rule:
 * - Editor → YES
 * - Editor+ → NO
 * - Admin → NO
 */
export function shouldSetPendingReview(role?: UserRole | null) {
  return role === "editor";
}

/**
 * Can this user approve THIS record?
 *
 * Rules:
 * - No self-approval
 * - Editor+ can approve Editor work
 * - Editor+ cannot approve Editor+ work
 * - Admin can approve anything (except self)
 */
export function canApproveRecord(params: {
  role?: UserRole | null;
  currentUserId: string;
  createdByUserId?: string | null;
  lastUpdatedByUserId?: string | null;
  createdByRole?: UserRole | null;
  lastUpdatedByRole?: UserRole | null;
}) {
  const {
    role,
    currentUserId,
    createdByUserId,
    lastUpdatedByUserId,
    createdByRole,
    lastUpdatedByRole,
  } = params;

  if (!canApprove(role)) return false;

  // ❌ No self-approval
  if (
    currentUserId === createdByUserId ||
    currentUserId === lastUpdatedByUserId
  ) {
    return false;
  }

  // ✅ Admin can approve anything (except self)
  if (role === "administrator") return true;

  // ✅ Editor+ logic
  if (role === "editor_export") {
    // Only allow approving Editor work
    if (
      createdByRole === "editor" ||
      lastUpdatedByRole === "editor"
    ) {
      return true;
    }

    return false;
  }

  return false;
}