import { loadDB, saveDB, audit, uid, nowIso } from "../store";
import { generateStudioAsset } from "../studio-provider";
import { STUDIO_FORMATS, formatChannel } from "../agency";
import type { ContentAsset, ContentVersion, ClaimEntry, AssetFormat } from "../types";
import { REGISTERED_SKILLS, type CurroSkill, type SkillExecutionContext } from "./core-skills";
import { compressKnowledgeContext } from "./token-compressor";

export interface ContentSkillOutput {
  asset: ContentAsset;
  version: ContentVersion;
  claims: ClaimEntry[];
  format: AssetFormat;
  tokenSavings: {
    baselineFactCount: number;
    compressedFactCount: number;
    baselineEstimatedTokens: number;
    compressedEstimatedTokens: number;
    tokensSaved: number;
    savingsRatio: number;
  };
}

export function detectFormatFromPrompt(prompt: string, fallback: AssetFormat = "linkedin_post"): AssetFormat {
  const p = prompt.toLowerCase();
  if (p.includes("thread") || p.includes("tweet") || p.includes("x post") || p.includes("twitter")) {
    return "x_thread";
  }
  if (p.includes("reel") || p.includes("script") || p.includes("video") || p.includes("tiktok") || p.includes("short")) {
    return "reel_script";
  }
  if (p.includes("article") || p.includes("seo") || p.includes("blog") || p.includes("pillar") || p.includes("guide")) {
    return "seo_article";
  }
  if (p.includes("newsletter") || p.includes("email") || p.includes("dispatch")) {
    return "newsletter";
  }
  if (p.includes("faq") || p.includes("q&a")) {
    return "faq";
  }
  if (p.includes("linkedin")) {
    return "linkedin_post";
  }
  return fallback;
}

export const contentSkill: CurroSkill<ContentSkillOutput> = {
  metadata: REGISTERED_SKILLS.content,
  async execute(ctx: SkillExecutionContext): Promise<ContentSkillOutput> {
    const db = await loadDB();
    const client = db.clients.find((c) => c.id === ctx.client.id) || ctx.client;

    const format = ctx.selectedFormat || detectFormatFromPrompt(ctx.prompt, "linkedin_post");
    const cleanPrompt = ctx.prompt.replace(/^\/draft\s*/i, "").trim();

    // Context compression: prune knowledge facts based on prompt relevance
    const compressed = compressKnowledgeContext(cleanPrompt, ctx.approvedKnowledge, 6);

    const { draft, model } = await generateStudioAsset({
      client,
      knowledge: compressed.facts,
      format,
      title: cleanPrompt.slice(0, 100),
      brief: cleanPrompt
    });

    const assetId = uid("ast");
    const versionId = uid("ver");
    const t = nowIso();

    const asset: ContentAsset = {
      id: assetId,
      workspaceId: client.workspaceId,
      clientId: client.id,
      platform: formatChannel(format),
      format,
      title: draft.title || cleanPrompt.slice(0, 80),
      knowledgeIds: compressed.facts.map((k) => k.id),
      status: "in_review",
      currentVersion: 1,
      createdAt: t,
      updatedAt: t
    };

    const version: ContentVersion = {
      id: versionId,
      assetId,
      workspaceId: client.workspaceId,
      version: 1,
      body: draft.body,
      model: model || "openrouter",
      sourceIds: compressed.facts.map((k) => k.id),
      promptTemplate: cleanPrompt,
      estCostUsd: 0,
      createdAt: t
    };

    const claims: ClaimEntry[] = draft.claims.map((c) => ({
      id: uid("clm"),
      workspaceId: client.workspaceId,
      versionId,
      claim: c.text,
      kind: c.kind,
      sourceIds: c.sourceIds || [],
      reviewNote: c.reviewNote || null,
      reviewStatus: "open"
    }));

    db.assets.unshift(asset);
    db.versions.unshift(version);
    db.claims.push(...claims);

    await audit(db, "asset.created", "content_asset", assetId);
    await saveDB(db);

    return {
      asset,
      version,
      claims,
      format,
      tokenSavings: {
        baselineFactCount: compressed.baselineFactCount,
        compressedFactCount: compressed.compressedFactCount,
        baselineEstimatedTokens: compressed.baselineEstimatedTokens,
        compressedEstimatedTokens: compressed.compressedEstimatedTokens,
        tokensSaved: compressed.tokensSaved,
        savingsRatio: compressed.savingsRatio
      }
    };
  }
};
