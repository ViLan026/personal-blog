import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { getDashboardStats } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = await requireAdminPage();
  const stats = await getDashboardStats(admin);

  const items = [
    { label: "Categories", value: stats.categories },
    { label: "Posts", value: stats.posts },
    { label: "Published", value: stats.published },
    { label: "Drafts", value: stats.drafts },
  ];

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>

      <dl className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="border-2 border-ink p-4 sm:p-5">
            <dt className="font-semibold">{item.label}</dt>
            <dd className="mt-2 text-4xl font-extrabold text-primary">{item.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/admin/posts/new" className="btn">
          Add new post
        </Link>
        <Link href="/admin/posts" className="btn-outline">
          Manage posts
        </Link>
        <Link href="/admin/categories" className="btn-outline">
          Manage categories
        </Link>
      </div>
    </div>
  );
}
