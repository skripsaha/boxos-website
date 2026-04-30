import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, one, ready, now } from "@/lib/db";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Sign in to reply" }, { status: 401 });

  let payload: unknown;
  try { payload = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 }); }
  const { threadId, body } = (payload ?? {}) as Record<string, unknown>;
  if (typeof threadId !== "number" || typeof body !== "string") {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }
  const b = body.trim();
  if (b.length < 2 || b.length > 20000) {
    return NextResponse.json({ ok: false, error: "Body length out of range" }, { status: 400 });
  }
  const thread = await one<{ id: number }>("SELECT id FROM forum_threads WHERE id = ?", [threadId]);
  if (!thread) return NextResponse.json({ ok: false, error: "Thread not found" }, { status: 404 });

  const ts = now();
  await ready();
  await db().batch(
    [
      {
        sql: "INSERT INTO forum_posts (thread_id, author_id, body, created_at) VALUES (?, ?, ?, ?)",
        args: [threadId, user.id, b, ts],
      },
      {
        sql: "UPDATE forum_threads SET last_post_at = ? WHERE id = ?",
        args: [ts, threadId],
      },
    ],
    "write"
  );

  return NextResponse.json({ ok: true });
}
