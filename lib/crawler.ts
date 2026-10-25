import { chatText, extractJson, openRouterConfigured } from "./openrouter";

export interface ExtractedFact {
  title: string;
  body: string;
  kind: "brand_fact" | "website" | "seo_research" | "writing_guideline";
  tags: string[];
}

export async function scrapeUrlForKnowledge(url: string): Promise<ExtractedFact[]> {
  const targetUrl = url.trim();
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    throw new Error("Invalid URL. Must begin with http:// or https://");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  let html = "";
  try {
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CurroBot/1.0; +https://curro.agency/bot)"
      },
      signal: controller.signal
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch URL: HTTP ${res.status}`);
    }
    html = await res.text();
  } finally {
    clearTimeout(timeout);
  }

  // Extract metadata and main text
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const pageTitle = titleMatch ? titleMatch[1].trim() : targetUrl;

  const descMatch =
    html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  const pageDesc = descMatch ? descMatch[1].trim() : "";

  // Strip script, style, html tags for body text
  const cleanedHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ")
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ");

  const textMatches = cleanedHtml
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);

  // If OpenRouter is configured, use AI to extract clean, precise facts
  if (openRouterConfigured()) {
    try {
      const { text } = await chatText({
        tier: "cheap",
        maxTokens: 1500,
        temperature: 0.2,
        system:
          "You are a knowledge extractor for an SEO/marketing agency. Given a crawled web page title and text, extract 2 to 4 distinct, high-value, verified factual items about the company or product. Return ONLY a JSON array of objects with keys: title (short string), body (clear factual paragraph), kind ('brand_fact' | 'website' | 'seo_research'), tags (string array). Do not include markdown fences.",
        user: `PAGE TITLE: ${pageTitle}\nPAGE DESCRIPTION: ${pageDesc}\nPAGE CONTENT EXCERPT:\n${textMatches}`
      });

      const parsed = extractJson(text) as Array<{
        title?: string;
        body?: string;
        kind?: string;
        tags?: string[];
      }>;

      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item) => ({
          title: String(item.title || pageTitle).slice(0, 100),
          body: String(item.body || pageDesc || textMatches.slice(0, 300)).slice(0, 1200),
          kind: (["brand_fact", "website", "seo_research", "writing_guideline"].includes(item.kind ?? "")
            ? item.kind
            : "brand_fact") as ExtractedFact["kind"],
          tags: Array.isArray(item.tags) ? item.tags.slice(0, 5) : ["website", "crawl"]
        }));
      }
    } catch {
      // Fallback to heuristic extraction if LLM fails
    }
  }

  // Fallback heuristic extraction
  const facts: ExtractedFact[] = [];
  if (pageDesc) {
    facts.push({
      title: `${pageTitle.slice(0, 60)} — Positioning`,
      body: pageDesc,
      kind: "website",
      tags: ["website", "meta-description"]
    });
  }

  if (textMatches.length > 100) {
    facts.push({
      title: `${pageTitle.slice(0, 60)} — Overview`,
      body: textMatches.slice(0, 500),
      kind: "brand_fact",
      tags: ["website", "crawled"]
    });
  }

  return facts;
}
