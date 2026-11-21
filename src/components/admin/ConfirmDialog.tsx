"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * Accessible confirmation built on the native <dialog>: focus is trapped,
 * Escape cancels, and the page behind is inert. "Cancel" comes first in the
 * tab order so the destructive button is never focused by accident.
 */
export function ConfirmDialog({
  open,
  title,
  confirmLabel,
  busyLabel = "Working…",
  busy = false,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  confirmLabel: string;
  busyLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md border-2 border-primary bg-background p-6 text-ink shadow-[8px_8px_0_0_var(--text)] backdrop:bg-transparent"
    >
      <h2 id={titleId} className="text-xl font-bold">
        {title}
      </h2>
      <div className="mt-3 break-words">{children}</div>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" className="btn-outline" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="button" className="btn" onClick={onConfirm} disabled={busy} aria-busy={busy}>
          {busy ? busyLabel : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
