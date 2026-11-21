"use client";

import Link from "next/link";
import { useState } from "react";
import { CategoryTree, type SidebarNode } from "@/components/blog/CategoryTree";
import { Icon } from "@/components/ui/Icon";

/**
 * 1280px and up: a permanent sticky column.
 * Below that (tablet and mobile): a "Categories" button that opens and closes
 * the same tree, so the content always gets the full width.
 */
export function BlogSidebar({
  nodes,
  activeId,
  isHome,
}: {
  nodes: SidebarNode[];
  activeId: string | null;
  isHome: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <aside
      aria-label="Blog categories"
      className="xl:sticky xl:top-24 xl:max-h-[calc(100dvh-8rem)] xl:self-start xl:overflow-y-auto"
    >
      <button
        type="button"
        className="btn-outline w-full justify-between xl:hidden"
        aria-expanded={open}
        aria-controls="category-nav"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex items-center gap-2">
          <Icon name="folder" />
          Categories
        </span>
        <Icon name={open ? "chevronDown" : "chevronRight"} />
      </button>

      <nav
        id="category-nav"
        aria-label="Categories"
        className={`${open ? "block" : "hidden"} mt-3 border-2 border-ink p-3 xl:mt-0 xl:block`}
      >
        <p className="mb-2 hidden px-2 font-bold xl:block">Categories</p>
        <Link
          href="/blog"
          aria-current={isHome ? "page" : undefined}
          className={`mb-1 flex min-h-11 items-center px-2 py-1 xl:min-h-9 ${
            isHome
              ? "bg-primary font-semibold text-background"
              : "hover:bg-primary hover:text-background"
          }`}
        >
          All articles
        </Link>
        <CategoryTree nodes={nodes} activeId={activeId} />
      </nav>
    </aside>
  );
}
