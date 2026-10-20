import { notFound, redirect } from "next/navigation";
import { loadDB } from "@/lib/store";
import { tensionFor } from "@/lib/research";
import { ScoreBar } from "@/components/ui";

export const dynamic = "force-dynamic";

async function saveSignal(id: string) {
  "use server";
  const { loadDB: l, saveDB, audit } = await import("@/lib/store");
  const db = await l();
  const s = db.signals.find((x) => x.id === id);
  if (s) { s.status = "saved"; await audit(db, "signal.saved", "signal", id); await saveDB(db); }
}
async function dismissSignal(id: string) {
  "use server";
  const { loadDB: l, saveDB, audit } = await import("@/lib/store");
  const db = await l();
  const s = db.signals.find((x) => x.id === id);
  if (s) {
    s.status = "dismissed";
    s.dismissedUntil = new Date(Date.now() + 14 * 864e5).toISOString();
    await audit(db, "signal.dismissed", "signal", id); await saveDB(db);
  }
}
async function addAngle(signalId: string, formData: FormData) {
  "use server";
  const body = String(formData.get("angle") ?? "").slice(0, 500);
  if (body.trim().length < 10) return;
  const { loadDB: l, saveDB, audit, uid, nowIso } = await import("@/lib/store");
  const db = await l();
  db.angles.push({ id: uid("ang"), workspaceId: db.brandBrief?.workspaceId ?? "ws_curro_beta", signalCardId: signalId, body: body.trim(), origin: "founder", createdAt: nowIso() });
  await audit(db, "angle.created", "signal", signalId);
  await saveDB(db);
}
async function generateDraft(signalId: string, angleId: string) {
  "use server";
  const { loadDB: l, saveDB, audit, uid, nowIso } = await import("@/lib/store");
  const { getModelProvider, toClaimEntries, DraftOutputSchema } = await import("@/lib/generation");
  const { estimateTokens, tokenCostUsd } = await import("@/lib/quotas");
  const db = await l();
  const signal = db.signals.find((s) => s.id === signalId);
  const angle = db.angles.find((a) => a.id === angleId);
  if (!signal || !angle) return;
  const approved = db.memoryCards.filter((m) => m.status === "approved");
  if (approved.length === 0) return;
  const sources = db.sources.filter((s) => signal.sourceIds.includes(s.id));
  const provider = getModelProvider();
  const draft = DraftOutputSchema.parse(await provider.generateDraft({
    signalTitle: signal.title, angle: angle.body, sources,
    memories: approved.slice(0, 6), restricted: db.brandBrief?.restrictedClaims ?? ""
  }));
  const model = provider.model;
  const assetId = uid("asset");
  const versionId = uid("ver");
  const contextChars = signal.title.length + angle.body.length + sources.reduce((a, s) => a + s.excerpt.length, 0) + approved.slice(0, 6).reduce((a, m) => a + m.body.length, 0);
  const tokensIn = estimateTokens(contextChars);
  const tokensOut = estimateTokens(draft.body.length);
  const cost = tokenCostUsd(tokensIn, tokensOut);
  db.assets.push({ id: assetId, workspaceId: signal.workspaceId, signalCardId: signalId, angleId, platform: "linkedin", status: "in_review", currentVersion: 1, createdAt: nowIso() });
  db.versions.push({ id: versionId, assetId, workspaceId: signal.workspaceId, version: 1, body: draft.body, model, sourceIds: sources.map((s) => s.id), promptTemplate: "linkedin-v1", estCostUsd: cost, createdAt: nowIso() });
  db.claims.push(...toClaimEntries(versionId, signal.workspaceId, draft));
  db.usage.push({ id: uid("use"), workspaceId: signal.workspaceId, runId: signal.runId, provider: "model/openrouter", unit: "input_tokens", quantity: tokensIn, estimatedCost: 0, createdAt: nowIso(), meta: { tokensIn, model, estimated: true } });
  db.usage.push({ id: uid("use"), workspaceId: signal.workspaceId, runId: signal.runId, provider: "model/openrouter", unit: "output_tokens", quantity: tokensOut, estimatedCost: cost, createdAt: nowIso(), meta: { tokensOut, model, estimated: true } });
  signal.status = "drafted";
  await audit(db, "draft.generated", "asset", assetId);
  await saveDB(db);
  redirect(`/drafts/${assetId}`);
}

export default async function SignalDetail({ params }: { params: { id: string } }) {
  const db = await loadDB();
  const s = db.signals.find((x) => x.id === params.id);
  if (!s) notFound();
  const sources = db.sources.filter((x) => s.sourceIds.includes(x.id));
  const tension = tensionFor(s.title, sources.map((x) => `${x.publisher}: ${x.excerpt}`), db.brandBrief?.restrictedClaims ?? "");
  const angles = db.angles.filter((a) => a.signalCardId === s.id);
  const approvedCount = db.memoryCards.filter((m) => m.status === "approved").length;

  return (
    <div className="space-y-6">
      <a href="/brief" className="text-sm text-muted-foreground hover:text-foreground">← Back to brief</a>
      <div className="card">
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge badge-accent">{s.status}</span>
          <span className="font-mono text-xs text-muted-foreground">{s.score.total} pts — ranking aid, not a virality prediction</span>
        </div>
        <h1 className="h-display mt-2 text-3xl">{s.title}</h1>
        <p className="prose-muted mt-2 max-w-3xl text-sm">{s.relevance}</p>
        <div className="mt-2 max-w-xs"><ScoreBar score={s.score.total} /></div>
        <div className="mt-4 flex flex-wrap gap-2">
          <form action={saveSignal.bind(null, s.id)}><button className="btn btn-sm" type="submit">♥ Save signal</button></form>
          <form action={dismissSignal.bind(null, s.id)}><button className="btn btn-outline btn-sm" type="submit">Dismiss for 14 days</button></form>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="h-display text-xl">Evidence ({sources.length})</h2>
          <p className="text-xs text-muted-foreground">Titles, publishers, and dates — the raw material. Nothing here is a trend claim.</p>
          {sources.map((src) => (
            <div key={src.id} className="mt-3 border-t border-border pt-3 text-sm">
              <a href={src.canonicalUrl} target="_blank" rel="noreferrer" className="font-semibold text-accent hover:underline">{src.title} ↗</a>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">{src.publisher} · {src.publishedAt?.slice(0, 10) ?? "undated"} · retrieved {src.retrievedAt.slice(0, 10)}</p>
              <p className="mt-1 text-muted-foreground">{src.excerpt}</p>
            </div>
          ))}
        </div>
        <div className="card">
          <h2 className="h-display text-xl">Tension Map</h2>
          <p className="text-xs text-muted-foreground">The editorial tension — read this before any copy exists.</p>
          <dl className="mt-3 space-y-3 text-sm">
            <div><dt className="label">What changed</dt><dd>{tension.whatChanged}</dd></div>
            <div><dt className="label">Why it matters to your buyers</dt><dd>{tension.whyItMatters}</dd></div>
            <div><dt className="label">The common take (interpretation, not fact)</dt><dd>{tension.commonTake}</dd></div>
            <div><dt className="label">What you could credibly add</dt><dd><ul className="list-disc space-y-1 pl-5">{tension.founderAngles.map((a) => <li key={a}>{a}</li>)}</ul></dd></div>
            <div className="rounded-xl border border-warning/30 bg-warning/5 p-3"><dt className="label !text-warning">What must not be claimed</dt><dd><ul className="list-disc space-y-1 pl-5">{tension.mustNotClaim.map((a) => <li key={a}>{a}</li>)}</ul></dd></div>
          </dl>
        </div>
      </div>

      <div className="card">
        <h2 className="h-display text-xl">Your angle — required before drafting</h2>
        <p className="text-xs text-muted-foreground">{approvedCount} approved Memory Cards will join the draft context. Candidates never do.</p>
        <form action={addAngle.bind(null, s.id)} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input name="angle" className="input flex-1" aria-label="Your founder angle" placeholder="e.g. Link-first posts died; our replies doubled when the link moved to comments…" maxLength={500} />
          <button className="btn shrink-0" type="submit">Add angle</button>
        </form>
        <div className="mt-3 space-y-2">
          {angles.length === 0 && <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">No angle yet — the draft button stays locked until you commit to a point of view. That&apos;s the whole philosophy.</p>}
          {angles.map((a) => (
            <form key={a.id} action={generateDraft.bind(null, s.id, a.id)} className="flex flex-col gap-3 rounded-xl border border-border p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span>{a.body} <span className="text-xs text-muted-foreground">({a.origin})</span></span>
              <button className="btn btn-accent btn-sm shrink-0" type="submit">Generate LinkedIn draft ✎</button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
