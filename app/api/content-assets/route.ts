import { NextResponse } from "next/server";
import { loadDB, saveDB, audit, uid, nowIso } from "@/lib/store";
import { getModelProvider, DraftOutputSchema, toClaimEntries } from "@/lib/generation";
import { estimateTokens, tokenCostUsd } from "@/lib/quotas";

// POST /api/content-assets — generate draft from approved angle (requires angle + approved memory)
export async function POST(req: Request) {
  const { signalCardId, angleId } = await req.json().catch(() => ({}));
  const db = await loadDB();
  const signal = db.signals.find((s) => s.id === signalCardId);
  const angle = db.angles.find((a) => a.id === angleId && a.signalCardId === signalCardId);
  if (!signal || !angle) return NextResponse.json({ error: "signal + explicit founder angle required" }, { status: 400 });
  const approved = db.memoryCards.filter((m) => m.status === "approved");
  if (approved.length === 0) return NextResponse.json({ error: "at least one approved Memory Card required" }, { status: 400 });
  const sources = db.sources.filter((s) => signal.sourceIds.includes(s.id));
  const provider = getModelProvider();
  const draft = DraftOutputSchema.parse(await provider.generateDraft({
    signalTitle: signal.title, angle: angle.body, sources,
    memories: approved.slice(0, 6), restricted: db.brandBrief?.restrictedClaims ?? ""
  }));
  const model = provider.model;
  const assetId = uid("asset");
  const versionId = uid("ver");
  const contextChars = signal.title.length + angle.body.length + sources.reduce((a, s) => a + s.excerpt.length, 0);
  const tokensIn = estimateTokens(contextChars);
  const tokensOut = estimateTokens(draft.body.length);
  const cost = tokenCostUsd(tokensIn, tokensOut);
  db.assets.push({ id: assetId, workspaceId: signal.workspaceId, signalCardId, angleId, platform: "linkedin", status: "in_review", currentVersion: 1, createdAt: nowIso() });
  db.versions.push({ id: versionId, assetId, workspaceId: signal.workspaceId, version: 1, body: draft.body, model, sourceIds: sources.map((s) => s.id), promptTemplate: "linkedin-v1", estCostUsd: cost, createdAt: nowIso() });
  db.claims.push(...toClaimEntries(versionId, signal.workspaceId, draft));
  db.usage.push({ id: uid("use"), workspaceId: signal.workspaceId, runId: signal.runId, provider: "model/openrouter", unit: "input_tokens", quantity: tokensIn, estimatedCost: 0, createdAt: nowIso(), meta: { tokensIn, model, estimated: true } });
  db.usage.push({ id: uid("use"), workspaceId: signal.workspaceId, runId: signal.runId, provider: "model/openrouter", unit: "output_tokens", quantity: tokensOut, estimatedCost: cost, createdAt: nowIso(), meta: { tokensOut, model, estimated: true } });
  signal.status = "drafted";
  await audit(db, "draft.generated", "asset", assetId);
  await saveDB(db);
  return NextResponse.json({ assetId, versionId, draft }, { status: 201 });
}
