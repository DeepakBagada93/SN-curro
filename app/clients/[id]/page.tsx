import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { loadDB } from "@/lib/store";
import { CrawlForm } from "@/components/crawl-form";
import {
  CHANNELS,
  CHANNEL_LABELS,
  KNOWLEDGE_KINDS,
  KNOWLEDGE_KIND_ICONS,
  KNOWLEDGE_KIND_LABELS,
  PLAN_ITEM_STATUSES,
  PLAN_STATUS_BADGE,
  TIMEZONES,
  initials,
  knowledgeStats
} from "@/lib/clients";
import type { KnowledgeKind, KnowledgeStatus, PlanItemStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<KnowledgeStatus, string> = {
  approved: "badge-success",
  candidate: "badge-warning",
  archived: "badge-muted"
};

function formatDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", timeZone: "UTC"
  });
}

async function addKnowledge(clientId: string, formData: FormData) {
  "use server";
  const { loadDB: l, saveDB, audit, uid, nowIso } = await import("@/lib/store");
  const { KnowledgeCreateSchema, parseTags: tags } = await import("@/lib/clients");
  const parsed = KnowledgeCreateSchema.safeParse({
    kind: formData.get("kind"),
    title: formData.get("title"),
    body: formData.get("body"),
    sourceUrl: formData.get("sourceUrl"),
    tags: tags(formData.get("tags")),
    provenance: formData.get("provenance"),
    status: formData.get("status")
  });
  if (!parsed.success) redirect(`/clients/${clientId}?error=knowledge`);
  const db = await l();
  const client = db.clients.find((c) => c.id === clientId);
  if (!client) return;
  const t = nowIso();
  const item = {
    id: uid("kn"),
    workspaceId: client.workspaceId,
    clientId: client.id,
    kind: parsed.data.kind,
    title: parsed.data.title,
    body: parsed.data.body,
    sourceUrl: parsed.data.sourceUrl || null,
    status: parsed.data.status,
    provenance: parsed.data.provenance,
    tags: parsed.data.tags,
    createdAt: t,
    updatedAt: t,
    approvedAt: parsed.data.status === "approved" ? t : null
  };
  db.knowledgeItems.push(item);
  await audit(db, "knowledge.created", "knowledge_item", item.id);
  await saveDB(db);
  revalidatePath(`/clients/${clientId}`);
}

async function ingestUrl(clientId: string, formData: FormData) {
  "use server";
  const { loadDB: l, saveDB, audit, uid, nowIso } = await import("@/lib/store");
  const { scrapeUrlForKnowledge } = await import("@/lib/crawler");
  let url = String(formData.get("crawlUrl") ?? "").trim();
  if (!url) redirect(`/clients/${clientId}?error=invalid_url`);
  if (!/^https?:\/\//i.test(url) && url.includes(".")) {
    url = `https://${url}`;
  }

  const db = await l();
  const client = db.clients.find((c) => c.id === clientId);
  if (!client) redirect("/clients");

  let redirectTarget = "";
  try {
    const facts = await scrapeUrlForKnowledge(url);
    if (!facts || facts.length === 0) {
      redirectTarget = `/clients/${clientId}?error=no_facts_found`;
    } else {
      const t = nowIso();
      for (const f of facts) {
        db.knowledgeItems.push({
          id: uid("kn"),
          workspaceId: client.workspaceId,
          clientId: client.id,
          kind: f.kind,
          title: f.title,
          body: f.body,
          sourceUrl: url,
          status: "candidate",
          provenance: `Crawled from ${url}`,
          tags: f.tags,
          createdAt: t,
          updatedAt: t,
          approvedAt: null
        });
      }
      await audit(db, "knowledge.crawled", "client", client.id);
      await saveDB(db);
      revalidatePath(`/clients/${clientId}`);
      redirectTarget = `/clients/${clientId}?success=crawled&count=${facts.length}`;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "crawl_failed";
    redirectTarget = `/clients/${clientId}?error=crawl_failed&reason=${encodeURIComponent(msg)}`;
  }

  if (redirectTarget) {
    redirect(redirectTarget);
  }
}

async function setKnowledgeStatus(clientId: string, id: string, status: KnowledgeStatus) {
  "use server";
  const { loadDB: l, saveDB, audit, nowIso } = await import("@/lib/store");
  const db = await l();
  const item = db.knowledgeItems.find((k) => k.id === id && k.clientId === clientId);
  if (!item) return;
  const t = nowIso();
  item.status = status;
  item.updatedAt = t;
  if (status === "approved") item.approvedAt = t;
  await audit(db, `knowledge.${status}`, "knowledge_item", id);
  await saveDB(db);
  revalidatePath(`/clients/${clientId}`);
}

async function updateClient(clientId: string, formData: FormData) {
  "use server";
  const { loadDB: l, saveDB, audit, nowIso } = await import("@/lib/store");
  const { ClientUpdateSchema } = await import("@/lib/clients");
  const parsed = ClientUpdateSchema.safeParse({
    name: formData.get("name"),
    industry: formData.get("industry"),
    website: formData.get("website"),
    contactName: formData.get("contactName"),
    contactEmail: formData.get("contactEmail"),
    timezone: formData.get("timezone"),
    brandColor: formData.get("brandColor"),
    audience: formData.get("audience"),
    tone: formData.get("tone"),
    restrictedClaims: formData.get("restrictedClaims"),
    summary: formData.get("summary")
  });
  if (!parsed.success) redirect(`/clients/${clientId}?error=client`);
  const db = await l();
  const client = db.clients.find((c) => c.id === clientId);
  if (!client) return;
  Object.assign(client, parsed.data, { updatedAt: nowIso() });
  await audit(db, "client.updated", "client", clientId);
  await saveDB(db);
  revalidatePath(`/clients/${clientId}`);
}

async function addPlanItem(clientId: string, formData: FormData) {
  "use server";
  const { loadDB: l, saveDB, audit, uid, nowIso } = await import("@/lib/store");
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
  if (!parsed.success) redirect(`/clients/${clientId}?error=plan`);
  const db = await l();
  const client = db.clients.find((c) => c.id === clientId);
  if (!client) return;

  let plan = db.plans.find((p) => p.clientId === clientId && p.status === "active");
  const t = nowIso();
  if (!plan) {
    plan = {
      id: uid("plan"),
      workspaceId: client.workspaceId,
      clientId,
      month: parsed.data.publishDate.slice(0, 7),
      title: "Content plan",
      objective: "",
      status: "active",
      createdAt: t,
      updatedAt: t
    };
    db.plans.push(plan);
  }

  const item = {
    id: uid("pi"),
    workspaceId: client.workspaceId,
    clientId,
    planId: plan.id,
    ...parsed.data,
    createdAt: t,
    updatedAt: t
  };
  db.planItems.push(item);
  await audit(db, "plan_item.created", "plan_item", item.id);
  await saveDB(db);
  revalidatePath(`/clients/${clientId}`);
}

async function setPlanItemStatus(clientId: string, id: string, formData: FormData) {
  "use server";
  const { loadDB: l, saveDB, audit, nowIso } = await import("@/lib/store");
  const status = String(formData.get("status") ?? "");
  if (!(PLAN_ITEM_STATUSES as readonly string[]).includes(status)) return;
  const db = await l();
  const item = db.planItems.find((p) => p.id === id && p.clientId === clientId);
  if (!item) return;
  item.status = status as PlanItemStatus;
  item.updatedAt = nowIso();
  await audit(db, `plan_item.${status}`, "plan_item", id);
  await saveDB(db);
  revalidatePath(`/clients/${clientId}`);
}

export default async function ClientDetailPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: {
    q?: string;
    kind?: string;
    status?: string;
    error?: string;
    reason?: string;
    success?: string;
    count?: string;
  };
}) {
  const db = await loadDB();
  const client = db.clients.find((c) => c.id === params.id);
  if (!client) notFound();

  const all = db.knowledgeItems.filter((k) => k.clientId === client.id);
  const stats = knowledgeStats(all);
  const plan = db.plans.find((p) => p.clientId === client.id && p.status === "active") ?? db.plans.find((p) => p.clientId === client.id);
  const planItems = db.planItems
    .filter((p) => p.clientId === client.id)
    .sort((a, b) => a.publishDate.localeCompare(b.publishDate));
  const scheduled = db.posts.filter((p) => p.clientId === client.id);

  const q = (searchParams.q ?? "").trim();
  const kind = (KNOWLEDGE_KINDS as readonly string[]).includes(searchParams.kind ?? "") ? (searchParams.kind as KnowledgeKind) : null;
  const status = (["approved", "candidate", "archived"] as string[]).includes(searchParams.status ?? "") ? (searchParams.status as KnowledgeStatus) : null;

  const filtered = all
    .filter((k) => (kind ? k.kind === kind : true))
    .filter((k) => (status ? k.status === status : true))
    .filter((k) => {
      if (!q) return true;
      const hay = `${k.title} ${k.body} ${k.tags.join(" ")} ${k.provenance}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    })
    .sort((a, b) => a.kind.localeCompare(b.kind) || b.updatedAt.localeCompare(a.updatedAt));

  const clearHref = `/clients/${client.id}`;
  return (
    <div className="space-y-6">
      <p><a href="/clients" className="text-sm font-semibold text-accent hover:underline">← All clients</a></p>

      {searchParams.success === "crawled" && (
        <p className="alert alert-success">
          ✨ Successfully crawled page and extracted {searchParams.count ?? "new"} candidate fact{searchParams.count === "1" ? "" : "s"} into the knowledge brain!
        </p>
      )}

      {searchParams.error && (
        <p className="alert alert-danger">
          {searchParams.error === "knowledge"
            ? "Knowledge item not saved — add a title (3+ characters), body (10+ characters) and a valid kind."
            : searchParams.error === "plan"
              ? "Plan item not saved — add a title, channel and publish date."
              : searchParams.error === "crawl_failed"
                ? `Failed to crawl URL — ${searchParams.reason ? decodeURIComponent(searchParams.reason) : "check that the link is public and accessible."}`
                : searchParams.error === "invalid_url"
                  ? "Invalid URL provided — must be a valid website address (e.g. https://client.com)."
                  : searchParams.error === "no_facts_found"
                    ? "No facts could be extracted from this page. Try another URL or add facts manually."
                    : decodeURIComponent(searchParams.error)}
        </p>
      )}

      <section className="card overflow-hidden !p-0">
        <div className="h-1.5 w-full" style={{ background: client.brandColor }} aria-hidden />
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span
                className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl font-display text-lg font-bold text-white"
                style={{ background: client.brandColor }}
                aria-hidden
              >
                {initials(client.name)}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="h-display text-3xl md:text-4xl">{client.name}</h1>
                  <span className={`badge ${client.status === "active" ? "badge-success" : "badge-muted"}`}>{client.status}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {client.industry || "No industry"} · {client.timezone}
                  {client.website && <> · <a className="text-accent hover:underline" href={client.website} target="_blank" rel="noreferrer">{client.website.replace(/^https?:\/\//, "")}</a></>}
                </p>
                <p className="prose-muted mt-2 max-w-2xl text-sm">{client.summary || "Add a strategy summary to align the team."}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="#knowledge" className="btn btn-outline btn-sm">Knowledge Brain</a>
              <a href="#planner" className="btn btn-outline btn-sm">Planner</a>
              <a href="#guardrails" className="btn btn-sm">Brand guardrails</a>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-muted/60 p-3">
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Approved knowledge</dt>
              <dd className="font-display text-2xl font-semibold">{stats.approved}</dd>
            </div>
            <div className="rounded-xl bg-muted/60 p-3">
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Awaiting review</dt>
              <dd className="font-display text-2xl font-semibold">{stats.candidate}</dd>
            </div>
            <div className="rounded-xl bg-muted/60 p-3">
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Planned items</dt>
              <dd className="font-display text-2xl font-semibold">{planItems.length}</dd>
            </div>
            <div className="rounded-xl bg-muted/60 p-3">
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Scheduled posts</dt>
              <dd className="font-display text-2xl font-semibold">{scheduled.length}</dd>
            </div>
          </dl>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section id="knowledge" className="space-y-4">
          <div className="card !p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Knowledge Brain</p>
                <h2 className="h-display text-2xl">What the agency knows</h2>
              </div>
              <p className="text-xs text-muted-foreground">{filtered.length} of {all.length} items</p>
            </div>
            <form method="get" className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
              <input name="q" defaultValue={q} className="input" placeholder="Search facts, research, tags…" aria-label="Search knowledge" />
              <select name="kind" defaultValue={kind ?? ""} className="input sm:!w-40" aria-label="Filter by kind">
                <option value="">All kinds</option>
                {KNOWLEDGE_KINDS.map((k) => <option key={k} value={k}>{KNOWLEDGE_KIND_LABELS[k]}</option>)}
              </select>
              <select name="status" defaultValue={status ?? ""} className="input sm:!w-36" aria-label="Filter by status">
                <option value="">All statuses</option>
                <option value="approved">Approved</option>
                <option value="candidate">Candidate</option>
                <option value="archived">Archived</option>
              </select>
              <button className="btn" type="submit">Filter</button>
            </form>
            {(q || kind || status) && <p className="mt-2 text-xs"><a className="text-accent hover:underline" href={clearHref}>Clear filters</a></p>}
          </div>

          <p className="alert alert-warning">
            Only <strong>approved</strong> knowledge may be used for drafting. Candidates stay quarantined until a human verifies them.
          </p>

          {filtered.length === 0 ? (
            <div className="card">
              <div className="empty !py-10">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-2xl" aria-hidden>❖</div>
                <h3 className="h-display mt-4 text-lg">{all.length === 0 ? "The brain is empty." : "Nothing matches these filters."}</h3>
                <p className="prose-muted mt-1 max-w-md text-sm">
                  {all.length === 0
                    ? "Add the first approved brand fact or source document on the right. Generation stays blocked until at least one fact is approved."
                    : "Clear the filters or add a new item."}
                </p>
              </div>
            </div>
          ) : (
            <div className="anim-list space-y-3">
              {filtered.map((item) => (
                <article key={item.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {KNOWLEDGE_KIND_ICONS[item.kind]} {KNOWLEDGE_KIND_LABELS[item.kind]}
                      </p>
                      <h3 className="mt-0.5 font-display text-lg font-semibold leading-snug">{item.title}</h3>
                    </div>
                    <span className={`badge ${STATUS_BADGE[item.status]}`}>{item.status}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{item.body}</p>
                  {item.sourceUrl && (
                    <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block break-all text-xs font-semibold text-accent hover:underline">
                      Source ↗ {item.sourceUrl.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {item.tags.map((tag) => <span key={tag} className="badge badge-muted">#{tag}</span>)}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5">
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {item.provenance} · {item.updatedAt.slice(0, 10)}
                      {item.approvedAt ? ` · approved ${item.approvedAt.slice(0, 10)}` : ""}
                    </p>
                    <div className="flex gap-1.5">
                      {item.status !== "approved" && (
                        <form action={setKnowledgeStatus.bind(null, client.id, item.id, "approved")}>
                          <button className="btn btn-sm !px-2.5 !py-1 text-xs" type="submit">✓ Approve</button>
                        </form>
                      )}
                      {item.status !== "archived" && (
                        <form action={setKnowledgeStatus.bind(null, client.id, item.id, "archived")}>
                          <button className="btn btn-outline btn-sm !px-2.5 !py-1 text-xs" type="submit">Archive</button>
                        </form>
                      )}
                      {item.status === "archived" && (
                        <form action={setKnowledgeStatus.bind(null, client.id, item.id, "candidate")}>
                          <button className="btn btn-outline btn-sm !px-2.5 !py-1 text-xs" type="submit">Restore</button>
                        </form>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <div className="card border-accent/30 bg-accent/5">
            <p className="eyebrow text-accent">⚡ AI Web Ingestion</p>
            <h2 className="h-display mt-1 text-xl">Ingest Client URL</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Paste a website URL or landing page. Curro crawls the page and extracts verified candidate facts automatically.
            </p>
            <CrawlForm
              action={ingestUrl.bind(null, client.id)}
              defaultValue={client.website || ""}
              placeholder={client.website || "https://client.com/about"}
            />
          </div>

          <div className="card">
            <p className="eyebrow">Add knowledge</p>
            <h2 className="h-display mt-1 text-xl">Teach the brain</h2>
            <p className="mt-1 text-xs text-muted-foreground">New items start as candidates unless you explicitly approve them.</p>
            <form action={addKnowledge.bind(null, client.id)} className="mt-3 space-y-3">
              <div>
                <label className="label" htmlFor="k-kind">Kind</label>
                <select id="k-kind" name="kind" className="input" defaultValue="brand_fact">
                  {KNOWLEDGE_KINDS.map((k) => <option key={k} value={k}>{KNOWLEDGE_KIND_LABELS[k]}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="k-title">Title</label>
                <input id="k-title" name="title" className="input" placeholder="Part-time MBA format" required minLength={3} maxLength={160} />
              </div>
              <div>
                <label className="label" htmlFor="k-body">Approved content</label>
                <textarea id="k-body" name="body" className="input min-h-[110px]" placeholder="State the fact exactly as it may be used…" required minLength={10} maxLength={5000} />
              </div>
              <div>
                <label className="label" htmlFor="k-source">Source URL (optional)</label>
                <input id="k-source" name="sourceUrl" className="input" placeholder="https://client.com/page" maxLength={500} />
              </div>
              <div>
                <label className="label" htmlFor="k-tags">Tags (comma separated)</label>
                <input id="k-tags" name="tags" className="input" placeholder="mba, admissions" maxLength={120} />
              </div>
              <div>
                <label className="label" htmlFor="k-prov">Provenance</label>
                <input id="k-prov" name="provenance" className="input" defaultValue="Agency entry" maxLength={160} />
              </div>
              <div>
                <label className="label" htmlFor="k-status">On save</label>
                <select id="k-status" name="status" className="input" defaultValue="candidate">
                  <option value="candidate">Candidate — needs review</option>
                  <option value="approved">Approved — I verified this</option>
                </select>
              </div>
              <button className="btn btn-accent w-full" type="submit">Add to knowledge brain</button>
            </form>
          </div>

          <div className="card text-sm">
            <h3 className="font-display text-base font-semibold">Why this is the product</h3>
            <p className="prose-muted mt-1 text-xs">
              Planning, drafting, design and scheduling all read from this brain. When a new account manager opens the client,
              the context is already here — approved, cited and dated.
            </p>
          </div>
        </aside>
      </div>

      <section id="planner" className="card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Content planner</p>
            <h2 className="h-display text-2xl">{plan ? plan.title : "No plan yet"}</h2>
            <p className="prose-muted mt-1 text-sm">{plan?.objective || "Add a plan item to start the monthly calendar."}</p>
          </div>
          {plan && <span className="badge badge-accent">{plan.month} · {plan.status}</span>}
        </div>

        <form action={addPlanItem.bind(null, client.id)} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <label className="label" htmlFor="p-title">Content title</label>
            <input id="p-title" name="title" className="input" placeholder="Part-time MBA timeline" required minLength={3} maxLength={200} />
          </div>
          <div>
            <label className="label" htmlFor="p-channel">Channel</label>
            <select id="p-channel" name="channel" className="input" defaultValue="linkedin">
              {CHANNELS.map((ch) => <option key={ch} value={ch}>{CHANNEL_LABELS[ch]}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="p-date">Publish date</label>
            <input id="p-date" name="publishDate" type="date" className="input" required />
          </div>
          <div>
            <label className="label" htmlFor="p-owner">Owner</label>
            <input id="p-owner" name="owner" className="input" placeholder="Maya" maxLength={80} />
          </div>
          <div>
            <label className="label" htmlFor="p-pillar">Pillar</label>
            <input id="p-pillar" name="pillar" className="input" placeholder="Admissions clarity" maxLength={80} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="label" htmlFor="p-notes">Notes</label>
            <input id="p-notes" name="notes" className="input" placeholder="Which approved knowledge supports this?" maxLength={600} />
          </div>
          <div>
            <label className="label" htmlFor="p-status">Status</label>
            <select id="p-status" name="status" className="input" defaultValue="idea">
              {PLAN_ITEM_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button className="btn btn-accent w-full" type="submit">Add to plan</button>
          </div>
        </form>

        <div className="mt-4 space-y-2">
          {planItems.length === 0 && <p className="text-sm text-muted-foreground">No items yet. Add the first planned post or article above.</p>}
          {planItems.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
              <div className="w-16 shrink-0 text-center">
                <p className="font-display text-sm font-semibold">{formatDate(item.publishDate)}</p>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="badge badge-muted">{CHANNEL_LABELS[item.channel]}</span>
                  <span className={`badge ${PLAN_STATUS_BADGE[item.status]}`}>{item.status.replace("_", " ")}</span>
                  <span className="text-[11px] text-muted-foreground">{item.pillar} · {item.owner}</span>
                </div>
                <p className="mt-1 font-semibold leading-snug">{item.title}</p>
                {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
              </div>
              <form action={setPlanItemStatus.bind(null, client.id, item.id)} className="flex items-center gap-1.5">
                <select name="status" defaultValue={item.status} className="input !w-auto !py-1 text-xs" aria-label={`Status for ${item.title}`}>
                  {PLAN_ITEM_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
                <button className="btn btn-outline btn-sm !px-2.5 !py-1 text-xs" type="submit">Save</button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section id="guardrails" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form action={updateClient.bind(null, client.id)} className="card">
          <p className="eyebrow">Brand guardrails</p>
          <h2 className="h-display mt-1 text-2xl">Account settings</h2>
          <p className="prose-muted mt-1 text-sm">Every generated asset must respect these rules. Restricted claims block approval.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="c-name">Client name</label>
              <input id="c-name" name="name" className="input" defaultValue={client.name} required minLength={2} maxLength={80} />
            </div>
            <div>
              <label className="label" htmlFor="c-industry">Industry</label>
              <input id="c-industry" name="industry" className="input" defaultValue={client.industry} maxLength={80} />
            </div>
            <div>
              <label className="label" htmlFor="c-website">Website</label>
              <input id="c-website" name="website" className="input" defaultValue={client.website} maxLength={200} />
            </div>
            <div>
              <label className="label" htmlFor="c-timezone">Timezone</label>
              <select id="c-timezone" name="timezone" className="input" defaultValue={client.timezone}>
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="c-contact">Main contact</label>
              <input id="c-contact" name="contactName" className="input" defaultValue={client.contactName} maxLength={80} />
            </div>
            <div>
              <label className="label" htmlFor="c-email">Contact email</label>
              <input id="c-email" name="contactEmail" type="email" className="input" defaultValue={client.contactEmail} maxLength={120} />
            </div>
            <div>
              <label className="label" htmlFor="c-color">Brand colour</label>
              <input id="c-color" name="brandColor" type="color" defaultValue={client.brandColor} className="h-10 w-full cursor-pointer rounded-[0.625rem] border border-border bg-background p-1" />
            </div>
            <div>
              <label className="label" htmlFor="c-summary">Strategy summary</label>
              <input id="c-summary" name="summary" className="input" defaultValue={client.summary} maxLength={300} />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="c-audience">Audience</label>
              <textarea id="c-audience" name="audience" className="input min-h-[60px]" defaultValue={client.audience} maxLength={500} />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="c-tone">Tone & voice</label>
              <textarea id="c-tone" name="tone" className="input min-h-[60px]" defaultValue={client.tone} maxLength={500} />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="c-restricted">Restricted claims</label>
              <textarea id="c-restricted" name="restrictedClaims" className="input min-h-[70px]" defaultValue={client.restrictedClaims} maxLength={800} />
            </div>
          </div>
          <button className="btn btn-accent mt-4" type="submit">Save guardrails</button>
        </form>

        <aside className="space-y-4">
          <div className="card text-sm">
            <h3 className="font-display text-lg font-semibold">Publishing gate</h3>
            <p className="prose-muted mt-1 text-xs">
              Nothing is published from this screen. Posts move to <strong>scheduled</strong> only after the text and its claims are approved,
              then a durable queue publishes them.
            </p>
            <ul className="mt-3 space-y-2">
              {(["linkedin", "x"] as const).map((ch) => {
                const account = db.accounts.find((a) => a.clientId === client.id && a.channel === ch);
                return (
                  <li key={ch} className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2">
                    <span>{CHANNEL_LABELS[ch]}</span>
                    <span className={`badge ${account?.status === "connected" ? "badge-success" : "badge-muted"}`}>
                      {account?.status ?? "not connected"}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-[11px] text-muted-foreground">OAuth, scheduling and failure logs land in Phase 5. Copy/export fallback ships first.</p>
          </div>
          <div className="card text-sm">
            <h3 className="font-display text-lg font-semibold">Client contact</h3>
            <p className="mt-2 text-muted-foreground">{client.contactName || "No contact yet"}</p>
            <p className="font-mono text-xs text-muted-foreground">{client.contactEmail || "—"}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">Approval portal (magic link) is planned after the internal workflow is reliable.</p>
          </div>
        </aside>
      </section>
    </div>
  );
}
