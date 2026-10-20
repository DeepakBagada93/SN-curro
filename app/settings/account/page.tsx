import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadDB } from "@/lib/store";
import { sessionProfile, updateProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "Account settings" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const me = await sessionProfile();
  if (!me) redirect("/signin");
  const db = await loadDB();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="eyebrow">Settings</p>
        <h1 className="h-display mt-1 text-3xl md:text-4xl">Account.</h1>
        <p className="prose-muted mt-1 text-sm">Your workspace identity. Passwords move to managed auth on the Supabase cutover — you&apos;ll set a fresh one then.</p>
      </div>
      <form action={updateProfile} className="card space-y-4">
        <div><label className="label" htmlFor="ac-name">Display name</label><input id="ac-name" name="name" className="input" defaultValue={me.name} minLength={2} maxLength={80} /></div>
        <div><label className="label">Email (workspace owner)</label><input className="input opacity-60" value={me.email} disabled aria-label="Email, not editable" /><p className="mt-1 text-xs text-muted-foreground">Email is the account key and can&apos;t change.</p></div>
        <button className="btn btn-accent" type="submit">Save changes</button>
      </form>
      <div className="card">
        <h2 className="h-display text-xl">Workspace</h2>
        <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
          <div><dt className="label">Briefs run</dt><dd className="font-display text-2xl font-semibold">{db.runs.length}</dd></div>
          <div><dt className="label">Drafts generated</dt><dd className="font-display text-2xl font-semibold">{db.versions.length}</dd></div>
          <div><dt className="label">Signals saved</dt><dd className="font-display text-2xl font-semibold">{db.signals.filter((s) => s.status === "saved" || s.status === "drafted").length}</dd></div>
          <div><dt className="label">Memory approved</dt><dd className="font-display text-2xl font-semibold">{db.memoryCards.filter((m) => m.status === "approved").length}</dd></div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          <a href="/settings/usage" className="btn btn-outline btn-sm">Usage & costs</a>
          <a href="/api/export/workspace" className="btn btn-outline btn-sm">⬇ Export workspace JSON</a>
        </div>
      </div>
    </div>
  );
}
