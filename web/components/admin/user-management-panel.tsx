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
    ? "border border-[#b7df72] bg-[#eef8dc] text-[#2e6b1f]"
    : "border border-gray-300 bg-gray-100 text-gray-500";
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
        <section className="border border-gray-200 bg-white">
          <div className="border-b border-gray-200 bg-[#f7f7f7] px-6 py-4">
            <h2 className="text-xl font-bold text-[#1f2937]">Current Users</h2>
            <p className="mt-1 text-sm text-gray-500">
              Active and inactive users currently stored in the platform.
            </p>
          </div>

          <div className="border-b border-gray-200 bg-white px-5 py-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_170px_150px_auto]">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Search Users
                </label>
                <input
                  type="search"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Name, email, or role..."
                  className="h-[38px] w-full border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#8dc63f]"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Role
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                  className="h-[38px] w-full border border-gray-300 bg-white px-3 text-sm text-[#1f2937] outline-none focus:border-[#8dc63f]"
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
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="h-[38px] w-full border border-gray-300 bg-white px-3 text-sm text-[#1f2937] outline-none focus:border-[#8dc63f]"
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
                  className="inline-flex h-[38px] w-full items-center justify-center border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45 lg:w-auto"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="mt-3 text-xs font-medium text-gray-500">
              Showing {filteredUsers.length.toLocaleString()} of{" "}
              {users.length.toLocaleString()} users
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-white text-left">
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Name
                  </th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Email
                  </th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Role
                  </th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Created
                  </th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
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
                      className={`border-b border-gray-200 last:border-b-0 ${
                        user.is_active === 0 ? "bg-gray-50" : "bg-white"
                      }`}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-[#1f2937]">
                        {user.name}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.email}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        <select
                          value={user.role}
                          disabled={user.is_active === 0 || isPending}
                          onChange={(e) =>
                            handleRoleChange(
                              user.user_id,
                              e.target.value as CanonicalUserRole
                            )
                          }
                          className="min-w-[140px] border border-gray-300 bg-white px-3 py-2 text-sm text-[#1f2937] outline-none focus:border-[#8dc63f]"
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

                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>

                      <td className="px-6 py-4">
                        {user.is_active === 1 ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(user)}
                              disabled={isPending}
                              className="inline-flex h-[30px] min-w-[68px] items-center justify-center border border-gray-300 bg-white px-3 text-[12px] font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Edit
                            </button>

                            {isCurrentUser ? (
                              <span className="text-[12px] font-medium text-gray-400">
                                Current user
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeactivateUserId(user.user_id)}
                                disabled={isPending}
                                className="inline-flex h-[30px] min-w-[92px] items-center justify-center border border-red-200 bg-red-50 px-3 text-[12px] font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
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
                            className="inline-flex h-[30px] min-w-[92px] items-center justify-center border border-[#b7df72] bg-[#eef8dc] px-3 text-[12px] font-semibold text-[#2e6b1f] transition hover:bg-[#e2f2c7] disabled:cursor-not-allowed disabled:opacity-60"
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
                      className="px-6 py-8 text-center text-sm text-gray-500"
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
          <section id="add-user" className="border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-[#f7f7f7] px-6 py-4">
              <h2 className="text-xl font-bold text-[#1f2937]">Add User</h2>
              <p className="mt-1 text-sm text-gray-500">
                Create a new internal user with a temporary password.
              </p>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 px-5 py-5">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#8dc63f]"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#8dc63f]"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Temporary Password
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#8dc63f]"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value as CanonicalUserRole)
                  }
                  className="w-full border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#8dc63f]"
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {error ? (
                <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="border border-[#d6e8b5] bg-[#f4faea] px-4 py-3 text-sm text-[#4d6b16]">
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

          <section className="border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-[#f7f7f7] px-6 py-4">
              <h2 className="text-xl font-bold text-[#1f2937]">
                Role Reference
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                MVP role logic used across the platform.
              </p>
            </div>

            <div className="space-y-2 px-5 py-4 text-sm leading-6 text-gray-600">
              {ROLE_OPTIONS.map((option, index) => (
                <div
                  key={option.value}
                  className={index < ROLE_OPTIONS.length - 1 ? "border-b border-gray-200 pb-2" : ""}
                >
                  <span className="font-semibold text-[#1f2937]">
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
          <div className="w-full max-w-[560px] border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-200 bg-[#f7f7f7] px-6 py-4">
              <h2 className="text-xl font-bold text-[#1f2937]">Edit User</h2>
              <p className="mt-1 text-sm text-gray-500">
                Update user details and optionally reset the password.
              </p>
            </div>

            <form onSubmit={handleEditUser} className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#8dc63f]"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Email
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  disabled
                  className="w-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) =>
                    setEditRole(e.target.value as CanonicalUserRole)
                  }
                  className="w-full border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#8dc63f]"
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Reset Password
                </label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  className="w-full border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#8dc63f]"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter a new temporary password only if you want to reset it.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="inline-flex h-[40px] items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
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
          <div className="w-full max-w-[520px] border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-200 bg-[#fff6f6] px-6 py-4">
              <h2 className="text-xl font-bold text-[#7f1d1d]">
                Deactivate User
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                This will remove login access, but historical edit information
                will remain unchanged in the database.
              </p>
            </div>

            <div className="space-y-4 px-6 py-5 text-sm leading-6 text-gray-600">
              <p>
                The user will no longer be able to sign in once deactivated.
              </p>
              <p>
                Existing records edited by this user will keep their historical
                metadata unchanged.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setDeactivateUserId(null)}
                className="inline-flex h-[40px] items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeactivate}
                disabled={isPending}
                className="inline-flex h-[40px] items-center justify-center border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Deactivating..." : "Deactivate User"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {reactivateUserId ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-[520px] border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-200 bg-[#f5faef] px-6 py-4">
              <h2 className="text-xl font-bold text-[#2e6b1f]">
                Reactivate User
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                This restores login access for the selected user account.
              </p>
            </div>

            <div className="space-y-4 px-6 py-5 text-sm leading-6 text-gray-600">
              <p>
                The user will be able to sign in again with their current
                password once reactivated.
              </p>
              <p>
                If the password should be changed, reactivate first and then use
                Edit to set a new temporary password.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setReactivateUserId(null)}
                className="inline-flex h-[40px] items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmReactivate}
                disabled={isPending}
                className="inline-flex h-[40px] items-center justify-center border border-[#b7df72] bg-[#eef8dc] px-4 text-sm font-semibold text-[#2e6b1f] transition hover:bg-[#e2f2c7] disabled:cursor-not-allowed disabled:opacity-60"
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
