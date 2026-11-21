import { Children, isValidElement, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { remarkHeadingIds, stripFrontMatter } from "@/lib/posts/markdown";

/**
 * Uploaded Markdown is UNTRUSTED. Safety comes from what is left out:
 *
 *   - No rehype-raw: HTML inside the Markdown is never turned into elements
 *     (`skipHtml` drops it entirely).
 *   - No dangerouslySetInnerHTML anywhere.
 *   - `urlTransform` only lets http(s), mailto, in-page anchors and relative
 *     paths through, so `javascript:` / `data:` links and images are removed.
 *   - External links open with rel="noopener noreferrer".
 *
 * Works on the server (public pages) and in the browser (upload preview).
 */

function safeUrl(url: string): string {
  const value = url.trim();
  if (value.startsWith("#")) return value;
  if (value.startsWith("/") || value.startsWith("./") || value.startsWith("../")) return value;
  try {
    const parsed = new URL(value);
    return ["http:", "https:", "mailto:"].includes(parsed.protocol) ? value : "";
  } catch {
    // Not absolute: a relative path like "other-note" is fine, but anything
    // that still contains a scheme-like colon is not.
    return value.includes(":") ? "" : value;
  }
}

function languageOf(children: ReactNode): string | null {
  const child = Children.toArray(children)[0];
  if (isValidElement<{ className?: string }>(child)) {
    const match = /language-([\w+#.-]+)/.exec(child.props.className ?? "");
    if (match) return match[1];
  }
  return null;
}

const components: Components = {
  // The page already has an <h1> (the article title), so a Markdown "# Heading"
  // is exposed as an <h2> to keep a single h1 per page.
  h1: ({ id, children }) => <h2 id={id}>{children}</h2>,

  a: ({ href, children }) => {
    if (!href) return <span>{children}</span>;
    const external = /^(https?:)?\/\//i.test(href);
    return (
      <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    );
  },

  pre: ({ children }) => {
    const language = languageOf(children);
    return (
      <div className="code-block">
        {language ? <div className="code-lang">{language}</div> : null}
        {/* Focusable so keyboard users can scroll long lines. */}
        <pre tabIndex={0}>{children}</pre>
      </div>
    );
  },

  table: ({ children }) => (
    <div className="table-wrap" role="region" aria-label="Scrollable table" tabIndex={0}>
      <table>{children}</table>
    </div>
  ),

  img: ({ src, alt }) =>
    typeof src === "string" && src ? (
      // Plain <img>: the source is an arbitrary external URL from the article.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt ?? ""} loading="lazy" decoding="async" />
    ) : null,
};

export function MarkdownRenderer({ content, title }: { content: string; title?: string }) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, [remarkHeadingIds, { title }]]}
        components={components}
        urlTransform={safeUrl}
        skipHtml
      >
        {stripFrontMatter(content)}
      </ReactMarkdown>
    </div>
  );
}
