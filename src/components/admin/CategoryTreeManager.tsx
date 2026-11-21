"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { callAdminApi } from "@/lib/admin-client";
import { buildCategoryTree } from "@/lib/categories/category-tree";
import { categoryInUseMessage } from "@/lib/categories/messages";
import { pluralise } from "@/lib/format";
import type { Category, CategoryNode } from "@/types/category";

type Editor =
  | { mode: "create"; parentId: string | null }
  | { mode: "edit"; category: Category };

type Notice = { kind: "ok" | "error"; text: string };

/**
 * Tree view of every category with create / edit / move / delete.
 * Moving a category is just editing its parent. The browser blocks deletes of
 * categories in use for instant feedback; the server enforces the same rule.
 */
export function CategoryTreeManager({
  categories,
  usage,
}: {
  categories: Category[];
  /** category_id → number of posts of any status. */
  usage: Record<string, number>;
}) {
  const router = useRouter();
  const tree = useMemo(() => buildCategoryTree(categories), [categories]);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [toDelete, setToDelete] = useState<CategoryNode | null>(null);
  const [deleting, setDeleting] = useState(false);

  function requestDelete(node: CategoryNode) {
    const posts = usage[node.id] ?? 0;
    if (node.children.length > 0 || posts > 0) {
      setNotice({ kind: "error", text: `Cannot delete “${node.name}”. ${categoryInUseMessage(node.children.length, posts)}` });
      return;
    }
    setNotice(null);
    setToDelete(node);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const result = await callAdminApi(`/api/admin/categories/${toDelete.id}`, { method: "DELETE" });
    setDeleting(false);

    if (result.ok) {
      setNotice({ kind: "ok", text: `Category “${toDelete.name}” deleted.` });
      router.refresh();
    } else {
      setNotice({ kind: "error", text: result.error.message });
    }
    setToDelete(null);
  }

  function renderNodes(nodes: CategoryNode[], depth: number) {
    return (
      <ul className={depth === 0 ? "space-y-3" : "ml-3 mt-3 space-y-3 border-l-2 border-primary pl-3 sm:ml-6 sm:pl-5"}>
        {nodes.map((node) => {
          const posts = usage[node.id] ?? 0;
          return (
            <li key={node.id}>
              <div className="flex flex-col gap-3 border-2 border-ink p-3 sm:p-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="break-words text-lg font-bold">{node.name}</p>
                  <p className="break-all font-mono text-sm">/{node.path.join("/")}</p>
                  <p className="mt-1 text-sm">
                    {pluralise(posts, "post")} · {pluralise(node.children.length, "subcategory", "subcategories")} · order {node.sort_order}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-outline btn-sm"
                    onClick={() => {
                      setNotice(null);
                      setEditor({ mode: "create", parentId: node.id });
                    }}
                  >
                    Add subcategory<span className="sr-only"> to {node.name}</span>
                  </button>
                  <button
                    type="button"
                    className="btn-outline btn-sm"
                    onClick={() => {
                      setNotice(null);
                      setEditor({ mode: "edit", category: node });
                    }}
                  >
                    Edit<span className="sr-only"> {node.name}</span>
                  </button>
                  <button type="button" className="btn-outline btn-sm" onClick={() => requestDelete(node)}>
                    Delete<span className="sr-only"> {node.name}</span>
                  </button>
                </div>
              </div>
              {node.children.length > 0 ? renderNodes(node.children, depth + 1) : null}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn"
          onClick={() => {
            setNotice(null);
            setEditor({ mode: "create", parentId: null });
          }}
        >
          New top-level category
        </button>
      </div>

      <div aria-live="polite" className="mt-4">
        {notice ? (
          <p role={notice.kind === "error" ? "alert" : "status"} className={notice.kind === "error" ? "alert-error" : "alert-ok"}>
            <strong>{notice.kind === "error" ? "Error:" : "Done:"}</strong> {notice.text}
          </p>
        ) : null}
      </div>

      {editor ? (
        <div className="mt-6">
          <CategoryForm
            key={editor.mode === "edit" ? editor.category.id : `new-${editor.parentId ?? "root"}`}
            categories={categories}
            category={editor.mode === "edit" ? editor.category : undefined}
            defaultParentId={editor.mode === "create" ? editor.parentId : null}
            onCancel={() => setEditor(null)}
            onSaved={(text) => {
              setEditor(null);
              setNotice({ kind: "ok", text });
              router.refresh();
            }}
          />
        </div>
      ) : null}

      <div className="mt-8">
        {tree.length === 0 ? (
          <p className="border-2 border-ink p-6">
            There are no categories yet. Create the first one to start organising articles.
          </p>
        ) : (
          renderNodes(tree, 0)
        )}
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete this category?"
        confirmLabel="Delete category"
        busyLabel="Deleting…"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      >
        <p>
          “{toDelete?.name}” will be permanently deleted. This cannot be undone.
        </p>
      </ConfirmDialog>
    </div>
  );
}
