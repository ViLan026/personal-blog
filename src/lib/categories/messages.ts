import { pluralise } from "@/lib/format";

/**
 * The message shown when a category cannot be deleted. Shared by the browser
 * (instant feedback) and the Route Handler (the real enforcement), so both
 * always say the same thing.
 */
export function categoryInUseMessage(children: number, posts: number): string {
  const parts: string[] = [];
  if (children > 0) parts.push(pluralise(children, "subcategory", "subcategories"));
  if (posts > 0) parts.push(pluralise(posts, "post"));
  return `This category still contains ${parts.join(" and ")}. Move or delete ${
    children + posts === 1 ? "it" : "them"
  } first.`;
}
