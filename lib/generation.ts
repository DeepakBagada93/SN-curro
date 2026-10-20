import { z } from "zod";
import type { ClaimEntry, MemoryCard, SourceResult } from "./types";
import { uid } from "./store";
import { chatText, extractJson, modelFor, openRouterConfigured } from "./openrouter";

export const DraftOutputSchema = z.object({
  body: z.string().min(40).max(3000),
  claims: z.array(z.object({
    text: z.string().min(4).max(300),
    kind: z.enum(["factual", "opinion", "unsupported"]),
    source_ids: z.array(z.string()).default([]),
    review_note: z.string().nullable().default(null)
  })).min(1).max(12),
  quality_flags: z.array(z.string()).default([]),
  brand_fit_note: z.string().max(500).default("")
});
export type StructuredDraft = z.infer<typeof DraftOutputSchema>;

export interface DraftRequest {
  signalTitle: string;
  angle: string;
  sources: SourceResult[];
  memories: MemoryCard[];
  restricted: string;
}
export interface ModelProvider {
  readonly model: string;
  generateDraft(input: DraftRequest): Promise<StructuredDraft>;
}

// Server-only mock composer: deterministic, source-grounded, never invents outcomes.
export class MockModelAdapter implements ModelProvider {
  model = "mock/composer-v1";
  async generateDraft(input: DraftRequest): Promise<StructuredDraft> {
    const src = input.sources[0];
    const voice = input.memories.find((m) => m.kind === "voice_example")?.body ?? "Plain, direct, cites the source inline.";
    const fact = input.memories.find((m) => m.kind === "fact")?.body;
    const lines = [
      input.signalTitle + ".",
      "",
      `My angle: ${input.angle}`,
      "",
      src ? `What changed (via ${src.publisher}): ${src.excerpt}` : "What changed: see cited sources.",
      "",
      "Why it matters for our buyers: specificity beats volume. One named proof point earns more replies than ten generic posts.",
      fact ? `How we work: ${fact}` : "",
      "",
      `Voice: ${voice}`,
      "",
      src ? `Source: ${src.title} — ${src.canonicalUrl}` : "",
      "",
      "If I'm wrong here, tell me — I'll correct it in public."
    ].filter(Boolean);
    const body = lines.join("\n").slice(0, 1300);
    const draft = {
      body,
      claims: [
        { text: src?.excerpt.slice(0, 140) ?? "Source finding summarized above", kind: "factual" as const, source_ids: src ? [src.id] : [], review_note: null },
        { text: input.angle.slice(0, 140), kind: "opinion" as const, source_ids: [], review_note: "Founder angle — owned opinion, not externally verified." },
        { text: "This approach earns more qualified replies", kind: "unsupported" as const, source_ids: [], review_note: "Comparative outcome without a cited control — edit or remove before approval." }
      ],
      quality_flags: input.angle.length < 20 ? ["angle-too-short"] : [],
      brand_fit_note: "Draft uses approved voice and avoids restricted claims; unsupported line flagged for founder edit."
    };
    return DraftOutputSchema.parse(draft);
  }
}

export class OpenRouterModelAdapter implements ModelProvider {
  model: string;
  private fallback = new MockModelAdapter();

  constructor() {
    this.model = modelFor("strong");
  }

  async generateDraft(input: DraftRequest): Promise<StructuredDraft> {
    const sourceBlock = input.sources
      .map((s) => `- id=${s.id} | ${s.title} | ${s.publisher} | ${s.canonicalUrl}\n  ${s.excerpt.slice(0, 900)}`)
      .join("\n");
    const memoryBlock = input.memories
      .map((m) => `- (${m.kind}) ${m.body}`)
      .join("\n");

    try {
      const { text, model } = await chatText({
        tier: "strong",
        maxTokens: 3000,
        temperature: 0.45,
        system: [
          "You are an evidence-grounded editorial strategist writing one LinkedIn post for a B2B founder.",
          "You must not invent facts, statistics, customers, outcomes, or experiences.",
          "Use only the supplied sources and approved memory cards.",
          "Every factual claim must list at least one supplied source id in source_ids.",
          "Opinions must be labelled opinion with no source ids.",
          "If a sentence has no support, label it unsupported and explain how to fix it.",
          "Reply with ONLY a JSON object, no markdown fences, matching:",
          `{"body": string (40-3000 chars), "claims": [{"text": string, "kind": "factual"|"opinion"|"unsupported", "source_ids": string[], "review_note": string|null}], "quality_flags": string[], "brand_fit_note": string}`
        ].join(" "),
        user: [
          `SIGNAL: ${input.signalTitle}`,
          `FOUNDER ANGLE (owned opinion): ${input.angle}`,
          `RESTRICTED CLAIMS: ${input.restricted || "none stated"}`,
          "",
          "SUPPLIED SOURCES:",
          sourceBlock || "(none)",
          "",
          "APPROVED MEMORY CARDS:",
          memoryBlock || "(none)"
        ].join("\n")
      });

      const parsed = DraftOutputSchema.parse(extractJson(text));
      const validSourceIds = new Set(input.sources.map((s) => s.id));
      const claims = parsed.claims.map((c) => {
        const sourceIds = c.source_ids.filter((id) => validSourceIds.has(id));
        if (c.kind === "factual" && sourceIds.length === 0) {
          return {
            ...c,
            kind: "unsupported" as const,
            source_ids: [],
            review_note: "Model produced an uncited factual claim — cite a supplied source or remove it."
          };
        }
        return { ...c, source_ids: sourceIds };
      });
      this.model = model;
      return { ...parsed, claims };
    } catch (error) {
      const draft = await this.fallback.generateDraft(input);
      const reason = error instanceof Error ? error.message.slice(0, 140) : "unknown provider error";
      this.model = `mock/composer-v1 (openrouter fallback)`;
      return {
        ...draft,
        quality_flags: [...draft.quality_flags, `openrouter-fallback: ${reason}`],
        brand_fit_note: `${draft.brand_fit_note} Provider fallback used: ${reason}`
      };
    }
  }
}

export function getModelProvider(): ModelProvider {
  return openRouterConfigured() ? new OpenRouterModelAdapter() : new MockModelAdapter();
}

export function toClaimEntries(versionId: string, workspaceId: string, draft: StructuredDraft): ClaimEntry[] {
  return draft.claims.map((c) => ({
    id: uid("clm"), workspaceId, versionId,
    claim: c.text, kind: c.kind, sourceIds: c.source_ids,
    reviewNote: c.review_note, reviewStatus: "open" as const
  }));
}

// Content-state transition rules — no publishing in beta (PRD-10).
const TRANSITIONS: Record<string, string[]> = {
  draft: ["in_review", "archived"],
  in_review: ["approved", "rejected", "draft"],
  approved: ["archived"],
  rejected: ["draft", "archived"],
  archived: []
};
export function canTransition(from: string, to: string): boolean {
  if (to === "published") return false; // beta hard-block
  return (TRANSITIONS[from] ?? []).includes(to);
}
