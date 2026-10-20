import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { audit, loadDB, nowIso, saveDB } from "@/lib/store";
import { SESSION_COOKIE, sessionToken } from "@/lib/session";
import { supabaseCredentials } from "@/lib/supabase-server";

function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/getting-started";
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  const creds = supabaseCredentials();
  if (!code || !creds) {
    return NextResponse.redirect(new URL("/signin?error=google-code", request.url));
  }

  const pending: Array<{ name: string; value: string; options?: Record<string, unknown> }> = [];
  const supabase = createServerClient(creds.url, creds.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach((item) => pending.push(item));
      }
    }
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  const email = data.user?.email?.toLowerCase();
  if (error || !email) {
    return withCookies(NextResponse.redirect(new URL("/signin?error=google-code", request.url)));
  }

  const db = await loadDB();
  if (db.profile && db.profile.email !== email) {
    await supabase.auth.signOut().catch(() => null);
    return withCookies(NextResponse.redirect(new URL("/signin?error=google-owner", request.url)));
  }

  const meta = (data.user?.user_metadata ?? {}) as Record<string, unknown>;
  const name = String(meta.full_name ?? meta.name ?? db.profile?.name ?? email.split("@")[0]).trim().slice(0, 80);
  const avatarUrl = typeof meta.avatar_url === "string" ? meta.avatar_url : undefined;

  if (!db.profile) {
    db.profile = {
      name,
      email,
      createdAt: nowIso(),
      authProvider: "google",
      supabaseUserId: data.user?.id,
      avatarUrl
    };
    await audit(db, "auth.google_signed_up", "profile", email, name);
    await saveDB(db);
  } else {
    let changed = false;
    if (!db.profile.supabaseUserId && data.user?.id) {
      db.profile.supabaseUserId = data.user.id;
      changed = true;
    }
    if (!db.profile.avatarUrl && avatarUrl) {
      db.profile.avatarUrl = avatarUrl;
      changed = true;
    }
    if (changed) {
      await audit(db, "auth.google_linked", "profile", email, name);
      await saveDB(db);
    }
  }

  const response = withCookies(NextResponse.redirect(new URL(next, request.url)));
  response.cookies.set(SESSION_COOKIE, sessionToken(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 86400
  });
  return response;

  function withCookies(res: NextResponse) {
    pending.forEach(({ name: cookieName, value, options }) => {
      res.cookies.set(cookieName, value, options as never);
    });
    return res;
  }
}
