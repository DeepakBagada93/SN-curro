import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { loadDB, saveDB, audit, uid, nowIso } from "@/lib/store";
import { openRouterConfigured } from "@/lib/openrouter";
import { generateStudioAsset } from "@/lib/studio-provider";
import { PLAN_CATALOG, STUDIO_FORMATS, badgeForAssetStatus, formatChannel, formatForChannel, formatLabel, generationsUsed, planLimit } from "@/lib/agency";
import { CHANNEL_LABELS, knowledgeStats } from "@/lib/clients";
import { PLATFORM_GUIDELINES } from "@/lib/platform-guidelines";
import { EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { PromptAgentWorkspace } from "@/components/prompt-agent-workspace";
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

  const memory = db.memoryCards.filter((m) => m.status === "approved");
  const { draft, model } = await generateStudioAsset({ client, knowledge, memory, format, title, brief });
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
  const platformGuide = PLATFORM_GUIDELINES[selectedFormat];
  const approvedMemory = db.memoryCards.filter((m) => m.status === "approved");
  const modelLabel = openRouterConfigured() ? "OpenRouter (live)" : "Mock composer (deterministic)";

  const assetsSummary = assets.map((a) => {
    const v = db.versions.find((ver) => ver.assetId === a.id && ver.version === a.currentVersion);
    const c = db.claims.filter((clm) => clm.versionId === v?.id);
    const openUns = c.filter((clm) => clm.kind === "unsupported" && clm.reviewStatus === "open").length;
    return {
      id: a.id,
      title: a.title ?? v?.body.split("\n")[0] ?? "Untitled draft",
      format: a.format ?? "linkedin_post",
      platform: a.platform,
      status: a.status,
      currentVersion: a.currentVersion,
      createdAt: a.createdAt,
      snippet: v?.body.replace(/[#*]/g, "").slice(0, 160),
      openUnsupported: openUns
    };
  });

  return (
    <div className="space-y-4">
      {searchParams.error && (
        <p className="alert alert-danger max-w-4xl mx-auto">
          {searchParams.error === "knowledge"
            ? "No approved knowledge for this client. Approve at least one item first."
            : searchParams.error === "limit"
              ? `Your ${limit.label} plan allows ${limit.generations} generations/month. Upgrade in Settings → Plan.`
              : "Select a valid client."}
        </p>
      )}
      {searchParams.message === "deleted" && (
        <p className="alert alert-warning max-w-4xl mx-auto">Draft archived.</p>
      )}

      <PromptAgentWorkspace
        client={client}
        clients={db.clients.map((c) => ({
          id: c.id,
          name: c.name,
          brandColor: c.brandColor
        }))}
        initialKnowledge={knowledge}
        initialAssets={assets}
      />
    </div>
  );
}
