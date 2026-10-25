"use client";

import { useState } from "react";
import { CopyButton } from "./copy-button";
import { SubmitButton } from "./submit-button";

export interface ArtifactClaim {
  id: string;
  claim: string;
  kind: "factual" | "opinion" | "unsupported";
  sourceIds: string[];
  reviewStatus: "open" | "resolved" | "removed" | "verified" | "flagged";
  reviewNote?: string | null;
}

export interface ArtifactVersion {
  id: string;
  version: number;
  body: string;
  model: string;
  createdAt: string;
}

export interface ArtifactClient {
  id: string;
  name: string;
  brandColor: string;
  timezone: string;
}

export interface ArtifactAsset {
  id: string;
  title?: string;
  format?: string;
  platform: string;
  status: string;
  currentVersion: number;
  createdAt: string;
  approvedAt?: string | null;
  scheduledAt?: string | null;
  imageId?: string | null;
  imageAlt?: string;
}

export function ClaudeArtifactWorkspace({
  asset,
  client,
  version,
  claims,
  allVersions,
  knowledgeMap,
  saveVersionAction,
  approveAction,
  rejectAction,
  removeClaimAction,
  scheduleAction,
  makeReviewLinkAction,
  reviewUrl,
  canApprove
}: {
  asset: ArtifactAsset;
  client: ArtifactClient;
  version?: ArtifactVersion;
  claims: ArtifactClaim[];
  allVersions: ArtifactVersion[];
  knowledgeMap: Record<string, { title: string; kind: string }>;
  saveVersionAction: (formData: FormData) => Promise<void>;
  approveAction: () => Promise<void>;
  rejectAction: () => Promise<void>;
  removeClaimAction: (claimId: string) => Promise<void>;
  scheduleAction: (formData: FormData) => Promise<void>;
  makeReviewLinkAction: () => Promise<void>;
  reviewUrl?: string | null;
  canApprove: { ok: boolean; reason?: string };
}) {
  const [activeTab, setActiveTab] = useState<"draft" | "ledger" | "preview" | "edit">("draft");
  const [copiedReview, setCopiedReview] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; text: string; time: string }[]
  >([
    {
      role: "user",
      text: `Draft a ${asset.format?.replace("_", " ") || "post"} for ${client.name} grounded in approved facts.`,
      time: "Just now"
    },
    {
      role: "assistant",
      text: `I've created your ${asset.format?.replace("_", " ") || "post"} draft. It has been rendered in the Artifact panel on the right with a full Claim Ledger.\n\n• ${
        claims.filter((c) => c.kind === "factual").length
      } factual claims traced to approved knowledge\n• ${
        claims.filter((c) => c.kind === "opinion").length
      } founder opinions flagged for approval\n• ${
        claims.filter((c) => c.kind === "unsupported" && c.reviewStatus === "open").length
      } unsupported assertions requiring evidence`,
      time: "Just now"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isSubmittingChat, setIsSubmittingChat] = useState(false);

  const openUnsupported = claims.filter(
    (c) => c.kind === "unsupported" && c.reviewStatus === "open"
  ).length;

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [
      ...prev,
      { role: "user", text: userText, time: "Just now" }
    ]);
    setIsSubmittingChat(true);

    // Provide intelligent contextual steering feedback
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `Got it. To apply "${userText}", switch to the "Edit" tab on the right Artifact panel to make instant tweaks, or generate a revised draft version with updated claims.`,
          time: "Just now"
        }
      ]);
      setIsSubmittingChat(false);
    }, 600);
  };

  const handleQuickRefine = (instruction: string) => {
    setChatMessages((prev) => [
      ...prev,
      { role: "user", text: instruction, time: "Just now" },
      {
        role: "assistant",
        text: `Applying "${instruction}". You can fine-tune the copy directly in the Edit tab of the Artifact panel or approve this version.`,
        time: "Just now"
      }
    ]);
  };

  const handleCopyReviewUrl = () => {
    if (reviewUrl) {
      navigator.clipboard.writeText(reviewUrl);
      setCopiedReview(true);
      setTimeout(() => setCopiedReview(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border/80">
        <div className="flex items-center gap-2">
          <a
            href={`/studio?client=${client.id}`}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Studio Hub
          </a>
          <span className="text-muted-foreground/40">/</span>
          <span className="font-semibold text-xs text-foreground truncate max-w-[200px] sm:max-w-xs">
            {asset.title || "Untitled Draft"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge badge-muted text-[11px] uppercase tracking-wider">
            {asset.format?.replace("_", " ")}
          </span>
          <span
            className={`badge text-[11px] ${
              asset.status === "approved"
                ? "badge-success"
                : asset.status === "scheduled"
                ? "badge-accent"
                : "badge-muted"
            }`}
          >
            {asset.status.replace("_", " ")}
          </span>
          {openUnsupported > 0 && (
            <span className="badge badge-danger text-[11px]">
              ⚠️ {openUnsupported} unsupported
            </span>
          )}
        </div>
      </div>

      {/* Main Two-Pane Split Layout (Claude Conversation on Left, Artifact on Right) */}
      <div
        className={`grid gap-5 transition-all ${
          isExpanded
            ? "grid-cols-1"
            : "grid-cols-1 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]"
        }`}
      >
        {/* LEFT PANE: Claude Conversation & Steering */}
        {!isExpanded && (
          <div className="flex flex-col h-[750px] rounded-2xl border border-[#E2DFD7] bg-[#F9F8F5] overflow-hidden shadow-sm">
            {/* Conversation Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6DF] bg-[#F5F4EE]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-xs font-semibold text-foreground">
                  Thought Partner · Curro
                </span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                Model: OpenRouter Nemotron
              </span>
            </div>

            {/* Chat Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={
                      msg.role === "user"
                        ? "claude-bubble-user"
                        : "claude-bubble-assistant"
                    }
                  >
                    <p className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                      {msg.text}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1">
                    {msg.time}
                  </span>
                </div>
              ))}

              {isSubmittingChat && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-2">
                  <span className="inline-block animate-spin">⏳</span>
                  <span>Curro is thinking…</span>
                </div>
              )}
            </div>

            {/* Quick Refine Action Chips */}
            <div className="p-2 border-t border-[#E8E6DF] bg-[#F5F4EE]/60">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 pb-1">
                Refine angle
              </p>
              <div className="flex flex-wrap gap-1">
                {[
                  "⚡ Punchier Hook",
                  "👔 Executive Tone",
                  "✂️ Cut 30% fluff",
                  "🔍 Add data point"
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleQuickRefine(chip)}
                    className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={handleChatSubmit}
              className="p-3 border-t border-[#E8E6DF] bg-white flex items-center gap-2"
            >
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask Curro to rewrite, tweak, or refine…"
                className="flex-1 bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="btn btn-accent btn-sm !py-1.5 !px-3 text-xs shrink-0"
              >
                Send →
              </button>
            </form>
          </div>
        )}

        {/* RIGHT PANE: Interactive Claude Artifact Panel */}
        <div className="flex flex-col h-[750px] rounded-2xl border border-[#DDD9D0] bg-white shadow-sm overflow-hidden">
          {/* Artifact Header Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6DF] bg-[#FAF9F6]">
            <div className="flex items-center gap-2">
              <span className="text-sm">📄</span>
              <span className="font-semibold text-xs sm:text-sm text-foreground truncate max-w-xs sm:max-w-md">
                {asset.title || "Untitled Draft"}
              </span>
              <span className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                v{version?.version || asset.currentVersion}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted text-xs transition-colors"
                title={isExpanded ? "Restore split view" : "Expand artifact fullscreen"}
              >
                {isExpanded ? "⤓ Split" : "⤢ Fullscreen"}
              </button>
            </div>
          </div>

          {/* Artifact Navigation Tabs */}
          <div className="flex items-center gap-1 px-4 border-b border-[#E8E6DF] bg-[#FAF9F6] text-xs">
            <button
              onClick={() => setActiveTab("draft")}
              className={`py-2 px-3 font-semibold border-b-2 transition-colors ${
                activeTab === "draft"
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              📄 Draft Content
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
            <button
              onClick={() => setActiveTab("edit")}
              className={`py-2 px-3 font-semibold border-b-2 transition-colors ${
                activeTab === "edit"
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              ✎ Edit Body
            </button>
          </div>

          {/* Tab 1: Rendered Draft Content */}
          {activeTab === "draft" && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div className="prose max-w-none text-foreground text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans selection:bg-accent/20">
                {version?.body}
              </div>

              {/* Claims Summary Footer inside Draft */}
              <div className="mt-8 pt-4 border-t border-border/80 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Claims Grounding:</span>
                  <span className="badge badge-success text-[10px]">
                    ✓ {claims.filter((c) => c.kind === "factual").length} Factual
                  </span>
                  <span className="badge badge-accent text-[10px]">
                    ⚠ {claims.filter((c) => c.kind === "opinion").length} Opinion
                  </span>
                  {openUnsupported > 0 && (
                    <span className="badge badge-danger text-[10px]">
                      ✕ {openUnsupported} Unsupported
                    </span>
                  )}
                </div>
                <span>{version?.body.length || 0} characters</span>
              </div>
            </div>
          )}

          {/* Tab 2: Claim Ledger */}
          {activeTab === "ledger" && (
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Traceable Claim Ledger</h4>
                  <p className="text-xs text-muted-foreground">
                    Every factual claim must cite approved knowledge. Unsupported claims block publishing.
                  </p>
                </div>
              </div>

              {claims.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-4">No claims extracted.</p>
              ) : (
                <div className="space-y-2">
                  {claims.map((claim) => (
                    <div
                      key={claim.id}
                      className={`rounded-xl border p-3.5 space-y-2 text-xs transition-colors ${
                        claim.kind === "factual"
                          ? "border-success/30 bg-success/5"
                          : claim.kind === "opinion"
                          ? "border-accent/30 bg-accent/5"
                          : "border-destructive/30 bg-destructive/5"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
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
                          <span className="font-mono text-[10px] text-muted-foreground">
                            Status: {claim.reviewStatus}
                          </span>
                        </div>
                        {claim.reviewStatus !== "removed" && (
                          <button
                            onClick={() => removeClaimAction(claim.id)}
                            className="text-[11px] text-destructive hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <p className="font-medium text-foreground leading-snug">
                        "{claim.claim}"
                      </p>

                      {claim.sourceIds && claim.sourceIds.length > 0 && (
                        <div className="pt-1 text-[11px] text-muted-foreground">
                          <span className="font-semibold">Cites: </span>
                          {claim.sourceIds
                            .map((id) => knowledgeMap[id]?.title || id)
                            .join(", ")}
                        </div>
                      )}

                      {claim.reviewNote && (
                        <p className="text-[11px] italic text-muted-foreground">
                          Note: {claim.reviewNote}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Social Platform Preview */}
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
                    <p className="font-semibold text-sm text-foreground leading-tight">
                      {client.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {asset.platform === "linkedin"
                        ? "Founder & CEO · 1st"
                        : "@" + client.name.toLowerCase().replace(/\s+/g, "")}
                    </p>
                  </div>
                </div>

                <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed pt-1">
                  {version?.body}
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                  <span>👍 42 likes</span>
                  <span>14 comments · 6 reposts</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Edit Version */}
          {activeTab === "edit" && (
            <div className="flex-1 overflow-y-auto p-5">
              <form action={saveVersionAction} className="h-full flex flex-col space-y-3">
                <label className="text-xs font-semibold text-foreground">
                  Direct Edit · Creates v{(version?.version || 1) + 1}
                </label>
                <textarea
                  name="body"
                  defaultValue={version?.body}
                  rows={16}
                  className="w-full flex-1 rounded-xl border border-border p-3 text-sm font-sans leading-relaxed text-foreground focus:outline-none focus:border-accent"
                />
                <div className="flex justify-end pt-2">
                  <SubmitButton pendingText="Saving new version…" className="btn btn-accent btn-sm">
                    Save New Version
                  </SubmitButton>
                </div>
              </form>
            </div>
          )}

          {/* Artifact Action Bar Footer */}
          <div className="p-3 border-t border-[#E8E6DF] bg-[#FAF9F6] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CopyButton text={version?.body || ""} label="Copy Post" />
              {reviewUrl ? (
                <button
                  onClick={handleCopyReviewUrl}
                  className="btn btn-outline btn-sm text-xs"
                >
                  {copiedReview ? "✓ Review Link Copied!" : "Share Review Link"}
                </button>
              ) : (
                <form action={makeReviewLinkAction}>
                  <button type="submit" className="btn btn-outline btn-sm text-xs">
                    Get Review Link
                  </button>
                </form>
              )}
            </div>

            <div className="flex items-center gap-2">
              {asset.status !== "approved" && asset.status !== "scheduled" && (
                <form action={approveAction}>
                  <SubmitButton
                    pendingText="Approving…"
                    disabled={!canApprove.ok}
                    className="btn btn-accent btn-sm text-xs"
                  >
                    ✓ Approve Draft
                  </SubmitButton>
                </form>
              )}

              {asset.status === "approved" && (
                <button
                  onClick={() => setActiveTab("draft")}
                  className="btn btn-accent btn-sm text-xs bg-success"
                >
                  ✓ Approved · Ready to Schedule
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
