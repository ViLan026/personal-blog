import { BlogSidebar } from "@/components/blog/BlogSidebar";
import type { SidebarNode } from "@/components/blog/CategoryTree";
import { categoryHref } from "@/lib/categories/category-tree";
import { getBlogTaxonomy, type CategoryTreeNode } from "@/lib/data/public";

function toSidebarNodes(nodes: CategoryTreeNode[]): SidebarNode[] {
  return nodes.map((node) => ({
    id: node.id,
    name: node.name,
    href: categoryHref(node),
    count: node.postCount,
    children: toSidebarNodes(node.children),
  }));
}

/** Two-column blog layout: category sidebar + content. */
export async function BlogShell({
  activeCategoryId = null,
  isHome = false,
  children,
}: {
  activeCategoryId?: string | null;
  isHome?: boolean;
  children: React.ReactNode;
}) {
  const { tree } = await getBlogTaxonomy();

  return (
    <div className="container-page py-8 md:py-12">
      <div className="grid gap-8 xl:grid-cols-[17rem_minmax(0,1fr)] xl:gap-12">
        <BlogSidebar nodes={toSidebarNodes(tree)} activeId={activeCategoryId} isHome={isHome} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
