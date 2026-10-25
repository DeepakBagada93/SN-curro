import { describe, it, expect } from "vitest";
import { canonicalUrl, scoreSource } from "../lib/research";
import { canTransition } from "../lib/generation";
import { slugify, uniqueSlug, knowledgeStats, parseTags, ClientCreateSchema, KnowledgeCreateSchema, KnowledgeUpdateSchema, PlanItemCreateSchema } from "../lib/clients";
import { canAssetTransition, claimBlockers, canApproveAsset, PLAN_CATALOG } from "../lib/agency";
import { buildCalendarDrafts } from "../lib/planner";
import { createReviewToken, verifyReviewToken } from "../lib/review";
import { generateStudioDraft } from "../lib/studio";
import { scrapeUrlForKnowledge, scaffoldStarterBrainFacts, extractFactsFromText } from "../lib/crawler";
import { extractJson } from "../lib/openrouter";
import { auditDraftForQuality, PLATFORM_GUIDELINES, formatBrainAndMemoryPrompt } from "../lib/platform-guidelines";
import { suggestImagePrompts, buildImageSvg, IMAGE_ASPECTS, IMAGE_STYLES } from "../lib/images";
import { generateCalendarPlan } from "../lib/planner";

describe("canonicalUrl", () => {
  it("strips tracking params and www", () => {
    expect(canonicalUrl("https://www.example.com/p?utm_source=x&fbclid=1")).toBe("https://example.com/p");
  });
  it("rejects non-http", () => {
    expect(canonicalUrl("ftp://example.com/x")).toBeNull();
  });
  it("dedups trailing slash", () => {
    expect(canonicalUrl("https://example.com/a/")).toBe(canonicalUrl("https://example.com/a"));
  });
});

describe("scoring", () => {
  it("penalizes dismissed themes", () => {
    const base = { title: "t", excerpt: "x".repeat(200), publishedAt: new Date().toISOString(), queryHits: 2, seenBefore: false };
    const a = scoreSource({ ...base, dismissedRecently: false });
    const b = scoreSource({ ...base, dismissedRecently: true });
    expect(b.total).toBeLessThan(a.total);
  });
  it("fresh beats stale", () => {
    const fresh = scoreSource({ title: "t", excerpt: "y".repeat(200), publishedAt: new Date().toISOString(), queryHits: 2, seenBefore: false, dismissedRecently: false });
    const stale = scoreSource({ title: "t", excerpt: "y".repeat(200), publishedAt: new Date(Date.now() - 60 * 864e5).toISOString(), queryHits: 2, seenBefore: false, dismissedRecently: false });
    expect(fresh.total).toBeGreaterThan(stale.total);
  });
});

describe("transitions", () => {
  it("never allows publishing in beta", () => {
    expect(canTransition("approved", "published")).toBe(false);
    expect(canTransition("in_review", "published")).toBe(false);
  });
  it("allows approve from review", () => {
    expect(canTransition("in_review", "approved")).toBe(true);
  });
});

describe("agency client helpers", () => {
  it("slugifies names and keeps slugs unique", () => {
    expect(slugify("Northfield University")).toBe("northfield-university");
    expect(slugify("  A/B  Test!! ")).toBe("a-b-test");
    const db = { clients: [{ id: "1", slug: "acme" }, { id: "2", slug: "acme-2" }] };
    expect(uniqueSlug(db, "Acme")).toBe("acme-3");
    expect(uniqueSlug(db, "Acme", "2")).toBe("acme-2");
  });

  it("counts knowledge by status without mutating", () => {
    const stats = knowledgeStats([
      { status: "approved" }, { status: "approved" }, { status: "candidate" }, { status: "archived" }
    ]);
    expect(stats).toEqual({ total: 4, approved: 2, candidate: 1, archived: 1 });
  });

  it("parses tags from comma-separated form input", () => {
    expect(parseTags("mba, admissions ,,seo")).toEqual(["mba", "admissions", "seo"]);
  });

  it("defaults new knowledge to candidate until approved", () => {
    const parsed = KnowledgeCreateSchema.safeParse({
      kind: "brand_fact",
      title: "Part-time format",
      body: "36 credits delivered in the evening over 24-30 months."
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.status).toBe("candidate");
  });

  it("rejects a client with a one-character name and bad colour", () => {
    expect(ClientCreateSchema.safeParse({ name: "A", brandColor: "orange" }).success).toBe(false);
  });

  it("requires a valid ISO publishing date", () => {
    expect(PlanItemCreateSchema.safeParse({ title: "Post", channel: "linkedin", publishDate: "2026-11-03" }).success).toBe(true);
    expect(PlanItemCreateSchema.safeParse({ title: "Post", channel: "linkedin", publishDate: "03/11/2026" }).success).toBe(false);
  });

  it("validates knowledge updates properly", () => {
    const valid = KnowledgeUpdateSchema.safeParse({
      title: "Updated Brand Fact",
      body: "This is a verified statement with at least 10 characters.",
      status: "approved",
      tags: ["pricing", "features"]
    });
    expect(valid.success).toBe(true);

    const invalidTitle = KnowledgeUpdateSchema.safeParse({ title: "ab" });
    expect(invalidTitle.success).toBe(false);

    const invalidBody = KnowledgeUpdateSchema.safeParse({ body: "short" });
    expect(invalidBody.success).toBe(false);
  });
});


describe("agency workflow guards", () => {
  it("only approves from draft or in_review and never skips to published", () => {
    expect(canAssetTransition("draft", "in_review")).toBe(true);
    expect(canAssetTransition("draft", "published")).toBe(false);
    expect(canAssetTransition("approved", "published")).toBe(false);
    expect(canAssetTransition("approved", "scheduled")).toBe(true);
    expect(canAssetTransition("scheduled", "published")).toBe(true);
  });

  it("blocks approval when an unsupported claim is still open", () => {
    const asset = { id: "a", status: "in_review", clientId: "c1", knowledgeIds: ["k1"] } as never;
    const version = { id: "v1" } as never;
    const claims = [{ versionId: "v1", kind: "unsupported", reviewStatus: "open", sourceIds: [] }] as never;
    const res = canApproveAsset(asset, version, claims, [{ id: "k1", status: "approved", clientId: "c1" }]);
    expect(res.ok).toBe(false);
    expect(res.blockers.map((b) => b.code)).toContain("unsupported");
  });

  it("blocks approval when a factual claim has no source", () => {
    const blockers = claimBlockers(
      { id: "a", status: "in_review", clientId: "c1", knowledgeIds: ["k1"] } as never,
      { id: "v1" } as never,
      [{ versionId: "v1", kind: "factual", reviewStatus: "open", sourceIds: [] }] as never,
      [{ id: "k1", status: "approved", clientId: "c1" }]
    );
    expect(blockers.map((b) => b.code)).toContain("uncited-fact");
  });

  it("blocks approval when the attached knowledge is unapproved or cross-client", () => {
    const blockers = claimBlockers(
      { id: "a", status: "in_review", clientId: "c1", knowledgeIds: ["k1", "k2"] } as never,
      { id: "v1" } as never,
      [],
      [{ id: "k1", status: "candidate", clientId: "c1" }, { id: "k2", status: "approved", clientId: "c2" }]
    );
    const codes = blockers.map((b) => b.code);
    expect(codes).toContain("unapproved-knowledge");
    expect(codes).toContain("cross-client");
  });

  it("requires alt text when an image is attached", () => {
    const blockers = claimBlockers(
      { id: "a", status: "in_review", clientId: "c1", knowledgeIds: [], imageId: "img1" } as never,
      { id: "v1" } as never, [], []
    );
    expect(blockers.map((b) => b.code)).toContain("image-alt");
  });

  it("publishes plan tiers with increasing generation caps", () => {
    expect(PLAN_CATALOG.solo.generations).toBeLessThan(PLAN_CATALOG.agency.generations);
    expect(PLAN_CATALOG.enterprise.clients).toBeGreaterThan(PLAN_CATALOG.studio.clients);
  });
});

describe("planner generation", () => {
  const client = { id: "c1" } as never;
  const knowledge = [
    { id: "k1", clientId: "c1", status: "approved", kind: "brand_fact", title: "Part-time MBA", tags: ["mba"] },
    { id: "k2", clientId: "c1", status: "candidate", kind: "brand_fact", title: "Unapproved", tags: [] }
  ] as never;

  it("builds dated drafts only from approved knowledge", () => {
    const drafts = buildCalendarDrafts(client, knowledge, "2026-11");
    expect(drafts.length).toBeGreaterThan(0);
    expect(drafts.every((d) => d.publishDate.startsWith("2026-11"))).toBe(true);
    expect(drafts.every((d) => d.notes.includes("approved knowledge"))).toBe(true);
  });

  it("returns nothing when no knowledge is approved", () => {
    expect(buildCalendarDrafts(client, [{ ...(knowledge as object[])[1] }] as never, "2026-11")).toEqual([]);
  });
});

describe("review tokens", () => {
  it("round-trips a signed token and rejects tampering", () => {
    const token = createReviewToken("asset_1");
    expect(verifyReviewToken(token)?.assetId).toBe("asset_1");
    expect(verifyReviewToken(`${token}x`)).toBeNull();
    expect(verifyReviewToken("garbage")).toBeNull();
  });

  it("rejects an expired token", () => {
    expect(verifyReviewToken(createReviewToken("asset_1", -1000))).toBeNull();
  });
});


describe("studio formats", () => {
  const client = { id: "c1", workspaceId: "w1", name: "Northfield", audience: "working professionals", tone: "plain", summary: "", restrictedClaims: "", website: "https://northfield.example.edu" } as never;
  const knowledge = [{ id: "k1", workspaceId: "w1", clientId: "c1", status: "approved", kind: "brand_fact", title: "Part-time MBA", body: "36 credits delivered in the evening over 24-30 months.", tags: ["mba"], sourceUrl: "https://northfield.example.edu/mba" }] as never;

  it("produces a production-ready reel script with a hook and CTA", () => {
    const draft = generateStudioDraft({ client, knowledge, format: "reel_script", brief: "Schedule fit beats prestige." });
    expect(draft.body).toContain("Hook (0–3s)");
    expect(draft.body).toContain("VOICEOVER");
    expect(draft.body).toContain("CTA (35–45s)");
    expect(draft.claims.some((c) => c.kind === "factual" && c.sourceIds.includes("k1"))).toBe(true);
    expect(draft.claims.some((c) => c.kind === "unsupported")).toBe(true);
  });

  it("validates crawler url input", async () => {
    await expect(scrapeUrlForKnowledge("invalid-url")).rejects.toThrow("Invalid URL");
    await expect(scrapeUrlForKnowledge("ftp://example.com")).rejects.toThrow("Invalid URL");
  });

  it("extracts json from markdown, arrays, objects, and unbracketed lists", () => {
    expect(extractJson('{"name": "test"}')).toEqual({ name: "test" });
    expect(extractJson('[{"title": "a"}, {"title": "b"}]')).toEqual([{ title: "a" }, { title: "b" }]);
    expect(extractJson('```json\n[{"title": "c"}]\n```')).toEqual([{ title: "c" }]);
    expect(extractJson('{"title": "x"}, {"title": "y"}')).toEqual([{ title: "x" }, { title: "y" }]);
  });

  it("scaffolds a complete starter brain with 4 core pillars", () => {
    const starterFacts = scaffoldStarterBrainFacts({
      name: "Acme Cloud",
      audience: "DevOps engineers",
      tone: "Concise, technical",
      summary: "Modern Kubernetes orchestration platform",
      restrictedClaims: "Never guarantee 100.0% zero downtime",
      website: "https://acmecloud.io",
    });

    expect(starterFacts).toHaveLength(4);
    expect(starterFacts.map((f) => f.kind)).toEqual([
      "brand_fact",
      "audience",
      "writing_guideline",
      "writing_guideline",
    ]);
    expect(starterFacts[0].body).toContain("Modern Kubernetes orchestration platform");
    expect(starterFacts[1].body).toContain("DevOps engineers");
    expect(starterFacts[2].body).toContain("Concise, technical");
    expect(starterFacts[3].body).toContain("Never guarantee 100.0% zero downtime");
  });

  it("extracts facts from raw text with heuristic fallback", async () => {
    await expect(extractFactsFromText("short")).rejects.toThrow("Please provide at least 20 characters");

    const rawNotes = `Acme Cloud provides automated multi-cloud failover in under 30 seconds for mission-critical apps.
Our primary ICP is Director of Infrastructure at series B+ SaaS startups with high uptime SLAs.
We adhere to strict SOC2 Type II and HIPAA compliance standards across all storage clusters.`;

    const extracted = await extractFactsFromText("Acme Cloud", rawNotes);
    expect(extracted.length).toBeGreaterThanOrEqual(1);
    expect(extracted[0]).toHaveProperty("title");
    expect(extracted[0]).toHaveProperty("body");
    expect(extracted[0]).toHaveProperty("kind");
    expect(extracted[0]).toHaveProperty("tags");
  });
});

describe("platform guidelines, memory grounding & image studio", () => {
  const client = {
    id: "c1",
    workspaceId: "w1",
    name: "Acme Cloud",
    audience: "DevOps engineers",
    tone: "Concise, engineering-first",
    summary: "Reliable Kubernetes management platform",
    restrictedClaims: "guaranteed 100% uptime, zero downtime",
    website: "https://acmecloud.io",
    brandColor: "#0ea5e9"
  } as never;

  const knowledge = [
    {
      id: "k1",
      workspaceId: "w1",
      clientId: "c1",
      kind: "brand_fact",
      title: "Failover Speed",
      body: "Automated failover in under 30 seconds for mission-critical clusters.",
      status: "approved",
      tags: ["failover", "infrastructure"],
      sourceUrl: "https://acmecloud.io/specs"
    },
    {
      id: "k2",
      workspaceId: "w1",
      clientId: "c1",
      kind: "audience",
      title: "Target Decision Maker",
      body: "Heads of Platform Engineering at series B+ tech startups.",
      status: "approved",
      tags: ["icp"],
      sourceUrl: null
    }
  ] as never;

  const memory = [
    {
      id: "m1",
      workspaceId: "w1",
      kind: "opinion",
      body: "Never optimize for vanity clicks over engineering credibility.",
      status: "approved",
      provenance: "Founder entry",
      createdAt: "2026-10-25T00:00:00Z",
      approvedAt: "2026-10-25T00:00:00Z"
    },
    {
      id: "m2",
      workspaceId: "w1",
      kind: "voice_example",
      body: "Direct, plain sentences. Show exact metrics rather than adjectives.",
      status: "approved",
      provenance: "Founder entry",
      createdAt: "2026-10-25T00:00:00Z",
      approvedAt: "2026-10-25T00:00:00Z"
    }
  ] as never;

  it("audits drafts for synthetic AI phrases and restricted claims", () => {
    const badDraft = "In today's fast-paced world, this is a game-changer that offers guaranteed 100% uptime.";
    const audit = auditDraftForQuality(badDraft, client, "linkedin_post");
    expect(audit.qualityFlags.some((f) => f.includes("anti-ai-pattern"))).toBe(true);
    expect(audit.qualityFlags.some((f) => f.includes("restricted-claim-violation"))).toBe(true);
    expect(audit.warnings.length).toBeGreaterThanOrEqual(2);
  });

  it("formats brain and memory prompt with verified client truths and founder opinions", () => {
    const prompt = formatBrainAndMemoryPrompt(client, knowledge, memory);
    expect(prompt).toContain("CLIENT KNOWLEDGE BRAIN");
    expect(prompt).toContain("Acme Cloud");
    expect(prompt).toContain("Automated failover in under 30 seconds");
    expect(prompt).toContain("WORKSPACE & FOUNDER MEMORY");
    expect(prompt).toContain("Never optimize for vanity clicks over engineering credibility");
  });

  it("generates platform-ready image prompt suggestions from brain and memory", () => {
    const suggestions = suggestImagePrompts(client, knowledge, memory);
    expect(suggestions.length).toBeGreaterThanOrEqual(3);
    expect(suggestions.some((s) => s.style === "stat_callout" || s.style === "framework")).toBe(true);
    expect(suggestions.some((s) => s.style === "minimal_quote")).toBe(true);
    expect(suggestions.some((s) => s.aspect === "story")).toBe(true);
  });

  it("renders distinct SVG layouts across styles and aspect ratios", () => {
    const editorialSvg = buildImageSvg({
      prompt: "Under 30s Multi-Cloud Failover",
      palette: ["#0ea5e9", "#f0f9ff", "#bae6fd", "#0f172a"],
      aspect: "landscape",
      brandName: "Acme Cloud",
      style: "editorial"
    });
    expect(editorialSvg).toContain('width="1200"');
    expect(editorialSvg).toContain('height="628"');
    expect(editorialSvg).toContain("ACME CLOUD");

    const statSvg = buildImageSvg({
      prompt: "30s Automated Failover",
      palette: ["#0ea5e9", "#f0f9ff", "#bae6fd", "#0f172a"],
      aspect: "square",
      brandName: "Acme Cloud",
      style: "stat_callout"
    });
    expect(statSvg).toContain("30s");
    expect(statSvg).toContain("VERIFIED EVIDENCE");

    const frameworkSvg = buildImageSvg({
      prompt: "Cloud Architecture",
      palette: ["#0ea5e9", "#f0f9ff", "#bae6fd", "#0f172a"],
      aspect: "portrait",
      brandName: "Acme Cloud",
      style: "framework"
    });
    expect(frameworkSvg).toContain("01. INPUT");
    expect(frameworkSvg).toContain("02. EXECUTE");
    expect(frameworkSvg).toContain("03. VERIFY");

    const quoteSvg = buildImageSvg({
      prompt: "Never optimize for vanity clicks",
      palette: ["#0ea5e9", "#f0f9ff", "#bae6fd", "#0f172a"],
      aspect: "portrait",
      brandName: "Acme Cloud",
      style: "minimal_quote"
    });
    expect(quoteSvg).toContain("EXECUTIVE MEMORY");
  });

  it("generates intelligent calendar plan grounded in brain and memory", async () => {
    const plan = await generateCalendarPlan({
      client,
      knowledge,
      memory,
      month: "2026-11"
    });
    expect(plan.length).toBeGreaterThanOrEqual(8);
    expect(plan.every((p) => p.publishDate.startsWith("2026-11"))).toBe(true);
    expect(plan.some((p) => p.channel === "linkedin")).toBe(true);
    expect(plan.some((p) => p.channel === "x")).toBe(true);
    expect(plan.some((p) => p.channel === "blog")).toBe(true);
    expect(plan.every((p) => p.notes.includes("approved knowledge"))).toBe(true);
  });
});
