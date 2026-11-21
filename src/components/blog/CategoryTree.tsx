"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

/** Plain, serialisable node handed over from the server. */
export interface SidebarNode {
  id: string;
  name: string;
  href: string;
  /** Published posts in this category and everything beneath it. */
  count: number;
  children: SidebarNode[];
}

/** Ids from the root down to `targetId` (inclusive), or [] when absent. */
function pathTo(nodes: SidebarNode[], targetId: string | null): string[] {
  if (!targetId) return [];
  for (const node of nodes) {
    if (node.id === targetId) return [node.id];
    const below = pathTo(node.children, targetId);
    if (below.length) return [node.id, ...below];
  }
  return [];
}

function Branch({
  nodes,
  activeId,
  ancestors,
  expanded,
  toggle,
  depth,
}: {
  nodes: SidebarNode[];
  activeId: string | null;
  ancestors: Set<string>;
  expanded: Set<string>;
  toggle: (id: string) => void;
  depth: number;
}) {
  return (
    <ul className={depth === 0 ? "space-y-1" : "ml-4 mt-1 space-y-1 border-l-2 border-primary pl-1"}>
      {nodes.map((node) => {
        const hasChildren = node.children.length > 0;
        const isOpen = expanded.has(node.id);
        const isActive = node.id === activeId;

        return (
          <li key={node.id}>
            <div className="flex items-stretch">
              {hasChildren ? (
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-label={`${isOpen ? "Collapse" : "Expand"} ${node.name}`}
                  onClick={() => toggle(node.id)}
                  className="flex min-h-11 w-9 shrink-0 items-center justify-center hover:bg-primary hover:text-background xl:min-h-9"
                >
                  <Icon name={isOpen ? "chevronDown" : "chevronRight"} size={16} />
                </button>
              ) : (
                <span className="w-9 shrink-0" aria-hidden="true" />
              )}

              <Link
                href={node.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-11 min-w-0 flex-1 items-center justify-between gap-2 px-2 py-1 xl:min-h-9 ${
                  isActive
                    ? "bg-primary font-semibold text-background"
                    : `hover:bg-primary hover:text-background ${
                        ancestors.has(node.id) ? "font-semibold" : ""
                      }`
                }`}
              >
                <span className="min-w-0 break-words">{node.name}</span>
                <span className="shrink-0 text-sm" aria-label={`${node.count} posts`}>
                  {node.count}
                </span>
              </Link>
            </div>

            {hasChildren && isOpen ? (
              <Branch
                nodes={node.children}
                activeId={activeId}
                ancestors={ancestors}
                expanded={expanded}
                toggle={toggle}
                depth={depth + 1}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Recursive, expandable category tree. The active category and its ancestors
 * start expanded; everything else starts collapsed.
 */
export function CategoryTree({
  nodes,
  activeId,
}: {
  nodes: SidebarNode[];
  activeId: string | null;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(pathTo(nodes, activeId)));
  const ancestors = new Set(pathTo(nodes, activeId).slice(0, -1));

  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (nodes.length === 0) {
    return <p className="px-2 py-1">No categories yet.</p>;
  }

  return (
    <Branch
      nodes={nodes}
      activeId={activeId}
      ancestors={ancestors}
      expanded={expanded}
      toggle={toggle}
      depth={0}
    />
  );
}
