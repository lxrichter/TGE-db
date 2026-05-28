"use client";

import { useEffect, useRef, useState } from "react";

type FieldHelpProps = {
  title?: string;
  content: string;
};

export default function FieldHelp({ title, content }: FieldHelpProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <span ref={wrapperRef} className="relative ml-1 inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-4 w-4 items-center justify-center border border-[var(--tge-governance-neutral-border)] text-[10px] leading-none text-[var(--tge-governance-neutral-text)] hover:bg-[var(--tge-surface-subtle)]"
        aria-label={title ? `Help: ${title}` : "Field help"}
        title={title ? `Help: ${title}` : "Field help"}
      >
        i
      </button>

      {open ? (
        <div className="absolute left-0 top-6 z-50 w-80 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] p-3 text-xs text-[var(--tge-governance-neutral-text)] shadow-md">
          {title ? (
            <div className="mb-1 font-semibold text-[var(--tge-text-primary)]">
              {title}
            </div>
          ) : null}
          <div className="whitespace-pre-line leading-5">{content}</div>
        </div>
      ) : null}
    </span>
  );
}
