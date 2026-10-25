import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { loadDB, saveDB, audit, nowIso } from "@/lib/store";
import { cancelPost, processDuePosts, retryPost } from "@/lib/publishing";
import { monthKey, monthLabel, shiftMonth } from "@/lib/agency";
import { CHANNEL_LABELS } from "@/lib/clients";
import { formatInTimeZone } from "@/lib/time";
import { EmptyState } from "@/components/ui";
import { CopyButton } from "@/components/copy-button";

export const dynamic = "force-dynamic";

function monthValid(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}$/.test(value));
}

function dayKey(iso: string | null, timezone: string): string | null {
  if (!iso) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(iso));
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    return `${get("year")}-${get("month")}-${get("day")}`;
  } catch {
    return iso.slice(0, 10);
  }
}

async function runQueue(clientId: string, month: string) {
  "use server";
  const db = await loadDB();
  const result = await processDuePosts(db, { clientId });
  await saveDB(db);
  revalidatePath("/calendar");
  redirect(`/calendar?client=${clientId}&month=${month}&message=ran&published=${result.published}&failed=${result.failed}`);
}

async function publishNow(clientId: string, month: string, postId: string) {
  "use server";
  const db = await loadDB();
  const post = db.posts.find((p) => p.id === postId && p.clientId === clientId);
  if (!post || post.status !== "scheduled") return;
  post.scheduledAt = nowIso();
  post.updatedAt = nowIso();
  const result = await processDuePosts(db, { postId });
  await saveDB(db);
  revalidatePath("/calendar");
  redirect(`/calendar?client=${clientId}&month=${month}&message=ran&published=${result.published}&failed=${result.failed}`);
}

async function retry(clientId: string, month: string, postId: string) {
  "use server";
  const db = await loadDB();
  const post = db.posts.find((p) => p.id === postId && p.clientId === clientId);
  if (!post) return;
  await retryPost(db, postId);
  await saveDB(db);
  revalidatePath("/calendar");
  redirect(`/calendar?client=${clientId}&month=${month}&message=retried`);
}

async function cancel(clientId: string, month: string, postId: string) {
  "use server";
  const db = await loadDB();
  const post = db.posts.find((p) => p.id === postId && p.clientId === clientId);
  if (!post) return;
  post.status = "cancelled";
  post.updatedAt = nowIso();
  const asset = post.assetId ? db.assets.find((a) => a.id === post.assetId) : undefined;
  if (asset && asset.status === "scheduled") asset.status = "approved";
  const item = post.planItemId ? db.planItems.find((p) => p.id === post.planItemId) : undefined;
  if (item && item.status === "scheduled") item.status = "review";
  await audit(db, "post.cancelled", "scheduled_post", post.id);
  await saveDB(db);
  revalidatePath("/calendar");
  redirect(`/calendar?client=${clientId}&month=${month}&message=cancelled`);
}

const STATUS_BADGE: Record<string, string> = {
  scheduled: "badge-warning",
  publishing: "badge-accent",
  published: "badge-success",
  failed: "badge-danger",
  cancelled: "badge-muted",
  approved: "badge-accent"
};

export default async function CalendarPage({
  searchParams
}: {
  searchParams: { client?: string; month?: string; message?: string; published?: string; failed?: string };
}) {
  const db = await loadDB();
  if (db.clients.length === 0) {
    return (
      <div className="card">
        <EmptyState icon="▦" title="Add a client first." body="The calendar schedules approved assets per client and timezone." action={<a href="/clients" className="btn btn-accent">Go to clients</a>} />
      </div>
    );
  }
  const client = db.clients.find((c) => c.id === searchParams.client) ?? db.clients[0];
  const month = monthValid(searchParams.month) ? searchParams.month : monthKey();
  const posts = db.posts.filter((p) => p.clientId === client.id).sort((a, b) => (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? ""));
  const monthPosts = posts.filter((p) => dayKey(p.scheduledAt, client.timezone)?.startsWith(month));
  const items = db.planItems.filter((p) => p.clientId === client.id && p.publishDate.startsWith(month));
  const linkedItemIds = new Set(monthPosts.map((p) => p.planItemId).filter(Boolean));

  const [y, m] = month.split("-").map(Number);
  const firstWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: Array<{ day: number | null; key: string }> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ day: null, key: `blank-${i}` });
  for (let d = 1; d <= days; d++) cells.push({ day: d, key: `${month}-${String(d).padStart(2, "0")}` });

  const scheduled = monthPosts.filter((p) => p.status === "scheduled").length;
  const published = monthPosts.filter((p) => p.status === "published").length;
  const failed = monthPosts.filter((p) => p.status === "failed").length;

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Publishing calendar</p>
            <h1 className="h-display mt-1 text-3xl md:text-4xl">{monthLabel(month)} · {client.name}</h1>
            <p className="prose-muted mt-1 text-sm">Times in {client.timezone}. Publishing is approval-only — the queue never picks up unapproved drafts.</p>
          </div>
          <form action={runQueue.bind(null, client.id, month)}>
            <button className="btn btn-accent btn-sm" type="submit">Run due queue</button>
          </form>
        </div>
        <form method="get" className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
          <select name="client" defaultValue={client.id} className="input" aria-label="Client">
            {db.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="month" name="month" defaultValue={month} className="input sm:!w-44" aria-label="Month" />
          <button className="btn btn-outline" type="submit">View</button>
          <div className="flex gap-1">
            <a className="btn btn-outline btn-sm" href={`/calendar?client=${client.id}&month=${shiftMonth(month, -1)}`} aria-label="Previous month">←</a>
            <a className="btn btn-outline btn-sm" href={`/calendar?client=${client.id}&month=${shiftMonth(month, 1)}`} aria-label="Next month">→</a>
          </div>
        </form>
        <dl className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-muted/60 p-3"><dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Scheduled</dt><dd className="font-display text-2xl font-semibold">{scheduled}</dd></div>
          <div className="rounded-xl bg-muted/60 p-3"><dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Published</dt><dd className="font-display text-2xl font-semibold">{published}</dd></div>
          <div className="rounded-xl bg-muted/60 p-3"><dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Failed</dt><dd className="font-display text-2xl font-semibold">{failed}</dd></div>
          <div className="rounded-xl bg-muted/60 p-3"><dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Plan items</dt><dd className="font-display text-2xl font-semibold">{items.length}</dd></div>
        </dl>
      </div>

      {searchParams.message === "ran" && <p className="alert alert-warning">Queue checked. Published {searchParams.published ?? 0}, failed {searchParams.failed ?? 0}. Failures keep a reason and can be retried.</p>}
      {searchParams.message === "retried" && <p className="alert alert-warning">Post moved back to scheduled. Run the queue when the account is connected.</p>}
      {searchParams.message === "cancelled" && <p className="alert alert-warning">Schedule cancelled. The asset returned to approved and the planner item to review.</p>}
      {searchParams.message === "scheduled" && <p className="alert alert-warning">Post scheduled. It appears in this calendar.</p>}

      <section className="card overflow-x-auto">
        <div className="grid min-w-[760px] grid-cols-7 gap-1 text-[11px]">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="px-2 py-1 font-semibold uppercase tracking-wide text-muted-foreground">{d}</div>)}
          {cells.map((cell) => {
            const dayPosts = cell.day ? monthPosts.filter((p) => dayKey(p.scheduledAt, client.timezone) === cell.key) : [];
            const dayItems = cell.day ? items.filter((i) => i.publishDate === cell.key && !linkedItemIds.has(i.id)) : [];
            return (
              <div key={cell.key} className={`min-h-[104px] rounded-lg border p-1.5 ${cell.day ? "border-border bg-background/40" : "border-transparent"}`}>
                {cell.day && (
                  <>
                    <p className="mb-1 px-1 text-[10px] font-semibold text-muted-foreground">{cell.day}</p>
                    <div className="space-y-1">
                      {dayPosts.map((post) => (
                        <a key={post.id} href={post.assetId ? `/studio/${post.assetId}` : `/calendar?client=${client.id}&month=${month}`} className={`block rounded border px-1.5 py-1 ${post.status === "failed" ? "border-destructive/40 bg-destructive/5" : post.status === "published" ? "border-success/40 bg-success/5" : "border-warning/40 bg-warning/5"}`}>
                          <span className="block text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{CHANNEL_LABELS[post.channel]} · {post.status}</span>
                          <span className="line-clamp-2 text-[10px] leading-tight">{post.body.replace(/[#*]/g, "").slice(0, 70)}</span>
                        </a>
                      ))}
                      {dayItems.map((item) => (
                        <a key={item.id} href={`/studio?client=${client.id}&planItem=${item.id}`} className="block rounded border border-dashed border-border px-1.5 py-1">
                          <span className="block text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{CHANNEL_LABELS[item.channel]} · planned</span>
                          <span className="line-clamp-2 text-[10px] leading-tight">{item.title}</span>
                        </a>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="h-display text-xl">Queue</h2>
          <a className="btn btn-outline btn-sm" href={`/integrations?client=${client.id}`}>Manage channels</a>
        </div>
        {posts.length === 0 ? (
          <p className="prose-muted mt-2 text-sm">No scheduled posts yet. Approve a draft in the <a className="text-accent underline" href={`/studio?client=${client.id}`}>studio</a> and schedule it.</p>
        ) : (
          <div className="mt-3 divide-y divide-border">
            {posts.map((post) => (
              <div key={post.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`badge ${STATUS_BADGE[post.status] ?? "badge-muted"}`}>{post.status}</span>
                    <span className="text-[11px] text-muted-foreground">{CHANNEL_LABELS[post.channel]} · {post.scheduledAt ? formatInTimeZone(post.scheduledAt, post.timezone) : "unscheduled"}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 max-w-xl text-xs">{post.body.replace(/[#*]/g, "").slice(0, 140)}</p>
                  {post.failureReason && <p className="text-[11px] text-destructive">{post.failureReason}</p>}
                </div>
                <div className="flex items-center gap-1.5">
                  <CopyButton text={post.body} label="Copy" />
                  {post.assetId && <a href={`/studio/${post.assetId}`} className="btn btn-ghost btn-sm !px-2 !py-1 text-xs">Open</a>}
                  {post.status === "scheduled" && (
                    <>
                      <form action={publishNow.bind(null, client.id, month, post.id)}><button className="btn btn-outline btn-sm !px-2 !py-1 text-xs" type="submit">Publish now</button></form>
                      <form action={cancel.bind(null, client.id, month, post.id)}><button className="btn btn-ghost btn-sm !px-2 !py-1 text-xs" type="submit">Cancel</button></form>
                    </>
                  )}
                  {post.status === "failed" && (
                    <form action={retry.bind(null, client.id, month, post.id)}><button className="btn btn-outline btn-sm !px-2 !py-1 text-xs" type="submit">Retry</button></form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
