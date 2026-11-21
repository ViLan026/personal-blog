import {
  ApiError,
  adminApi,
  assertBodyWithin,
  dbError,
  ok,
  parseId,
  readFormBody,
} from "@/lib/api";
import { MAX_MARKDOWN_BYTES } from "@/lib/posts/markdown";
import { readMarkdownUpload } from "@/lib/posts/upload";
import { createAdminClient } from "@/lib/supabase/admin";
import { postUpdateSchema } from "@/lib/validations/post";

type Context = { params: Promise<{ id: string }> };

const FIELDS = ["title", "slug", "excerpt", "categoryId", "status"] as const;

/**
 * Update a post. Send only what changes: any of title, slug, excerpt,
 * categoryId, status, and/or a replacement Markdown `file`.
 * Switching status to "published" stamps published_at the first time;
 * switching back to "draft" removes it from every public page at once.
 */
export const PATCH = adminApi<Context>(async (request, { params }) => {
  const id = parseId((await params).id, "post");
  assertBodyWithin(request, MAX_MARKDOWN_BYTES + 256 * 1024);
  const form = await readFormBody(request);

  const raw: Record<string, string> = {};
  for (const name of FIELDS) {
    const value = form.get(name);
    if (typeof value === "string") raw[name] = value;
  }
  const fields = postUpdateSchema.parse(raw);
  const upload = await readMarkdownUpload(form.get("file"), { required: false });

  const update: Record<string, unknown> = {};
  if (fields.title !== undefined) update.title = fields.title;
  if (fields.slug !== undefined) update.slug = fields.slug;
  if (fields.excerpt !== undefined) update.excerpt = fields.excerpt || null;
  if (fields.categoryId !== undefined) update.category_id = fields.categoryId;
  if (fields.status !== undefined) update.status = fields.status;
  if (upload) {
    update.content_md = upload.text;
    update.original_filename = upload.filename;
  }

  if (Object.keys(update).length === 0) {
    throw new ApiError(400, "empty_update", "There is nothing to update.");
  }

  const { data, error } = await createAdminClient()
    .from("posts")
    .update(update)
    .eq("id", id)
    .select("id,slug,status")
    .single();

  if (error) throw dbError(error);
  return ok(data);
});

export const DELETE = adminApi<Context>(async (_request, { params }) => {
  const id = parseId((await params).id, "post");

  const { data, error } = await createAdminClient()
    .from("posts")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) throw dbError(error);
  if (!data?.length) throw new ApiError(404, "not_found", "That post no longer exists.");

  return ok({ id });
});
