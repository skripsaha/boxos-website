import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, one, ready, now } from "@/lib/db";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Sign in to post" }, { status: 401 });

  let payload: unknown;
  try { payload = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 }); }
  const { categorySlug, title, body } = (payload ?? {}) as Record<string, unknown>;
  if (typeof categorySlug !== "string" || typeof title !== "string" || typeof body !== "string") {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }
  const t = title.trim();
  const b = body.trim();
  if (t.length < 4 || t.length > 140) return NextResponse.json({ ok: false, error: "Title length must be 4–140" }, { status: 400 });
  if (b.length < 20) return NextResponse.json({ ok: false, error: "Post body too short" }, { status: 400 });

  const cat = await one<{ id: number }>("SELECT id FROM forum_categories WHERE slug = ?", [categorySlug]);
  if (!cat) return NextResponse.json({ ok: false, error: "Unknown category" }, { status: 400 });

  const ts = now();
  await ready();
  const tx = await db().transaction("write");
  let threadId = 0;
  try {
    const tres = await tx.execute({
      sql: "INSERT INTO forum_threads (category_id, title, author_id, created_at, last_post_at) VALUES (?, ?, ?, ?, ?)",
      args: [cat.id, t, user.id, ts, ts],
    });
    threadId = Number(tres.lastInsertRowid);
    await tx.execute({
      sql: "INSERT INTO forum_posts (thread_id, author_id, body, created_at) VALUES (?, ?, ?, ?)",
      args: [threadId, user.id, b, ts],
    });
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    return NextResponse.json({ ok: false, error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, threadId });
}
