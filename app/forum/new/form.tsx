"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type Cat = { id: number; slug: string; name: string };

export function NewThreadForm({ categories, initialCat }: { categories: Cat[]; initialCat?: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/forum/threads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          categorySlug: fd.get("category"),
          title: fd.get("title"),
          body: fd.get("body"),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Failed to create thread");
        return;
      }
      router.push(`/forum/t/${data.threadId}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="field-label" htmlFor="category">Category</label>
        <select
          id="category"
          name="category"
          required
          defaultValue={initialCat ?? categories[0]?.slug}
          className="field-input"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label" htmlFor="title">Title</label>
        <input id="title" name="title" required maxLength={140} className="field-input" placeholder="A specific, scannable title." />
      </div>
      <div>
        <label className="field-label" htmlFor="body">First post</label>
        <textarea id="body" name="body" required minLength={20} className="field-textarea" placeholder="Describe the question, design, or report. Use fenced code blocks for code." />
      </div>
      {error && <p className="text-sm text-[color:var(--color-danger)]">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary btn-lg">
          {pending ? "Creating…" : "Create thread"}
        </button>
        <a href="/forum" className="btn btn-ghost btn-lg">Cancel</a>
      </div>
    </form>
  );
}
