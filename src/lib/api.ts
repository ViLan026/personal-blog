import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { z, ZodError } from "zod";
import { AdminAuthError, requireAdmin, type AdminUser } from "@/lib/auth/require-admin";
import { EnvError } from "@/lib/env";
import { toFieldErrors } from "@/lib/validations/post";
import type { ApiResult } from "@/types/api";

/** An error whose message is safe to show to the administrator. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const NO_STORE = { "Cache-Control": "no-store" };

export function ok<T>(data: T, status = 200): NextResponse<ApiResult<T>> {
  return NextResponse.json({ ok: true, data }, { status, headers: NO_STORE });
}

function fail(
  status: number,
  code: string,
  message: string,
  fieldErrors?: Record<string, string>,
): NextResponse<ApiResult<never>> {
  return NextResponse.json(
    { ok: false, error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) } },
    { status, headers: NO_STORE },
  );
}

/**
 * CSRF defence in depth on top of SameSite=Lax cookies: a state-changing
 * request that declares an Origin must come from this site.
 */
export function assertSameOrigin(request: Request): void {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return;
  const origin = request.headers.get("origin");
  if (!origin) return;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  let originHost: string | null = null;
  try {
    originHost = new URL(origin).host;
  } catch {
    // falls through to the rejection below
  }
  if (!originHost || originHost !== host) {
    throw new ApiError(403, "bad_origin", "This request was blocked because it came from another site.");
  }
}

/** Parses a JSON body, turning malformed input into a clean 400. */
export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "invalid_json", "The request body is not valid JSON.");
  }
}

/** Parses multipart/urlencoded form data (used for Markdown uploads). */
export async function readFormBody(request: Request): Promise<FormData> {
  try {
    return await request.formData();
  } catch {
    throw new ApiError(400, "invalid_form", "The form data could not be read.");
  }
}

/** Route ids must be UUIDs; anything else cannot exist, so it is a 404. */
export function parseId(value: string, label = "item"): string {
  if (!z.uuid().safeParse(value).success) {
    throw new ApiError(404, "not_found", `That ${label} does not exist.`);
  }
  return value;
}

/**
 * Rejects obviously oversized uploads from the Content-Length header before
 * the body is buffered. The exact file-size check still runs afterwards.
 */
export function assertBodyWithin(request: Request, maxBytes: number): void {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new ApiError(413, "too_large", "The upload is too large.");
  }
}

interface DbErrorLike {
  code?: string | null;
  message?: string | null;
}

/**
 * Converts a Supabase/PostgREST error into a safe ApiError. Raw database
 * messages (which can include table and constraint names) stay in server logs.
 */
export function dbError(error: DbErrorLike): ApiError {
  const message = error.message ?? "";

  switch (error.code) {
    case "23505": // unique_violation: the only unique columns are slugs
      return new ApiError(409, "duplicate_slug", "That slug is already in use. Choose a different one.", {
        slug: "That slug is already in use.",
      });
    case "23001": // restrict_violation: ON DELETE RESTRICT blocked a delete
      return new ApiError(409, "in_use", "This item is still in use by other records, so it cannot be deleted.");
    case "23503": // foreign_key_violation
      // Postgres words a blocked delete "update or delete on table ..." and a
      // dangling reference "insert or update on table ...".
      if (/^update or delete/i.test(message)) {
        return new ApiError(409, "in_use", "This item is still in use by other records, so it cannot be deleted.");
      }
      return new ApiError(422, "invalid_reference", "The selected category no longer exists. Refresh the page and try again.");
    case "23514": // check_violation
      if (/circular|own parent/i.test(message)) {
        return new ApiError(
          422,
          "circular_category",
          "A category cannot be moved under itself or one of its own subcategories.",
          { parentId: "Choose a parent that is not inside this category." },
        );
      }
      return new ApiError(422, "invalid_value", "One of the values is not allowed. Check the form and try again.");
    case "PGRST116": // .single() found no row
      return new ApiError(404, "not_found", "That item no longer exists.");
  }

  if (!error.code && /fetch failed|network|timeout|econn|enotfound/i.test(message)) {
    return new ApiError(503, "database_unreachable", "Could not reach the database. Check your connection and try again.");
  }

  console.error("[db]", error.code, message);
  return new ApiError(500, "database_error", "The database returned an unexpected error. Please try again.");
}

function toResponse(error: unknown): NextResponse<ApiResult<never>> {
  if (error instanceof AdminAuthError) return fail(error.status, error.reason, error.message);
  if (error instanceof ApiError) return fail(error.status, error.code, error.message, error.fieldErrors);
  if (error instanceof ZodError) {
    const fieldErrors = toFieldErrors(error);
    const first = Object.values(fieldErrors)[0] ?? "Check the form and try again.";
    return fail(400, "validation_error", first, fieldErrors);
  }
  if (error instanceof EnvError) {
    console.error("[env]", error.message);
    return fail(500, "misconfigured", "The server is not configured correctly. Check the environment variables.");
  }
  console.error("[api]", error);
  return fail(500, "internal_error", "Something went wrong. Please try again.");
}

type Handler<Ctx> = (request: NextRequest, ctx: Ctx, admin: AdminUser) => Promise<Response>;

/**
 * Wraps every /api/admin handler so that, by construction:
 *   1. cross-site requests are rejected,
 *   2. requireAdmin() runs BEFORE the handler body (401 / 403 otherwise),
 *   3. all errors become safe JSON without stack traces or SQL details.
 *
 * A handler can therefore only run for the verified administrator, and it
 * receives that administrator as its third argument.
 */
export function adminApi<Ctx = unknown>(handler: Handler<Ctx>) {
  return async (request: NextRequest, ctx: Ctx): Promise<Response> => {
    try {
      assertSameOrigin(request);
      const admin = await requireAdmin();
      return await handler(request, ctx, admin);
    } catch (error) {
      return toResponse(error);
    }
  };
}
