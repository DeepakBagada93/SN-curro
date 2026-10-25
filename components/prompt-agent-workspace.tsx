"use client";

import { useState } from "react";
import { AgentChatPane } from "./agent-chat-pane";
import { DynamicArtifactCanvas } from "./dynamic-artifact-canvas";
import type { AgentExecutionResult, BrainstormAngle } from "@/lib/agent-engine";
import type { Client, KnowledgeItem, ContentAsset, ContentVersion, ClaimEntry } from "@/lib/types";
import type { VisualSkillOutput } from "@/lib/skills";

export function PromptAgentWorkspace({
  client,
  clients,
  initialKnowledge = [],
  initialAssets = []
}: {
  client: Client;
  clients: { id: string; name: string; brandColor: string }[];
  initialKnowledge?: KnowledgeItem[];
  initialAssets?: ContentAsset[];
}) {
  const [activeClient, setActiveClient] = useState(client);
  const [activeArtifactType, setActiveArtifactType] = useState<
    "brain" | "brainstorm" | "audit" | "draft" | "plan" | "image"
  >("brain");

  const [brainFacts, setBrainFacts] = useState<KnowledgeItem[]>(initialKnowledge);
  const [angles, setAngles] = useState<BrainstormAngle[]>([
    {
      id: "angle_init_1",
      title: "Why Generic AI SDRs Fail at Scale",
      hook: "90% of automated outbound fails because it invents claims buyers can smell from miles away.",
      commonTake: "More automated volume leads to higher conversion pipeline.",
      contrarianAngle: "Factual claim verification beats automated spam every single time.",
      evidencePoints: ["Approved Client Case Studies"],
      recommendedFormat: "linkedin_post"
    },
    {
      id: "angle_init_2",
      title: "The Architecture Tradeoff Nobody Discusses",
      hook: "Stop building microservices when your data model hasn't even stabilized.",
      commonTake: "Scalability must be engineered into day one architectures.",
      contrarianAngle: "Monolithic simplicity with verifiable facts reduces technical debt by 60%.",
      evidencePoints: ["Architecture Blueprint"],
      recommendedFormat: "x_thread"
    }
  ]);

  const [auditReport, setAuditReport] = useState<AgentExecutionResult["payload"]["auditReport"]>();
  const [currentAsset, setCurrentAsset] = useState<ContentAsset | undefined>(initialAssets[0]);
  const [currentVersion, setCurrentVersion] = useState<ContentVersion | undefined>();
  const [currentClaims, setCurrentClaims] = useState<ClaimEntry[]>([]);
  const [planItems, setPlanItems] = useState<AgentExecutionResult["payload"]["planItems"]>([]);
  const [currentImage, setCurrentImage] = useState<VisualSkillOutput | undefined>();

  const handleExecutionResult = (res: AgentExecutionResult) => {
    setActiveArtifactType(res.activeArtifactType);

    if (res.payload.brainFacts) {
      setBrainFacts(res.payload.brainFacts);
    }
    if (res.payload.angles) {
      setAngles(res.payload.angles);
    }
    if (res.payload.auditReport) {
      setAuditReport(res.payload.auditReport);
    }
    if (res.payload.asset) {
      setCurrentAsset(res.payload.asset);
    }
    if (res.payload.version) {
      setCurrentVersion(res.payload.version);
    }
    if (res.payload.claims) {
      setCurrentClaims(res.payload.claims);
    }
    if (res.payload.planItems) {
      setPlanItems(res.payload.planItems);
    }
    if (res.payload.image) {
      setCurrentImage(res.payload.image);
    }
  };

  const handleSelectAngle = (angle: BrainstormAngle) => {
    // When user clicks "Draft from this angle", execute prompt
    fetch("/api/agent/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: `Draft a ${angle.recommendedFormat.replace("_", " ")} based on this angle: "${angle.title}". Hook: "${angle.hook}". Contrarian angle: "${angle.contrarianAngle}".`,
        clientId: activeClient.id,
        format: angle.recommendedFormat
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.result) {
          handleExecutionResult(data.result);
        }
      });
  };

  const handleApproveFact = (factId: string) => {
    setBrainFacts((prev) =>
      prev.map((f) => (f.id === factId ? { ...f, status: "approved" as const } : f))
    );
  };

  const handleDeleteFact = (factId: string) => {
    setBrainFacts((prev) => prev.filter((f) => f.id !== factId));
  };

  return (
    <div className="space-y-4">
      {/* Top Agentic Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border/80">
        <div className="flex items-center gap-2">
          <span className="font-display font-semibold text-lg text-foreground">
            Curro Thought Partner
          </span>
          <span className="badge badge-accent text-[11px]">Prompt OS Active</span>
        </div>

        {/* Quick Mode Switcher */}
        <div className="flex items-center gap-1 bg-[#F4F3ED] p-1 rounded-xl text-xs border border-border/60 overflow-x-auto">
          <button
            onClick={() => setActiveArtifactType("brain")}
            className={`px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeArtifactType === "brain"
                ? "bg-white font-semibold text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🧠 Brain ({brainFacts.length})
          </button>
          <button
            onClick={() => setActiveArtifactType("brainstorm")}
            className={`px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeArtifactType === "brainstorm"
                ? "bg-white font-semibold text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            💡 Angles ({angles.length})
          </button>
          <button
            onClick={() => setActiveArtifactType("image")}
            className={`px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeArtifactType === "image"
                ? "bg-white font-semibold text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🎨 Visual Studio
          </button>
          <button
            onClick={() => setActiveArtifactType("audit")}
            className={`px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeArtifactType === "audit"
                ? "bg-white font-semibold text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🛡️ Claim Audit
          </button>
          <button
            onClick={() => setActiveArtifactType("draft")}
            className={`px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeArtifactType === "draft"
                ? "bg-white font-semibold text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            ✍️ Content Draft
          </button>
          <button
            onClick={() => setActiveArtifactType("plan")}
            className={`px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeArtifactType === "plan"
                ? "bg-white font-semibold text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            📅 Calendar Plan
          </button>
        </div>
      </div>

      {/* Main Two-Pane Split Layout (Chat on Left, Dynamic Artifact on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(350px,460px)_minmax(0,1fr)] gap-5 h-[800px]">
        {/* Left Pane: Thought Partner Chat & Prompt Bar */}
        <AgentChatPane
          client={{
            id: activeClient.id,
            name: activeClient.name,
            brandColor: activeClient.brandColor,
            factsCount: brainFacts.filter((f) => f.status === "approved").length
          }}
          clients={clients}
          onSwitchClient={(id) => {
            const found = clients.find((c) => c.id === id);
            if (found) {
              window.location.href = `/studio?client=${id}`;
            }
          }}
          onExecutionResult={handleExecutionResult}
        />

        {/* Right Pane: Dynamic Multi-Modal Artifact Canvas */}
        <DynamicArtifactCanvas
          activeType={activeArtifactType}
          client={{
            id: activeClient.id,
            name: activeClient.name,
            brandColor: activeClient.brandColor
          }}
          brainFacts={brainFacts}
          angles={angles}
          auditReport={auditReport}
          asset={currentAsset}
          version={currentVersion}
          claims={currentClaims}
          planItems={planItems}
          image={currentImage}
          onSelectAngle={handleSelectAngle}
          onApproveFact={handleApproveFact}
          onDeleteFact={handleDeleteFact}
        />
      </div>
    </div>
  );
}
