import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Curro",
  description:
    "How Curro protects your data, client knowledge facts, account information, and Cashfree payment security."
};

export default function PrivacyPage() {
  return (
    <div className="container-x max-w-4xl py-12 md:py-20">
      <div className="space-y-3 mb-10">
        <p className="eyebrow">Data Protection & Privacy</p>
        <h1 className="h-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
          Privacy Policy
        </h1>
        <p className="text-xs text-muted-foreground">
          Last updated: October 25, 2026 · Effective Date: October 25, 2026
        </p>
      </div>

      <div className="claude-card p-6 sm:p-10 space-y-8 bg-card border-border prose max-w-none text-foreground text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-display font-semibold text-xl text-foreground">1. Commitment to Privacy</h2>
          <p className="text-muted-foreground">
            Curro Technologies ("Curro", "we", "our") respects the privacy of our agency users and their clients.
            This Privacy Policy explains how we collect, process, store, and safeguard your personal information and uploaded client knowledge when you use our SaaS application.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-xl text-foreground">2. Information We Collect</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground text-xs sm:text-sm pl-2">
            <li>
              <strong>Account Information:</strong> Name, business email, agency name, contact phone number, and password credentials.
            </li>
            <li>
              <strong>Client Knowledge Data:</strong> Brand guidelines, approved facts, extracted website URLs, and draft copy submitted to your workspace. <em>Your client data is strictly segregated and never shared or used to train public models.</em>
            </li>
            <li>
              <strong>Payment & Billing Data:</strong> Transaction records, GSTIN, and billing address. <strong>Curro does not store sensitive card numbers or CVV.</strong> All financial transactions are securely tokenized and processed via our PCI-DSS compliant partner, <strong>Cashfree Payments</strong>.
            </li>
            <li>
              <strong>Log & Usage Metrics:</strong> IP addresses, browser types, generation token counters, and audit timestamps.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-xl text-foreground">3. How We Use Your Data</h2>
          <p className="text-muted-foreground">
            We use your data solely to provide, secure, and improve Curro services:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs sm:text-sm pl-2">
            <li>Grounding your AI drafts against approved facts in your Claim Ledger.</li>
            <li>Processing subscription billing, tax invoicing, and refunds via Cashfree Payments.</li>
            <li>Generating client review links and publishing schedules.</li>
            <li>Communicating product updates, transactional alerts, and customer support.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-xl text-foreground">4. Payment Security via Cashfree Payments</h2>
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 text-xs space-y-2">
            <p className="font-semibold text-foreground">PCI-DSS Level 1 Compliance:</p>
            <p className="text-muted-foreground leading-relaxed">
              All payment transactions are handled through <strong>Cashfree Payments India Private Limited</strong>. Cashfree is certified to the highest standards of the Payment Card Industry Data Security Standard (PCI-DSS Level 1) and complies with Reserve Bank of India (RBI) tokenization guidelines.
            </p>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-xl text-foreground">5. Data Retention & Deletion</h2>
          <p className="text-muted-foreground">
            You maintain full sovereignty over your data. You may export your entire workspace as a JSON archive at any time via <code>/api/export/workspace</code>. If you delete a client or close your account, all associated knowledge facts, plans, and drafts are permanently expunged from our active database.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-xl text-foreground">6. Third-Party Service Providers</h2>
          <p className="text-muted-foreground">
            We partner with trusted enterprise providers for infrastructure:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs sm:text-sm pl-2">
            <li><strong>Cashfree Payments:</strong> Payment processing and subscription management (India).</li>
            <li><strong>OpenRouter:</strong> AI LLM inference pipeline with zero-data retention agreements.</li>
            <li><strong>Vercel & Supabase:</strong> Encrypted cloud hosting and relational database storage.</li>
          </ul>
        </section>

        <section className="space-y-2 pt-2 border-t border-border">
          <h2 className="font-display font-semibold text-base text-foreground">7. Grievance Officer & Contact</h2>
          <p className="text-muted-foreground text-xs">
            In accordance with the Indian Information Technology Act and rules made thereunder:
          </p>
          <p className="text-xs text-foreground font-mono">
            Grievance Officer: Deepak Bagada<br />
            Curro Technologies, Moti Palace Compound, Junagadh, Gujarat 362001, India<br />
            Email: privacy@curro.in / support@curro.in<br />
            Phone: +91 94092 11982
          </p>
        </section>
      </div>
    </div>
  );
}
