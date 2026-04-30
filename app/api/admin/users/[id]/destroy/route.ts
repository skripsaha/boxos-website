import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, run, ready, now } from "@/lib/db";

/**
 * Hard-delete a user. We do NOT cascade their content because the
 * forum_posts.author_id NOT NULL constraint would fail. Instead we reassign
 * their content to a synthetic "deleted" placeholder user.
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me?.is_admin) return NextResponse.json({ ok: false, error: "Admin only" }, { status: 403 });
  const { id } = await params;
  const uid = Number(id);
  if (!Number.isFinite(uid)) return NextResponse.json({ ok: false, error: "Bad id" }, { status: 400 });
  if (uid === me.id) return NextResponse.json({ ok: false, error: "Cannot delete yourself" }, { status: 400 });

  await ready();
  /* ensure a placeholder author exists */
  const placeholder = (await db().execute({
    sql: "SELECT id FROM users WHERE username = '_deleted'",
    args: [],
  })).rows[0] as unknown as { id: number } | undefined;

  let placeholderId: number;
  if (placeholder) {
    placeholderId = Number(placeholder.id);
  } else {
    const ins = await db().execute({
      sql: "INSERT INTO users (username, email, password_hash, is_admin, created_at, bio) VALUES (?, NULL, ?, 0, ?, ?)",
      args: ["_deleted", "!", now() - 1, "Anonymised author of removed accounts."],
    });
    placeholderId = Number(ins.lastInsertRowid);
  }

  await db().batch([
    { sql: "UPDATE forum_posts   SET author_id = ? WHERE author_id = ?", args: [placeholderId, uid] },
    { sql: "UPDATE forum_threads SET author_id = ? WHERE author_id = ?", args: [placeholderId, uid] },
    { sql: "UPDATE blog_posts    SET author_id = ? WHERE author_id = ?", args: [placeholderId, uid] },
    { sql: "UPDATE blog_comments SET author_id = ? WHERE author_id = ?", args: [placeholderId, uid] },
    { sql: "UPDATE hof_moments   SET author_id = ? WHERE author_id = ?", args: [placeholderId, uid] },
    { sql: "DELETE FROM blog_reactions WHERE user_id = ?", args: [uid] },
    { sql: "DELETE FROM users WHERE id = ?", args: [uid] },
  ], "write");

  return NextResponse.json({ ok: true });
}
