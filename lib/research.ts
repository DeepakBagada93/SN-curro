import { createHash } from "crypto";
import { z } from "zod";
import type { SourceResult, SignalCard, ScoreBreakdown, TensionMap } from "./types";
import { DEFAULT_WORKSPACE_ID } from "./types";
import { uid, nowIso } from "./store";

// ---------- Trust-boundary schemas ----------
export const SearchRequestSchema = z.object({
  themes: z.array(z.string().min(2).max(80)).min(1).max(5),
  maxQueries: z.number().int().min(1).max(6).default(4),
  maxResults: z.number().int().min(3).max(20).default(12)
});
export type SearchRequest = z.infer<typeof SearchRequestSchema>;

export interface NormalizedSource {
  title: string; url: string; publisher: string;
  publishedAt: string | null; excerpt: string; query: string;
}
export interface ResearchProvider {
  search(input: SearchRequest): Promise<NormalizedSource[]>;
}

// ---------- URL canonicalisation + hashing (unit-tested) ----------
export function canonicalUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (!["http:", "https:"].includes(u.protocol)) return null;
    u.hash = "";
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid"].forEach((p) => u.searchParams.delete(p));
    let p = u.pathname.replace(/\/+$/, "");
    if (p === "") p = "/";
    u.pathname = p.toLowerCase() === p ? p : p; // keep case, strip trailing slash only
    u.hostname = u.hostname.toLowerCase().replace(/^www\./, "");
    return u.toString();
  } catch { return null; }
}

export function contentHash(s: string): string {
  return createHash("sha256").update(s.toLowerCase().trim()).digest("hex").slice(0, 16);
}

// ---------- Mock Parallel Search adapter (server-only) ----------
// Deterministic demo corpus so the beta runs with no API key.
// Swap with a real Parallel adapter via RESEARCH_PROVIDER=parallel.
const DEMO_POOL: Array<{ title: string; url: string; publisher: string; excerpt: string; theme: string; daysAgo: number }> = [
  { title: "Founder-led content outperforms brand accounts on LinkedIn", url: "https://example.com/research/founder-led-reach-2026", publisher: "Content Benchmarks", excerpt: "Analysis of 4,200 B2B posts finds founder posts earn 3.1x the qualified replies of brand accounts, with evidence-linked posts holding attention longest.", theme: "founder-led marketing", daysAgo: 6 },
  { title: "Buyers say AI SDR emails all sound the same", url: "https://example.com/research/ai-sdr-fatigue", publisher: "Sales Signal Survey", excerpt: "Survey of 1,100 buyers: 68% delete AI-written sequences on the first line; replies cite specificity and a named customer proof point as the differentiator.", theme: "AI SDR tools", daysAgo: 12 },
  { title: "LinkedIn cuts reach of link-first posts again", url: "https://example.com/research/linkedin-link-penalty", publisher: "Channel Notes", excerpt: "Tests across 300 company pages show link-first posts reach 40% fewer followers; native text with the link in comments retains distribution.", theme: "LinkedIn organic reach", daysAgo: 3 },
  { title: "The contrarian founder post playbook: evidence first", url: "https://example.com/research/contrarian-playbook", publisher: "Editorial Lab", excerpt: "Top-decile founder posts share a pattern: one sourced change, one buyer implication, one owned opinion — and a visible correction when wrong.", theme: "founder-led marketing", daysAgo: 21 },
  { title: "AI SDR pricing collapses toward usage-based", url: "https://example.com/research/ai-sdr-pricing", publisher: "Pricing Wire", excerpt: "Three vendors moved to per-meeting pricing this quarter; buyers report seat-based AI SDR contracts going unused after month two.", theme: "AI SDR tools", daysAgo: 9 },
  { title: "Dwell time beats likes in B2B distribution", url: "https://example.com/research/dwell-time-b2b", publisher: "Channel Notes", excerpt: "Platform docs and creator tests agree: saves, dwell, and qualified comments predict pipeline-relevant reach far better than like counts.", theme: "LinkedIn organic reach", daysAgo: 15 }
];

export class MockSearchAdapter implements ResearchProvider {
  async search(input: SearchRequest): Promise<NormalizedSource[]> {
    const themes = input.themes.map((t) => t.toLowerCase());
    const picked = DEMO_POOL.filter((d) => themes.some((th) => d.theme.includes(th.slice(0, 8)) || th.includes(d.theme.slice(0, 8))))
      .concat(DEMO_POOL.filter((d) => !themes.some((th) => d.theme.includes(th.slice(0, 8)))).slice(0, 2));
    return picked.slice(0, input.maxResults).map((d, i) => ({
      title: d.title, url: d.url, publisher: d.publisher,
      publishedAt: new Date(Date.now() - d.daysAgo * 864e5).toISOString(),
      excerpt: d.excerpt, query: themes[i % themes.length] ?? themes[0]
    }));
  }
}

// ---------- Parallel Search adapter (real web evidence) ----------
const ParallelResponseSchema = z.object({
  results: z.array(z.object({
    url: z.string(),
    title: z.string().nullable().optional(),
    publish_date: z.string().nullable().optional(),
    excerpts: z.array(z.string()).optional().default([])
  })).default([]),
  warnings: z.unknown().nullable().optional()
});

function parallelApiKey(): string | undefined {
  return process.env.PARALLEL_API_KEY ?? process.env.PARALLEL_AI_API_KEY;
}

function publisherFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "web";
  }
}

function normalizeDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export class ParallelSearchAdapter implements ResearchProvider {
  async search(input: SearchRequest): Promise<NormalizedSource[]> {
    const key = parallelApiKey();
    if (!key) throw new Error("PARALLEL_API_KEY is not configured.");

    const mode = process.env.PARALLEL_SEARCH_MODE ?? "fast";
    const themes = input.themes.slice(0, input.maxQueries);

    const calls = themes.map(async (theme) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45_000);
      try {
        const res = await fetch("https://api.parallel.ai/v1/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": key,
            Authorization: `Bearer ${key}`
          },
          body: JSON.stringify({
            objective: `Find recent, citable developments relevant to: ${theme}. Prefer primary sources, research reports, platform documentation and dated reporting. Extract concrete evidence, not opinions.`,
            search_queries: [theme],
            mode
          }),
          signal: controller.signal
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`Parallel Search ${res.status}: ${body.slice(0, 200)}`);
        }
        const parsed = ParallelResponseSchema.parse(await res.json());
        return parsed.results.map((r) => ({
          title: (r.title ?? r.url).slice(0, 200),
          url: r.url,
          publisher: publisherFromUrl(r.url),
          publishedAt: normalizeDate(r.publish_date),
          excerpt: (r.excerpts.join("\n") || r.title || r.url).slice(0, 1200),
          query: theme
        }));
      } finally {
        clearTimeout(timeout);
      }
    });

    const settled = await Promise.allSettled(calls);
    const ok = settled.filter((s): s is PromiseFulfilledResult<NormalizedSource[]> => s.status === "fulfilled");
    if (ok.length === 0) {
      const first = settled.find((s): s is PromiseRejectedResult => s.status === "rejected");
      throw new Error(first?.reason instanceof Error ? first.reason.message : "Parallel Search failed.");
    }

    const seen = new Set<string>();
    const merged: NormalizedSource[] = [];
    for (const group of ok) {
      for (const item of group.value) {
        const canon = canonicalUrl(item.url);
        if (!canon || seen.has(canon)) continue;
        seen.add(canon);
        merged.push({ ...item, url: canon });
        if (merged.length >= input.maxResults) break;
      }
      if (merged.length >= input.maxResults) break;
    }
    return merged;
  }
}

export function getResearchProvider(): ResearchProvider {
  const key = parallelApiKey();
  const useMock = process.env.RESEARCH_PROVIDER === "mock" || !key;
  return useMock ? new MockSearchAdapter() : new ParallelSearchAdapter();
}

// ---------- Scoring (deterministic, explainable) ----------
export function scoreSource(args: { title: string; excerpt: string; publishedAt: string | null; queryHits: number; seenBefore: boolean; dismissedRecently: boolean }): ScoreBreakdown {
  const days = args.publishedAt ? Math.max(0, (Date.now() - new Date(args.publishedAt).getTime()) / 864e5) : 60;
  const freshness = Math.max(0, Math.round(30 - Math.min(30, days)));
  const relevance = Math.min(30, 12 + args.queryHits * 6 + Math.min(6, Math.floor(args.excerpt.length / 60)));
  const novelty = args.seenBefore ? 2 : 10;
  const audienceFit = Math.min(15, 8 + (args.excerpt.includes("founder") || args.excerpt.includes("buyer") ? 5 : 2));
  const evidenceQuality = Math.min(15, args.excerpt.length > 120 ? 12 : 8);
  const duplicatePenalty = args.dismissedRecently ? -15 : args.seenBefore ? -10 : 0;
  const total = Math.max(0, relevance + freshness + novelty + audienceFit + evidenceQuality + duplicatePenalty);
  return { relevance, freshness, novelty, audienceFit, evidenceQuality, duplicatePenalty, total };
}

export function explainScore(s: ScoreBreakdown): string {
  return `Relevance ${s.relevance} · Freshness ${s.freshness} · Novelty ${s.novelty} · Audience fit ${s.audienceFit} · Evidence ${s.evidenceQuality}${s.duplicatePenalty ? ` · Duplicate/dismissal penalty ${s.duplicatePenalty}` : ""} = ${s.total} pts. Ranking aid only — never a virality prediction.`;
}

export function suppressionKey(canonical: string): string {
  return contentHash(canonical);
}

export function toSourceRecords(runId: string, items: NormalizedSource[]): SourceResult[] {
  const seen = new Set<string>();
  const out: SourceResult[] = [];
  for (const n of items) {
    const canon = canonicalUrl(n.url);
    if (!canon || seen.has(canon)) continue;
    seen.add(canon);
    out.push({
      id: uid("src"), workspaceId: DEFAULT_WORKSPACE_ID, runId,
      title: n.title.slice(0, 160), canonicalUrl: canon, publisher: n.publisher,
      publishedAt: n.publishedAt, retrievedAt: nowIso(),
      excerpt: n.excerpt.slice(0, 600), query: n.query,
      contentHash: contentHash(n.title + canon)
    });
  }
  return out;
}

export function clusterToSignals(runId: string, sources: SourceResult[], seenUrls: Set<string>, dismissedKeys: Set<string>): SignalCard[] {
  const groups: Record<string, SourceResult[]> = {};
  for (const s of sources) {
    const k = s.query.toLowerCase();
    if (!groups[k]) groups[k] = [];
    groups[k].push(s);
  }
  const signals: SignalCard[] = [];
  for (const theme of Object.keys(groups)) {
    const list = groups[theme];
    const top = list.slice(0, 3);
    const score = scoreSource({
      title: top[0].title, excerpt: top.map((t: SourceResult) => t.excerpt).join(" "),
      publishedAt: top[0].publishedAt, queryHits: top.length,
      seenBefore: top.some((t: SourceResult) => seenUrls.has(t.canonicalUrl)),
      dismissedRecently: top.some((t: SourceResult) => dismissedKeys.has(suppressionKey(t.canonicalUrl)))
    });
    signals.push({
      id: uid("sig"), workspaceId: DEFAULT_WORKSPACE_ID, runId,
      title: top[0].title, whyNow: top[0].excerpt,
      relevance: `Matters to your audience because it maps to "${theme}": ${explainScore(score)}`,
      sourceIds: top.map((t: SourceResult) => t.id), score, status: "new",
      suppressionKey: suppressionKey(top[0].canonicalUrl),
      dismissedUntil: null, createdAt: nowIso()
    });
  }
  return signals.sort((a, b) => b.score.total - a.score.total).slice(0, 3);
}

export function tensionFor(signalTitle: string, excerpts: string[], restricted: string): TensionMap {
  return {
    whatChanged: excerpts[0] ?? signalTitle,
    whyItMatters: "Buyers are drowning in generic takes — a sourced, specific implication earns replies instead of likes.",
    commonTake: "The common take repeats the headline without adding buyer context.",
    founderAngles: [
      "Steelman the common take, then share what you saw with one customer — no generalization.",
      "Name what changed, who it hurts, and the one workflow you would change this week.",
      "Disagree kindly: the headline is directionally right but misses the cost nobody prices in."
    ],
    mustNotClaim: [restricted || "No virality or revenue promises without a linked source.", "No invented customer outcomes.", "No trend claim beyond the cited sources."]
  };
}
