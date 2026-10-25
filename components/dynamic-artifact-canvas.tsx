"use client";

import { useState } from "react";
import type { BrainstormAngle, ContentAuditReport } from "@/lib/agent-engine";
import type { KnowledgeItem, ContentAsset, ContentVersion, ClaimEntry } from "@/lib/types";
import type { VisualSkillOutput } from "@/lib/skills";
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
  image,
  onSelectAngle,
  onApproveFact,
  onDeleteFact
}: {
  activeType: "brain" | "brainstorm" | "audit" | "draft" | "plan" | "image";
  client: { id: string; name: string; brandColor: string };
  brainFacts?: KnowledgeItem[];
  angles?: BrainstormAngle[];
  auditReport?: ContentAuditReport;
  asset?: ContentAsset;
  version?: ContentVersion;
  claims?: ClaimEntry[];
  planItems?: { id: string; title: string; channel: string; publishDate: string; notes: string }[];
  image?: VisualSkillOutput;
  onSelectAngle?: (angle: BrainstormAngle) => void;
  onApproveFact?: (factId: string) => void;
  onDeleteFact?: (factId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"draft" | "ledger" | "preview" | "edit">("draft");
  const [factFilter, setFactFilter] = useState<"all" | "approved" | "candidate">("all");
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [copiedSvg, setCopiedSvg] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const handleDownloadSvg = () => {
    if (!image?.svg) return;
    const blob = new Blob([image.svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${client.name.toLowerCase().replace(/\s+/g, "-")}-${image.aspect}-${image.id}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySvgCode = async () => {
    if (!image?.svg) return;
    await navigator.clipboard.writeText(image.svg);
    setCopiedSvg(true);
    setTimeout(() => setCopiedSvg(false), 2000);
  };

  const handleCopyHex = async (hex: string) => {
    await navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

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
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Fact Cards Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No facts matching this filter. Ingest a URL or prompt to populate.
            </div>
          ) : (
            filtered.map((fact) => (
              <div
                key={fact.id}
                className="rounded-xl border border-border p-3.5 hover:border-accent/40 transition-colors bg-white shadow-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`badge text-[10px] ${
                        fact.status === "approved"
                          ? "badge-success"
                          : fact.status === "candidate"
                          ? "badge-warning"
                          : "badge-neutral"
                      }`}
                    >
                      {fact.status}
                    </span>
                    <span className="badge text-[10px] bg-muted text-muted-foreground">
                      {fact.kind}
                    </span>
                    {fact.provenance && (
                      <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                        via {fact.provenance}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {fact.status === "candidate" && onApproveFact && (
                      <button
                        onClick={() => onApproveFact(fact.id)}
                        className="text-[11px] font-medium text-success hover:underline px-1.5 py-0.5"
                      >
                        ✓ Approve
                      </button>
                    )}
                    {onDeleteFact && (
                      <button
                        onClick={() => onDeleteFact(fact.id)}
                        className="text-[11px] font-medium text-destructive/70 hover:text-destructive px-1.5 py-0.5"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                <h4 className="font-semibold text-xs text-foreground">{fact.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{fact.body}</p>
                {fact.tags && fact.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap pt-1">
                    {fact.tags.map((tag) => (
                      <span key={tag} className="text-[10px] bg-[#F2F1EC] text-foreground/70 px-1.5 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // 2. IMAGE CANVAS (Brand SVG Visual Studio)
  if (activeType === "image") {
    if (!image) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white rounded-2xl border border-[#DDD9D0]">
          <span className="text-4xl mb-3">🎨</span>
          <h3 className="font-display font-semibold text-base text-foreground">Brand SVG Visual Studio</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            No image rendered yet. Use the prompt bar or type <code className="bg-muted px-1.5 py-0.5 rounded text-accent">/image [prompt]</code> to generate custom branded graphics, quotes, and metric callouts.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full bg-white rounded-2xl border border-[#DDD9D0] overflow-hidden shadow-sm">
        {/* Canvas Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6DF] bg-[#FAF9F6]">
          <div className="flex items-center gap-2">
            <span className="text-base">🎨</span>
            <span className="font-semibold text-sm text-foreground">
              Brand Visual · {client.name}
            </span>
            <span className="badge text-[10px] badge-accent font-mono">
              {image.aspectLabel}
            </span>
            <span className="badge text-[10px] bg-muted text-muted-foreground">
              {image.styleLabel}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-muted-foreground">
              {image.dimensions.w}×{image.dimensions.h}px
            </span>
            <a
              href={image.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-accent hover:underline font-medium"
            >
              Open File ↗
            </a>
          </div>
        </div>

        {/* Live SVG Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F4F3ED] flex flex-col items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-border/80 bg-white p-3 shadow-md flex items-center justify-center">
            <div
              className="w-full flex items-center justify-center overflow-hidden rounded-xl"
              style={{
                aspectRatio: `${image.dimensions.w} / ${image.dimensions.h}`,
                maxHeight: "440px"
              }}
              dangerouslySetInnerHTML={{ __html: image.svg }}
            />
          </div>

          {/* Palette Swatches */}
          {image.palette && image.palette.length > 0 && (
            <div className="mt-4 flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-border shadow-xs">
              <span className="text-[11px] font-medium text-muted-foreground">Brand Palette:</span>
              <div className="flex items-center gap-1.5">
                {image.palette.map((hex, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCopyHex(hex)}
                    title={`Click to copy ${hex}`}
                    className="group relative flex items-center justify-center h-6 w-6 rounded-md border border-black/10 transition-transform hover:scale-110"
                    style={{ backgroundColor: hex }}
                  >
                    {copiedHex === hex && (
                      <span className="text-[9px] text-white font-bold drop-shadow">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8E6DF] bg-[#FAF9F6]">
          <div className="text-xs text-muted-foreground truncate max-w-[280px]">
            Prompt: <span className="font-medium text-foreground">{image.prompt}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySvgCode}
              className="btn btn-secondary text-xs py-1.5 px-3"
            >
              {copiedSvg ? "✓ SVG Copied" : "Copy SVG Code"}
            </button>
            <button
              onClick={handleDownloadSvg}
              className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <span>↓</span>
              <span>Download SVG</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. BRAINSTORM CANVAS (Contrarian Angles & Hooks)
  if (activeType === "brainstorm") {
    return (
      <div className="flex flex-col h-full bg-white rounded-2xl border border-[#DDD9D0] overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6DF] bg-[#FAF9F6]">
          <div className="flex items-center gap-2">
            <span className="text-base">💡</span>
            <span className="font-semibold text-sm text-foreground">
              Angle Matrix & Tension Map · {client.name}
            </span>
          </div>
          <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {angles.length} angles
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {angles.map((angle) => (
            <div
              key={angle.id}
              className="rounded-xl border border-border p-4 bg-white shadow-xs hover:border-accent/40 transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="badge text-[10px] badge-accent">{angle.recommendedFormat}</span>
                {onSelectAngle && (
                  <button
                    onClick={() => onSelectAngle(angle)}
                    className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                  >
                    <span>Draft from this angle</span>
                    <span>→</span>
                  </button>
                )}
              </div>
              <h4 className="font-display font-semibold text-sm text-foreground">{angle.title}</h4>
              <div className="rounded-lg bg-[#FAF9F6] border border-[#E8E6DF] p-2.5 space-y-1">
                <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Hook</p>
                <p className="text-xs font-medium text-foreground italic">"{angle.hook}"</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-2">
                  <p className="text-[10px] font-mono text-destructive uppercase">Conventional Myth</p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">{angle.commonTake}</p>
                </div>
                <div className="rounded-lg bg-success/5 border border-success/20 p-2">
                  <p className="text-[10px] font-mono text-success uppercase">Contrarian Reality</p>
                  <p className="text-foreground text-[11px] font-medium mt-0.5">{angle.contrarianAngle}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. AUDIT CANVAS (Claim Verification & Hallucination Radar)
  if (activeType === "audit") {
    if (!auditReport) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white rounded-2xl border border-[#DDD9D0]">
          <span className="text-3xl mb-2">🛡️</span>
          <h3 className="font-semibold text-sm">No Audit Report Yet</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Prompt Curro with "Audit this draft: [copy]" to compute grounding scores.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full bg-white rounded-2xl border border-[#DDD9D0] overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6DF] bg-[#FAF9F6]">
          <div className="flex items-center gap-2">
            <span className="text-base">🛡️</span>
            <span className="font-semibold text-sm text-foreground">
              Claim Ledger Audit · Grounding Score:
            </span>
            <span
              className={`font-mono font-bold text-sm px-2 py-0.5 rounded-full ${
                auditReport.score >= 80
                  ? "bg-success/15 text-success"
                  : auditReport.score >= 50
                  ? "bg-warning/15 text-warning"
                  : "bg-destructive/15 text-destructive"
              }`}
            >
              {auditReport.score}%
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-success font-medium">✓ {auditReport.verifiedCount} verified</span>
            <span className="text-destructive font-medium">✕ {auditReport.unsupportedCount} unproven</span>
          </div>
        </div>

        <div className="p-3 border-b border-[#E8E6DF] bg-muted/30">
          <p className="text-xs text-foreground font-medium">{auditReport.summary}</p>
          {auditReport.violations.length > 0 && (
            <div className="mt-2 space-y-1">
              {auditReport.violations.map((v, i) => (
                <div key={i} className="text-[11px] text-destructive bg-destructive/10 px-2 py-1 rounded">
                  ⚠️ {v}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
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
                {claim.citations.length > 0 && (
                  <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                    Cites: {claim.citations.join(", ")}
                  </span>
                )}
              </div>
              <p className="font-medium text-foreground leading-snug">"{claim.text}"</p>
              {claim.riskNote && (
                <p className="text-[11px] text-muted-foreground italic">Note: {claim.riskNote}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 5. PLAN CANVAS (Publishing Calendar)
  if (activeType === "plan") {
    return (
      <div className="flex flex-col h-full bg-white rounded-2xl border border-[#DDD9D0] overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6DF] bg-[#FAF9F6]">
          <div className="flex items-center gap-2">
            <span className="text-base">📅</span>
            <span className="font-semibold text-sm text-foreground">
              Strategic Publishing Roadmap · {client.name}
            </span>
          </div>
          <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {planItems.length} dispatches
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {planItems.map((item, idx) => (
            <div
              key={item.id || idx}
              className="rounded-xl border border-border p-3.5 bg-white shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="badge text-[10px] bg-accent/10 text-accent font-semibold">
                    {item.channel}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {item.publishDate}
                  </span>
                </div>
                <span className="badge text-[10px] badge-neutral">Scheduled</span>
              </div>
              <h4 className="font-semibold text-xs text-foreground">{item.title}</h4>
              {item.notes && (
                <p className="text-xs text-muted-foreground leading-relaxed">{item.notes}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 6. DRAFT CANVAS (Default / Active Draft)
  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-[#DDD9D0] overflow-hidden shadow-sm">
      {/* Canvas Header & Tabs */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E8E6DF] bg-[#FAF9F6]">
        <div className="flex items-center gap-1 text-xs">
          {(["draft", "ledger", "preview"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? "bg-accent/10 text-accent font-semibold"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab === "draft"
                ? "Draft Body"
                : tab === "ledger"
                ? `Claim Ledger (${claims.length})`
                : "Social Preview"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {version?.body && (
            <CopyButton
              text={version.body}
              className="btn btn-secondary text-xs py-1 px-2.5"
            />
          )}
          {asset && (
            <a
              href={`/studio/${asset.id}`}
              className="btn btn-primary text-xs py-1 px-2.5"
            >
              Open Full Studio ↗
            </a>
          )}
        </div>
      </div>

      {/* Draft Body Tab */}
      {activeTab === "draft" && (
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="badge text-[10px] badge-accent">
                {asset?.format || "Content Draft"}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {asset?.platform || "LinkedIn"}
              </span>
            </div>
            <h2 className="font-display text-lg font-bold text-foreground">
              {asset?.title || "Draft Article"}
            </h2>
          </div>

          <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed border-t border-border/60 pt-4 font-sans">
            {version?.body || "Generating draft content..."}
          </div>
        </div>
      )}

      {/* Claim Ledger Tab */}
      {activeTab === "ledger" && (
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
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
