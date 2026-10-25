import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact Us — Curro Support & Office Details",
  description:
    "Get in touch with the Curro team. Support inquiries, enterprise billing, partnership requests, and office address."
};

export default function ContactPage() {
  return (
    <div className="container-x max-w-4xl py-12 md:py-20">
      {/* Header */}
      <div className="text-center space-y-3 mb-12">
        <p className="eyebrow">Support & Inquiries</p>
        <h1 className="h-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
          Contact Us
        </h1>
        <p className="prose-muted text-base max-w-xl mx-auto leading-relaxed">
          Have questions about Curro, your subscription, or need enterprise onboarding?
          Our team is here to assist you.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Contact Info Card */}
        <div className="claude-card p-6 sm:p-8 space-y-6 bg-card border-border">
          <div>
            <h2 className="font-display font-semibold text-xl text-foreground mb-1">
              Registered Office & Details
            </h2>
            <p className="text-xs text-muted-foreground">
              Official communication and billing information for Curro.
            </p>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-base">🏢</span>
              <div>
                <p className="font-semibold text-foreground">Legal Business Entity</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Curro Technologies (Operated by Saasnext / Deepak Bagada)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-base">📍</span>
              <div>
                <p className="font-semibold text-foreground">Operational Address</p>
                <p className="text-muted-foreground text-xs leading-relaxed mt-0.5">
                  Moti Palace Compound, Near Zanzarda Road,<br />
                  Junagadh, Gujarat — 362001, India
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-base">✉️</span>
              <div>
                <p className="font-semibold text-foreground">Support & Billing Email</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  <a href="mailto:support@curro.in" className="text-accent hover:underline">
                    support@curro.in
                  </a>{" "}
                  /{" "}
                  <a href="mailto:deepak@saasnext.in" className="text-accent hover:underline">
                    deepak@saasnext.in
                  </a>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Expected response within 24 business hours.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-base">📞</span>
              <div>
                <p className="font-semibold text-foreground">Phone Helpline</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  <a href="tel:+919409211982" className="text-accent hover:underline">
                    +91 94092 11982
                  </a>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-base">🕒</span>
              <div>
                <p className="font-semibold text-foreground">Operating Working Hours</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Monday to Friday: 9:00 AM – 6:00 PM IST<br />
                  Saturday: 10:00 AM – 2:00 PM IST (Excluding Public Holidays)
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-muted/40 p-3.5 text-xs text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground mb-0.5">Payment Gateway Support</p>
            Payments are securely handled via our authorized gateway partner{" "}
            <strong>Cashfree Payments India</strong>. For transaction status or billing queries, mention your Order/Transaction ID in your message.
          </div>
        </div>

        {/* Message Form Card */}
        <div className="claude-card p-6 sm:p-8 bg-card border-border flex flex-col justify-between">
          <div>
            <h2 className="font-display font-semibold text-xl text-foreground mb-1">
              Send us a Message
            </h2>
            <p className="text-xs text-muted-foreground mb-5">
              Fill in the form below and our team will get back to you promptly.
            </p>

            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
