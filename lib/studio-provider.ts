import { z } from "zod";
import type { AssetFormat, ClaimKind, Client, KnowledgeItem } from "./types";
import { chatText, extractJson, openRouterConfigured, type ModelTier } from "./openrouter";
import { generateStudioDraft, type GeneratedStudioDraft } from "./studio";
import { formatLabel } from "./agency";

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
  format: AssetFormat;
  title?: string;
  brief?: string;
}

const STRONG_FORMATS: AssetFormat[] = ["seo_article", "newsletter", "linkedin_post", "reel_script", "faq"];

export async function generateStudioAsset(input: StudioGenerationInput): Promise<{ draft: GeneratedStudioDraft; model: string }> {
  const fallback = generateStudioDraft(input);
  if (!openRouterConfigured()) return { draft: fallback, model: "mock/studio-v1" };

  const knowledgeBlock = input.knowledge
    .map((k) => `- id=${k.id} | kind=${k.kind} | title=${k.title}\n  ${k.body.slice(0, 1200)}${k.sourceUrl ? `\n  source=${k.sourceUrl}` : ""}`)
    .join("\n");
  const tier = STRONG_FORMATS.includes(input.format) ? "strong" : "cheap";

  let lastError: unknown;
  for (const attemptTier of [tier] as ModelTier[]) {
    try {
    const { text, model } = await chatText({
      tier: attemptTier,
      maxTokens: input.format === "seo_article" ? 4500 : input.format === "newsletter" || input.format === "reel_script" ? 3500 : 2800,
      temperature: 0.5,
      system: [
        "You are a senior content strategist at an SEO/marketing agency writing for a specific client.",
        input.format === "reel_script"
          ? "Produce a 30–45 second vertical reel script with a 0–3s hook, timed beats, VOICEOVER and ON-SCREEN lines, and a final CTA. No shot can contain a claim that is not in the ledger."
          : `Produce a ${formatLabel(input.format)}.`,
        "Use ONLY the approved knowledge supplied. Never invent facts, statistics, dates, rankings, salaries or outcomes.",
        "Every factual claim must cite at least one supplied knowledge id in sourceIds.",
        "Include at least one owned opinion labelled opinion.",
        "If you include an outcome claim with no source, label it unsupported and explain the fix in reviewNote.",
        `Respect these restricted claims: ${input.client.restrictedClaims || "none stated"}.`,
        "Reply with ONLY a JSON object, no markdown fences, matching:",
        `{"title": string, "body": string, "claims": [{"text": string, "kind": "factual"|"opinion"|"unsupported", "sourceIds": string[], "reviewNote": string|null}], "qualityFlags": string[]}`
      ].join(" "),
      user: [
        `CLIENT: ${input.client.name}`,
        input.client.audience ? `AUDIENCE: ${input.client.audience}` : "",
        input.client.tone ? `VOICE: ${input.client.tone}` : "",
        input.client.summary ? `STRATEGY: ${input.client.summary}` : "",
        input.brief ? `ANGLE / BRIEF: ${input.brief.slice(0, 600)}` : "",
        input.title ? `WORKING TITLE: ${input.title}` : "",
        "",
        "APPROVED KNOWLEDGE (cite by id):",
        knowledgeBlock
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

    return {
      draft: {
        title: parsed.title,
        body: parsed.body,
        claims,
        qualityFlags: parsed.qualityFlags,
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
