import { z } from "zod";
import { SLUG_REGEX } from "@/lib/slug";

export const postStatusSchema = z.enum(["draft", "published"], {
  error: "Status must be Draft or Published",
});

export const postFieldsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title must be 255 characters or fewer"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(255, "Slug must be 255 characters or fewer")
    .regex(SLUG_REGEX, "Use lowercase letters, numbers and single hyphens only"),
  excerpt: z
    .string()
    .trim()
    .max(1000, "Description must be 1000 characters or fewer"),
  categoryId: z.uuid("Choose a category"),
  status: postStatusSchema,
});

/** PATCH: every field is optional, but the ones sent must still be valid. */
export const postUpdateSchema = postFieldsSchema.partial();

export type PostFields = z.infer<typeof postFieldsSchema>;
export type PostUpdate = z.infer<typeof postUpdateSchema>;

/** Maps Zod issues to { fieldName: first message } for form display. */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}
