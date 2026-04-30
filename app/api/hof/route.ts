import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { run, now } from "@/lib/db";

const MAX_PHOTO_BYTES = 1.4 * 1024 * 1024; // ~1 MB raw + base64 overhead

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me?.is_admin) return NextResponse.json({ ok: false, error: "Admin only" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 });

  const title = String(body.title ?? "").trim();
  const text = String(body.body ?? "").trim();
  const occurred = Number(body.occurred_at);
  const photo = body.photo_data == null ? null : String(body.photo_data);

  if (title.length < 3 || title.length > 140) return NextResponse.json({ ok: false, error: "Title length must be 3–140" }, { status: 400 });
  if (text.length < 4) return NextResponse.json({ ok: false, error: "Body too short" }, { status: 400 });
  if (!Number.isFinite(occurred)) return NextResponse.json({ ok: false, error: "Invalid occurred_at" }, { status: 400 });
  if (photo && !photo.startsWith("data:image/")) return NextResponse.json({ ok: false, error: "Photo must be a data URL" }, { status: 400 });
  if (photo && photo.length > MAX_PHOTO_BYTES) return NextResponse.json({ ok: false, error: "Photo too large" }, { status: 400 });

  await run(
    "INSERT INTO hof_moments (title, body, photo_data, occurred_at, created_at, author_id) VALUES (?, ?, ?, ?, ?, ?)",
    [title, text, photo, occurred, now(), me.id]
  );
  return NextResponse.json({ ok: true });
}
