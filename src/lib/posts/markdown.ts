import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Heading, Root, RootContent } from "mdast";
import { slugify } from "@/lib/slug";

/* ------------------------------------------------------------------ */
/* Upload validation (shared by the browser and the Route Handlers)    */
/* ------------------------------------------------------------------ */

export const MAX_MARKDOWN_BYTES = 1024 * 1024; // 1 MB
export const ALLOWED_MARKDOWN_EXTENSIONS = [".md", ".markdown"] as const;

export function getFileExtension(filename: string): string {
  const index = filename.lastIndexOf(".");
  return index === -1 ? "" : filename.slice(index).toLowerCase();
}

/** Returns an error message, or null when the name and size are acceptable. */
export function validateMarkdownFileMeta(
  filename: string,
  size: number,
): string | null {
  const extension = getFileExtension(filename);
  if (!(ALLOWED_MARKDOWN_EXTENSIONS as readonly string[]).includes(extension)) {
    return "Only .md and .markdown files are accepted.";
  }
  if (size === 0) return "The Markdown file is empty.";
  if (size > MAX_MARKDOWN_BYTES) {
    return `The file is too large. The maximum size is ${MAX_MARKDOWN_BYTES / 1024 / 1024} MB.`;
  }
  return null;
}

export type DecodeResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

/** Strict UTF-8 decoding plus the content checks from the upload workflow. */
export function decodeMarkdownBytes(bytes: ArrayBuffer | Uint8Array): DecodeResult {
  let text: string;
  try {
    // `fatal` rejects invalid UTF-8; the default also strips a leading BOM.
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return { ok: false, error: "The file is not valid UTF-8 text." };
  }
  if (text.includes("\u0000")) {
    return { ok: false, error: "The file looks binary, not Markdown text." };
  }
  text = text.replace(/\r\n?/g, "\n");
  if (text.trim().length === 0) {
    return { ok: false, error: "The Markdown file is empty." };
  }
  return { ok: true, text };
}

/* ------------------------------------------------------------------ */
/* Parsing helpers: heading ids, table of contents, leading title      */
/* ------------------------------------------------------------------ */

export interface TocHeading {
  depth: number;
  text: string;
  id: string;
}

/**
 * Many Markdown files start with a YAML front-matter block (--- ... ---).
 * It is metadata, not article text, so it is removed before rendering.
 * Only a block at the very start of the file counts.
 */
export function stripFrontMatter(markdown: string): string {
  return markdown.replace(/^---[ \t]*\n[\s\S]*?\n---[ \t]*(?:\n|$)/, "");
}

const parser = unified().use(remarkParse).use(remarkGfm);

function nodeText(node: RootContent | Root): string {
  if ("value" in node && typeof node.value === "string") return node.value;
  if ("children" in node) {
    return (node.children as RootContent[]).map(nodeText).join("");
  }
  return "";
}

function normalise(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * The first block is usually "# Article title", which the page already shows
 * as its own <h1>. Drop it when it repeats the title.
 */
function dropLeadingTitle(tree: Root, title?: string): void {
  const first = tree.children[0];
  if (
    title &&
    first?.type === "heading" &&
    first.depth === 1 &&
    normalise(nodeText(first)) === normalise(title)
  ) {
    tree.children.shift();
  }
}

function findHeadings(node: Root | RootContent, found: Heading[] = []): Heading[] {
  if (node.type === "heading") found.push(node);
  if ("children" in node) {
    for (const child of node.children as RootContent[]) findHeadings(child, found);
  }
  return found;
}

/** Ids are prefixed so user content can never collide with page ids like #main. */
const ID_PREFIX = "h-";

function assignIds(headings: Heading[]): TocHeading[] {
  const used = new Set<string>();
  return headings.map((heading) => {
    const text = nodeText(heading).trim();
    const base = `${ID_PREFIX}${slugify(text) || "section"}`;
    let id = base;
    for (let i = 1; used.has(id); i++) id = `${base}-${i}`;
    used.add(id);
    return { depth: heading.depth, text, id };
  });
}

/** Remark plugin: removes the repeated title and stamps an id on every heading. */
export function remarkHeadingIds(options: { title?: string } = {}) {
  return (tree: Root) => {
    dropLeadingTitle(tree, options.title);
    const headings = findHeadings(tree);
    const ids = assignIds(headings);
    headings.forEach((heading, index) => {
      heading.data = {
        ...heading.data,
        hProperties: { id: ids[index].id },
      } as Heading["data"];
    });
  };
}

/** H2 and H3 headings for the table of contents, using the same ids as the page. */
export function extractHeadings(markdown: string, title?: string): TocHeading[] {
  const tree = parser.parse(stripFrontMatter(markdown));
  dropLeadingTitle(tree, title);
  return assignIds(findHeadings(tree)).filter(
    (heading) => heading.depth === 2 || heading.depth === 3,
  );
}

/** Text of the first "# Heading", used to pre-fill the title field on upload. */
export function extractFirstH1(markdown: string): string | null {
  const tree = parser.parse(stripFrontMatter(markdown));
  const h1 = findHeadings(tree).find((heading) => heading.depth === 1);
  const text = h1 ? nodeText(h1).trim() : "";
  return text || null;
}
