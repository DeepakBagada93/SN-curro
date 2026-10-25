import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { loadDB, saveDB, audit, uid, nowIso } from "@/lib/store";
import { openRouterConfigured } from "@/lib/openrouter";
import { generateStudioAsset } from "@/lib/studio-provider";
import { PLAN_CATALOG, STUDIO_FORMATS, badgeForAssetStatus, formatChannel, formatForChannel, formatLabel, generationsUsed, planLimit } from "@/lib/agency";
import { CHANNEL_LABELS, knowledgeStats } from "@/lib/clients";
import { EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import type { AssetFormat, ClaimEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

async function createStudioAsset(clientId: string, formData: FormData) {
  "use server";
  const db = await loadDB();
  const client = db.clients.find((c) => c.id === clientId);
  if (!client) redirect("/studio?error=client");

  const format = (STUDIO_FORMATS.find((f) => f.id === formData.get("format"))?.id ?? "linkedin_post") as AssetFormat;
  const approved = db.knowledgeItems.filter((k) => k.clientId === clientId && k.status === "approved");
  const pickedIds = new Set(formData.getAll("knowledge").map(String));
  const knowledge = pickedIds.size > 0 ? approved.filter((k) => pickedIds.has(k.id)) : approved;
  if (knowledge.length === 0) redirect(`/studio?client=${clientId}&error=knowledge`);

  const limit = planLimit(db.planTier);
  if (generationsUsed(db.assets) >= limit.generations) {
    redirect(`/studio?client=${clientId}&error=limit`);
  }

  const planItemId = String(formData.get("planItemId") ?? "");
  const planItem = db.planItems.find((p) => p.id === planItemId && p.clientId === clientId);
  const title = String(formData.get("title") ?? "").trim() || planItem?.title || undefined;
  const brief = String(formData.get("brief") ?? "").trim() || planItem?.notes || planItem?.title || undefined;

  const { draft, model } = await generateStudioAsset({ client, knowledge, format, title, brief });
  const t = nowIso();
  const assetId = uid("asset");
  const versionId = uid("ver");
  const claims: ClaimEntry[] = draft.claims.map((c) => ({
    id: uid("clm"),
    workspaceId: client.workspaceId,
    versionId,
    claim: c.text,
    kind: c.kind,
    sourceIds: c.sourceIds,
    reviewNote: c.reviewNote,
    reviewStatus: "open"
  }));

  db.assets.push({
    id: assetId,
    workspaceId: client.workspaceId,
    clientId,
    planItemId: planItem?.id,
    platform: formatChannel(format),
    format,
    title: draft.title,
    knowledgeIds: knowledge.map((k) => k.id),
    status: "in_review",
    currentVersion: 1,
    createdAt: t,
    updatedAt: t
  });
  db.versions.push({
    id: versionId,
    assetId,
    workspaceId: client.workspaceId,
    version: 1,
    body: draft.body,
    model,
    sourceIds: knowledge.map((k) => k.id),
    promptTemplate: draft.promptTemplate,
    estCostUsd: 0,
    createdAt: t
  });
  db.claims.push(...claims);
  if (planItem) {
    planItem.status = planItem.status === "published" ? planItem.status : "in_progress";
    planItem.updatedAt = t;
  }
  await audit(db, "studio.asset.created", "content_asset", assetId);
  await saveDB(db);
  revalidatePath("/studio");
  redirect(`/studio/${assetId}?message=generated`);
}

export default async function StudioPage({
  searchParams
}: {
  searchParams: { client?: string; format?: string; planItem?: string; error?: string; message?: string };
}) {
  const db = await loadDB();
  if (db.clients.length === 0) {
    return (
      <div className="card">
        <EmptyState icon="✎" title="Add a client first." body="The studio can only draft from a client's approved knowledge." action={<a href="/clients" className="btn btn-accent">Go to clients</a>} />
      </div>
    );
  }

  const client = db.clients.find((c) => c.id === searchParams.client) ?? db.clients[0];
  const planItem = db.planItems.find((p) => p.id === searchParams.planItem && p.clientId === client.id);
  const selectedFormat = (STUDIO_FORMATS.find((f) => f.id === searchParams.format)?.id ?? (planItem ? formatForChannel(planItem.channel) : "linkedin_post")) as AssetFormat;
  const knowledge = db.knowledgeItems.filter((k) => k.clientId === client.id);
  const approved = knowledge.filter((k) => k.status === "approved");
  const stats = knowledgeStats(knowledge);
  const assets = db.assets
    .filter((a) => a.clientId === client.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const limit = PLAN_CATALOG[db.planTier];
  const used = generationsUsed(db.assets);
  const formatSpec = STUDIO_FORMATS.find((f) => f.id === selectedFormat)!;
  const modelLabel = openRouterConfigured() ? "OpenRouter (live)" : "Mock composer (deterministic)";

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Content studio</p>
            <h1 className="h-display mt-1 text-3xl md:text-4xl">Draft from what the client has approved.</h1>
            <p className="prose-muted mt-1 max-w-2xl text-sm">Every draft keeps a claim ledger. Unsupported claims block approval until you edit or remove them.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`/clients/${client.id}`} className="btn btn-outline btn-sm">Knowledge Brain</a>
            <a href={`/planner?client=${client.id}`} className="btn btn-sm">Planner →</a>
          </div>
        </div>
        <form method="get" className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <select name="client" defaultValue={client.id} className="input" aria-label="Client">
            {db.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select name="format" defaultValue={selectedFormat} className="input sm:!w-52" aria-label="Format">
            {STUDIO_FORMATS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
          <button className="btn btn-outline" type="submit">View</button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">Model: {modelLabel} · Generations this month {used}/{limit.generations} · {stats.approved} approved knowledge items</p>
      </div>

      {searchParams.error && (
        <p className="alert alert-danger">
          {searchParams.error === "knowledge"
            ? "No approved knowledge for this client. Approve at least one item first."
            : searchParams.error === "limit"
              ? `Your ${limit.label} plan allows ${limit.generations} generations/month. Upgrade in Settings → Plan.`
              : "Select a valid client."}
        </p>
      )}
      {searchParams.message === "deleted" && <p className="alert alert-warning">Draft archived.</p>}

      <div className="grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
        <section className="card xl:sticky xl:top-4 xl:self-start">
          <p className="eyebrow">New draft</p>
          <h2 className="h-display mt-1 text-xl">{formatSpec.label}</h2>
          <p className="prose-muted mt-1 text-xs">{formatSpec.description} · up to {formatSpec.maxChars.toLocaleString()} chars</p>
          {planItem && (
            <div className="mt-3 rounded-lg border border-accent/30 bg-accent/5 p-2 text-xs">
              <span className="font-semibold">From planner:</span> {planItem.title} · {planItem.publishDate}
            </div>
          )}
          {approved.length === 0 ? (
            <p className="alert alert-warning mt-3">Approve knowledge first — drafting from nothing is how invented claims ship.</p>
          ) : (
            <form action={createStudioAsset.bind(null, client.id)} className="mt-3 space-y-3">
              <input type="hidden" name="format" value={selectedFormat} />
              {planItem && <input type="hidden" name="planItemId" value={planItem.id} />}
              <div>
                <label className="label" htmlFor="st-title">Working title <span className="font-normal text-muted-foreground">(optional)</span></label>
                <input id="st-title" name="title" className="input" defaultValue={planItem?.title ?? ""} maxLength={200} placeholder="Generated from the top knowledge item" />
              </div>
              <div>
                <label className="label" htmlFor="st-brief">Angle / brief</label>
                <textarea id="st-brief" name="brief" className="input min-h-[80px]" defaultValue={planItem?.notes ?? ""} maxLength={600} placeholder="The specific point of view — one sentence is enough." />
              </div>
              <fieldset>
                <legend className="label">Source knowledge</legend>
                <p className="mb-2 text-[11px] text-muted-foreground">Leave all unchecked to use every approved item (max 6).</p>
                <div className="max-h-44 space-y-1 overflow-auto rounded-lg border border-border p-2">
                  {approved.map((k) => (
                    <label key={k.id} className="flex items-start gap-2 text-xs">
                      <input type="checkbox" name="knowledge" value={k.id} className="mt-0.5" />
                      <span><span className="font-medium">{k.title}</span> <span className="text-muted-foreground">· {k.kind.replace("_", " ")}</span></span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <SubmitButton
                pendingText={`Generating ${formatSpec.label.toLowerCase()} with AI…`}
                className="btn btn-accent w-full"
              >
                Generate {formatSpec.label.toLowerCase()}
              </SubmitButton>
              <p className="text-[11px] text-muted-foreground">Output lands in review, never published. Unsupported outcomes stay visible until edited.</p>
            </form>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="h-display text-2xl">Drafts</h2>
            <span className="text-xs text-muted-foreground">{assets.length} total</span>
          </div>
          {assets.length === 0 ? (
            <div className="card">
              <EmptyState icon="✎" title="No drafts yet." body="Generate the first asset from approved knowledge. The claim ledger and approval gate come free." />
            </div>
          ) : (
            <div className="space-y-2">
              {assets.map((asset) => {
                const version = db.versions.find((v) => v.assetId === asset.id && v.version === asset.currentVersion);
                const claims = db.claims.filter((c) => c.versionId === version?.id);
                const openUnsupported = claims.filter((c) => c.kind === "unsupported" && c.reviewStatus === "open").length;
                return (
                  <a key={asset.id} href={`/studio/${asset.id}`} className="block rounded-xl border border-border bg-card p-3 transition hover:border-accent/50">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="badge badge-muted">{formatLabel(asset.format ?? "linkedin_post")}</span>
                      <span className={`badge ${badgeForAssetStatus(asset.status)}`}>{asset.status.replace("_", " ")}</span>
                      <span className="badge badge-muted">{CHANNEL_LABELS[asset.platform]}</span>
                      {openUnsupported > 0 && <span className="badge badge-danger">{openUnsupported} unsupported</span>}
                    </div>
                    <p className="mt-1.5 font-semibold leading-snug">{asset.title ?? version?.body.split("\n")[0] ?? "Untitled draft"}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{version?.body.replace(/[#*]/g, "").slice(0, 180)}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">v{asset.currentVersion} · {version?.model ?? "mock"} · {new Date(asset.createdAt).toLocaleDateString()}</p>
                  </a>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
