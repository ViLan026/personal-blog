"use client";

import { useId, useState, type FormEvent } from "react";
import { CategorySelect } from "@/components/admin/CategorySelect";
import { callAdminApi } from "@/lib/admin-client";
import { isValidSlug, slugify } from "@/lib/slug";
import type { Category } from "@/types/category";

type FieldName = "name" | "slug" | "description" | "parentId" | "sortOrder";

/** Next free position among the siblings, in steps of 10 so items can be slotted in later. */
function nextSortOrder(categories: Category[], parentId: string | null): number {
  const siblings = categories.filter((c) => c.parent_id === parentId);
  return siblings.length ? Math.max(...siblings.map((c) => c.sort_order)) + 10 : 10;
}

export function CategoryForm({
  categories,
  category,
  defaultParentId = null,
  onSaved,
  onCancel,
}: {
  categories: Category[];
  /** Present when editing; absent when creating. */
  category?: Category;
  defaultParentId?: string | null;
  onSaved: (message: string) => void;
  onCancel: () => void;
}) {
  const uid = useId();
  const editing = Boolean(category);

  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(editing);
  const [description, setDescription] = useState(category?.description ?? "");
  const [parentId, setParentId] = useState(category ? (category.parent_id ?? "") : (defaultParentId ?? ""));
  const [sortOrder, setSortOrder] = useState(
    String(category?.sort_order ?? nextSortOrder(categories, defaultParentId)),
  );
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

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const found: Partial<Record<FieldName, string>> = {};
    const order = Number(sortOrder);
    if (!name.trim()) found.name = "Name is required";
    if (!slug.trim()) found.slug = "Slug is required";
    else if (!isValidSlug(slug.trim())) found.slug = "Use lowercase letters, numbers and single hyphens only";
    if (sortOrder.trim() === "" || !Number.isInteger(order)) found.sortOrder = "Sort order must be a whole number";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    const body = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      parentId: parentId || null,
      sortOrder: order,
    };
    const result = category
      ? await callAdminApi(`/api/admin/categories/${category.id}`, { method: "PATCH", json: body })
      : await callAdminApi("/api/admin/categories", { method: "POST", json: body });
    setSaving(false);

    if (!result.ok) {
      setErrors(result.error.fieldErrors ?? {});
      setFormError(result.error.message);
      return;
    }
    onSaved(editing ? "Category saved." : "Category created.");
  }

  return (
    <form onSubmit={submit} noValidate className="border-2 border-primary p-4 sm:p-6" aria-label={editing ? "Edit category" : "New category"}>
      <h2 className="text-xl font-bold">{editing ? `Edit “${category!.name}”` : "New category"}</h2>

      {formError ? (
        <p role="alert" className="alert-error mt-4">
          <strong>Error:</strong> {formError}
        </p>
      ) : null}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor={id("name")} className="label">
            Name
          </label>
          <input
            id={id("name")}
            className="field"
            value={name}
            maxLength={150}
            autoFocus
            onChange={(event) => {
              setName(event.target.value);
              if (!slugTouched) setSlug(slugify(event.target.value, 180));
            }}
            {...fieldProps("name")}
          />
          {error("name")}
        </div>

        <div>
          <label htmlFor={id("slug")} className="label">
            Slug
          </label>
          <input
            id={id("slug")}
            className="field font-mono"
            value={slug}
            maxLength={180}
            autoCapitalize="none"
            spellCheck={false}
            onChange={(event) => {
              setSlug(event.target.value);
              setSlugTouched(true);
            }}
            {...fieldProps("slug")}
          />
          <p className="hint">Part of the URL. Must be unique across all categories.</p>
          {error("slug")}
        </div>

        <div>
          <label htmlFor={id("parent")} className="label">
            Parent category
          </label>
          <CategorySelect
            id={id("parent")}
            categories={categories}
            value={parentId}
            onChange={setParentId}
            placeholder="None (top level)"
            excludeId={category?.id}
            invalid={Boolean(errors.parentId)}
            describedBy={errors.parentId ? id("parentId-error") : undefined}
          />
          {error("parentId")}
        </div>

        <div>
          <label htmlFor={id("sort")} className="label">
            Display order
          </label>
          <input
            id={id("sort")}
            className="field"
            type="number"
            inputMode="numeric"
            step={1}
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            {...fieldProps("sortOrder")}
          />
          <p className="hint">Lower numbers appear first among siblings.</p>
          {error("sortOrder")}
        </div>

        <div className="md:col-span-2">
          <label htmlFor={id("description")} className="label">
            Description <span className="font-normal">(optional)</span>
          </label>
          <textarea
            id={id("description")}
            className="field min-h-24"
            rows={3}
            maxLength={1000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            {...fieldProps("description")}
          />
          {error("description")}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="submit" className="btn" disabled={saving} aria-busy={saving}>
          {saving ? "Saving…" : editing ? "Save changes" : "Create category"}
        </button>
        <button type="button" className="btn-outline" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}
