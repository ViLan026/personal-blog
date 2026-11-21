import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { BlogShell } from "@/components/blog/BlogShell";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { PostCard } from "@/components/blog/PostCard";
import { Pagination } from "@/components/ui/Pagination";
import { siteConfig } from "@/config/site";
import {
  categoryHref,
  categoryHrefFromChain,
  collectSubtreeIds,
  getAncestorChain,
} from "@/lib/categories/category-tree";
import { getBlogTaxonomy, getPublishedPosts } from "@/lib/data/public";
import { pluralise } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ path: string[] }>;
  searchParams: Promise<{ page?: string }>;
};

const pageNumber = (value?: string) => Math.max(1, Number.parseInt(value ?? "", 10) || 1);

/** decodeURIComponent throws on a malformed "%" sequence; treat that as plain text. */
function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * The URL is the chain of slugs from the root, e.g. /blog/category/programming/java.
 * Slugs are globally unique, so the LAST segment identifies the category; the
 * rest must match its real ancestors, otherwise we redirect to the canonical URL.
 */
async function resolveCategory(path: string[]) {
  const taxonomy = await getBlogTaxonomy();
  const slug = safeDecode(path[path.length - 1] ?? "");
  const category = taxonomy.categories.find((c) => c.slug === slug);
  if (!category) return null;

  const chain = getAncestorChain(taxonomy.categories, category.id);
  return { taxonomy, category, chain, canonical: categoryHrefFromChain(chain) };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ path }, { page }] = await Promise.all([params, searchParams]);
  const resolved = await resolveCategory(path);
  if (!resolved) return { title: "Category not found", robots: { index: false, follow: false } };

  const { category, canonical } = resolved;
  const url = pageNumber(page) > 1 ? `${canonical}?page=${pageNumber(page)}` : canonical;
  const description = category.description || `Articles about ${category.name}.`;
  return {
    title: category.name,
    description,
    alternates: { canonical: url },
    openGraph: { url, title: category.name, description },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ path }, { page }] = await Promise.all([params, searchParams]);
  const resolved = await resolveCategory(path);
  if (!resolved) notFound();

  const { taxonomy, category, chain, canonical } = resolved;
  if (path.map(safeDecode).join("/") !== chain.map((c) => c.slug).join("/")) {
    permanentRedirect(canonical);
  }

  const node = taxonomy.byId.get(category.id)!;
  const result = await getPublishedPosts({
    categoryIds: collectSubtreeIds(node),
    page: pageNumber(page),
    pageSize: siteConfig.postsPerPage,
  });

  return (
    <BlogShell activeCategoryId={category.id}>
      <Breadcrumbs
        items={[
          { label: "Blog", href: "/blog" },
          ...chain.map((c, index) =>
            index === chain.length - 1
              ? { label: c.name }
              : { label: c.name, href: categoryHrefFromChain(chain.slice(0, index + 1)) },
          ),
        ]}
      />

      <header className="border-b-2 border-primary pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{category.name}</h1>
        {category.description ? (
          <p className="mt-3 max-w-prose text-lg">{category.description}</p>
        ) : null}
        <p className="mt-3 font-medium">{pluralise(node.postCount, "article")}</p>
      </header>

      {node.children.length > 0 ? (
        <section aria-labelledby="subcategories-title" className="mt-8">
          <h2 id="subcategories-title" className="text-xl font-bold">
            Subcategories
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {node.children.map((child) => (
              <li key={child.id}>
                <Link
                  href={categoryHref(child)}
                  className="flex min-h-11 items-center justify-between gap-3 border-2 border-primary px-4 py-3 font-semibold hover:bg-primary hover:text-background"
                >
                  <span className="min-w-0 break-words">{child.name}</span>
                  <span className="shrink-0 text-sm font-medium">{child.postCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="articles-title" className="mt-10">
        <h2 id="articles-title" className="text-xl font-bold">
          Articles
        </h2>

        {result.posts.length === 0 ? (
          <p className="mt-4 border-2 border-ink p-6">
            No articles have been published in this category yet.
          </p>
        ) : (
          <ul className="mt-4 grid gap-4">
            {result.posts.map((post) => {
              const postChain = getAncestorChain(taxonomy.categories, post.category_id);
              const last = postChain[postChain.length - 1];
              return (
                <li key={post.id}>
                  <PostCard
                    post={post}
                    category={
                      last && last.id !== category.id
                        ? { name: last.name, href: categoryHrefFromChain(postChain) }
                        : undefined
                    }
                  />
                </li>
              );
            })}
          </ul>
        )}

        <Pagination basePath={canonical} page={result.page} totalPages={result.totalPages} />
      </section>
    </BlogShell>
  );
}
