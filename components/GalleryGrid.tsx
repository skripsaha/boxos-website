"use client";

import * as React from "react";
import { formatDate } from "@/lib/markdown";

type Item = {
  id: number;
  title: string;
  caption: string | null;
  image_data: string;
  created_at: number;
  author_name: string;
};

export function GalleryGrid({ items }: { items: Item[] }) {
  const [openIdx, setOpenIdx] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (openIdx === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenIdx(null);
      else if (e.key === "ArrowRight") setOpenIdx((i) => (i === null ? null : Math.min(items.length - 1, i + 1)));
      else if (e.key === "ArrowLeft")  setOpenIdx((i) => (i === null ? null : Math.max(0, i - 1)));
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [openIdx, items.length]);

  return (
    <>
      <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {items.map((it, idx) => (
          <li key={it.id}>
            <button
              type="button"
              onClick={() => setOpenIdx(idx)}
              className="card p-0 overflow-hidden group w-full text-left"
            >
              <div className="aspect-[4/3] bg-[color:var(--color-paper-2)] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.image_data}
                  alt={it.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-4">
                <p className="text-[15px] font-medium tracking-tight leading-snug truncate">{it.title}</p>
                {it.caption && (
                  <p className="mt-1.5 text-[13px] text-[color:var(--color-ink-2)] line-clamp-2">{it.caption}</p>
                )}
                <p className="mt-3 text-[10.5px] tabular font-mono text-[color:var(--color-ink-3)]">
                  {formatDate(it.created_at)} · {it.author_name}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {openIdx !== null && (
        <Lightbox
          item={items[openIdx]}
          index={openIdx}
          total={items.length}
          onClose={() => setOpenIdx(null)}
          onPrev={() => setOpenIdx((i) => (i === null ? null : Math.max(0, i - 1)))}
          onNext={() => setOpenIdx((i) => (i === null ? null : Math.min(items.length - 1, i + 1)))}
        />
      )}
    </>
  );
}

function Lightbox({
  item, index, total, onClose, onPrev, onNext,
}: {
  item: Item; index: number; total: number;
  onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: "color-mix(in oklch, #0E0D0B 92%, transparent)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      {/* top bar */}
      <div className="flex items-center justify-between px-5 py-4 text-white/90" onClick={(e) => e.stopPropagation()}>
        <div className="min-w-0">
          <p className="text-[15px] font-medium tracking-tight truncate">{item.title}</p>
          <p className="text-[11px] tabular font-mono text-white/55 mt-1">
            {formatDate(item.created_at)} · {item.author_name} · {index + 1} / {total}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="ml-4 inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/10"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* image area */}
      <div className="flex-1 flex items-center justify-center px-4 pb-4 overflow-hidden">
        <div className="relative w-full h-full max-w-[1400px] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          {/* prev */}
          {index > 0 && (
            <button
              type="button"
              onClick={onPrev}
              aria-label="Previous"
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-11 h-11 rounded-full bg-black/40 text-white hover:bg-black/60 z-10"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image_data}
            alt={item.title}
            className="max-h-full max-w-full object-contain rounded-md select-none"
            draggable={false}
          />
          {index < total - 1 && (
            <button
              type="button"
              onClick={onNext}
              aria-label="Next"
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-11 h-11 rounded-full bg-black/40 text-white hover:bg-black/60 z-10"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M7 4l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {item.caption && (
        <div className="px-6 pb-6 text-center text-white/80 text-[13.5px] max-w-[60ch] mx-auto" onClick={(e) => e.stopPropagation()}>
          {item.caption}
        </div>
      )}
    </div>
  );
}
