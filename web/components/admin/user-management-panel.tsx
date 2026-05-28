"use client";

import { useMemo, useState, useTransition } from "react";
import ActionButton from "@/components/ui/ActionButton";
import {
  ROLE_OPTIONS,
  type CanonicalUserRole,
} from "@/lib/auth/roles";

type SafeUser = {
  user_id: string;
  name: string;
  email: string;
  role: CanonicalUserRole;
  is_active: number;
  created_at: string;
};

type RoleFilter = CanonicalUserRole | "all";
type StatusFilter = "all" | "active" | "inactive";

function statusLabel(isActive: number) {
  return isActive === 1 ? "Active" : "Inactive";
}

function statusClasses(isActive: number) {
  return isActive === 1
    ? "border border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] text-[var(--tge-governance-success-text)]"
    : "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] text-[var(--tge-governance-muted-text)]";
}

function formatDate(dateString?: string) {
  if (!dateString) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(dateString));
}

function roleLabel(role: CanonicalUserRole) {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label || role;
}

const ROLE_PERMISSION_ROWS: {
  capability: string;
  researcher: string;
  editor: string;
  senior_editor: string;
  admin: string;
}[] = [
  {
    capability: "View internal records",
    researcher: "Yes",
    editor: "Yes",
    senior_editor: "Yes",
    admin: "Yes",
  },
  {
    capability: "Create and edit drafts",
    researcher: "Yes",
    editor: "Yes",
    senior_editor: "Yes",
    admin: "Yes",
  },
  {
    capability: "Approve / review records",
    researcher: "No",
    editor: "Yes",
    senior_editor: "Yes",
    admin: "Yes",
  },
  {
    capability: "Run exports",
    researcher: "No",
    editor: "Yes",
    senior_editor: "Yes",
    admin: "Yes",
  },
  {
    capability: "Manage vocabularies",
    researcher: "No",
    editor: "No",
    senior_editor: "No",
    admin: "Yes",
  },
  {
    capability: "Manage users",
    researcher: "No",
    editor: "No",
    senior_editor: "No",
    admin: "Yes",
  },
];

const userAdminClass = {
  panel:
    "border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]",
  header:
    "border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)]",
  title: "text-[var(--tge-text-primary)]",
  body: "text-[var(--tge-text-secondary)]",
  muted: "text-[var(--tge-governance-muted-text)]",
  label:
    "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]",
  input:
    "border border-[var(--tge-border-strong)] bg-[var(--tge-surface-card)] text-[var(--tge-text-primary)] outline-none focus:border-[var(--tge-brand-green)]",
  secondaryButton:
    "border border-[var(--tge-border-strong)] bg-[var(--tge-surface-card)] text-[var(--tge-text-secondary)] transition hover:bg-[var(--tge-surface-subtle)] disabled:cursor-not-allowed disabled:opacity-45",
  successButton:
    "border border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] text-[var(--tge-governance-success-text)] transition hover:bg-[var(--tge-surface-subtle)] disabled:cursor-not-allowed disabled:opacity-60",
  dangerButton:
    "border border-[var(--tge-governance-danger-border)] bg-[var(--tge-governance-danger-bg)] text-[var(--tge-governance-danger-text)] transition hover:bg-[var(--tge-surface-subtle)] disabled:cursor-not-allowed disabled:opacity-60",
};

function RolePermissionValue({ value }: { value: string }) {
  const isAllowed = value === "Yes";

  return (
    <span
      className={
        isAllowed
          ? "inline-flex min-w-[44px] justify-center border border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] px-2 py-1 text-[11px] font-semibold text-[var(--tge-governance-success-text)]"
          : "inline-flex min-w-[44px] justify-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-2 py-1 text-[11px] font-semibold text-[var(--tge-governance-muted-text)]"
      }
    >
      {value}
    </span>
  );
}

export default function UserManagementPanel({
  initialUsers,
  currentUserEmail,
}: {
  initialUsers: SafeUser[];
  currentUserEmail?: string | null;
}) {
  const [users, setUsers] = useState<SafeUser[]>(initialUsers);
  const [isPending, startTransition] = useTransition();
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<CanonicalUserRole>("researcher");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [deactivateUserId, setDeactivateUserId] = useState<string | null>(null);
  const [reactivateUserId, setReactivateUserId] = useState<string | null>(null);

  const [editingUser, setEditingUser] = useState<SafeUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<CanonicalUserRole>("researcher");
  const [editPassword, setEditPassword] = useState("");

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        [user.name, user.email, user.role, roleLabel(user.role)]
          .map((value) => String(value ?? "").toLowerCase())
          .some((value) => value.includes(query));

      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.is_active === 1) ||
        (statusFilter === "inactive" && user.is_active === 0);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, statusFilter, userSearch, users]);

  const hasActiveFilters =
    userSearch.trim() !== "" || roleFilter !== "all" || statusFilter !== "all";

  function clearUserFilters() {
    setUserSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
  }

  async function refreshUsers() {
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    const data = await res.json();

    if (res.ok) {
      setUsers(data.users);
    }
  }

  async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    startTransition(async () => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not create user.");
        return;
      }

      setName("");
      setEmail("");
      setPassword("");
      setRole("researcher");
      setSuccess("User created successfully.");
      await refreshUsers();
    });
  }

  async function handleRoleChange(userId: string, nextRole: CanonicalUserRole) {
    setError("");
    setSuccess("");

    startTransition(async () => {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          role: nextRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not update role.");
        return;
      }

      setSuccess("Role updated.");
      await refreshUsers();
    });
  }

  function openEditModal(user: SafeUser) {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditPassword("");
    setError("");
    setSuccess("");
  }

  function closeEditModal() {
    setEditingUser(null);
    setEditName("");
    setEditRole("researcher");
    setEditPassword("");
  }

  async function handleEditUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!editingUser) return;

    setError("");
    setSuccess("");

    startTransition(async () => {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "edit",
          userId: editingUser.user_id,
          name: editName,
          role: editRole,
          password: editPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not update user.");
        return;
      }

      setSuccess(
        editPassword.trim()
          ? "User updated and password reset."
          : "User updated."
      );

      closeEditModal();
      await refreshUsers();
    });
  }

  async function confirmDeactivate() {
    if (!deactivateUserId) return;

    setError("");
    setSuccess("");

    startTransition(async () => {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: deactivateUserId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not deactivate user.");
        return;
      }

      setSuccess("User deactivated.");
      setDeactivateUserId(null);
      await refreshUsers();
    });
  }

  async function confirmReactivate() {
    if (!reactivateUserId) return;

    setError("");
    setSuccess("");

    startTransition(async () => {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "reactivate",
          userId: reactivateUserId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not reactivate user.");
        return;
      }

      setSuccess("User reactivated.");
      setReactivateUserId(null);
      await refreshUsers();
    });
  }

  return (
    <>
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.75fr]">
        <section className={userAdminClass.panel}>
          <div className={`${userAdminClass.header} px-6 py-4`}>
            <h2 className={`text-xl font-bold ${userAdminClass.title}`}>
              Current Users
            </h2>
            <p className={`mt-1 text-sm ${userAdminClass.muted}`}>
              Active and inactive users currently stored in the platform.
            </p>
          </div>

          <div className="border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-5 py-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_170px_150px_auto]">
              <div>
                <label className={userAdminClass.label}>
                  Search Users
                </label>
                <input
                  type="search"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Name, email, or role..."
                  className={`h-[38px] w-full px-3 text-sm ${userAdminClass.input}`}
                />
              </div>

              <div>
                <label className={userAdminClass.label}>
                  Role
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                  className={`h-[38px] w-full px-3 text-sm ${userAdminClass.input}`}
                >
                  <option value="all">All roles</option>
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={userAdminClass.label}>
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className={`h-[38px] w-full px-3 text-sm ${userAdminClass.input}`}
                >
                  <option value="all">All status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={clearUserFilters}
                  disabled={!hasActiveFilters}
                  className={`inline-flex h-[38px] w-full items-center justify-center px-3 text-sm font-semibold lg:w-auto ${userAdminClass.secondaryButton}`}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className={`mt-3 text-xs font-medium ${userAdminClass.muted}`}>
              Showing {filteredUsers.length.toLocaleString()} of{" "}
              {users.length.toLocaleString()} users
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] text-left">
                  <th className={`px-6 py-3 text-[11px] font-semibold uppercase tracking-wide ${userAdminClass.muted}`}>
                    Name
                  </th>
                  <th className={`px-6 py-3 text-[11px] font-semibold uppercase tracking-wide ${userAdminClass.muted}`}>
                    Email
                  </th>
                  <th className={`px-6 py-3 text-[11px] font-semibold uppercase tracking-wide ${userAdminClass.muted}`}>
                    Role
                  </th>
                  <th className={`px-6 py-3 text-[11px] font-semibold uppercase tracking-wide ${userAdminClass.muted}`}>
                    Status
                  </th>
                  <th className={`px-6 py-3 text-[11px] font-semibold uppercase tracking-wide ${userAdminClass.muted}`}>
                    Created
                  </th>
                  <th className={`px-6 py-3 text-[11px] font-semibold uppercase tracking-wide ${userAdminClass.muted}`}>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => {
                  const isCurrentUser =
                    currentUserEmail &&
                    user.email.toLowerCase() === currentUserEmail.toLowerCase();

                  return (
                    <tr
                      key={user.user_id}
                      className={`border-b border-[var(--tge-governance-neutral-border)] last:border-b-0 ${
                        user.is_active === 0
                          ? "bg-[var(--tge-surface-subtle)]"
                          : "bg-[var(--tge-surface-card)]"
                      }`}
                    >
                      <td className={`px-6 py-4 text-sm font-medium ${userAdminClass.title}`}>
                        {user.name}
                      </td>

                      <td className={`px-6 py-4 text-sm ${userAdminClass.body}`}>
                        {user.email}
                      </td>

                      <td className={`px-6 py-4 text-sm ${userAdminClass.body}`}>
                        <select
                          value={user.role}
                          disabled={user.is_active === 0 || isPending}
                          onChange={(e) =>
                            handleRoleChange(
                              user.user_id,
                              e.target.value as CanonicalUserRole
                            )
                          }
                          className={`min-w-[140px] px-3 py-2 text-sm ${userAdminClass.input}`}
                        >
                          {ROLE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusClasses(
                            user.is_active
                          )}`}
                        >
                          {statusLabel(user.is_active)}
                        </span>
                      </td>

                      <td className={`px-6 py-4 text-sm ${userAdminClass.muted}`}>
                        {formatDate(user.created_at)}
                      </td>

                      <td className="px-6 py-4">
                        {user.is_active === 1 ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(user)}
                              disabled={isPending}
                              className={`inline-flex h-[30px] min-w-[68px] items-center justify-center px-3 text-[12px] font-semibold ${userAdminClass.secondaryButton}`}
                            >
                              Edit
                            </button>

                            {isCurrentUser ? (
                              <span className={`text-[12px] font-medium ${userAdminClass.muted}`}>
                                Current user
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeactivateUserId(user.user_id)}
                                disabled={isPending}
                                className={`inline-flex h-[30px] min-w-[92px] items-center justify-center px-3 text-[12px] font-semibold ${userAdminClass.dangerButton}`}
                              >
                                Deactivate
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setReactivateUserId(user.user_id)}
                            disabled={isPending}
                            className={`inline-flex h-[30px] min-w-[92px] items-center justify-center px-3 text-[12px] font-semibold ${userAdminClass.successButton}`}
                          >
                            Reactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className={`px-6 py-8 text-center text-sm ${userAdminClass.muted}`}
                    >
                      {users.length === 0
                        ? "No users found."
                        : "No users match the current filters."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-6">
          <section id="add-user" className={userAdminClass.panel}>
            <div className={`${userAdminClass.header} px-6 py-4`}>
              <h2 className={`text-xl font-bold ${userAdminClass.title}`}>
                Add User
              </h2>
              <p className={`mt-1 text-sm ${userAdminClass.muted}`}>
                Create a new internal user with a temporary password.
              </p>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 px-5 py-5">
              <div>
                <label className={userAdminClass.label}>
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={`w-full px-4 py-2.5 text-sm ${userAdminClass.input}`}
                />
              </div>

              <div>
                <label className={userAdminClass.label}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`w-full px-4 py-2.5 text-sm ${userAdminClass.input}`}
                />
              </div>

              <div>
                <label className={userAdminClass.label}>
                  Temporary Password
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`w-full px-4 py-2.5 text-sm ${userAdminClass.input}`}
                />
              </div>

              <div>
                <label className={userAdminClass.label}>
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value as CanonicalUserRole)
                  }
                  className={`w-full px-4 py-2.5 text-sm ${userAdminClass.input}`}
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {error ? (
                <div className="border border-[var(--tge-governance-danger-border)] bg-[var(--tge-governance-danger-bg)] px-4 py-3 text-sm text-[var(--tge-governance-danger-text)]">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="border border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] px-4 py-3 text-sm text-[var(--tge-governance-success-text)]">
                  {success}
                </div>
              ) : null}

              <ActionButton
                type="submit"
                variant="primary"
                disabled={isPending}
                className="w-full"
              >
                {isPending ? "Saving..." : "Add User"}
              </ActionButton>
            </form>
          </section>

          <section className={userAdminClass.panel}>
            <div className={`${userAdminClass.header} px-6 py-4`}>
              <h2 className={`text-xl font-bold ${userAdminClass.title}`}>
                Role Reference
              </h2>
              <p className={`mt-1 text-sm ${userAdminClass.muted}`}>
                MVP role logic used across the platform.
              </p>
            </div>

            <div className="overflow-x-auto border-b border-[var(--tge-governance-neutral-border)]">
              <table className="min-w-full text-sm">
                <thead className="bg-[var(--tge-surface-card)] text-left text-[11px] uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
                  <tr>
                    <th className="border-b border-[var(--tge-governance-neutral-border)] px-4 py-3 font-semibold">
                      Capability
                    </th>
                    {ROLE_OPTIONS.map((option) => (
                      <th
                        key={option.value}
                        className="border-b border-[var(--tge-governance-neutral-border)] px-4 py-3 font-semibold"
                      >
                        {option.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROLE_PERMISSION_ROWS.map((row) => (
                    <tr key={row.capability} className="hover:bg-[var(--tge-surface-subtle)]">
                      <td className={`border-b border-[var(--tge-governance-neutral-border)] px-4 py-3 font-medium ${userAdminClass.title}`}>
                        {row.capability}
                      </td>
                      {ROLE_OPTIONS.map((option) => (
                        <td
                          key={option.value}
                          className="border-b border-[var(--tge-governance-neutral-border)] px-4 py-3"
                        >
                          <RolePermissionValue value={row[option.value]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={`space-y-2 px-5 py-4 text-sm leading-6 ${userAdminClass.body}`}>
              {ROLE_OPTIONS.map((option, index) => (
                <div
                  key={option.value}
                  className={
                    index < ROLE_OPTIONS.length - 1
                      ? "border-b border-[var(--tge-governance-neutral-border)] pb-2"
                      : ""
                  }
                >
                  <span className={`font-semibold ${userAdminClass.title}`}>
                    {option.label}:
                  </span>{" "}
                  {option.description}
                </div>
              ))}
            </div>
          </section>
        </section>
      </section>

      {editingUser ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 px-4">
          <div className={`w-full max-w-[560px] shadow-xl ${userAdminClass.panel}`}>
            <div className={`${userAdminClass.header} px-6 py-4`}>
              <h2 className={`text-xl font-bold ${userAdminClass.title}`}>
                Edit User
              </h2>
              <p className={`mt-1 text-sm ${userAdminClass.muted}`}>
                Update user details and optionally reset the password.
              </p>
            </div>

            <form onSubmit={handleEditUser} className="space-y-4 px-6 py-5">
              <div>
                <label className={userAdminClass.label}>
                  Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className={`w-full px-4 py-2.5 text-sm ${userAdminClass.input}`}
                />
              </div>

              <div>
                <label className={userAdminClass.label}>
                  Email
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  disabled
                  className="w-full border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-4 py-2.5 text-sm text-[var(--tge-governance-muted-text)] outline-none"
                />
              </div>

              <div>
                <label className={userAdminClass.label}>
                  Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) =>
                    setEditRole(e.target.value as CanonicalUserRole)
                  }
                  className={`w-full px-4 py-2.5 text-sm ${userAdminClass.input}`}
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={userAdminClass.label}>
                  Reset Password
                </label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  className={`w-full px-4 py-2.5 text-sm ${userAdminClass.input}`}
                />
                <p className={`mt-1 text-xs ${userAdminClass.muted}`}>
                  Enter a new temporary password only if you want to reset it.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className={`inline-flex h-[40px] items-center justify-center px-4 text-sm font-semibold ${userAdminClass.secondaryButton}`}
                >
                  Cancel
                </button>

                <ActionButton
                  type="submit"
                  variant="primary"
                  disabled={isPending}
                  className="h-[40px] min-w-[130px]"
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </ActionButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deactivateUserId ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 px-4">
          <div className={`w-full max-w-[520px] shadow-xl ${userAdminClass.panel}`}>
            <div className="border-b border-[var(--tge-governance-danger-border)] bg-[var(--tge-governance-danger-bg)] px-6 py-4">
              <h2 className="text-xl font-bold text-[var(--tge-governance-danger-text)]">
                Deactivate User
              </h2>
              <p className="mt-1 text-sm text-[var(--tge-governance-danger-text)]">
                This will remove login access, but historical edit information
                will remain unchanged in the database.
              </p>
            </div>

            <div className={`space-y-4 px-6 py-5 text-sm leading-6 ${userAdminClass.body}`}>
              <p>
                The user will no longer be able to sign in once deactivated.
              </p>
              <p>
                Existing records edited by this user will keep their historical
                metadata unchanged.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[var(--tge-governance-neutral-border)] px-6 py-4">
              <button
                type="button"
                onClick={() => setDeactivateUserId(null)}
                className={`inline-flex h-[40px] items-center justify-center px-4 text-sm font-semibold ${userAdminClass.secondaryButton}`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeactivate}
                disabled={isPending}
                className={`inline-flex h-[40px] items-center justify-center px-4 text-sm font-semibold ${userAdminClass.dangerButton}`}
              >
                {isPending ? "Deactivating..." : "Deactivate User"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {reactivateUserId ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 px-4">
          <div className={`w-full max-w-[520px] shadow-xl ${userAdminClass.panel}`}>
            <div className="border-b border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)] px-6 py-4">
              <h2 className="text-xl font-bold text-[var(--tge-governance-success-text)]">
                Reactivate User
              </h2>
              <p className="mt-1 text-sm text-[var(--tge-governance-success-text)]">
                This restores login access for the selected user account.
              </p>
            </div>

            <div className={`space-y-4 px-6 py-5 text-sm leading-6 ${userAdminClass.body}`}>
              <p>
                The user will be able to sign in again with their current
                password once reactivated.
              </p>
              <p>
                If the password should be changed, reactivate first and then use
                Edit to set a new temporary password.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[var(--tge-governance-neutral-border)] px-6 py-4">
              <button
                type="button"
                onClick={() => setReactivateUserId(null)}
                className={`inline-flex h-[40px] items-center justify-center px-4 text-sm font-semibold ${userAdminClass.secondaryButton}`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmReactivate}
                disabled={isPending}
                className={`inline-flex h-[40px] items-center justify-center px-4 text-sm font-semibold ${userAdminClass.successButton}`}
              >
                {isPending ? "Reactivating..." : "Reactivate User"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
