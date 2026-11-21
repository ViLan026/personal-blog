"use client";

import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";

/** Read-only preview of the uploaded (or stored) Markdown, rendered exactly as visitors will see it. */
export function MarkdownPreview({
  content,
  title,
  label,
}: {
  content: string;
  title: string;
  label: string;
}) {
  return (
    <section aria-label="Markdown preview" className="border-2 border-ink">
      <p className="border-b-2 border-ink bg-primary px-4 py-2 text-sm font-semibold text-background">
        Preview · {label}
      </p>
      <div className="max-h-[70vh] overflow-auto p-4 sm:p-6" tabIndex={0}>
        {title.trim() ? (
          <h2 className="mb-6 text-2xl font-extrabold leading-tight tracking-tight">{title}</h2>
        ) : null}
        <MarkdownRenderer content={content} title={title.trim() || undefined} />
      </div>
    </section>
  );
}
