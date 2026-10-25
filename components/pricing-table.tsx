"use client";

import { useState } from "react";
import { PLAN_CATALOG, PLAN_ORDER } from "@/lib/agency";
import { CashfreeCheckoutButton } from "./cashfree-checkout-button";
import type { PlanTier } from "@/lib/types";

const TIER_FEATURES: Record<string, string[]> = {
  solo: [
    "2 Client Knowledge Brains",
    "50 AI drafts / month (cites facts)",
    "20 branded social graphics",
    "Instant URL crawler & fact extractor",
    "Claim ledger verification gate",
    "1 agency member seat"
  ],
  studio: [
    "6 Client Knowledge Brains",
    "200 AI drafts / month",
    "75 branded graphics / month",
    "Automated 30-day monthly planner",
    "Seat-free 7-day client review links",
    "Publishing calendar & dispatch",
    "3 agency member seats"
  ],
  agency: [
    "25 Client Knowledge Brains",
    "800 AI drafts / month",
    "300 branded graphics / month",
    "Multi-channel support (LinkedIn, X, SEO, Reels)",
    "White-label client review links",
    "Local MCP server & API access",
    "10 agency member seats",
    "Priority WhatsApp & Slack support"
  ],
  enterprise: [
    "Unlimited Client Knowledge Brains",
    "Unlimited AI drafts & graphics",
    "Custom regional prompt engineering",
    "Dedicated Indian account manager",
    "Custom GST invoice & corporate billing",
    "Full SSO & security compliance"
  ]
};

export function PricingTable() {
  const [currency, setCurrency] = useState<"inr" | "usd">("inr");
  const [annual, setAnnual] = useState(false);

  return (
    <div>
      {/* 3-Day Free Trial Callout */}
      <div className="mb-6 flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-bold text-accent">
          <span>⚡</span> 3-Day Full-Access Free Trial on All Plans · Zero Credit Card or UPI Required
        </span>
      </div>

      {/* Toggles Bar */}
      <div className="flex flex-wrap items-center justify-center gap-4 pb-10">
        {/* Currency Switcher */}
        <div className="inline-flex rounded-xl border border-border bg-card p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setCurrency("inr")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
              currency === "inr" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🇮🇳 INR (₹)
          </button>
          <button
            type="button"
            onClick={() => setCurrency("usd")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
              currency === "usd" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🌐 USD ($)
          </button>
        </div>

        {/* Billing Cadence Switcher */}
        <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
              !annual ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={`relative rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
              annual ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Annually
            <span className="ml-1.5 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">
              2 Months FREE
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {PLAN_ORDER.map((tier) => {
          const plan = PLAN_CATALOG[tier];
          const features = TIER_FEATURES[tier];
          const isHighlight = plan.highlight;

          const displayPrice = currency === "inr"
            ? (annual ? plan.annualPriceInr : plan.priceInr)
            : (annual ? plan.annualPriceUsd : plan.priceUsd);

          const originalPrice = currency === "inr" ? plan.originalPriceInr : plan.originalPriceUsd;

          return (
            <div
              key={tier}
              className={`card relative flex flex-col justify-between transition-all duration-200 ${
                isHighlight
                  ? "border-accent shadow-lg shadow-accent/10 ring-2 ring-accent/20"
                  : "hover:border-border/80"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-bold tracking-wide text-accent-foreground shadow-sm">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-start justify-between gap-2 pt-1">
                  <div>
                    <h3 className="font-display text-xl font-bold">{plan.label}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{plan.blurb}</p>
                  </div>
                </div>

                {/* Price Display */}
                <div className="mt-5 border-t border-border/60 pt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-4xl font-extrabold tracking-tight">
                      {displayPrice}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      / month
                    </span>
                    {originalPrice && (
                      <span className="text-xs text-muted-foreground line-through">
                        {originalPrice}
                      </span>
                    )}
                  </div>

                  {currency === "inr" && plan.dailyInr !== "Custom" && (
                    <p className="mt-1 text-[11px] font-semibold text-accent">
                      ⚡ Roughly {plan.dailyInr} · Less than a cup of coffee
                    </p>
                  )}
                  {annual && (
                    <p className="mt-1 text-[11px] font-medium text-success">
                      Billed annually (Includes 2 Months Free)
                    </p>
                  )}
                </div>

                {/* Feature List */}
                <ul className="mt-5 space-y-2.5 text-xs text-muted-foreground">
                  {features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <span className="text-sm leading-none text-success" aria-hidden>✓</span>
                      <span className="text-foreground/90">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-border/40 space-y-2">
                {tier === "enterprise" ? (
                  <a href="/contact" className="btn btn-outline w-full !text-xs font-semibold !py-2.5">
                    Contact Enterprise Sales →
                  </a>
                ) : (
                  <>
                    <CashfreeCheckoutButton
                      tier={tier as PlanTier}
                      annual={annual}
                      label={`Subscribe via Cashfree (${displayPrice}) →`}
                      className={`btn w-full !text-xs font-semibold !py-2.5 ${
                        isHighlight ? "btn-accent btn-glow" : "btn-accent"
                      }`}
                    />
                    <a
                      href="/signup"
                      className="block text-center text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Or start 3-day free trial first
                    </a>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Indian Payment & Trust Assurance */}
      <div className="mt-12 rounded-2xl border border-border bg-card/60 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-accent">
              🇮🇳 Tailored for Indian Agencies & Export Businesses
            </p>
            <h4 className="mt-1 font-display text-lg font-bold">
              Transparent, Zero-Surprise Indian Billing
            </h4>
            <p className="prose-muted mt-1 max-w-xl text-xs">
              Save over ₹30,000/month compared to manual copywriters. Full GST invoices provided with 18% Input Tax Credit (ITC) for your company filings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
            <span className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5">
              ⚡ UPI (GPay, PhonePe, Paytm)
            </span>
            <span className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5">
              💳 RuPay & All Cards
            </span>
            <span className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5">
              🧾 100% GST Invoicing (ITC)
            </span>
            <span className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5">
              🛡 7-Day Money Back Guarantee
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
