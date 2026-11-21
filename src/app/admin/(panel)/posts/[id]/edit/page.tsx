import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PostForm } from "@/components/admin/PostForm";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { getAdminPost, listAllCategories } from "@/lib/data/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit post" };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminPage();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const [post, categories] = await Promise.all([getAdminPost(admin, id), listAllCategories(admin)]);
  if (!post) notFound();

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">Edit post</h1>
      <p className="mt-2 max-w-prose">
        Change the details below. To change the article body, upload a replacement Markdown file.
        {post.status === "published" ? (
          <>
            {" "}
            <Link href={`/blog/post/${post.slug}`} className="link">
              View the live article
            </Link>
            .
          </>
        ) : null}
      </p>

      <div className="mt-8">
        <PostForm
          mode="edit"
          categories={categories}
          initial={{
            id: post.id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt ?? "",
            categoryId: post.category_id,
            status: post.status,
            originalFilename: post.original_filename,
            contentMd: post.content_md,
          }}
        />
      </div>
    </div>
  );
}
