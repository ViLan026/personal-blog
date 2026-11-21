export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** A category plus its place in the tree (built in memory, not stored). */
export interface CategoryNode extends Category {
  children: CategoryNode[];
  /** 0 for root categories. */
  depth: number;
  /** Slugs from the root down to this category, e.g. ["programming", "java"]. */
  path: string[];
}

export const CATEGORY_COLUMNS =
  "id,name,slug,description,parent_id,sort_order,created_at,updated_at";
