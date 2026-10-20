import { createHmac, timingSafeEqual } from "crypto";
import { SESSION_SECRET } from "./session";

export const REVIEW_TTL_MS = 7 * 864e5;

function sign(payload: string): string {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
}

export function createReviewToken(assetId: string, ttlMs = REVIEW_TTL_MS): string {
  const payload = Buffer.from(JSON.stringify({ assetId, exp: Date.now() + ttlMs })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyReviewToken(token: string): { assetId: string; exp: number } | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const got = Buffer.from(sig);
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { assetId?: string; exp?: number };
    if (!data.assetId || !data.exp || data.exp < Date.now()) return null;
    return { assetId: data.assetId, exp: data.exp };
  } catch {
    return null;
  }
}
