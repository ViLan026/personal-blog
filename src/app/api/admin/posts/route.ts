import { adminApi, assertBodyWithin, dbError, ok, readFormBody } from "@/lib/api";
import { MAX_MARKDOWN_BYTES } from "@/lib/posts/markdown";
import { readMarkdownUpload } from "@/lib/posts/upload";
import { createAdminClient } from "@/lib/supabase/admin";
import { postFieldsSchema } from "@/lib/validations/post";

/** A form text field as a string ("" when missing), so Zod reports friendly messages. */
const text = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
};

/**
 * Create a post from multipart form data. The Markdown file is read as UTF-8
 * text and stored in the `content_md` column; nothing is written to disk or
 * to Supabase Storage.
 */
export const POST = adminApi(async (request) => {
  // Room for the form fields on top of the 1 MB file limit.
  assertBodyWithin(request, MAX_MARKDOWN_BYTES + 256 * 1024);
  const form = await readFormBody(request);

  const fields = postFieldsSchema.parse({
    title: text(form, "title"),
    slug: text(form, "slug"),
    excerpt: text(form, "excerpt"),
    categoryId: text(form, "categoryId"),
    status: text(form, "status"),
  });
  const upload = (await readMarkdownUpload(form.get("file"), { required: true }))!;

  const { data, error } = await createAdminClient()
    .from("posts")
    .insert({
      title: fields.title,
      slug: fields.slug,
      excerpt: fields.excerpt || null,
      category_id: fields.categoryId,
      content_md: upload.text,
      original_filename: upload.filename,
      status: fields.status,
      // The database also fills this in for published posts.
      published_at: fields.status === "published" ? new Date().toISOString() : null,
    })
    .select("id,slug,status")
    .single();

  if (error) throw dbError(error);
  return ok(data, 201);
});
