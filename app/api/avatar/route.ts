import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { run } from "@/lib/db";

const MAX_BYTES = 64 * 1024; // pixel-art PNGs are tiny; 64 KB is generous

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Sign in" }, { status: 401 });

  let payload: unknown;
  try { payload = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 }); }
  const { data } = (payload ?? {}) as Record<string, unknown>;

  if (data === null) {
    await run("UPDATE users SET avatar_data = NULL WHERE id = ?", [user.id]);
    return NextResponse.json({ ok: true });
  }
  if (typeof data !== "string") return NextResponse.json({ ok: false, error: "data must be a string or null" }, { status: 400 });
  if (!data.startsWith("data:image/png;base64,")) return NextResponse.json({ ok: false, error: "must be a base64 PNG data URL" }, { status: 400 });
  if (data.length > MAX_BYTES) return NextResponse.json({ ok: false, error: "avatar too large" }, { status: 400 });

  await run("UPDATE users SET avatar_data = ? WHERE id = ?", [data, user.id]);
  return NextResponse.json({ ok: true });
}
