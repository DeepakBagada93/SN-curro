import { notFound, redirect } from "next/navigation";
import { loadDB, saveDB, audit, nowIso } from "@/lib/store";
import { verifyReviewToken } from "@/lib/review";
import { canApproveAsset } from "@/lib/agency";
import { KNOWLEDGE_KIND_LABELS } from "@/lib/clients";

export const dynamic = "force-dynamic";

async function approveFromReview(token: string) {
  "use server";
  const data = verifyReviewToken(token);
  if (!data) redirect(`/review/${token}?error=expired`);
  const db = await loadDB();
  const asset = db.assets.find((a) => a.id === data.assetId);
  if (!asset) redirect(`/review/${token}?error=missing`);
  if (asset.status === "approved" || asset.status === "scheduled" || asset.status === "published") {
    redirect(`/review/${token}?message=already`);
  }
  const version = db.versions.find((v) => v.assetId === asset.id && v.version === asset.currentVersion);
  const check = canApproveAsset(asset, version, db.claims, db.knowledgeItems);
  if (!check.ok) redirect(`/review/${token}?error=blocked`);
  const t = nowIso();
  asset.status = "approved";
  asset.approvedBy = "client";
  asset.approvedAt = t;
  asset.clientApprovedAt = t;
  asset.updatedAt = t;
  await audit(db, "review.client_approved", "content_asset", asset.id, "client");
  await saveDB(db);
  redirect(`/review/${token}?message=approved`);
}

async function requestChanges(token: string, formData: FormData) {
  "use server";
  const data = verifyReviewToken(token);
  if (!data) redirect(`/review/${token}?error=expired`);
  const db = await loadDB();
  const asset = db.assets.find((a) => a.id === data.assetId);
  if (!asset) redirect(`/review/${token}?error=missing`);
  const feedback = String(formData.get("feedback") ?? "").trim().slice(0, 2000);
  if (feedback.length < 5) redirect(`/review/${token}?error=feedback`);
  asset.clientFeedback = feedback;
  if (!["published", "scheduled"].includes(asset.status)) asset.status = "rejected";
  asset.updatedAt = nowIso();
  await audit(db, "review.changes_requested", "content_asset", asset.id, "client");
  await saveDB(db);
  redirect(`/review/${token}?message=changes`);
}

export default async function ReviewPage({
  params,
  searchParams
}: {
  params: { token: string };
  searchParams: { message?: string; error?: string };
}) {
  const data = verifyReviewToken(params.token);
  if (!data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        <div className="card text-center">
          <p className="text-4xl" aria-hidden>⏳</p>
          <h1 className="h-display mt-3 text-2xl">This review link expired.</h1>
          <p className="prose-muted mt-2 text-sm">Ask the agency for a fresh link. Links last seven days.</p>
        </div>
      </div>
    );
  }
  const db = await loadDB();
  const asset = db.assets.find((a) => a.id === data.assetId);
  if (!asset) notFound();
  const client = db.clients.find((c) => c.id === asset.clientId);
  const version = db.versions.find((v) => v.assetId === asset.id && v.version === asset.currentVersion);
  const claims = db.claims.filter((c) => c.versionId === version?.id && c.reviewStatus !== "removed");
  const knowledge = db.knowledgeItems.filter((k) => k.clientId === asset.clientId);
  const image = asset.imageId ? db.images.find((i) => i.id === asset.imageId) : undefined;
  const check = canApproveAsset(asset, version, db.claims, db.knowledgeItems);
  const already = ["approved", "scheduled", "published"].includes(asset.status);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="eyebrow">{client?.name ?? "Client"} · review</p>
          <p className="mt-1 text-xs text-muted-foreground">Prepared by Curro · {version ? `version ${version.version}` : "draft"}</p>
        </div>
        <span className={`badge ${already ? "badge-success" : "badge-warning"}`}>{asset.status.replace("_", " ")}</span>
      </header>

      {params.token && searchParams.message === "approved" && <p className="alert alert-warning mt-4">Approved — thank you. The agency can now schedule or export it.</p>}
      {searchParams.message === "changes" && <p className="alert alert-warning mt-4">Feedback sent. The agency will revise the draft and send a new link.</p>}
      {searchParams.message === "already" && <p className="alert alert-warning mt-4">This draft is already approved or scheduled.</p>}
      {searchParams.error === "blocked" && <p className="alert alert-danger mt-4">This draft still has unresolved claims, so it cannot be approved yet.</p>}
      {searchParams.error === "feedback" && <p className="alert alert-danger mt-4">Add a short note so the agency knows what to change.</p>}
      {(searchParams.error === "expired" || searchParams.error === "missing") && <p className="alert alert-danger mt-4">That link is no longer valid.</p>}

      <article className="card mt-5">
        <h1 className="h-display text-3xl">{asset.title ?? "Draft for review"}</h1>
        {asset.clientFeedback && <p className="alert alert-danger mt-3 text-xs">Your latest feedback: {asset.clientFeedback}</p>}
        {image && (
          <figure className="mt-4">
            <img src={`/api/images/${image.id}/file`} alt={asset.imageAlt ?? image.title ?? image.prompt} className="w-full rounded-xl border border-border" />
            {asset.imageAlt && <figcaption className="mt-1 text-xs text-muted-foreground">{asset.imageAlt}</figcaption>}
          </figure>
        )}
        <pre className="mt-4 whitespace-pre-wrap break-words font-sans text-[15px] leading-relaxed">{version?.body}</pre>
      </article>

      <section className="card mt-4">
        <h2 className="h-display text-xl">Claims and sources</h2>
        <p className="prose-muted mt-1 text-xs">Every factual line should trace to an approved source. Unsupported lines are removed before approval.</p>
        <div className="mt-3 space-y-2">
          {claims.map((claim) => (
            <div key={claim.id} className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-1.5">
                <span className={`badge ${claim.kind === "factual" ? "badge-success" : claim.kind === "opinion" ? "badge-accent" : "badge-danger"}`}>{claim.kind}</span>
                {claim.sourceIds.map((id) => {
                  const k = knowledge.find((x) => x.id === id);
                  return k ? <span key={id} className="badge badge-muted">{k.title} · {KNOWLEDGE_KIND_LABELS[k.kind]}</span> : null;
                })}
              </div>
              <p className="mt-1 text-sm">{claim.claim}</p>
            </div>
          ))}
        </div>
      </section>

      {!already && (
        <section className="card mt-4">
          <h2 className="h-display text-xl">Your decision</h2>
          {!check.ok && (
            <div className="alert alert-warning mt-2 text-xs">
              <p className="font-semibold">Cannot approve yet:</p>
              <ul>{check.blockers.map((b) => <li key={b.code}>• {b.message}</li>)}</ul>
            </div>
          )}
          <form action={approveFromReview.bind(null, params.token)} className="mt-3">
            <button className="btn btn-accent w-full" type="submit" disabled={!check.ok}>Approve this draft</button>
          </form>
          <form action={requestChanges.bind(null, params.token)} className="mt-4 space-y-2 border-t border-border pt-4">
            <label className="label" htmlFor="feedback">Or request changes</label>
            <textarea id="feedback" name="feedback" className="input min-h-[90px]" required minLength={5} maxLength={2000} placeholder="What should be sharper, shorter, or better supported?" />
            <button className="btn btn-outline" type="submit">Send feedback</button>
          </form>
        </section>
      )}
      <p className="mt-6 text-center text-[11px] text-muted-foreground">This link expires seven days after creation. It never grants access to the workspace.</p>
    </div>
  );
}
