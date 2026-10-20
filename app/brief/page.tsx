import { loadDB } from "@/lib/store";
import { BETA_ALLOWANCE } from "@/lib/types";
import { ScoreBar } from "@/components/ui";

export const dynamic = "force-dynamic";

async function runBrief() {
  "use server";
  const { loadDB: ldb, saveDB, audit, uid, nowIso } = await import("@/lib/store");
  const { getResearchProvider, SearchRequestSchema, toSourceRecords, clusterToSignals } = await import("@/lib/research");
  const { quotaCheck, estimateSearchCost, LIMITS } = await import("@/lib/quotas");
  const db = await ldb();
  const themes = (db.brandBrief?.themes ?? []).slice(0, 5);
  const q = quotaCheck(db);
  if (!q.ok) return;
  const req = SearchRequestSchema.parse({ themes, maxQueries: LIMITS.runMaxQueries, maxResults: LIMITS.runMaxResults });
  const key = `manual-${new Date().toISOString().slice(0, 13)}-${themes.join("|").slice(0, 40)}`;
  if (db.runs.some((r) => r.idempotencyKey === key)) return;
  const runId = uid("run");
  db.runs.push({ id: runId, workspaceId: db.brandBrief?.workspaceId ?? "ws_curro_beta", status: "retrieving", trigger: "manual", idempotencyKey: key, themes, usage: { queries: req.maxQueries, results: 0, estCostUsd: estimateSearchCost(req.maxQueries) }, warnings: [], createdAt: nowIso(), finishedAt: null });
  await saveDB(db);
  try {
    const provider = getResearchProvider();
    const raw = await provider.search(req);
    const db2 = await ldb();
    const run = db2.runs.find((r) => r.id === runId)!;
    const records = toSourceRecords(runId, raw);
    const known = new Set(db2.sources.map((s) => s.canonicalUrl));
    const fresh = records.filter((r) => !known.has(r.canonicalUrl));
    db2.sources.push(...records);
    const dismissed = new Set(db2.signals.filter((s) => s.status === "dismissed").map((s) => s.suppressionKey));
    const signals = clusterToSignals(runId, (fresh.length ? fresh : records), known, dismissed);
    db2.signals.push(...signals);
    run.status = fresh.length < records.length || signals.length < 3 ? "partial" : "succeeded";
    if (run.status === "partial") run.warnings.push("Some sources were already seen — showing fresh items first.");
    run.usage = { queries: req.maxQueries, results: records.length, estCostUsd: estimateSearchCost(req.maxQueries) };
    run.finishedAt = nowIso();
    db2.usage.push({ id: uid("use"), workspaceId: run.workspaceId, runId, provider: process.env.RESEARCH_PROVIDER === "mock" || !(process.env.PARALLEL_API_KEY ?? process.env.PARALLEL_AI_API_KEY) ? "search/mock" : "search/parallel", unit: "queries", quantity: req.maxQueries, estimatedCost: run.usage.estCostUsd, createdAt: nowIso() });
    await audit(db2, "research.run.succeeded", "research_run", runId);
    await saveDB(db2);
  } catch (e: unknown) {
    const db3 = await ldb();
    const run = db3.runs.find((r) => r.id === runId);
    if (run) { run.status = "failed"; run.warnings.push(e instanceof Error ? e.message : "Provider failed — no results invented."); run.finishedAt = nowIso(); }
    await saveDB(db3);
  }
}

const STATUS_BADGE: Record<string, string> = { new: "badge-accent", saved: "badge-success", dismissed: "badge-muted", drafted: "badge-accent", archived: "badge-muted" };

export default async function BriefPage() {
  const db = await loadDB();
  const runsUsed = db.runs.length;
  const draftsUsed = db.versions.length;
  const latestRun = db.runs[db.runs.length - 1];
  const latestSignals = db.signals.filter((s) => latestRun && s.runId === latestRun.id);
  const list = (latestSignals.length ? latestSignals : db.signals.filter((s) => s.status !== "archived").slice(-3).reverse());

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <p className="eyebrow">Founder Signal Brief</p>
          <h1 className="h-display mt-1 text-3xl md:text-4xl">This week&apos;s three signals.</h1>
          <p className="prose-muted mt-2 text-sm">Ranked by relevance, freshness, and evidence quality — never by predicted virality. Open a card, own an angle, earn the draft.</p>
          <p className="mt-2 text-sm"><strong>{BETA_ALLOWANCE.briefs - runsUsed} briefs</strong> <span className="text-muted-foreground">and</span> <strong>{BETA_ALLOWANCE.drafts - draftsUsed} drafts</strong> <span className="text-muted-foreground">included in your free plan.</span></p>
        </div>
        <div className="flex flex-col gap-2">
          <form action={runBrief}><button className="btn btn-accent" type="submit">↻ Run brief manually</button></form>
          {latestRun && <a href={`/api/export/brief/${latestRun.id}`} className="btn btn-outline btn-sm">⬇ Export brief (.md)</a>}
        </div>
      </div>

      {latestRun && (
        <div className="card !py-4 text-sm">
          <span className={`badge ${latestRun.status === "succeeded" ? "badge-success" : latestRun.status === "partial" ? "badge-warning" : latestRun.status === "failed" ? "badge-danger" : "badge-muted"}`}>{latestRun.status}</span>
          <span className="ml-3 text-muted-foreground">Run {latestRun.id.slice(-6)} · {latestRun.usage.queries} queries · {latestRun.usage.results} results · ~${latestRun.usage.estCostUsd.toFixed(3)}</span>
          {latestRun.warnings.map((w) => <p key={w} className="mt-1 text-warning">⚠ {w}</p>)}
        </div>
      )}

      {list.length === 0 ? (
        <div className="card">
          <div className="empty">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-2xl" aria-hidden>◈</div>
            <h2 className="h-display mt-4 text-xl">A quiet desk, ready for signal.</h2>
            <p className="prose-muted mt-1 max-w-md text-sm">Run your first manual brief to get up to three cited Signal Cards. If the provider fails you&apos;ll see a safe error — Curro never invents results to fill the silence.</p>
            <form action={runBrief} className="mt-4"><button className="btn btn-accent" type="submit">Run my first brief</button></form>
          </div>
        </div>
      ) : (
        <div className="anim-list grid gap-4 md:grid-cols-3">
          {list.map((s) => (
            <a key={s.id} href={`/signals/${s.id}`} className="card card-hover">
              <div className="flex items-center justify-between gap-2">
                <span className={`badge ${STATUS_BADGE[s.status]}`}>{s.status}</span>
                <span className="font-mono text-xs text-muted-foreground">{s.score.total} pts</span>
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold leading-snug">{s.title}</h3>
              <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{s.whyNow}</p>
              <div className="mt-3"><ScoreBar score={s.score.total} /></div>
              <p className="mt-2 text-xs text-muted-foreground">{s.sourceIds.length} sources · open for angle →</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
