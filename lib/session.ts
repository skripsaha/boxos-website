import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE = "boxos_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 24) {
    throw new Error(
      "SESSION_SECRET is not set or too short. Run `openssl rand -base64 48` and put it in .env"
    );
  }
  return new TextEncoder().encode(s);
}

export async function signSession(userId: number): Promise<string> {
  return await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret());
}

export async function verifySession(token: string): Promise<{ uid: number } | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.uid !== "number") return null;
    return { uid: payload.uid };
  } catch {
    return null;
  }
}

export const SESSION = {
  cookieName: SESSION_COOKIE,
  ttlSeconds: SESSION_TTL_SECONDS,
};
