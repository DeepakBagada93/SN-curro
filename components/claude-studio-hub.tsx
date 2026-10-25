"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SubmitButton } from "./submit-button";

export interface StudioClient {
  id: string;
  name: string;
  brandColor: string;
  industry: string;
  summary?: string;
  audience?: string;
  tone?: string;
}

export interface StudioKnowledge {
  id: string;
  title: string;
  kind: string;
  body: string;
}

export interface StudioAssetSummary {
  id: string;
  title: string;
  format: string;
  platform: string;
  status: string;
  currentVersion: number;
  createdAt: string;
  snippet?: string;
  openUnsupported?: number;
}

const STARTER_PROMPTS = [
  {
    icon: "⚡",
    tag: "LinkedIn Post",
    format: "linkedin_post",
    title: "Contrarian Industry Stance",
    prompt: "Draft a contrarian LinkedIn post explaining why traditional industry tactics are failing, backed by our approved facts and case studies."
  },
  {
    icon: "🧵",
    tag: "X / Twitter Thread",
    format: "x_thread",
    title: "5-Part High-Signal Breakdown",
    prompt: "Create a 5-tweet high-signal breakdown of our key product architectural decisions and real-world outcomes."
  },
  {
    icon: "🎥",
    tag: "Reel / Short Script",
    format: "reel_script",
    title: "45-Sec Kinetic Script",
    prompt: "Write a high-retention 45-second reel script with a 3-second pattern-interrupt hook and a crisp takeaway."
  },
  {
    icon: "📑",
    tag: "SEO Article",
    format: "seo_article",
    title: "Authoritative Tech Guide",
    prompt: "Draft a comprehensive, source-backed technical guide addressing common misconceptions with runnable examples."
  }
];

export function ClaudeStudioHub({
  clients,
  activeClient,
  approvedKnowledge,
  approvedMemoriesCount,
  recentAssets,
  createAction,
  modelLabel,
  planUsage
}: {
  clients: StudioClient[];
  activeClient: StudioClient;
  approvedKnowledge: StudioKnowledge[];
  approvedMemoriesCount: number;
  recentAssets: StudioAssetSummary[];
  createAction: (formData: FormData) => Promise<void>;
  modelLabel: string;
  planUsage: { used: number; limit: number };
}) {
  const router = useRouter();
  const [selectedFormat, setSelectedFormat] = useState("linkedin_post");
  const [promptText, setPromptText] = useState("");
  const [titleText, setTitleText] = useState("");
  const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<string[]>([]);
  const [showSourcesModal, setShowSourcesModal] = useState(false);

  const handleSelectStarter = (starter: (typeof STARTER_PROMPTS)[0]) => {
    setSelectedFormat(starter.format);
    setPromptText(starter.prompt);
    setTitleText(starter.title);
  };

  const toggleKnowledge = (id: string) => {
    setSelectedKnowledgeIds((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
    );
  };

  const selectAllKnowledge = () => {
    setSelectedKnowledgeIds(approvedKnowledge.map((k) => k.id));
  };

  const clearKnowledge = () => {
    setSelectedKnowledgeIds([]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-4 sm:py-8">
      {/* Claude-Style Greeting & Thought Partner Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1 text-xs text-muted-foreground shadow-sm">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: activeClient.brandColor || "#d97706" }}
          />
          <span className="font-semibold text-foreground">{activeClient.name}</span>
          <span className="opacity-40">·</span>
          <span>🧠 {approvedKnowledge.length} Approved Facts</span>
          <span className="opacity-40">·</span>
          <span className="text-accent font-medium">🛡️ Anti-Fluff Shield Active</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
          What shall we draft for {activeClient.name}?
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Curro's claim ledger grounds every sentence in your client's approved facts.
          Unsupported claims block approval until evidenced or removed.
        </p>
      </div>

      {/* Claude Central Prompt Command Box */}
      <div className="claude-card p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border-[#DDD9D0] bg-white">
        <form action={createAction} className="space-y-4">
          <input type="hidden" name="format" value={selectedFormat} />
          {selectedKnowledgeIds.map((id) => (
            <input key={id} type="hidden" name="knowledge" value={id} />
          ))}

          {/* Working Title (Optional) */}
          <div className="flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Topic:
            </span>
            <input
              name="title"
              value={titleText}
              onChange={(e) => setTitleText(e.target.value)}
              placeholder="e.g. Why Enterprise AI SDRs Fail at Scale (optional)"
              className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            />
          </div>

          {/* Main Conversational Prompt Input */}
          <div className="relative">
            <textarea
              name="brief"
              required
              rows={3}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder={`Describe your angle, tension, or premise for ${activeClient.name}… (e.g. "Highlight our Q3 benchmark comparing latency vs legacy solutions and write a sharp hook")`}
              className="w-full resize-none bg-transparent text-sm sm:text-base leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            />
          </div>

          {/* Prompt Box Bottom Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
            {/* Format & Knowledge Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Format Switcher */}
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="rounded-lg border border-border bg-[#F7F6F2] px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:border-accent"
              >
                <option value="linkedin_post">💼 LinkedIn Post</option>
                <option value="x_thread">🧵 X / Twitter Thread</option>
                <option value="reel_script">🎥 Short Video / Reel Script</option>
                <option value="seo_article">📑 SEO Thought Article</option>
              </select>

              {/* Source Knowledge Trigger Pill */}
              <button
                type="button"
                onClick={() => setShowSourcesModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-[#F7F6F2] px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-[#EAE8E1] transition-colors"
              >
                <span>🧠</span>
                <span>
                  {selectedKnowledgeIds.length === 0
                    ? `All Approved Facts (${approvedKnowledge.length})`
                    : `${selectedKnowledgeIds.length} Facts Selected`}
                </span>
                <span className="text-[10px] opacity-60">✎</span>
              </button>
            </div>

            {/* Submit Action */}
            <SubmitButton
              pendingText="Drafting with AI & Claim Ledger…"
              className="btn btn-accent !px-5 !py-2 text-sm shadow-sm"
            >
              Draft with Claim Ledger →
            </SubmitButton>
          </div>
        </form>
      </div>

      {/* Claude-Style Quick Prompt Starter Chips */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center sm:text-left">
          Suggested Angles for {activeClient.name}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {STARTER_PROMPTS.map((starter) => (
            <button
              key={starter.title}
              type="button"
              onClick={() => handleSelectStarter(starter)}
              className="group text-left rounded-2xl border border-[#E2DFD7] bg-card p-4 transition-all hover:border-accent/50 hover:shadow-md hover:bg-white"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-lg">{starter.icon}</span>
                <span className="text-[11px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                  {starter.tag}
                </span>
              </div>
              <p className="font-semibold text-sm text-foreground group-hover:text-accent transition-colors">
                {starter.title}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                {starter.prompt}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Drafts Section */}
      {recentAssets.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-border/80">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Recent Drafts for {activeClient.name}
            </h2>
            <span className="text-xs text-muted-foreground">
              {recentAssets.length} total drafts
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {recentAssets.map((asset) => (
              <a
                key={asset.id}
                href={`/studio/${asset.id}`}
                className="group block rounded-2xl border border-border bg-card p-4 transition-all hover:border-accent/50 hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {asset.format.replace("_", " ")}
                  </span>
                  <span
                    className={`badge text-[10px] ${
                      asset.status === "approved"
                        ? "badge-success"
                        : asset.status === "scheduled"
                        ? "badge-accent"
                        : "badge-muted"
                    }`}
                  >
                    {asset.status.replace("_", " ")}
                  </span>
                </div>
                <p className="font-semibold text-sm text-foreground group-hover:text-accent transition-colors truncate">
                  {asset.title}
                </p>
                {asset.snippet && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {asset.snippet}
                  </p>
                )}
                <div className="flex items-center justify-between mt-3 text-[11px] text-muted-foreground">
                  <span>v{asset.currentVersion}</span>
                  {asset.openUnsupported && asset.openUnsupported > 0 ? (
                    <span className="text-destructive font-medium">
                      ⚠️ {asset.openUnsupported} unsupported
                    </span>
                  ) : (
                    <span className="text-success font-medium">✓ Claims verified</span>
                  )}
                  <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Knowledge Sources Filter Modal */}
      {showSourcesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-display font-semibold text-lg text-foreground">
                  Select Source Knowledge
                </h3>
                <p className="text-xs text-muted-foreground">
                  Choose which approved facts Curro can ground this draft in.
                </p>
              </div>
              <button
                onClick={() => setShowSourcesModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {selectedKnowledgeIds.length === 0
                  ? "Currently using all approved items by default"
                  : `${selectedKnowledgeIds.length} items explicitly selected`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllKnowledge}
                  className="text-accent hover:underline font-medium"
                >
                  Select All
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={clearKnowledge}
                  className="text-muted-foreground hover:underline"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {approvedKnowledge.map((k) => {
                const checked = selectedKnowledgeIds.includes(k.id);
                return (
                  <label
                    key={k.id}
                    onClick={() => toggleKnowledge(k.id)}
                    className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                      checked
                        ? "border-accent bg-accent/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="mt-1 rounded text-accent"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">{k.title}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                        {k.body}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setShowSourcesModal(false)}
                className="btn btn-accent btn-sm !px-4"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
