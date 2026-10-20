import { loadDB } from "@/lib/store";
export const dynamic = "force-dynamic";

async function addCard(formData: FormData) {
  "use server";
  const body = String(formData.get("body") ?? "").slice(0, 600);
  const kind = String(formData.get("kind") ?? "fact");
  if (body.trim().length < 5) return;
  const { loadDB: l, saveDB, audit, uid, nowIso } = await import("@/lib/store");
  const db = await l();
  db.memoryCards.push({ id: uid("mem"), workspaceId: "ws_curro_beta", kind: kind as never, body: body.trim(), status: kind === "candidate" ? "candidate" : "approved", provenance: "Founder entry", createdAt: nowIso(), approvedAt: kind === "candidate" ? null : nowIso() });
  await audit(db, "memory.created", "memory", kind);
  await saveDB(db);
}
async function setStatus(id: string, status: string) {
  "use server";
  const { loadDB: l, saveDB, audit, nowIso } = await import("@/lib/store");
  const db = await l();
  const m = db.memoryCards.find((x) => x.id === id);
  if (!m) return;
  m.status = status as never;
  if (status === "approved") { m.approvedAt = nowIso(); if (m.kind === "candidate") m.kind = "fact"; }
  await audit(db, `memory.${status}`, "memory", id);
  await saveDB(db);
}
async function remove(id: string) {
  "use server";
  const { loadDB: l, saveDB, audit } = await import("@/lib/store");
  const db = await l();
  db.memoryCards = db.memoryCards.filter((x) => x.id !== id);
  await audit(db, "memory.deleted", "memory", id);
  await saveDB(db);
}

function Card({ m }: { m: { id: string; kind: string; status: string; body: string; provenance: string; createdAt: string } }) {
  return (
    <div className="rounded-xl border border-border p-3 text-sm">
      <span className="badge badge-muted">{m.kind} · {m.status}</span>
      <p className="mt-1.5">{m.body}</p>
      <p className="mt-1 font-mono text-xs text-muted-foreground">{m.provenance} · {m.createdAt.slice(0, 10)}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {m.status !== "approved" && <form action={setStatus.bind(null, m.id, "approved")}><button className="btn btn-sm !px-3 !py-1 text-xs" type="submit">✓ Confirm</button></form>}
        {m.status === "approved" && <form action={setStatus.bind(null, m.id, "archived")}><button className="btn btn-outline btn-sm !px-3 !py-1 text-xs" type="submit">Archive</button></form>}
        <form action={remove.bind(null, m.id)}><button className="btn btn-outline btn-sm !px-3 !py-1 text-xs" type="submit">Delete</button></form>
      </div>
    </div>
  );
}

export default async function MemoryPage() {
  const db = await loadDB();
  const approved = db.memoryCards.filter((m) => m.status === "approved");
  const candidates = db.memoryCards.filter((m) => m.status !== "approved");

  return (
    <div className="space-y-6">
      <div className="card">
        <p className="eyebrow">Founder authority</p>
        <h1 className="h-display mt-1 text-3xl md:text-4xl">Memory Cards</h1>
        <p className="prose-muted mt-2 max-w-2xl text-sm">Your confirmed facts, opinions, and voice examples — the only founder context drafts may use. Suggestions sit as <em>candidates</em> until you confirm them. Nothing is ever silently promoted.</p>
        <form action={addCard} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input name="body" className="input flex-1" aria-label="New memory card" placeholder="e.g. We reply to every comment within 24h — that's our distribution strategy." maxLength={600} />
          <select name="kind" className="input sm:!w-44" aria-label="Card kind"><option value="fact">fact</option><option value="opinion">opinion</option><option value="voice_example">voice example</option><option value="candidate">candidate</option></select>
          <button className="btn shrink-0" type="submit">Add card</button>
        </form>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="h-display text-xl">Approved <span className="badge badge-success ml-1">{approved.length}</span></h2>
          <p className="text-xs text-muted-foreground">Authoritative context for generation.</p>
          <div className="mt-3 space-y-2">{approved.map((m) => <Card key={m.id} m={m} />)}{approved.length === 0 && <p className="text-sm text-muted-foreground">Nothing approved yet — confirm at least three before drafting.</p>}</div>
        </div>
        <div className="card">
          <h2 className="h-display text-xl">Candidates & archived <span className="badge badge-muted ml-1">{candidates.length}</span></h2>
          <p className="text-xs text-muted-foreground">Suggestions and retirements — never used in drafts.</p>
          <div className="mt-3 space-y-2">{candidates.map((m) => <Card key={m.id} m={m} />)}{candidates.length === 0 && <p className="text-sm text-muted-foreground">Inbox zero. New suggestions will land here.</p>}</div>
        </div>
      </div>
    </div>
  );
}
