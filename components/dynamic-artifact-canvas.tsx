"use client";

import { useState } from "react";
import type { BrainstormAngle, ContentAuditReport } from "@/lib/agent-engine";
import type { KnowledgeItem, ContentAsset, ContentVersion, ClaimEntry } from "@/lib/types";
import { CopyButton } from "./copy-button";

export function DynamicArtifactCanvas({
  activeType,
  client,
  brainFacts = [],
  angles = [],
  auditReport,
  asset,
  version,
  claims = [],
  planItems = [],
  onSelectAngle,
  onApproveFact,
  onDeleteFact
}: {
  activeType: "brain" | "brainstorm" | "audit" | "draft" | "plan";
  client: { id: string; name: string; brandColor: string };
  brainFacts?: KnowledgeItem[];
  angles?: BrainstormAngle[];
  auditReport?: ContentAuditReport;
  asset?: ContentAsset;
  version?: ContentVersion;
  claims?: ClaimEntry[];
  planItems?: { id: string; title: string; channel: string; publishDate: string; notes: string }[];
  onSelectAngle?: (angle: BrainstormAngle) => void;
  onApproveFact?: (factId: string) => void;
  onDeleteFact?: (factId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"draft" | "ledger" | "preview" | "edit">("draft");
  const [factFilter, setFactFilter] = useState<"all" | "approved" | "candidate">("all");
  const [copiedDraft, setCopiedDraft] = useState(false);

  // 1. BRAIN CANVAS (Interactive Knowledge Management)
  if (activeType === "brain") {
    const filtered = brainFacts.filter((f) => {
      if (factFilter === "approved") return f.status === "approved";
      if (factFilter === "candidate") return f.status === "candidate";
      return true;
    });

    return (
      <div className="flex flex-col h-full bg-white rounded-2xl border border-[#DDD9D0] overflow-hidden shadow-sm">
        {/* Canvas Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6DF] bg-[#FAF9F6]">
          <div className="flex items-center gap-2">
            <span className="text-base">🧠</span>
            <span className="font-semibold text-sm text-foreground">
              Knowledge Brain · {client.name}
            </span>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {brainFacts.length} facts
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            {(["all", "approved", "candidate"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setFactFilter(filter)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  factFilter === filter
                    ? "bg-accent/10 text-accent font-semibold"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {filter === "all" ? "All" : filter === "approved" ? "Approved" : "Candidates"}
              </button>
            ))}
          </div>
        </div>

        {/* Brain Fact List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <span className="text-3xl">📭</span>
              <p className="font-semibold text-sm text-foreground">No facts found in this filter.</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Prompt the agent to crawl a URL or paste client notes to ingest new facts.
              </p>
            </div>
          ) : (
            filtered.map((fact) => (
              <div
                key={fact.id}
                className={`rounded-xl border p-3.5 space-y-2 text-xs transition-all ${
                  fact.status === "approved"
                    ? "border-success/30 bg-success/5"
                    : "border-warning/30 bg-warning/5"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`badge text-[10px] ${
                        fact.status === "approved" ? "badge-success" : "badge-warning"
                      }`}
                    >
                      {fact.status === "approved" ? "✓ Approved" : "⏳ Candidate"}
                    </span>
                    <span className="badge badge-muted text-[10px]">
                      {fact.kind.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {fact.status === "candidate" && onApproveFact && (
                      <button
                        onClick={() => onApproveFact(fact.id)}
                        className="btn btn-accent btn-sm !px-2.5 !py-0.5 text-[11px]"
                      >
                        ✓ Approve
                      </button>
                    )}
                    {onDeleteFact && (
                      <button
                        onClick={() => onDeleteFact(fact.id)}
                        className="text-muted-foreground hover:text-destructive text-[11px]"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <p className="font-semibold text-foreground text-sm leading-snug">
                  {fact.title}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {fact.body}
                </p>

                {fact.sourceUrl && (
                  <p className="text-[11px] text-accent truncate">
                    <a href={fact.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      🔗 {fact.sourceUrl}
                    </a>
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // 2. BRAINSTORMING & TENSION CANVAS
  if (activeType === "brainstorm") {
    return (
      <div className="flex flex-col h-full bg-white rounded-2xl border border-[#DDD9D0] overflow-hidden shadow-sm">
        {/* Canvas Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6DF] bg-[#FAF9F6]">
          <div className="flex items-center gap-2">
            <span className="text-base">💡</span>
            <span className="font-semibold text-sm text-foreground">
              Angle Matrix & Tension Map · {client.name}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {angles.length} Strategic Angles
          </span>
        </div>

        {/* Angles List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {angles.map((angle) => (
            <div
              key={angle.id}
              className="rounded-2xl border border-[#E2DFD7] bg-[#FDFCFB] p-4 sm:p-5 space-y-3 transition-all hover:border-accent/50 hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                  {angle.recommendedFormat.replace("_", " ")}
                </span>
                {onSelectAngle && (
                  <button
                    onClick={() => onSelectAngle(angle)}
                    className="btn btn-accent btn-sm !px-3 !py-1 text-xs"
                  >
                    ✍️ Draft from this angle →
                  </button>
                )}
              </div>

              <h3 className="font-display font-semibold text-base sm:text-lg text-foreground">
                {angle.title}
              </h3>

              {/* The Hook */}
              <div className="rounded-xl border border-accent/20 bg-accent/5 p-3 text-xs">
                <span className="font-semibold text-accent uppercase tracking-wider text-[10px] block mb-1">
                  Kinetic Hook (0-3s):
                </span>
                <p className="font-semibold text-foreground italic">
                  "{angle.hook}"
                </p>
              </div>

              {/* Tension Breakdown */}
              <div className="grid gap-2 sm:grid-cols-2 text-xs">
                <div className="rounded-xl border border-border p-2.5 bg-muted/40">
                  <span className="font-semibold text-muted-foreground uppercase text-[10px] block mb-1">
                    Common Industry Take:
                  </span>
                  <p className="text-muted-foreground">{angle.commonTake}</p>
                </div>
                <div className="rounded-xl border border-success/30 bg-success/5 p-2.5">
                  <span className="font-semibold text-success uppercase text-[10px] block mb-1">
                    Contrarian Reality:
                  </span>
                  <p className="text-foreground font-medium">{angle.contrarianAngle}</p>
                </div>
              </div>

              {/* Evidence Points */}
              {angle.evidencePoints && angle.evidencePoints.length > 0 && (
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="font-semibold">Evidence Anchors:</span>
                  {angle.evidencePoints.map((pt, i) => (
                    <span key={i} className="badge badge-muted text-[10px]">
                      ✓ {pt}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. AUDIT CANVAS (Claim Ledger & Hallucination Guard)
  if (activeType === "audit" && auditReport) {
    return (
      <div className="flex flex-col h-full bg-white rounded-2xl border border-[#DDD9D0] overflow-hidden shadow-sm">
        {/* Canvas Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6DF] bg-[#FAF9F6]">
          <div className="flex items-center gap-2">
            <span className="text-base">🔍</span>
            <span className="font-semibold text-sm text-foreground">
              Claim Ledger & Hallucination Audit
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`font-display text-sm font-bold px-2.5 py-0.5 rounded-full ${
                auditReport.score >= 80
                  ? "bg-success/15 text-success"
                  : auditReport.score >= 50
                  ? "bg-warning/15 text-warning"
                  : "bg-destructive/15 text-destructive"
              }`}
            >
              {auditReport.score}% Score
            </span>
          </div>
        </div>

        {/* Audit Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Summary Box */}
          <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-2">
            <p className="text-sm font-semibold text-foreground">{auditReport.summary}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="badge badge-success text-[10px]">
                ✓ {auditReport.verifiedCount} Verified Factual
              </span>
              <span className="badge badge-accent text-[10px]">
                ⚠ {auditReport.opinionCount} Founder Stance
              </span>
              {auditReport.unsupportedCount > 0 && (
                <span className="badge badge-danger text-[10px]">
                  ✕ {auditReport.unsupportedCount} Unsupported Risks
                </span>
              )}
            </div>
          </div>

          {/* Violations */}
          {auditReport.violations && auditReport.violations.length > 0 && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3.5 space-y-1.5 text-xs">
              <p className="font-semibold text-destructive flex items-center gap-1.5">
                <span>⚠️</span> Restricted Claim Boundaries Violated
              </p>
              <ul className="list-disc list-inside text-destructive text-[11px] space-y-0.5 pl-1">
                {auditReport.violations.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Sentence by Sentence Claims */}
          <div className="space-y-2 pt-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Sentence-by-Sentence Claim Breakdown
            </p>
            {auditReport.claims.map((claim, idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-3 text-xs space-y-1.5 ${
                  claim.kind === "factual"
                    ? "border-success/30 bg-success/5"
                    : claim.kind === "opinion"
                    ? "border-accent/30 bg-accent/5"
                    : "border-destructive/30 bg-destructive/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`badge text-[10px] ${
                      claim.kind === "factual"
                        ? "badge-success"
                        : claim.kind === "opinion"
                        ? "badge-accent"
                        : "badge-danger"
                    }`}
                  >
                    {claim.kind}
                  </span>
                  {claim.citations && claim.citations.length > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      Cited: {claim.citations.join(", ")}
                    </span>
                  )}
                </div>
                <p className="text-foreground leading-relaxed font-medium">"{claim.text}"</p>
                {claim.riskNote && (
                  <p className="text-[11px] text-destructive italic">{claim.riskNote}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 4. PLAN CANVAS (Publishing Roadmap)
  if (activeType === "plan") {
    return (
      <div className="flex flex-col h-full bg-white rounded-2xl border border-[#DDD9D0] overflow-hidden shadow-sm">
        {/* Canvas Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6DF] bg-[#FAF9F6]">
          <div className="flex items-center gap-2">
            <span className="text-base">📅</span>
            <span className="font-semibold text-sm text-foreground">
              Publishing Roadmap · {client.name}
            </span>
          </div>
          <a href={`/calendar?client=${client.id}`} className="text-xs text-accent hover:underline">
            Open Full Calendar →
          </a>
        </div>

        {/* Plan Items */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {planItems.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-card p-3.5 space-y-2 text-xs transition-all hover:border-accent/50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="badge badge-muted text-[10px] uppercase tracking-wider">
                  {item.channel}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {item.publishDate}
                </span>
              </div>
              <p className="font-semibold text-sm text-foreground">{item.title}</p>
              <p className="text-muted-foreground leading-relaxed">{item.notes}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 5. DRAFT CANVAS (Default / Active Draft)
  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-[#DDD9D0] overflow-hidden shadow-sm">
      {/* Canvas Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6DF] bg-[#FAF9F6]">
        <div className="flex items-center gap-2 truncate">
          <span className="text-base">📄</span>
          <span className="font-semibold text-sm text-foreground truncate">
            {asset?.title || "Active Content Draft"}
          </span>
          <span className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            v{version?.version || 1}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <CopyButton text={version?.body || ""} label="Copy Post" />
          <a
            href={asset ? `/studio/${asset.id}` : "/calendar"}
            className="btn btn-outline btn-sm text-xs"
          >
            Review & Schedule →
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 border-b border-[#E8E6DF] bg-[#FAF9F6] text-xs">
        <button
          onClick={() => setActiveTab("draft")}
          className={`py-2 px-3 font-semibold border-b-2 transition-colors ${
            activeTab === "draft"
              ? "border-accent text-accent"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          📄 Draft Body
        </button>
        <button
          onClick={() => setActiveTab("ledger")}
          className={`py-2 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "ledger"
              ? "border-accent text-accent"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>📋 Claim Ledger</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted font-mono">
            {claims.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`py-2 px-3 font-semibold border-b-2 transition-colors ${
            activeTab === "preview"
              ? "border-accent text-accent"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          📱 Social Preview
        </button>
      </div>

      {/* Draft Body Tab */}
      {activeTab === "draft" && (
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <div className="prose max-w-none text-foreground text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans">
            {version?.body || "Generating draft from approved client knowledge…"}
          </div>

          <div className="mt-8 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>{version?.body.length || 0} characters</span>
            <span>Grounded in {claims.filter((c) => c.kind === "factual").length} verified claims</span>
          </div>
        </div>
      )}

      {/* Claim Ledger Tab */}
      {activeTab === "ledger" && (
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <p className="text-xs font-semibold text-foreground pb-1 border-b border-border">
            Verified Claims Traceability
          </p>
          {claims.map((claim) => (
            <div
              key={claim.id}
              className={`rounded-xl border p-3 text-xs space-y-1.5 ${
                claim.kind === "factual"
                  ? "border-success/30 bg-success/5"
                  : claim.kind === "opinion"
                  ? "border-accent/30 bg-accent/5"
                  : "border-destructive/30 bg-destructive/5"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={`badge text-[10px] ${
                    claim.kind === "factual"
                      ? "badge-success"
                      : claim.kind === "opinion"
                      ? "badge-accent"
                      : "badge-danger"
                  }`}
                >
                  {claim.kind}
                </span>
                <span className="text-[10px] text-muted-foreground">Status: {claim.reviewStatus}</span>
              </div>
              <p className="font-medium text-foreground leading-snug">"{claim.claim}"</p>
            </div>
          ))}
        </div>
      )}

      {/* Social Preview Tab */}
      {activeTab === "preview" && (
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 bg-[#F4F3ED] flex items-center justify-center">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center font-display font-bold text-white text-sm"
                style={{ backgroundColor: client.brandColor || "#d97706" }}
              >
                {client.name.slice(0, 1)}
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground leading-tight">{client.name}</p>
                <p className="text-xs text-muted-foreground">
                  Founder & CEO · 1st
                </p>
              </div>
            </div>
            <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed pt-1">
              {version?.body}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
