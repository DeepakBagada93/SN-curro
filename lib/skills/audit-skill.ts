import { REGISTERED_SKILLS, type CurroSkill, type SkillExecutionContext } from "./core-skills";
import { compressKnowledgeContext } from "./token-compressor";

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

export interface AuditSkillOutput {
  report: ContentAuditReport;
  tokenSavings: {
    baselineFactCount: number;
    compressedFactCount: number;
    baselineEstimatedTokens: number;
    compressedEstimatedTokens: number;
    tokensSaved: number;
    savingsRatio: number;
  };
}

export const auditSkill: CurroSkill<AuditSkillOutput> = {
  metadata: REGISTERED_SKILLS.audit,
  async execute(ctx: SkillExecutionContext): Promise<AuditSkillOutput> {
    const rawText = ctx.prompt
      .replace(/^\/audit\s*/i, "")
      .replace(/^(audit|check|verify|analyze|critique)\s*(this)?\s*:?/i, "")
      .trim();

    const compressed = compressKnowledgeContext(rawText, ctx.approvedKnowledge, 8);

    const sentences = rawText
      .split(/(?<=[.?!])\s+/)
      .filter((s) => s.trim().length > 10);

    const claims: ContentAuditReport["claims"] = [];
    const violations: string[] = [];

    const restrictedKeywords = (ctx.client.restrictedClaims || "")
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

      // Check if matched against any knowledge item in compressed set
      const matchedFact = compressed.facts.find((k) =>
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

    const report: ContentAuditReport = {
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

    return {
      report,
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
