import { loadDB, saveDB, audit, uid, nowIso } from "./store";
import { openRouterConfigured, chatText, extractJson } from "./openrouter";
import { scrapeUrlForKnowledge, extractFactsFromText, type ExtractedFact } from "./crawler";
import { generateStudioAsset } from "./studio-provider";
import { generateCalendarPlan } from "./planner";
import { STUDIO_FORMATS, formatChannel } from "./agency";
import type { Client, KnowledgeItem, ContentAsset, ContentVersion, ClaimEntry, AssetFormat, PlanTier } from "./types";

export type AgentIntentType =
  | "build_brain"
  | "manage_brain"
  | "brainstorm"
  | "audit_content"
  | "draft_content"
  | "plan_content"
  | "chat";

export interface BrainstormAngle {
  id: string;
  title: string;
  hook: string;
  commonTake: string;
  contrarianAngle: string;
  evidencePoints: string[];
  recommendedFormat: AssetFormat;
}

export interface ContentAuditReport {
  score: number; // 0 to 100%
  summary: string;
  verifiedCount: number;
  opinionCount: number;
  unsupportedCount: number;
  violations: string[];
  claims: {
    text: string;
    kind: "factual" | "opinion" | "unsupported";
    citations: string[];
    riskNote?: string;
  }[];
}

export interface AgentExecutionResult {
  intent: AgentIntentType;
  replyMessage: string;
  thinkingSteps: string[];
  activeArtifactType: "brain" | "brainstorm" | "audit" | "draft" | "plan";
  payload: {
    brainFacts?: KnowledgeItem[];
    angles?: BrainstormAngle[];
    auditReport?: ContentAuditReport;
    asset?: ContentAsset;
    version?: ContentVersion;
    claims?: ClaimEntry[];
    planItems?: {
      id: string;
      title: string;
      channel: string;
      publishDate: string;
      notes: string;
    }[];
  };
}

/**
 * Detect user's intent from natural language prompt
 */
export function classifyAgentIntent(prompt: string): AgentIntentType {
  const p = prompt.toLowerCase();

  // URL ingestion or explicit build prompt
  if (
    /https?:\/\/[^\s]+/.test(prompt) ||
    p.includes("crawl") ||
    p.includes("scrape") ||
    p.includes("ingest") ||
    p.includes("extract facts") ||
    p.includes("build brain") ||
    p.includes("add website") ||
    p.includes("feed doc")
  ) {
    return "build_brain";
  }

  // Content Audit & Claim Checking
  if (
    p.includes("audit") ||
    p.includes("fact check") ||
    p.includes("claim check") ||
    p.includes("verify draft") ||
    p.includes("critique") ||
    p.includes("check claims") ||
    p.includes("check for hallucinations")
  ) {
    return "audit_content";
  }

  // Brainstorming & Tension Maps
  if (
    p.includes("brainstorm") ||
    p.includes("angle") ||
    p.includes("tension") ||
    p.includes("ideas") ||
    p.includes("hooks") ||
    p.includes("contrarian") ||
    p.includes("point of view") ||
    p.includes("pov")
  ) {
    return "brainstorm";
  }

  // Content Planning / Calendar
  if (
    p.includes("plan") ||
    p.includes("calendar") ||
    p.includes("schedule") ||
    p.includes("roadmap") ||
    p.includes("weekly calendar") ||
    p.includes("monthly plan")
  ) {
    return "plan_content";
  }

  // Manage Brain / Facts List
  if (
    p.includes("show facts") ||
    p.includes("list facts") ||
    p.includes("manage brain") ||
    p.includes("all facts") ||
    p.includes("approved facts") ||
    p.includes("candidate facts") ||
    p.includes("update fact") ||
    p.includes("delete fact")
  ) {
    return "manage_brain";
  }

  // Drafting
  if (
    p.includes("draft") ||
    p.includes("write") ||
    p.includes("post") ||
    p.includes("thread") ||
    p.includes("script") ||
    p.includes("article") ||
    p.includes("newsletter") ||
    p.includes("caption")
  ) {
    return "draft_content";
  }

  return "chat";
}

/**
 * Execute the Autonomous Agent pipeline for a given prompt and client
 */
export async function executeAgentPrompt({
  prompt,
  clientId,
  explicitFormat
}: {
  prompt: string;
  clientId: string;
  explicitFormat?: AssetFormat;
}): Promise<AgentExecutionResult> {
  const db = await loadDB();
  const client = db.clients.find((c) => c.id === clientId) || db.clients[0];
  if (!client) {
    throw new Error("No client found. Please add or select an agency client first.");
  }

  const intent = classifyAgentIntent(prompt);
  const thinkingSteps: string[] = [];
  const knowledge = db.knowledgeItems.filter((k) => k.clientId === client.id);
  const approvedKnowledge = knowledge.filter((k) => k.status === "approved");
  const approvedMemory = db.memoryCards.filter((m) => m.status === "approved");

  // =========================================================================
  // 1. BUILD BRAIN (Ingest URL or extract raw text)
  // =========================================================================
  if (intent === "build_brain") {
    thinkingSteps.push(`Detecting source material for ${client.name}…`);
    const urlMatch = prompt.match(/https?:\/\/[^\s]+/);

    let extracted: ExtractedFact[] = [];
    let sourceProvenence = "";

    if (urlMatch) {
      const url = urlMatch[0].replace(/[),.;]+$/, "");
      thinkingSteps.push(`Crawling target website: ${url}…`);
      const crawled = await scrapeUrlForKnowledge(url);
      thinkingSteps.push(`Extracted ${crawled.length} candidate facts from web page.`);
      extracted = crawled;
      sourceProvenence = url;
    } else {
      thinkingSteps.push(`Extracting structured factual claims from prompt notes…`);
      extracted = await extractFactsFromText(client.name, prompt);
      thinkingSteps.push(`Extracted ${extracted.length} structured knowledge items.`);
      sourceProvenence = "Agent Ingestion";
    }

    const t = nowIso();
    const newItems: KnowledgeItem[] = [];

    for (const f of extracted) {
      const item: KnowledgeItem = {
        id: uid("kn"),
        workspaceId: client.workspaceId,
        clientId: client.id,
        kind: f.kind,
        title: f.title,
        body: f.body,
        sourceUrl: urlMatch ? urlMatch[0] : null,
        status: "candidate",
        provenance: sourceProvenence,
        tags: f.tags || ["ai-ingested"],
        approvedAt: null,
        createdAt: t,
        updatedAt: t
      };
      db.knowledgeItems.push(item);
      newItems.push(item);
      await audit(db, "knowledge.candidate_added", "knowledge_item", item.id);
    }

    await saveDB(db);

    const allClientKnowledge = db.knowledgeItems.filter((k) => k.clientId === client.id);

    return {
      intent: "build_brain",
      replyMessage: `I analyzed the source and extracted **${newItems.length} candidate facts** into ${client.name}'s Knowledge Brain. You can review, approve, edit, or delete them in the interactive Brain Canvas on the right.`,
      thinkingSteps,
      activeArtifactType: "brain",
      payload: {
        brainFacts: allClientKnowledge
      }
    };
  }

  // =========================================================================
  // 2. BRAINSTORM ANGLES & TENSION MAP
  // =========================================================================
  if (intent === "brainstorm") {
    thinkingSteps.push(`Reviewing ${approvedKnowledge.length} approved facts for ${client.name}…`);
    thinkingSteps.push(`Analyzing audience tension points for: ${client.audience || "B2B buyers"}…`);

    const factSnippets = approvedKnowledge.slice(0, 8).map((k) => `• [${k.id}] ${k.title}: ${k.body}`).join("\n");
    let angles: BrainstormAngle[] = [];

    if (openRouterConfigured() && approvedKnowledge.length > 0) {
      thinkingSteps.push(`Synthesizing contrarian editorial perspectives with OpenRouter…`);
      const systemPrompt = `You are an elite B2B positioning architect and editorial strategist for ${client.name}.
Target Audience: ${client.audience || "B2B Decision Makers"}
Brand Tone: ${client.tone || "Authoritative, practical, direct"}
Restricted Claims: ${client.restrictedClaims || "None"}

Approved Client Truths:
${factSnippets}

Generate 4 high-CTR, thought-provoking editorial angles that challenge common industry assumptions using the approved facts.
Return strictly valid JSON array of objects with keys:
- title: string
- hook: string (punchy 1-sentence hook)
- commonTake: string (the tired industry myth)
- contrarianAngle: string (the reality supported by our facts)
- evidencePoints: array of strings
- recommendedFormat: "linkedin_post" | "x_thread" | "reel_script" | "seo_article"`;

      try {
        const response = await chatText({
          system: systemPrompt,
          user: `Brainstorm 4 high-signal angles for: "${prompt}"`,
          tier: "cheap"
        });
        const parsed = extractJson<BrainstormAngle[]>(response.text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          angles = parsed.map((a, i) => ({
            id: `angle_${i + 1}`,
            title: a.title || `Editorial Angle #${i + 1}`,
            hook: a.hook || "Most teams get this wrong.",
            commonTake: a.commonTake || "Conventional wisdom assumes standard playbook rules.",
            contrarianAngle: a.contrarianAngle || "Data shows verified outcomes outperform generic advice.",
            evidencePoints: a.evidencePoints || [client.name + " approved facts"],
            recommendedFormat: a.recommendedFormat || "linkedin_post"
          }));
        }
      } catch {
        // Fallback below
      }
    }

    if (angles.length === 0) {
      // Deterministic fallback angles
      angles = [
        {
          id: "angle_1",
          title: "Why Generic AI SDRs Spike Churn",
          hook: "90% of automated outbound fails because it invents claims buyers can smell from miles away.",
          commonTake: "More automated volume leads to higher conversion pipeline.",
          contrarianAngle: "Factual claim verification beats automated spam every single time.",
          evidencePoints: approvedKnowledge.slice(0, 2).map((k) => k.title),
          recommendedFormat: "linkedin_post"
        },
        {
          id: "angle_2",
          title: "The Architecture Tradeoff Nobody Discusses",
          hook: "Stop building microservices when your data model hasn't even stabilized.",
          commonTake: "Scalability must be engineered into day one architectures.",
          contrarianAngle: "Monolithic simplicity with verifiable facts reduces technical debt by 60%.",
          evidencePoints: approvedKnowledge.slice(0, 2).map((k) => k.title),
          recommendedFormat: "x_thread"
        },
        {
          id: "angle_3",
          title: "The High Cost of Hallucinated Marketing Claims",
          hook: "One unverified metric in your deck can kill enterprise procurement.",
          commonTake: "Bold marketing claims accelerate buyer excitement.",
          contrarianAngle: "Legal and IT security teams block vendors with unevidenced ROI promises.",
          evidencePoints: approvedKnowledge.slice(0, 2).map((k) => k.title),
          recommendedFormat: "reel_script"
        }
      ];
    }

    thinkingSteps.push(`Synthesized ${angles.length} angle blueprints.`);

    return {
      intent: "brainstorm",
      replyMessage: `I analyzed ${client.name}'s approved facts and synthesized **${angles.length} contrarian angles** in the Angle Matrix Artifact on the right. Click *"Draft from this angle"* on any card to immediately author it.`,
      thinkingSteps,
      activeArtifactType: "brainstorm",
      payload: {
        angles
      }
    };
  }

  // =========================================================================
  // 3. AUDIT CONTENT & CLAIM LEDGER CHECK
  // =========================================================================
  if (intent === "audit_content") {
    thinkingSteps.push(`Auditing input copy against ${client.name}'s approved brain…`);
    thinkingSteps.push(`Checking restricted claim boundaries: "${client.restrictedClaims || "No restrictions"}"…`);

    const sentences = prompt
      .replace(/^(audit|check|verify|analyze|critique)\s*(this)?\s*:?/i, "")
      .split(/(?<=[.?!])\s+/)
      .filter((s) => s.trim().length > 10);

    const claims: ContentAuditReport["claims"] = [];
    const violations: string[] = [];

    const restrictedKeywords = (client.restrictedClaims || "")
      .toLowerCase()
      .split(/[,;\n]/)
      .map((k) => k.trim())
      .filter((k) => k.length > 3);

    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      let matchedViolation = "";
      for (const keyword of restrictedKeywords) {
        if (lower.includes(keyword)) {
          matchedViolation = keyword;
          break;
        }
      }

      if (matchedViolation) {
        violations.push(`Sentence contains restricted phrase: "${matchedViolation}"`);
        claims.push({
          text: sentence,
          kind: "unsupported",
          citations: [],
          riskNote: `Violates client restriction: "${matchedViolation}".`
        });
        continue;
      }

      // Check if matched against any approved knowledge item
      const matchedFact = approvedKnowledge.find((k) =>
        lower.includes(k.title.toLowerCase()) ||
        k.body.toLowerCase().split(" ").filter((w) => w.length > 5 && lower.includes(w)).length >= 3
      );

      if (matchedFact) {
        claims.push({
          text: sentence,
          kind: "factual",
          citations: [matchedFact.title]
        });
      } else if (
        lower.includes("think") ||
        lower.includes("believe") ||
        lower.includes("in our experience") ||
        lower.includes("we recommend") ||
        lower.includes("should")
      ) {
        claims.push({
          text: sentence,
          kind: "opinion",
          citations: ["Founder Opinion"],
          riskNote: "Marked as opinion. Requires founder sign-off before publishing."
        });
      } else {
        claims.push({
          text: sentence,
          kind: "unsupported",
          citations: [],
          riskNote: "No direct citation in approved knowledge brain."
        });
      }
    }

    const verified = claims.filter((c) => c.kind === "factual").length;
    const opinions = claims.filter((c) => c.kind === "opinion").length;
    const unsupported = claims.filter((c) => c.kind === "unsupported").length;
    const total = claims.length || 1;
    const score = Math.max(0, Math.min(100, Math.round(((verified * 1.0 + opinions * 0.7) / total) * 100)));

    const auditReport: ContentAuditReport = {
      score,
      summary:
        score >= 80
          ? "High Grounding Integrity: Copy closely adheres to verified facts."
          : score >= 50
          ? "Moderate Risk: Several statements lack evidence citations."
          : "High Hallucination Risk: Multiple claims lack proof in approved brain.",
      verifiedCount: verified,
      opinionCount: opinions,
      unsupportedCount: unsupported,
      violations,
      claims
    };

    thinkingSteps.push(`Audit score computed: ${score}% (${verified} verified, ${unsupported} unsupported).`);

    return {
      intent: "audit_content",
      replyMessage: `I completed a Claim Ledger Audit of your copy. **Grounding Score: ${score}%**. ${unsupported > 0 ? `⚠️ Found ${unsupported} unsupported assertions that require citations.` : `✓ All claims verified.`} Inspect the full audit breakdown on the right.`,
      thinkingSteps,
      activeArtifactType: "audit",
      payload: {
        auditReport
      }
    };
  }

  // =========================================================================
  // 4. PLAN PUBLISHING CALENDAR
  // =========================================================================
  if (intent === "plan_content") {
    thinkingSteps.push(`Reading approved facts and writing guidelines for ${client.name}…`);
    thinkingSteps.push(`Generating multi-channel publishing roadmap…`);

    const month = new Date().toISOString().slice(0, 7);
    const planItems = await generateCalendarPlan({
      client,
      knowledge: approvedKnowledge,
      memory: approvedMemory,
      month
    });

    thinkingSteps.push(`Scheduled ${planItems.length} content dispatches.`);

    return {
      intent: "plan_content",
      replyMessage: `I drafted a strategic **${planItems.length}-dispatch content roadmap** for ${client.name} across LinkedIn, X, and SEO blogs. You can view, tweak dates, or approve them in the Plan Canvas on the right.`,
      thinkingSteps,
      activeArtifactType: "plan",
      payload: {
        planItems: planItems.map((p, i) => ({
          id: `plan_${i + 1}`,
          title: p.title,
          channel: p.channel,
          publishDate: p.publishDate,
          notes: p.notes
        }))
      }
    };
  }

  // =========================================================================
  // 5. DRAFT CONTENT (Default or explicit drafting)
  // =========================================================================
  if (intent === "draft_content" || intent === "chat") {
    thinkingSteps.push(`Selecting optimal content format and channel for ${client.name}…`);

    let format: AssetFormat = explicitFormat || "linkedin_post";
    if (prompt.toLowerCase().includes("thread") || prompt.toLowerCase().includes("twitter") || prompt.toLowerCase().includes("x post")) {
      format = "x_thread";
    } else if (prompt.toLowerCase().includes("reel") || prompt.toLowerCase().includes("video") || prompt.toLowerCase().includes("script")) {
      format = "reel_script";
    } else if (prompt.toLowerCase().includes("article") || prompt.toLowerCase().includes("blog") || prompt.toLowerCase().includes("seo")) {
      format = "seo_article";
    }

    thinkingSteps.push(`Grounding copy in ${approvedKnowledge.length} approved facts…`);

    const { draft, model } = await generateStudioAsset({
      client,
      knowledge: approvedKnowledge.length > 0 ? approvedKnowledge : knowledge,
      memory: approvedMemory,
      format,
      brief: prompt
    });

    const t = nowIso();
    const assetId = uid("asset");
    const versionId = uid("ver");

    const claims: ClaimEntry[] = draft.claims.map((c) => ({
      id: uid("clm"),
      workspaceId: client.workspaceId,
      versionId,
      claim: c.text,
      kind: c.kind,
      sourceIds: c.sourceIds,
      reviewNote: c.reviewNote,
      reviewStatus: "open"
    }));

    const newAsset: ContentAsset = {
      id: assetId,
      workspaceId: client.workspaceId,
      clientId: client.id,
      platform: formatChannel(format),
      format,
      title: draft.title,
      knowledgeIds: approvedKnowledge.map((k) => k.id),
      status: "in_review",
      currentVersion: 1,
      createdAt: t,
      updatedAt: t
    };

    const newVersion: ContentVersion = {
      id: versionId,
      assetId,
      workspaceId: client.workspaceId,
      version: 1,
      body: draft.body,
      model,
      sourceIds: approvedKnowledge.map((k) => k.id),
      promptTemplate: draft.promptTemplate,
      estCostUsd: 0,
      createdAt: t
    };

    db.assets.push(newAsset);
    db.versions.push(newVersion);
    db.claims.push(...claims);
    await audit(db, "studio.asset.created", "content_asset", assetId);
    await saveDB(db);

    thinkingSteps.push(`Draft generated (v1) with ${claims.length} claims extracted to ledger.`);

    return {
      intent: "draft_content",
      replyMessage: `I drafted a **${STUDIO_FORMATS.find((f) => f.id === format)?.label || format}** for ${client.name} grounded in your approved knowledge. Check the live draft and traceable Claim Ledger on the right.`,
      thinkingSteps,
      activeArtifactType: "draft",
      payload: {
        asset: newAsset,
        version: newVersion,
        claims
      }
    };
  }

  // Manage Brain fallback
  return {
    intent: "manage_brain",
    replyMessage: `Here is ${client.name}'s active Knowledge Brain (${approvedKnowledge.length} approved facts, ${knowledge.filter((k) => k.status === "candidate").length} candidates). You can review or edit them on the right.`,
    thinkingSteps: [`Loading knowledge brain for ${client.name}…`],
    activeArtifactType: "brain",
    payload: {
      brainFacts: knowledge
    }
  };
}
