"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, siteOrigin, supabaseCredentials } from "./supabase-server";

function safeNext(raw: FormDataEntryValue | null): string {
  const next = String(raw ?? "");
  return next.startsWith("/") && !next.startsWith("//") ? next : "/getting-started";
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const next = safeNext(formData.get("next"));
  if (!supabaseCredentials()) {
    redirect(`/signin?error=google-config&next=${encodeURIComponent(next)}`);
  }
  const supabase = createSupabaseServerClient();
  if (!supabase) redirect("/signin?error=google-config");

  const host = headers().get("x-forwarded-host") ?? headers().get("host");
  cookies().set("curro_auth_next", next, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60
  });
  const redirectTo = `${siteOrigin(host)}/auth/callback`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: { access_type: "offline", prompt: "consent" }
    }
  });
  if (error || !data.url) {
    redirect(`/signin?error=google-start&next=${encodeURIComponent(next)}`);
  }
  redirect(data.url);
}
