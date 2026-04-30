import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { run, now } from "@/lib/db";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me?.is_admin) return NextResponse.json({ ok: false, error: "Admin only" }, { status: 403 });
  const { id } = await params;
  const uid = Number(id);
  if (!Number.isFinite(uid)) return NextResponse.json({ ok: false, error: "Bad id" }, { status: 400 });
  if (uid === me.id) return NextResponse.json({ ok: false, error: "Cannot ban yourself" }, { status: 400 });
  await run("UPDATE users SET banned_at = ? WHERE id = ?", [now(), uid]);
  return NextResponse.json({ ok: true });
}
