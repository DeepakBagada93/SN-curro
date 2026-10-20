import type { Metadata } from "next";
import { loadDB } from "@/lib/store";

export const metadata: Metadata = { title: "Getting started", description: "Five steps from an empty agency workspace to a scheduled, knowledge-grounded post: client, approved knowledge, plan, claim-checked draft, approval." };
export const dynamic = "force-dynamic";

const STEPS = [
  { id: "client", title: "Add your first client", body: "Name, audience, voice, timezone, restricted claims. Everything downstream is scoped to this client.", href: "/clients" },
  { id: "knowledge", title: "Approve the knowledge", body: "Add brand facts, source documents, SEO research and writing guidelines. Approve the only material the studio may use.", href: "/clients" },
  { id: "plan", title: "Plan the month", body: "Generate a 30-day skeleton from approved knowledge, then edit dates, owners and channels.", href: "/planner" },
  { id: "draft", title: "Draft in the studio", body: "Pick LinkedIn, X, reel script or SEO article, attach sources, and generate. Resolve unsupported lines in the claim ledger before approval.", href: "/studio" },
  { id: "publish", title: "Approve, review, schedule", body: "Clear unsupported claims, approve, share a seven-day client link, then schedule once a channel is connected.", href: "/studio" }
];

export default async function GettingStarted() {
  const db = await loadDB();
  const client = db.clients[0];
  const approved = db.knowledgeItems.filter((k) => k.status === "approved").length;
  const done = {
    client: db.clients.length > 0,
    knowledge: approved > 0,
    plan: db.planItems.length > 0,
    draft: db.assets.some((a) => a.clientId),
    publish: db.posts.some((p) => p.status === "scheduled" || p.status === "published")
  };
  const finished = Object.values(done).filter(Boolean).length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="eyebrow">Onboarding</p>
        <h1 className="h-display text-3xl md:text-4xl">From empty workspace to a client-ready content engine.</h1>
        <p className="prose-muted mt-1 text-sm">Five steps per client, in order. {finished} of 5 complete — this checklist reads your actual workspace, not a tour script.</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${finished} of 5 steps complete`}>
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(finished / 5) * 100}%` }} />
      </div>
      <ol className="space-y-3">
        {STEPS.map((s, i) => {
          const isDone = done[s.id as keyof typeof done];
          const href = s.href === "/clients" && client && done.client ? `/clients/${client.id}` : s.href;
          return (
            <li key={s.id} className={`card flex gap-4 ${isDone ? "opacity-90" : ""}`}>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-sm font-bold ${isDone ? "bg-success text-success-foreground" : "bg-accent/10 text-accent"}`} aria-hidden>{isDone ? "✓" : i + 1}</span>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">{s.title} {isDone && <span className="badge badge-success ml-1">done</span>}</h2>
                <p className="prose-muted mt-0.5 text-sm">{s.body}</p>
                {!isDone && <a href={href} className="btn btn-sm mt-2">Do this step →</a>}
              </div>
            </li>
          );
        })}
      </ol>
      {finished === 5 && (
        <div className="alert alert-warning" role="status"><strong>Full loop complete.</strong> You have a client knowledge brain, an approved plan, a claim-checked draft, and a scheduled post. Next month, reuse the brain and only update what changed.</div>
      )}
      <p className="text-xs text-muted-foreground">Plan caps apply to clients, generations and images. Client review links expire after seven days, and unsupported claims always block approval.</p>
    </div>
  );
}
