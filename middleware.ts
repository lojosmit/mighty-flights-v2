import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (
    req.auth?.user?.mustResetPassword &&
    req.nextUrl.pathname !== "/account-setup"
  ) {
    return NextResponse.redirect(new URL("/account-setup", req.url));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|logo\\.png).*)"],
};
