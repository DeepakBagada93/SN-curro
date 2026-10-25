import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions — Curro",
  description:
    "Terms and Conditions governing the use of Curro services, subscriptions, Cashfree payment processing, and intellectual property."
};

export default function TermsPage() {
  return (
    <div className="container-x max-w-4xl py-12 md:py-20">
      <div className="space-y-3 mb-10">
        <p className="eyebrow">Legal Agreement</p>
        <h1 className="h-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
          Terms & Conditions
        </h1>
        <p className="text-xs text-muted-foreground">
          Last updated: October 25, 2026 · Effective Date: October 25, 2026
        </p>
      </div>

      <div className="claude-card p-6 sm:p-10 space-y-8 bg-card border-border prose max-w-none text-foreground text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-display font-semibold text-xl text-foreground">1. Introduction & Acceptance</h2>
          <p className="text-muted-foreground">
            Welcome to <strong>Curro</strong> ("Platform", "Service", "we", "our", or "us"), operated by <strong>Curro Technologies / Saasnext</strong>, headquartered in Junagadh, Gujarat, India.
          </p>
          <p className="text-muted-foreground">
            By creating an account, accessing, or subscribing to Curro, you ("User", "Customer", "Agency", or "You") agree to be legally bound by these Terms and Conditions ("Terms"). If you disagree with any part of these terms, you must discontinue using our services immediately.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-xl text-foreground">2. Products & Services Provided</h2>
          <p className="text-muted-foreground">
            Curro provides an AI-powered Agency Knowledge Operating System and Content Studio software-as-a-service (SaaS) platform, featuring:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs sm:text-sm pl-2">
            <li><strong>Client Knowledge Brains:</strong> Approved brand facts, guidelines, past assets, and crawl-extracted source facts.</li>
            <li><strong>AI Content Studio & Claim Ledger:</strong> Draft generation grounded in verified client facts with automated claim verification gates.</li>
            <li><strong>30-Day Monthly Content Planner:</strong> Cross-channel roadmap scheduling and publishing dispatches.</li>
            <li><strong>Client Review Links:</strong> Tokenized, seat-free 7-day client content approval interfaces.</li>
            <li><strong>Brand Images & Visual Studio:</strong> Branded asset generation with alt-text enforcement.</li>
          </ul>
          <p className="text-muted-foreground">
            Account provisioning is instantaneous and digital upon successful signup and payment verification.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-xl text-foreground">3. User Accounts & Security</h2>
          <p className="text-muted-foreground">
            You must provide accurate, complete, and current information when registering an account. You are solely responsible for maintaining the confidentiality of your credentials and all activities occurring under your account. You agree to notify us immediately of any unauthorized account access.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-xl text-foreground">4. Pricing, Currency & Payment Gateway</h2>
          <p className="text-muted-foreground">
            All subscription prices, fees, and charges for Curro are explicitly denominated and billed in <strong>Indian Rupees (INR - ₹)</strong> unless explicitly stated otherwise.
          </p>
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 text-xs space-y-1.5 text-foreground">
            <p className="font-semibold text-accent">Payment Gateway Partner:</p>
            <p className="text-muted-foreground">
              Payments on Curro are securely processed through our authorized payment aggregator partner, <strong>Cashfree Payments India Private Limited ("Cashfree")</strong>. We support Unified Payments Interface (UPI - Google Pay, PhonePe, Paytm), RuPay / Visa / Mastercard Debit & Credit Cards, and NetBanking from all major Indian banks.
            </p>
          </div>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs pl-2">
            <li><strong>Taxes:</strong> Indian Goods and Services Tax (GST at 18%) is applicable on all domestic transactions. GST invoices with Input Tax Credit (ITC) are automatically generated when a valid GSTIN is provided.</li>
            <li><strong>Subscription Billing:</strong> Monthly or annual subscriptions are billed in advance on a recurring schedule. You may cancel renewal at any time prior to the next billing cycle.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-xl text-foreground">5. Intellectual Property & Content Rights</h2>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs pl-2">
            <li><strong>Customer Data Ownership:</strong> You retain complete, unrestricted ownership of all client knowledge, brand briefs, documents, crawled URLs, and published content you input or generate through Curro.</li>
            <li><strong>Curro Platform Rights:</strong> All intellectual property rights in Curro software, user interface design, logos, algorithms, and claim ledger verification systems remain our exclusive property.</li>
            <li><strong>AI Grounding & Fluff Safeguards:</strong> Curro acts as a review aid and workflow copilot. While our Claim Ledger flags unverified claims, you remain responsible for final publication review.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-xl text-foreground">6. Acceptable Use Policy</h2>
          <p className="text-muted-foreground">
            You agree not to use Curro to:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs pl-2">
            <li>Generate or disseminate unlawful, defamatory, fraudulent, or harassing content.</li>
            <li>Attempt to reverse engineer, decompile, or compromise Curro platform code or APIs.</li>
            <li>Scrape websites or ingest data in direct violation of third-party terms of service or copyright laws.</li>
            <li>Share access credentials across unauthorized third parties outside your subscription tier seat limits.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-xl text-foreground">7. Limitation of Liability</h2>
          <p className="text-muted-foreground">
            To the maximum extent permitted by Indian law, Curro Technologies and its affiliates shall not be liable for any indirect, incidental, punitive, or consequential damages resulting from your use of the platform. Our total aggregate liability for any claims arising under these Terms shall not exceed the total amount paid by you to Curro in the preceding three (3) months.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-xl text-foreground">8. Governing Law & Jurisdiction</h2>
          <p className="text-muted-foreground">
            These Terms and Conditions shall be governed by and construed in accordance with the laws of <strong>India</strong>. Any disputes, claims, or controversies arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in <strong>Junagadh, Gujarat, India</strong>.
          </p>
        </section>

        <section className="space-y-2 pt-2 border-t border-border">
          <h2 className="font-display font-semibold text-base text-foreground">9. Contact Us</h2>
          <p className="text-muted-foreground text-xs">
            For legal inquiries, terms clarification, or billing questions, please reach out to:
          </p>
          <p className="text-xs text-foreground font-mono">
            Email: legal@curro.in / support@curro.in<br />
            Address: Curro Technologies, Moti Palace Compound, Junagadh, Gujarat 362001, India<br />
            Phone: +91 94092 11982
          </p>
        </section>
      </div>
    </div>
  );
}
