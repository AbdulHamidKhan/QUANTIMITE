import { NextRequest, NextResponse } from "next/server";

// Edge middleware: redirect unauthenticated users away from /admin/* and /api/admin/*.
// Role-based checks happen inside route handlers (Node runtime, Prisma access).

const ADMIN_PREFIXES = ["/admin", "/api/admin", "/api/upload", "/api/content"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!needsAuth) return NextResponse.next();

  const access = req.cookies.get("qm_access")?.value;
  if (!access) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/upload/:path*", "/api/content/:path*"],
};