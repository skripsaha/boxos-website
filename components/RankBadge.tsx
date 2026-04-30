import * as React from "react";
import { rankFor, RANK_LABELS, rankTone } from "@/lib/ranks";

type Args = {
  createdAt: number;
  isAdmin: boolean | 0 | 1;
  customRank: string | null;
  bannedAt: number | null;
  size?: "xs" | "sm";
};

/** Small pill displayed next to usernames. Server-renderable. */
export function RankBadge(p: Args) {
  const r = rankFor({
    createdAt: p.createdAt,
    isAdmin: !!p.isAdmin,
    customRank: p.customRank ?? null,
    bannedAt: p.bannedAt ?? null,
  });
  const tone = rankTone(r);
  return (
    <span
      className={`rank rank--${tone} ${p.size === "xs" ? "rank--xs" : ""}`}
      title={`rank: ${RANK_LABELS[r]}`}
    >
      {RANK_LABELS[r]}
    </span>
  );
}
