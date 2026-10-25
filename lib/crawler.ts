import { chatText, extractJson, openRouterConfigured } from "./openrouter";
import type { KnowledgeKind } from "./types";

export interface ExtractedFact {
  title: string;
  body: string;
  kind: KnowledgeKind;
  tags: string[];
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export async function scrapeUrlForKnowledge(url: string): Promise<ExtractedFact[]> {
  const targetUrl = url.trim();
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    throw new Error("Invalid URL. Must begin with http:// or https://");
  }

  try {
    new URL(targetUrl);
  } catch {
    throw new Error("Invalid URL. Please check the website address.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  let html = "";
  try {
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache"
      },
      redirect: "follow",
      signal: controller.signal
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch URL: HTTP ${res.status}`);
    }
    html = await res.text();
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Connection timed out while fetching website.");
    }
    const message = err instanceof Error ? err.message : "Failed to connect to website.";
    throw new Error(message);
  } finally {
    clearTimeout(timeout);
  }

  // Extract metadata and main text
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const rawPageTitle = titleMatch ? titleMatch[1].trim() : targetUrl;
  const pageTitle = decodeHtmlEntities(rawPageTitle);

  const descMatch =
    html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  const rawPageDesc = descMatch ? descMatch[1].trim() : "";
  const pageDesc = decodeHtmlEntities(rawPageDesc);

  // Strip script, style, svg, nav, footer tags for body text
  const cleanedHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ")
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ");

  const textMatches = decodeHtmlEntities(
    cleanedHtml
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000)
  );

  // If OpenRouter is configured, use AI to extract clean, precise facts
  if (openRouterConfigured()) {
    try {
      const { text } = await chatText({
        tier: "cheap",
        maxTokens: 1000,
        temperature: 0.1,
        system:
          "You are a knowledge extractor for an SEO/marketing agency. Given a crawled web page title and text, extract 2 to 4 distinct, high-value, verified factual items about the company or product. Return a JSON array of objects with keys: title (short string), body (clear factual paragraph), kind ('brand_fact' | 'website' | 'seo_research'), tags (string array). Do not include markdown fences.",
        user: `PAGE TITLE: ${pageTitle}\nPAGE DESCRIPTION: ${pageDesc}\nPAGE CONTENT EXCERPT:\n${textMatches}`
      });

      let parsed = extractJson<unknown>(text);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const record = parsed as Record<string, unknown>;
        if (Array.isArray(record.facts)) parsed = record.facts;
        else if (Array.isArray(record.items)) parsed = record.items;
        else if (Array.isArray(record.data)) parsed = record.data;
        else if (Array.isArray(record.results)) parsed = record.results;
      }

      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: Record<string, unknown>) => ({
          title: decodeHtmlEntities(String(item.title || pageTitle)).slice(0, 100),
          body: decodeHtmlEntities(String(item.body || pageDesc || textMatches.slice(0, 300))).slice(0, 1200),
          kind: (["brand_fact", "website", "seo_research", "writing_guideline", "audience", "source_document", "past_content"].includes(String(item.kind ?? ""))
            ? item.kind
            : "brand_fact") as KnowledgeKind,
          tags: Array.isArray(item.tags) ? item.tags.map(String).slice(0, 5) : ["website", "crawl"]
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

  if (textMatches.length > 50) {
    facts.push({
      title: `${pageTitle.slice(0, 60)} — Overview`,
      body: textMatches.slice(0, 500),
      kind: "brand_fact",
      tags: ["website", "crawled"]
    });
  }

  if (facts.length === 0 && pageTitle) {
    facts.push({
      title: pageTitle.slice(0, 60),
      body: `Verified website access for ${targetUrl}. Title: ${pageTitle}`,
      kind: "website",
      tags: ["website"]
    });
  }

  return facts;
}

export async function extractFactsFromText(
  clientNameOrRawText: string,
  maybeRawText?: string,
  industry?: string
): Promise<ExtractedFact[]> {
  const clientName = maybeRawText !== undefined ? clientNameOrRawText : "Client";
  const rawText = maybeRawText !== undefined ? maybeRawText : clientNameOrRawText;
  const cleaned = (rawText || "").trim();
  if (cleaned.length < 20) {
    throw new Error("Please provide at least 20 characters of notes or company text.");
  }

  if (openRouterConfigured()) {
    try {
      const { text } = await chatText({
        tier: "cheap",
        maxTokens: 1200,
        temperature: 0.2,
        system:
          "You are an agency knowledge architect. Given raw client notes, pitch text, or transcripts, extract 3 to 5 structured, verified factual knowledge items about the brand. Return ONLY a JSON array of objects with keys: title (short string), body (clear factual paragraph), kind ('brand_fact' | 'website' | 'seo_research' | 'writing_guideline' | 'audience'), tags (string array). Do not include markdown fences.",
        user: `CLIENT: ${clientName}\nINDUSTRY: ${industry || "General"}\nRAW NOTES / TEXT:\n${cleaned.slice(0, 5000)}`
      });

      let parsed = extractJson<unknown>(text);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const record = parsed as Record<string, unknown>;
        if (Array.isArray(record.facts)) parsed = record.facts;
        else if (Array.isArray(record.items)) parsed = record.items;
        else if (Array.isArray(record.data)) parsed = record.data;
        else if (Array.isArray(record.results)) parsed = record.results;
      }

      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: Record<string, unknown>) => ({
          title: decodeHtmlEntities(String(item.title || "Brand Fact")).slice(0, 100),
          body: decodeHtmlEntities(String(item.body || cleaned.slice(0, 300))).slice(0, 1200),
          kind: (["brand_fact", "website", "seo_research", "writing_guideline", "audience", "source_document", "past_content"].includes(String(item.kind ?? ""))
            ? item.kind
            : "brand_fact") as KnowledgeKind,
          tags: Array.isArray(item.tags) ? item.tags.map(String).slice(0, 5) : ["notes", "ai-extracted"]
        }));
      }
    } catch {
      // Fallback heuristic extraction
    }
  }

  // Fallback heuristic: split into key sentences/paragraphs
  const paragraphs = cleaned
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 25);

  const facts: ExtractedFact[] = [];
  if (paragraphs.length > 0) {
    facts.push({
      title: `${clientName} — Overview & Core Value Prop`,
      body: paragraphs[0].slice(0, 600),
      kind: "brand_fact",
      tags: ["overview", "core-fact"]
    });
  }

  if (paragraphs.length > 1) {
    facts.push({
      title: `${clientName} — Key Capabilities`,
      body: paragraphs.slice(1).join(" ").slice(0, 800),
      kind: "brand_fact",
      tags: ["capabilities", "notes"]
    });
  }

  if (facts.length === 0) {
    facts.push({
      title: `${clientName} — Key Context`,
      body: cleaned.slice(0, 500),
      kind: "brand_fact",
      tags: ["context"]
    });
  }

  return facts;
}

export function scaffoldStarterBrainFacts(
  clientNameOrOptions:
    | string
    | {
        name: string;
        industry?: string;
        summary?: string;
        audience?: string;
        tone?: string;
        restrictedClaims?: string;
      },
  industry?: string,
  summary?: string,
  audience?: string,
  tone?: string
): ExtractedFact[] {
  let name = "";
  let ind = "";
  let sum = "";
  let aud = "";
  let ton = "";
  let restricted = "";

  if (typeof clientNameOrOptions === "object" && clientNameOrOptions !== null) {
    name = clientNameOrOptions.name;
    ind = clientNameOrOptions.industry || "";
    sum = clientNameOrOptions.summary || "";
    aud = clientNameOrOptions.audience || "";
    ton = clientNameOrOptions.tone || "";
    restricted = clientNameOrOptions.restrictedClaims || "";
  } else {
    name = String(clientNameOrOptions || "Client");
    ind = industry || "";
    sum = summary || "";
    aud = audience || "";
    ton = tone || "";
  }

  const industryStr = ind || "our target industry";
  return [
    {
      title: `${name} — Core Positioning & Market Proposition`,
      body:
        sum ||
        `${name} provides premium, high-impact solutions in ${industryStr}, helping customers achieve measurable business outcomes with reliable execution.`,
      kind: "brand_fact",
      tags: ["positioning", "value-prop"]
    },
    {
      title: `${name} — Ideal Customer Profile (Audience)`,
      body:
        aud ||
        `Decision-makers, founders, and department leaders in ${industryStr} seeking high ROI, predictable outcomes, and verified results without technical overhead.`,
      kind: "audience",
      tags: ["audience", "icp"]
    },
    {
      title: `${name} — Editorial Voice & Content Guidelines`,
      body:
        ton ||
        "Confident, specific, and transparent. Always cite verified data or approved case evidence. Never use hollow buzzwords or unbacked viral hype.",
      kind: "writing_guideline",
      tags: ["voice", "style-guide"]
    },
    {
      title: `${name} — Compliance & Restricted Claims Guardrail`,
      body:
        restricted ||
        "Never claim guaranteed revenue, 100% automated outcomes, or specific financial results without an approved, cited source document.",
      kind: "writing_guideline",
      tags: ["compliance", "guardrails"]
    }
  ];
}
