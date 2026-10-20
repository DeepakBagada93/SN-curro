import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { loadDB, saveDB, audit, uid, nowIso } from "@/lib/store";
import { generateApiKey } from "@/lib/api-keys";
import { CHANNELS, CHANNEL_LABELS } from "@/lib/clients";
import { EmptyState } from "@/components/ui";
import { DEFAULT_WORKSPACE_ID, type Channel } from "@/lib/types";

export const dynamic = "force-dynamic";

const CHANNEL_HINTS: Record<Channel, string> = {
  linkedin: "Company page or member profile handle",
  x: "@handle",
  instagram: "@handle",
  blog: "Domain or CMS label",
  newsletter: "List name or sending domain"
};

async function connectAccount(clientId: string, formData: FormData) {
  "use server";
  const db = await loadDB();
  const client = db.clients.find((c) => c.id === clientId);
  if (!client) redirect("/integrations?error=client");
  const channel = String(formData.get("channel") ?? "") as Channel;
  if (!CHANNELS.includes(channel)) redirect(`/integrations?client=${clientId}&error=channel`);
  const handle = String(formData.get("handle") ?? "").trim().slice(0, 80);
  if (handle.length < 2) redirect(`/integrations?client=${clientId}&error=handle`);
  const t = nowIso();
  const existing = db.accounts.find((a) => a.clientId === clientId && a.channel === channel);
  if (existing) {
    existing.handle = handle;
    existing.status = "connected";
    existing.connectedAt = t;
  } else {
    db.accounts.push({
      id: uid("acct"),
      workspaceId: client.workspaceId,
      clientId,
      channel,
      handle,
      status: "connected",
      scopes: channel === "blog" || channel === "newsletter" ? ["manual_export"] : ["publish", "read_insights"],
      connectedAt: t
    });
  }
  await audit(db, "integration.connected", "connected_account", existing?.id ?? channel);
  await saveDB(db);
  revalidatePath("/integrations");
  redirect(`/integrations?client=${clientId}&message=connected`);
}

async function disconnectAccount(clientId: string, accountId: string) {
  "use server";
  const db = await loadDB();
  const account = db.accounts.find((a) => a.id === accountId && a.clientId === clientId);
  if (!account) return;
  account.status = "disconnected";
  await audit(db, "integration.disconnected", "connected_account", account.id);
  await saveDB(db);
  revalidatePath("/integrations");
  redirect(`/integrations?client=${clientId}&message=disconnected`);
}

async function createKey(clientId: string, formData: FormData) {
  "use server";
  const db = await loadDB();
  const client = db.clients.find((c) => c.id === clientId);
  if (!client) redirect("/integrations?error=client");
  const name = String(formData.get("name") ?? "").trim().slice(0, 60) || "API key";
  const generated = generateApiKey();
  db.apiKeys.push({
    id: uid("key"),
    workspaceId: client.workspaceId,
    name,
    prefix: generated.prefix,
    keyHash: generated.keyHash,
    clientId: client.id,
    createdAt: nowIso(),
    lastUsedAt: null,
    revokedAt: null
  });
  await audit(db, "api_key.created", "api_key", name);
  await saveDB(db);
  revalidatePath("/integrations");
  redirect(`/integrations?client=${clientId}&key=${encodeURIComponent(generated.plaintext)}`);
}

async function revokeKey(clientId: string, keyId: string) {
  "use server";
  const db = await loadDB();
  const key = db.apiKeys.find((k) => k.id === keyId && k.workspaceId === DEFAULT_WORKSPACE_ID);
  if (!key) return;
  key.revokedAt = nowIso();
  await audit(db, "api_key.revoked", "api_key", key.id);
  await saveDB(db);
  revalidatePath("/integrations");
  redirect(`/integrations?client=${clientId}&message=revoked`);
}

export default async function IntegrationsPage({
  searchParams
}: {
  searchParams: { client?: string; message?: string; error?: string; key?: string };
}) {
  const db = await loadDB();
  if (db.clients.length === 0) {
    return (
      <div className="card">
        <EmptyState icon="⚯" title="Add a client first." body="Channels and API keys are scoped per client." action={<a href="/clients" className="btn btn-accent">Go to clients</a>} />
      </div>
    );
  }
  const client = db.clients.find((c) => c.id === searchParams.client) ?? db.clients[0];
  const accounts = db.accounts.filter((a) => a.clientId === client.id);
  const keys = db.apiKeys.filter((k) => k.clientId === client.id);
  const canDirectPublish = (channel: Channel) => channel === "linkedin" || channel === "x";

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Integrations</p>
            <h1 className="h-display mt-1 text-3xl md:text-4xl">Channels, keys, and the honest limits.</h1>
            <p className="prose-muted mt-1 max-w-2xl text-sm">OAuth is simulated in this beta and no tokens are stored. LinkedIn and X can enter the publishing queue; blog and newsletter are export-only.</p>
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

      {searchParams.error && <p className="alert alert-danger">{searchParams.error === "handle" ? "Enter a recognizable handle." : searchParams.error === "channel" ? "Choose a supported channel." : "Select a valid client."}</p>}
      {searchParams.message === "connected" && <p className="alert alert-warning">Channel connected (simulated OAuth). Scheduling is now enabled for approved assets on that channel.</p>}
      {searchParams.message === "disconnected" && <p className="alert alert-warning">Channel disconnected. Scheduled posts will fail with a reason until reconnected.</p>}
      {searchParams.message === "revoked" && <p className="alert alert-warning">API key revoked.</p>}
      {searchParams.key && (
        <div className="alert alert-warning">
          <p className="font-semibold">Copy this key now — it is shown once.</p>
          <code className="mt-1 block break-all rounded bg-background/60 p-2 text-xs">{searchParams.key}</code>
          <p className="mt-1 text-xs">Use it as <code>Authorization: Bearer …</code> against <code>/api/mcp</code>.</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-3">
          <h2 className="h-display text-2xl">Channels</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {CHANNELS.map((channel) => {
              const account = accounts.find((a) => a.channel === channel);
              const connected = account?.status === "connected";
              return (
                <div key={channel} className="card">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display font-semibold">{CHANNEL_LABELS[channel]}</h3>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{canDirectPublish(channel) ? "Direct publish queue" : "Export-only in beta"}</p>
                    </div>
                    <span className={`badge ${connected ? "badge-success" : "badge-muted"}`}>{connected ? "connected" : account ? "disconnected" : "not connected"}</span>
                  </div>
                  {connected && account ? (
                    <div className="mt-3">
                      <p className="text-sm font-medium">{account.handle}</p>
                      <p className="text-[11px] text-muted-foreground">Scopes: {account.scopes.join(", ")}</p>
                      <form action={disconnectAccount.bind(null, client.id, account.id)} className="mt-2">
                        <button className="btn btn-outline btn-sm" type="submit">Disconnect</button>
                      </form>
                    </div>
                  ) : (
                    <form action={connectAccount.bind(null, client.id)} className="mt-3 space-y-2">
                      <input type="hidden" name="channel" value={channel} />
                      <label className="label" htmlFor={"handle-" + channel}>{CHANNEL_HINTS[channel]}</label>
                      <input id={"handle-" + channel} name="handle" className="input" defaultValue={account?.handle ?? ""} required minLength={2} maxLength={80} />
                      <button className="btn btn-accent btn-sm w-full" type="submit">Connect {CHANNEL_LABELS[channel]}</button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>

          <div className="card">
            <h2 className="h-display text-xl">API + MCP</h2>
            <p className="prose-muted mt-1 text-xs">Three tools: <code>search_knowledge</code>, <code>add_knowledge</code>, <code>list_clients</code>. Endpoint <code>/api/mcp</code> with a bearer key. Approved-only search keeps agent context clean.</p>
            <div className="mt-3 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/60 text-[10px] uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Prefix</th><th className="px-3 py-2">Client</th><th className="px-3 py-2">Created</th><th className="px-3 py-2">Status</th><th className="px-3 py-2" /></tr></thead>
                <tbody>
                  {keys.length === 0 && <tr><td className="px-3 py-3 text-muted-foreground" colSpan={6}>No keys yet.</td></tr>}
                  {keys.map((key) => (
                    <tr key={key.id} className="border-t border-border">
                      <td className="px-3 py-2 font-medium">{key.name}</td>
                      <td className="px-3 py-2"><code>{key.prefix}…</code></td>
                      <td className="px-3 py-2">{db.clients.find((c) => c.id === key.clientId)?.name ?? "Workspace"}</td>
                      <td className="px-3 py-2">{new Date(key.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-2">{key.revokedAt ? <span className="badge badge-muted">revoked</span> : <span className="badge badge-success">active</span>}</td>
                      <td className="px-3 py-2 text-right">{!key.revokedAt && <form action={revokeKey.bind(null, client.id, key.id)}><button className="btn btn-ghost btn-sm !px-2 !py-0.5 text-[11px]" type="submit">Revoke</button></form>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="card">
            <p className="eyebrow">New API key</p>
            <h2 className="h-display mt-1 text-lg">For MCP clients</h2>
            <form action={createKey.bind(null, client.id)} className="mt-2 space-y-2">
              <div><label className="label" htmlFor="key-name">Name</label><input id="key-name" name="name" className="input" placeholder="Claude Desktop · research" maxLength={60} /></div>
              <button className="btn btn-accent w-full" type="submit">Create key</button>
            </form>
            <p className="mt-2 text-[11px] text-muted-foreground">Keys are stored as SHA-256 hashes. There is no way to retrieve one after creation.</p>
          </div>
          <div className="card text-xs">
            <h3 className="font-display text-base font-semibold">What is real</h3>
            <ul className="mt-2 space-y-1.5 text-muted-foreground">
              <li>✓ Knowledge storage, approvals, claim ledger, review links, scheduling queue</li>
              <li>✓ OpenRouter text generation when a key is configured</li>
              <li>◐ OAuth connect is simulated; handles are stored, tokens are not</li>
              <li>◐ Publishing is simulated with linked/X queue states and failure reasons</li>
              <li>✕ No automatic publishing in beta; approval is always required</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
