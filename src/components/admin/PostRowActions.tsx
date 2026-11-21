"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { callAdminApi } from "@/lib/admin-client";
import type { PostStatus } from "@/types/post";

/** Edit / Preview / Publish-or-Unpublish / Delete for one row of the post list. */
export function PostRowActions({
  id,
  title,
  status,
}: {
  id: string;
  title: string;
  status: PostStatus;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [busy, setBusy] = useState<"status" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  /** Keep the current filters and show a success banner via ?notice=. */
  function finish(notice: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("notice", notice);
    router.replace(`${pathname}?${next.toString()}`);
    router.refresh();
  }

  async function toggleStatus() {
    setError(null);
    setBusy("status");
    const form = new FormData();
    form.set("status", status === "published" ? "draft" : "published");
    const result = await callAdminApi(`/api/admin/posts/${id}`, { method: "PATCH", form });
    setBusy(null);
    if (result.ok) finish(status === "published" ? "unpublished" : "published");
    else setError(result.error.message);
  }

  async function remove() {
    setError(null);
    setBusy("delete");
    const result = await callAdminApi(`/api/admin/posts/${id}`, { method: "DELETE" });
    setBusy(null);
    setConfirming(false);
    if (result.ok) finish("deleted");
    else setError(result.error.message);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Link href={`/admin/posts/${id}/edit`} className="btn-outline btn-sm">
          Edit<span className="sr-only">: {title}</span>
        </Link>
        <Link href={`/admin/posts/${id}/preview`} className="btn-outline btn-sm">
          Preview<span className="sr-only">: {title}</span>
        </Link>
        <button
          type="button"
          className="btn-outline btn-sm"
          onClick={toggleStatus}
          disabled={busy !== null}
          aria-busy={busy === "status"}
        >
          {busy === "status"
            ? "Updating…"
            : status === "published"
              ? "Change to Draft"
              : "Publish"}
          <span className="sr-only">: {title}</span>
        </button>
        <button
          type="button"
          className="btn-outline btn-sm"
          onClick={() => {
            setError(null);
            setConfirming(true);
          }}
          disabled={busy !== null}
        >
          Delete<span className="sr-only">: {title}</span>
        </button>
      </div>

      {error ? (
        <p role="alert" className="alert-error mt-2 text-sm">
          <strong>Error:</strong> {error}
        </p>
      ) : null}

      <ConfirmDialog
        open={confirming}
        title="Delete this post?"
        confirmLabel="Delete post"
        busyLabel="Deleting…"
        busy={busy === "delete"}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      >
        <p>“{title}” will be permanently deleted. This cannot be undone.</p>
      </ConfirmDialog>
    </div>
  );
}
