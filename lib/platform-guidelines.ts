import type { AssetFormat, Channel, Client, KnowledgeItem, MemoryCard } from "./types";

export interface PlatformGuideline {
  channel: Channel;
  name: string;
  hookGuide: string;
  structureGuide: string;
  pacingGuide: string;
  ctaGuide: string;
  charRange: { min: number; max: number; optimal: string };
  antiPatterns: string[];
  bestPractices: string[];
}

export const PLATFORM_GUIDELINES: Record<AssetFormat, PlatformGuideline> = {
  linkedin_post: {
    channel: "linkedin",
    name: "LinkedIn Thought Leadership",
    hookGuide: "First 1-2 lines (under 140 chars) must challenge conventional wisdom or present an unexpected tension before the '...see more' fold.",
    structureGuide: "Hook → Core Tension → 3 concrete, data-backed bullet points citing verified client knowledge → Operational takeaway → Engagement question.",
    pacingGuide: "Short paragraphs (1-2 sentences each). Generous whitespace for mobile readability. No walls of text.",
    ctaGuide: "Ask a specific, non-generic discussion question. Avoid cringe engagement bait like 'Agree?' or 'Thoughts?'.",
    charRange: { min: 600, max: 2200, optimal: "1,100 – 1,500 characters" },
    antiPatterns: [
      "Humblebragging or overly emotional self-congratulation",
      "Generic buzzwords ('game-changer', 'delve', 'testament to')",
      "Overloading with 10+ irrelevant hashtags"
    ],
    bestPractices: [
      "Ground every quantitative claim in approved knowledge",
      "Infuse the founder's authentic memory angle in the perspective line",
      "Include a clear source attribution line at the bottom"
    ]
  },
  x_thread: {
    channel: "x",
    name: "X (Twitter) Breakdown Thread",
    hookGuide: "Tweet 1 (Hook) must stand completely alone as a high-engagement insight or bold data point that demands expanding.",
    structureGuide: "Tweet 1: Bold premise / hook → Tweets 2-4: Bite-sized evidence and facts (1 per tweet) → Tweet 5: Strategic takeaway → Tweet 6: Resource link and bookmark prompt.",
    pacingGuide: "Numbered tweets (1/, 2/, 3/, ...). Strict limit of 240 characters per tweet for readability and quoting.",
    ctaGuide: "Prompt users to bookmark the thread, repost the first tweet, or visit the client website for full documentation.",
    charRange: { min: 400, max: 1800, optimal: "4 – 6 numbered tweets" },
    antiPatterns: [
      "Vague cliffhangers without actual substance",
      "Using all 280 characters with zero punctuation breathing room",
      "Unbacked superlatives ('the absolute best tool in history')"
    ],
    bestPractices: [
      "Every single tweet must teach something independently useful",
      "Lead with contrast ('Most teams do X. The top 5% do Y.')",
      "Cite verified client proof points in the middle tweets"
    ]
  },
  reel_script: {
    channel: "instagram",
    name: "Short-Form Video Reel / Short Script",
    hookGuide: "First 3 seconds must have a kinetic visual cue and a verbal pattern-interrupt hook that stops thumb scrolling.",
    structureGuide: "Hook (0-3s) → Beat 1 Core Tension (3-10s) → Beat 2 Proof / Fact (10-20s) → Beat 3 Unique POV (20-32s) → Beat 4 CTA (32-45s).",
    pacingGuide: "Strictly separate VOICEOVER (spoken audio) and ON-SCREEN (visual text & b-roll instructions). Rapid 3-5 second beats.",
    ctaGuide: "High-intent CTA: 'Save this guide', 'Check the link in bio', or 'Comment [KEYWORD] for the breakdown'.",
    charRange: { min: 300, max: 1200, optimal: "30 – 45 seconds total duration" },
    antiPatterns: [
      "Slow introductory greetings ('Hey guys, welcome back...')",
      "Putting claims in voiceover that cannot be shown or cited on-screen",
      "Overcrowding the safe margins (keep clear of top/bottom UI overlays)"
    ],
    bestPractices: [
      "High contrast on-screen text instructions",
      "Include aspect ratio recommendation (9:16 vertical)",
      "Strictly ground all on-screen stats in approved brain facts"
    ]
  },
  seo_article: {
    channel: "blog",
    name: "High E-E-A-T Answer-First SEO Guide",
    hookGuide: "AEO/GEO Optimized Opening: The first 80 words must provide a direct, definitive answer to the core search intent query.",
    structureGuide: "H1 Title → Direct Executive Summary → H2 Architecture / Core Mechanics → H2 Practical Case Evidence & Steps → H2 Common Pitfalls → H2 Conclusion & Verification Checklist.",
    pacingGuide: "Clean hierarchical subheadings (H2, H3), structured bullet lists, code/architecture callouts, and multi-source reference section.",
    ctaGuide: "Logical next architectural step: link to client documentation, product trial, or verified service page.",
    charRange: { min: 1200, max: 8000, optimal: "1,200 – 1,800 words" },
    antiPatterns: [
      "Rambling historical intros ('Since the dawn of time...')",
      "Passive fluff without concrete examples or verified numbers",
      "Unverified statistical claims without primary source links"
    ],
    bestPractices: [
      "Target Answer-Engine Optimization (AEO) and Google AI Overviews",
      "Strict multi-source attribution matching client knowledge items",
      "Maintain 100% human-level engineering depth and clarity"
    ]
  },
  newsletter: {
    channel: "newsletter",
    name: "Executive Dispatch Newsletter",
    hookGuide: "Subject line under 50 characters blending curiosity and direct utility. Opening sentence is a warm, direct 1-to-1 founder note.",
    structureGuide: "Curated Subject Line → The Big Shift / Theme → What We Verified (3 brain points) → Founder Editorial Take → Actionable Takeaway → P.S. Note.",
    pacingGuide: "Conversational, intimate, high-signal. Reads like a personal email from a knowledgeable friend, not a marketing broadcast.",
    ctaGuide: "Direct reply prompt: 'Reply to this email and let me know your take' or link to an in-depth case study.",
    charRange: { min: 600, max: 2500, optimal: "800 – 1,200 words" },
    antiPatterns: [
      "Impersonal third-person corporate tone",
      "Generic industry news roundups with no original perspective",
      "Aggressive multi-button hard sells"
    ],
    bestPractices: [
      "Incorporate approved founder opinions from workspace memory cards",
      "Include a candid P.S. that sparks direct email replies",
      "Ground all business claims in approved client knowledge"
    ]
  },
  caption: {
    channel: "instagram",
    name: "Social Post Caption",
    hookGuide: "One punchy sentence that anchors the accompanying image or video carousel.",
    structureGuide: "Hook → 2-3 value bullets → Core takeaway → Action CTA → 3-5 curated hashtags.",
    pacingGuide: "Crisp line breaks; easy to skim in 5 seconds.",
    ctaGuide: "'Save this for your next sprint', 'Share with your team', or 'Link in bio'.",
    charRange: { min: 150, max: 1000, optimal: "250 – 450 characters" },
    antiPatterns: ["Hashtag stuffing (more than 5 hashtags)", "Wall of emoji without substance"],
    bestPractices: ["Clean typography", "Direct alignment with the generated visual asset"]
  },
  faq: {
    channel: "blog",
    name: "Structured Search FAQ",
    hookGuide: "Direct question formulation matching real customer search queries.",
    structureGuide: "Question H2 → Direct 1-2 sentence verified answer → Nuance/Context → Source link.",
    pacingGuide: "Modular Q&A format. Each question can be read in isolation.",
    ctaGuide: "Clear path for further questions or official contact.",
    charRange: { min: 500, max: 3000, optimal: "3 – 5 core Q&As" },
    antiPatterns: ["Evasive corporate answers", "Promotional fluff instead of factual clarity"],
    bestPractices: ["Match exact user query wording", "Cite verified knowledge items directly"]
  }
};

// Forbidden synthetic AI tropes that trigger penalties and feel robotic
export const FORBIDDEN_AI_PHRASES = [
  "delve into",
  "delving into",
  "testament to",
  "game-changer",
  "in today's fast-paced world",
  "in today's digital landscape",
  "tapestry of",
  "beacon of",
  "unleash the power",
  "vital role",
  "crucial role",
  "seamlessly",
  "revolutionary approach",
  "look no further",
  "furthermore,",
  "moreover,",
  "foster collaboration",
  "synergy"
];

export function auditDraftForQuality(
  text: string,
  client: Client,
  format: AssetFormat
): { qualityFlags: string[]; warnings: string[] } {
  const flags: string[] = [];
  const warnings: string[] = [];
  const lower = text.toLowerCase();

  // Check forbidden AI phrases
  for (const phrase of FORBIDDEN_AI_PHRASES) {
    if (lower.includes(phrase)) {
      flags.push(`anti-ai-pattern: "${phrase}"`);
      warnings.push(`Contains synthetic AI phrase "${phrase}" — replace with plain, specific phrasing.`);
    }
  }

  // Check restricted claims
  if (client.restrictedClaims) {
    const restrictions = client.restrictedClaims
      .split(/[,;\n]/)
      .map((r) => r.trim().toLowerCase())
      .filter((r) => r.length > 4);

    for (const restriction of restrictions) {
      if (lower.includes(restriction)) {
        flags.push(`restricted-claim-violation: "${restriction}"`);
        warnings.push(`Violates client restricted claim: "${restriction}". Remove or revise immediately.`);
      }
    }
  }

  // Check length against platform guidelines
  const guide = PLATFORM_GUIDELINES[format];
  if (guide) {
    if (text.length < guide.charRange.min) {
      flags.push("length-too-short-for-platform");
      warnings.push(`Draft is shorter than recommended for ${guide.name} (${text.length} < ${guide.charRange.min} chars).`);
    }
  }

  return { qualityFlags: flags, warnings };
}

export function formatBrainAndMemoryPrompt(
  client: Client,
  knowledge: KnowledgeItem[],
  memory: MemoryCard[] = []
): string {
  const approvedKnowledge = knowledge.filter((k) => k.status === "approved");
  const approvedMemory = memory.filter((m) => m.status === "approved");

  const brandFacts = approvedKnowledge.filter((k) => k.kind === "brand_fact" || k.kind === "website");
  const audienceInsights = approvedKnowledge.filter((k) => k.kind === "audience");
  const guidelines = approvedKnowledge.filter((k) => k.kind === "writing_guideline");
  const otherFacts = approvedKnowledge.filter(
    (k) => !["brand_fact", "website", "audience", "writing_guideline"].includes(k.kind)
  );

  const memoryOpinions = approvedMemory.filter((m) => m.kind === "opinion");
  const memoryVoice = approvedMemory.filter((m) => m.kind === "voice_example");
  const memoryFacts = approvedMemory.filter((m) => m.kind === "fact");

  return [
    "===========================================================",
    "CLIENT KNOWLEDGE BRAIN (VERIFIED BRAND TRUTHS):",
    `Brand: ${client.name}`,
    client.industry ? `Industry: ${client.industry}` : "",
    client.audience ? `Target Audience: ${client.audience}` : "",
    client.tone ? `Tone & Voice: ${client.tone}` : "",
    client.restrictedClaims ? `RESTRICTED CLAIMS (DO NOT CLAIM): ${client.restrictedClaims}` : "",
    client.summary ? `Value Proposition: ${client.summary}` : "",
    "",
    "APPROVED BRAND FACTS (Cite by id):",
    brandFacts.length > 0
      ? brandFacts.map((k) => `- [${k.id}] (${k.title}): ${k.body}${k.sourceUrl ? ` (Source: ${k.sourceUrl})` : ""}`).join("\n")
      : "- None supplied; rely strictly on client metadata.",
    "",
    "AUDIENCE & ICP INSIGHTS:",
    audienceInsights.length > 0
      ? audienceInsights.map((k) => `- [${k.id}] ${k.title}: ${k.body}`).join("\n")
      : "- General professional buyers in this vertical.",
    "",
    "BRAND GUIDELINES & BOUNDARIES:",
    guidelines.length > 0
      ? guidelines.map((k) => `- [${k.id}] ${k.title}: ${k.body}`).join("\n")
      : "- Confident, plain, factual, zero hype.",
    "",
    otherFacts.length > 0
      ? `ADDITIONAL EVIDENCE:\n${otherFacts.map((k) => `- [${k.id}] ${k.title}: ${k.body}`).join("\n")}\n`
      : "",
    "===========================================================",
    "WORKSPACE & FOUNDER MEMORY (CORE OPINIONS & VOICE):",
    memoryOpinions.length > 0
      ? `APPROVED OPINIONS (Ground opinions here):\n${memoryOpinions.map((m) => `- (${m.id}): ${m.body}`).join("\n")}`
      : "- Founder POV: Specificity beats volume; ground decisions in practical reality.",
    "",
    memoryVoice.length > 0
      ? `APPROVED VOICE EXAMPLES:\n${memoryVoice.map((m) => `- ${m.body}`).join("\n")}`
      : "- Voice: Direct, conversational, specific, transparent.",
    "",
    memoryFacts.length > 0
      ? `FOUNDER MEMORY FACTS:\n${memoryFacts.map((m) => `- ${m.body}`).join("\n")}`
      : "",
    "==========================================================="
  ].filter(Boolean).join("\n");
}
