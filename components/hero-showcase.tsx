"use client";

import { useState } from "react";

export function HeroShowcase() {
  const [tab, setTab] = useState<"brain" | "ledger" | "review">("brain");

  return (
    <div className="card float-y overflow-hidden !p-0 shadow-2xl border-accent/20" style={{ animationDuration: "12s" }}>
      {/* Workspace Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-xs font-bold text-accent-foreground">
            A
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Client Brain</p>
            <p className="font-display text-sm font-semibold">Apex Growth Marketing</p>
          </div>
        </div>
        <span className="badge badge-success text-[10px]">● 12 facts verified</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-card/60 text-xs font-medium">
        <button
          type="button"
          onClick={() => setTab("brain")}
          className={`flex-1 py-2.5 text-center transition-colors ${
            tab === "brain" ? "border-b-2 border-accent text-foreground font-semibold bg-accent/5" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          🧠 Knowledge Brain
        </button>
        <button
          type="button"
          onClick={() => setTab("ledger")}
          className={`flex-1 py-2.5 text-center transition-colors ${
            tab === "ledger" ? "border-b-2 border-accent text-foreground font-semibold bg-accent/5" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          🛡️ Claim Ledger
        </button>
        <button
          type="button"
          onClick={() => setTab("review")}
          className={`flex-1 py-2.5 text-center transition-colors ${
            tab === "review" ? "border-b-2 border-accent text-foreground font-semibold bg-accent/5" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          ✨ Client Review Link
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-5 space-y-3 min-h-[280px]">
        {tab === "brain" && (
          <div className="space-y-2.5 animate-fadeIn">
            <div className="rounded-xl border border-border bg-background p-3 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Brand Fact (Crawled)</span>
                <span className="badge badge-success !text-[10px]">approved</span>
              </div>
              <p className="mt-1 text-xs font-medium">
                Helped 42 B2B brands scale pipeline using LinkedIn video ads; average CAC reduced by 31%.
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">Source: apexmarketing.in/case-studies</p>
            </div>

            <div className="rounded-xl border border-border bg-background p-3 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent">SEO Keyword Intent</span>
                <span className="badge badge-success !text-[10px]">approved</span>
              </div>
              <p className="mt-1 text-xs font-medium">
                Target cluster: &apos;B2B LinkedIn video strategy 2026&apos; · Audience: Marketing Directors & CMOs.
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">Source: Parallel Search Research</p>
            </div>

            <div className="rounded-xl border border-accent/20 bg-accent/5 px-3 py-2 text-xs flex items-center justify-between">
              <span className="font-semibold text-accent text-[11px]">⚡ Live AI Ready:</span>
              <span className="text-muted-foreground text-[10px]">Generates LinkedIn, Reels, X threads & SEO articles</span>
            </div>
          </div>
        )}

        {tab === "ledger" && (
          <div className="space-y-2.5 animate-fadeIn">
            <div className="rounded-xl border border-success/30 bg-success/5 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-success">Verified Fact</span>
                <span className="badge badge-success !text-[10px]">✓ Cites Fact #1</span>
              </div>
              <p className="mt-1 text-xs">“Apex reduced B2B client acquisition costs by 31% over 6 months.”</p>
            </div>

            <div className="rounded-xl border border-warning/40 bg-warning/5 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-warning">Approval Blocker</span>
                <span className="badge badge-warning !text-[10px]">1 Unsupported Claim</span>
              </div>
              <p className="mt-1 text-xs text-foreground/90">
                “Ranked #1 agency in Asia” has no client citation. <strong>Approval blocked</strong> until verified or removed.
              </p>
            </div>

            <p className="text-[11px] text-muted-foreground text-center">
              🛡️ Curro protects your agency by blocking AI fabrications before clients see them.
            </p>
          </div>
        )}

        {tab === "review" && (
          <div className="space-y-2.5 animate-fadeIn">
            <div className="rounded-xl border border-border bg-background p-3 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold">Client Review Portal (Passwordless)</p>
                <span className="badge badge-accent !text-[10px]">7-Day Link</span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Sent to: <code className="text-accent font-mono">cmo@clientbrand.com</code>
              </p>
              <div className="mt-3 flex gap-2">
                <button type="button" className="btn btn-accent btn-sm !text-xs !py-1 flex-1">
                  ✓ Approve Content
                </button>
                <button type="button" className="btn btn-outline btn-sm !text-xs !py-1 flex-1">
                  Request Edits
                </button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              Zero login required for clients. No extra per-seat fees.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
