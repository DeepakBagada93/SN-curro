import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function supabaseCredentials(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}

export function createSupabaseServerClient() {
  const creds = supabaseCredentials();
  if (!creds) return null;
  const cookieStore = cookies();
  return createServerClient(creds.url, creds.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot set cookies; the callback route can.
        }
      }
    }
  });
}

export function siteOrigin(fallbackHost?: string | null): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  const host = fallbackHost ?? "localhost:3001";
  const proto = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${proto}://${host}`;
}
