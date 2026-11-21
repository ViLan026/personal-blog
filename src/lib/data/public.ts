import "server-only";

import { cache } from "react";
import {
  buildCategoryTree,
  flattenTree,
} from "@/lib/categories/category-tree";
import { createPublicClient } from "@/lib/supabase/server";
import { CATEGORY_COLUMNS, type Category, type CategoryNode } from "@/types/category";
import {
  POST_COLUMNS,
  POST_SUMMARY_COLUMNS,
  type Post,
  type PostSummary,
} from "@/types/post";

/**
 * Read-only queries for the public website. They use the anonymous client, so
 * Row Level Security is the real guarantee that drafts can never leak, even if
 * a filter here were forgotten. The explicit `status = 'published'` filters
 * below are belt and braces.
 *
 * Reads are wrapped in React `cache()` so a page, its layout and its
 * metadata function share one database round trip per request.
 */

export class DataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataError";
  }
}

export const getCategories = cache(async (): Promise<Category[]> => {
  const { data, error } = await createPublicClient()
    .from("categories")
    .select(CATEGORY_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("[data] categories", error.code, error.message);
    throw new DataError("Could not load categories.");
  }
  return data ?? [];
});

/** category_id → number of PUBLISHED posts directly in that category. */
const getDirectPostCounts = cache(async (): Promise<Map<string, number>> => {
  const { data, error } = await createPublicClient()
    .from("posts")
    .select("category_id")
    .eq("status", "published");

  if (error) {
    console.error("[data] post counts", error.code, error.message);
    throw new DataError("Could not load posts.");
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
  }
  return counts;
});

export interface CategoryTreeNode extends CategoryNode {
  children: CategoryTreeNode[];
  /** Published posts in this category AND all of its descendants. */
  postCount: number;
}

export interface BlogTaxonomy {
  categories: Category[];
  tree: CategoryTreeNode[];
  byId: Map<string, CategoryTreeNode>;
}

/** The category tree with published-post counts (including descendants). */
export const getBlogTaxonomy = cache(async (): Promise<BlogTaxonomy> => {
  const [categories, direct] = await Promise.all([getCategories(), getDirectPostCounts()]);
  const tree = buildCategoryTree(categories) as CategoryTreeNode[];

  const byId = new Map<string, CategoryTreeNode>();
  const count = (node: CategoryTreeNode): number => {
    byId.set(node.id, node);
    node.postCount =
      (direct.get(node.id) ?? 0) +
      node.children.reduce((sum, child) => sum + count(child), 0);
    return node.postCount;
  };
  tree.forEach(count);

  return { categories, tree, byId };
});

export interface PostPage {
  posts: PostSummary[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Published posts, newest first, optionally limited to some categories.
 *
 * The total is counted FIRST and the page number is clamped before any range
 * is requested: PostgREST answers "416 Requested range not satisfiable" when an
 * offset lies past the last row, so asking for page 99 directly would fail.
 */
export async function getPublishedPosts(options: {
  categoryIds?: string[];
  page: number;
  pageSize: number;
}): Promise<PostPage> {
  const { categoryIds, pageSize } = options;
  const requested = Math.max(1, Math.floor(options.page) || 1);
  const client = createPublicClient();

  let countQuery = client
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");
  if (categoryIds) countQuery = countQuery.in("category_id", categoryIds);

  const counted = await countQuery;
  if (counted.error) {
    console.error("[data] posts count", counted.error.code, counted.error.message);
    throw new DataError("Could not load posts.");
  }

  const total = counted.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requested, totalPages);
  if (total === 0) return { posts: [], total, page, totalPages };

  const from = (page - 1) * pageSize;
  let query = client
    .from("posts")
    .select(POST_SUMMARY_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + pageSize - 1);
  if (categoryIds) query = query.in("category_id", categoryIds);

  const { data, error } = await query;
  if (error) {
    console.error("[data] posts", error.code, error.message);
    throw new DataError("Could not load posts.");
  }

  return { posts: (data ?? []) as PostSummary[], total, page, totalPages };
}

export const getPublishedPostBySlug = cache(
  async (slug: string): Promise<Post | null> => {
    const { data, error } = await createPublicClient()
      .from("posts")
      .select(POST_COLUMNS)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
      console.error("[data] post", error.code, error.message);
      throw new DataError("Could not load the article.");
    }
    return (data as Post | null) ?? null;
  },
);

/** Slugs and dates for the sitemap. Only published posts are visible to anon. */
export async function getSitemapEntries(): Promise<{
  posts: { slug: string; updatedAt: string }[];
  categoryPaths: string[][];
}> {
  const client = createPublicClient();
  const [{ data: posts, error }, taxonomy] = await Promise.all([
    client
      .from("posts")
      .select("slug,updated_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(5000),
    getBlogTaxonomy(),
  ]);
  if (error) throw new DataError("Could not load posts.");

  return {
    posts: (posts ?? []).map((p) => ({ slug: p.slug, updatedAt: p.updated_at })),
    // Empty categories are left out so search engines do not index empty pages.
    categoryPaths: flattenTree(taxonomy.tree)
      .filter((node) => (node as CategoryTreeNode).postCount > 0)
      .map((node) => node.path),
  };
}
