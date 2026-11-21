import Link from "next/link";
import { Breadcrumbs, type Crumb } from "@/components/blog/Breadcrumbs";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { formatDate } from "@/lib/format";
import { extractHeadings } from "@/lib/posts/markdown";

/**
 * The reading layout, shared by the public article page and the admin preview.
 * A comfortable measure (max 48rem), with the table of contents above the
 * article on tablet/mobile and beside it on desktop.
 */
export function ArticleView({
  title,
  excerpt,
  contentMd,
  publishedAt,
  crumbs,
  back,
}: {
  title: string;
  excerpt: string | null;
  contentMd: string;
  publishedAt: string | null;
  crumbs: Crumb[];
  back: { href: string; label: string };
}) {
  const headings = extractHeadings(contentMd, title);

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_14rem]">
      <article className="min-w-0 max-w-3xl">
        <Breadcrumbs items={crumbs} />

        <header className="border-b-2 border-primary pb-6">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
            {title}
          </h1>
          {publishedAt ? (
            <p className="mt-3 font-medium">
              <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
            </p>
          ) : null}
          {excerpt ? <p className="mt-4 text-lg leading-relaxed">{excerpt}</p> : null}
        </header>

        <div className="mt-8">
          <TableOfContents headings={headings} placement="inline" />
          <MarkdownRenderer content={contentMd} title={title} />
        </div>

        <footer className="mt-12 border-t-2 border-ink pt-6">
          <Link href={back.href} className="btn-outline">
            <span aria-hidden="true">←</span>
            {back.label}
          </Link>
        </footer>
      </article>

      <aside className="hidden xl:block" aria-label="Article outline">
        <TableOfContents headings={headings} placement="sidebar" />
      </aside>
    </div>
  );
}
