import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/register"];
const STATIC_EXT = /\.(png|ico|svg|jpg|jpeg|webp|gif|woff2?|css|js)$/i;

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Static assets and Next.js internals — always pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    STATIC_EXT.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Public routes
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Not authenticated
  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = req.auth.user.role;

  // /admin — super_admin only
  if (pathname.startsWith("/admin") && role !== "super_admin") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // Management routes — manager/host/super_admin only
  const managementPaths = ["/league-night/new", "/settings", "/players"];
  const isManagement = managementPaths.some((p) => pathname.startsWith(p));
  if (isManagement && role === "player") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
