import "server-only";

import { ApiError } from "@/lib/api";
import { decodeMarkdownBytes, validateMarkdownFileMeta } from "@/lib/posts/markdown";

export interface MarkdownUpload {
  filename: string;
  text: string;
}

/**
 * Server-side validation of an uploaded Markdown file (the browser checks the
 * same things first, but the browser is never trusted).
 *
 * Returns null when no file was sent and one is not required. Browsers send an
 * empty, nameless file part when the file input was left blank, which counts
 * as "no file".
 */
export async function readMarkdownUpload(
  value: FormDataEntryValue | null,
  options: { required: boolean },
): Promise<MarkdownUpload | null> {
  const nothingSent = !(value instanceof File) || (value.size === 0 && !value.name);
  if (nothingSent) {
    if (!options.required) return null;
    const message = "Upload a Markdown file (.md or .markdown).";
    throw new ApiError(422, "file_required", message, { file: message });
  }

  const invalid = (message: string) =>
    new ApiError(422, "invalid_file", message, { file: message });

  const metaError = validateMarkdownFileMeta(value.name, value.size);
  if (metaError) throw invalid(metaError);

  const decoded = decodeMarkdownBytes(await value.arrayBuffer());
  if (!decoded.ok) throw invalid(decoded.error);

  // Keep only the base name; drop control characters; fit the column.
  const filename = value.name
    .split(/[\\/]/)
    .pop()!
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .slice(0, 255);

  return { filename, text: decoded.text };
}
