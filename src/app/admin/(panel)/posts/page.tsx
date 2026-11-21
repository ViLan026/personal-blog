import type { Metadata } from "next";
import Link from "next/link";
import { PostRowActions } from "@/components/admin/PostRowActions";
import { Pagination } from "@/components/ui/Pagination";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { getAncestorChain } from "@/lib/categories/category-tree";
import { listAdminPosts, listAllCategories } from "@/lib/data/admin";
import { formatDate, pluralise } from "@/lib/format";
import type { PostStatus } from "@/types/post";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Posts" };

const NOTICES: Record<string, string> = {
  created: "Post created.",
  updated: "Post updated.",
  published: "Post published. It is now visible on the Blog.",
  unpublished: "Post changed back to Draft. It is no longer public.",
  deleted: "Post deleted.",
};

type SearchParams = Promise<{ status?: string; q?: string; page?: string; notice?: string }>;

export default async function AdminPostsPage({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requireAdminPage();
  const params = await searchParams;

  const status: PostStatus | undefined =
    params.status === "draft" || params.status === "published" ? params.status : undefined;
  const q = params.q?.trim().slice(0, 100) || undefined;
  const notice = params.notice ? NOTICES[params.notice] : undefined;

  const [result, categories] = await Promise.all([
    listAdminPosts(admin, {
      status,
      q,
      page: Number.parseInt(params.page ?? "", 10) || 1,
      pageSize: 15,
    }),
    listAllCategories(admin),
  ]);

  const filtered = Boolean(status || q);

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Posts</h1>
        <Link href="/admin/posts/new" className="btn">
          Add new post
        </Link>
      </div>

      {notice ? (
        <p role="status" className="alert-ok mt-6">
          <strong>Done:</strong> {notice}
        </p>
      ) : null}

      <form method="get" action="/admin/posts" className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end">
        <div>
          <label htmlFor="q" className="label">
            Search by title
          </label>
          <input id="q" name="q" type="search" defaultValue={q ?? ""} className="field" maxLength={100} />
        </div>
        <div>
          <label htmlFor="status" className="label">
            Status
          </label>
          <select id="status" name="status" defaultValue={status ?? ""} className="field">
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn">
            Filter
          </button>
          {filtered ? (
            <Link href="/admin/posts" className="btn-outline">
              Reset
            </Link>
          ) : null}
        </div>
      </form>

      <p className="mt-6 font-medium" aria-live="polite">
        {pluralise(result.total, "post")}
        {filtered ? " match" : ""}
      </p>

      {result.posts.length === 0 ? (
        <p className="mt-4 border-2 border-ink p-6">
          {filtered ? (
            "No posts match these filters."
          ) : (
            <>
              No posts yet.{" "}
              <Link href="/admin/posts/new" className="link">
                Add the first one
              </Link>
              .
            </>
          )}
        </p>
      ) : (
        <ul className="mt-4 grid gap-4">
          {result.posts.map((post) => {
            const chain = getAncestorChain(categories, post.category_id);
            return (
              <li key={post.id} className="border-2 border-ink p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <h2 className="min-w-0 break-words text-lg font-bold">
                    <Link href={`/admin/posts/${post.id}/edit`} className="link">
                      {post.title}
                    </Link>
                  </h2>
                  <span className={post.status === "published" ? "tag-solid" : "tag"}>
                    {post.status === "published" ? "Published" : "Draft"}
                  </span>
                </div>

                <p className="mt-2 break-all font-mono text-sm">/blog/post/{post.slug}</p>
                <p className="mt-1 text-sm">
                  {chain.length ? chain.map((c) => c.name).join(" / ") : "No category"}
                  <span aria-hidden="true"> · </span>
                  {post.published_at && post.status === "published"
                    ? `Published ${formatDate(post.published_at)}`
                    : `Created ${formatDate(post.created_at)}`}
                </p>

                <div className="mt-4">
                  <PostRowActions id={post.id} title={post.title} status={post.status} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination
        basePath="/admin/posts"
        page={result.page}
        totalPages={result.totalPages}
        params={{ q, status }}
      />
    </div>
  );
}
