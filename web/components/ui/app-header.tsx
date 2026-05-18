"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { canAccessAdmin, type UserRole } from "@/lib/auth/roles";

function NavDivider() {
  return <div className="h-5 w-px bg-white/20" />;
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
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

function UserContextBar() {
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
      <div className="mx-auto flex h-[38px] max-w-[1600px] items-center justify-between px-8">
        <div />
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
                Internal Database Platform
              </div>
              <div className="mt-1 truncate text-[13px] text-white/60">
                ThinkGeoEnergy – Market Intelligence System
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-5 text-sm">
            <NavItem href="/" label="Dashboard" pathname={pathname} />
            <NavDivider />

            <NavItem href="/plants" label="Plants" pathname={pathname} />
            <NavItem href="/projects" label="Projects" pathname={pathname} />
            <NavItem href="/companies" label="Companies" pathname={pathname} />
            <NavItem href="/sources" label="Sources" pathname={pathname} />

            <NavDivider />
            <NavItem href="/map" label="Map" pathname={pathname} />
            <NavItem href="/analysis" label="Analysis" pathname={pathname} />
            <NavItem href="/markets" label="Markets" pathname={pathname} />

            {showAdmin ? (
              <>
                <NavDivider />
                <NavItem
                  href="/admin"
                  label="Admin"
                  pathname={pathname}
                  prefetch={false}
                />
              </>
            ) : null}
          </nav>
        </div>
      </header>

      <UserContextBar />

      <div className="mx-auto max-w-[1600px] px-8 py-10">{children}</div>
    </>
  );
}
