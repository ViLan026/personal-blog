import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/blog/ArticleView";
import { BlogShell } from "@/components/blog/BlogShell";
import { siteConfig } from "@/config/site";
import { categoryHrefFromChain, getAncestorChain } from "@/lib/categories/category-tree";
import { getBlogTaxonomy, getPublishedPostBySlug } from "@/lib/data/public";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  // Drafts (and unknown slugs) come back as null: Row Level Security hides them.
  const post = await getPublishedPostBySlug(slug);
  if (!post) return { title: "Article not found", robots: { index: false, follow: false } };

  const url = `/blog/post/${post.slug}`;
  const description = post.excerpt || siteConfig.blog.description;
  return {
    title: post.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  const taxonomy = await getBlogTaxonomy();
  const chain = getAncestorChain(taxonomy.categories, post.category_id);
  const last = chain[chain.length - 1];

  return (
    <BlogShell activeCategoryId={post.category_id}>
      <ArticleView
        title={post.title}
        excerpt={post.excerpt}
        contentMd={post.content_md}
        publishedAt={post.published_at}
        crumbs={[
          { label: "Blog", href: "/blog" },
          ...chain.map((c, index) => ({
            label: c.name,
            href: categoryHrefFromChain(chain.slice(0, index + 1)),
          })),
          { label: post.title },
        ]}
        back={
          last
            ? { href: categoryHrefFromChain(chain), label: `Back to ${last.name}` }
            : { href: "/blog", label: "Back to the Blog" }
        }
      />
    </BlogShell>
  );
}
