"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

const SIZE = 24;          // logical pixels per side
const SCALE = 8;          // scale factor on save → 192×192 PNG
const CELL = 14;          // editor cell size in CSS pixels
const TRANSPARENT = "transparent";

const PALETTE = [
  TRANSPARENT,
  "#FBFAF6", "#0E0D0B",
  "#B8814B", "#6B4220", "#9D6B3A", "#D9A26B",
  "#C0592C", "#EADBC2", "#FAF6EC",
  "#3A2410", "#57544D", "#8C887C",
  "#426A4F", "#A53626",
];

type Props = {
  initial?: string | null;
  username: string;
};

export function PixelEditor({ initial, username }: Props) {
  const router = useRouter();
  const [color, setColor] = React.useState<string>(PALETTE[2]);
  const [grid, setGrid] = React.useState<string[][]>(() => emptyGrid(initial));
  const [drawing, setDrawing] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const setCell = React.useCallback((r: number, c: number, val: string) => {
    setGrid((prev) => {
      if (prev[r][c] === val) return prev;
      const next = prev.map((row, ri) => (ri === r ? [...row] : row));
      next[r][c] = val;
      return next;
    });
  }, []);

  React.useEffect(() => {
    const stop = () => setDrawing(false);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchend", stop);
    return () => {
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchend", stop);
    };
  }, []);

  function clear() {
    setGrid(Array.from({ length: SIZE }, () => Array(SIZE).fill(TRANSPARENT)));
  }

  function fill() {
    setGrid(Array.from({ length: SIZE }, () => Array(SIZE).fill(color === TRANSPARENT ? "#FBFAF6" : color)));
  }

  async function save() {
    setPending(true);
    setError(null);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = SIZE * SCALE;
      canvas.height = SIZE * SCALE;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no canvas context");
      ctx.imageSmoothingEnabled = false;
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          const v = grid[r][c];
          if (v === TRANSPARENT) continue;
          ctx.fillStyle = v;
          ctx.fillRect(c * SCALE, r * SCALE, SCALE, SCALE);
        }
      }
      const data = canvas.toDataURL("image/png");
      const res = await fetch("/api/avatar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Failed to save");
        return;
      }
      router.push(`/u/${username}`);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/avatar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: null }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Failed to clear");
        return;
      }
      clear();
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[auto_1fr] gap-10">
      <div className="flex flex-col items-start">
        <div
          className="pixel-grid"
          style={{
            gridTemplateColumns: `repeat(${SIZE}, ${CELL}px)`,
            gridTemplateRows: `repeat(${SIZE}, ${CELL}px)`,
            backgroundImage:
              "linear-gradient(45deg, #f0eee6 25%, transparent 25%), linear-gradient(-45deg, #f0eee6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0eee6 75%), linear-gradient(-45deg, transparent 75%, #f0eee6 75%)",
            backgroundSize: "12px 12px",
            backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0",
          }}
          onMouseLeave={() => setDrawing(false)}
        >
          {grid.flatMap((row, r) =>
            row.map((v, c) => (
              <div
                key={`${r}-${c}`}
                className="pixel-cell"
                style={{ background: v === TRANSPARENT ? "transparent" : v }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setDrawing(true);
                  setCell(r, c, color);
                }}
                onMouseEnter={() => {
                  if (drawing) setCell(r, c, color);
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  setDrawing(true);
                  setCell(r, c, color);
                }}
              />
            ))
          )}
        </div>
        <p className="mt-3 text-xs tabular font-mono text-[color:var(--color-ink-3)]">
          {SIZE} × {SIZE} pixels · click + drag to paint
        </p>
      </div>

      <div className="flex flex-col">
        <p className="text-[14px] font-medium text-[color:var(--color-ink-2)]">Palette</p>
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          {PALETTE.map((p) => (
            <button
              key={p}
              type="button"
              className="pixel-swatch"
              data-active={color === p}
              onClick={() => setColor(p)}
              aria-label={p === TRANSPARENT ? "eraser" : `color ${p}`}
              style={{
                background:
                  p === TRANSPARENT
                    ? "repeating-conic-gradient(#e6e2d6 0 25%, #fff 0 50%) 50% / 12px 12px"
                    : p,
              }}
            />
          ))}
          <label
            className="pixel-swatch relative flex items-center justify-center"
            data-active={!PALETTE.includes(color) && color !== TRANSPARENT}
            title="custom color"
            style={{
              background:
                !PALETTE.includes(color) && color !== TRANSPARENT
                  ? color
                  : "conic-gradient(from 0deg, #C0592C, #B8814B, #6B4220, #426A4F, #4A6FB1, #B65BA8, #C0592C)",
              cursor: "pointer",
            }}
          >
            <span className="text-[14px] font-bold text-white drop-shadow" aria-hidden>+</span>
            <input
              type="color"
              value={!PALETTE.includes(color) && color !== TRANSPARENT ? color : "#B8814B"}
              onChange={(e) => setColor(e.target.value)}
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0,
                cursor: "pointer",
              }}
              aria-label="pick a custom color"
            />
          </label>
        </div>
        <p className="mt-2 text-[11px] tabular font-mono text-[color:var(--color-ink-3)]">
          Click <span className="font-bold text-[color:var(--color-ink-2)]">+</span> for any colour you like.
        </p>

        <p className="mt-8 text-[14px] font-medium text-[color:var(--color-ink-2)]">Tools</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" onClick={clear} className="btn btn-ghost">Clear</button>
          <button type="button" onClick={fill}  className="btn btn-ghost">Fill with color</button>
          <button type="button" onClick={remove} disabled={pending} className="btn btn-ghost">Remove avatar</button>
        </div>

        {error && <p className="mt-6 text-sm text-[color:var(--color-danger)]">{error}</p>}

        <div className="mt-10 flex gap-3">
          <button type="button" onClick={save} disabled={pending} className="btn btn-primary btn-lg">
            {pending ? "Saving…" : "Save avatar"}
          </button>
          <a href={`/u/${username}`} className="btn btn-ghost btn-lg">Cancel</a>
        </div>

        <p className="mt-6 text-xs tabular font-mono text-[color:var(--color-ink-3)] max-w-[44ch]">
          The result is stored as a 192 × 192 PNG. Pixel art is rendered crisp everywhere on the site.
        </p>
      </div>
    </div>
  );
}

function emptyGrid(initial: string | null | undefined): string[][] {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(TRANSPARENT));
  // We intentionally don't decode the previous PNG — saves complexity.
  // Initial avatar is shown elsewhere; the editor starts blank.
}
