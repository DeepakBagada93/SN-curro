import { loadDB, saveDB, audit, uid, nowIso } from "./store";
import { openRouterConfigured, chatText, extractJson } from "./openrouter";
import { scrapeUrlForKnowledge, extractFactsFromText, type ExtractedFact } from "./crawler";
import { generateStudioAsset } from "./studio-provider";
import { generateCalendarPlan } from "./planner";
import { STUDIO_FORMATS, formatChannel } from "./agency";
import type { Client, KnowledgeItem, ContentAsset, ContentVersion, ClaimEntry, AssetFormat, PlanTier } from "./types";
import {
  compressKnowledgeContext,
  visualSkill,
  brainstormSkill,
  auditSkill,
  planSkill,
  type VisualSkillOutput,
  type BrainstormAngle,
  type ContentAuditReport
} from "./skills";

export type AgentIntentType =
  | "build_brain"
  | "manage_brain"
  | "brainstorm"
  | "audit_content"
  | "draft_content"
  | "plan_content"
  | "generate_image"
  | "chat";

export { type BrainstormAngle, type ContentAuditReport };

export interface AgentExecutionResult {
  intent: AgentIntentType;
  replyMessage: string;
  thinkingSteps: string[];
  activeArtifactType: "brain" | "brainstorm" | "audit" | "draft" | "plan" | "image";
  tokenSavings?: {
    baselineFactCount: number;
    compressedFactCount: number;
    baselineEstimatedTokens: number;
    compressedEstimatedTokens: number;
    tokensSaved: number;
    savingsRatio: number;
  };
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
    image?: VisualSkillOutput;
  };
}

/**
 * Detect user's intent from natural language prompt or slash command
 */
export function classifyAgentIntent(prompt: string): AgentIntentType {
  const p = prompt.trim().toLowerCase();

  // 1. Explicit Slash Commands
  if (p.startsWith("/image") || p.startsWith("/visual") || p.startsWith("/svg")) {
    return "generate_image";
  }
  if (p.startsWith("/draft") || p.startsWith("/write") || p.startsWith("/content")) {
    return "draft_content";
  }
  if (p.startsWith("/brainstorm") || p.startsWith("/angle") || p.startsWith("/hook")) {
    return "brainstorm";
  }
  if (p.startsWith("/audit") || p.startsWith("/check") || p.startsWith("/verify")) {
    return "audit_content";
  }
  if (p.startsWith("/ingest") || p.startsWith("/crawl") || p.startsWith("/scrape")) {
    return "build_brain";
  }
  if (p.startsWith("/plan") || p.startsWith("/calendar") || p.startsWith("/roadmap")) {
    return "plan_content";
  }
  if (p.startsWith("/brain") || p.startsWith("/facts")) {
    return "manage_brain";
  }

  // 2. URL ingestion or explicit build prompt
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

  // 3. Visual / Image Generation
  if (
    p.includes("image") ||
    p.includes("svg") ||
    p.includes("graphic") ||
    p.includes("visual") ||
    p.includes("banner") ||
    p.includes("illustration") ||
    p.includes("infographic") ||
    p.includes("card visual") ||
    p.includes("make a picture") ||
    p.includes("generate an image") ||
    p.includes("thumbnail")
  ) {
    return "generate_image";
  }

  // 4. Content Audit & Claim Checking
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

  // 5. Brainstorming & Tension Maps
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

  // 6. Content Planning / Calendar
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

  // 7. Manage Brain / Facts List
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

  // 8. Drafting
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
  const knowledge = db.knowledgeItems.filter((k) => k.clientId === client.id);
  const approvedKnowledge = knowledge.filter((k) => k.status === "approved");
  const approvedMemory = db.memoryCards.filter((m) => m.status === "approved");

  const thinkingSteps: string[] = [];
  thinkingSteps.push(`Analyzed intent: "${intent.replace(/_/g, " ").toUpperCase()}" for ${client.name}`);

  // =========================================================================
  // 1. GENERATE BRAND SVG IMAGE / VISUAL
  // =========================================================================
  if (intent === "generate_image") {
    thinkingSteps.push(`Activating Brand SVG Visual Studio Skill…`);
    thinkingSteps.push(`Extracting brand palette (#${client.brandColor.replace('#', '')}) and layout parameters…`);

    const imageOutput = await visualSkill.execute({
      client,
      prompt,
      approvedKnowledge
    });

    thinkingSteps.push(`Rendered ${imageOutput.aspectLabel} (${imageOutput.dimensions.w}x${imageOutput.dimensions.h}px) with ${imageOutput.styleLabel} layout.`);
    thinkingSteps.push(`Persisted asset to data/images/${imageOutput.id}.svg.`);

    return {
      intent: "generate_image",
      replyMessage: `I crafted a high-contrast **${imageOutput.aspectLabel}** visual (${imageOutput.styleLabel}) for ${client.name} using your brand palette. Inspect, download, or copy the SVG code on the right!`,
      thinkingSteps,
      activeArtifactType: "image",
      payload: {
        image: imageOutput
      }
    };
  }

  // =========================================================================
  // 2. INGEST & BUILD BRAIN (URLs or raw text)
  // =========================================================================
  if (intent === "build_brain") {
    const urlMatch = prompt.match(/https?:\/\/[^\s]+/i);
    let extracted: ExtractedFact[] = [];
    let sourceLabel = "raw prompt text";

    if (urlMatch) {
      const url = urlMatch[0];
      sourceLabel = url;
      thinkingSteps.push(`Scraping target URL: ${url}…`);
      extracted = await scrapeUrlForKnowledge(url);
      thinkingSteps.push(`Crawled and extracted ${extracted.length} candidate facts.`);
    } else {
      thinkingSteps.push(`Extracting factual propositions from prompt text…`);
      extracted = await extractFactsFromText(prompt);
      thinkingSteps.push(`Distilled ${extracted.length} factual propositions.`);
    }

    if (extracted.length === 0) {
      extracted = [
        {
          title: `${client.name} Core Value Proposition`,
          body: prompt.slice(0, 300),
          kind: "brand_fact",
          tags: ["distilled", "agent"]
        }
      ];
    }

    const t = nowIso();
    const newItems: KnowledgeItem[] = extracted.map((ef) => ({
      id: uid("kno"),
      workspaceId: client.workspaceId,
      clientId: client.id,
      kind: ef.kind,
      title: ef.title,
      body: ef.body,
      tags: ef.tags.length > 0 ? ef.tags : ["ingested"],
      provenance: sourceLabel,
      sourceUrl: urlMatch ? urlMatch[0] : null,
      status: "candidate",
      approvedAt: null,
      createdAt: t,
      updatedAt: t
    }));

    db.knowledgeItems.unshift(...newItems);
    await audit(db, "knowledge.bulk_created", "knowledge_item", newItems[0]?.id || "");
    await saveDB(db);

    const allClientKnowledge = db.knowledgeItems.filter((k) => k.clientId === client.id);
    thinkingSteps.push(`Added ${newItems.length} candidate facts to ${client.name}'s knowledge brain.`);

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
  // 3. BRAINSTORM ANGLES & TENSION MAP
  // =========================================================================
  if (intent === "brainstorm") {
    thinkingSteps.push(`Activating Contrarian Angle Discovery Skill…`);
    thinkingSteps.push(`Applying Token Shield: compressing approved knowledge facts…`);

    const brainstormResult = await brainstormSkill.execute({
      client,
      prompt,
      approvedKnowledge
    });

    const { angles, tokenSavings } = brainstormResult;
    thinkingSteps.push(`Pruned context: ${tokenSavings.compressedFactCount}/${tokenSavings.baselineFactCount} facts used (~${Math.round(tokenSavings.savingsRatio * 100)}% tokens saved).`);
    thinkingSteps.push(`Synthesized ${angles.length} angle blueprints.`);

    return {
      intent: "brainstorm",
      replyMessage: `I analyzed ${client.name}'s approved facts and synthesized **${angles.length} contrarian angles** in the Angle Matrix Artifact on the right. Click *"Draft from this angle"* on any card to immediately author it.`,
      thinkingSteps,
      activeArtifactType: "brainstorm",
      tokenSavings,
      payload: {
        angles
      }
    };
  }

  // =========================================================================
  // 4. AUDIT CONTENT & CLAIM LEDGER CHECK
  // =========================================================================
  if (intent === "audit_content") {
    thinkingSteps.push(`Activating Anti-Hallucination Claim Audit Skill…`);
    thinkingSteps.push(`Auditing input copy against ${client.name}'s approved facts and restricted claims…`);

    const auditResult = await auditSkill.execute({
      client,
      prompt,
      approvedKnowledge
    });

    const { report, tokenSavings } = auditResult;
    thinkingSteps.push(`Audit score computed: ${report.score}% (${report.verifiedCount} verified, ${report.unsupportedCount} unsupported).`);

    return {
      intent: "audit_content",
      replyMessage: `I completed a Claim Ledger Audit of your copy. **Grounding Score: ${report.score}%**. ${
        report.unsupportedCount > 0 ? `⚠️ Found ${report.unsupportedCount} unsupported assertions that require citations.` : `✓ All claims verified.`
      } Inspect the full audit breakdown on the right.`,
      thinkingSteps,
      activeArtifactType: "audit",
      tokenSavings,
      payload: {
        auditReport: report
      }
    };
  }

  // =========================================================================
  // 5. PLAN PUBLISHING CALENDAR
  // =========================================================================
  if (intent === "plan_content") {
    thinkingSteps.push(`Activating Editorial Strategy Planner Skill…`);
    thinkingSteps.push(`Generating multi-channel publishing roadmap…`);

    const planResult = await planSkill.execute({
      client,
      prompt,
      approvedKnowledge
    });

    const { planItems, tokenSavings } = planResult;
    thinkingSteps.push(`Scheduled ${planItems.length} content dispatches.`);

    return {
      intent: "plan_content",
      replyMessage: `I drafted a strategic **${planItems.length}-dispatch content roadmap** for ${client.name} across LinkedIn, X, and SEO blogs. You can view, tweak dates, or approve them in the Plan Canvas on the right.`,
      thinkingSteps,
      activeArtifactType: "plan",
      tokenSavings,
      payload: {
        planItems
      }
    };
  }

  // =========================================================================
  // 6. DRAFT CONTENT (Default or explicit drafting)
  // =========================================================================
  if (intent === "draft_content" || intent === "chat") {
    thinkingSteps.push(`Activating Editorial Content Generator Skill…`);

    let format: AssetFormat = explicitFormat || "linkedin_post";
    const p = prompt.toLowerCase();
    if (p.includes("thread") || p.includes("twitter") || p.includes("x post")) {
      format = "x_thread";
    } else if (p.includes("reel") || p.includes("video") || p.includes("script")) {
      format = "reel_script";
    } else if (p.includes("article") || p.includes("blog") || p.includes("seo")) {
      format = "seo_article";
    } else if (p.includes("newsletter") || p.includes("email")) {
      format = "newsletter";
    } else if (p.includes("faq")) {
      format = "faq";
    }

    thinkingSteps.push(`Applying Token Shield: compressing approved knowledge facts…`);
    const compressed = compressKnowledgeContext(prompt, approvedKnowledge.length > 0 ? approvedKnowledge : knowledge, 6);
    thinkingSteps.push(`Pruned context: ${compressed.compressedFactCount}/${compressed.baselineFactCount} facts used (~${Math.round(compressed.savingsRatio * 100)}% tokens saved).`);

    const { draft, model } = await generateStudioAsset({
      client,
      knowledge: compressed.facts,
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
      knowledgeIds: compressed.facts.map((k) => k.id),
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
      sourceIds: compressed.facts.map((k) => k.id),
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
      tokenSavings: {
        baselineFactCount: compressed.baselineFactCount,
        compressedFactCount: compressed.compressedFactCount,
        baselineEstimatedTokens: compressed.baselineEstimatedTokens,
        compressedEstimatedTokens: compressed.compressedEstimatedTokens,
        tokensSaved: compressed.tokensSaved,
        savingsRatio: compressed.savingsRatio
      },
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
