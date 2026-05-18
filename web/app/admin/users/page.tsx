import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

import { authOptions } from "@/lib/auth/auth";
import { canManageUsers } from "@/lib/auth/roles";
import { listUsers } from "@/lib/db/users";
import ActionButton from "@/components/ui/ActionButton";
import UserManagementPanel from "@/components/admin/user-management-panel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as { role?: string | null }).role;

  if (!canManageUsers(role)) {
    redirect("/");
  }

  const users = await listUsers();

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

      <UserManagementPanel
        initialUsers={users}
        currentUserEmail={session.user.email}
      />
    </main>
  );
}
