"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

const MAX = 2 * 1024 * 1024; // 2 MB

export function GalleryForm() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<string | null>(null);
  const [name, setName] = React.useState<string>("");

  async function onPick(file: File) {
    if (file.size > MAX) {
      setError("Image must be ≤ 2 MB. Resize and try again.");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result ?? ""));
      r.onerror = () => reject(new Error("read failed"));
      r.readAsDataURL(file);
    });
    setData(dataUrl);
    setName(file.name);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    if (!data) {
      setError("Pick an image first");
      setPending(false);
      return;
    }
    try {
      const res = await fetch("/api/gallery", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: fd.get("title"),
          caption: fd.get("caption"),
          image_data: data,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) {
        setError(j.error ?? "Failed to upload");
        return;
      }
      router.push("/gallery");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="field-label" htmlFor="title">Title</label>
        <input id="title" name="title" required maxLength={140} className="field-input" />
      </div>
      <div>
        <label className="field-label" htmlFor="caption">Caption <span className="text-[color:var(--color-ink-3)]">(optional)</span></label>
        <input id="caption" name="caption" maxLength={400} className="field-input" />
      </div>
      <div>
        <label className="field-label">Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onPick(f);
          }}
          className="text-sm"
        />
        <p className="field-hint">Up to 2 MB. JPG/PNG/WebP/GIF.</p>
        {data && (
          <div className="mt-3 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data} alt="" className="h-28 rounded-md border hairline object-cover" />
            <span className="text-xs tabular font-mono text-[color:var(--color-ink-3)]">{name}</span>
            <button type="button" className="btn btn-ghost" onClick={() => { setData(null); setName(""); }} style={{ height: 28 }}>
              Remove
            </button>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-[color:var(--color-danger)]">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary btn-lg">
          {pending ? "Uploading…" : "Add to gallery"}
        </button>
        <a href="/gallery" className="btn btn-ghost btn-lg">Cancel</a>
      </div>
    </form>
  );
}
