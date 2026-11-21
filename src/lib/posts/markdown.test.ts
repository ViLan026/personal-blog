import { test } from "node:test";
import assert from "node:assert/strict";
import { unified } from "unified";
import remarkParse from "remark-parse";
import type { Heading, Root } from "mdast";
import {
  MAX_MARKDOWN_BYTES,
  decodeMarkdownBytes,
  extractFirstH1,
  extractHeadings,
  remarkHeadingIds,
  stripFrontMatter,
  validateMarkdownFileMeta,
} from "@/lib/posts/markdown";

const enc = (s: string) => new TextEncoder().encode(s);

test("accepts .md and .markdown, case-insensitively", () => {
  for (const name of ["a.md", "a.markdown", "A.MD", "notes.v2.Markdown"]) {
    assert.equal(validateMarkdownFileMeta(name, 10), null, name);
  }
});

test("rejects other extensions, including .mdx", () => {
  for (const name of ["a.mdx", "a.txt", "a.md.exe", "a", "md"]) {
    assert.match(validateMarkdownFileMeta(name, 10) ?? "", /\.md and \.markdown/, name);
  }
});

test("rejects empty and oversized files", () => {
  assert.match(validateMarkdownFileMeta("a.md", 0) ?? "", /empty/i);
  assert.equal(validateMarkdownFileMeta("a.md", MAX_MARKDOWN_BYTES), null);
  assert.match(validateMarkdownFileMeta("a.md", MAX_MARKDOWN_BYTES + 1) ?? "", /too large/i);
});

test("decodes Vietnamese and English UTF-8 text", () => {
  const text = "# Tiêu đề\n\nQuản lý bộ nhớ — memory management 🚀";
  assert.deepEqual(decodeMarkdownBytes(enc(text)), { ok: true, text });
});

test("strips a UTF-8 BOM and normalises CRLF line endings", () => {
  const bytes = new Uint8Array([0xef, 0xbb, 0xbf, ...enc("a\r\nb\rc")]);
  assert.deepEqual(decodeMarkdownBytes(bytes), { ok: true, text: "a\nb\nc" });
});

test("rejects invalid UTF-8, binary content and blank files", () => {
  assert.equal(decodeMarkdownBytes(new Uint8Array([0xff, 0xfe, 0x41])).ok, false);
  assert.equal(decodeMarkdownBytes(enc("abc\u0000def")).ok, false);
  assert.equal(decodeMarkdownBytes(enc("")).ok, false);
  assert.equal(decodeMarkdownBytes(enc("  \n\t \n")).ok, false);
});

const doc = [
  "# My Title",
  "",
  "## Overview",
  "text",
  "### Details",
  "#### Too deep for the TOC",
  "## Overview",
  "```md",
  "## Not a heading, it is code",
  "```",
  "## Quản lý bộ nhớ",
].join("\n");

test("table of contents lists only H2 and H3, in order, with unique ids", () => {
  const toc = extractHeadings(doc, "My Title");
  assert.deepEqual(
    toc.map((h) => [h.depth, h.text, h.id]),
    [
      [2, "Overview", "h-overview"],
      [3, "Details", "h-details"],
      [2, "Overview", "h-overview-1"],
      [2, "Quản lý bộ nhớ", "h-quan-ly-bo-nho"],
    ],
  );
});

test("headings inside code fences never reach the table of contents", () => {
  assert.equal(extractHeadings(doc, "My Title").some((h) => h.text.includes("Not a heading")), false);
});

test("remarkHeadingIds drops a repeated leading title and stamps the same ids as the ToC", () => {
  const tree = unified().use(remarkParse).parse(doc) as Root;
  remarkHeadingIds({ title: "my   title" })(tree);

  const headings = tree.children.filter((n): n is Heading => n.type === "heading");
  assert.equal(headings.some((h) => h.depth === 1), false, "leading h1 removed");

  const stamped = headings.map((h) => (h.data as { hProperties?: { id?: string } }).hProperties?.id);
  assert.deepEqual(
    stamped.filter((id) => id !== undefined),
    ["h-overview", "h-details", "h-too-deep-for-the-toc", "h-overview-1", "h-quan-ly-bo-nho"],
  );
});

test("a leading H1 that differs from the title is kept", () => {
  const tree = unified().use(remarkParse).parse("# Something else\n\n## A") as Root;
  remarkHeadingIds({ title: "Real title" })(tree);
  assert.equal(tree.children[0].type, "heading");
});

test("extractFirstH1 returns the first level-1 heading text, or null", () => {
  assert.equal(extractFirstH1("intro\n\n# First\n\n# Second"), "First");
  assert.equal(extractFirstH1("## Only h2\n"), null);
  assert.equal(extractFirstH1("```\n# in code\n```\n"), null);
  assert.equal(extractFirstH1("# **Bold** title"), "Bold title");
});

test("strips YAML front matter only at the very start of the file", () => {
  assert.equal(stripFrontMatter("---\ntitle: Hi\ntags: [a]\n---\n# Body\n"), "# Body\n");
  assert.equal(stripFrontMatter("---\na: 1\n---"), "");
  // A horizontal rule later in the document is content, not front matter.
  const later = "# Title\n\n---\n\ntext\n\n---\n";
  assert.equal(stripFrontMatter(later), later);
  // No closing fence: leave the text alone.
  assert.equal(stripFrontMatter("---\ntitle: x\n"), "---\ntitle: x\n");
});

test("front matter does not leak into the heading list or the title prefill", () => {
  const md = "---\ntitle: Ignored\n---\n# Real Title\n\n## First\n";
  assert.equal(extractFirstH1(md), "Real Title");
  assert.deepEqual(extractHeadings(md, "Real Title").map((h) => h.text), ["First"]);
});
