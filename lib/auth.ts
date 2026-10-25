"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { loadDB, saveDB, audit, nowIso } from "./store";
import { SESSION_COOKIE, hashPassword, checkPassword, sessionToken, verifySessionToken } from "./session";
import { createSupabaseServerClient } from "./supabase-server";

// Local-beta auth actions (TODO #39 frontend-first). Email + scrypt-hashed
// password in the workspace file; HMAC session cookie. On the Supabase
// cutover this module is replaced — passwords will require a reset.

const AuthSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(128)
});

export async function signUp(formData: FormData): Promise<{ error?: string }> {
  const parsed = AuthSchema.safeParse({
    name: formData.get("name"), email: formData.get("email"), password: formData.get("password")
  });
  if (!parsed.success) return { error: "Name (2+ chars), valid email, and 8+ char password required." };
  const db = await loadDB();
  const email = parsed.data.email.toLowerCase();
  if (db.profile) return { error: "This workspace already has an owner. Sign in instead." };
  db.profile = {
    name: (parsed.data.name ?? email.split("@")[0]).slice(0, 80),
    email, passwordHash: hashPassword(parsed.data.password), authProvider: "password", createdAt: nowIso()
  };
  await audit(db, "auth.signed_up", "profile", email);
  await saveDB(db);
  cookies().set(SESSION_COOKIE, sessionToken(email), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 30 * 86400 });
  redirect("/getting-started");
}

export async function signIn(formData: FormData): Promise<{ error?: string }> {
  const parsed = AuthSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "Enter your email and password." };
  const db = await loadDB();
  const email = parsed.data.email.toLowerCase();
  if (!db.profile || db.profile.email !== email || !db.profile.passwordHash || !checkPassword(parsed.data.password, db.profile.passwordHash)) {
    return { error: "No account matches those credentials on this workspace." };
  }
  await audit(db, "auth.signed_in", "profile", email);
  await saveDB(db);
  cookies().set(SESSION_COOKIE, sessionToken(email), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 30 * 86400 });
  redirect("/brief");
}

export async function signOut(): Promise<void> {
  const supabase = createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut().catch(() => null);
  cookies().delete(SESSION_COOKIE);
  redirect("/signin");
}

export async function sessionProfile(): Promise<{ name: string; email: string } | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    const email = verifySessionToken(token);
    if (email) {
      const db = await loadDB();
      if (db.profile && db.profile.email === email) {
        return { name: db.profile.name, email: db.profile.email };
      }
    }
  }
  const db = await loadDB();
  if (db.profile) {
    return { name: db.profile.name, email: db.profile.email };
  }
  return { name: "Agency Director", email: "director@curro.internal" };
}

export async function updateProfile(formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const me = await sessionProfile();
  if (!me) redirect("/signin");
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  if (name.length < 2) return { error: "Name needs at least 2 characters." };
  const db = await loadDB();
  if (!db.profile) return { error: "No profile found." };
  db.profile.name = name;
  await audit(db, "auth.profile_updated", "profile", me.email);
  await saveDB(db);
  return { ok: true };
}
