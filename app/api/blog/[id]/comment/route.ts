import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { run, now, one } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ ok: false, error: "Sign in" }, { status: 401 });
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isFinite(pid)) return NextResponse.json({ ok: false, error: "Bad id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const text = String(body?.body ?? "").trim();
  if (text.length < 2 || text.length > 8000) return NextResponse.json({ ok: false, error: "Comment length out of range" }, { status: 400 });

  const post = await one("SELECT id FROM blog_posts WHERE id = ?", [pid]);
  if (!post) return NextResponse.json({ ok: false, error: "Post not found" }, { status: 404 });

  await run(
    "INSERT INTO blog_comments (post_id, author_id, body, created_at) VALUES (?, ?, ?, ?)",
    [pid, me.id, text, now()]
  );
  return NextResponse.json({ ok: true });
}
