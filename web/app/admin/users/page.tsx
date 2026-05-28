import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

import { authOptions } from "@/lib/auth/auth";
import { canManageUsers } from "@/lib/auth/roles";
import { getUserSummary, listUsers } from "@/lib/db/users";
import ActionButton from "@/components/ui/ActionButton";
import UserManagementPanel from "@/components/admin/user-management-panel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatCount(value: number) {
  return value.toLocaleString();
}

function AccessMetric({
  label,
  value,
  note,
  tone = "default",
}: {
  label: string;
  value: number;
  note: string;
  tone?: "default" | "admin" | "active";
}) {
  const toneClass =
    tone === "admin"
      ? "border-[#d7e8bf] bg-[#f5faef]"
      : tone === "active"
        ? "border-[#b9d98b] bg-[#f1f8e8]"
        : "border-gray-200 bg-white";

  return (
    <div className={`border px-4 py-3 ${toneClass}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-[#1f2937]">
        {formatCount(value)}
      </div>
      <div className="mt-1 text-xs leading-5 text-gray-500">{note}</div>
    </div>
  );
}

function GovernanceRule({ title, text }: { title: string; text: string }) {
  return (
    <div className="border border-gray-200 bg-[#fafafa] px-4 py-3">
      <div className="text-sm font-bold text-[#1f2937]">{title}</div>
      <div className="mt-1 text-xs leading-5 text-gray-600">{text}</div>
    </div>
  );
}

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as { role?: string | null }).role;

  if (!canManageUsers(role)) {
    redirect("/");
  }

  const [users, userSummary] = await Promise.all([
    listUsers(),
    getUserSummary(),
  ]);

  return (
    <main className="space-y-6">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-[15px] font-medium text-[#8dc63f] transition hover:opacity-80"
        >
          <span aria-hidden="true">←</span>
          <span>Back to admin</span>
        </Link>
      </div>

      <section className="border border-gray-200 bg-white">
        <div className="border-l-4 border-l-[#8dc63f] px-8 py-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl">
              <div className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
                Admin
              </div>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#1f2937]">
                User Management
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-gray-600">
                Manage internal platform access, review current users, and
                assign Researcher, Editor, Senior Editor, and Admin roles.
              </p>
            </div>

            <div className="flex justify-start xl:justify-end">
              <ActionButton
                href="#add-user"
                variant="primary"
                className="min-w-[150px]"
              >
                Add User
              </ActionButton>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-[#f7f7f7] px-8 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-700">
            <span className="font-semibold uppercase tracking-wide text-gray-500">
              Scope
            </span>
            <span>User List</span>
            <span className="text-gray-300">|</span>
            <span>Create Users</span>
            <span className="text-gray-300">|</span>
            <span>Role Changes</span>
            <span className="text-gray-300">|</span>
            <span>Deactivation</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="border border-gray-200 bg-white">
          <div className="border-b border-gray-200 bg-[#f7f7f7] px-5 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[#6b8f2a]">
              Access Snapshot
            </div>
            <h2 className="mt-1 text-lg font-bold text-[#1f2937]">
              Administrator User Overview
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Quick visibility into active access before changing roles or
              creating new accounts.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5">
            <AccessMetric
              label="Total Users"
              value={userSummary.total}
              note="All stored users"
            />
            <AccessMetric
              label="Active Users"
              value={userSummary.active}
              note="Can sign in"
              tone="active"
            />
            <AccessMetric
              label="Admins"
              value={userSummary.admins}
              note="Full platform access"
              tone="admin"
            />
            <AccessMetric
              label="Editors"
              value={userSummary.editors}
              note="Review and approval roles"
            />
            <AccessMetric
              label="Researchers"
              value={userSummary.researchers}
              note="Research and draft roles"
            />
          </div>
        </section>

        <section className="border border-gray-200 bg-white">
          <div className="border-b border-gray-200 bg-[#f7f7f7] px-5 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[#6b8f2a]">
              Access Governance
            </div>
            <h2 className="mt-1 text-lg font-bold text-[#1f2937]">
              Admin Guardrails
            </h2>
          </div>
          <div className="space-y-3 p-4">
            <GovernanceRule
              title="Admin-only changes"
              text="Only administrators can create users, change roles, reset passwords, or deactivate access."
            />
            <GovernanceRule
              title="Current user protected"
              text="Administrators cannot deactivate their own active account from this screen."
            />
            <GovernanceRule
              title="History preserved"
              text="Deactivation removes login access, while historic edit and review metadata remain intact."
            />
          </div>
        </section>
      </section>

      <UserManagementPanel
        initialUsers={users}
        currentUserEmail={session.user.email}
      />
    </main>
  );
}
