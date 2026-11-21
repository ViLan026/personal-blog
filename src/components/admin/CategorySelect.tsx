"use client";

import { useMemo } from "react";
import {
  buildCategoryTree,
  collectSubtreeIds,
  findNodeById,
  flattenTree,
} from "@/lib/categories/category-tree";
import type { Category } from "@/types/category";

/**
 * Nested category picker. It is a native <select> (best on touch devices and
 * for screen readers) with options indented by depth. `excludeId` hides a
 * category and everything beneath it, which is how the "change parent" form
 * makes circular moves impossible to pick.
 */
export function CategorySelect({
  id,
  categories,
  value,
  onChange,
  placeholder,
  excludeId,
  invalid,
  describedBy,
  disabled,
}: {
  id: string;
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
  /** Label of the empty option, e.g. "Select a category…" or "None (top level)". */
  placeholder: string;
  excludeId?: string;
  invalid?: boolean;
  describedBy?: string;
  disabled?: boolean;
}) {
  const options = useMemo(() => {
    const tree = buildCategoryTree(categories);
    const hidden = new Set<string>();
    if (excludeId) {
      const node = findNodeById(tree, excludeId);
      if (node) collectSubtreeIds(node).forEach((nodeId) => hidden.add(nodeId));
    }
    return flattenTree(tree).filter((node) => !hidden.has(node.id));
  }, [categories, excludeId]);

  return (
    <select
      id={id}
      className="field"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      disabled={disabled}
    >
      <option value="">{placeholder}</option>
      {options.map((node) => (
        <option key={node.id} value={node.id}>
          {"   ".repeat(node.depth)}
          {node.depth > 0 ? "└ " : ""}
          {node.name}
        </option>
      ))}
    </select>
  );
}
