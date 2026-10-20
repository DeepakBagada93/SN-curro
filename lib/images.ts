export const IMAGE_ASPECTS: Record<string, { w: number; h: number; label: string }> = {
  square: { w: 1080, h: 1080, label: "Square 1:1" },
  portrait: { w: 1080, h: 1350, label: "Portrait 4:5" },
  landscape: { w: 1200, h: 628, label: "Landscape 1.91:1" }
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
  const second = `hsl(${h % 360} 45% 92%)`;
  const third = `hsl(${(h * 7) % 360} 38% 78%)`;
  const fourth = `hsl(${(h * 13) % 360} 30% 30%)`;
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
}): string {
  const dim = IMAGE_ASPECTS[input.aspect] ?? IMAGE_ASPECTS.square;
  const palette = input.palette.length >= 4 ? input.palette : buildPalette(input.prompt, "#1f3a5f");
  const [accent, bgA, bgB, ink] = palette;
  const lines = wrap(input.prompt || "Branded visual", Math.round(dim.w / 52), 4);
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
  <text x="${Math.round(dim.w * 0.08)}" y="${brandY}" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(dim.w / 40)}" letter-spacing="4" fill="${escapeXml(ink)}" opacity="0.75">${escapeXml(input.brandName.toUpperCase())}</text>
  <rect x="${Math.round(dim.w * 0.08)}" y="${brandY + Math.round(dim.h / 45)}" width="${Math.round(dim.w * 0.22)}" height="4" rx="2" fill="${escapeXml(accent)}"/>
</svg>`;
}
