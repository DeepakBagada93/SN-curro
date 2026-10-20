import type { Metadata } from "next";
import { LOOP } from "@/lib/content";
import { Reveal } from "@/components/motion";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "The Curro loop for agencies: client knowledge brain → month plan → claim-checked draft → agency and client approval → publishing calendar. Approved knowledge first, copy last."
};

const DELIVERABLES = [
  "Approved knowledge items with provenance",
  "A dated plan with channels, pillars and owners",
  "A versioned LinkedIn post, X thread, reel script or SEO article",
  "A claim ledger: cited, labelled, blocked",
  "Agency sign-off plus a signed client link",
  "A scheduled post and a status log"
];

const GUARDRAILS = [
  {
    title: "No drafts without approved knowledge",
    body: "The studio refuses to generate for a client with nothing approved. An empty brain produces an empty studio, not a plausible guess."
  },
  {
    title: "No unsupported claim at approval",
    body: "Facts must cite an approved knowledge item. Opinion is allowed when it is labelled. An open unsupported line blocks the approval button."
  },
  {
    title: "No client review without a signed link",
    body: "Review links are HMAC-signed and expire after seven days. The client sees the draft, the image and the claim ledger — no login, no seat."
  },
  {
    title: "No publishing without approval",
    body: "An asset can only be scheduled after internal approval, and the client link can still block it. There is no auto-publish switch and no engagement automation."
  },
  {
    title: "No silent cap overage",
    body: "Clients, generations and images are checked against the plan before a provider call. At the cap you get a clear message and a number."
  },
  {
    title: "No invented experience or results",
    body: "Curro does not write customer stories, case-study numbers or personal experience you did not supply. The ledger marks the boundary; a human signs it."
  }
];

const WEEK = [
  { when: "Monday", title: "Load the account", body: "Add the client, paste the brand facts, attach the program pages and tag the SEO research. Items enter as candidates." },
  { when: "Monday", title: "Approve what is true", body: "A strategist approves the facts, audience notes and restricted claims. That becomes the only material drafts can use." },
  { when: "Tuesday", title: "Plan the month", body: "Generate a dated skeleton across blog, LinkedIn, X and newsletter, then assign owners and adjust the mix." },
  { when: "Wednesday", title: "Draft and check", body: "Generate the article section and the LinkedIn post from the same sources. Resolve every blocked claim in the ledger." },
  { when: "Thursday", title: "Send the review link", body: "Approve internally, attach the image and alt text, then send the client a seven-day link. They approve or request changes." },
  { when: "Monday", title: "Publish and record", body: "Schedule the approved copy, watch the status move to published, and log the performance snapshot against the plan." }
];

export default function HowItWorks() {
  return (
    <div>
      <section className="container-x max-w-3xl py-16 text-center md:py-24">
        <p className="eyebrow rise">How it works</p>
        <h1 className="h-display rise rise-1 mt-3 text-4xl md:text-5xl">From client onboarding to published post — without losing the thread.</h1>
        <p className="prose-muted rise rise-2 mt-4 text-lg">
          Six steps, one workspace, a record at every handoff. Here is exactly what happens — and the six things Curro refuses to do.
        </p>
      </section>

      <section className="container-x max-w-3xl pb-8">
        <ol className="relative space-y-4 border-l-2 border-border pl-0">
          {LOOP.map((s, i) => (
            <Reveal key={s.n} delay={Math.min(i, 3) * 70}>
              <li className="card card-hover relative ml-6">
                <span className="absolute -left-[43px] grid h-9 w-9 place-items-center rounded-full bg-accent font-display text-sm font-bold text-accent-foreground" aria-hidden>{s.n}</span>
                <h2 className="h-display text-xl">{s.title}</h2>
                <p className="prose-muted mt-1 text-sm">{s.body}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-accent">Leaves behind</p>
                <p className="text-sm">{DELIVERABLES[i]}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="border-y border-border bg-card">
        <div className="container-x py-16 md:py-20">
          <p className="eyebrow">Guardrails</p>
          <h2 className="h-display mt-2 max-w-2xl text-3xl md:text-4xl">Six things Curro refuses to do.</h2>
          <p className="prose-muted mt-3 max-w-2xl">
            Trust is the product. These constraints are load-bearing — they hold even when they make the draft shorter or the workflow slower.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {GUARDRAILS.map((g, i) => (
              <Reveal key={g.title} delay={(i % 3) * 90}>
                <div className="card card-hover h-full">
                  <h3 className="font-semibold">{g.title}</h3>
                  <p className="prose-muted mt-1 text-sm">{g.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x max-w-4xl py-16 md:py-24">
        <Reveal>
          <p className="eyebrow">Illustrative workflow</p>
          <h2 className="h-display mt-2 text-3xl md:text-4xl">One account, one week.</h2>
          <p className="prose-muted mt-3 max-w-2xl">
            This is how the pieces fit together. It is not a customer story or a promise of turnaround time — it is the sequence the product enforces.
          </p>
        </Reveal>
        <div className="card mt-8 !p-0">
          {WEEK.map((w, i) => (
            <div key={`${w.when}-${w.title}`} className="grid gap-3 border-b border-border p-5 last:border-0 sm:grid-cols-[96px_1fr]">
              <div>
                <p className="badge badge-muted">{w.when}</p>
                <p className="mt-2 font-mono text-xs text-muted-foreground">step {String(i + 1).padStart(2, "0")}</p>
              </div>
              <div>
                <h3 className="font-semibold">{w.title}</h3>
                <p className="prose-muted mt-1 text-sm">{w.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="container-x max-w-3xl py-16 text-center md:py-20">
          <h2 className="h-display text-3xl md:text-4xl">See it on a real client.</h2>
          <p className="prose-muted mt-3">
            The workspace ships with a demo university account: approved knowledge, a November plan, claim-checked drafts and a client review path. Open it and follow the thread.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href="/clients" className="btn btn-accent btn-lg">Open the demo client</a>
            <a href="/pricing" className="btn btn-outline btn-lg">See pricing</a>
          </div>
        </div>
      </section>

      <section className="container-x max-w-3xl py-16 text-center md:py-20">
        <h2 className="h-display text-3xl md:text-4xl">Start with one account.</h2>
        <p className="prose-muted mt-3">Add a client, approve five facts, generate one claim-checked draft. That is enough to judge the loop.</p>
        <a href="/signup" className="btn btn-accent btn-lg mt-6">Create your workspace</a>
      </section>
    </div>
  );
}
