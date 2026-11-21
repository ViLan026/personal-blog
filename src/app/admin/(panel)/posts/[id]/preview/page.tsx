import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ArticleView } from "@/components/blog/ArticleView";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { getAncestorChain } from "@/lib/categories/category-tree";
import { getAdminPost, listAllCategories } from "@/lib/data/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preview post" };

/** Shows a post (draft or published) exactly as the public article page does. */
export default async function PreviewPostPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminPage();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const [post, categories] = await Promise.all([getAdminPost(admin, id), listAllCategories(admin)]);
  if (!post) notFound();

  const chain = getAncestorChain(categories, post.category_id);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-2 border-primary p-4">
        <p className="font-semibold">
          Preview · {post.status === "published" ? "Published" : "Draft (not visible to visitors)"}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/posts/${post.id}/edit`} className="btn-outline btn-sm">
            Edit
          </Link>
          <Link href="/admin/posts" className="btn-outline btn-sm">
            Back to posts
          </Link>
        </div>
      </div>

      <div className="max-w-5xl">
        <ArticleView
          title={post.title}
          excerpt={post.excerpt}
          contentMd={post.content_md}
          publishedAt={post.published_at}
          crumbs={[
            { label: "Blog" },
            ...chain.map((c) => ({ label: c.name })),
            { label: post.title },
          ]}
          back={{ href: "/admin/posts", label: "Back to posts" }}
        />
      </div>
    </div>
  );
}
