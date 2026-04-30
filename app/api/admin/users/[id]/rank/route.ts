import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { run } from "@/lib/db";
import { RANKS_LIST } from "@/lib/ranks";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me?.is_admin) return NextResponse.json({ ok: false, error: "Admin only" }, { status: 403 });
  const { id } = await params;
  const uid = Number(id);
  if (!Number.isFinite(uid)) return NextResponse.json({ ok: false, error: "Bad id" }, { status: 400 });
  const body = await req.json().catch(() => null);
  const rank = body?.rank;
  if (rank !== null && (typeof rank !== "string" || !RANKS_LIST.includes(rank as never))) {
    return NextResponse.json({ ok: false, error: "Unknown rank" }, { status: 400 });
  }
  await run("UPDATE users SET custom_rank = ? WHERE id = ?", [rank ?? null, uid]);
  return NextResponse.json({ ok: true });
}
