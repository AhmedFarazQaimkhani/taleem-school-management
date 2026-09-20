import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { parseTenantSlug } from "@/lib/host";

const PLATFORM_DOMAIN = process.env.PLATFORM_DOMAIN ?? "localhost:3000";

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const slug = parseTenantSlug(host, PLATFORM_DOMAIN);

  const requestHeaders = new Headers(request.headers);
  if (slug) {
    requestHeaders.set("x-tenant-slug", slug);
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (token?.schoolId) {
    requestHeaders.set("x-school-id", String(token.schoolId));
  }
  if (token?.schoolSlug) {
    requestHeaders.set("x-school-slug", String(token.schoolSlug));
  }
  if (token?.role) {
    requestHeaders.set("x-user-role", String(token.role));
  }

  const pathname = request.nextUrl.pathname;
  const isSuperAdminPath = pathname.startsWith("/super-admin");
  const isTenantApp =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/setup") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/students") ||
    pathname.startsWith("/attendance") ||
    pathname.startsWith("/fees") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/payroll") ||
    pathname.startsWith("/timetable") ||
    pathname.startsWith("/exams") ||
    pathname.startsWith("/announcements") ||
    pathname.startsWith("/social-posts") ||
    pathname.startsWith("/certificates") ||
    pathname.startsWith("/portal");

  // Logged-in tenant user on the wrong subdomain cannot see another school.
  if (slug && token?.role && token.role !== "SUPER_ADMIN" && token.schoolSlug && token.schoolSlug !== slug) {
    return NextResponse.redirect(new URL("/login?error=wrong_school", request.url));
  }

  if (isSuperAdminPath) {
    if (token?.role !== "SUPER_ADMIN") {
      const login = new URL("/login", request.url);
      login.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(login);
    }
  }

  if (isTenantApp) {
    if (!token) {
      const login = new URL("/login", request.url);
      login.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(login);
    }
    if (token.role === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/super-admin", request.url));
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
