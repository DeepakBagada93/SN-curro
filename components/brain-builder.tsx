"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { KNOWLEDGE_KINDS, KNOWLEDGE_KIND_LABELS } from "@/lib/clients";

export function BrainBuilder({
  clientId,
  clientWebsite,
  clientIndustry,
  ingestUrlAction,
  ingestNotesAction,
  scaffoldStarterAction,
  addManualAction
}: {
  clientId: string;
  clientWebsite?: string | null;
  clientIndustry?: string | null;
  ingestUrlAction: (formData: FormData) => Promise<void>;
  ingestNotesAction: (formData: FormData) => Promise<void>;
  scaffoldStarterAction: () => Promise<void>;
  addManualAction: (formData: FormData) => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<"notes" | "url" | "starter" | "manual">("notes");
  const [notesText, setNotesText] = useState("");
  const [crawlUrl, setCrawlUrl] = useState(clientWebsite || "");

  const cleanBase = (clientWebsite || "").replace(/\/+$/, "");

  const setUrlChip = (path: string) => {
    if (!cleanBase) return;
    const base = /^https?:\/\//i.test(cleanBase) ? cleanBase : `https://${cleanBase}`;
    setCrawlUrl(`${base}${path}`);
  };

  const loadSampleNotes = () => {
    setNotesText(
      `We build high-performance AI agents and Next.js applications for modern growth teams. Founded in 2024. Our core advantage is deterministic claim-checking: no invented statistics or hollow buzzwords. Transparent pricing starting at ₹999 with 3-day full access.`
    );
  };

  return (
    <div className="card border-accent/40 bg-accent/[0.03] !p-5">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <p className="eyebrow text-accent">⚡ AI Brain Studio</p>
          <h2 className="h-display text-xl font-bold">Build Client Brain</h2>
        </div>
        <span className="badge badge-accent text-[11px]">4 Fast Methods</span>
      </div>

      {/* Mode Tabs */}
      <div className="mt-3.5 flex flex-wrap gap-1.5 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("notes")}
          className={`btn btn-sm !h-8 !px-2.5 text-xs ${
            activeTab === "notes" ? "btn-accent" : "btn-outline"
          }`}
        >
          <span>🪄 Paste Notes / Bio</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("url")}
          className={`btn btn-sm !h-8 !px-2.5 text-xs ${
            activeTab === "url" ? "btn-accent" : "btn-outline"
          }`}
        >
          <span>⚡ Crawl Website</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("starter")}
          className={`btn btn-sm !h-8 !px-2.5 text-xs ${
            activeTab === "starter" ? "btn-accent" : "btn-outline"
          }`}
        >
          <span>🚀 Starter Template</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("manual")}
          className={`btn btn-sm !h-8 !px-2.5 text-xs ${
            activeTab === "manual" ? "btn-accent" : "btn-outline"
          }`}
        >
          <span>✍️ Manual Fact</span>
        </button>
      </div>

      {/* Tab 1: AI Notes Extractor */}
      {activeTab === "notes" && (
        <form action={ingestNotesAction} className="mt-3.5 space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <label className="label" htmlFor="rawNotes">
                Raw Notes, Pitch, or Overview
              </label>
              <button
                type="button"
                onClick={loadSampleNotes}
                className="text-[11px] font-medium text-accent hover:underline"
              >
                + Insert Sample
              </button>
            </div>
            <textarea
              id="rawNotes"
              name="rawNotes"
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Paste company deck bullets, kickoff meeting notes, founder bio, or product overview… Curro automatically extracts structured, verified brand facts."
              className="input min-h-[120px] text-xs leading-relaxed"
              required
              minLength={20}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              {notesText.length} characters · AI categorizes into brand positioning, audience, guidelines &amp; research.
            </p>
          </div>
          <SubmitButton
            pendingText="Analyzing notes & extracting brain facts with AI…"
            className="btn btn-accent w-full"
          >
            ✨ Extract Brain Facts with AI →
          </SubmitButton>
        </form>
      )}

      {/* Tab 2: AI Web Crawler */}
      {activeTab === "url" && (
        <form
          action={ingestUrlAction}
          onSubmit={(e) => {
            let clean = crawlUrl.trim();
            if (clean && !/^https?:\/\//i.test(clean) && clean.includes(".")) {
              clean = `https://${clean}`;
              setCrawlUrl(clean);
            }
          }}
          className="mt-3.5 space-y-3"
        >
          <div>
            <label className="label" htmlFor="crawlUrlInput">
              Website or Landing Page URL
            </label>
            <input
              id="crawlUrlInput"
              name="crawlUrl"
              type="text"
              value={crawlUrl}
              onChange={(e) => setCrawlUrl(e.target.value)}
              placeholder="https://client.com or client.com/pricing"
              className="input"
              required
            />

            {/* Quick URL shortcut chips */}
            {cleanBase && (
              <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px]">
                <span className="text-muted-foreground">Quick paths:</span>
                <button
                  type="button"
                  onClick={() => setUrlChip("")}
                  className="badge badge-muted hover:bg-accent/20 transition-colors"
                >
                  Homepage
                </button>
                <button
                  type="button"
                  onClick={() => setUrlChip("/about")}
                  className="badge badge-muted hover:bg-accent/20 transition-colors"
                >
                  /about
                </button>
                <button
                  type="button"
                  onClick={() => setUrlChip("/pricing")}
                  className="badge badge-muted hover:bg-accent/20 transition-colors"
                >
                  /pricing
                </button>
                <button
                  type="button"
                  onClick={() => setUrlChip("/services")}
                  className="badge badge-muted hover:bg-accent/20 transition-colors"
                >
                  /services
                </button>
              </div>
            )}
          </div>
          <SubmitButton
            pendingText="Crawling page & extracting facts with AI…"
            className="btn btn-accent w-full"
          >
            Extract Facts from URL →
          </SubmitButton>
        </form>
      )}

      {/* Tab 3: Starter Brain Template */}
      {activeTab === "starter" && (
        <div className="mt-3.5 space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Instantly scaffold the 4 essential foundations every agency brand needs. Tailored to{" "}
            <strong>{clientIndustry || "your client"}</strong>:
          </p>
          <ul className="grid gap-1.5 text-xs">
            <li className="flex items-center gap-2 rounded-lg bg-card border border-border p-2">
              <span className="text-accent">◆</span>
              <span className="font-semibold">Core Value Proposition &amp; Positioning</span>
            </li>
            <li className="flex items-center gap-2 rounded-lg bg-card border border-border p-2">
              <span className="text-accent">◉</span>
              <span className="font-semibold">Ideal Customer Profile &amp; Audience</span>
            </li>
            <li className="flex items-center gap-2 rounded-lg bg-card border border-border p-2">
              <span className="text-accent">✎</span>
              <span className="font-semibold">Editorial Voice &amp; Tone Rules</span>
            </li>
            <li className="flex items-center gap-2 rounded-lg bg-card border border-border p-2">
              <span className="text-destructive">⚠</span>
              <span className="font-semibold">Restricted Claims &amp; Compliance Guardrail</span>
            </li>
          </ul>

          <form action={scaffoldStarterAction}>
            <SubmitButton
              pendingText="Generating starter foundations…"
              className="btn btn-accent w-full"
            >
              🚀 Scaffold Starter Brain (4 Facts) →
            </SubmitButton>
          </form>
        </div>
      )}

      {/* Tab 4: Manual Fact */}
      {activeTab === "manual" && (
        <form action={addManualAction} className="mt-3.5 space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="manual-kind">
                Kind
              </label>
              <select id="manual-kind" name="kind" className="input" defaultValue="brand_fact">
                {KNOWLEDGE_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {KNOWLEDGE_KIND_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="manual-status">
                Initial Status
              </label>
              <select id="manual-status" name="status" className="input" defaultValue="candidate">
                <option value="candidate">Candidate (Review)</option>
                <option value="approved">Approved (Verified)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="manual-title">
              Fact Title
            </label>
            <input
              id="manual-title"
              name="title"
              className="input"
              placeholder="e.g. Free 14-Day Trial Model"
              required
              minLength={3}
              maxLength={160}
            />
          </div>

          <div>
            <label className="label" htmlFor="manual-body">
              Approved Content / Statement
            </label>
            <textarea
              id="manual-body"
              name="body"
              className="input min-h-[90px]"
              placeholder="State the verified fact exactly as the Studio should cite it…"
              required
              minLength={10}
              maxLength={5000}
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="manual-source">
                Source URL (optional)
              </label>
              <input
                id="manual-source"
                name="sourceUrl"
                className="input"
                placeholder="https://client.com/doc"
                maxLength={500}
              />
            </div>
            <div>
              <label className="label" htmlFor="manual-tags">
                Tags (comma separated)
              </label>
              <input
                id="manual-tags"
                name="tags"
                className="input"
                placeholder="pricing, trial, product"
                maxLength={120}
              />
            </div>
          </div>

          <SubmitButton
            pendingText="Adding fact to brain…"
            className="btn btn-accent w-full"
          >
            Add Fact to Brain
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
