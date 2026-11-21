import type { ApiResult } from "@/types/api";

/**
 * Browser-side helper for calling /api/admin/*. It never throws: network
 * failures and unexpected responses become the same `{ ok: false }` shape as
 * server-side errors, so forms only need one error path.
 */
export async function callAdminApi<T = unknown>(
  url: string,
  init: Omit<RequestInit, "body"> & { json?: unknown; form?: FormData },
): Promise<ApiResult<T>> {
  const { json, form, headers, ...rest } = init;

  const requestInit: RequestInit = { ...rest, credentials: "same-origin", headers: { ...headers } };
  if (json !== undefined) {
    requestInit.body = JSON.stringify(json);
    (requestInit.headers as Record<string, string>)["Content-Type"] = "application/json";
  } else if (form) {
    // The browser sets the multipart boundary itself.
    requestInit.body = form;
  }

  let response: Response;
  try {
    response = await fetch(url, requestInit);
  } catch {
    return {
      ok: false,
      error: {
        code: "network",
        message: "Could not reach the server. Check your connection and try again.",
      },
    };
  }

  try {
    const body = (await response.json()) as ApiResult<T>;
    if (typeof body === "object" && body !== null && "ok" in body) return body;
  } catch {
    // fall through to the generic error below
  }

  if (response.status === 401 || response.status === 403) {
    return {
      ok: false,
      error: { code: "unauthenticated", message: "Your session has ended. Sign in again to continue." },
    };
  }
  return {
    ok: false,
    error: { code: "bad_response", message: "The server sent an unexpected response. Please try again." },
  };
}
