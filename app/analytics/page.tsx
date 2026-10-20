import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { loadDB, saveDB, audit, uid, nowIso } from "@/lib/store";
import { PLAN_CATALOG, generationsUsed, imagesUsed } from "@/lib/agency";
import { EmptyState } from "@/components/ui";
import { DEFAULT_WORKSPACE_ID } from "@/lib/types";

export const dynamic = "force-dynamic";

function num(value: FormDataEntryValue | null): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

async function recordSnapshot(clientId: string, formData: FormData) {
  "use server";
  const db = await loadDB();
  const postId = String(formData.get("postId") ?? "");
  const post = db.posts.find((p) => p.id === postId && p.clientId === clientId);
  if (!post || post.status !== "published") redirect("/analytics?error=post");
  db.performance.push({
    id: uid("perf"),
    workspaceId: post.workspaceId,
    clientId,
    postId,
    impressions: num(formData.get("impressions")),
    likes: num(formData.get("likes")),
    comments: num(formData.get("comments")),
    clicks: num(formData.get("clicks")),
    source: "manual",
    capturedAt: nowIso()
  });
  await audit(db, "analytics.snapshot", "scheduled_post", postId);
  await saveDB(db);
  revalidatePath("/analytics");
  redirect(`/analytics?client=${clientId}&message=snapshot`);
}

export default async function AnalyticsPage({
  searchParams
}: {
  searchParams: { client?: string; message?: string; error?: string };
}) {
  const db = await loadDB();
  if (db.clients.length === 0) {
    return (
      <div className="card">
        <EmptyState icon="◫" title="Add a client first." body="Analytics compares approved output with the posts that actually went out." action={<a href="/clients" className="btn btn-accent">Go to clients</a>} />
      </div>
    );
  }
  const client = db.clients.find((c) => c.id === searchParams.client) ?? db.clients[0];
  const assets = db.assets.filter((a) => a.clientId === client.id);
  const posts = db.posts.filter((p) => p.clientId === client.id);
  const published = posts.filter((p) => p.status === "published");
  const scheduled = posts.filter((p) => p.status === "scheduled");
  const failed = posts.filter((p) => p.status === "failed");
  const claims = db.claims.filter((c) => {
    const versionIds = new Set(db.versions.filter((v) => v.assetId && assets.some((a) => a.id === v.assetId)).map((v) => v.id));
    return versionIds.has(c.versionId);
  });
  const unsupported = claims.filter((c) => c.kind === "unsupported");
  const snapped = db.performance.filter((p) => p.clientId === client.id);
  const totals = snapped.reduce((acc, p) => ({
    impressions: acc.impressions + p.impressions,
    likes: acc.likes + p.likes,
    comments: acc.comments + p.comments,
    clicks: acc.clicks + p.clicks
  }), { impressions: 0, likes: 0, comments: 0, clicks: 0 });
  const engagement = totals.impressions > 0 ? ((totals.likes + totals.comments) / totals.impressions) * 100 : 0;
  const usage = db.usage.filter((u) => u.workspaceId === DEFAULT_WORKSPACE_ID);
  const cost = usage.reduce((a, u) => a + u.estimatedCost, 0);
  const limit = PLAN_CATALOG[db.planTier];
  const byProvider = Array.from(usage.reduce((map, u) => {
    const row = map.get(u.provider) ?? { provider: u.provider, quantity: 0, cost: 0 };
    row.quantity += u.quantity;
    row.cost += u.estimatedCost;
    map.set(u.provider, row);
    return map;
  }, new Map<string, { provider: string; quantity: number; cost: number }>()).values()).sort((a, b) => b.cost - a.cost);

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Analytics</p>
            <h1 className="h-display mt-1 text-3xl md:text-4xl">Output, approvals, and measured results.</h1>
            <p className="prose-muted mt-1 max-w-2xl text-sm">No vanity dashboard. It shows what shipped, what the claim ledger caught, and the usage you are paying for.</p>
          </div>
          <a href={`/calendar?client=${client.id}`} className="btn btn-sm">Calendar →</a>
        </div>
        <form method="get" className="mt-4 flex flex-wrap gap-2">
          <select name="client" defaultValue={client.id} className="input sm:!w-72" aria-label="Client">
            {db.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn btn-outline" type="submit">View</button>
        </form>
      </div>

      {searchParams.message === "snapshot" && <p className="alert alert-warning">Performance snapshot recorded.</p>}
      {searchParams.error === "post" && <p className="alert alert-danger">Only published posts can receive a snapshot.</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card"><p className="eyebrow">Published</p><p className="font-display text-3xl font-semibold">{published.length}</p><p className="text-xs text-muted-foreground">{scheduled.length} scheduled · {failed.length} failed</p></div>
        <div className="card"><p className="eyebrow">Assets</p><p className="font-display text-3xl font-semibold">{assets.length}</p><p className="text-xs text-muted-foreground">approved {assets.filter((a) => a.status === "approved").length} · drafts {assets.filter((a) => a.status === "in_review" || a.status === "draft").length}</p></div>
        <div className="card"><p className="eyebrow">Unsupported claims</p><p className="font-display text-3xl font-semibold">{unsupported.length}</p><p className="text-xs text-muted-foreground">{unsupported.filter((c) => c.reviewStatus === "open").length} still open · {unsupported.length > 0 ? `${Math.round(((unsupported.length - unsupported.filter((c) => c.reviewStatus === "open").length) / unsupported.length) * 100)}% cleared` : "clean ledger"}</p></div>
        <div className="card"><p className="eyebrow">Engagement</p><p className="font-display text-3xl font-semibold">{engagement.toFixed(1)}%</p><p className="text-xs text-muted-foreground">{totals.impressions.toLocaleString()} impressions measured · {snapped.length} snapshots</p></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-3">
          <h2 className="h-display text-2xl">Measured posts</h2>
          {snapped.length === 0 ? (
            <div className="card"><EmptyState icon="◫" title="No measurements yet." body="After a post publishes, record impressions and engagement. Snapshots stay manual until a platform API is connected." /></div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/60 text-[10px] uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2">Captured</th><th className="px-3 py-2">Impr.</th><th className="px-3 py-2">Likes</th><th className="px-3 py-2">Comments</th><th className="px-3 py-2">Clicks</th><th className="px-3 py-2">Source</th></tr></thead>
                <tbody>
                  {snapped.slice().sort((a, b) => b.capturedAt.localeCompare(a.capturedAt)).map((p) => (
                    <tr key={p.id} className="border-t border-border">
                      <td className="px-3 py-2">{new Date(p.capturedAt).toLocaleDateString()}</td>
                      <td className="px-3 py-2">{p.impressions.toLocaleString()}</td>
                      <td className="px-3 py-2">{p.likes.toLocaleString()}</td>
                      <td className="px-3 py-2">{p.comments.toLocaleString()}</td>
                      <td className="px-3 py-2">{p.clicks.toLocaleString()}</td>
                      <td className="px-3 py-2"><span className="badge badge-muted">{p.source}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h2 className="h-display pt-2 text-2xl">Cost & usage</h2>
          <div className="card">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <p className="font-display text-2xl font-semibold">${cost.toFixed(4)} <span className="text-sm font-normal text-muted-foreground">estimated this cycle</span></p>
              <p className="text-xs text-muted-foreground">{generationsUsed(db.assets)}/{limit.generations} generations · {imagesUsed(db.images)}/{limit.images} images · {usage.length} usage events</p>
            </div>
            <div className="mt-3 space-y-1.5">
              {byProvider.length === 0 && <p className="text-xs text-muted-foreground">No usage recorded yet.</p>}
              {byProvider.map((row) => (
                <div key={row.provider} className="flex items-center justify-between border-t border-border pt-1.5 text-xs">
                  <span className="font-medium">{row.provider}</span>
                  <span className="text-muted-foreground">{row.quantity.toLocaleString()} units · ${row.cost.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="card">
            <p className="eyebrow">Record snapshot</p>
            <h2 className="h-display mt-1 text-lg">Published post</h2>
            {published.length === 0 ? (
              <p className="prose-muted mt-2 text-xs">Publish a scheduled post first. Snapshots require a published post.</p>
            ) : (
              <form action={recordSnapshot.bind(null, client.id)} className="mt-2 space-y-2">
                <div>
                  <label className="label" htmlFor="snap-post">Post</label>
                  <select id="snap-post" name="postId" className="input" required>
                    {published.map((p) => <option key={p.id} value={p.id}>{p.body.replace(/[#*]/g, "").slice(0, 60)} · {new Date(p.scheduledAt ?? p.createdAt).toLocaleDateString()}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="label" htmlFor="snap-impr">Impressions</label><input id="snap-impr" name="impressions" type="number" min={0} className="input" defaultValue={0} /></div>
                  <div><label className="label" htmlFor="snap-likes">Likes</label><input id="snap-likes" name="likes" type="number" min={0} className="input" defaultValue={0} /></div>
                  <div><label className="label" htmlFor="snap-comments">Comments</label><input id="snap-comments" name="comments" type="number" min={0} className="input" defaultValue={0} /></div>
                  <div><label className="label" htmlFor="snap-clicks">Clicks</label><input id="snap-clicks" name="clicks" type="number" min={0} className="input" defaultValue={0} /></div>
                </div>
                <button className="btn btn-accent w-full" type="submit">Save snapshot</button>
              </form>
            )}
          </section>
          <section className="card text-xs">
            <h3 className="font-display text-base font-semibold">Per-client output</h3>
            <div className="mt-2 divide-y divide-border">
              {db.clients.map((c) => {
                const cAssets = db.assets.filter((a) => a.clientId === c.id);
                const cPosts = db.posts.filter((p) => p.clientId === c.id && p.status === "published");
                return (
                  <a key={c.id} href={`/analytics?client=${c.id}`} className="flex items-center justify-between gap-2 py-2 hover:text-accent">
                    <span className="truncate">{c.name}</span>
                    <span className="shrink-0 text-muted-foreground">{cAssets.length} assets · {cPosts.length} published</span>
                  </a>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
