"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export function CommentForm({ postId }: { postId: number }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const ref = React.useRef<HTMLFormElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/blog/${postId}/comment`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: fd.get("body") }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) {
        setError(j.error ?? "Failed to comment");
        return;
      }
      ref.current?.reset();
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-3">
      <textarea name="body" required minLength={2} className="field-textarea" placeholder="Write a comment. Markdown supported." style={{ minHeight: 120 }} />
      {error && <p className="text-sm text-[color:var(--color-danger)]">{error}</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Posting…" : "Post comment"}
        </button>
      </div>
    </form>
  );
}
