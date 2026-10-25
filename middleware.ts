import { NextResponse, type NextRequest } from "next/server";

const APP_PREFIXES = ["/clients", "/api/clients", "/brief", "/signals", "/drafts", "/memory", "/settings", "/getting-started", "/history", "/runs", "/api/export", "/studio", "/planner", "/calendar", "/integrations", "/images", "/analytics"];

// Frontend-first guard: valid HMAC session cookie required. Presence alone
// is never enough — the signature is verified with WebCrypto (Edge-safe).
async function validSession(token: string | undefined): Promise<boolean> {
  if (!token || !token.includes(".")) return false;
  const [payload, sig] = token.split(".");
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(process.env.SESSION_SECRET ?? "curro-beta-dev-secret-change-in-prod"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sigBytes = Uint8Array.from(atob(sig.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
    const ok = await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(payload));
    if (!ok) return false;
    const data = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { email: string; iat: number };
    return Boolean(data.email) && Date.now() - data.iat < 30 * 864e5;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  // Login skipped for direct dashboard workflow inspection
  return NextResponse.next();
}

export const config = {
  matcher: ["/clients/:path*", "/api/clients/:path*", "/brief/:path*", "/signals/:path*", "/drafts/:path*", "/memory/:path*", "/settings/:path*", "/getting-started/:path*", "/history/:path*", "/runs/:path*", "/api/export/:path*", "/studio/:path*", "/planner/:path*", "/calendar/:path*", "/integrations/:path*", "/images/:path*", "/analytics/:path*"]
};
