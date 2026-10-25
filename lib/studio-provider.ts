import { z } from "zod";
import type { AssetFormat, ClaimKind, Client, KnowledgeItem, MemoryCard } from "./types";
import { chatText, extractJson, openRouterConfigured, type ModelTier } from "./openrouter";
import { generateStudioDraft, type GeneratedStudioDraft } from "./studio";
import { formatLabel } from "./agency";
import {
  PLATFORM_GUIDELINES,
  auditDraftForQuality,
  formatBrainAndMemoryPrompt
} from "./platform-guidelines";

const StudioOutputSchema = z.object({
  title: z.string().trim().min(3).max(200),
  body: z.string().trim().min(60).max(12000),
  claims: z.array(z.object({
    text: z.string().trim().min(4).max(400),
    kind: z.enum(["factual", "opinion", "unsupported"]),
    sourceIds: z.array(z.string()).default([]),
    reviewNote: z.string().max(400).nullable().default(null)
  })).min(1).max(12),
  qualityFlags: z.array(z.string()).default([])
});

export interface StudioGenerationInput {
  client: Client;
  knowledge: KnowledgeItem[];
  memory?: MemoryCard[];
  format: AssetFormat;
  title?: string;
  brief?: string;
}

const STRONG_FORMATS: AssetFormat[] = ["seo_article", "newsletter", "linkedin_post", "reel_script", "faq"];

export async function generateStudioAsset(input: StudioGenerationInput): Promise<{ draft: GeneratedStudioDraft; model: string }> {
  const fallback = generateStudioDraft(input);
  if (!openRouterConfigured()) return { draft: fallback, model: "mock/studio-v1" };

  const guide = PLATFORM_GUIDELINES[input.format];
  const brainAndMemoryPrompt = formatBrainAndMemoryPrompt(
    input.client,
    input.knowledge,
    input.memory
  );
  const tier = STRONG_FORMATS.includes(input.format) ? "strong" : "cheap";

  let lastError: unknown;
  for (const attemptTier of [tier] as ModelTier[]) {
    try {
      const { text, model } = await chatText({
        tier: attemptTier,
        maxTokens: input.format === "seo_article" ? 4500 : input.format === "newsletter" || input.format === "reel_script" ? 3500 : 2800,
        temperature: 0.45,
        system: [
          "You are a master agency content strategist and editorial writer executing verified brand content.",
          `FORMAT & CHANNEL: ${formatLabel(input.format)} (${guide ? guide.name : input.format}).`,
          guide ? `PLATFORM HOOK RULE: ${guide.hookGuide}` : "",
          guide ? `PLATFORM STRUCTURE RULE: ${guide.structureGuide}` : "",
          guide ? `PLATFORM PACING & LENGTH: ${guide.pacingGuide} Target length: ${guide.charRange.optimal}.` : "",
          guide ? `PLATFORM CTA RULE: ${guide.ctaGuide}` : "",
          "ANTI-AI SYNTHETIC FILTER: Do NOT use generic AI filler words (e.g. 'delve into', 'game-changer', 'testament to', 'tapestry', 'unleash', 'crucial role', 'seamlessly', 'foster'). Write with 100% human-grade, concrete, clear engineering precision.",
          "TRUTH & CLAIM LEDGER CONTRACT:",
          "1. Use ONLY the approved Client Knowledge Brain supplied. Never invent facts, statistics, customer names, dates, or outcomes.",
          "2. Every factual claim must cite at least one valid knowledge ID in sourceIds.",
          "3. Include at least one owned opinion labelled 'opinion'. When available, ground it in the founder memory opinions provided.",
          "4. If you include an outcome or comparative claim with no verified source, label it 'unsupported' and explain the fix in reviewNote.",
          `5. STRICT COMPLIANCE: Respect restricted claims: ${input.client.restrictedClaims || "none stated"}.`,
          "Reply with ONLY a JSON object, no markdown fences, matching:",
          `{"title": string, "body": string, "claims": [{"text": string, "kind": "factual"|"opinion"|"unsupported", "sourceIds": string[], "reviewNote": string|null}], "qualityFlags": string[]}`
        ].filter(Boolean).join("\n"),
        user: [
          brainAndMemoryPrompt,
          "",
          input.brief ? `SPECIFIC ANGLE / BRIEF: ${input.brief.slice(0, 600)}` : "",
          input.title ? `WORKING TITLE: ${input.title}` : "",
          `FORMAT TO PRODUCE: ${formatLabel(input.format)}`,
          "Remember: Output strictly valid JSON."
        ].filter(Boolean).join("\n")
      });

    const parsed = StudioOutputSchema.parse(extractJson(text));
    const validIds = new Set(input.knowledge.map((k) => k.id));
    const claims = parsed.claims.map((claim) => {
      const sourceIds = claim.sourceIds.filter((id) => validIds.has(id));
      if (claim.kind === "factual" && sourceIds.length === 0) {
        return {
          text: claim.text,
          kind: "unsupported" as ClaimKind,
          sourceIds: [] as string[],
          reviewNote: "Model produced an uncited factual claim — attach an approved knowledge item or remove it."
        };
      }
      return { ...claim, sourceIds };
    });

    if (!claims.some((c) => c.kind === "factual" && c.sourceIds.length > 0)) {
      throw new Error("Model output had no cited factual claim.");
    }

    const qualityAudit = auditDraftForQuality(parsed.body, input.client, input.format);
    const combinedQualityFlags = Array.from(new Set([...parsed.qualityFlags, ...qualityAudit.qualityFlags]));

    return {
      draft: {
        title: parsed.title,
        body: parsed.body,
        claims,
        qualityFlags: combinedQualityFlags,
        promptTemplate: `studio-${input.format}-openrouter-v1`
      },
      model
    };
    } catch (error) {
      lastError = error;
      console.warn(`[studio] ${attemptTier} generation failed: ${error instanceof Error ? error.message.slice(0, 200) : String(error)}`);
    }
  }

  const reason = lastError instanceof Error ? lastError.message.slice(0, 160) : "unknown provider error";
  return {
    draft: {
      ...fallback,
      qualityFlags: [...fallback.qualityFlags, `openrouter-fallback: ${reason}`]
    },
    model: `mock/studio-v1 (openrouter fallback)`
  };
}
