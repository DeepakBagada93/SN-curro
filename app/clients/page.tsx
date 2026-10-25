import { redirect } from "next/navigation";
import { loadDB } from "@/lib/store";
import { CLIENT_COLORS, TIMEZONES, initials, knowledgeStats } from "@/lib/clients";
import { EmptyState } from "@/components/ui";
import { ClientList, type ClientCardData } from "@/components/client-list";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

async function addClient(formData: FormData) {
  "use server";
  const { loadDB: l, saveDB, audit, uid, nowIso } = await import("@/lib/store");
  const { ClientCreateSchema, uniqueSlug } = await import("@/lib/clients");
  const parsed = ClientCreateSchema.safeParse({
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
  if (!parsed.success) redirect("/clients?error=invalid");
  const db = await l();
  const t = nowIso();
  const client = {
    id: uid("cl"),
    workspaceId: "ws_curro_beta",
    ...parsed.data,
    slug: uniqueSlug(db, parsed.data.name),
    status: "active" as const,
    createdAt: t,
    updatedAt: t
  };
  db.clients.push(client);
  await audit(db, "client.created", "client", client.id);
  await saveDB(db);
  redirect(`/clients/${client.id}`);
}

async function deleteClientAction(clientId: string): Promise<{ ok: boolean; error?: string }> {
  "use server";
  try {
    const { loadDB: l, saveDB, audit } = await import("@/lib/store");
    const { revalidatePath } = await import("next/cache");
    const db = await l();
    const index = db.clients.findIndex((c) => c.id === clientId);
    if (index === -1) return { ok: false, error: "Client not found." };

    db.clients.splice(index, 1);
    db.knowledgeItems = db.knowledgeItems.filter((k) => k.clientId !== clientId);
    db.plans = db.plans.filter((p) => p.clientId !== clientId);
    db.planItems = db.planItems.filter((p) => p.clientId !== clientId);
    db.assets = db.assets.filter((a) => a.clientId !== clientId);
    db.posts = db.posts.filter((p) => p.clientId !== clientId);

    await audit(db, "client.deleted", "client", clientId);
    await saveDB(db);
    revalidatePath("/clients");
    return { ok: true };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Failed to delete client.";
    return { ok: false, error };
  }
}

export default async function ClientsPage({ searchParams }: { searchParams: { error?: string; message?: string } }) {
  const db = await loadDB();
  const active = db.clients.filter((c) => c.status === "active");
  const allKnowledge = db.knowledgeItems;
  const stats = knowledgeStats(allKnowledge);
  const planned = db.planItems.filter((p) => p.status !== "published").length;

  return (
    <div className="space-y-6">
      <div className="card">
        <p className="eyebrow">Agency workspace</p>
        <h1 className="h-display mt-1 text-3xl md:text-4xl">Client knowledge, remembered.</h1>
        <p className="prose-muted mt-2 max-w-2xl text-sm">
          Each client has one persistent brain: approved facts, source documents, SEO research and voice rules.
          Planning, creation and publishing all read from it — so nobody re-learns the account.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-muted/60 p-3">
            <p className="font-display text-2xl font-semibold">{active.length}</p>
            <p className="text-xs text-muted-foreground">active clients</p>
          </div>
          <div className="rounded-xl bg-muted/60 p-3">
            <p className="font-display text-2xl font-semibold">{stats.approved}</p>
            <p className="text-xs text-muted-foreground">approved knowledge items</p>
          </div>
          <div className="rounded-xl bg-muted/60 p-3">
            <p className="font-display text-2xl font-semibold">{stats.candidate}</p>
            <p className="text-xs text-muted-foreground">candidates to review</p>
          </div>
          <div className="rounded-xl bg-muted/60 p-3">
            <p className="font-display text-2xl font-semibold">{planned}</p>
            <p className="text-xs text-muted-foreground">planned content items</p>
          </div>
        </div>
      </div>

      {searchParams.error && (
        <p className="alert alert-danger">Could not create the client — add a name (2+ characters) and a valid brand colour.</p>
      )}

      {searchParams.message === "deleted" && (
        <p className="alert alert-success">✓ Client account and all associated brain data deleted.</p>
      )}

      {db.clients.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="◈"
            title="Start with one client."
            body="Add a client below. Then fill its Knowledge Brain with approved facts, SEO research and voice rules before creating any content."
          />
        </div>
      ) : (
        <ClientList
          onDeleteClient={deleteClientAction}
          clients={db.clients.map((c): ClientCardData => {
            const items = db.knowledgeItems.filter((k) => k.clientId === c.id);
            const ks = knowledgeStats(items);
            const next = db.planItems
              .filter((p) => p.clientId === c.id && p.status !== "published")
              .sort((a, b) => a.publishDate.localeCompare(b.publishDate))[0];
            return {
              id: c.id,
              name: c.name,
              industry: c.industry || "",
              summary: c.summary || "",
              brandColor: c.brandColor,
              status: c.status,
              approvedCount: ks.approved,
              candidateCount: ks.candidate,
              plannedCount: db.planItems.filter((p) => p.clientId === c.id).length,
              nextPost: next ? { date: next.publishDate, title: next.title } : null
            };
          })}
        />
      )}

      <div className="card" id="add-client">
        <p className="eyebrow">New account</p>
        <h2 className="h-display mt-1 text-2xl">Add a client</h2>
        <p className="prose-muted mt-1 text-sm">
          Only the name is required. Everything else can be filled in later — but approved knowledge is what makes generation safe.
        </p>
        <form action={addClient} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">Client name</label>
            <input id="name" name="name" className="input" placeholder="Northfield University" required minLength={2} maxLength={80} />
          </div>
          <div>
            <label className="label" htmlFor="industry">Industry</label>
            <input id="industry" name="industry" className="input" placeholder="Higher education" maxLength={80} />
          </div>
          <div>
            <label className="label" htmlFor="website">Website</label>
            <input id="website" name="website" className="input" placeholder="https://client.com" maxLength={200} />
          </div>
          <div>
            <label className="label" htmlFor="timezone">Timezone</label>
            <select id="timezone" name="timezone" className="input">
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="contactName">Main contact</label>
            <input id="contactName" name="contactName" className="input" placeholder="Priya Raman" maxLength={80} />
          </div>
          <div>
            <label className="label" htmlFor="contactEmail">Contact email</label>
            <input id="contactEmail" name="contactEmail" type="email" className="input" placeholder="priya@client.com" maxLength={120} />
          </div>
          <div>
            <label className="label" htmlFor="brandColor">Brand colour</label>
            <input id="brandColor" name="brandColor" type="color" defaultValue={CLIENT_COLORS[0]} className="h-10 w-full cursor-pointer rounded-[0.625rem] border border-border bg-background p-1" />
          </div>
          <div>
            <label className="label" htmlFor="summary">Strategy summary</label>
            <input id="summary" name="summary" className="input" placeholder="Own the part-time graduate conversation." maxLength={300} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="audience">Audience</label>
            <input id="audience" name="audience" className="input" placeholder="Working professionals aged 28–45 considering part-time programs" maxLength={500} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="tone">Tone & voice</label>
            <input id="tone" name="tone" className="input" placeholder="Confident, specific, warm. Cite facts, never hype." maxLength={500} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="restrictedClaims">Restricted claims</label>
            <textarea id="restrictedClaims" name="restrictedClaims" className="input min-h-[70px]" placeholder="No salary, ranking or completion-time claims without a cited source." maxLength={800} />
          </div>
          <div className="sm:col-span-2">
            <SubmitButton pendingText="Creating client & initializing brain…" className="btn btn-accent">
              Create client &amp; open brain →
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
