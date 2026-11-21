import { NextResponse, type NextRequest } from "next/server";
import { ApiError, assertSameOrigin } from "@/lib/api";
import { getAdminCheck } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function go(request: NextRequest, path: string, status = 307) {
  const response = NextResponse.redirect(new URL(path, request.nextUrl.origin), status);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

/** Explicit logout (the "Sign out" button in the admin area). */
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
  } catch (error) {
    if (error instanceof ApiError) return new NextResponse(error.message, { status: error.status });
    throw error;
  }

  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  return go(request, "/", 303); // 303: turn the POST into a GET
}

/**
 * Cleans up after a signed-in visitor who is NOT the administrator (admin
 * pages redirect them here because Server Components cannot delete cookies).
 *
 * Safety: a GET must never log the real administrator out, so this only
 * clears sessions that fail the admin check.
 */
export async function GET(request: NextRequest) {
  const check = await getAdminCheck();

  if (check.ok) return go(request, "/admin");

  if (check.reason === "forbidden") {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "local" });
    return go(request, "/admin/login?error=unauthorized");
  }

  return go(request, "/admin/login");
}
