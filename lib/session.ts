import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

// Pure session/crypto helpers (no "use server" — importable anywhere).
export const SESSION_COOKIE = "curro_session";
export const SESSION_SECRET = process.env.SESSION_SECRET ?? "curro-beta-dev-secret-change-in-prod";

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}
function sign(payload: string): string {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
}
export function sessionToken(email: string): string {
  const payload = b64url(JSON.stringify({ email, iat: Date.now() }));
  return `${payload}.${sign(payload)}`;
}
export function verifySessionToken(token: string): string | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const got = Buffer.from(sig);
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { email: string; iat: number };
    if (!data.email || Date.now() - data.iat > 30 * 864e5) return null;
    return data.email;
  } catch { return null; }
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}
export function checkPassword(password: string, stored: string): boolean {
  const [, salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const got = scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(got, "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
