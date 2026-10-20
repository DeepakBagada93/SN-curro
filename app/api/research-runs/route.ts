import { NextResponse } from "next/server";
import { loadDB, saveDB, audit, uid, nowIso } from "@/lib/store";
import { getResearchProvider, SearchRequestSchema, toSourceRecords, clusterToSignals } from "@/lib/research";
import { quotaCheck, estimateSearchCost, LIMITS } from "@/lib/quotas";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const db = await loadDB();
  const q = quotaCheck(db);
  if (!q.ok) return NextResponse.json({ error: q.reason }, { status: 429 });
  const themes = (body.themes ?? db.brandBrief?.themes ?? []).slice(0, 5);
  const parsed = SearchRequestSchema.safeParse({ themes, maxQueries: LIMITS.runMaxQueries, maxResults: LIMITS.runMaxResults });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const key = String(body.idempotencyKey ?? `manual-${Date.now()}`);
  if (db.runs.some((r) => r.idempotencyKey === key)) {
    const existing = db.runs.find((r) => r.idempotencyKey === key)!;
    return NextResponse.json({ run: existing, deduped: true });
  }
  const runId = uid("run");
  db.runs.push({ id: runId, workspaceId: "ws_curro_beta", status: "retrieving", trigger: "manual", idempotencyKey: key, themes, usage: { queries: parsed.data.maxQueries, results: 0, estCostUsd: estimateSearchCost(parsed.data.maxQueries) }, warnings: [], createdAt: nowIso(), finishedAt: null });
  await saveDB(db);
  try {
    const raw = await getResearchProvider().search(parsed.data);
    const db2 = await loadDB();
    const run = db2.runs.find((r) => r.id === runId)!;
    const records = toSourceRecords(runId, raw);
    const known = new Set(db2.sources.map((s) => s.canonicalUrl));
    const fresh = records.filter((r) => !known.has(r.canonicalUrl));
    db2.sources.push(...records);
    const dismissed = new Set(db2.signals.filter((s) => s.status === "dismissed").map((s) => s.suppressionKey));
    const signals = clusterToSignals(runId, fresh.length ? fresh : records, known, dismissed);
    db2.signals.push(...signals);
    run.status = "succeeded";
    run.usage = { queries: parsed.data.maxQueries, results: records.length, estCostUsd: estimateSearchCost(parsed.data.maxQueries) };
    run.finishedAt = nowIso();
    db2.usage.push({ id: uid("use"), workspaceId: run.workspaceId, runId, provider: process.env.RESEARCH_PROVIDER === "mock" || !(process.env.PARALLEL_API_KEY ?? process.env.PARALLEL_AI_API_KEY) ? "search/mock" : "search/parallel", unit: "queries", quantity: parsed.data.maxQueries, estimatedCost: run.usage.estCostUsd, createdAt: nowIso() });
    await audit(db2, "research.run.succeeded", "research_run", runId);
    await saveDB(db2);
    return NextResponse.json({ run, signals }, { status: 201 });
  } catch (e) {
    const db3 = await loadDB();
    const run = db3.runs.find((r) => r.id === runId);
    if (run) { run.status = "failed"; run.warnings.push(e instanceof Error ? e.message : "Provider failed — no results invented."); run.finishedAt = nowIso(); }
    await saveDB(db3);
    return NextResponse.json({ error: "research provider failed", run }, { status: 502 });
  }
}

export async function GET() {
  const db = await loadDB();
  return NextResponse.json({ runs: db.signals.length ? db.runs.slice().reverse().slice(0, 10) : db.runs });
}
