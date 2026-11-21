import type { Metadata } from "next";
import Link from "next/link";
import { PostForm } from "@/components/admin/PostForm";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { listAllCategories } from "@/lib/data/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Add new post" };

export default async function NewPostPage() {
  const admin = await requireAdminPage();
  const categories = await listAllCategories(admin);

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">Add new post</h1>
      <p className="mt-2 max-w-prose">
        The article body comes from an uploaded Markdown file. Fill in the details, upload the file,
        check the preview, then save it as a Draft or publish it.
      </p>

      <div className="mt-8">
        {categories.length === 0 ? (
          <p className="max-w-prose border-2 border-ink p-6">
            Create at least one category before adding a post.{" "}
            <Link href="/admin/categories" className="link">
              Go to Categories
            </Link>
            .
          </p>
        ) : (
          <PostForm mode="create" categories={categories} />
        )}
      </div>
    </div>
  );
}
