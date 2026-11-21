import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getPublicEnv } from "@/lib/env";
import { hardenCookieOptions } from "@/lib/supabase/cookie-options";

/**
 * Cookie-aware client for Server Components, Route Handlers and Server
 * Actions. Always create a new one per request; never share it.
 *
 * It is how the session in the cookies is read and verified (getUser()).
 * Server Components cannot write cookies, so `setAll` swallows that error:
 * proxy.ts is what actually refreshes expiring sessions.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const env = getPublicEnv();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, hardenCookieOptions(options));
            }
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // Safe to ignore because proxy.ts refreshes the session.
          }
        },
      },
    },
  );
}

/**
 * Anonymous, cookie-free client for public pages. It acts as the `anon` role,
 * so Row Level Security guarantees it can only ever see categories and
 * PUBLISHED posts, even if a query forgot to filter by status.
 */
export function createPublicClient() {
  const env = getPublicEnv();
  return createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}
