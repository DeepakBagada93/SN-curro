import { generateCalendarPlan } from "../planner";
import { REGISTERED_SKILLS, type CurroSkill, type SkillExecutionContext } from "./core-skills";
import { compressKnowledgeContext } from "./token-compressor";

export interface PlanSkillOutput {
  planItems: {
    id: string;
    title: string;
    channel: string;
    publishDate: string;
    notes: string;
  }[];
  tokenSavings: {
    baselineFactCount: number;
    compressedFactCount: number;
    baselineEstimatedTokens: number;
    compressedEstimatedTokens: number;
    tokensSaved: number;
    savingsRatio: number;
  };
}

export const planSkill: CurroSkill<PlanSkillOutput> = {
  metadata: REGISTERED_SKILLS.plan,
  async execute(ctx: SkillExecutionContext): Promise<PlanSkillOutput> {
    const cleanPrompt = ctx.prompt.replace(/^\/plan\s*/i, "").trim();
    const compressed = compressKnowledgeContext(cleanPrompt, ctx.approvedKnowledge, 6);

    const month = new Date().toISOString().slice(0, 7);
    const calendarDrafts = await generateCalendarPlan({
      client: ctx.client,
      knowledge: compressed.facts,
      month
    });

    return {
      planItems: calendarDrafts.map((pi, idx) => ({
        id: `plan_${idx + 1}`,
        title: pi.title,
        channel: pi.channel,
        publishDate: pi.publishDate,
        notes: pi.notes
      })),
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
