import type { Rank } from "./types";

const VALID_RANKS: ReadonlyArray<Rank> = [
  "creator", "newbie", "regular", "settled", "veteran", "oldschool", "grandpa", "banned",
];

const DAY = 86400;

/** Resolve the displayed rank for a user. */
export function rankFor(args: {
  createdAt: number;
  isAdmin: boolean;
  customRank: string | null;
  bannedAt: number | null;
}): Rank {
  if (args.bannedAt && args.bannedAt > 0) return "banned";
  if (args.customRank && (VALID_RANKS as ReadonlyArray<string>).includes(args.customRank)) {
    return args.customRank as Rank;
  }
  if (args.isAdmin) return "creator";

  const days = (Math.floor(Date.now() / 1000) - args.createdAt) / DAY;
  if (days < 7) return "newbie";
  if (days < 30) return "regular";
  if (days < 90) return "settled";
  if (days < 365) return "veteran";
  if (days < 730) return "oldschool";
  return "grandpa";
}

export const RANK_LABELS: Record<Rank, string> = {
  creator: "creator",
  newbie: "newbie",
  regular: "regular",
  settled: "settled",
  veteran: "veteran",
  oldschool: "oldschool",
  grandpa: "grandpa",
  banned: "banned",
};

/** Tone classes per rank — applied as data attribute on RankBadge. */
export function rankTone(r: Rank): "creator" | "neutral" | "warm" | "deep" | "danger" {
  if (r === "creator") return "creator";
  if (r === "banned") return "danger";
  if (r === "newbie" || r === "regular") return "neutral";
  if (r === "settled" || r === "veteran") return "warm";
  return "deep";
}

export const RANKS_LIST: Rank[] = [
  "newbie", "regular", "settled", "veteran", "oldschool", "grandpa", "creator", "banned",
];
