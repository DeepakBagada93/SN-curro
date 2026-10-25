import { z } from "zod";
import type { KnowledgeKind, KnowledgeStatus, PlanItemStatus } from "./types";

export const KNOWLEDGE_KINDS = [
  "brand_fact",
  "website",
  "source_document",
  "seo_research",
  "writing_guideline",
  "audience",
  "past_content"
] as const;

export const KNOWLEDGE_KIND_LABELS: Record<KnowledgeKind, string> = {
  brand_fact: "Brand fact",
  website: "Website",
  source_document: "Source document",
  seo_research: "SEO research",
  writing_guideline: "Writing guideline",
  audience: "Audience",
  past_content: "Past content"
};

export const KNOWLEDGE_KIND_ICONS: Record<KnowledgeKind, string> = {
  brand_fact: "◆",
  website: "◍",
  source_document: "▤",
  seo_research: "⌕",
  writing_guideline: "✎",
  audience: "◉",
  past_content: "↺"
};

export const KNOWLEDGE_STATUSES = ["approved", "candidate", "archived"] as const;
export const PLAN_ITEM_STATUSES = ["idea", "assigned", "in_progress", "review", "scheduled", "published"] as const;
export const CHANNELS = ["linkedin", "x", "blog", "newsletter", "instagram"] as const;

export const CHANNEL_LABELS: Record<(typeof CHANNELS)[number], string> = {
  linkedin: "LinkedIn",
  x: "X",
  blog: "Blog",
  newsletter: "Newsletter",
  instagram: "Instagram"
};

export const PLAN_STATUS_BADGE: Record<PlanItemStatus, string> = {
  idea: "badge-muted",
  assigned: "badge-accent",
  in_progress: "badge-warning",
  review: "badge-warning",
  scheduled: "badge-success",
  published: "badge-success"
};

export const CLIENT_COLORS = ["#1f3a5f", "#7c3aed", "#0f766e", "#b45309", "#be123c", "#334155"];

export const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Australia/Sydney"
];

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour");

export const ClientCreateSchema = z.object({
  name: z.string().trim().min(2, "Client name needs at least 2 characters").max(80),
  industry: z.string().trim().max(80).optional().default(""),
  website: z.string().trim().max(200).optional().default(""),
  contactName: z.string().trim().max(80).optional().default(""),
  contactEmail: z.string().trim().max(120).optional().default(""),
  timezone: z.string().trim().min(1).max(60).optional().default("UTC"),
  brandColor: hexColor.optional().default(CLIENT_COLORS[0]),
  audience: z.string().trim().max(500).optional().default(""),
  tone: z.string().trim().max(500).optional().default(""),
  restrictedClaims: z.string().trim().max(800).optional().default(""),
  summary: z.string().trim().max(300).optional().default("")
});

export const ClientUpdateSchema = ClientCreateSchema.partial().omit({ name: true }).extend({
  name: z.string().trim().min(2).max(80).optional()
});

export const KnowledgeCreateSchema = z.object({
  kind: z.enum(KNOWLEDGE_KINDS),
  title: z.string().trim().min(3, "Title needs at least 3 characters").max(160),
  body: z.string().trim().min(10, "Add at least one usable sentence").max(5000),
  sourceUrl: z.string().trim().max(500).optional().default(""),
  tags: z.array(z.string().trim().max(30)).max(8).optional().default([]),
  provenance: z.string().trim().max(160).optional().default("Agency entry"),
  status: z.enum(["approved", "candidate"]).optional().default("candidate")
});

export const KnowledgeUpdateSchema = z.object({
  kind: z.enum(KNOWLEDGE_KINDS).optional(),
  title: z.string().trim().min(3, "Title needs at least 3 characters").max(160).optional(),
  body: z.string().trim().min(10, "Add at least one usable sentence").max(5000).optional(),
  sourceUrl: z.string().trim().max(500).optional().nullable(),
  tags: z.array(z.string().trim().max(30)).max(8).optional(),
  provenance: z.string().trim().max(160).optional(),
  status: z.enum(["approved", "candidate", "archived"]).optional()
});

export const PlanItemCreateSchema = z.object({
  title: z.string().trim().min(3, "Title needs at least 3 characters").max(200),
  channel: z.enum(CHANNELS),
  pillar: z.string().trim().max(80).optional().default("General"),
  publishDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid publish date"),
  owner: z.string().trim().max(80).optional().default("Unassigned"),
  status: z.enum(PLAN_ITEM_STATUSES).optional().default("idea"),
  notes: z.string().trim().max(600).optional().default("")
});

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function uniqueSlug(db: { clients: { id: string; slug: string }[] }, name: string, ignoreId?: string): string {
  const base = slugify(name) || "client";
  let candidate = base;
  let n = 2;
  while (db.clients.some((c) => c.slug === candidate && c.id !== ignoreId)) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  return candidate;
}

export function knowledgeStats(items: { status: KnowledgeStatus }[]) {
  return {
    total: items.length,
    approved: items.filter((i) => i.status === "approved").length,
    candidate: items.filter((i) => i.status === "candidate").length,
    archived: items.filter((i) => i.status === "archived").length
  };
}

export function parseTags(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 8);
}
