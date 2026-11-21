import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { PostSummary } from "@/types/post";

export interface CategoryLabel {
  name: string;
  href: string;
}

export function PostCard({
  post,
  category,
}: {
  post: PostSummary;
  category?: CategoryLabel;
}) {
  return (
    <article className="border-2 border-ink p-5 hover:border-primary md:p-6">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        {category ? (
          <Link href={category.href} className="link link-target">
            {category.name}
          </Link>
        ) : null}
        {post.published_at ? (
          <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
        ) : null}
      </p>
      <h3 className="mt-3 text-xl font-bold leading-snug md:text-2xl">
        <Link href={`/blog/post/${post.slug}`} className="underline decoration-primary decoration-2 underline-offset-4 hover:text-primary">
          {post.title}
        </Link>
      </h3>
      {post.excerpt ? <p className="mt-2 max-w-3xl leading-relaxed">{post.excerpt}</p> : null}
    </article>
  );
}
