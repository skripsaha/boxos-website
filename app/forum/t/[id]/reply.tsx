"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export function ReplyForm({ threadId }: { threadId: number }) {
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
      const res = await fetch("/api/forum/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ threadId, body: fd.get("body") }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Failed to reply");
        return;
      }
      ref.current?.reset();
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-4">
      <p className="text-[14px] font-medium text-[color:var(--color-ink-2)]">Your reply</p>
      <textarea
        name="body"
        required
        minLength={2}
        className="field-textarea"
        placeholder="Write a reply. Markdown is supported — fenced code blocks, lists, links."
      />
      {error && <p className="text-sm text-[color:var(--color-danger)]">{error}</p>}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[color:var(--color-ink-3)]">Markdown supported.</p>
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Posting…" : "Post reply"}
        </button>
      </div>
    </form>
  );
}
