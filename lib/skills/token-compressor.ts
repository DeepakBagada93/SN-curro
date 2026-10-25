import type { KnowledgeItem } from "../types";
import type { CompressedKnowledgeContext } from "./core-skills";

const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
  "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both",
  "but", "by", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't",
  "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't",
  "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here",
  "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll",
  "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me",
  "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once",
  "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same",
  "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such",
  "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there",
  "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those",
  "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll",
  "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's",
  "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't",
  "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves",
  "please", "make", "write", "create", "draft", "post", "about", "using", "with"
]);

/**
 * Fast conservative token estimation (~3.8 characters per token)
 */
export function estimateTokens(text: string): number {
  if (!text || text.length === 0) return 0;
  return Math.ceil(text.length / 3.8);
}

/**
 * Extract clean keywords from prompt for relevance scoring
 */
export function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

/**
 * Prunes and ranks knowledge items based on relevance to the user's prompt.
 * Prevents bloating prompts with 30-50 facts while ensuring critical facts are always present.
 */
export function compressKnowledgeContext(
  prompt: string,
  approvedItems: KnowledgeItem[],
  maxFacts = 6
): CompressedKnowledgeContext {
  const baselineFactCount = approvedItems.length;
  const baselineEstimatedTokens = approvedItems.reduce(
    (sum, item) => sum + estimateTokens(`${item.id} ${item.title} ${item.body} ${item.tags.join(" ")}`),
    0
  );

  if (approvedItems.length <= maxFacts) {
    return {
      facts: approvedItems,
      baselineFactCount,
      baselineEstimatedTokens,
      compressedFactCount: approvedItems.length,
      compressedEstimatedTokens: baselineEstimatedTokens,
      tokensSaved: 0,
      savingsRatio: 0
    };
  }

  const keywords = extractKeywords(prompt);

  // Score each knowledge item
  const scored = approvedItems.map((item) => {
    let score = 0;
    const titleLower = item.title.toLowerCase();
    const bodyLower = item.body.toLowerCase();
    const tagsLower = item.tags.join(" ").toLowerCase();

    // Baseline priority for core brand positioning or website facts
    if (item.kind === "brand_fact") score += 1.5;
    if (item.kind === "website") score += 1.0;

    for (const kw of keywords) {
      if (titleLower.includes(kw)) score += 4.0;
      if (tagsLower.includes(kw)) score += 3.0;
      if (bodyLower.includes(kw)) score += 1.5;
    }

    return { item, score };
  });

  // Sort descending by relevance score
  scored.sort((a, b) => b.score - a.score);

  // Take top N
  const selected = scored.slice(0, Math.max(3, maxFacts)).map((s) => s.item);

  const compressedFactCount = selected.length;
  const compressedEstimatedTokens = selected.reduce(
    (sum, item) => sum + estimateTokens(`${item.id} ${item.title} ${item.body} ${item.tags.join(" ")}`),
    0
  );

  const tokensSaved = Math.max(0, baselineEstimatedTokens - compressedEstimatedTokens);
  const savingsRatio = baselineEstimatedTokens > 0
    ? Number((tokensSaved / baselineEstimatedTokens).toFixed(2))
    : 0;

  return {
    facts: selected,
    baselineFactCount,
    baselineEstimatedTokens,
    compressedFactCount,
    compressedEstimatedTokens,
    tokensSaved,
    savingsRatio
  };
}

/**
 * Format compressed facts into a clean prompt block for OpenRouter
 */
export function formatCompressedKnowledgePrompt(compressed: CompressedKnowledgeContext): string {
  if (compressed.facts.length === 0) {
    return "No approved client facts available in knowledge brain yet.";
  }

  return compressed.facts
    .map(
      (f, idx) =>
        `[Fact ${idx + 1} | ID: ${f.id} | Kind: ${f.kind}]\nTitle: ${f.title}\nDetails: ${f.body}${
          f.tags.length > 0 ? `\nTags: ${f.tags.join(", ")}` : ""
        }`
    )
    .join("\n\n");
}
