export type PostStatus = "draft" | "published";

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category_id: string;
  content_md: string;
  original_filename: string | null;
  status: PostStatus;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

/** Everything except the (potentially large) Markdown body. */
export type PostSummary = Omit<Post, "content_md">;

export const POST_SUMMARY_COLUMNS =
  "id,title,slug,excerpt,category_id,original_filename,status,created_at,updated_at,published_at";

export const POST_COLUMNS = `${POST_SUMMARY_COLUMNS},content_md`;
