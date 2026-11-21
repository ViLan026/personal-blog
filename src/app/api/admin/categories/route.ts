import { adminApi, dbError, ok, readJsonBody } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { categoryFieldsSchema } from "@/lib/validations/category";
import { CATEGORY_COLUMNS } from "@/types/category";

/** Create a category. `adminApi` runs requireAdmin() before this body. */
export const POST = adminApi(async (request) => {
  const input = categoryFieldsSchema.parse(await readJsonBody(request));

  const { data, error } = await createAdminClient()
    .from("categories")
    .insert({
      name: input.name,
      slug: input.slug,
      description: input.description?.trim() || null,
      parent_id: input.parentId,
      sort_order: input.sortOrder,
    })
    .select(CATEGORY_COLUMNS)
    .single();

  if (error) throw dbError(error);
  return ok(data, 201);
});
