import { NextResponse, type NextRequest } from "next/server";
import { getServerEnv } from "@/lib/env.server";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser, safeRedirectPath } from "@/lib/auth/admin-identity";

export const dynamic = "force-dynamic";

function go(request: NextRequest, path: string) {
  const response = NextResponse.redirect(new URL(path, request.nextUrl.origin));
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function loginError(request: NextRequest, error: string) {
  return go(request, `/admin/login?error=${error}`);
}

/**
 * Google OAuth callback (PKCE):
 *   code → session (stored in httpOnly cookies) → verify admin → /admin
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  // The user cancelled on Google's screen, or Google/Supabase reported a failure.
  if (params.get("error")) return loginError(request, "oauth_failed");

  const code = params.get("code");
  if (!code) return loginError(request, "missing_code");

  // Only same-site /admin paths are accepted; everything else becomes /admin.
  const destination = safeRedirectPath(params.get("next"), "/admin");

  try {
    const { ADMIN_EMAIL } = getServerEnv();
    const supabase = await createClient();

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) return loginError(request, "exchange_failed");

    // Verify with the Auth server rather than trusting the cookie contents.
    const { data, error: userError } = await supabase.auth.getUser();
    if (userError || !data.user) return loginError(request, "exchange_failed");

    if (!isAdminUser(data.user, ADMIN_EMAIL)) {
      // Wrong Google account: destroy the session we just created.
      await supabase.auth.signOut({ scope: "local" });
      return loginError(request, "unauthorized");
    }

    return go(request, destination);
  } catch (error) {
    console.error("[auth/callback]", error);
    return loginError(request, "exchange_failed");
  }
}
