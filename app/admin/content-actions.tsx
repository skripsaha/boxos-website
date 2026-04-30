"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type Kind = "blog" | "thread" | "hof" | "forum-post";

export function ContentActions({ kind, id }: { kind: Kind; id: number }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function destroy() {
    const labels: Record<Kind, string> = {
      blog: "blog post",
      thread: "thread (and all its replies)",
      "forum-post": "forum reply",
      hof: "hall-of-fame moment",
    };
    if (!confirm(`Delete this ${labels[kind]}? This cannot be undone.`)) return;
    setPending(true);
    try {
      const path = kind === "hof" ? `/api/hof/${id}` : `/api/admin/${kind === "thread" ? "threads" : kind === "forum-post" ? "forum-posts" : "blog"}/${id}`;
      const res = await fetch(path, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j.error ?? `Failed (${res.status})`);
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      disabled={pending}
      onClick={destroy}
      className="btn btn-ghost"
      style={{ height: 28, padding: "0 9px", fontSize: 11, borderColor: "var(--color-danger)", color: "var(--color-danger)" }}
    >
      {pending ? "..." : "Delete"}
    </button>
  );
}
