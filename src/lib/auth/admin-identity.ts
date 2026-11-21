/**
 * Pure helpers for deciding who the administrator is. No framework imports so
 * they are trivial to unit test.
 */

export interface IdentityLike {
  provider: string;
  identity_data?: Record<string, unknown> | null;
}

export interface UserLike {
  email?: string | null;
  email_confirmed_at?: string | null;
  identities?: IdentityLike[] | null;
}

/**
 * True only when the user is the configured administrator AND signed in with
 * Google.
 *
 * Matching the email alone is not enough: if email/password sign-up were ever
 * enabled in Supabase, anyone could register an account using the admin's
 * address. Requiring a verified Google identity with that exact email closes
 * that hole.
 */
export function isAdminUser(user: UserLike, adminEmail: string): boolean {
  const expected = adminEmail.trim().toLowerCase();
  if (!expected) return false;

  if (user.email?.trim().toLowerCase() !== expected) return false;
  if (!user.email_confirmed_at) return false;

  const google = user.identities?.find((identity) => identity.provider === "google");
  if (!google) return false;

  const data = google.identity_data ?? {};
  const googleEmail =
    typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  if (googleEmail !== expected) return false;
  if (data.email_verified === false) return false;

  return true;
}

const FALLBACK_ORIGIN = "http://internal.invalid";

/**
 * Only same-site paths inside /admin are valid post-login destinations.
 * Anything else (other origins, protocol-relative URLs, backslash tricks,
 * the login page itself) falls back to the dashboard.
 */
export function safeRedirectPath(
  value: string | null | undefined,
  fallback = "/admin",
): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value)) return fallback;

  let url: URL;
  try {
    url = new URL(value, FALLBACK_ORIGIN);
  } catch {
    return fallback;
  }
  if (url.origin !== FALLBACK_ORIGIN) return fallback;

  const inAdmin = url.pathname === "/admin" || url.pathname.startsWith("/admin/");
  const isLogin = url.pathname === "/admin/login" || url.pathname.startsWith("/admin/login/");
  if (!inAdmin || isLogin) return fallback;

  return url.pathname + url.search;
}
