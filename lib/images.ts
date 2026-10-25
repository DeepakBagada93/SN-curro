import type { Client, KnowledgeItem, MemoryCard } from "./types";

export type ImageAspectKey = "square" | "portrait" | "landscape" | "story";
export type ImageStyleKey = "editorial" | "stat_callout" | "framework" | "minimal_quote";

export const IMAGE_ASPECTS: Record<ImageAspectKey, { w: number; h: number; label: string; channelHint: string }> = {
  square: { w: 1080, h: 1080, label: "Square 1:1", channelHint: "Instagram & LinkedIn Feed" },
  portrait: { w: 1080, h: 1350, label: "Portrait 4:5", channelHint: "Instagram & LinkedIn Portrait" },
  landscape: { w: 1200, h: 628, label: "Landscape 1.91:1", channelHint: "Twitter/X Card & Blog Feature" },
  story: { w: 1080, h: 1920, label: "Vertical 9:16", channelHint: "Reels / Shorts Title Card & Stories" }
};

export const IMAGE_STYLES: Record<ImageStyleKey, { label: string; description: string }> = {
  editorial: {
    label: "Editorial Typography",
    description: "Classic serif typography, subtle paper grain, and brand accent pill."
  },
  stat_callout: {
    label: "Metric / Stat Callout",
    description: "Large numeric callout box highlighting proof points and verified metrics."
  },
  framework: {
    label: "Framework Blueprint",
    description: "Structured 3-step architecture layout with connected node tags."
  },
  minimal_quote: {
    label: "Executive Quote",
    description: "High-contrast quotation marks with centered founder/client perspective."
  }
};

export const IMAGE_COST_USD = 0.04;

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function buildPalette(seed: string, brandColor: string): string[] {
  const h = hash(seed);
  const second = `hsl(${h % 360} 45% 94%)`;
  const third = `hsl(${(h * 7) % 360} 38% 82%)`;
  const fourth = `hsl(${(h * 13) % 360} 25% 18%)`;
  return [brandColor, second, third, fourth];
}

export function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrap(text: string, perLine: number, maxLines: number): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > perLine) {
      if (current) lines.push(current.trim());
      current = word;
      if (lines.length === maxLines) break;
    } else {
      current = `${current} ${word}`.trim();
    }
  }
  if (lines.length < maxLines && current) lines.push(current.trim());
  return lines.slice(0, maxLines);
}

export function buildImageSvg(input: {
  prompt: string;
  palette: string[];
  aspect: string;
  brandName: string;
  style?: ImageStyleKey;
  subtitle?: string;
}): string {
  const dim = IMAGE_ASPECTS[input.aspect as ImageAspectKey] ?? IMAGE_ASPECTS.square;
  const palette = input.palette.length >= 4 ? input.palette : buildPalette(input.prompt, "#1f3a5f");
  const [accent, bgA, bgB, ink] = palette;
  const style = input.style ?? "editorial";
  const brandUpper = escapeXml(input.brandName.toUpperCase());

  if (style === "stat_callout") {
    // Extract a leading number or use a high-contrast pill
    const statMatch = input.prompt.match(/(\d+[%x+]?|\$\d+[\w+]?|#\d+|\b[A-Z0-9]{2,6}\b)/);
    const bigStat = statMatch ? statMatch[1] : "100%";
    const restText = input.prompt.replace(bigStat, "").trim() || "Verified Client Outcome";
    const descLines = wrap(restText, Math.round(dim.w / 45), 3);
    const statFontSize = Math.round(dim.w / 6.5);
    const descFontSize = Math.round(dim.w / 28);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${dim.w}" height="${dim.h}" viewBox="0 0 ${dim.w} ${dim.h}" role="img" aria-label="${escapeXml(input.prompt.slice(0, 160))}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${escapeXml(bgA)}"/>
      <stop offset="100%" stop-color="${escapeXml(bgB)}"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="${escapeXml(ink)}" flood-opacity="0.08"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="${dim.w * 0.08}" y="${dim.h * 0.12}" width="${dim.w * 0.84}" height="${dim.h * 0.72}" rx="24" fill="#ffffff" filter="url(#shadow)"/>
  <rect x="${dim.w * 0.08}" y="${dim.h * 0.12}" width="${dim.w * 0.84}" height="10" rx="5" fill="${escapeXml(accent)}"/>
  <text x="${dim.w * 0.5}" y="${dim.h * 0.44}" font-family="Helvetica, Arial, sans-serif" font-size="${statFontSize}" font-weight="800" text-anchor="middle" fill="${escapeXml(accent)}">${escapeXml(bigStat)}</text>
  ${descLines.map((l, i) => `<text x="${dim.w * 0.5}" y="${dim.h * 0.56 + i * descFontSize * 1.35}" font-family="Georgia, serif" font-size="${descFontSize}" font-weight="500" text-anchor="middle" fill="${escapeXml(ink)}">${escapeXml(l)}</text>`).join("\n  ")}
  <line x1="${dim.w * 0.35}" y1="${dim.h * 0.72}" x2="${dim.w * 0.65}" y2="${dim.h * 0.72}" stroke="${escapeXml(accent)}" stroke-width="2" stroke-dasharray="6,6"/>
  <text x="${dim.w * 0.5}" y="${dim.h * 0.78}" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(dim.w / 38)}" font-weight="700" letter-spacing="4" text-anchor="middle" fill="${escapeXml(ink)}" opacity="0.8">${brandUpper} · VERIFIED EVIDENCE</text>
</svg>`;
  }

  if (style === "framework") {
    const lines = wrap(input.prompt || "Framework Blueprint", Math.round(dim.w / 45), 2);
    const boxW = dim.w * 0.25;
    const boxH = dim.h * 0.22;
    const boxY = dim.h * 0.46;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${dim.w}" height="${dim.h}" viewBox="0 0 ${dim.w} ${dim.h}" role="img" aria-label="${escapeXml(input.prompt.slice(0, 160))}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${escapeXml(bgA)}"/>
      <stop offset="100%" stop-color="${escapeXml(bgB)}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="${dim.w * 0.08}" y="${dim.h * 0.10}" width="48" height="6" rx="3" fill="${escapeXml(accent)}"/>
  <text x="${dim.w * 0.08}" y="${dim.h * 0.18}" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(dim.w / 40)}" letter-spacing="3" font-weight="700" fill="${escapeXml(accent)}">${brandUpper} ARCHITECTURE</text>
  ${lines.map((l, i) => `<text x="${dim.w * 0.08}" y="${dim.h * 0.26 + i * (dim.w / 22) * 1.25}" font-family="Georgia, serif" font-size="${Math.round(dim.w / 22)}" font-weight="700" fill="${escapeXml(ink)}">${escapeXml(l)}</text>`).join("\n  ")}
  
  <rect x="${dim.w * 0.08}" y="${boxY}" width="${boxW}" height="${boxH}" rx="14" fill="#ffffff" stroke="${escapeXml(accent)}" stroke-width="2"/>
  <text x="${dim.w * 0.08 + boxW / 2}" y="${boxY + boxH * 0.35}" font-family="Helvetica, sans-serif" font-size="${Math.round(dim.w / 35)}" font-weight="800" text-anchor="middle" fill="${escapeXml(accent)}">01. INPUT</text>
  <text x="${dim.w * 0.08 + boxW / 2}" y="${boxY + boxH * 0.65}" font-family="Georgia, serif" font-size="${Math.round(dim.w / 45)}" text-anchor="middle" fill="${escapeXml(ink)}">Context &amp; Need</text>

  <line x1="${dim.w * 0.08 + boxW}" y1="${boxY + boxH / 2}" x2="${dim.w * 0.08 + boxW + dim.w * 0.04}" y2="${boxY + boxH / 2}" stroke="${escapeXml(accent)}" stroke-width="3"/>

  <rect x="${dim.w * 0.08 + boxW + dim.w * 0.04}" y="${boxY}" width="${boxW}" height="${boxH}" rx="14" fill="#ffffff" stroke="${escapeXml(accent)}" stroke-width="2"/>
  <text x="${dim.w * 0.08 + boxW * 1.5 + dim.w * 0.04}" y="${boxY + boxH * 0.35}" font-family="Helvetica, sans-serif" font-size="${Math.round(dim.w / 35)}" font-weight="800" text-anchor="middle" fill="${escapeXml(accent)}">02. EXECUTE</text>
  <text x="${dim.w * 0.08 + boxW * 1.5 + dim.w * 0.04}" y="${boxY + boxH * 0.65}" font-family="Georgia, serif" font-size="${Math.round(dim.w / 45)}" text-anchor="middle" fill="${escapeXml(ink)}">Core Solution</text>

  <line x1="${dim.w * 0.08 + boxW * 2 + dim.w * 0.04}" y1="${boxY + boxH / 2}" x2="${dim.w * 0.08 + boxW * 2 + dim.w * 0.08}" y2="${boxY + boxH / 2}" stroke="${escapeXml(accent)}" stroke-width="3"/>

  <rect x="${dim.w * 0.08 + boxW * 2 + dim.w * 0.08}" y="${boxY}" width="${boxW}" height="${boxH}" rx="14" fill="#ffffff" stroke="${escapeXml(accent)}" stroke-width="2"/>
  <text x="${dim.w * 0.08 + boxW * 2.5 + dim.w * 0.08}" y="${boxY + boxH * 0.35}" font-family="Helvetica, sans-serif" font-size="${Math.round(dim.w / 35)}" font-weight="800" text-anchor="middle" fill="${escapeXml(accent)}">03. VERIFY</text>
  <text x="${dim.w * 0.08 + boxW * 2.5 + dim.w * 0.08}" y="${boxY + boxH * 0.65}" font-family="Georgia, serif" font-size="${Math.round(dim.w / 45)}" text-anchor="middle" fill="${escapeXml(ink)}">Measurable ROI</text>

  <text x="${dim.w * 0.08}" y="${dim.h * 0.88}" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(dim.w / 40)}" letter-spacing="4" fill="${escapeXml(ink)}" opacity="0.75">${brandUpper}</text>
</svg>`;
  }

  if (style === "minimal_quote") {
    const lines = wrap(input.prompt || "Executive Perspective", Math.round(dim.w / 36), 4);
    const fontSize = Math.round(dim.w / 20);
    const startY = dim.h * 0.44 - ((lines.length - 1) * fontSize * 0.65);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${dim.w}" height="${dim.h}" viewBox="0 0 ${dim.w} ${dim.h}" role="img" aria-label="${escapeXml(input.prompt.slice(0, 160))}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${escapeXml(bgA)}"/>
      <stop offset="100%" stop-color="${escapeXml(bgB)}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <text x="${dim.w * 0.5}" y="${dim.h * 0.26}" font-family="Georgia, serif" font-size="${Math.round(dim.w / 8)}" font-weight="700" text-anchor="middle" fill="${escapeXml(accent)}" opacity="0.35">“</text>
  ${lines.map((l, i) => `<text x="${dim.w * 0.5}" y="${startY + i * fontSize * 1.35}" font-family="Georgia, serif" font-size="${fontSize}" font-style="italic" font-weight="500" text-anchor="middle" fill="${escapeXml(ink)}">${escapeXml(l)}</text>`).join("\n  ")}
  <rect x="${dim.w * 0.45}" y="${dim.h * 0.72}" width="${dim.w * 0.10}" height="3" rx="1.5" fill="${escapeXml(accent)}"/>
  <text x="${dim.w * 0.5}" y="${dim.h * 0.78}" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(dim.w / 38)}" font-weight="700" letter-spacing="4" text-anchor="middle" fill="${escapeXml(ink)}">${brandUpper}</text>
  <text x="${dim.w * 0.5}" y="${dim.h * 0.83}" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(dim.w / 46)}" text-anchor="middle" fill="${escapeXml(ink)}" opacity="0.65">EXECUTIVE MEMORY &amp; PERSPECTIVE</text>
</svg>`;
  }

  // Default: editorial
  const lines = wrap(input.prompt || "Branded visual", Math.round(dim.w / 48), 4);
  const fontSize = Math.round(dim.w / 22);
  const startY = dim.h / 2 - (lines.length - 1) * fontSize * 0.62;
  const brandY = dim.h - Math.round(dim.h * 0.08);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${dim.w}" height="${dim.h}" viewBox="0 0 ${dim.w} ${dim.h}" role="img" aria-label="${escapeXml(input.prompt.slice(0, 160))}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${escapeXml(bgA)}"/>
      <stop offset="100%" stop-color="${escapeXml(bgB)}"/>
    </linearGradient>
    <pattern id="grain" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.2" fill="${escapeXml(ink)}" opacity="0.10"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect width="100%" height="100%" fill="url(#grain)"/>
  <circle cx="${dim.w - 80}" cy="80" r="${Math.round(dim.w * 0.18)}" fill="${escapeXml(accent)}" opacity="0.18"/>
  <rect x="${Math.round(dim.w * 0.08)}" y="${Math.round(dim.h * 0.10)}" width="56" height="6" rx="3" fill="${escapeXml(accent)}"/>
  ${lines.map((line, i) => `<text x="${Math.round(dim.w * 0.08)}" y="${Math.round(startY + i * fontSize * 1.24)}" font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" font-weight="600" fill="${escapeXml(ink)}">${escapeXml(line)}</text>`).join("\n  ")}
  <text x="${Math.round(dim.w * 0.08)}" y="${brandY}" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(dim.w / 40)}" letter-spacing="4" fill="${escapeXml(ink)}" opacity="0.75">${brandUpper}</text>
  <rect x="${Math.round(dim.w * 0.08)}" y="${brandY + Math.round(dim.h / 45)}" width="${Math.round(dim.w * 0.22)}" height="4" rx="2" fill="${escapeXml(accent)}"/>
</svg>`;
}

export interface ImagePromptSuggestion {
  title: string;
  prompt: string;
  aspect: ImageAspectKey;
  style: ImageStyleKey;
  channelTag: string;
}

export function suggestImagePrompts(
  client: Client,
  knowledge: KnowledgeItem[],
  memory: MemoryCard[] = []
): ImagePromptSuggestion[] {
  const approvedK = knowledge.filter((k) => k.status === "approved" && k.clientId === client.id);
  const approvedM = memory.filter((m) => m.status === "approved");
  const suggestions: ImagePromptSuggestion[] = [];

  // 1. Core Positioning (Landscape - Blog / Twitter card)
  if (client.summary) {
    suggestions.push({
      title: "Core Brand Positioning",
      prompt: `${client.name}: ${client.summary.slice(0, 100)}`,
      aspect: "landscape",
      style: "editorial",
      channelTag: "Twitter / Blog Header"
    });
  }

  // 2. Verified Brain Fact
  const topFact = approvedK.find((k) => k.kind === "brand_fact" || k.kind === "website");
  if (topFact) {
    suggestions.push({
      title: "Verified Fact Highlight",
      prompt: `${topFact.title}: ${topFact.body.slice(0, 90)}`,
      aspect: "square",
      style: "framework",
      channelTag: "LinkedIn / IG Square"
    });
  }

  // 3. Metric / Stat Callout
  const statFact = approvedK.find((k) => /\d+[%x+]?|\$\d+/.test(k.body));
  if (statFact) {
    suggestions.push({
      title: "Proof Point / Metric Callout",
      prompt: `${statFact.body.slice(0, 90)}`,
      aspect: "square",
      style: "stat_callout",
      channelTag: "LinkedIn Stat Post"
    });
  }

  // 4. Founder Memory POV Quote
  const topOpinion = approvedM.find((m) => m.kind === "opinion");
  if (topOpinion) {
    suggestions.push({
      title: "Founder Perspective Quote",
      prompt: `"${topOpinion.body.slice(0, 120)}"`,
      aspect: "portrait",
      style: "minimal_quote",
      channelTag: "IG / LinkedIn Portrait"
    });
  }

  // 5. Vertical Reel / Story Cover
  suggestions.push({
    title: "Vertical Reel Cover",
    prompt: `${client.name}: 3 Production Rules for ${client.industry || "Modern Teams"}`,
    aspect: "story",
    style: "editorial",
    channelTag: "9:16 Reel / Story"
  });

  return suggestions.slice(0, 5);
}
