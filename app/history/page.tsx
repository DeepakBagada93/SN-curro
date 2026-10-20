import type { Metadata } from "next";
import { loadDB } from "@/lib/store";

export const metadata: Metadata = { title: "History", description: "Every research run, draft, edit, and approval in one timeline." };
export const dynamic = "force-dynamic";

type Entry = { at: string; kind: string; title: string; body: string; href: string | null };

export default async function HistoryPage({ searchParams }: { searchParams: { kind?: string; q?: string } }) {
  const db = await loadDB();
  const kind = searchParams.kind && searchParams.kind !== "all" ? searchParams.kind : null;
  const q = (searchParams.q ?? "").toLowerCase();

  const entries: Entry[] = [
    ...db.runs.map((r) => ({
      at: r.createdAt, kind: "brief",
      title: `Brief run ${r.id.slice(-6)} — ${r.status}`,
      body: `${r.themes.join(" · ")} · ${r.usage.results} results · ~$${r.usage.estCostUsd.toFixed(3)}`,
      href: "/brief" as string | null
    })),
    ...db.versions.map((v) => {
      const asset = db.assets.find((a) => a.id === v.assetId);
      const signal = db.signals.find((s) => s.id === asset?.signalCardId);
      return {
        at: v.createdAt, kind: asset?.status === "approved" ? "approved" : "draft",
        title: `Draft v${v.version} ${asset ? `— ${asset.status.replace("_", " ")}` : ""}`,
        body: (signal?.title ?? "Untitled signal").slice(0, 90),
        href: `/drafts/${v.assetId}`
      };
    }),
    ...db.audit.filter((a) => a.action.startsWith("signal.") || a.action.startsWith("angle.") || a.action.startsWith("memory.") || a.action.startsWith("brand.")).map((a) => ({
      at: a.createdAt, kind: "editorial",
      title: a.action.replace(/\./g, " · ").replace(/_/g, " "),
      body: `${a.resourceType} ${a.resourceId.slice(0, 18)}`,
      href: null
    }))
  ].sort((a, b) => (a.at < b.at ? 1 : -1));

  const kinds = ["all", "brief", "draft", "approved", "editorial"];
  const filtered = entries.filter((e) =>
    (!kind || e.kind === kind) &&
    (!q || (e.title + " " + e.body).toLowerCase().includes(q)));

  const KIND_BADGE: Record<string, string> = { brief: "badge-accent", draft: "badge-muted", approved: "badge-success", editorial: "badge-warning" };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="eyebrow">Workspace</p>
        <h1 className="h-display mt-1 text-3xl md:text-4xl">History.</h1>
        <p className="prose-muted mt-1 text-sm">Every run, draft, edit, and approval — newest first. The audit trail behind it lives in <a href="/settings/usage" className="text-accent hover:underline">Usage</a>.</p>
      </div>
      <form method="get" className="card flex flex-col gap-2 !py-4 sm:flex-row">
        <input name="q" defaultValue={searchParams.q ?? ""} className="input flex-1" placeholder="Search history…" aria-label="Search history" />
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by kind">
          {kinds.map((k) => (
            <a key={k} href={k === "all" && !q ? "/history" : `/history?kind=${k}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`badge ${(!kind && k === "all") || kind === k ? "badge-accent" : "badge-muted"} !px-3 !py-1.5`}>{k}</a>
          ))}
        </div>
        <button className="btn btn-sm" type="submit">Search</button>
      </form>
      {filtered.length === 0 ? (
        <div className="card"><div className="empty">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-2xl" aria-hidden>◷</div>
          <h3 className="h-display mt-4 text-lg">No history here yet</h3>
          <p className="prose-muted mt-1 max-w-md text-sm">Run a brief, save a signal, generate a draft — this timeline fills itself in as you work.</p>
          <a href="/brief" className="btn btn-accent mt-4">Start with a brief</a>
        </div></div>
      ) : (
        <ol className="relative space-y-3 border-l-2 border-border">
          {filtered.slice(0, 60).map((e, i) => (
            <li key={`${e.at}-${i}`} className="card relative ml-6 !py-4">
              <span className="absolute -left-[37px] top-4 h-4 w-4 rounded-full border-2 border-accent bg-background" aria-hidden />
              <div className="flex flex-wrap items-center gap-2">
                <span className={`badge ${KIND_BADGE[e.kind] ?? "badge-muted"}`}>{e.kind}</span>
                <span className="font-mono text-xs text-muted-foreground">{e.at.slice(0, 16).replace("T", " ")}</span>
              </div>
              <p className="mt-1 font-semibold">{e.title}</p>
              <p className="text-sm text-muted-foreground">{e.body}</p>
              {e.href && <a href={e.href} className="mt-1 inline-block text-sm font-semibold text-accent hover:underline">Open →</a>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
