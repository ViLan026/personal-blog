import { z } from "zod";
import { SLUG_REGEX } from "@/lib/slug";

const slug = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(180, "Slug must be 180 characters or fewer")
  .regex(SLUG_REGEX, "Use lowercase letters, numbers and single hyphens only");

export const categoryFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(150, "Name must be 150 characters or fewer"),
  slug,
  description: z
    .string()
    .trim()
    .max(1000, "Description must be 1000 characters or fewer")
    .nullish(),
  parentId: z.uuid("Parent category is not valid").nullable(),
  sortOrder: z
    .number("Sort order must be a number")
    .int("Sort order must be a whole number")
    .min(-100000)
    .max(100000),
});

/** PATCH: every field is optional, but the ones sent must still be valid. */
export const categoryUpdateSchema = categoryFieldsSchema.partial();

export type CategoryFields = z.infer<typeof categoryFieldsSchema>;
export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;
