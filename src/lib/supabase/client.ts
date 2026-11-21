import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";

/**
 * Browser client. Used only to start the Google OAuth redirect from the login
 * page. It holds the publishable key, which is safe to expose: Row Level
 * Security decides what it can read, and it cannot write anything.
 */
export function createClient() {
  const env = getPublicEnv();
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
