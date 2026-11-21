import type { Category, CategoryNode } from "@/types/category";

function compareCategories(a: Category, b: Category): number {
  return a.sort_order - b.sort_order || a.name.localeCompare(b.name);
}

/**
 * Builds the nested tree from the flat table rows.
 * Siblings are ordered by sort_order, then name. Categories whose parent is
 * missing are treated as roots, and anything unreachable from a root (which
 * the database already forbids: a cycle) is simply left out.
 */
export function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const nodes = new Map<string, CategoryNode>();
  for (const category of [...categories].sort(compareCategories)) {
    nodes.set(category.id, { ...category, children: [], depth: 0, path: [] });
  }

  const roots: CategoryNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parent_id ? nodes.get(node.parent_id) : undefined;
    if (parent && parent.id !== node.id) parent.children.push(node);
    else if (!node.parent_id || !parent) roots.push(node);
  }

  const visited = new Set<string>();
  const assign = (node: CategoryNode, depth: number, parentPath: string[]) => {
    if (visited.has(node.id)) return;
    visited.add(node.id);
    node.depth = depth;
    node.path = [...parentPath, node.slug];
    node.children.forEach((child) => assign(child, depth + 1, node.path));
  };
  roots.forEach((root) => assign(root, 0, []));

  return roots;
}

/** Depth-first (pre-order) list, i.e. the order you read the tree top to bottom. */
export function flattenTree(nodes: CategoryNode[]): CategoryNode[] {
  const result: CategoryNode[] = [];
  const walk = (list: CategoryNode[]) => {
    for (const node of list) {
      result.push(node);
      walk(node.children);
    }
  };
  walk(nodes);
  return result;
}

export function findNodeById(
  nodes: CategoryNode[],
  id: string,
): CategoryNode | null {
  for (const node of flattenTree(nodes)) {
    if (node.id === id) return node;
  }
  return null;
}

/** The node's own id plus the ids of every descendant. */
export function collectSubtreeIds(node: CategoryNode): string[] {
  return flattenTree([node]).map((n) => n.id);
}

/** Root → … → category. Safe against cycles. */
export function getAncestorChain(
  categories: Category[],
  categoryId: string,
): Category[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const chain: Category[] = [];
  const seen = new Set<string>();
  let current = byId.get(categoryId);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    chain.unshift(current);
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }
  return chain;
}

/** URL path for a category page, e.g. /blog/category/programming/java */
export function categoryHref(node: Pick<CategoryNode, "path">): string {
  return `/blog/category/${node.path.map(encodeURIComponent).join("/")}`;
}

export function categoryHrefFromChain(chain: Category[]): string {
  return `/blog/category/${chain.map((c) => encodeURIComponent(c.slug)).join("/")}`;
}

/**
 * True when making `newParentId` the parent of `categoryId` would create a loop
 * (the category itself, or one of its own descendants, as its parent).
 */
export function wouldCreateCycle(
  categories: Category[],
  categoryId: string,
  newParentId: string | null,
): boolean {
  if (!newParentId) return false;
  if (newParentId === categoryId) return true;

  const byId = new Map(categories.map((c) => [c.id, c]));
  const seen = new Set<string>();
  let current = byId.get(newParentId);
  while (current && !seen.has(current.id)) {
    if (current.id === categoryId) return true;
    seen.add(current.id);
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }
  return false;
}
