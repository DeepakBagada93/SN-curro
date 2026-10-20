import { notFound, redirect } from "next/navigation";
import { loadDB } from "@/lib/store";
import { canTransition } from "@/lib/generation";
import { diffLines } from "@/lib/diff";

export const dynamic = "force-dynamic";

async function saveEdit(assetId: string, formData: FormData) {
  "use server";
  const body = String(formData.get("body") ?? "").slice(0, 3000);
  if (body.trim().length < 20) return;
  const { loadDB: l, saveDB, audit, uid, nowIso } = await import("@/lib/store");
  const db = await l();
  const asset = db.assets.find((a) => a.id === assetId);
  if (!asset) return;
  const n = asset.currentVersion + 1;
  const verId = uid("ver");
  db.versions.push({ id: verId, assetId, workspaceId: asset.workspaceId, version: n, body: body.trim(), model: "manual-edit", sourceIds: db.versions.filter((v) => v.assetId === assetId).flatMap((v) => v.sourceIds).slice(0, 6), promptTemplate: "manual-edit", estCostUsd: 0, createdAt: nowIso() });
  const prev = db.versions.filter((v) => v.assetId === assetId && v.version === n - 1).map((v) => v.id);
  const open = db.claims.filter((c) => prev.includes(c.versionId) && c.reviewStatus === "open");
  open.forEach((c) => db.claims.push({ ...c, id: uid("clm"), versionId: verId }));
  asset.currentVersion = n;
  await audit(db, "draft.edited", "asset", assetId);
  await saveDB(db);
}
async function setStatus(assetId: string, to: string) {
  "use server";
  const { loadDB: l, saveDB, audit } = await import("@/lib/store");
  const db = await l();
  const asset = db.assets.find((a) => a.id === assetId);
  if (!asset || !canTransition(asset.status, to)) return;
  asset.status = to as typeof asset.status;
  await audit(db, `draft.${to}`, "asset", assetId);
  await saveDB(db);
  if (to === "approved" || to === "rejected" || to === "archived") redirect("/drafts");
}
async function resolveClaim(claimId: string, to: "resolved" | "removed") {
  "use server";
  const { loadDB: l, saveDB } = await import("@/lib/store");
  const db = await l();
  const c = db.claims.find((x) => x.id === claimId);
  if (c) { c.reviewStatus = to; await saveDB(db); }
}

export default async function DraftPage({ params }: { params: { id: string } }) {
  const db = await loadDB();
  const asset = db.assets.find((a) => a.id === params.id);
  if (!asset) notFound();
  const versions = db.versions.filter((v) => v.assetId === asset.id).sort((a, b) => b.version - a.version);
  const current = versions[0];
  if (!current) notFound();
  const claims = db.claims.filter((c) => c.versionId === current.id);
  const sources = db.sources.filter((s) => current.sourceIds.includes(s.id));
  const open = claims.filter((c) => c.reviewStatus === "open").length;
  const unsupported = claims.filter((c) => c.kind === "unsupported" && c.reviewStatus === "open").length;
  const previous = versions.find((v) => v.version === current.version - 1) ?? null;
  const diff = previous ? diffLines(previous.body, current.body) : null;

  return (
    <div className="space-y-6">
      <a href="/drafts" className="text-sm text-muted-foreground hover:text-foreground">← All drafts</a>
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-accent">{asset.status.replace("_", " ")} · v{current.version}</span>
            <span className="font-mono text-xs text-muted-foreground">{current.model}</span>
            {unsupported > 0 && <span className="badge badge-danger">{unsupported} unsupported — resolve before approval</span>}
          </div>
          <h1 className="h-display mt-2 text-2xl">Draft review — LinkedIn text post</h1>
          <p className="text-xs text-muted-foreground">Curro ends at approve + copy. Publishing is deliberately absent.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["in_review", "draft"] as const).includes(asset.status as never) && <form action={setStatus.bind(null, asset.id, "approved")}><button className="btn btn-accent btn-sm" type="submit">✓ Approve</button></form>}
          <form action={setStatus.bind(null, asset.id, "rejected")}><button className="btn btn-outline btn-sm" type="submit">Reject</button></form>
          <form action={setStatus.bind(null, asset.id, "archived")}><button className="btn btn-outline btn-sm" type="submit">Archive</button></form>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-1">
          <h2 className="h-display text-lg">Editor <span className="font-sans text-xs font-normal text-muted-foreground">(v{current.version})</span></h2>
          <form action={saveEdit.bind(null, asset.id)}>
            <label className="label mt-2" htmlFor="draft-body">Post text — select all to copy after approval</label>
            <textarea id="draft-body" name="body" className="input min-h-[320px] whitespace-pre-wrap leading-relaxed" defaultValue={current.body} maxLength={3000} />
            <button className="btn btn-sm mt-2" type="submit">Save as v{current.version + 1} — history is immutable</button>
          </form>
          <details className="mt-3 text-xs text-muted-foreground"><summary className="cursor-pointer">Version history ({versions.length})</summary>{versions.map((v) => <p key={v.id} className="mt-1 font-mono">v{v.version} · {v.model} · {v.createdAt.slice(0, 16)}</p>)}</details>
        </div>
        <div className="card lg:col-span-1">
          <h2 className="h-display text-lg">Claim Ledger</h2>
          <p className="text-xs text-muted-foreground">A review aid, not a truth guarantee. {open} open.</p>
          <div className="mt-3 space-y-2">
            {claims.map((c) => (
              <div key={c.id} className={`rounded-xl border p-3 text-sm ${c.kind === "unsupported" ? "border-destructive/40 bg-destructive/5" : c.kind === "opinion" ? "border-warning/40 bg-warning/5" : "border-success/40 bg-success/5"}`}>
                <span className="badge badge-muted">{c.kind} · {c.reviewStatus}</span>
                <p className="mt-1.5">{c.claim}</p>
                {c.reviewNote && <p className="mt-1 text-xs text-muted-foreground">⚠ {c.reviewNote}</p>}
                {c.reviewStatus === "open" && (
                  <div className="mt-2 flex gap-2">
                    <form action={resolveClaim.bind(null, c.id, "resolved")}><button className="btn btn-sm !px-3 !py-1 text-xs" type="submit">Resolve</button></form>
                    <form action={resolveClaim.bind(null, c.id, "removed")}><button className="btn btn-outline btn-sm !px-3 !py-1 text-xs" type="submit">Remove</button></form>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="card lg:col-span-1">
          <h2 className="h-display text-lg">Sources</h2>
          <p className="text-xs text-muted-foreground">Linked evidence for this version.</p>
          {sources.map((s) => (
            <div key={s.id} className="mt-2 border-t border-border pt-2 text-sm">
              <a className="font-semibold text-accent hover:underline" href={s.canonicalUrl} target="_blank" rel="noreferrer">{s.title} ↗</a>
              <p className="font-mono text-xs text-muted-foreground">{s.publisher} · retrieved {s.retrievedAt.slice(0, 10)}</p>
            </div>
          ))}
          {sources.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No sources attached to this version.</p>}
        </div>
      </div>

      {diff && (
        <div className="card">
          <h2 className="h-display text-lg">What changed — v{previous!.version} → v{current.version}</h2>
          <div className="mt-2 space-y-0.5 overflow-x-auto rounded-xl bg-muted/40 p-3 font-mono text-xs">
            {diff.map((d, i) => (
              <p key={i} className={d.type === "add" ? "bg-success/10 text-foreground" : d.type === "del" ? "bg-destructive/10 text-muted-foreground line-through" : "text-muted-foreground"}>
                <span className="mr-2 inline-block w-4">{d.type === "add" ? "+" : d.type === "del" ? "−" : " "}</span>{d.text || " "}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <a href={`/api/export/draft/${asset.id}`} className="btn btn-outline btn-sm">⬇ Export markdown</a>
        <a href="/drafts" className="btn btn-ghost btn-sm">All drafts →</a>
      </div>
    </div>
  );
}
