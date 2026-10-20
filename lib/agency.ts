import type { AssetFormat, AssetStatus, Channel, ClaimEntry, ContentAsset, ContentVersion, PlanItemStatus, PlanTier } from "./types";

export const PLAN_CATALOG: Record<PlanTier, {
  label: string;
  price: string;
  cadence: string;
  clients: number;
  generations: number;
  images: number;
  seats: number;
  blurb: string;
}> = {
  solo: { label: "Solo", price: "$39", cadence: "/mo", clients: 1, generations: 30, images: 10, seats: 1, blurb: "One client, the full knowledge-to-publish loop." },
  studio: { label: "Studio", price: "$99", cadence: "/mo", clients: 5, generations: 150, images: 50, seats: 2, blurb: "For a small SEO/social team running several accounts." },
  agency: { label: "Agency", price: "$249", cadence: "/mo", clients: 20, generations: 600, images: 200, seats: 10, blurb: "Multi-client workspace with approvals and integrations." },
  enterprise: { label: "Enterprise", price: "Custom", cadence: "", clients: 999, generations: 9999, images: 9999, seats: 999, blurb: "SSO, custom limits, dedicated onboarding, MCP/API." }
};

export const PLAN_ORDER: PlanTier[] = ["solo", "studio", "agency", "enterprise"];

export interface StudioFormat {
  id: AssetFormat;
  label: string;
  channel: Channel;
  description: string;
  maxChars: number;
}

export const STUDIO_FORMATS: StudioFormat[] = [
  { id: "linkedin_post", label: "LinkedIn post", channel: "linkedin", description: "Thought-leadership post with a cited fact and a clear POV.", maxChars: 3000 },
  { id: "x_thread", label: "X thread", channel: "x", description: "Numbered thread that repurposes the same approved source material.", maxChars: 2800 },
  { id: "reel_script", label: "Reel script", channel: "instagram", description: "30–45 second vertical script: hook, timed beats, voiceover, on-screen text and CTA.", maxChars: 4500 },
  { id: "seo_article", label: "SEO article", channel: "blog", description: "Long-form section draft targeting one intent cluster.", maxChars: 12000 },
  { id: "newsletter", label: "Newsletter", channel: "newsletter", description: "Subject line plus a short editorial issue.", maxChars: 6000 },
  { id: "faq", label: "FAQ block", channel: "blog", description: "Question/answer pairs for a program or product page.", maxChars: 4000 },
  { id: "caption", label: "Social caption", channel: "instagram", description: "Short caption with hashtags derived from approved tags.", maxChars: 2200 }
];

export function formatLabel(format: AssetFormat | undefined): string {
  return STUDIO_FORMATS.find((f) => f.id === format)?.label ?? "Content asset";
}

export function formatChannel(format: AssetFormat | undefined): Channel {
  return STUDIO_FORMATS.find((f) => f.id === format)?.channel ?? "linkedin";
}

export function formatForChannel(channel: Channel): AssetFormat {
  switch (channel) {
    case "x": return "x_thread";
    case "blog": return "seo_article";
    case "instagram": return "reel_script";
    case "newsletter": return "newsletter";
    default: return "linkedin_post";
  }
}

const ASSET_TRANSITIONS: Record<AssetStatus, AssetStatus[]> = {
  draft: ["in_review", "archived"],
  in_review: ["approved", "rejected", "draft", "archived"],
  approved: ["scheduled", "archived"],
  scheduled: ["published", "approved", "archived"],
  published: ["archived"],
  rejected: ["draft", "archived"],
  archived: []
};

export function canAssetTransition(from: AssetStatus, to: AssetStatus): boolean {
  return (ASSET_TRANSITIONS[from] ?? []).includes(to);
}

export const PLAN_ITEM_TRANSITIONS: Record<PlanItemStatus, PlanItemStatus[]> = {
  idea: ["assigned", "in_progress", "review", "scheduled", "published"],
  assigned: ["in_progress", "review", "scheduled", "published", "idea"],
  in_progress: ["review", "scheduled", "published", "assigned"],
  review: ["scheduled", "published", "in_progress"],
  scheduled: ["published", "review"],
  published: []
};

export interface ClaimBlocker {
  code: string;
  message: string;
}

export function claimBlockers(
  asset: ContentAsset,
  version: ContentVersion | undefined,
  claims: ClaimEntry[],
  knowledge: { id: string; status: string; clientId: string }[]
): ClaimBlocker[] {
  const blockers: ClaimBlocker[] = [];
  if (!version) blockers.push({ code: "no-version", message: "This asset has no content version yet." });

  const versionClaims = claims.filter((c) => c.versionId === version?.id);
  const unsupportedOpen = versionClaims.filter((c) => c.kind === "unsupported" && c.reviewStatus === "open");
  if (unsupportedOpen.length > 0) {
    blockers.push({ code: "unsupported", message: `${unsupportedOpen.length} unsupported claim${unsupportedOpen.length === 1 ? "" : "s"} still open — remove or rewrite before approval.` });
  }

  const uncitedFacts = versionClaims.filter((c) => c.kind === "factual" && c.sourceIds.length === 0);
  if (uncitedFacts.length > 0) {
    blockers.push({ code: "uncited-fact", message: `${uncitedFacts.length} factual claim${uncitedFacts.length === 1 ? "" : "s"} has no cited knowledge item.` });
  }

  const used = (asset.knowledgeIds ?? []).map((id) => knowledge.find((k) => k.id === id));
  if (used.some((k) => !k)) {
    blockers.push({ code: "missing-knowledge", message: "An attached knowledge item no longer exists." });
  }
  if (used.some((k) => k && k.status !== "approved")) {
    blockers.push({ code: "unapproved-knowledge", message: "An attached knowledge item is not approved. Re-approve it or regenerate." });
  }
  if (used.some((k) => k && k.clientId !== asset.clientId)) {
    blockers.push({ code: "cross-client", message: "An attached knowledge item belongs to another client." });
  }

  if (asset.imageId && !asset.imageAlt?.trim()) {
    blockers.push({ code: "image-alt", message: "Add alt text for the attached image before scheduling." });
  }

  return blockers;
}

export function canApproveAsset(
  asset: ContentAsset,
  version: ContentVersion | undefined,
  claims: ClaimEntry[],
  knowledge: { id: string; status: string; clientId: string }[]
): { ok: boolean; blockers: ClaimBlocker[] } {
  if (asset.status !== "draft" && asset.status !== "in_review") {
    return { ok: false, blockers: [{ code: "state", message: `Asset is already ${asset.status.replace("_", " ")}.` }] };
  }
  const blockers = claimBlockers(asset, version, claims, knowledge);
  return { ok: blockers.length === 0, blockers };
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 864e5).toISOString();
}

export function generationsUsed(assets: ContentAsset[], clientId?: string): number {
  const since = daysAgoIso(30);
  return assets.filter((a) => a.createdAt >= since && (!clientId || a.clientId === clientId)).length;
}

export function imagesUsed(images: { clientId: string; createdAt: string }[], clientId?: string): number {
  const since = daysAgoIso(30);
  return images.filter((i) => i.createdAt >= since && (!clientId || i.clientId === clientId)).length;
}

export function planLimit(tier: PlanTier) {
  return PLAN_CATALOG[tier];
}

export function monthKey(date = new Date()): string {
  return date.toISOString().slice(0, 7);
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return 30;
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function dateInMonth(month: string, day: number): string {
  const dim = daysInMonth(month);
  const safe = Math.min(Math.max(1, day), dim);
  return `${month}-${String(safe).padStart(2, "0")}`;
}

export function badgeForAssetStatus(status: AssetStatus): string {
  return status === "approved" || status === "published" || status === "scheduled"
    ? "badge-success"
    : status === "rejected"
      ? "badge-danger"
      : status === "archived"
        ? "badge-muted"
        : status === "in_review"
          ? "badge-warning"
          : "badge-accent";
}
