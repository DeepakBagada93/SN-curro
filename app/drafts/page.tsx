import type { Metadata } from "next";
import { loadDB } from "@/lib/store";
import { ScoreBar } from "@/components/ui";

export const metadata: Metadata = { title: "Drafts" };
export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  draft: "badge-muted", in_review: "badge-accent", approved: "badge-success", rejected: "badge-danger", archived: "badge-muted"
};

export default async function DraftsPage({ searchParams }: { searchParams: { status?: string } }) {
  const db = await loadDB();
  const filter = searchParams.status && searchParams.status !== "all" ? searchParams.status : null;
  const assets = db.assets.filter((a) => !filter || a.status === filter).slice().reverse();
  const counts = Object.fromEntries(["draft", "in_review", "approved", "rejected", "archived"].map((s) => [s, db.assets.filter((a) => a.status === s).length]));

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Workspace</p>
        <h1 className="h-display text-3xl md:text-4xl">Drafts</h1>
        <p className="prose-muted mt-1 max-w-2xl text-sm">Every LinkedIn draft, its version history, and its Claim Ledger. Nothing here publishes — approve means approved by you, for copying.</p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {["all", "draft", "in_review", "approved", "rejected", "archived"].map((s) => (
          <a key={s} href={s === "all" ? "/drafts" : `/drafts?status=${s}`}
            className={`badge ${(!filter && s === "all") || filter === s ? "badge-accent" : "badge-muted"} !px-3 !py-1.5`}>
            {s === "in_review" ? "in review" : s} · {s === "all" ? db.assets.length : counts[s] ?? 0}
          </a>
        ))}
      </div>

      {assets.length === 0 ? (
        <div className="card">
          <div className="empty">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-2xl" aria-hidden>✎</div>
            <h3 className="h-display mt-4 text-lg">{db.signals.length === 0 ? "No drafts yet — run a brief first" : "No drafts with this status"}</h3>
            <p className="prose-muted mt-1 max-w-md text-sm">Drafts are born from a Signal Card plus your explicit angle. Open a signal, own the angle, generate — the ledger comes attached.</p>
            <a href="/brief" className="btn btn-accent mt-4">Go to this week&apos;s brief</a>
          </div>
        </div>
      ) : (
        <div className="anim-list grid gap-4 md:grid-cols-2">
          {assets.map((a) => {
            const v = db.versions.filter((x) => x.assetId === a.id).sort((x, y) => y.version - x.version)[0];
            const signal = db.signals.find((s) => s.id === a.signalCardId);
            const open = db.claims.filter((c) => c.versionId === v?.id && c.reviewStatus === "open").length;
            return (
              <a key={a.id} href={`/drafts/${a.id}`} className="card card-hover">
                <div className="flex items-center justify-between gap-2">
                  <span className={`badge ${STATUS_STYLE[a.status]}`}>{a.status.replace("_", " ")} · v{a.currentVersion}</span>
                  {open > 0 && <span className="badge badge-warning">{open} open claims</span>}
                </div>
                <p className="mt-2 font-display text-lg font-semibold leading-snug">{signal?.title ?? "Untitled signal"}</p>
                {v && <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{v.body.slice(0, 160)}…</p>}
                <div className="mt-3"><ScoreBar score={100 - open * 25} /></div>
                <p className="mt-2 text-xs text-muted-foreground">{a.createdAt.slice(0, 10)} · {v?.model ?? "manual"} · ~${(v?.estCostUsd ?? 0).toFixed(3)}</p>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
