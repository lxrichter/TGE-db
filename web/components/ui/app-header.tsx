"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import type { UserRole } from "@/lib/auth/roles";
import GlobalCommandPalette from "@/components/search/GlobalCommandPalette";
import { getVisiblePlatformNavigationGroups } from "@/lib/platform-navigation";

function matchesPath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/postgres-preview") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isActivePath(pathname: string, href: string, activeHrefs: string[] = []) {
  return [href, ...activeHrefs].some((activeHref) =>
    matchesPath(pathname, activeHref)
  );
}

function groupLabel(label: string) {
  if (label === "Intelligence / Research") return "Primary Intelligence";
  if (label === "Research Operations") return "Research Ops";
  if (label === "Platform / Admin") return "Administration";
  return label;
}

function SidebarItem({
  href,
  label,
  note,
  pathname,
  activeHrefs,
  prefetch = true,
}: {
  href: string;
  label: string;
  note: string;
  pathname: string;
  activeHrefs?: string[];
  prefetch?: boolean;
}) {
  const isActive = isActivePath(pathname, href, activeHrefs);

  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={`group block border px-3 py-2.5 transition ${
        isActive
          ? "border-[var(--tge-brand-green)] bg-[var(--tge-brand-green)] text-[var(--tge-brand-dark)]"
          : "border-transparent text-[var(--tge-header-text-soft)] hover:border-[var(--tge-header-group-divider)] hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--tge-header-text)]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold leading-5">{label}</span>
        {isActive ? (
          <span className="text-[10px] font-bold uppercase tracking-wide">
            Active
          </span>
        ) : null}
      </div>
      <div
        className={`mt-1 line-clamp-2 text-[11px] leading-4 ${
          isActive
            ? "text-[var(--tge-brand-dark)]/75"
            : "text-[var(--tge-header-text-muted)]"
        }`}
      >
        {note}
      </div>
    </Link>
  );
}

function SidebarNavigation({
  pathname,
  role,
}: {
  pathname: string;
  role?: UserRole | string | null;
}) {
  const navigationGroups = getVisiblePlatformNavigationGroups(role, {
    target: "header",
  });

  return (
    <nav className="mt-6 flex-1 space-y-7 overflow-y-auto pr-1">
      {navigationGroups.map((group) => (
        <div key={group.id}>
          <div className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--tge-header-text-faint)]">
            {groupLabel(group.label)}
          </div>
          <div className="mt-2 space-y-1">
            {group.items.map((item) => (
              <SidebarItem
                key={item.key}
                href={item.href}
                label={item.label}
                note={item.note}
                pathname={pathname}
                activeHrefs={item.activeHrefs}
                prefetch={item.access ? false : true}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function TopUtilityBar({
  role,
  onMobileMenu,
}: {
  role?: UserRole | string | null;
  onMobileMenu?: () => void;
}) {
  const { data: session } = useSession();
  const user = session?.user as
    | {
        name?: string | null;
        role?: string | null;
      }
    | undefined;

  return (
    <div className="sticky top-0 z-40 border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]">
      <div className="flex min-h-16 flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            className="inline-flex h-9 items-center justify-center border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 text-xs font-bold text-[var(--tge-text-primary)] xl:hidden"
            type="button"
            onClick={onMobileMenu}
          >
            Menu
          </button>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--tge-brand-green-dark)]">
              Utility Bar
            </div>
            <div className="truncate text-sm font-bold text-[var(--tge-text-primary)]">
              Search, commands, alerts, AI assistant, profile, and context actions
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center">
          <form action="/search" className="flex min-w-0 items-center gap-2">
            <input
              className="h-9 w-full min-w-0 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-3 text-[12px] font-medium text-[var(--tge-text-primary)] outline-none focus:border-[var(--tge-brand-green)] lg:w-[340px]"
              name="q"
              placeholder="Search projects, plants, companies, sources..."
              type="search"
            />
            <button
              className="h-9 shrink-0 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 text-[11px] font-semibold text-[var(--tge-text-primary)] hover:border-[var(--tge-brand-green)]"
              type="submit"
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            <GlobalCommandPalette role={role} />
            <span className="hidden border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-3 py-2 text-[11px] font-semibold text-[var(--tge-text-secondary)] md:inline-flex">
              Alerts
            </span>
            <span className="hidden border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-3 py-2 text-[11px] font-semibold text-[var(--tge-text-secondary)] md:inline-flex">
              AI
            </span>
            {user ? (
              <>
                <span className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-3 py-2 text-[11px] font-semibold text-[var(--tge-text-primary)]">
                  {user.name || "User"} · {user.role || "viewer"}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="h-9 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 text-[11px] font-semibold text-[var(--tge-text-secondary)] transition hover:border-[var(--tge-brand-green)]"
                >
                  Logout
                </button>
              </>
            ) : null}
          </div>
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const role = (session?.user as { role?: UserRole | string | null } | undefined)
    ?.role;

  return (
    <div className="min-h-screen bg-[var(--tge-surface-page)]">
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-[90] xl:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/35"
            type="button"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative z-[91] flex h-full w-[min(88vw,340px)] flex-col bg-[var(--tge-brand-dark)] px-4 py-5 text-[var(--tge-header-text)] shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--tge-header-group-divider)] pb-5">
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src="/tge-logo-white.png"
                  alt="ThinkGeoEnergy"
                  className="h-9 w-auto shrink-0"
                />
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold leading-tight">
                    TGE Intelligence
                  </div>
                  <div className="mt-1 truncate text-[11px] text-[var(--tge-header-text-muted)]">
                    Mobile navigation
                  </div>
                </div>
              </div>
              <button
                className="border border-[var(--tge-header-group-divider)] px-2 py-1 text-xs font-semibold text-[var(--tge-header-text-soft)]"
                type="button"
                onClick={() => setMobileNavOpen(false)}
              >
                Close
              </button>
            </div>
            <SidebarNavigation pathname={pathname} role={role} />
          </aside>
        </div>
      ) : null}

      <div className="grid min-h-screen grid-cols-1 xl:grid-cols-[292px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-[var(--tge-header-group-divider)] bg-[var(--tge-brand-dark)] px-4 py-5 text-[var(--tge-header-text)] xl:flex">
          <div className="flex items-center gap-3 border-b border-[var(--tge-header-group-divider)] pb-5">
            <img
              src="/tge-logo-white.png"
              alt="ThinkGeoEnergy"
              className="h-10 w-auto shrink-0"
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold leading-tight">
                TGE Intelligence
              </div>
              <div className="mt-1 truncate text-[11px] text-[var(--tge-header-text-muted)]">
                Geothermal Intelligence Operating System
              </div>
            </div>
          </div>

          <SidebarNavigation pathname={pathname} role={role} />

          <div className="mt-6 border border-[var(--tge-header-group-divider)] p-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--tge-brand-green)]">
              Workspace
            </div>
            <div className="mt-1 text-sm font-bold">Internal + Subscriber Ready</div>
            <div className="mt-2 text-xs leading-5 text-[var(--tge-header-text-muted)]">
              Role-aware navigation with one shared intelligence design language.
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <TopUtilityBar
            role={role}
            onMobileMenu={() => setMobileNavOpen(true)}
          />
          <main className="mx-auto max-w-[1680px] px-4 py-6 md:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
