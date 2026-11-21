import type { Metadata } from "next";
import Link from "next/link";
import { BlogShell } from "@/components/blog/BlogShell";
import { PostCard } from "@/components/blog/PostCard";
import { Pagination } from "@/components/ui/Pagination";
import { siteConfig } from "@/config/site";
import { categoryHref, getAncestorChain, categoryHrefFromChain } from "@/lib/categories/category-tree";
import { getBlogTaxonomy, getPublishedPosts } from "@/lib/data/public";
import { pluralise } from "@/lib/format";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ page?: string }>;

const pageNumber = (value?: string) => Math.max(1, Number.parseInt(value ?? "", 10) || 1);

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const page = pageNumber((await searchParams).page);
  const canonical = page > 1 ? `/blog?page=${page}` : "/blog";
  return {
    title: siteConfig.blog.title,
    description: siteConfig.blog.description,
    alternates: { canonical },
    openGraph: { url: canonical, title: siteConfig.blog.title, description: siteConfig.blog.description },
  };
}

export default async function BlogHomePage({ searchParams }: { searchParams: SearchParams }) {
  const requested = pageNumber((await searchParams).page);
  const [taxonomy, result] = await Promise.all([
    getBlogTaxonomy(),
    getPublishedPosts({ page: requested, pageSize: siteConfig.postsPerPage }),
  ]);

  return (
    <BlogShell isHome>
      <header className="border-b-2 border-primary pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{siteConfig.blog.title}</h1>
        <p className="mt-3 max-w-prose text-lg">{siteConfig.blog.description}</p>
      </header>

      {taxonomy.tree.length > 0 ? (
        <section aria-labelledby="topics-title" className="mt-8">
          <h2 id="topics-title" className="text-xl font-bold">
            Browse by topic
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {taxonomy.tree.map((node) => (
              <li key={node.id}>
                <Link
                  href={categoryHref(node)}
                  className="flex min-h-11 items-center justify-between gap-3 border-2 border-primary px-4 py-3 font-semibold hover:bg-primary hover:text-background"
                >
                  <span className="min-w-0 break-words">{node.name}</span>
                  <span className="shrink-0 text-sm font-medium">
                    {pluralise(node.postCount, "article")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="latest-title" className="mt-10">
        <h2 id="latest-title" className="text-xl font-bold">
          Latest articles
        </h2>

        {result.posts.length === 0 ? (
          <p className="mt-4 border-2 border-ink p-6">No articles have been published yet.</p>
        ) : (
          <ul className="mt-4 grid gap-4">
            {result.posts.map((post) => {
              const chain = getAncestorChain(taxonomy.categories, post.category_id);
              const last = chain[chain.length - 1];
              return (
                <li key={post.id}>
                  <PostCard
                    post={post}
                    category={last ? { name: last.name, href: categoryHrefFromChain(chain) } : undefined}
                  />
                </li>
              );
            })}
          </ul>
        )}

        <Pagination basePath="/blog" page={result.page} totalPages={result.totalPages} />
      </section>
    </BlogShell>
  );
}
