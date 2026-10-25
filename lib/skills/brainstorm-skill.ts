import { openRouterConfigured, chatText, extractJson } from "../openrouter";
import type { AssetFormat } from "../types";
import { REGISTERED_SKILLS, type CurroSkill, type SkillExecutionContext } from "./core-skills";
import { compressKnowledgeContext } from "./token-compressor";

export interface BrainstormAngle {
  id: string;
  title: string;
  hook: string;
  commonTake: string;
  contrarianAngle: string;
  evidencePoints: string[];
  recommendedFormat: AssetFormat;
}

export interface BrainstormSkillOutput {
  angles: BrainstormAngle[];
  tokenSavings: {
    baselineFactCount: number;
    compressedFactCount: number;
    baselineEstimatedTokens: number;
    compressedEstimatedTokens: number;
    tokensSaved: number;
    savingsRatio: number;
  };
}

export const brainstormSkill: CurroSkill<BrainstormSkillOutput> = {
  metadata: REGISTERED_SKILLS.brainstorm,
  async execute(ctx: SkillExecutionContext): Promise<BrainstormSkillOutput> {
    const cleanPrompt = ctx.prompt.replace(/^\/brainstorm\s*/i, "").trim() || "B2B growth & engineering";
    const compressed = compressKnowledgeContext(cleanPrompt, ctx.approvedKnowledge, 6);

    const factSnippets = compressed.facts
      .map((k) => `• [${k.id}] ${k.title}: ${k.body}`)
      .join("\n");

    let angles: BrainstormAngle[] = [];

    if (openRouterConfigured() && compressed.facts.length > 0) {
      const systemPrompt = `You are an elite B2B positioning architect and editorial strategist for ${ctx.client.name}.
Target Audience: ${ctx.client.audience || "B2B Decision Makers"}
Brand Tone: ${ctx.client.tone || "Authoritative, practical, direct"}
Restricted Claims: ${ctx.client.restrictedClaims || "None"}

Approved Client Truths (Compressed & Grounded):
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
          user: `Brainstorm 4 high-signal angles for: "${cleanPrompt}"`,
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
            evidencePoints: a.evidencePoints || [ctx.client.name + " approved facts"],
            recommendedFormat: a.recommendedFormat || "linkedin_post"
          }));
        }
      } catch {
        // Fallback below
      }
    }

    if (angles.length === 0) {
      angles = [
        {
          id: "angle_1",
          title: "Why Generic AI SDRs Spike Churn",
          hook: "90% of automated outbound fails because it invents claims buyers can smell from miles away.",
          commonTake: "More automated volume leads to higher conversion pipeline.",
          contrarianAngle: "Factual claim verification beats automated spam every single time.",
          evidencePoints: compressed.facts.slice(0, 2).map((k) => k.title),
          recommendedFormat: "linkedin_post"
        },
        {
          id: "angle_2",
          title: "The Architecture Tradeoff Nobody Discusses",
          hook: "Stop building microservices when your data model hasn't even stabilized.",
          commonTake: "Scalability must be engineered into day one architectures.",
          contrarianAngle: "Monolithic simplicity with verifiable facts reduces technical debt by 60%.",
          evidencePoints: compressed.facts.slice(0, 2).map((k) => k.title),
          recommendedFormat: "x_thread"
        },
        {
          id: "angle_3",
          title: "The High Cost of Hallucinated Marketing Claims",
          hook: "One unverified metric in your deck can kill enterprise procurement.",
          commonTake: "Bold marketing claims accelerate buyer excitement.",
          contrarianAngle: "Legal and IT security teams block vendors with unevidenced ROI promises.",
          evidencePoints: compressed.facts.slice(0, 2).map((k) => k.title),
          recommendedFormat: "reel_script"
        }
      ];
    }

    return {
      angles,
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
