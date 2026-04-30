"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

const KINDS = ["agree", "interesting", "filed", "running"] as const;
type Kind = typeof KINDS[number];

type Props = {
  postId: number;
  initialCounts: Record<Kind, number>;
  initialActive: Kind[];
  signedIn: boolean;
};

export function Reactions({ postId, initialCounts, initialActive, signedIn }: Props) {
  const router = useRouter();
  const [counts, setCounts] = React.useState<Record<Kind, number>>(initialCounts);
  const [active, setActive] = React.useState<Set<Kind>>(new Set(initialActive));
  const [pending, setPending] = React.useState<Kind | null>(null);

  async function toggle(k: Kind) {
    if (!signedIn) {
      window.location.href = "/login";
      return;
    }
    setPending(k);
    const wasActive = active.has(k);
    /* optimistic */
    setActive((prev) => {
      const next = new Set(prev);
      wasActive ? next.delete(k) : next.add(k);
      return next;
    });
    setCounts((prev) => ({ ...prev, [k]: prev[k] + (wasActive ? -1 : 1) }));
    try {
      const res = await fetch(`/api/blog/${postId}/react`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: k }),
      });
      if (!res.ok) {
        /* revert */
        setActive((prev) => {
          const next = new Set(prev);
          wasActive ? next.add(k) : next.delete(k);
          return next;
        });
        setCounts((prev) => ({ ...prev, [k]: prev[k] + (wasActive ? 1 : -1) }));
      } else {
        router.refresh();
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {KINDS.map((k) => (
        <button
          key={k}
          type="button"
          className="reaction"
          data-active={active.has(k)}
          disabled={pending === k}
          onClick={() => toggle(k)}
        >
          <span>{k}</span>
          {counts[k] > 0 && <span className="reaction-count">{counts[k]}</span>}
        </button>
      ))}
    </div>
  );
}
