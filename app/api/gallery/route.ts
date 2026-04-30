import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { run, now } from "@/lib/db";

const MAX_BYTES = 2.7 * 1024 * 1024; // 2 MB raw + base64 overhead

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me?.is_admin) return NextResponse.json({ ok: false, error: "Admin only" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 });

  const title = String(body.title ?? "").trim();
  const caption = body.caption ? String(body.caption).trim() : null;
  const image = String(body.image_data ?? "");

  if (title.length < 2 || title.length > 140) return NextResponse.json({ ok: false, error: "Title length must be 2–140" }, { status: 400 });
  if (!image.startsWith("data:image/")) return NextResponse.json({ ok: false, error: "Image must be a data URL" }, { status: 400 });
  if (image.length > MAX_BYTES) return NextResponse.json({ ok: false, error: "Image too large" }, { status: 400 });

  await run(
    "INSERT INTO gallery_items (title, caption, image_data, created_at, author_id) VALUES (?, ?, ?, ?, ?)",
    [title, caption, image, now(), me.id]
  );
  return NextResponse.json({ ok: true });
}
