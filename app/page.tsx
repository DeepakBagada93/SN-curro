import type { Metadata } from "next";
import { ALSO_INCLUDED, AUDIENCES, BEFORE_AFTER, FAQS, FEATURES, LOOP, PITCH, PRIMARY_FORMATS, PROBLEMS, SAMPLE_ASSET } from "@/lib/content";
import { Reveal } from "@/components/motion";

export const metadata: Metadata = {
  title: "Curro — the Agency Knowledge OS",
  description:
    "One approved knowledge brain per client, a month planner, six content formats, a claim ledger that blocks unsupported lines, client review links and a publishing calendar. Built for SEO and content agencies."
};

const LOOP_SHORT = ["Knowledge", "Plan", "Draft", "Claim check", "Approve", "Publish"];

const STATS = [
  { value: 1, label: "approved knowledge brain per client", suffix: "" },
  { value: 4, label: "primary formats: LinkedIn, X, reel, SEO", suffix: "" },
  { value: 0, label: "posts published without approval", suffix: "" },
  { value: 5, label: "steps from empty workspace to scheduled post", suffix: "" }
];

export default function Landing() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="orb left-[-120px] top-[-80px] h-72 w-72 bg-accent/20" aria-hidden />
        <div className="orb right-[-100px] top-[120px] h-64 w-64 bg-accent/10" style={{ animationDelay: "-5s" }} aria-hidden />
        <div className="container-x relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="badge badge-accent rise">● 3-Day Free Trial · Zero Card Required</p>
            <h1 className="h-display rise rise-1 mt-5 max-w-2xl text-4xl leading-[1.05] md:text-6xl">
              Every client. One <span className="text-accent">approved brain</span>. Content that survives review.
            </h1>
            <p className="prose-muted rise rise-2 mt-5 max-w-xl text-lg">
              {PITCH} Curro stores what each client has approved, plans the month, drafts LinkedIn posts, X threads, reel scripts and SEO articles from that knowledge, and blocks unsupported claims before anything ships.
            </p>
            <div className="rise rise-3 mt-8 flex flex-wrap gap-3">
              <a href="/signup" className="btn btn-accent btn-lg btn-glow">Start 3-Day Free Trial →</a>
              <a href="/clients" className="btn btn-outline btn-lg">Open Dashboard</a>
            </div>
            <p className="rise rise-4 mt-4 text-xs text-muted-foreground">
              3-day full-access trial · No credit card or UPI required · 100% Indian GST compliant
            </p>
          </div>

          <Reveal delay={140}>
            <div className="card float-y overflow-hidden !p-0" style={{ animationDuration: "10s" }}>
              <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-5 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Demo workspace</p>
                  <p className="font-display text-lg font-semibold">Northfield University</p>
                </div>
                <span className="badge badge-success">9 approved</span>
              </div>
              <div className="space-y-3 p-5">
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Brand fact</p>
                    <span className="badge badge-success">approved</span>
                  </div>
                  <p className="mt-1 text-sm font-medium">36 credits over 24–30 months, evening delivery.</p>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">SEO research</p>
                    <span className="badge badge-success">approved</span>
                  </div>
                  <p className="mt-1 text-sm font-medium">Part-time MBA intent cluster · working professionals.</p>
                </div>
                <div className="rounded-xl border border-warning/40 bg-warning/5 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-warning">Claim ledger</p>
                    <span className="badge badge-warning">1 blocked</span>
                  </div>
                  <p className="mt-1 text-sm">“Graduates earn 40% more” has no client source. Approval is blocked until it is removed.</p>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-xl bg-accent/5 px-3 py-2 text-xs">
                  <span className="font-semibold text-accent">SEO article → LinkedIn → X thread</span>
                  <span className="text-muted-foreground">one source of truth</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* LOOP MARQUEE */}
      <section className="marquee border-y border-border bg-card py-5" aria-label="The Curro loop">
        <div className="marquee-track items-center gap-3 text-sm font-semibold">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center gap-3" aria-hidden={copy === 1}>
              {LOOP_SHORT.map((s, i) => (
                <span key={`${copy}-${s}`} className="flex items-center gap-3">
                  <span className={i === 3 ? "text-accent" : ""}>{s}</span>
                  <span className="pr-3 text-accent" aria-hidden>→</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="container-x py-12 md:py-16">
        <div className="grid gap-4 text-center sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 80}>
              <div className="card !py-6">
                <p className="font-display text-4xl font-semibold text-accent">
                  {s.value}{s.suffix}
                </p>
                <p className="prose-muted mt-1 text-sm">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PROBLEM */}
      <section className="container-x py-8 md:py-12">
        <Reveal>
          <p className="eyebrow">The agency problem</p>
          <h2 className="h-display mt-2 max-w-3xl text-3xl md:text-4xl">
            Agencies don&apos;t have a content problem. They have a knowledge problem.
          </h2>
          <p className="prose-muted mt-3 max-w-2xl">
            The work is not typing. It is remembering what is true for each client, turning it into a plan, and proving every sentence before it goes out.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PROBLEMS.map((p, i) => (
            <Reveal key={p.title} delay={i * 80}>
              <div className="card card-hover h-full">
                <div className="float-y text-2xl" style={{ animationDelay: `${i * 0.9}s` }} aria-hidden>{p.icon}</div>
                <h3 className="mt-3 font-semibold">{p.title}</h3>
                <p className="prose-muted mt-1 text-sm">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mt-16 border-y border-border bg-card md:mt-20">
        <div className="container-x py-16 md:py-24">
          <Reveal>
            <p className="eyebrow">The loop</p>
            <h2 className="h-display mt-2 max-w-2xl text-3xl md:text-4xl">Approved knowledge first. Copy last.</h2>
            <p className="prose-muted mt-3 max-w-2xl">
              Six steps, one workspace. Every step leaves a record, so the next person can pick up the account without a handover call.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {LOOP.map((s, i) => (
              <Reveal key={s.n} delay={(i % 3) * 90}>
                <div className="card card-hover h-full">
                  <div className="flex items-center justify-between">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-accent/10 font-display text-sm font-bold text-accent" aria-hidden>{s.n}</span>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">{LOOP_SHORT[i]}</span>
                  </div>
                  <h3 className="mt-3 font-semibold">{s.title}</h3>
                  <p className="prose-muted mt-1 text-sm">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href="/how-it-works" className="btn">Walk through a real client →</a>
            <p className="text-xs text-muted-foreground">Demo data included. Nothing is published without approval.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container-x py-16 md:py-24">
        <Reveal>
          <p className="eyebrow">Inside the workspace</p>
          <h2 className="h-display mt-2 max-w-2xl text-3xl md:text-4xl">Everything the account needs, in the order the work happens.</h2>
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 90}>
              <div className="card card-hover h-full">
                <div className="text-2xl transition-transform duration-300 hover:scale-125" aria-hidden>{f.icon}</div>
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="prose-muted mt-1 text-sm">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={120}>
          <div className="card mt-8">
            <p className="label">Also in every workspace</p>
            <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
              {ALSO_INCLUDED.map((item) => (
                <li key={item} className="flex gap-2 text-muted-foreground"><span className="text-success" aria-hidden>✓</span>{item}</li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>

      {/* PRIMARY FORMATS */}
      <section className="border-y border-border bg-card">
        <div className="container-x py-16 md:py-24">
          <Reveal>
            <p className="eyebrow">Primary formats</p>
            <h2 className="h-display mt-2 max-w-2xl text-3xl md:text-4xl">Four formats. One approved source of truth.</h2>
            <p className="prose-muted mt-3 max-w-2xl">
              The formats agencies actually sell every week. Each one is generated from the same client brain, with the same claim ledger attached — so channel speed never outruns accuracy.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PRIMARY_FORMATS.map((f, i) => (
              <Reveal key={f.id} delay={i * 90}>
                <div className="card card-hover flex h-full flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <span className="badge badge-accent">{f.channel}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{f.tag}</span>
                  </div>
                  <h3 className="mt-3 font-display text-xl font-semibold">{f.label}</h3>
                  <p className="mt-1 font-mono text-[11px] leading-relaxed text-accent">{f.shape}</p>
                  <p className="prose-muted mt-2 flex-1 text-sm">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">Supporting formats: newsletter, FAQ block, social caption.</p>
        </div>
      </section>

      {/* AUDIENCES */}
      <section className="border-y border-border bg-card">
        <div className="container-x py-16 md:py-24">
          <Reveal>
            <p className="eyebrow">Who it is for</p>
            <h2 className="h-display mt-2 max-w-2xl text-3xl md:text-4xl">Built for the people who own the account.</h2>
            <p className="prose-muted mt-3 max-w-2xl">Not a tool for one channel or one person. A shared brain for the team that has to remember everything.</p>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {AUDIENCES.map((a, i) => (
              <Reveal key={a.tag} delay={i * 100}>
                <div className="card card-hover h-full">
                  <p className="badge badge-accent">{a.tag}</p>
                  <h3 className="mt-3 font-display text-xl font-semibold">{a.title}</h3>
                  <p className="prose-muted mt-2 text-sm">{a.body}</p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-accent">{a.proof}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section className="container-x py-16 md:py-24">
        <div className="grid items-start gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <div>
              <p className="eyebrow">The shift</p>
              <h2 className="h-display mt-2 text-3xl md:text-4xl">Replace the handover, not the strategist.</h2>
              <p className="prose-muted mt-3">
                Curro does not choose the angle for you. It makes sure the angle is grounded, the plan is visible, and the client sees exactly what they are approving.
              </p>
              <a href="/getting-started" className="btn mt-6">See the 5-step setup →</a>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="card overflow-hidden !p-0">
              <div className="grid grid-cols-2 border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <p className="px-4 py-3">Before</p>
                <p className="px-4 py-3">With Curro</p>
              </div>
              {BEFORE_AFTER.map((row) => (
                <div key={row.before} className="grid grid-cols-2 border-b border-border text-sm last:border-0">
                  <p className="px-4 py-3 text-muted-foreground">{row.before}</p>
                  <p className="px-4 py-3 font-medium">{row.after}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* SAMPLE ASSET */}
      <section className="border-y border-border bg-card">
        <div className="container-x grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <Reveal>
            <div>
              <p className="eyebrow">A real artefact</p>
              <h2 className="h-display mt-2 text-3xl md:text-4xl">See what the client actually reviews.</h2>
              <p className="prose-muted mt-3">
                Not a chat transcript. A titled draft, the angle behind it, every claim classified, and a clear reason the third line cannot ship yet.
              </p>
              <ul className="mt-5 space-y-2 text-sm">
                <li className="flex gap-2"><span className="text-success" aria-hidden>✓</span>Facts cite the exact approved knowledge item</li>
                <li className="flex gap-2"><span className="text-warning" aria-hidden>◐</span>Opinions stay labelled as opinions</li>
                <li className="flex gap-2"><span className="text-destructive" aria-hidden>✕</span>Unsupported lines block approval</li>
              </ul>
              <a href="/brief" className="btn mt-6">Open the live workspace →</a>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="card !p-0 float-y overflow-hidden" style={{ animationDuration: "9s" }}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/50 px-5 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{SAMPLE_ASSET.client}</p>
                  <p className="text-xs text-muted-foreground">{SAMPLE_ASSET.format}</p>
                </div>
                <span className="badge badge-warning">in review</span>
              </div>
              <div className="p-5">
                <p className="font-display text-lg font-semibold leading-snug">{SAMPLE_ASSET.title}</p>
                <p className="prose-muted mt-2 text-sm">{SAMPLE_ASSET.body}</p>
                <p className="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs"><span className="font-semibold">Angle: </span>{SAMPLE_ASSET.angle}</p>
                <div className="mt-4 space-y-2">
                  {SAMPLE_ASSET.claims.map((c) => {
                    const tone = c.status === "cited" ? "border-success/40 bg-success/5" : c.status === "labelled" ? "border-warning/40 bg-warning/5" : "border-destructive/40 bg-destructive/5";
                    return (
                      <div key={c.text} className={`rounded-lg border px-3 py-2 text-xs ${tone}`}>
                        <p><strong className="uppercase">{c.kind}:</strong> {c.text}</p>
                        <p className="mt-1 text-muted-foreground">{c.note}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="container-x py-16 text-center md:py-24">
        <Reveal>
          <p className="eyebrow">Pricing</p>
          <h2 className="h-display mx-auto mt-2 max-w-xl text-3xl md:text-4xl">Priced per workspace. Not per prompt.</h2>
          <p className="prose-muted mx-auto mt-3 max-w-2xl">
            One client on Solo, a handful on Studio, twenty on Agency. Every plan includes the knowledge brain, the claim ledger, client review links and the publishing calendar. Free while billing is in beta.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href="/pricing" className="btn btn-outline transition-transform hover:-translate-y-0.5">Compare plans →</a>
            <a href="/signup" className="btn btn-accent">Start 3-Day Free Trial →</a>
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-card">
        <div className="container-x max-w-3xl py-16 md:py-24">
          <Reveal>
            <p className="eyebrow">Questions</p>
            <h2 className="h-display mt-2 text-3xl md:text-4xl">Asked by agencies, answered plainly.</h2>
          </Reveal>
          <div className="mt-8 space-y-3">
            {FAQS.map((f, i) => (
              <Reveal key={f.q} delay={Math.min(i, 3) * 60}>
                <details className="card card-hover !p-4">
                  <summary className="cursor-pointer font-semibold">{f.q}</summary>
                  <p className="prose-muted mt-2 text-sm">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-center text-sm">
            <a href="/pricing" className="font-semibold text-accent hover:underline">See plans and limits →</a>
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden">
        <div className="orb left-1/2 top-[-100px] h-80 w-80 -translate-x-1/2 bg-accent/15" aria-hidden />
        <div className="container-x relative py-16 text-center md:py-24">
          <Reveal>
            <h2 className="h-display mx-auto max-w-2xl text-3xl md:text-5xl">Build the brain. The drafts get easier.</h2>
            <p className="prose-muted mx-auto mt-4 max-w-xl">
              Create a workspace, add one client, approve a handful of facts. Your first claim-checked draft is five steps away.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href="/signup" className="btn btn-accent btn-lg btn-glow">Start 3-Day Free Trial →</a>
              <a href="/clients" className="btn btn-outline btn-lg">Explore Dashboard</a>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
