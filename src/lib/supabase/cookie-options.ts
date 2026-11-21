import type { CookieOptions } from "@supabase/ssr";

/**
 * Applied to every session cookie the server writes (proxy, callback, logout).
 *
 * - httpOnly: page JavaScript can never read the access/refresh tokens, so an
 *   XSS bug cannot steal the session. This app never reads the session in the
 *   browser; the browser client is only used to start the Google redirect.
 * - secure (production): cookies are only sent over HTTPS.
 * - sameSite=lax: not sent on cross-site POSTs, which blocks CSRF.
 *
 * Expiry fields (maxAge / expires) from Supabase are preserved so that removing
 * a cookie on logout still works.
 */
export function hardenCookieOptions(options: CookieOptions): CookieOptions {
  return {
    ...options,
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
}
