import type { TocHeading } from "@/lib/posts/markdown";

function Links({ headings }: { headings: TocHeading[] }) {
  return (
    <ol className="space-y-1">
      {headings.map((heading) => (
        <li key={heading.id} className={heading.depth === 3 ? "ml-4" : undefined}>
          <a
            href={`#${heading.id}`}
            className="flex min-h-11 items-center py-1 leading-snug hover:bg-primary hover:text-background xl:min-h-8"
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ol>
  );
}

/**
 * H2/H3 table of contents. Below 1280px it is a collapsible block above the
 * article; from 1280px up it is a sticky column beside it. Only one of the two
 * is ever displayed, so screen readers do not see duplicates.
 */
export function TableOfContents({
  headings,
  placement,
}: {
  headings: TocHeading[];
  placement: "inline" | "sidebar";
}) {
  if (headings.length === 0) return null;

  if (placement === "inline") {
    return (
      <details className="mb-8 border-2 border-ink xl:hidden">
        <summary className="min-h-11 px-4 py-3 font-bold">On this page</summary>
        <nav aria-label="Table of contents" className="border-t-2 border-ink px-4 py-3">
          <Links headings={headings} />
        </nav>
      </details>
    );
  }

  return (
    <nav
      aria-label="Table of contents"
      className="sticky top-24 hidden max-h-[calc(100dvh-8rem)] overflow-y-auto border-l-2 border-primary pl-4 text-sm xl:block"
    >
      <p className="mb-2 font-bold">On this page</p>
      <Links headings={headings} />
    </nav>
  );
}
