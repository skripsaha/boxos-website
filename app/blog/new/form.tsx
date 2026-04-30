"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export function NewPostForm() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: fd.get("title"),
          excerpt: fd.get("excerpt"),
          body: fd.get("body"),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Failed to publish");
        return;
      }
      router.push(`/blog/${data.slug}`);
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
        <label className="field-label" htmlFor="excerpt">Excerpt</label>
        <input id="excerpt" name="excerpt" required maxLength={260} className="field-input" />
        <p className="field-hint">Shown on the blog index. One or two sentences.</p>
      </div>
      <div>
        <label className="field-label" htmlFor="body">Body</label>
        <textarea id="body" name="body" required className="field-textarea" placeholder="# Heading&#10;&#10;Write the post in Markdown." />
      </div>
      {error && <p className="text-sm text-[color:var(--color-danger)]">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary btn-lg">
          {pending ? "Publishing…" : "Publish"}
        </button>
        <a href="/blog" className="btn btn-ghost btn-lg">Cancel</a>
      </div>
    </form>
  );
}
