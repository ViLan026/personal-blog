import { ApiError, adminApi, dbError, ok, parseId, readJsonBody } from "@/lib/api";
import { categoryInUseMessage } from "@/lib/categories/messages";
import { wouldCreateCycle } from "@/lib/categories/category-tree";
import { createAdminClient } from "@/lib/supabase/admin";
import { categoryUpdateSchema } from "@/lib/validations/category";
import { CATEGORY_COLUMNS } from "@/types/category";

type Context = { params: Promise<{ id: string }> };

/** Edit a category: name, slug, description, parent and/or sort order. */
export const PATCH = adminApi<Context>(async (request, { params }) => {
  const id = parseId((await params).id, "category");
  const input = categoryUpdateSchema.parse(await readJsonBody(request));

  const update: Record<string, unknown> = {};
  if (input.name !== undefined) update.name = input.name;
  if (input.slug !== undefined) update.slug = input.slug;
  if (input.description !== undefined) update.description = input.description?.trim() || null;
  if (input.parentId !== undefined) update.parent_id = input.parentId;
  if (input.sortOrder !== undefined) update.sort_order = input.sortOrder;

  if (Object.keys(update).length === 0) {
    throw new ApiError(400, "empty_update", "There is nothing to update.");
  }

  const client = createAdminClient();

  if (input.parentId !== undefined) {
    const { data: all, error } = await client.from("categories").select(CATEGORY_COLUMNS);
    if (error) throw dbError(error);

    if (!all?.some((category) => category.id === id)) {
      throw new ApiError(404, "not_found", "That category no longer exists.");
    }
    if (input.parentId && !all.some((category) => category.id === input.parentId)) {
      throw new ApiError(422, "invalid_parent", "The chosen parent category no longer exists.", {
        parentId: "The chosen parent category no longer exists.",
      });
    }
    // Friendly message first; the database trigger enforces the same rule.
    if (wouldCreateCycle(all, id, input.parentId)) {
      const message =
        "A category cannot be moved under itself or one of its own subcategories.";
      throw new ApiError(422, "circular_category", message, { parentId: message });
    }
  }

  const { data, error } = await client
    .from("categories")
    .update(update)
    .eq("id", id)
    .select(CATEGORY_COLUMNS)
    .single();

  if (error) throw dbError(error);
  return ok(data);
});

/** Delete a category, but only when nothing depends on it. */
export const DELETE = adminApi<Context>(async (_request, { params }) => {
  const id = parseId((await params).id, "category");
  const client = createAdminClient();
  const head = { count: "exact", head: true } as const;

  const [children, posts] = await Promise.all([
    client.from("categories").select("id", head).eq("parent_id", id),
    client.from("posts").select("id", head).eq("category_id", id),
  ]);
  if (children.error) throw dbError(children.error);
  if (posts.error) throw dbError(posts.error);

  const childCount = children.count ?? 0;
  const postCount = posts.count ?? 0;
  if (childCount > 0 || postCount > 0) {
    throw new ApiError(409, "category_in_use", categoryInUseMessage(childCount, postCount));
  }

  // ON DELETE RESTRICT in the database is the final safety net if a child or
  // post is added between the check above and this delete.
  const { data, error } = await client.from("categories").delete().eq("id", id).select("id");
  if (error) throw dbError(error);
  if (!data?.length) throw new ApiError(404, "not_found", "That category no longer exists.");

  return ok({ id });
});
