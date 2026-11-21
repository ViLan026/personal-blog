import { NextResponse, type NextRequest } from "next/server";
import { EnvError } from "@/lib/env";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next.js 16 "proxy" (formerly middleware). It does two jobs for admin routes:
 *
 *   1. Keeps the Supabase session cookie fresh.
 *   2. Sends visitors with no session to the login page (a UX shortcut).
 *
 * It is deliberately NOT the security boundary. Every admin page and every
 * /api/admin handler independently calls requireAdmin(), which verifies the
 * user with Supabase and checks the admin email.
 */
export async function proxy(request: NextRequest) {
  let session;
  try {
    session = await updateSession(request);
  } catch (error) {
    if (error instanceof EnvError) {
      return new NextResponse(error.message, {
        status: 500,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
    throw error;
  }

  const { response, hasSession } = session;
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/admin/login";

  if (!hasSession && !isLoginPage) {
    if (pathname.startsWith("/api/")) {
      const denied = NextResponse.json(
        { ok: false, error: { code: "unauthenticated", message: "Sign in to continue." } },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
      return denied;
    }
    const login = request.nextUrl.clone();
    login.pathname = "/admin/login";
    login.search = "";
    const redirect = NextResponse.redirect(login);
    // Keep any cookie clean-up (e.g. an expired token being cleared).
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
