import "server-only";

import type { AdminUser } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { CATEGORY_COLUMNS, type Category } from "@/types/category";
import {
  POST_COLUMNS,
  POST_SUMMARY_COLUMNS,
  type Post,
  type PostStatus,
  type PostSummary,
} from "@/types/post";

/**
 * Queries that use the privileged (RLS-bypassing) client. Each function takes
 * the AdminUser returned by requireAdmin() / requireAdminPage(). The argument
 * has no other purpose: it makes it impossible to call these without having
 * gone through the admin check first.
 */
function db(admin: AdminUser) {
  void admin;
  return createAdminClient();
}

export class AdminDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminDataError";
  }
}

function fail(scope: string, error: { code?: string | null; message?: string | null }): never {
  console.error(`[admin-data] ${scope}`, error.code, error.message);
  throw new AdminDataError("The database could not be read. Please try again.");
}

export interface DashboardStats {
  categories: number;
  posts: number;
  published: number;
  drafts: number;
}

export async function getDashboardStats(admin: AdminUser): Promise<DashboardStats> {
  const client = db(admin);
  const head = { count: "exact", head: true } as const;

  const [categories, posts, published, drafts] = await Promise.all([
    client.from("categories").select("id", head),
    client.from("posts").select("id", head),
    client.from("posts").select("id", head).eq("status", "published"),
    client.from("posts").select("id", head).eq("status", "draft"),
  ]);

  for (const result of [categories, posts, published, drafts]) {
    if (result.error) fail("stats", result.error);
  }

  return {
    categories: categories.count ?? 0,
    posts: posts.count ?? 0,
    published: published.count ?? 0,
    drafts: drafts.count ?? 0,
  };
}

export async function listAllCategories(admin: AdminUser): Promise<Category[]> {
  const { data, error } = await db(admin)
    .from("categories")
    .select(CATEGORY_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) fail("categories", error);
  return data ?? [];
}

/** category_id → number of posts of ANY status (drafts count too). */
export async function getCategoryPostUsage(
  admin: AdminUser,
): Promise<Record<string, number>> {
  const { data, error } = await db(admin).from("posts").select("category_id");
  if (error) fail("category usage", error);

  const usage: Record<string, number> = {};
  for (const row of data ?? []) {
    usage[row.category_id] = (usage[row.category_id] ?? 0) + 1;
  }
  return usage;
}

export interface AdminPostFilters {
  status?: PostStatus;
  q?: string;
  page: number;
  pageSize: number;
}

/** Escapes LIKE wildcards so the search box matches text literally. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** Counts first, then clamps the page (PostgREST returns 416 for an offset past the end). */
export async function listAdminPosts(admin: AdminUser, filters: AdminPostFilters) {
  const { status, q, pageSize } = filters;
  const requested = Math.max(1, Math.floor(filters.page) || 1);
  const client = db(admin);
  const pattern = q ? `%${escapeLike(q)}%` : null;

  let countQuery = client.from("posts").select("id", { count: "exact", head: true });
  if (status) countQuery = countQuery.eq("status", status);
  if (pattern) countQuery = countQuery.ilike("title", pattern);

  const counted = await countQuery;
  if (counted.error) fail("posts count", counted.error);

  const total = counted.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requested, totalPages);
  if (total === 0) return { posts: [] as PostSummary[], total, page, totalPages };

  const from = (page - 1) * pageSize;
  let query = client
    .from("posts")
    .select(POST_SUMMARY_COLUMNS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + pageSize - 1);
  if (status) query = query.eq("status", status);
  if (pattern) query = query.ilike("title", pattern);

  const { data, error } = await query;
  if (error) fail("posts", error);

  return { posts: (data ?? []) as PostSummary[], total, page, totalPages };
}

export async function getAdminPost(admin: AdminUser, id: string): Promise<Post | null> {
  const { data, error } = await db(admin)
    .from("posts")
    .select(POST_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) fail("post", error);
  return (data as Post | null) ?? null;
}
