"use server";

import { headers } from "next/headers";
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
  const redirectTo = `${siteOrigin(host)}/auth/callback?next=${encodeURIComponent(next)}`;
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
