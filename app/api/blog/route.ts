import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, now } from "@/lib/db";
import { makeSlug } from "@/lib/markdown";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
  if (!user.is_admin) return NextResponse.json({ ok: false, error: "Admin only" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 }); }
  const { title, excerpt, body: postBody } = (body ?? {}) as Record<string, unknown>;
  if (typeof title !== "string" || typeof excerpt !== "string" || typeof postBody !== "string") {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }
  const t = title.trim();
  if (t.length < 3 || t.length > 140) return NextResponse.json({ ok: false, error: "Title length must be 3–140" }, { status: 400 });
  if (excerpt.trim().length < 10) return NextResponse.json({ ok: false, error: "Excerpt too short" }, { status: 400 });
  if (postBody.trim().length < 30) return NextResponse.json({ ok: false, error: "Body too short" }, { status: 400 });

  let slug = makeSlug(t);
  if (!slug) slug = `post-${Date.now()}`;
  let suffix = 0;
  const exists = db().prepare("SELECT 1 FROM blog_posts WHERE slug = ?");
  while (exists.get(slug)) {
    suffix += 1;
    slug = `${makeSlug(t)}-${suffix}`;
  }

  db().prepare(
    "INSERT INTO blog_posts (slug, title, excerpt, body, author_id, published_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(slug, t, excerpt.trim(), postBody, user.id, now());

  return NextResponse.json({ ok: true, slug });
}
