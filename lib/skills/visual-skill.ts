import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { loadDB, saveDB, audit, uid, nowIso } from "../store";
import {
  IMAGE_ASPECTS,
  IMAGE_STYLES,
  IMAGE_COST_USD,
  buildImageSvg,
  buildPalette,
  type ImageAspectKey,
  type ImageStyleKey
} from "../images";
import { REGISTERED_SKILLS, type CurroSkill, type SkillExecutionContext } from "./core-skills";

export interface VisualSkillOutput {
  id: string;
  url: string;
  prompt: string;
  aspect: ImageAspectKey;
  style: ImageStyleKey;
  palette: string[];
  svg: string;
  costUsd: number;
  createdAt: string;
  aspectLabel: string;
  styleLabel: string;
  dimensions: { w: number; h: number };
}

export function parseVisualDirectives(prompt: string): {
  cleanPrompt: string;
  aspect: ImageAspectKey;
  style: ImageStyleKey;
} {
  let cleanPrompt = prompt.replace(/^\/image\s*/i, "").trim();
  const lower = cleanPrompt.toLowerCase();

  // Detect Aspect Ratio
  let aspect: ImageAspectKey = "square";
  if (lower.includes("9:16") || lower.includes("reel") || lower.includes("story") || lower.includes("vertical") || lower.includes("tiktok")) {
    aspect = "story";
  } else if (lower.includes("16:9") || lower.includes("landscape") || lower.includes("twitter card") || lower.includes("banner") || lower.includes("header")) {
    aspect = "landscape";
  } else if (lower.includes("4:5") || lower.includes("portrait") || lower.includes("feed portrait")) {
    aspect = "portrait";
  } else if (lower.includes("1:1") || lower.includes("square")) {
    aspect = "square";
  }

  // Detect Style
  let style: ImageStyleKey = "editorial";
  if (lower.includes("stat") || lower.includes("metric") || lower.includes("number") || lower.includes("%") || lower.includes("proof")) {
    style = "stat_callout";
  } else if (lower.includes("framework") || lower.includes("diagram") || lower.includes("blueprint") || lower.includes("architecture") || lower.includes("steps")) {
    style = "framework";
  } else if (lower.includes("quote") || lower.includes("pov") || lower.includes("founder") || lower.includes("saying")) {
    style = "minimal_quote";
  } else if (lower.includes("editorial") || lower.includes("minimal") || lower.includes("typography")) {
    style = "editorial";
  }

  return { cleanPrompt: cleanPrompt || "Brand Authority Visual", aspect, style };
}

export const visualSkill: CurroSkill<VisualSkillOutput> = {
  metadata: REGISTERED_SKILLS.visual,
  async execute(ctx: SkillExecutionContext): Promise<VisualSkillOutput> {
    const { cleanPrompt, aspect, style } = parseVisualDirectives(ctx.prompt);
    const db = await loadDB();
    const client = db.clients.find((c) => c.id === ctx.client.id) || ctx.client;

    const id = uid("img");
    const brandColor = client.brandColor || "#9e4322";
    const palette = buildPalette(cleanPrompt + client.name, brandColor);
    const svg = buildImageSvg({
      prompt: cleanPrompt,
      palette,
      aspect,
      brandName: client.name,
      style
    });

    // Write SVG file to local storage directory
    const dir = path.join(process.cwd(), "data", "images");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, `${id}.svg`), svg, "utf8");

    const t = nowIso();
    const url = `/api/images/${id}/file`;
    const aspectMeta = IMAGE_ASPECTS[aspect] || IMAGE_ASPECTS.square;
    const styleMeta = IMAGE_STYLES[style] || IMAGE_STYLES.editorial;

    // Record in DB
    db.images.push({
      id,
      workspaceId: client.workspaceId,
      clientId: client.id,
      prompt: cleanPrompt,
      aspect,
      status: "ready",
      url,
      palette,
      costUsd: IMAGE_COST_USD,
      origin: "generated",
      title: cleanPrompt.slice(0, 80),
      createdAt: t
    });

    db.usage.push({
      id: uid("use"),
      workspaceId: client.workspaceId,
      runId: null,
      provider: "curro-svg-renderer",
      unit: "image",
      quantity: 1,
      estimatedCost: IMAGE_COST_USD,
      createdAt: t
    });

    await audit(db, "image.generated", "image", id);
    await saveDB(db);

    return {
      id,
      url,
      prompt: cleanPrompt,
      aspect,
      style,
      palette,
      svg,
      costUsd: IMAGE_COST_USD,
      createdAt: t,
      aspectLabel: aspectMeta.label,
      styleLabel: styleMeta.label,
      dimensions: { w: aspectMeta.w, h: aspectMeta.h }
    };
  }
};
