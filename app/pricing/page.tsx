import type { Metadata } from "next";
import { COMPARISON, PRICING_FAQS } from "@/lib/content";
import { PricingTable } from "@/components/pricing-table";
import { Reveal } from "@/components/motion";

export const metadata: Metadata = {
  title: "Pricing — Made for Indian Agencies & Export Businesses",
  description:
    "Curro pricing engineered for Indian digital marketing, performance & SEO agencies: client knowledge brains, automated 30-day planner, claim-verified AI drafts, client approval links and publishing calendar."
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
        <p className="eyebrow rise">India-First Pricing</p>
        <h1 className="h-display rise rise-1 mt-3 text-4xl md:text-5xl">
          Priced for Indian agencies. Built to scale client context.
        </h1>
        <p className="prose-muted rise rise-2 mt-4 text-lg">
          Replace 5 fragmented tools and stop paying ₹30,000/mo for manual rewriting. Curro gives your agency verified client memory, claim-checked AI drafts, and seat-free review links at transparent Indian pricing.
        </p>
        <p className="rise rise-3 mt-4 inline-flex items-center gap-2 rounded-full border border-success/40 bg-success/5 px-4 py-2 text-sm text-success">
          <span>🇮🇳</span> Launch Pricing · 100% GST Invoices with ITC · UPI & RuPay Supported
        </p>
      </section>

      <section className="container-x max-w-6xl pb-16">
        <PricingTable />

        {/* Cashfree Payment Gateway & Compliance Banner */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="font-semibold text-sm text-foreground">
                  Secured by Cashfree Payments India
                </p>
                <p className="text-xs text-muted-foreground">
                  PCI-DSS Level 1 compliant gateway · 256-bit bank-grade encryption
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="rounded-md border border-border bg-muted/60 px-2 py-1">UPI (GPay / PhonePe / Paytm)</span>
              <span className="rounded-md border border-border bg-muted/60 px-2 py-1">RuPay Cards</span>
              <span className="rounded-md border border-border bg-muted/60 px-2 py-1">Visa / Mastercard</span>
              <span className="rounded-md border border-border bg-muted/60 px-2 py-1">NetBanking (50+ Banks)</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 text-xs">
            <div>
              <p className="font-semibold text-foreground mb-1">Billing Currency (INR - ₹)</p>
              <p className="text-muted-foreground leading-relaxed">
                All subscriptions are billed strictly in <strong>Indian Rupees (INR)</strong> with transparent pricing. Zero currency conversion fees.
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Instant Digital Delivery</p>
              <p className="text-muted-foreground leading-relaxed">
                Software access and token limits are instantly unlocked upon successful Cashfree transaction confirmation.
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">7-Day Refund Policy</p>
              <p className="text-muted-foreground leading-relaxed">
                100% money-back guarantee within 7 days. Refunds processed to original payment method via Cashfree within 5-7 business days.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/80 text-[11px] text-muted-foreground">
            <span>GST invoices generated automatically with full ITC compliance.</span>
            <div className="flex items-center gap-4">
              <a href="/terms" className="hover:text-foreground underline">Terms & Conditions</a>
              <a href="/refunds" className="hover:text-foreground underline">Refund Policy</a>
              <a href="/privacy" className="hover:text-foreground underline">Privacy Policy</a>
              <a href="/contact" className="hover:text-foreground underline">Billing Support</a>
            </div>
          </div>
        </div>
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
