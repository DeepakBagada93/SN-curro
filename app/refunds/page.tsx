import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refunds & Cancellations Policy — Curro",
  description:
    "Curro's transparent cancellation and refund policy. 7-day money-back guarantee, Cashfree refund processing timeline, and cancellation procedure."
};

export default function RefundsPage() {
  return (
    <div className="container-x max-w-4xl py-12 md:py-20">
      <div className="space-y-3 mb-10">
        <p className="eyebrow">Customer Protection</p>
        <h1 className="h-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
          Refunds & Cancellations Policy
        </h1>
        <p className="text-xs text-muted-foreground">
          Last updated: October 25, 2026 · Effective Date: October 25, 2026
        </p>
      </div>

      <div className="claude-card p-6 sm:p-10 space-y-8 bg-card border-border prose max-w-none text-foreground text-sm leading-relaxed">
        {/* Highlight Callout */}
        <div className="rounded-2xl border border-success/30 bg-success/5 p-5 text-xs text-foreground space-y-2">
          <div className="flex items-center gap-2 font-bold text-success text-sm">
            <span>🛡️</span>
            <span>Our 7-Day Risk-Free Money-Back Guarantee</span>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            At Curro, we take pride in our source-grounded claim ledger and client knowledge OS.
            If our software does not meet your agency's content and planning standards, you may request a <strong>100% full refund within 7 days</strong> of your initial subscription purchase. No hidden clauses.
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-xl text-foreground">1. Subscription Cancellation Policy</h2>
          <p className="text-muted-foreground">
            You can cancel your Curro subscription at any time without penalty:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs sm:text-sm pl-2">
            <li>
              <strong>Self-Serve Cancellation:</strong> Navigate to <strong>Settings → Plan & Usage</strong> within your Curro dashboard and click <em>"Cancel Subscription"</em> before your next billing date.
            </li>
            <li>
              <strong>Assisted Cancellation:</strong> You can also email our billing team at <a href="mailto:support@curro.in" className="text-accent underline">support@curro.in</a> with your registered email and workspace ID.
            </li>
            <li>
              <strong>Access After Cancellation:</strong> Upon cancellation, your access remains active until the end of the current paid billing cycle. You will not be charged for subsequent periods.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-xl text-foreground">2. Refund Eligibility & Rules</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground text-xs sm:text-sm pl-2">
            <li>
              <strong>First-Time Subscriptions:</strong> Full refunds are honored within <strong>7 calendar days</strong> of the original transaction date for monthly and annual plans.
            </li>
            <li>
              <strong>Recurring Monthly Renewals:</strong> Monthly renewal charges are non-refundable once the billing period has commenced. We notify customers prior to recurring renewals.
            </li>
            <li>
              <strong>Annual Plans:</strong> If requested after the initial 7-day window but within 30 days of purchase, annual plans may be refunded on a pro-rata basis (deducting the standard single-month price for used months).
            </li>
            <li>
              <strong>Fair Usage & Abuse Prevention:</strong> Accounts that have generated bulk exports, scraped thousands of pages, or engaged in fraudulent activity are ineligible for refunds under this policy.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-xl text-foreground">3. Refund Processing Timeline & Method</h2>
          <p className="text-muted-foreground">
            All refunds are initiated and processed through our authorized payment gateway partner, <strong>Cashfree Payments India</strong>:
          </p>
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs space-y-2">
            <p className="font-semibold text-foreground">Refund Destination:</p>
            <p className="text-muted-foreground leading-relaxed">
              Refunds are strictly credited back to the <strong>original payment method</strong> used during checkout (Original UPI ID, Debit Card, Credit Card, or NetBanking account) in accordance with Reserve Bank of India (RBI) payment guidelines.
            </p>
            <p className="font-semibold text-foreground pt-1">Processing Duration:</p>
            <p className="text-muted-foreground leading-relaxed">
              Once an eligible refund is approved by Curro (within 24 business hours), <strong>Cashfree Payments</strong> processes the transaction within <strong>5 to 7 business days</strong>. The exact credit posting time depends on your issuing bank or UPI handle.
            </p>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-xl text-foreground">4. Free Trial Policy</h2>
          <p className="text-muted-foreground">
            Curro provides a <strong>3-Day Full-Access Free Trial</strong> for new users with zero credit card or UPI mandate commitment required. Users are encouraged to test knowledge ingestion, claim checking, and draft generation before making any financial commitment.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-xl text-foreground">5. How to Request a Refund</h2>
          <p className="text-muted-foreground">
            To request a refund, please follow these simple steps:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground text-xs sm:text-sm pl-2">
            <li>Send an email to <a href="mailto:support@curro.in" className="text-accent font-semibold underline">support@curro.in</a> with the subject line <code>Refund Request - [Your Workspace Name]</code>.</li>
            <li>Include your Cashfree Order ID / Payment Reference ID and registered email address.</li>
            <li>Share a brief note explaining the reason (optional, helps us improve our product).</li>
          </ol>
          <p className="text-muted-foreground text-xs pt-1">
            Our finance team will acknowledge receipt within 1 business day and process the refund via Cashfree.
          </p>
        </section>

        <section className="space-y-2 pt-2 border-t border-border">
          <h2 className="font-display font-semibold text-base text-foreground">6. Need Help?</h2>
          <p className="text-muted-foreground text-xs">
            For any queries regarding cancellations, payment receipts, or billing adjustments:
          </p>
          <p className="text-xs text-foreground font-mono">
            Support Email: support@curro.in / billing@curro.in<br />
            Helpline: +91 94092 11982 (Mon-Fri 9:00 AM - 6:00 PM IST)<br />
            Address: Curro Technologies, Moti Palace Compound, Junagadh, Gujarat 362001, India
          </p>
        </section>
      </div>
    </div>
  );
}
