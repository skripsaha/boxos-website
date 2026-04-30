import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { run } from "@/lib/db";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me?.is_admin) return NextResponse.json({ ok: false, error: "Admin only" }, { status: 403 });
  const { id } = await params;
  const mid = Number(id);
  if (!Number.isFinite(mid)) return NextResponse.json({ ok: false, error: "Bad id" }, { status: 400 });
  await run("DELETE FROM hof_moments WHERE id = ?", [mid]);
  return NextResponse.json({ ok: true });
}
