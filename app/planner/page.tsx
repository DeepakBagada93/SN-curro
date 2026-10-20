import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { loadDB, saveDB, audit, uid, nowIso } from "@/lib/store";
import { CHANNEL_LABELS, PLAN_ITEM_STATUSES, PLAN_STATUS_BADGE, knowledgeStats } from "@/lib/clients";
import { monthKey, monthLabel, shiftMonth } from "@/lib/agency";
import { buildCalendarDrafts } from "@/lib/planner";
import { EmptyState } from "@/components/ui";
import type { PlanItemStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

function monthValid(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}$/.test(value));
}

function dayLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}

async function ensurePlan(db: Awaited<ReturnType<typeof loadDB>>, clientId: string, month: string) {
  const existing = db.plans.find((p) => p.clientId === clientId && p.month === month);
  if (existing) return existing;
  const client = db.clients.find((c) => c.id === clientId);
  const t = nowIso();
  const plan = {
    id: uid("plan"),
    workspaceId: client?.workspaceId ?? "ws_curro_beta",
    clientId,
    month,
    title: `${monthLabel(month)} content plan`,
    objective: client?.summary ?? "",
    status: "active" as const,
    createdAt: t,
    updatedAt: t
  };
  db.plans.push(plan);
  return plan;
}

async function generateCalendar(clientId: string, month: string) {
  "use server";
  const db = await loadDB();
  const client = db.clients.find((c) => c.id === clientId);
  if (!client) redirect("/planner?error=client");
  const knowledge = db.knowledgeItems.filter((k) => k.clientId === clientId && k.status === "approved");
  if (knowledge.length === 0) redirect(`/planner?client=${clientId}&month=${month}&error=knowledge`);
  const plan = await ensurePlan(db, clientId, month);
  const existing = db.planItems.filter((p) => p.planId === plan.id);
  if (existing.length > 0) redirect(`/planner?client=${clientId}&month=${month}&message=exists`);
  const drafts = buildCalendarDrafts(client, knowledge, month);
  const t = nowIso();
  for (const draft of drafts) {
    db.planItems.push({ id: uid("pi"), workspaceId: client.workspaceId, clientId, planId: plan.id, ...draft, createdAt: t, updatedAt: t });
  }
  await audit(db, "plan.generated", "content_plan", plan.id);
  await saveDB(db);
  revalidatePath("/planner");
  redirect(`/planner?client=${clientId}&month=${month}&message=generated`);
}

async function createPlanItem(clientId: string, month: string, formData: FormData) {
  "use server";
  const { PlanItemCreateSchema } = await import("@/lib/clients");
  const parsed = PlanItemCreateSchema.safeParse({
    title: formData.get("title"),
    channel: formData.get("channel"),
    pillar: formData.get("pillar"),
    publishDate: formData.get("publishDate"),
    owner: formData.get("owner"),
    status: formData.get("status"),
    notes: formData.get("notes")
  });
  if (!parsed.success) redirect(`/planner?client=${clientId}&month=${month}&error=item`);
  const db = await loadDB();
  const client = db.clients.find((c) => c.id === clientId);
  if (!client) redirect("/planner?error=client");
  const plan = await ensurePlan(db, clientId, month);
  const t = nowIso();
  db.planItems.push({ id: uid("pi"), workspaceId: client.workspaceId, clientId, planId: plan.id, ...parsed.data, createdAt: t, updatedAt: t });
  await audit(db, "plan_item.created", "plan_item", "planner");
  await saveDB(db);
  revalidatePath("/planner");
}

async function savePlanItem(clientId: string, itemId: string, formData: FormData) {
  "use server";
  const db = await loadDB();
  const item = db.planItems.find((p) => p.id === itemId && p.clientId === clientId);
  if (!item) return;
  const date = String(formData.get("publishDate") ?? "");
  const status = String(formData.get("status") ?? "");
  const owner = String(formData.get("owner") ?? "").slice(0, 80);
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) item.publishDate = date;
  if ((PLAN_ITEM_STATUSES as readonly string[]).includes(status)) item.status = status as PlanItemStatus;
  item.owner = owner || "Unassigned";
  item.updatedAt = nowIso();
  await audit(db, "plan_item.updated", "plan_item", itemId);
  await saveDB(db);
  revalidatePath("/planner");
}

async function deletePlanItem(clientId: string, itemId: string) {
  "use server";
  const db = await loadDB();
  const item = db.planItems.find((p) => p.id === itemId && p.clientId === clientId);
  if (!item) return;
  db.planItems = db.planItems.filter((p) => p.id !== itemId);
  await audit(db, "plan_item.deleted", "plan_item", itemId);
  await saveDB(db);
  revalidatePath("/planner");
}

export default async function PlannerPage({
  searchParams
}: {
  searchParams: { client?: string; month?: string; error?: string; message?: string };
}) {
  const db = await loadDB();
  if (db.clients.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon="▥"
          title="Add a client before planning."
          body="The planner reads approved knowledge from one client. Create the client and its Knowledge Brain first."
          action={<a href="/clients" className="btn btn-accent">Go to clients</a>}
        />
      </div>
    );
  }

  const client = db.clients.find((c) => c.id === searchParams.client) ?? db.clients[0];
  const activePlan = db.plans.find((p) => p.clientId === client.id && p.status === "active");
  const month = monthValid(searchParams.month) ? searchParams.month : activePlan?.month ?? monthKey();
  const plan = db.plans.find((p) => p.clientId === client.id && p.month === month);
  const items = db.planItems
    .filter((p) => p.clientId === client.id && (!plan || p.planId === plan.id))
    .sort((a, b) => a.publishDate.localeCompare(b.publishDate));
  const knowledge = db.knowledgeItems.filter((k) => k.clientId === client.id);
  const ks = knowledgeStats(knowledge);
  const scheduled = items.filter((i) => i.status === "scheduled").length;
  const published = items.filter((i) => i.status === "published").length;

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Content planner</p>
            <h1 className="h-display mt-1 text-3xl md:text-4xl">{monthLabel(month)} · {client.name}</h1>
            <p className="prose-muted mt-1 max-w-2xl text-sm">{plan?.objective || client.summary || "Turn approved knowledge into a monthly calendar."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`/clients/${client.id}`} className="btn btn-outline btn-sm">Knowledge Brain</a>
            <a href={`/calendar?client=${client.id}&month=${month}`} className="btn btn-sm">Calendar →</a>
          </div>
        </div>

        <form method="get" className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
          <select name="client" defaultValue={client.id} className="input" aria-label="Client">
            {db.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="month" name="month" defaultValue={month} className="input sm:!w-44" aria-label="Month" />
          <button className="btn btn-outline" type="submit">View</button>
          <div className="flex items-center gap-1">
            <a className="btn btn-outline btn-sm" href={`/planner?client=${client.id}&month=${shiftMonth(month, -1)}`} aria-label="Previous month">←</a>
            <a className="btn btn-outline btn-sm" href={`/planner?client=${client.id}&month=${shiftMonth(month, 1)}`} aria-label="Next month">→</a>
          </div>
        </form>

        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-muted/60 p-3"><dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Planned</dt><dd className="font-display text-2xl font-semibold">{items.length}</dd></div>
          <div className="rounded-xl bg-muted/60 p-3"><dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Approved knowledge</dt><dd className="font-display text-2xl font-semibold">{ks.approved}</dd></div>
          <div className="rounded-xl bg-muted/60 p-3"><dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Scheduled</dt><dd className="font-display text-2xl font-semibold">{scheduled}</dd></div>
          <div className="rounded-xl bg-muted/60 p-3"><dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Published</dt><dd className="font-display text-2xl font-semibold">{published}</dd></div>
        </dl>
      </div>

      {searchParams.error && (
        <p className="alert alert-danger">
          {searchParams.error === "knowledge"
            ? "Add and approve at least one knowledge item before generating a calendar."
            : searchParams.error === "client"
              ? "Select a valid client."
              : "Plan item not saved — add a title, channel and valid date."}
        </p>
      )}
      {searchParams.message === "generated" && <p className="alert alert-warning">30-day skeleton generated from approved knowledge. Edit owners and dates, then open items in the studio.</p>}
      {searchParams.message === "exists" && <p className="alert alert-warning">This month already has items — edit them below instead of regenerating.</p>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="h-display text-2xl">Calendar</h2>
            {plan && <span className="badge badge-accent">{plan.status} · {plan.month}</span>}
          </div>

          {items.length === 0 ? (
            <div className="card">
              <div className="empty !py-10">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-2xl" aria-hidden>▥</div>
                <h3 className="h-display mt-4 text-lg">No plan for {monthLabel(month)}.</h3>
                <p className="prose-muted mt-1 max-w-md text-sm">Generate a 30-day skeleton from {ks.approved} approved knowledge items, or add one item manually.</p>
                <form action={generateCalendar.bind(null, client.id, month)} className="mt-4">
                  <button className="btn btn-accent" type="submit">Generate 30-day calendar</button>
                </form>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="badge badge-muted">{CHANNEL_LABELS[item.channel]}</span>
                        <span className={`badge ${PLAN_STATUS_BADGE[item.status]}`}>{item.status.replace("_", " ")}</span>
                        <span className="text-[11px] text-muted-foreground">{dayLabel(item.publishDate)} · {item.pillar}</span>
                      </div>
                      <p className="mt-1 font-semibold leading-snug">{item.title}</p>
                      {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <a href={`/studio?client=${client.id}&planItem=${item.id}`} className="btn btn-sm !px-2.5 !py-1 text-xs">Open in studio →</a>
                      <form action={deletePlanItem.bind(null, client.id, item.id)}><button className="btn btn-ghost btn-sm !px-2 !py-1 text-xs" type="submit" aria-label={`Delete ${item.title}`}>✕</button></form>
                    </div>
                  </div>
                  <form action={savePlanItem.bind(null, client.id, item.id)} className="mt-2 grid gap-2 border-t border-border pt-2 sm:grid-cols-[auto_auto_1fr_auto]">
                    <input type="date" name="publishDate" defaultValue={item.publishDate} className="input !w-auto !py-1 text-xs" aria-label="Publish date" />
                    <select name="status" defaultValue={item.status} className="input !w-auto !py-1 text-xs" aria-label="Status">
                      {PLAN_ITEM_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                    </select>
                    <input name="owner" defaultValue={item.owner} className="input !py-1 text-xs" aria-label="Owner" maxLength={80} />
                    <button className="btn btn-outline btn-sm !px-2.5 !py-1 text-xs" type="submit">Save</button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <div className="card">
            <p className="eyebrow">Add item</p>
            <h2 className="h-display mt-1 text-xl">Plan manually</h2>
            <form action={createPlanItem.bind(null, client.id, month)} className="mt-3 space-y-3">
              <div><label className="label" htmlFor="pt-title">Title</label><input id="pt-title" name="title" className="input" required minLength={3} maxLength={200} placeholder="Part-time MBA timeline" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label" htmlFor="pt-channel">Channel</label>
                  <select id="pt-channel" name="channel" className="input" defaultValue="linkedin">
                    {(["linkedin", "x", "blog", "newsletter", "instagram"] as const).map((ch) => <option key={ch} value={ch}>{CHANNEL_LABELS[ch]}</option>)}
                  </select>
                </div>
                <div><label className="label" htmlFor="pt-date">Date</label><input id="pt-date" name="publishDate" type="date" className="input" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="label" htmlFor="pt-pillar">Pillar</label><input id="pt-pillar" name="pillar" className="input" placeholder="Admissions" maxLength={80} /></div>
                <div><label className="label" htmlFor="pt-owner">Owner</label><input id="pt-owner" name="owner" className="input" placeholder="Maya" maxLength={80} /></div>
              </div>
              <div>
                <label className="label" htmlFor="pt-status">Status</label>
                <select id="pt-status" name="status" className="input" defaultValue="idea">
                  {PLAN_ITEM_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
              </div>
              <div><label className="label" htmlFor="pt-notes">Notes</label><textarea id="pt-notes" name="notes" className="input min-h-[60px]" placeholder="Which approved knowledge supports this?" maxLength={600} /></div>
              <button className="btn btn-accent w-full" type="submit">Add to plan</button>
            </form>
          </div>
          <div className="card text-sm">
            <h3 className="font-display text-base font-semibold">Generate rules</h3>
            <p className="prose-muted mt-1 text-xs">The 30-day skeleton uses only approved knowledge. It writes eight slots across LinkedIn, blog, X and newsletter — never thirty filler posts. You still edit every line in the studio.</p>
            <form action={generateCalendar.bind(null, client.id, month)} className="mt-3">
              <button className="btn btn-outline btn-sm w-full" type="submit" disabled={items.length > 0}>{items.length > 0 ? "Month already planned" : "Generate 30-day skeleton"}</button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
