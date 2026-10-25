import type { Client, KnowledgeItem, AssetFormat } from "../types";

export interface SkillMetadata {
  id: string;
  name: string;
  description: string;
  slashCommand: string;
  category: "creative" | "visual" | "audit" | "knowledge" | "strategy";
  icon: string;
  supportedFormats?: AssetFormat[];
}

export const ANTI_AI_FLUFF_RULES = [
  "Strictly eliminate synthetic clichés: 'In today's fast-paced world', 'delve into', 'tapestry', 'testament', 'beacon', 'unleash', 'game-changer', 'revolutionize'.",
  "Write with authentic practitioner voice: authoritative, concrete, rhythmically varied, and direct.",
  "Every statistic or client capability claim must cite an approved fact from the client knowledge brain.",
  "Unsupported assertions must be flagged clearly rather than invented.",
  "Prioritize clear causality, specific operational steps, and measurable proof points over decorative adjectives."
];

export const EEAT_CITATIONS_GUIDELINES = [
  "Experience: Reference real operational context, engineering constraints, or agency workflows.",
  "Expertise: Use precise domain terminology without empty buzzwords.",
  "Authoritativeness: Ground every positioning statement in approved client knowledge items.",
  "Trustworthiness: Enforce zero-hallucination boundaries on pricing, integrations, metrics, and customer outcomes."
];

export interface CompressedKnowledgeContext {
  facts: KnowledgeItem[];
  baselineFactCount: number;
  baselineEstimatedTokens: number;
  compressedFactCount: number;
  compressedEstimatedTokens: number;
  tokensSaved: number;
  savingsRatio: number; // e.g. 0.68 for 68% saved
}

export interface SkillExecutionContext {
  client: Client;
  prompt: string;
  rawPrompt?: string;
  approvedKnowledge: KnowledgeItem[];
  allKnowledge?: KnowledgeItem[];
  compressedKnowledge?: CompressedKnowledgeContext;
  selectedFormat?: AssetFormat;
}

export interface CurroSkill<TOutput = any> {
  metadata: SkillMetadata;
  execute: (context: SkillExecutionContext) => Promise<TOutput>;
}

export const REGISTERED_SKILLS: Record<string, SkillMetadata> = {
  content: {
    id: "content",
    name: "Editorial Content Generator",
    description: "Generates high-converting, human-written posts with verified claim ledger citations.",
    slashCommand: "/draft",
    category: "creative",
    icon: "✍️",
    supportedFormats: [
      "linkedin_post",
      "x_thread",
      "reel_script",
      "seo_article",
      "newsletter",
      "faq"
    ]
  },
  visual: {
    id: "visual",
    name: "Brand SVG Visual Studio",
    description: "Generates high-contrast branded SVGs, infographics, quotes, and metric callouts.",
    slashCommand: "/image",
    category: "visual",
    icon: "🎨"
  },
  brainstorm: {
    id: "brainstorm",
    name: "Contrarian Angle & Hook Discovery",
    description: "Discovers audience tension points, contrarian angles, and high-CTR hooks.",
    slashCommand: "/brainstorm",
    category: "creative",
    icon: "💡"
  },
  audit: {
    id: "audit",
    name: "Claim Verification & Anti-Hallucination Audit",
    description: "Audits text sentence-by-sentence against approved client facts.",
    slashCommand: "/audit",
    category: "audit",
    icon: "🛡️"
  },
  ingest: {
    id: "ingest",
    name: "Web & Document Knowledge Ingestion",
    description: "Scrapes URLs and distills text into structured client knowledge facts.",
    slashCommand: "/ingest",
    category: "knowledge",
    icon: "🧠"
  },
  plan: {
    id: "plan",
    name: "Editorial Strategy & Publishing Planner",
    description: "Synthesizes 7-day to 30-day publishing schedules aligned with brand pillars.",
    slashCommand: "/plan",
    category: "strategy",
    icon: "📅"
  }
};
