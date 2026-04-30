import { NextResponse } from "next/server";
import { registerUser, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }
  const { username, email, password } = body as Record<string, unknown>;
  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }
  const result = await registerUser({
    username,
    email: typeof email === "string" && email.length > 0 ? email : undefined,
    password,
  });
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  await setSessionCookie(result.userId);
  return NextResponse.json({ ok: true });
}
