import type { Metadata } from "next";
import { CategoryTreeManager } from "@/components/admin/CategoryTreeManager";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { getCategoryPostUsage, listAllCategories } from "@/lib/data/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const admin = await requireAdminPage();
  const [categories, usage] = await Promise.all([
    listAllCategories(admin),
    getCategoryPostUsage(admin),
  ]);

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-extrabold tracking-tight">Categories</h1>
      <p className="mt-2 max-w-prose">
        Organise articles in as many nested levels as you like. A category can only be deleted when
        it has no subcategories and no posts.
      </p>
      <div className="mt-6">
        <CategoryTreeManager categories={categories} usage={usage} />
      </div>
    </div>
  );
}
