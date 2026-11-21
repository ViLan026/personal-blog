/** Shape of every JSON response from /api/admin/*. */
export interface ApiErrorBody {
  code: string;
  message: string;
  /** Per-field messages, keyed by form field name. */
  fieldErrors?: Record<string, string>;
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiErrorBody };
