"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

const MAX_PHOTO = 1024 * 1024; // 1 MB

export function HofForm() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [photoData, setPhotoData] = React.useState<string | null>(null);
  const [photoName, setPhotoName] = React.useState<string>("");

  async function onPickPhoto(file: File) {
    if (file.size > MAX_PHOTO) {
      setError("Photo must be ≤ 1 MB. Resize and try again.");
      return;
    }
    const data = await readAsDataURL(file);
    setPhotoData(data);
    setPhotoName(file.name);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const occurredAt = String(fd.get("occurred_at") ?? "");
    const ts = Math.floor(new Date(occurredAt).getTime() / 1000);
    if (!Number.isFinite(ts)) {
      setError("Invalid date");
      setPending(false);
      return;
    }
    try {
      const res = await fetch("/api/hof", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: fd.get("title"),
          body: fd.get("body"),
          occurred_at: ts,
          photo_data: photoData,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) {
        setError(j.error ?? "Failed to add moment");
        return;
      }
      router.push("/hof");
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
        <label className="field-label" htmlFor="occurred_at">Occurred on</label>
        <input id="occurred_at" name="occurred_at" type="date" required className="field-input" />
        <p className="field-hint">When the moment actually happened — used for the timeline ordering.</p>
      </div>
      <div>
        <label className="field-label" htmlFor="body">Description</label>
        <textarea id="body" name="body" required minLength={4} className="field-textarea" placeholder="What happened. Markdown supported." />
      </div>
      <div>
        <label className="field-label">Photo (optional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onPickPhoto(f);
          }}
          className="text-sm"
        />
        <p className="field-hint">Up to 1 MB. JPG/PNG/WebP. Stored inline.</p>
        {photoData && (
          <div className="mt-3 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoData} alt="" className="h-20 rounded-md border hairline" />
            <span className="text-xs tabular font-mono text-[color:var(--color-ink-3)]">{photoName}</span>
            <button type="button" className="btn btn-ghost" onClick={() => { setPhotoData(null); setPhotoName(""); }} style={{ height: 28 }}>
              Remove
            </button>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-[color:var(--color-danger)]">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary btn-lg">
          {pending ? "Saving…" : "Add to timeline"}
        </button>
        <a href="/hof" className="btn btn-ghost btn-lg">Cancel</a>
      </div>
    </form>
  );
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(new Error("read failed"));
    r.readAsDataURL(file);
  });
}
