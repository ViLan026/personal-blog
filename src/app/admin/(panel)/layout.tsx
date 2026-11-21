import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdminPage } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

/**
 * Chrome for every signed-in admin page. This layout checks the session for
 * the sidebar, but layouts are not re-run on every client navigation, so each
 * page and each Route Handler ALSO calls requireAdmin* itself.
 */
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();

  return (
    <div className="min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col lg:flex-row">
        <aside className="shrink-0 border-b-2 border-primary p-4 lg:w-64 lg:border-b-0 lg:border-r-2 lg:p-6">
          <p className="font-extrabold tracking-tight">Admin</p>
          <p className="mb-4 break-all text-sm">{admin.email}</p>

          <AdminNav />

          <div className="mt-4 flex flex-wrap gap-2 border-t-2 border-ink pt-4 lg:flex-col">
            <Link href="/" className="btn-outline btn-sm">
              View site
            </Link>
            <form action="/auth/signout" method="post" className="contents">
              <button type="submit" className="btn-outline btn-sm">
                Sign out
              </button>
            </form>
          </div>
        </aside>

        <main id="main" className="min-w-0 flex-1 p-4 sm:p-6 lg:p-10">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
