import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { one, run, now } from "./db";
import { SESSION, signSession, verifySession } from "./session";
import type { User, SessionUser } from "./types";

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,24}$/;

export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION.cookieName)?.value;
  if (!token) return null;
  const payload = await verifySession(token);
  if (!payload) return null;
  const row = await one<{
    id: number; username: string; email: string | null;
    is_admin: number; bio: string | null; created_at: number;
    avatar_data: string | null; custom_rank: string | null; banned_at: number | null;
  }>(
    "SELECT id, username, email, is_admin, bio, created_at, avatar_data, custom_rank, banned_at FROM users WHERE id = ?",
    [payload.uid]
  );
  if (!row) return null;
  if (row.banned_at && Number(row.banned_at) > 0) return null;  // banned users appear logged out
  return {
    id: Number(row.id),
    username: String(row.username),
    email: row.email == null ? null : String(row.email),
    is_admin: (Number(row.is_admin) ? 1 : 0) as 0 | 1,
    bio: row.bio == null ? null : String(row.bio),
    created_at: Number(row.created_at),
    avatar_data: row.avatar_data == null ? null : String(row.avatar_data),
    custom_rank: row.custom_rank == null ? null : String(row.custom_rank),
    banned_at: row.banned_at == null ? null : Number(row.banned_at),
  };
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getCurrentUser();
  if (!u) throw new Error("Authentication required");
  return u;
}

export async function setSessionCookie(userId: number) {
  const jar = await cookies();
  const token = await signSession(userId);
  jar.set(SESSION.cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION.ttlSeconds,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION.cookieName, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export type RegisterInput = { username: string; email?: string; password: string };

export async function registerUser(input: RegisterInput): Promise<{ ok: true; userId: number } | { ok: false; error: string }> {
  const username = input.username.trim();
  if (!USERNAME_RE.test(username)) return { ok: false, error: "Username must be 3–24 chars, letters/numbers/_-" };
  if (input.password.length < 8) return { ok: false, error: "Password must be at least 8 characters" };
  if (input.password.length > 128) return { ok: false, error: "Password too long (max 128)" };

  const email = input.email?.trim() || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Invalid email" };

  const existing = await one<{ id: number }>(
    "SELECT id FROM users WHERE username = ? OR (email IS NOT NULL AND ? IS NOT NULL AND email = ?)",
    [username, email, email]
  );
  if (existing) return { ok: false, error: "Username or email already taken" };

  const hash = await bcrypt.hash(input.password, 12);
  const adminUser = process.env.ADMIN_USERNAME;
  const isAdmin = adminUser && username === adminUser ? 1 : 0;

  const result = await run(
    "INSERT INTO users (username, email, password_hash, is_admin, created_at) VALUES (?, ?, ?, ?, ?)",
    [username, email, hash, isAdmin, now()]
  );

  return { ok: true, userId: Number(result.lastInsertRowid) };
}

export async function authenticate(username: string, password: string): Promise<{ ok: true; userId: number } | { ok: false; error: string }> {
  const u = username.trim();
  if (!u || !password) return { ok: false, error: "Missing credentials" };
  const row = await one<{ id: number; password_hash: string; banned_at: number | null }>(
    "SELECT id, password_hash, banned_at FROM users WHERE username = ? OR email = ?",
    [u, u]
  );
  if (!row) return { ok: false, error: "Invalid username or password" };
  const ok = await bcrypt.compare(password, String(row.password_hash));
  if (!ok) return { ok: false, error: "Invalid username or password" };
  if (row.banned_at && Number(row.banned_at) > 0) return { ok: false, error: "This account is banned." };
  return { ok: true, userId: Number(row.id) };
}
