import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { run, now, one } from "@/lib/db";

const KINDS = new Set(["agree", "interesting", "filed", "running"]);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ ok: false, error: "Sign in" }, { status: 401 });
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isFinite(pid)) return NextResponse.json({ ok: false, error: "Bad id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const kind = String(body?.kind ?? "");
  if (!KINDS.has(kind)) return NextResponse.json({ ok: false, error: "Unknown reaction" }, { status: 400 });

  const post = await one("SELECT id FROM blog_posts WHERE id = ?", [pid]);
  if (!post) return NextResponse.json({ ok: false, error: "Post not found" }, { status: 404 });

  /* toggle: if exists → delete, else insert */
  const existing = await one("SELECT 1 AS x FROM blog_reactions WHERE post_id = ? AND user_id = ? AND kind = ?", [pid, me.id, kind]);
  if (existing) {
    await run("DELETE FROM blog_reactions WHERE post_id = ? AND user_id = ? AND kind = ?", [pid, me.id, kind]);
    return NextResponse.json({ ok: true, active: false });
  }
  await run(
    "INSERT INTO blog_reactions (post_id, user_id, kind, created_at) VALUES (?, ?, ?, ?)",
    [pid, me.id, kind, now()]
  );
  return NextResponse.json({ ok: true, active: true });
}
