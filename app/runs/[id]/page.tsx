import { notFound } from "next/navigation";
import { loadDB } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function RunDetail({ params }: { params: { id: string } }) {
  const db = await loadDB();
  const run = db.runs.find((r) => r.id === params.id);
  if (!run) notFound();
  const sources = db.sources.filter((s) => s.runId === run.id);
  const signals = db.signals.filter((s) => s.runId === run.id);
  const cost = db.usage.filter((u) => u.runId === run.id).reduce((a, u) => a + u.estimatedCost, 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <a href="/history" className="text-sm text-muted-foreground hover:text-foreground">← History</a>
      <div className="card">
        <span className={`badge ${run.status === "succeeded" ? "badge-success" : run.status === "partial" ? "badge-warning" : run.status === "failed" ? "badge-danger" : "badge-muted"}`}>{run.status}</span>
        <h1 className="h-display mt-2 text-3xl">Brief run {run.id.slice(-6)}</h1>
        <p className="prose-muted mt-1 text-sm">Triggered {run.trigger} · {run.createdAt.slice(0, 16).replace("T", " ")}{run.finishedAt ? ` → finished ${run.finishedAt.slice(0, 16).replace("T", " ")}` : " · still running"}</p>
        <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
          {[["Queries", String(run.usage.queries)], ["Results", String(run.usage.results)], ["Est. cost", `~$${cost.toFixed(3)}`]].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-muted/50 p-3"><dt className="label !mb-0">{k}</dt><dd className="font-display text-xl font-semibold">{v}</dd></div>
          ))}
        </dl>
        <p className="mt-3 text-sm"><span className="font-semibold">Themes:</span> {run.themes.join(" · ")}</p>
        {run.warnings.map((w) => <p key={w} className="alert alert-warning mt-2">⚠ {w}</p>)}
        <a href={`/api/export/brief/${run.id}`} className="btn btn-outline btn-sm mt-3">⬇ Export brief (.md)</a>
      </div>
      <div className="card">
        <h2 className="h-display text-xl">Signals ({signals.length})</h2>
        {signals.map((s) => <a key={s.id} href={`/signals/${s.id}`} className="mt-2 block rounded-xl border border-border p-3 text-sm hover:border-accent/40"><strong>{s.title}</strong><span className="block text-xs text-muted-foreground">{s.status} · {s.score.total} pts</span></a>)}
      </div>
      <div className="card">
        <h2 className="h-display text-xl">Sources ({sources.length})</h2>
        {sources.map((s) => <p key={s.id} className="mt-2 border-t border-border pt-2 text-sm"><a href={s.canonicalUrl} target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">{s.title} ↗</a><span className="block font-mono text-xs text-muted-foreground">{s.publisher} · {s.query}</span></p>)}
      </div>
    </div>
  );
}
