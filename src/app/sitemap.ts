import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/data/public";
import { getSiteUrl } from "@/lib/env";

// Rebuilt on every request so a new or unpublished post is reflected at once.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.8 },
  ];

  try {
    // Only published posts are readable by the anonymous role, so drafts can
    // never end up here.
    const { posts, categoryPaths } = await getSitemapEntries();
    for (const path of categoryPaths) {
      entries.push({
        url: `${base}/blog/category/${path.join("/")}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
    for (const post of posts) {
      entries.push({
        url: `${base}/blog/post/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  } catch (error) {
    // Database unreachable or not configured: still serve the static pages.
    console.error("[sitemap] could not load blog entries", error);
  }

  return entries;
}
