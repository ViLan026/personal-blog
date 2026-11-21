"use client";

import { useId, useRef, useState, type ChangeEvent } from "react";
import {
  MAX_MARKDOWN_BYTES,
  decodeMarkdownBytes,
  validateMarkdownFileMeta,
} from "@/lib/posts/markdown";

export interface LoadedMarkdown {
  file: File;
  text: string;
}

function formatSize(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

/**
 * File picker for the article body. There is deliberately no text editor: the
 * only way to set or change the content is to upload a .md / .markdown file.
 * The same checks run again on the server, which is the one that counts.
 */
export function MarkdownUploader({
  loaded,
  onLoaded,
  serverError,
  required,
  replacing = false,
  currentFilename,
}: {
  loaded: LoadedMarkdown | null;
  onLoaded: (value: LoadedMarkdown | null) => void;
  serverError?: string;
  required: boolean;
  /** Edit mode: content already exists and an upload replaces it. */
  replacing?: boolean;
  /** Edit mode: the file the stored content originally came from. */
  currentFilename?: string | null;
}) {
  const inputId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);

  const error = localError ?? serverError;

  function reject(message: string) {
    setLocalError(message);
    onLoaded(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setLocalError(null);
    const file = event.target.files?.[0];
    if (!file) {
      onLoaded(null);
      return;
    }

    const metaError = validateMarkdownFileMeta(file.name, file.size);
    if (metaError) return reject(metaError);

    setReading(true);
    let decoded: ReturnType<typeof decodeMarkdownBytes>;
    try {
      decoded = decodeMarkdownBytes(await file.arrayBuffer());
    } catch {
      setReading(false);
      return reject("The file could not be read. Please try again.");
    }
    setReading(false);

    if (!decoded.ok) return reject(decoded.error);
    onLoaded({ file, text: decoded.text });
  }

  return (
    <div>
      <label htmlFor={inputId} className="label">
        {replacing ? "Replace Markdown file" : "Markdown file"}
        {required ? null : <span className="font-normal"> (optional)</span>}
      </label>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        name="file"
        accept=".md,.markdown,text/markdown"
        className="field file:mr-4 file:cursor-pointer file:border-0 file:bg-primary file:px-4 file:py-2 file:font-semibold file:text-background"
        onChange={handleChange}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${errorId}${error ? "" : "-hint"}`}
      />

      <p id={`${errorId}-hint`} className="hint">
        .md or .markdown only, up to {MAX_MARKDOWN_BYTES / 1024 / 1024} MB, UTF-8 text. To change the
        article body, upload a new file.
      </p>

      {currentFilename && !loaded ? (
        <p className="mt-2 text-sm">
          Current file: <span className="font-mono">{currentFilename}</span>
        </p>
      ) : null}

      {reading ? (
        <p role="status" className="mt-2 text-sm">
          Reading file…
        </p>
      ) : null}

      {loaded ? (
        <p role="status" className="mt-2 text-sm">
          Selected: <span className="break-all font-mono">{loaded.file.name}</span> (
          {formatSize(loaded.file.size)})
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
