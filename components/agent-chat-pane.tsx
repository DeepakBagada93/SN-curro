"use client";

import { useState, useRef, useEffect } from "react";
import type { AgentExecutionResult } from "@/lib/agent-engine";
import type { AssetFormat } from "@/lib/types";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  time: string;
  thinkingSteps?: string[];
  intent?: string;
  tokenSavings?: {
    baselineFactCount: number;
    compressedFactCount: number;
    baselineEstimatedTokens: number;
    compressedEstimatedTokens: number;
    tokensSaved: number;
    savingsRatio: number;
  };
}

const STARTER_CHIPS = [
  { label: "🧠 Ingest URL / Build Brain", prompt: "Crawl https://saasnext.in and build our knowledge brain with approved facts" },
  { label: "🎨 Generate Brand Visual", prompt: "/image 1:1 square stat callout showing 10x verified ROI for modern teams" },
  { label: "💡 Brainstorm Contrarian Angles", prompt: "Brainstorm 4 contrarian angles on industry myths using our approved facts" },
  { label: "🔍 Audit Draft & Claims", prompt: "Audit this draft: Most enterprise AI SDRs fail because they hallucinate metrics without verifiable proof" },
  { label: "✍️ Draft LinkedIn Post", prompt: "Draft a high-signal LinkedIn post on why simple architectures beat microservices" },
  { label: "📅 Plan 7-Day Content Roadmap", prompt: "Plan next week's 7-day content schedule across LinkedIn, X, and SEO blogs" }
];

const SLASH_COMMANDS = [
  { cmd: "/draft", label: "✍️ /draft", desc: "Write verified content (LinkedIn, X, Reel, SEO)", snippet: "/draft " },
  { cmd: "/image", label: "🎨 /image", desc: "Generate brand SVG graphic or metric callout", snippet: "/image " },
  { cmd: "/brainstorm", label: "💡 /brainstorm", desc: "Discover contrarian angles & viral hooks", snippet: "/brainstorm " },
  { cmd: "/audit", label: "🛡️ /audit", desc: "Verify claims and check hallucination risks", snippet: "/audit " },
  { cmd: "/ingest", label: "🧠 /ingest", desc: "Crawl URL or distill document into facts", snippet: "/ingest " },
  { cmd: "/plan", label: "📅 /plan", desc: "Generate 7-day or 30-day content calendar", snippet: "/plan " }
];

export function AgentChatPane({
  client,
  clients,
  onSwitchClient,
  onExecutionResult
}: {
  client: { id: string; name: string; brandColor: string; factsCount: number };
  clients: { id: string; name: string; brandColor: string }[];
  onSwitchClient: (clientId: string) => void;
  onExecutionResult: (result: AgentExecutionResult) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_welcome",
      role: "assistant",
      text: `Hello! I am Curro, your agency thought partner for **${client.name}**.\n\nI can author verified content drafts, generate brand SVG graphics, discover contrarian angles, audit claims for hallucination, or build knowledge from client URLs.\n\nType **/** to view specialized skills or ask anything below!`,
      time: "Just now",
      thinkingSteps: [`Connected to ${client.name}'s Knowledge Brain (${client.factsCount} facts)`]
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<AssetFormat>("linkedin_post");
  const [isThinking, setIsThinking] = useState(false);
  const [expandedThinking, setExpandedThinking] = useState<Record<string, boolean>>({});
  const [showSlashMenu, setShowSlashMenu] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const toggleThinking = (msgId: string) => {
    setExpandedThinking((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputPrompt(val);
    if (val.startsWith("/") && !val.includes(" ")) {
      setShowSlashMenu(true);
    } else {
      setShowSlashMenu(false);
    }
  };

  const handleSelectSlashCommand = (snippet: string) => {
    setInputPrompt(snippet);
    setShowSlashMenu(false);
    inputRef.current?.focus();
  };

  const handleSendPrompt = async (overridePrompt?: string) => {
    const textToSend = (overridePrompt || inputPrompt).trim();
    if (!textToSend || isThinking) return;

    setShowSlashMenu(false);
    const userMsgId = `user_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    setIsThinking(true);

    try {
      const response = await fetch("/api/agent/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: textToSend,
          clientId: client.id,
          format: selectedFormat
        })
      });

      const data = await response.json();
      if (!response.ok || !data.ok || !data.result) {
        throw new Error(data.error || "Agent execution failed");
      }

      const res = data.result as AgentExecutionResult;
      const assistantMsgId = `asst_${Date.now()}`;

      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        text: res.replyMessage,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        thinkingSteps: res.thinkingSteps,
        intent: res.intent,
        tokenSavings: res.tokenSavings
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setExpandedThinking((prev) => ({ ...prev, [assistantMsgId]: true }));
      onExecutionResult(res);
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          text: `⚠️ Error executing request: ${errorText}`,
          time: "Just now"
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt();
    } else if (e.key === "Escape") {
      setShowSlashMenu(false);
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-[#E2DFD7] bg-[#F7F6F2] overflow-hidden shadow-sm">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6DF] bg-[#F3F2EB]">
        <div className="flex items-center gap-2.5">
          <span
            className="w-2.5 h-2.5 rounded-full ring-2 ring-white"
            style={{ backgroundColor: client.brandColor || "#d97706" }}
          />
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs text-foreground">{client.name}</span>
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded-full">
              🧠 {client.factsCount} facts
            </span>
          </div>
        </div>

        {/* Model Tag */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-success inline-block animate-pulse" />
          <span>Skills Engine · OpenRouter</span>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            {/* Thinking Trace (Collapsible) */}
            {msg.thinkingSteps && msg.thinkingSteps.length > 0 && (
              <div className="mb-2 w-full max-w-full">
                <button
                  type="button"
                  onClick={() => toggleThinking(msg.id)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground hover:text-foreground bg-muted/60 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <span>{expandedThinking[msg.id] ? "▾" : "▸"}</span>
                  <span className="font-medium">Agent Reasoning Trace</span>
                  <span className="opacity-60">({msg.thinkingSteps.length} steps)</span>
                </button>
                {expandedThinking[msg.id] && (
                  <div className="mt-1.5 pl-3 border-l-2 border-accent/40 space-y-1 text-[11px] font-mono text-muted-foreground bg-muted/20 p-2 rounded-r-lg">
                    {msg.thinkingSteps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="text-accent">✓</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bubble */}
            <div
              className={
                msg.role === "user" ? "claude-bubble-user" : "claude-bubble-assistant"
              }
            >
              <div className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm font-sans">
                {msg.text}
              </div>

              {/* Token Shield HUD */}
              {msg.tokenSavings && msg.tokenSavings.tokensSaved > 0 && (
                <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center gap-1.5 text-[11px] font-mono text-success">
                  <span className="bg-success/15 px-1.5 py-0.5 rounded font-semibold">
                    ⚡ Token Shield: ~{Math.round(msg.tokenSavings.savingsRatio * 100)}% saved
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    ({msg.tokenSavings.tokensSaved} tokens pruned)
                  </span>
                </div>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground mt-1 px-1">{msg.time}</span>
          </div>
        ))}

        {/* Thinking Loading Indicator */}
        {isThinking && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded-xl bg-card border border-border/60">
            <span className="inline-block animate-spin text-accent">⚙️</span>
            <span className="font-mono text-[11px]">Curro Agent is executing skills pipeline…</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starter Chips */}
      <div className="px-3 py-2 border-t border-[#E8E6DF] bg-[#F3F2EB]/50 overflow-x-auto">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          {STARTER_CHIPS.map((chip, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendPrompt(chip.prompt)}
              className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted transition-colors shadow-xs"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box Area with Slash Commands Popup */}
      <div className="relative p-3 border-t border-[#E8E6DF] bg-white space-y-2">
        {/* Slash Command Autocomplete Menu */}
        {showSlashMenu && (
          <div className="absolute bottom-full left-3 right-3 mb-2 rounded-xl border border-border bg-white shadow-xl p-2 z-20 space-y-1">
            <div className="px-2 py-1 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              Curro AI Skills Menu (Select or type)
            </div>
            {SLASH_COMMANDS.map((item) => (
              <button
                key={item.cmd}
                type="button"
                onClick={() => handleSelectSlashCommand(item.snippet)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left hover:bg-muted transition-colors text-xs"
              >
                <span className="font-semibold text-accent font-mono">{item.label}</span>
                <span className="text-muted-foreground text-[11px]">{item.desc}</span>
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <textarea
            ref={inputRef}
            value={inputPrompt}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder={`Instruct Curro for ${client.name}… Type / for skills (/draft, /image, /brainstorm, /audit, /ingest, /plan)`}
            className="w-full resize-none bg-transparent text-xs sm:text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
        </div>

        {/* Bottom Toolbar */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
          <div className="flex items-center gap-2">
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as AssetFormat)}
              className="rounded-lg border border-border bg-[#F7F6F2] px-2 py-1 text-[11px] font-medium text-foreground focus:outline-none"
            >
              <option value="linkedin_post">💼 LinkedIn</option>
              <option value="x_thread">🧵 X Thread</option>
              <option value="reel_script">🎥 Reel Script</option>
              <option value="seo_article">📑 SEO Article</option>
            </select>
            <button
              type="button"
              onClick={() => setShowSlashMenu((prev) => !prev)}
              className="px-2 py-1 rounded text-[11px] font-mono bg-muted text-muted-foreground hover:text-foreground"
            >
              / skills
            </button>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              ↵ Enter to send
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleSendPrompt()}
            disabled={!inputPrompt.trim() || isThinking}
            className="btn btn-accent btn-sm !py-1.5 !px-3.5 text-xs font-semibold shadow-sm"
          >
            {isThinking ? "Thinking…" : "Send Prompt →"}
          </button>
        </div>
      </div>
    </div>
  );
}
