import type { Metadata } from "next";
import { COMPARISON, PRICING_FAQS } from "@/lib/content";
import { PLAN_CATALOG, PLAN_ORDER } from "@/lib/agency";
import { Reveal } from "@/components/motion";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Curro plans for solo consultants through multi-client agencies: client knowledge brains, planning, claim-checked drafts, client review links and a publishing calendar. Free during beta."
};

const TIER_DETAILS: Record<string, { cta: string; highlight?: boolean; rows: string[] }> = {
  solo: {
    cta: "Start with one client",
    rows: [
      "1 client Knowledge Brain",
      "30 generations / month",
      "10 branded images / month",
      "Planner, claim ledger, review links",
      "1 seat"
    ]
  },
  studio: {
    cta: "Start a studio",
    highlight: true,
    rows: [
      "5 client Knowledge Brains",
      "150 generations / month",
      "50 images / month",
      "Client review links + calendar",
      "2 seats"
    ]
  },
  agency: {
    cta: "Run the agency",
    rows: [
      "20 client Knowledge Brains",
      "600 generations / month",
      "200 images / month",
      "API keys + MCP tools",
      "10 seats"
    ]
  },
  enterprise: {
    cta: "Talk to us",
    rows: [
      "Custom client and generation caps",
      "Custom image allowance",
      "API keys, MCP and security review",
      "Dedicated onboarding",
      "Custom seats"
    ]
  }
};

const INCLUDED = [
  "One approved knowledge brain per client",
  "Month planner with channels, pillars and owners",
  "LinkedIn, X, reel script and SEO article formats",
  "Claim ledger that blocks unsupported approval",
  "Supporting newsletter, FAQ and caption formats",
  "Seven-day client review links, no seats",
  "Publishing calendar with retries",
  "Brand images with alt-text enforcement",
  "Full workspace export as JSON",
  "No auto-publishing, on any plan"
];

export default function Pricing() {
  return (
    <div>
      <section className="container-x max-w-3xl py-16 text-center md:py-24">
        <p className="eyebrow rise">Pricing</p>
        <h1 className="h-display rise rise-1 mt-3 text-4xl md:text-5xl">Priced per workspace, not per prompt.</h1>
        <p className="prose-muted rise rise-2 mt-4 text-lg">
          Generic writers charge for words. Curro charges for the account: approved client knowledge, a plan, claim-checked drafts, client approval and a publishing calendar.
        </p>
        <p className="rise rise-3 mt-4 inline-flex rounded-full border border-success/40 bg-success/5 px-4 py-2 text-sm text-success">
          Beta access is free today. Prices below are launch prices — no card required.
        </p>
      </section>

      <section className="container-x grid max-w-6xl gap-6 md:grid-cols-2 xl:grid-cols-4">
        {PLAN_ORDER.map((tier, i) => {
          const plan = PLAN_CATALOG[tier];
          const detail = TIER_DETAILS[tier];
          return (
            <Reveal key={tier} delay={i * 120}>
              <div className={`card card-hover flex h-full flex-col ${detail.highlight ? "!border-accent" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="h-display text-xl">{plan.label}</h2>
                  {detail.highlight && <span className="badge badge-accent">Most agencies</span>}
                </div>
                <p className="mt-2">
                  <span className="font-display text-5xl font-semibold">{plan.price}</span>{" "}
                  <span className="text-muted-foreground">{plan.cadence}</span>
                </p>
                <p className="prose-muted mt-2 text-sm">{plan.blurb}</p>
                <ul className="mt-4 flex-1 space-y-2 text-sm">
                  {detail.rows.map((r) => (
                    <li key={r} className="flex gap-2"><span className="text-success" aria-hidden>✓</span>{r}</li>
                  ))}
                </ul>
                <a href="/signup" className={`btn mt-6 w-full ${detail.highlight ? "btn-accent btn-glow" : "btn-outline"}`}>
                  {detail.cta}
                </a>
              </div>
            </Reveal>
          );
        })}
      </section>

      <section className="container-x max-w-5xl py-16">
        <h2 className="h-display text-center text-2xl md:text-3xl">Every plan includes the full loop.</h2>
        <p className="prose-muted mx-auto mt-2 max-w-xl text-center text-sm">Limits scale with the plan. The safeguards do not.</p>
        <div className="card mt-8">
          <ul className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {INCLUDED.map((item) => (
              <li key={item} className="flex gap-2"><span className="text-success" aria-hidden>✓</span>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="container-x max-w-5xl py-16">
          <Reveal>
            <p className="eyebrow">How limits work</p>
            <h2 className="h-display mt-2 text-2xl md:text-3xl">Clear caps, checked before every call.</h2>
          </Reveal>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="card h-full"><p className="font-semibold">Generations</p><p className="prose-muted mt-1 text-sm">One draft created or regenerated in the studio. Planning a slot costs nothing until you draft it.</p></div>
            <div className="card h-full"><p className="font-semibold">Images</p><p className="prose-muted mt-1 text-sm">Counted separately from drafts. If you hit the cap, generation stops with a number — never a silent overage.</p></div>
            <div className="card h-full"><p className="font-semibold">Clients and seats</p><p className="prose-muted mt-1 text-sm">Client reviewers do not consume seats. Seats are for the people doing the work inside the workspace.</p></div>
          </div>
        </div>
      </section>

      <section className="container-x max-w-5xl py-16">
        <h2 className="h-display text-center text-2xl md:text-3xl">Why not just use what you already pay for?</h2>
        <div className="card mt-8 overflow-x-auto !p-0">
          <table className="table-x min-w-[680px]">
            <thead>
              <tr>
                <th aria-label="Tool" />
                <th>Starting at</th>
                <th>Starts from</th>
                <th>Client context</th>
                <th>Claim control</th>
                <th>Ends at</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((c) => (
                <tr key={c.name} className={c.highlight ? "bg-accent/5 font-medium" : ""}>
                  <td className="font-semibold">{c.name}{c.highlight && <span className="badge badge-accent ml-2">Curro</span>}</td>
                  <td>{c.price}</td>
                  {c.row.map((cell) => <td key={cell} className="text-muted-foreground">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Anchors are indicative starting prices for adjacent categories, not like-for-like plans. Recheck before launch.
        </p>
      </section>

      <section className="border-t border-border bg-card">
        <div className="container-x max-w-3xl py-16">
          <Reveal>
            <p className="eyebrow">Pricing questions</p>
            <h2 className="h-display mt-2 text-3xl">The details agencies ask about.</h2>
          </Reveal>
          <div className="mt-8 space-y-3">
            {PRICING_FAQS.map((f, i) => (
              <Reveal key={f.q} delay={Math.min(i, 3) * 60}>
                <details className="card card-hover !p-4">
                  <summary className="cursor-pointer font-semibold">{f.q}</summary>
                  <p className="prose-muted mt-2 text-sm">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x max-w-3xl py-16 text-center">
        <h2 className="h-display text-3xl">The honest guarantee.</h2>
        <p className="prose-muted mt-3">
          If Curro does not earn a place in your client workflow, stop using it and take everything with you — full workspace export, deletion on request. No lock-in and no dark patterns.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href="/signup" className="btn btn-accent btn-lg">Create your workspace</a>
          <a href="/how-it-works" className="btn btn-outline btn-lg">See how it works</a>
        </div>
      </section>
    </div>
  );
}
