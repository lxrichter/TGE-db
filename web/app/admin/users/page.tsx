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
      ? "border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)]"
      : tone === "active"
        ? "border-[var(--tge-governance-success-border)] bg-[var(--tge-governance-success-bg)]"
        : "border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]";

  return (
    <div className={`border px-4 py-3 ${toneClass}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-[var(--tge-text-primary)]">
        {formatCount(value)}
      </div>
      <div className="mt-1 text-xs leading-5 text-[var(--tge-governance-muted-text)]">
        {note}
      </div>
    </div>
  );
}

function GovernanceRule({ title, text }: { title: string; text: string }) {
  return (
    <div className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-4 py-3">
      <div className="text-sm font-bold text-[var(--tge-text-primary)]">
        {title}
      </div>
      <div className="mt-1 text-xs leading-5 text-[var(--tge-text-secondary)]">
        {text}
      </div>
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
          className="inline-flex items-center gap-2 text-[15px] font-medium text-[var(--tge-brand-green)] transition hover:text-[var(--tge-brand-green-dark)]"
        >
          <span aria-hidden="true">←</span>
          <span>Back to admin</span>
        </Link>
      </div>

      <section className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]">
        <div className="border-l-4 border-l-[var(--tge-brand-green)] px-8 py-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl">
              <div className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]">
                Admin
              </div>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-[var(--tge-text-primary)]">
                User Management
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--tge-text-secondary)]">
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

        <div className="border-t border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-8 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--tge-governance-neutral-text)]">
            <span className="font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
              Scope
            </span>
            <span>User List</span>
            <span className="text-[var(--tge-governance-muted-border)]">|</span>
            <span>Create Users</span>
            <span className="text-[var(--tge-governance-muted-border)]">|</span>
            <span>Role Changes</span>
            <span className="text-[var(--tge-governance-muted-border)]">|</span>
            <span>Deactivation</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]">
          <div className="border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-5 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-success-text)]">
              Access Snapshot
            </div>
            <h2 className="mt-1 text-lg font-bold text-[var(--tge-text-primary)]">
              Administrator User Overview
            </h2>
            <p className="mt-1 text-sm text-[var(--tge-governance-muted-text)]">
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

        <section className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]">
          <div className="border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-5 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-success-text)]">
              Access Governance
            </div>
            <h2 className="mt-1 text-lg font-bold text-[var(--tge-text-primary)]">
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
