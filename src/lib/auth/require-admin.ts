import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { getServerEnv } from "@/lib/env.server";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/auth/admin-identity";

export interface AdminUser {
  id: string;
  email: string;
}

export type AdminCheck =
  | { ok: true; admin: AdminUser }
  | { ok: false; reason: "unauthenticated" | "forbidden" };

/** Thrown by requireAdmin(); Route Handlers turn it into a 401 / 403 response. */
export class AdminAuthError extends Error {
  readonly status: 401 | 403;

  constructor(readonly reason: "unauthenticated" | "forbidden") {
    super(
      reason === "unauthenticated"
        ? "Sign in to continue."
        : "This Google account is not allowed to use the admin area.",
    );
    this.name = "AdminAuthError";
    this.status = reason === "unauthenticated" ? 401 : 403;
  }
}

/**
 * The single source of truth for "is this request from the administrator?".
 *
 * 1. Verifies the session with Supabase Auth via getUser(), which contacts the
 *    Auth server and so also catches revoked sessions. (getSession() only
 *    reads cookies and must not be trusted on the server.)
 * 2. Requires the configured ADMIN_EMAIL signed in through Google.
 *
 * Memoised per request so a layout and its page do not each hit the network.
 */
export const getAdminCheck = cache(async (): Promise<AdminCheck> => {
  const { ADMIN_EMAIL } = getServerEnv();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return { ok: false, reason: "unauthenticated" };
  if (!isAdminUser(data.user, ADMIN_EMAIL)) return { ok: false, reason: "forbidden" };

  return { ok: true, admin: { id: data.user.id, email: data.user.email ?? ADMIN_EMAIL } };
});

/**
 * For Route Handlers and mutations. Returns the administrator or throws
 * AdminAuthError. Call this before touching the privileged database client.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const check = await getAdminCheck();
  if (!check.ok) throw new AdminAuthError(check.reason);
  return check.admin;
}

/**
 * For admin pages and layouts. Same check, but redirects instead of throwing.
 * A signed-in non-admin is sent through /auth/signout so their session is
 * cleared (Server Components cannot delete cookies themselves).
 *
 * Call it in every admin page, not only the layout: Next.js layouts do not
 * re-render on client-side navigation, so a layout check alone is not enough.
 */
export async function requireAdminPage(): Promise<AdminUser> {
  const check = await getAdminCheck();
  if (check.ok) return check.admin;
  if (check.reason === "forbidden") redirect("/auth/signout");
  redirect("/admin/login");
}
