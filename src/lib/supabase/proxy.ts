import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv } from "@/lib/env";
import { hardenCookieOptions } from "@/lib/supabase/cookie-options";

/**
 * Refreshes the Supabase session on each admin request, following the official
 * @supabase/ssr pattern: read cookies from the request, and write any refreshed
 * tokens to both the request (so Server Components see them) and the response
 * (so the browser stores them).
 *
 * `getClaims()` validates the JWT signature and refreshes it when it is about
 * to expire. It is only a fast "is there a session?" check. It is NOT the
 * authorization decision: pages and handlers call requireAdmin() for that.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const env = getPublicEnv();

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, hardenCookieOptions(options));
          }
          // Cache-Control etc. so a CDN never caches a response carrying tokens.
          for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();

  return { response, hasSession: Boolean(data?.claims) };
}
