import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";
import { getServerEnv } from "@/lib/env.server";

/**
 * PRIVILEGED client using the secret key. It bypasses Row Level Security, so:
 *
 *   - `server-only` makes the build fail if a Client Component imports this.
 *   - Only call it AFTER `requireAdmin()` has succeeded in the same request.
 *     Every admin Route Handler and admin page does.
 *
 * The key is never sent to the browser, never prefixed NEXT_PUBLIC_, and never
 * included in an API response.
 */
export function createAdminClient() {
  const { NEXT_PUBLIC_SUPABASE_URL } = getPublicEnv();
  const { SUPABASE_SECRET_KEY } = getServerEnv();

  return createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
