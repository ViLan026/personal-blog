"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { CategorySelect } from "@/components/admin/CategorySelect";
import { MarkdownPreview } from "@/components/admin/MarkdownPreview";
import { MarkdownUploader, type LoadedMarkdown } from "@/components/admin/MarkdownUploader";
import { callAdminApi } from "@/lib/admin-client";
import { extractFirstH1 } from "@/lib/posts/markdown";
import { isValidSlug, slugify } from "@/lib/slug";
import type { Category } from "@/types/category";
import type { PostStatus } from "@/types/post";

type FieldName = "title" | "slug" | "excerpt" | "categoryId" | "status" | "file";

export interface PostFormInitial {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  categoryId: string;
  status: PostStatus;
  originalFilename: string | null;
  contentMd: string;
}

export function PostForm({
  mode,
  categories,
  initial,
}: {
  mode: "create" | "edit";
  categories: Category[];
  initial?: PostFormInitial;
}) {
  const router = useRouter();
  const uid = useId();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  // Editing an existing post must never silently rewrite its URL.
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [status, setStatus] = useState<PostStatus>(initial?.status ?? "draft");
  const [upload, setUpload] = useState<LoadedMarkdown | null>(null);

  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const id = (field: string) => `${uid}-${field}`;
  const fieldProps = (field: FieldName) => ({
    "aria-invalid": errors[field] ? (true as const) : undefined,
    "aria-describedby": errors[field] ? id(`${field}-error`) : undefined,
  });
  const error = (field: FieldName) =>
    errors[field] ? (
      <p id={id(`${field}-error`)} className="field-error">
        {errors[field]}
      </p>
    ) : null;

  function changeTitle(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function handleUpload(next: LoadedMarkdown | null) {
    setUpload(next);
    // Convenience: take the title from the file's first "# Heading" when empty.
    if (next && !title.trim()) {
      const heading = extractFirstH1(next.text);
      if (heading) changeTitle(heading.slice(0, 255));
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const found: Partial<Record<FieldName, string>> = {};
    if (!title.trim()) found.title = "Title is required";
    if (!slug.trim()) found.slug = "Slug is required";
    else if (!isValidSlug(slug.trim())) found.slug = "Use lowercase letters, numbers and single hyphens only";
    if (!categoryId) found.categoryId = "Choose a category";
    if (mode === "create" && !upload) found.file = "Upload a Markdown file (.md or .markdown)";
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFormError("Please fix the highlighted fields.");
      return;
    }

    const form = new FormData();
    form.set("title", title.trim());
    form.set("slug", slug.trim());
    form.set("excerpt", excerpt.trim());
    form.set("categoryId", categoryId);
    form.set("status", status);
    if (upload) form.set("file", upload.file);

    setSaving(true);
    const result =
      mode === "create"
        ? await callAdminApi("/api/admin/posts", { method: "POST", form })
        : await callAdminApi(`/api/admin/posts/${initial!.id}`, { method: "PATCH", form });

    if (!result.ok) {
      setSaving(false);
      setErrors(result.error.fieldErrors ?? {});
      setFormError(result.error.message);
      return;
    }
    router.push(`/admin/posts?notice=${mode === "create" ? "created" : "updated"}`);
  }

  const previewSource = upload?.text ?? initial?.contentMd ?? null;
  const previewLabel = upload ? upload.file.name : (initial?.originalFilename ?? "stored article");

  return (
    <form onSubmit={submit} noValidate className="max-w-3xl space-y-6">
      {formError ? (
        <p role="alert" className="alert-error">
          <strong>Error:</strong> {formError}
        </p>
      ) : null}

      <div>
        <label htmlFor={id("title")} className="label">
          Title
        </label>
        <input
          id={id("title")}
          className="field"
          value={title}
          maxLength={255}
          onChange={(event) => changeTitle(event.target.value)}
          {...fieldProps("title")}
        />
        {error("title")}
      </div>

      <div>
        <label htmlFor={id("slug")} className="label">
          Slug
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id={id("slug")}
            className="field font-mono"
            value={slug}
            maxLength={255}
            autoCapitalize="none"
            spellCheck={false}
            onChange={(event) => {
              setSlug(event.target.value);
              setSlugTouched(true);
            }}
            {...fieldProps("slug")}
          />
          <button
            type="button"
            className="btn-outline btn-sm shrink-0"
            onClick={() => {
              setSlug(slugify(title));
              setSlugTouched(false);
            }}
          >
            Generate from title
          </button>
        </div>
        <p className="hint">
          Public address: /blog/post/{slug || "…"} — generated from the title, editable.
        </p>
        {error("slug")}
      </div>

      <div>
        <label htmlFor={id("excerpt")} className="label">
          Description / excerpt <span className="font-normal">(optional)</span>
        </label>
        <textarea
          id={id("excerpt")}
          className="field min-h-24"
          rows={3}
          maxLength={500}
          value={excerpt}
          onChange={(event) => setExcerpt(event.target.value)}
          {...fieldProps("excerpt")}
        />
        <p className="hint">Shown in lists and in search-engine results.</p>
        {error("excerpt")}
      </div>

      <div>
        <label htmlFor={id("category")} className="label">
          Category
        </label>
        <CategorySelect
          id={id("category")}
          categories={categories}
          value={categoryId}
          onChange={setCategoryId}
          placeholder="Select a category…"
          invalid={Boolean(errors.categoryId)}
          describedBy={errors.categoryId ? id("categoryId-error") : undefined}
        />
        {error("categoryId")}
      </div>

      <MarkdownUploader
        loaded={upload}
        onLoaded={handleUpload}
        serverError={errors.file}
        required={mode === "create"}
        replacing={mode === "edit"}
        currentFilename={initial?.originalFilename}
      />

      {previewSource ? (
        <MarkdownPreview content={previewSource} title={title} label={previewLabel} />
      ) : null}

      <fieldset>
        <legend className="label">Status</legend>
        <div className="flex flex-wrap gap-3">
          {(["draft", "published"] as const).map((value) => (
            <label
              key={value}
              className={`flex min-h-11 cursor-pointer items-center gap-2 border-2 px-4 py-2 font-semibold ${
                status === value ? "border-primary bg-primary text-background" : "border-ink"
              }`}
            >
              <input
                type="radio"
                name="status"
                value={value}
                checked={status === value}
                onChange={() => setStatus(value)}
                className="sr-only"
              />
              {value === "draft" ? "Draft" : "Published"}
            </label>
          ))}
        </div>
        <p className="hint">
          Drafts are visible only here in Admin. Published posts appear on the Blog straight away.
        </p>
        {error("status")}
      </fieldset>

      <div className="flex flex-wrap gap-3 border-t-2 border-ink pt-6">
        <button type="submit" className="btn" disabled={saving} aria-busy={saving}>
          {saving ? "Saving…" : mode === "create" ? "Create post" : "Save changes"}
        </button>
        <Link href="/admin/posts" className="btn-outline">
          Cancel
        </Link>
        {mode === "edit" && initial ? (
          <Link href={`/admin/posts/${initial.id}/preview`} className="btn-outline">
            Preview article
          </Link>
        ) : null}
      </div>
    </form>
  );
}
