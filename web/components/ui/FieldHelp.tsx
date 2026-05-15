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
        className="inline-flex h-4 w-4 items-center justify-center border border-neutral-400 text-[10px] leading-none text-neutral-700 hover:bg-neutral-100"
        aria-label={title ? `Help: ${title}` : "Field help"}
        title={title ? `Help: ${title}` : "Field help"}
      >
        i
      </button>

      {open ? (
        <div className="absolute left-0 top-6 z-50 w-80 border border-neutral-300 bg-white p-3 text-xs text-neutral-700 shadow-md">
          {title ? <div className="mb-1 font-semibold text-neutral-900">{title}</div> : null}
          <div className="whitespace-pre-line leading-5">{content}</div>
        </div>
      ) : null}
    </span>
  );
}