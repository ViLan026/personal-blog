import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildCategoryTree,
  categoryHref,
  categoryHrefFromChain,
  collectSubtreeIds,
  findNodeById,
  flattenTree,
  getAncestorChain,
  wouldCreateCycle,
} from "@/lib/categories/category-tree";
import type { Category } from "@/types/category";

function cat(id: string, parent: string | null = null, sort = 0, name = id): Category {
  return {
    id,
    name,
    slug: id,
    description: null,
    parent_id: parent,
    sort_order: sort,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

// cs ─ os ─ process
//    └ net
// prog ─ java ─ oop
const sample = [
  cat("cs", null, 10),
  cat("prog", null, 20),
  cat("os", "cs", 10),
  cat("net", "cs", 20),
  cat("process", "os", 10),
  cat("java", "prog", 10),
  cat("oop", "java", 10),
];

test("buildCategoryTree nests children and records depth and slug path", () => {
  const tree = buildCategoryTree(sample);
  assert.deepEqual(tree.map((n) => n.id), ["cs", "prog"]);

  const process = tree[0].children[0].children[0];
  assert.equal(process.id, "process");
  assert.equal(process.depth, 2);
  assert.deepEqual(process.path, ["cs", "os", "process"]);
  assert.equal(tree[1].children[0].children[0].depth, 2);
});

test("siblings are ordered by sort_order, then by name", () => {
  const tree = buildCategoryTree([
    cat("b", null, 5, "Beta"),
    cat("a", null, 5, "Alpha"),
    cat("z", null, 1, "Zulu"),
    cat("c", null, 9, "Charlie"),
  ]);
  assert.deepEqual(tree.map((n) => n.id), ["z", "a", "b", "c"]);
});

test("buildCategoryTree does not mutate its input", () => {
  const input = [...sample];
  buildCategoryTree(input);
  assert.deepEqual(input, sample);
  assert.equal("children" in input[0], false);
});

test("a category whose parent is missing is treated as a root", () => {
  const tree = buildCategoryTree([cat("orphan", "ghost"), cat("root")]);
  assert.deepEqual(tree.map((n) => n.id).sort(), ["orphan", "root"]);
});

test("unreachable cycles are left out instead of looping forever", () => {
  const tree = buildCategoryTree([cat("a", "b"), cat("b", "a"), cat("self", "self"), cat("ok")]);
  assert.deepEqual(tree.map((n) => n.id), ["ok"]);
});

test("flattenTree is depth-first, parents before children", () => {
  const ids = flattenTree(buildCategoryTree(sample)).map((n) => n.id);
  assert.deepEqual(ids, ["cs", "os", "process", "net", "prog", "java", "oop"]);
});

test("findNodeById and collectSubtreeIds", () => {
  const tree = buildCategoryTree(sample);
  assert.equal(findNodeById(tree, "oop")?.depth, 2);
  assert.equal(findNodeById(tree, "nope"), null);

  const os = findNodeById(tree, "os")!;
  assert.deepEqual(collectSubtreeIds(os), ["os", "process"]);
  assert.deepEqual(collectSubtreeIds(findNodeById(tree, "net")!), ["net"]);
});

test("getAncestorChain returns root to category and is cycle-safe", () => {
  assert.deepEqual(getAncestorChain(sample, "oop").map((c) => c.id), ["prog", "java", "oop"]);
  assert.deepEqual(getAncestorChain(sample, "cs").map((c) => c.id), ["cs"]);
  assert.deepEqual(getAncestorChain(sample, "missing"), []);

  const loop = [cat("a", "b"), cat("b", "a")];
  assert.equal(getAncestorChain(loop, "a").length, 2);
});

test("category URLs are built from the slug path and percent-encoded", () => {
  const tree = buildCategoryTree(sample);
  assert.equal(categoryHref(findNodeById(tree, "oop")!), "/blog/category/prog/java/oop");
  assert.equal(categoryHrefFromChain(getAncestorChain(sample, "process")), "/blog/category/cs/os/process");
  assert.equal(categoryHref({ path: ["a b", "c/d"] }), "/blog/category/a%20b/c%2Fd");
});

test("wouldCreateCycle blocks self, descendants and deep descendants", () => {
  assert.equal(wouldCreateCycle(sample, "cs", "cs"), true);
  assert.equal(wouldCreateCycle(sample, "cs", "os"), true);
  assert.equal(wouldCreateCycle(sample, "cs", "process"), true);
  // The example from the brief: OOP must not become the parent of its own ancestor.
  assert.equal(wouldCreateCycle(sample, "prog", "oop"), true);
});

test("wouldCreateCycle allows legitimate moves", () => {
  assert.equal(wouldCreateCycle(sample, "oop", "cs"), false);
  assert.equal(wouldCreateCycle(sample, "net", "os"), false);
  assert.equal(wouldCreateCycle(sample, "process", null), false);
  assert.equal(wouldCreateCycle(sample, "java", "cs"), false);
});
