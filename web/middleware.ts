import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

function isPublicPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    /\.[^/]+$/.test(pathname)
  );
}

function canAccessAdmin(role?: string | null) {
  return (
    role === "editor" ||
    role === "editor_export" ||
    role === "administrator"
  );
}

function canManageUsers(role?: string | null) {
  return role === "administrator";
}

function canEdit(role?: string | null) {
  return (
    role === "editor" ||
    role === "editor_export" ||
    role === "administrator"
  );
}

function canPromote(role?: string | null) {
  return (
    role === "editor" ||
    role === "editor_export" ||
    role === "administrator"
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isApiRoute = pathname.startsWith("/api/");

  if (!token) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = (token.role as string | undefined) ?? null;

  // Admin section
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (pathname === "/admin/users" || pathname.startsWith("/admin/users/")) {
      if (!canManageUsers(role)) {
        return NextResponse.redirect(new URL("/", req.url));
      }
      return NextResponse.next();
    }

    if (!canAccessAdmin(role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Create/new pages
  if (
    pathname === "/projects/new" ||
    pathname === "/plants/new" ||
    pathname === "/companies/new"
  ) {
    if (!canEdit(role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Edit pages
  const isProjectEditPage =
    pathname.startsWith("/projects/") && pathname.endsWith("/edit");
  const isPlantEditPage =
    pathname.startsWith("/plants/") && pathname.endsWith("/edit");
  const isCompanyEditPage =
    pathname.startsWith("/companies/") && pathname.endsWith("/edit");

  if (isProjectEditPage || isPlantEditPage || isCompanyEditPage) {
    if (!canEdit(role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Promote routes/pages
  const isPromoteRoute =
    pathname.includes("/promote") &&
    (pathname.startsWith("/projects/") || pathname.startsWith("/plants/"));

  if (isPromoteRoute) {
    if (!canPromote(role)) {
      if (isApiRoute) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};