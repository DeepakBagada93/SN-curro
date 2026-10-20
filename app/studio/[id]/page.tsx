import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { loadDB, saveDB, audit, uid, nowIso } from "@/lib/store";
import { canApproveAsset, canAssetTransition, formatLabel, STUDIO_FORMATS, badgeForAssetStatus } from "@/lib/agency";
import { KNOWLEDGE_KIND_LABELS, CHANNEL_LABELS } from "@/lib/clients";
import { createReviewToken } from "@/lib/review";
import { formatInTimeZone, zonedTimeToUtc } from "@/lib/time";
import type { ClaimEntry, ContentAsset } from "@/lib/types";

export const dynamic = "force-dynamic";

function currentVersion(db: Awaited<ReturnType<typeof loadDB>>, asset: ContentAsset) {
  return db.versions.find((v) => v.assetId === asset.id && v.version === asset.currentVersion);
}

async function saveVersion(assetId: string, formData: FormData) {
  "use server";
  const db = await loadDB();
  const asset = db.assets.find((a) => a.id === assetId);
  if (!asset) return;
  if (!["draft", "in_review", "rejected"].includes(asset.status)) redirect(`/studio/${assetId}?error=locked`);
  const body = String(formData.get("body") ?? "").trim();
  if (body.length < 40) redirect(`/studio/${assetId}?error=short`);
  const previous = currentVersion(db, asset);
  if (previous && previous.body === body) redirect(`/studio/${assetId}?message=unchanged`);
  const next = asset.currentVersion + 1;
  const t = nowIso();
  db.versions.push({
    id: uid("ver"),
    assetId: asset.id,
    workspaceId: asset.workspaceId,
    version: next,
    body,
    model: "human-edit",
    sourceIds: asset.knowledgeIds ?? [],
    promptTemplate: previous?.promptTemplate ?? "studio-manual",
    estCostUsd: 0,
    createdAt: t
  });
  asset.currentVersion = next;
  if (asset.status === "rejected") asset.status = "in_review";
  asset.updatedAt = t;
  await audit(db, "studio.version.saved", "content_asset", asset.id);
  await saveDB(db);
  revalidatePath(`/studio/${assetId}`);
  redirect(`/studio/${assetId}?message=saved`);
}

async function removeClaim(assetId: string, claimId: string) {
  "use server";
  const db = await loadDB();
  const asset = db.assets.find((a) => a.id === assetId);
  if (!asset || ["approved", "scheduled", "published"].includes(asset.status)) return;
  const claim = db.claims.find((c) => c.id === claimId);
  if (!claim) return;
  const version = currentVersion(db, asset);
  if (claim.versionId !== version?.id) return;
  claim.reviewStatus = "removed";
  await audit(db, "studio.claim.removed", "content_asset", asset.id);
  await saveDB(db);
  revalidatePath(`/studio/${assetId}`);
}

async function approveAsset(assetId: string) {
  "use server";
  const db = await loadDB();
  const asset = db.assets.find((a) => a.id === assetId);
  if (!asset) return;
  const version = currentVersion(db, asset);
  const check = canApproveAsset(asset, version, db.claims, db.knowledgeItems);
  if (!check.ok) redirect(`/studio/${assetId}?error=blocked`);
  if (!canAssetTransition(asset.status, "approved")) redirect(`/studio/${assetId}?error=state`);
  const t = nowIso();
  asset.status = "approved";
  asset.approvedAt = t;
  asset.updatedAt = t;
  await audit(db, "studio.asset.approved", "content_asset", asset.id);
  await saveDB(db);
  revalidatePath(`/studio/${assetId}`);
  redirect(`/studio/${assetId}?message=approved`);
}

async function rejectAsset(assetId: string) {
  "use server";
  const db = await loadDB();
  const asset = db.assets.find((a) => a.id === assetId);
  if (!asset || !canAssetTransition(asset.status, "rejected")) return;
  asset.status = "rejected";
  asset.updatedAt = nowIso();
  await audit(db, "studio.asset.rejected", "content_asset", asset.id);
  await saveDB(db);
  revalidatePath(`/studio/${assetId}`);
  redirect(`/studio/${assetId}?message=rejected`);
}

async function attachImage(assetId: string, formData: FormData) {
  "use server";
  const db = await loadDB();
  const asset = db.assets.find((a) => a.id === assetId);
  if (!asset || ["published"].includes(asset.status)) return;
  const imageId = String(formData.get("imageId") ?? "");
  const alt = String(formData.get("imageAlt") ?? "").trim().slice(0, 220);
  if (!imageId) {
    asset.imageId = undefined;
    asset.imageAlt = undefined;
    asset.updatedAt = nowIso();
    await saveDB(db);
    revalidatePath(`/studio/${assetId}`);
    return;
  }
  const image = db.images.find((i) => i.id === imageId && i.clientId === asset.clientId);
  if (!image) redirect(`/studio/${assetId}?error=image`);
  asset.imageId = image.id;
  asset.imageAlt = alt || image.title || image.prompt.slice(0, 140);
  asset.updatedAt = nowIso();
  await audit(db, "studio.image.attached", "content_asset", asset.id);
  await saveDB(db);
  revalidatePath(`/studio/${assetId}`);
  redirect(`/studio/${assetId}?message=image`);
}

async function scheduleAsset(assetId: string, formData: FormData) {
  "use server";
  const db = await loadDB();
  const asset = db.assets.find((a) => a.id === assetId);
  if (!asset) return;
  const client = db.clients.find((c) => c.id === asset.clientId);
  if (!client) return;
  if (asset.status !== "approved") redirect(`/studio/${assetId}?error=not-approved`);
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "09:00");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) redirect(`/studio/${assetId}?error=schedule`);
  const account = db.accounts.find((a) => a.clientId === client.id && a.channel === asset.platform && a.status === "connected");
  if (!account) redirect(`/studio/${assetId}?error=account`);
  const version = currentVersion(db, asset);
  const when = zonedTimeToUtc(`${date}T${time}`, client.timezone);
  if (when.getTime() < Date.now() - 60_000) redirect(`/studio/${assetId}?error=past`);
  const image = asset.imageId ? db.images.find((i) => i.id === asset.imageId) : undefined;
  const postId = uid("post");
  const t = nowIso();
  db.posts.push({
    id: postId,
    workspaceId: asset.workspaceId,
    clientId: client.id,
    channel: asset.platform,
    body: version?.body ?? "",
    imageUrl: image?.url ?? null,
    status: "scheduled",
    scheduledAt: when.toISOString(),
    timezone: client.timezone,
    externalId: null,
    failureReason: null,
    assetId: asset.id,
    planItemId: asset.planItemId ?? null,
    approvedBy: "founder",
    attempts: 0,
    lastAttemptAt: null,
    publishedAt: null,
    createdAt: t,
    updatedAt: t
  });
  asset.status = "scheduled";
  asset.scheduledAt = when.toISOString();
  asset.updatedAt = t;
  if (asset.planItemId) {
    const item = db.planItems.find((p) => p.id === asset.planItemId);
    if (item) {
      item.status = "scheduled";
      item.publishDate = date;
      item.updatedAt = t;
    }
  }
  await audit(db, "studio.asset.scheduled", "content_asset", asset.id);
  await saveDB(db);
  revalidatePath(`/studio/${assetId}`);
  redirect(`/calendar?client=${client.id}&message=scheduled`);
}

async function makeReviewLink(assetId: string) {
  "use server";
  const token = createReviewToken(assetId);
  redirect(`/studio/${assetId}?review=${encodeURIComponent(token)}`);
}

async function archiveAsset(assetId: string) {
  "use server";
  const db = await loadDB();
  const asset = db.assets.find((a) => a.id === assetId);
  if (!asset || !canAssetTransition(asset.status, "archived")) return;
  asset.status = "archived";
  asset.updatedAt = nowIso();
  await audit(db, "studio.asset.archived", "content_asset", asset.id);
  await saveDB(db);
  revalidatePath("/studio");
  redirect("/studio?message=deleted");
}

const KIND_BADGE: Record<ClaimEntry["kind"], string> = {
  factual: "badge-success",
  opinion: "badge-accent",
  unsupported: "badge-danger"
};

export default async function StudioAssetPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { message?: string; error?: string; review?: string };
}) {
  const db = await loadDB();
  const asset = db.assets.find((a) => a.id === params.id);
  if (!asset) notFound();
  const client = db.clients.find((c) => c.id === asset.clientId);
  if (!client) notFound();
  const version = currentVersion(db, asset);
  const claims = db.claims.filter((c) => c.versionId === version?.id);
  const knowledge = db.knowledgeItems.filter((k) => k.clientId === client.id);
  const usedKnowledge = (asset.knowledgeIds ?? []).map((id) => knowledge.find((k) => k.id === id)).filter(Boolean);
  const check = canApproveAsset(asset, version, db.claims, db.knowledgeItems);
  const images = db.images.filter((i) => i.clientId === client.id);
  const attachedImage = asset.imageId ? images.find((i) => i.id === asset.imageId) : undefined;
  const account = db.accounts.find((a) => a.clientId === client.id && a.channel === asset.platform && a.status === "connected");
  const post = db.posts.find((p) => p.assetId === asset.id && p.status !== "cancelled");
  const planItem = asset.planItemId ? db.planItems.find((p) => p.id === asset.planItemId) : undefined;
  const formatSpec = STUDIO_FORMATS.find((f) => f.id === asset.format);
  const locked = ["approved", "scheduled", "published", "archived"].includes(asset.status);
  const h = headers();
  const host = h.get("host") ?? "localhost:3001";
  const proto = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const reviewUrl = searchParams.review ? `${proto}://${host}/review/${searchParams.review}` : null;
  const openUnsupported = claims.filter((c) => c.kind === "unsupported" && c.reviewStatus === "open").length;

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <a href={`/studio?client=${client.id}`} className="text-xs text-muted-foreground hover:text-foreground">← Studio</a>
              <span className="badge badge-muted">{formatLabel(asset.format)}</span>
              <span className={`badge ${badgeForAssetStatus(asset.status)}`}>{asset.status.replace("_", " ")}</span>
              <span className="badge badge-muted">{CHANNEL_LABELS[asset.platform]}</span>
              {openUnsupported > 0 && <span className="badge badge-danger">{openUnsupported} unsupported</span>}
            </div>
            <h1 className="h-display mt-2 max-w-3xl text-2xl md:text-3xl">{asset.title ?? "Untitled draft"}</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {client.name} · v{asset.currentVersion} · {version?.model ?? "mock"} · updated {new Date(asset.updatedAt ?? asset.createdAt).toLocaleString()}
              {planItem ? ` · planner: ${planItem.title}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`/clients/${client.id}`} className="btn btn-outline btn-sm">Sources</a>
            <form action={archiveAsset.bind(null, asset.id)}><button className="btn btn-ghost btn-sm" type="submit" disabled={asset.status === "archived"}>Archive</button></form>
          </div>
        </div>
      </div>

      {asset.clientFeedback && asset.status === "rejected" && (
        <p className="alert alert-danger"><span className="font-semibold">Client feedback:</span> {asset.clientFeedback}</p>
      )}
      {searchParams.error && (
        <p className="alert alert-danger">
          {searchParams.error === "blocked" && "Approval blocked by the claim ledger. Remove unsupported or uncited claims first."}
          {searchParams.error === "account" && `No connected ${CHANNEL_LABELS[asset.platform]} account for ${client.name}. Connect it in Integrations first.`}
          {searchParams.error === "not-approved" && "Approve the draft before scheduling it."}
          {searchParams.error === "past" && "Choose a future date and time."}
          {searchParams.error === "locked" && "This asset is past review. Archive it or create a new draft to change it."}
          {searchParams.error === "short" && "Keep the body above 40 characters."}
          {searchParams.error === "schedule" && "Pick a valid date and time."}
          {searchParams.error === "image" && "That image does not belong to this client."}
          {searchParams.error === "state" && "This asset cannot move to that state."}
        </p>
      )}
      {searchParams.message === "approved" && <p className="alert alert-warning">Approved. {formatSpec?.channel === "blog" || formatSpec?.channel === "newsletter" ? "Export or schedule when ready." : "Schedule it below."}</p>}
      {searchParams.message === "saved" && <p className="alert alert-warning">New version saved. Claims below refer to the current version.</p>}
      {searchParams.message === "rejected" && <p className="alert alert-warning">Marked rejected. Edit the body to create a new version in review.</p>}
      {searchParams.message === "unchanged" && <p className="alert alert-warning">No changes — version not created.</p>}
      {searchParams.message === "image" && <p className="alert alert-warning">Image attached. Alt text saved with it.</p>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="space-y-6">
          <section className="card">
            <div className="flex items-center justify-between">
              <h2 className="h-display text-xl">Draft</h2>
              <span className="text-xs text-muted-foreground">{version?.body.length ?? 0} chars · {formatSpec?.maxChars.toLocaleString()} max</span>
            </div>
            {locked ? (
              <pre className="mt-3 whitespace-pre-wrap break-words rounded-xl border border-border bg-muted/40 p-4 font-sans text-sm leading-relaxed">{version?.body}</pre>
            ) : (
              <form action={saveVersion.bind(null, asset.id)} className="mt-3 space-y-2">
                <label className="sr-only" htmlFor="body">Draft body</label>
                <textarea id="body" name="body" defaultValue={version?.body ?? ""} className="input min-h-[360px] font-sans leading-relaxed" required minLength={40} maxLength={12000} />
                <div className="flex flex-wrap items-center gap-2">
                  <button className="btn btn-accent" type="submit">Save as v{asset.currentVersion + 1}</button>
                  <span className="text-[11px] text-muted-foreground">Saving creates a version; it never auto-approves.</span>
                </div>
              </form>
            )}
          </section>

          <section className="card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="h-display text-xl">Claim ledger</h2>
              <div className="flex gap-1 text-[11px] text-muted-foreground"><span>{claims.length} claims</span><span>·</span><span>{claims.filter((c) => c.kind === "factual").length} cited</span><span>·</span><span>{openUnsupported} open</span></div>
            </div>
            <div className="mt-3 space-y-2">
              {claims.map((claim) => {
                const removed = claim.reviewStatus === "removed";
                return (
                  <div key={claim.id} className={`rounded-lg border border-border p-3 ${removed ? "opacity-50" : ""}`}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`badge ${KIND_BADGE[claim.kind]}`}>{claim.kind}</span>
                      {removed && <span className="badge badge-muted">removed</span>}
                      <span className="text-[11px] text-muted-foreground">{claim.sourceIds.length} source{claim.sourceIds.length === 1 ? "" : "s"}</span>
                    </div>
                    <p className={`mt-1 text-sm ${removed ? "line-through" : ""}`}>{claim.claim}</p>
                    {claim.reviewNote && <p className="mt-1 text-xs text-muted-foreground">{claim.reviewNote}</p>}
                    {claim.sourceIds.length > 0 && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {claim.sourceIds.map((id) => {
                          const k = knowledge.find((x) => x.id === id);
                          return k ? <span key={id} className="mr-2">✓ {k.title} · {KNOWLEDGE_KIND_LABELS[k.kind]}</span> : null;
                        })}
                      </p>
                    )}
                    {!locked && !removed && (
                      <form action={removeClaim.bind(null, asset.id, claim.id)} className="mt-2">
                        <button className="btn btn-outline btn-sm !px-2 !py-0.5 text-[11px]" type="submit">Remove claim</button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">Removing a claim only removes it from the ledger — edit the body so the sentence is gone too.</p>
          </section>

          <section className="card">
            <h2 className="h-display text-xl">Version history</h2>
            <div className="mt-3 divide-y divide-border">
              {db.versions.filter((v) => v.assetId === asset.id).sort((a, b) => b.version - a.version).map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-3 py-2 text-xs">
                  <span><span className="font-semibold">v{v.version}</span> · {v.model} · {new Date(v.createdAt).toLocaleString()}</span>
                  <span className="text-muted-foreground">{v.body.length} chars</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <section className="card">
            <p className="eyebrow">Approval gate</p>
            <h2 className="h-display mt-1 text-lg">{asset.status === "approved" ? "Approved" : asset.status === "scheduled" ? "Scheduled" : check.ok ? "Ready to approve" : "Blocked"}</h2>
            {check.ok ? (
              <p className="prose-muted mt-1 text-xs">Every factual claim cites approved knowledge, and no unsupported claims are open.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {check.blockers.map((b) => <li key={b.code}>• {b.message}</li>)}
              </ul>
            )}
            {!locked && (
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={approveAsset.bind(null, asset.id)}><button className="btn btn-accent btn-sm" type="submit" disabled={!check.ok}>Approve draft</button></form>
                <form action={rejectAsset.bind(null, asset.id)}><button className="btn btn-outline btn-sm" type="submit">Reject</button></form>
              </div>
            )}
            {locked && asset.status !== "scheduled" && (
              <form action={makeReviewLink.bind(null, asset.id)} className="mt-3">
                <button className="btn btn-outline btn-sm" type="submit">Create client review link</button>
              </form>
            )}
            {reviewUrl && (
              <div className="mt-2 rounded-lg border border-accent/30 bg-accent/5 p-2 text-xs">
                <p className="font-semibold">Share this with the client (7 days):</p>
                <a className="mt-1 block break-all text-accent underline" href={reviewUrl}>{reviewUrl}</a>
              </div>
            )}
          </section>

          <section className="card">
            <p className="eyebrow">Scheduling</p>
            {post && post.status !== "cancelled" ? (
              <div className="mt-1 text-sm">
                <p><span className={`badge ${post.status === "published" ? "badge-success" : post.status === "failed" ? "badge-danger" : "badge-warning"}`}>{post.status}</span></p>
                <p className="mt-2">{formatInTimeZone(post.scheduledAt, post.timezone, { dateStyle: "full" })}</p>
                <p className="text-xs text-muted-foreground">{formatInTimeZone(post.scheduledAt, post.timezone)} · {post.timezone}</p>
                {post.failureReason && <p className="mt-1 text-xs text-destructive">{post.failureReason}</p>}
                <a className="btn btn-outline btn-sm mt-2" href={`/calendar?client=${client.id}`}>Open calendar →</a>
              </div>
            ) : asset.status === "approved" ? (
              account ? (
                <form action={scheduleAsset.bind(null, asset.id)} className="mt-2 space-y-2">
                  <p className="text-xs text-muted-foreground">Sends as {account.handle} in {client.timezone}. Approval is already recorded.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="label" htmlFor="sch-date">Date</label><input id="sch-date" name="date" type="date" className="input" required defaultValue={planItem?.publishDate ?? new Date().toISOString().slice(0, 10)} /></div>
                    <div><label className="label" htmlFor="sch-time">Time</label><input id="sch-time" name="time" type="time" className="input" required defaultValue="09:00" /></div>
                  </div>
                  <button className="btn btn-accent w-full" type="submit">Schedule post</button>
                </form>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">Approved. Connect a {CHANNEL_LABELS[asset.platform]} account in <a className="text-accent underline" href={`/integrations?client=${client.id}`}>Integrations</a> to schedule.</p>
              )
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">Approve the draft first. Scheduling never bypasses the claim ledger.</p>
            )}
          </section>

          <section className="card">
            <p className="eyebrow">Image</p>
            {attachedImage ? (
              <div className="mt-2">
                <img src={`/api/images/${attachedImage.id}/file`} alt={asset.imageAlt ?? attachedImage.title ?? attachedImage.prompt} className="w-full rounded-lg border border-border" />
                <p className="mt-1 text-[11px] text-muted-foreground">Alt: {asset.imageAlt}</p>
              </div>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">No image attached. Approval does not require one; scheduling requires alt text if present.</p>
            )}
            {!locked && (
              <form action={attachImage.bind(null, asset.id)} className="mt-2 space-y-2">
                <select name="imageId" className="input" defaultValue={asset.imageId ?? ""} aria-label="Image">
                  <option value="">No image</option>
                  {images.map((i) => <option key={i.id} value={i.id}>{i.title ?? i.prompt}</option>)}
                </select>
                <input name="imageAlt" className="input" defaultValue={asset.imageAlt ?? ""} maxLength={220} placeholder="Alt text (required when attached)" aria-label="Alt text" />
                <div className="flex gap-2">
                  <button className="btn btn-outline btn-sm" type="submit">Attach</button>
                  <a className="btn btn-ghost btn-sm" href={`/images?client=${client.id}`}>New image</a>
                </div>
              </form>
            )}
          </section>

          <section className="card">
            <p className="eyebrow">Sources used</p>
            <ul className="mt-1 space-y-1 text-xs">
              {usedKnowledge.length === 0 && <li className="text-muted-foreground">None recorded.</li>}
              {usedKnowledge.map((k) => k && (
                <li key={k.id}><span className="font-medium">{k.title}</span> <span className="text-muted-foreground">· {KNOWLEDGE_KIND_LABELS[k.kind]}</span></li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
