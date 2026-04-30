import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, ready } from "@/lib/db";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me?.is_admin) return NextResponse.json({ ok: false, error: "Admin only" }, { status: 403 });
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isFinite(pid)) return NextResponse.json({ ok: false, error: "Bad id" }, { status: 400 });
  await ready();
  await db().batch([
    { sql: "DELETE FROM blog_reactions WHERE post_id = ?", args: [pid] },
    { sql: "DELETE FROM blog_comments  WHERE post_id = ?", args: [pid] },
    { sql: "DELETE FROM blog_posts     WHERE id = ?",      args: [pid] },
  ], "write");
  return NextResponse.json({ ok: true });
}
