import { describe, it, expect } from "vitest";
import {
  estimateTokens,
  compressKnowledgeContext,
  extractKeywords,
  formatCompressedKnowledgePrompt
} from "../lib/skills/token-compressor";
import {
  parseVisualDirectives
} from "../lib/skills/visual-skill";
import {
  getSkillBySlashCommand,
  REGISTERED_SKILLS
} from "../lib/skills";
import { classifyAgentIntent } from "../lib/agent-engine";
import type { KnowledgeItem } from "../lib/types";

describe("Token Compressor & Context Pruner", () => {
  const dummyFacts: KnowledgeItem[] = Array.from({ length: 15 }).map((_, i) => ({
    id: `kno_${i + 1}`,
    workspaceId: "ws_test",
    clientId: "cl_test",
    kind: i === 0 ? "brand_fact" : "seo_research",
    title: i === 3 ? "Enterprise SSO and SOC2 Compliance" : `Knowledge Fact #${i + 1}`,
    body: i === 3 ? "We support SAML 2.0, Okta, and SOC2 certified data encryption at rest." : `General operational fact description details for item ${i + 1}.`,
    sourceUrl: null,
    status: "approved",
    provenance: "manual",
    tags: i === 3 ? ["security", "enterprise", "soc2"] : ["tag1"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    approvedAt: new Date().toISOString()
  }));

  it("estimates token counts accurately based on string length", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("hello world")).toBe(3); // 11 / 3.8 = 2.89 -> 3
  });

  it("extracts keywords while dropping common stop words", () => {
    const kws = extractKeywords("Write a LinkedIn post about our enterprise SOC2 security architecture");
    expect(kws).toContain("enterprise");
    expect(kws).toContain("soc2");
    expect(kws).toContain("security");
    expect(kws).toContain("architecture");
    expect(kws).not.toContain("about");
    expect(kws).not.toContain("our");
  });

  it("compresses 15 facts down to top 6 relevant facts and computes token savings", () => {
    const prompt = "Draft an executive briefing on enterprise SOC2 security compliance";
    const compressed = compressKnowledgeContext(prompt, dummyFacts, 6);

    expect(compressed.compressedFactCount).toBe(6);
    expect(compressed.baselineFactCount).toBe(15);
    expect(compressed.tokensSaved).toBeGreaterThan(0);
    expect(compressed.savingsRatio).toBeGreaterThan(0.5); // At least 50% savings

    // Fact #4 (index 3) should be prioritized #1 due to SOC2 and security matches
    expect(compressed.facts.some((f) => f.title.includes("SOC2"))).toBe(true);
  });

  it("formats compressed knowledge into prompt-ready blocks", () => {
    const compressed = compressKnowledgeContext("SOC2", dummyFacts.slice(0, 2), 6);
    const formatted = formatCompressedKnowledgePrompt(compressed);
    expect(formatted).toContain("[Fact 1 | ID:");
    expect(formatted).toContain("Title:");
  });
});

describe("Visual Directives Parser", () => {
  it("detects 9:16 vertical reels aspect ratio", () => {
    const parsed = parseVisualDirectives("/image create a 9:16 vertical reel title cover for SaaS marketing");
    expect(parsed.aspect).toBe("story");
    expect(parsed.style).toBe("editorial");
    expect(parsed.cleanPrompt).toContain("create a 9:16 vertical reel title cover");
  });

  it("detects 16:9 landscape aspect ratio and framework style", () => {
    const parsed = parseVisualDirectives("/image 16:9 landscape framework architecture diagram of our data pipeline");
    expect(parsed.aspect).toBe("landscape");
    expect(parsed.style).toBe("framework");
  });

  it("detects stat_callout style and square 1:1 aspect ratio", () => {
    const parsed = parseVisualDirectives("1:1 square stat callout showing 99.9% uptime metric");
    expect(parsed.aspect).toBe("square");
    expect(parsed.style).toBe("stat_callout");
  });

  it("detects executive quote style", () => {
    const parsed = parseVisualDirectives("portrait quote from founder about software simplicity");
    expect(parsed.aspect).toBe("portrait");
    expect(parsed.style).toBe("minimal_quote");
  });
});

describe("AI Skills Registry & Slash Command Routing", () => {
  it("resolves all registered slash commands to valid skills", () => {
    expect(getSkillBySlashCommand("/draft")?.metadata.id).toBe("content");
    expect(getSkillBySlashCommand("/image")?.metadata.id).toBe("visual");
    expect(getSkillBySlashCommand("/brainstorm")?.metadata.id).toBe("brainstorm");
    expect(getSkillBySlashCommand("/audit")?.metadata.id).toBe("audit");
    expect(getSkillBySlashCommand("/ingest")?.metadata.id).toBe("ingest");
    expect(getSkillBySlashCommand("/plan")?.metadata.id).toBe("plan");
  });

  it("verifies all 6 registered skills are defined with metadata", () => {
    expect(Object.keys(REGISTERED_SKILLS)).toEqual([
      "content",
      "visual",
      "brainstorm",
      "audit",
      "ingest",
      "plan"
    ]);
  });
});

describe("Agent Intent Classification with Slash Commands & Images", () => {
  it("classifies /image slash command as generate_image", () => {
    expect(classifyAgentIntent("/image create a metric graphic")).toBe("generate_image");
    expect(classifyAgentIntent("/visual 1:1 quote card")).toBe("generate_image");
    expect(classifyAgentIntent("/svg architecture blueprint")).toBe("generate_image");
  });

  it("classifies natural language image requests as generate_image", () => {
    expect(classifyAgentIntent("create an SVG graphic showing our architecture")).toBe("generate_image");
    expect(classifyAgentIntent("generate an image banner for our blog")).toBe("generate_image");
    expect(classifyAgentIntent("make a visual card for linkedin")).toBe("generate_image");
  });

  it("classifies /draft, /audit, /brainstorm, /ingest, /plan commands", () => {
    expect(classifyAgentIntent("/draft Why simple architectures win")).toBe("draft_content");
    expect(classifyAgentIntent("/audit Most enterprise SDRs fail")).toBe("audit_content");
    expect(classifyAgentIntent("/brainstorm 3 counter-intuitive takes")).toBe("brainstorm");
    expect(classifyAgentIntent("/ingest https://saasnext.in")).toBe("build_brain");
    expect(classifyAgentIntent("/plan next month's schedule")).toBe("plan_content");
  });
});
