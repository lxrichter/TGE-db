"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import type { ReactNode } from "react";
import { canAccessAdmin, type UserRole } from "@/lib/auth/roles";
import GlobalCommandPalette from "@/components/search/GlobalCommandPalette";

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/postgres-preview") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavItem({
  href,
  label,
  pathname,
  prefetch = true,
}: {
  href: string;
  label: string;
  pathname: string;
  prefetch?: boolean;
}) {
  const isActive = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={`relative inline-flex h-[44px] items-center text-[15px] font-medium transition ${
        isActive ? "text-white" : "text-white/90 hover:text-[#8dc63f]"
      }`}
    >
      <span>{label}</span>
      {isActive ? (
        <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#8dc63f]" />
      ) : null}
    </Link>
  );
}

function NavGroup({
  label,
  children,
  isFirst = false,
}: {
  label: string;
  children: ReactNode;
  isFirst?: boolean;
}) {
  return (
    <div
      className={`flex shrink-0 flex-col gap-1 ${
        isFirst ? "" : "border-l border-white/15 pl-4"
      }`}
    >
      <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/45">
        {label}
      </div>
      <div className="flex items-center gap-4">{children}</div>
    </div>
  );
}

function UserContextBar({ showAdmin }: { showAdmin: boolean }) {
  const { data: session } = useSession();

  if (!session?.user) {
    return (
      <div className="border-b border-[#d6e8b5] bg-[#f3f8ea]">
        <div className="mx-auto flex h-[38px] max-w-[1600px] items-center justify-end px-8" />
      </div>
    );
  }

  const user = session.user as {
    name?: string | null;
    role?: string | null;
  };

  return (
    <div className="border-b border-[#d6e8b5] bg-[#f3f8ea]">
      <div className="mx-auto flex min-h-[38px] max-w-[1600px] flex-col gap-2 px-8 py-2 lg:flex-row lg:items-center lg:justify-between lg:py-0">
        <form
          action="/search"
          className="flex w-full max-w-lg items-center gap-2"
        >
          <input
            className="h-[28px] min-w-0 flex-1 border border-[#b7cf8b] bg-white px-3 text-[12px] font-medium text-[#1f2937] outline-none focus:border-[#8dc63f]"
            name="q"
            placeholder="Search projects, plants, companies, sources..."
            type="search"
          />
          <button
            className="h-[28px] border border-[#b7cf8b] bg-white px-3 text-[11px] font-semibold text-[#3f4a35] hover:bg-[#e9f3d8]"
            type="submit"
          >
            Search
          </button>
        </form>
        <GlobalCommandPalette showAdmin={showAdmin} />
        <div className="flex items-center gap-4 text-[12px]">
          <span className="font-medium text-[#1f2937]">
            {user.name || "User"}
          </span>

          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5e6b52]">
            {user.role || "viewer"}
          </span>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="inline-flex h-[26px] items-center justify-center border border-[#b7cf8b] bg-white px-3 text-[11px] font-medium text-[#3f4a35] transition hover:bg-[#e9f3d8]"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppHeaderShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as { role?: UserRole | string | null } | undefined)
    ?.role;
  const showAdmin = canAccessAdmin(role);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#8dc63f] bg-[#2a2a2a] text-white shadow-sm">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-8 px-8 py-4">
          <div className="flex min-w-0 items-center gap-5">
            <img
              src="/tge-logo-white.png"
              alt="ThinkGeoEnergy"
              className="h-10 w-auto shrink-0"
            />

            <div className="h-10 w-px bg-white/25" />

            <div className="min-w-0">
              <div className="truncate text-[15px] font-semibold leading-tight text-white">
                Geothermal Intelligence Platform
              </div>
              <div className="mt-1 truncate text-[13px] text-white/60">
                ThinkGeoEnergy - Research, evidence, markets, and governance
              </div>
            </div>
          </div>

          <nav className="flex min-w-0 items-end gap-4 overflow-x-auto text-sm">
            <NavGroup isFirst label="Intelligence / Research">
              <NavItem href="/" label="Dashboard" pathname={pathname} />
              <NavItem
                href="/postgres-preview/countries"
                label="Markets"
                pathname={pathname}
              />
              <NavItem
                href="/postgres-preview/analysis"
                label="Analysis"
                pathname={pathname}
              />
              <NavItem href="/postgres-preview/map" label="Map" pathname={pathname} />
              <NavItem
                href="/postgres-preview/projects"
                label="Projects"
                pathname={pathname}
              />
              <NavItem
                href="/postgres-preview/operating-assets"
                label="Plants / Facilities"
                pathname={pathname}
              />
              <NavItem
                href="/postgres-preview/companies"
                label="Companies"
                pathname={pathname}
              />
            </NavGroup>

            <NavGroup label="Research Operations">
              <NavItem
                href="/postgres-preview/research-ops"
                label="Research Ops"
                pathname={pathname}
              />
              <NavItem href="/sources" label="Sources" pathname={pathname} />
              <NavItem href="/sources/matches" label="Matches" pathname={pathname} />
              <NavItem href="/sources/facts" label="Facts" pathname={pathname} />
            </NavGroup>

            <NavGroup label="Platform / Admin">
              <NavItem href="/postgres-preview" label="Command" pathname={pathname} />
              <NavItem
                href="/postgres-preview/readiness"
                label="Readiness"
                pathname={pathname}
              />
              {showAdmin ? (
                <NavItem
                  href="/admin"
                  label="Admin"
                  pathname={pathname}
                  prefetch={false}
                />
              ) : null}
            </NavGroup>
          </nav>
        </div>
      </header>

      <UserContextBar showAdmin={showAdmin} />

      <div className="mx-auto max-w-[1600px] px-8 py-10">{children}</div>
    </>
  );
}
