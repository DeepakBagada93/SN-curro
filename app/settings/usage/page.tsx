import { loadDB } from "@/lib/store";
import { BETA_ALLOWANCE } from "@/lib/types";
import { Counter } from "@/components/motion";
export const dynamic = "force-dynamic";

async function requestDeletion() {
  "use server";
  const { loadDB: l, saveDB, audit } = await import("@/lib/store");
  const db = await l();
  await audit(db, "workspace.deletion_requested", "workspace", "ws_curro_beta");
  await saveDB(db);
}

function dayKey(iso: string) { return iso.slice(0, 10); }

export default async function UsagePage() {
  const db = await loadDB();
  const spent = db.usage.reduce((a, u) => a + u.estimatedCost, 0);
  const tokensIn = db.usage.filter((u) => u.unit === "input_tokens").reduce((a, u) => a + u.quantity, 0);
  const tokensOut = db.usage.filter((u) => u.unit === "output_tokens").reduce((a, u) => a + u.quantity, 0);
  const estimated = db.usage.some((u) => u.meta?.estimated);
  const stats: Array<[React.ReactNode, string]> = [
    [<Counter key="b" to={BETA_ALLOWANCE.briefs - db.runs.length} />, "briefs left"],
    [<Counter key="d" to={BETA_ALLOWANCE.drafts - db.versions.length} />, "drafts left"],
    [<Counter key="t" to={tokensIn + tokensOut} />, "AI tokens metered"],
    [<span key="s">~${spent.toFixed(3)}</span>, "est. provider spend"]
  ];

  // Last 14 days of token bars.
  const days: Array<{ day: string; tokens: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    const tokens = db.usage
      .filter((u) => (u.unit === "input_tokens" || u.unit === "output_tokens") && dayKey(u.createdAt) === d)
      .reduce((a, u) => a + u.quantity, 0);
    days.push({ day: d.slice(5), tokens });
  }
  const maxDay = Math.max(1, ...days.map((d) => d.tokens));

  // Per-draft cost table (latest first).
  const draftRows = db.versions.slice().reverse().slice(0, 15).map((v) => {
    const asset = db.assets.find((a) => a.id === v.assetId);
    const signal = db.signals.find((s) => s.id === asset?.signalCardId);
    return { v, title: signal?.title ?? "Untitled", status: asset?.status ?? "—" };
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="eyebrow">Settings</p>
        <h1 className="h-display mt-1 text-3xl md:text-4xl">Usage & AI tokens.</h1>
        <p className="prose-muted mt-1 text-sm">Every provider call is capped before it runs and metered after. Caps: $5/day · $25/month · ~$0.15/run. {estimated ? "Token counts are estimated (~4 chars/token) until live provider metering lands." : "Token counts come straight from the provider."}</p>
      </div>

      <div className="anim-list grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(([v, k]) => <div key={k} className="card !p-4 text-center"><p className="font-display text-2xl font-semibold text-accent">{v}</p><p className="mt-1 text-xs text-muted-foreground">{k}</p></div>)}
      </div>

      <div className="card">
        <h2 className="h-display text-xl">Tokens — last 14 days</h2>
        <p className="text-xs text-muted-foreground">Input + output tokens per day. Retention: excerpts 90d · raw payloads 14d · logs 30d.</p>
        <div className="mt-4 flex h-28 items-end gap-1.5" role="img" aria-label={`Token usage per day, max ${maxDay}`}>
          {days.map((d) => (
            <div key={d.day} className="group relative flex-1" title={`${d.day}: ${d.tokens} tokens`}>
              <div className="w-full rounded-t-md bg-accent/80 transition-all group-hover:bg-accent" style={{ height: `${Math.max(4, (d.tokens / maxDay) * 100)}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between font-mono text-xs text-muted-foreground"><span>{days[0]?.day}</span><span>in {tokensIn.toLocaleString()} · out {tokensOut.toLocaleString()}</span><span>{days[days.length - 1]?.day}</span></div>
      </div>

      <div className="card">
        <h2 className="h-display text-xl">Cost per draft</h2>
        {draftRows.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No drafts yet — generate one and its token cost lands here.</p> :
          <div className="mt-2 overflow-x-auto"><table className="table-x min-w-[520px]">
            <thead><tr><th>Draft</th><th>Status</th><th>Model</th><th>Est. cost</th></tr></thead>
            <tbody>{draftRows.map(({ v, title, status }) => (
              <tr key={v.id}>
                <td><a href={`/drafts/${v.assetId}`} className="font-medium text-accent hover:underline">v{v.version} — {title.slice(0, 48)}{title.length > 48 ? "…" : ""}</a><span className="block font-mono text-xs text-muted-foreground">{v.createdAt.slice(0, 10)}</span></td>
                <td><span className="badge badge-muted">{status.replace("_", " ")}</span></td>
                <td className="font-mono text-xs">{v.model}</td>
                <td className="font-mono">${v.estCostUsd.toFixed(4)}</td>
              </tr>
            ))}</tbody>
          </table></div>}
      </div>

      <div className="card">
        <h2 className="h-display text-xl">Spend ledger ({db.usage.length})</h2>
        {db.usage.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No provider usage yet — run a brief and every cent lands here.</p> :
          <div className="mt-2 max-h-64 space-y-1 overflow-y-auto">
            {db.usage.slice().reverse().slice(0, 30).map((u) => (
              <p key={u.id} className="border-t border-border py-1.5 font-mono text-xs"><span className="text-muted-foreground">{u.createdAt.slice(0, 16).replace("T", " ")}</span> · {u.provider} · {u.quantity.toLocaleString()} {u.unit} · ${u.estimatedCost.toFixed(4)}{u.meta?.estimated ? " · est" : ""}</p>
            ))}
          </div>}
      </div>

      <div className="card">
        <h2 className="h-display text-xl">Audit trail ({db.audit.length})</h2>
        <div className="mt-2 max-h-64 space-y-1 overflow-y-auto">
          {db.audit.slice().reverse().slice(0, 30).map((a) => <p key={a.id} className="border-t border-border py-1.5 font-mono text-xs"><span className="text-muted-foreground">{a.createdAt.slice(0, 16).replace("T", " ")}</span> · {a.action} · {a.resourceType}/{a.resourceId.slice(0, 24)}</p>)}
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          <a href="/history" className="btn btn-outline btn-sm">Full history →</a>
          <a href="/api/export/workspace" className="btn btn-outline btn-sm">⬇ Export workspace JSON</a>
          <form action={requestDeletion}><button className="btn btn-danger btn-sm" type="submit">Request workspace deletion</button></form>
        </div>
      </div>
    </div>
  );
}
