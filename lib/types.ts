export type ID = string;

export interface BrandBrief {
  workspaceId: string;
  audience: string;
  product: string;
  category: string;
  expertise: string;
  voiceExamples: string[];
  themes: string[];
  exclusions: string;
  competitors: string;
  restrictedClaims: string;
  updatedAt: string;
}

export type MemoryKind = "fact" | "opinion" | "voice_example" | "candidate";
export type MemoryStatus = "approved" | "candidate" | "archived";

export interface MemoryCard {
  id: ID;
  workspaceId: string;
  kind: MemoryKind;
  body: string;
  status: MemoryStatus;
  provenance: string;
  createdAt: string;
  approvedAt: string | null;
}

export type RunStatus = "queued" | "planning" | "retrieving" | "normalizing" | "deduplicating" | "scoring" | "succeeded" | "partial" | "failed" | "cancelled";

export interface ResearchRun {
  id: ID;
  workspaceId: string;
  status: RunStatus;
  trigger: "manual" | "scheduled";
  idempotencyKey: string;
  themes: string[];
  usage: { queries: number; results: number; estCostUsd: number };
  warnings: string[];
  createdAt: string;
  finishedAt: string | null;
}

export interface SourceResult {
  id: ID;
  workspaceId: string;
  runId: string;
  title: string;
  canonicalUrl: string;
  publisher: string;
  publishedAt: string | null;
  retrievedAt: string;
  excerpt: string;
  query: string;
  contentHash: string;
}

export interface ScoreBreakdown {
  relevance: number;
  freshness: number;
  novelty: number;
  audienceFit: number;
  evidenceQuality: number;
  duplicatePenalty: number;
  total: number;
}

export type SignalStatus = "new" | "saved" | "dismissed" | "drafted" | "archived";

export interface SignalCard {
  id: ID;
  workspaceId: string;
  runId: string;
  title: string;
  whyNow: string;
  relevance: string;
  sourceIds: ID[];
  score: ScoreBreakdown;
  status: SignalStatus;
  suppressionKey: string;
  dismissedUntil: string | null;
  createdAt: string;
}

export interface TensionMap {
  whatChanged: string;
  whyItMatters: string;
  commonTake: string;
  founderAngles: string[];
  mustNotClaim: string[];
}

export interface Angle {
  id: ID;
  workspaceId: string;
  signalCardId: string;
  body: string;
  origin: "suggested" | "founder";
  createdAt: string;
}

export type AssetStatus = "draft" | "in_review" | "approved" | "rejected" | "archived" | "scheduled" | "published";
export type AssetFormat = "linkedin_post" | "x_thread" | "reel_script" | "seo_article" | "faq" | "caption" | "newsletter";

export interface ContentAsset {
  id: ID;
  workspaceId: string;
  signalCardId?: string;
  angleId?: string;
  platform: Channel | "linkedin";
  status: AssetStatus;
  currentVersion: number;
  createdAt: string;
  // Agency studio fields (absent on legacy founder-brief assets).
  clientId?: ID;
  planItemId?: ID;
  format?: AssetFormat;
  title?: string;
  knowledgeIds?: ID[];
  imageId?: ID | null;
  imageAlt?: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  updatedAt?: string;
  clientFeedback?: string | null;
  clientApprovedAt?: string | null;
}
export interface ContentVersion {
  id: ID;
  assetId: string;
  workspaceId: string;
  version: number;
  body: string;
  model: string;
  sourceIds: ID[];
  promptTemplate: string;
  estCostUsd: number;
  createdAt: string;
}

export type ClaimKind = "factual" | "opinion" | "unsupported";
export interface ClaimEntry {
  id: ID;
  workspaceId: string;
  versionId: string;
  claim: string;
  kind: ClaimKind;
  sourceIds: ID[];
  reviewNote: string | null;
  reviewStatus: "open" | "resolved" | "removed";
}

export interface UsageEvent {
  id: ID;
  workspaceId: string;
  runId: string | null;
  provider: string;
  unit: string;
  quantity: number;
  estimatedCost: number;
  createdAt: string;
  // Token metering (TODO #44). Estimated (~chars/4) until live OpenRouter
  // usage capture lands; exact afterwards. Absent on pre-metering rows.
  meta?: { tokensIn?: number; tokensOut?: number; model?: string; estimated?: boolean };
}

export interface AuditEvent {
  id: ID;
  workspaceId: string;
  actor: string;
  action: string;
  resourceType: string;
  resourceId: string;
  createdAt: string;
}

export const DEFAULT_WORKSPACE_ID = "ws_curro_beta";
export const BETA_ALLOWANCE = { briefs: 8, drafts: 24 };

export interface Profile {
  name: string;
  email: string;
  passwordHash?: string; // absent for Google-only accounts
  authProvider?: "password" | "google";
  supabaseUserId?: string;
  avatarUrl?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Agency Knowledge OS (Phase 1) — clients + the persistent knowledge layer.
// Every row is workspace-scoped and (except the workspace itself) client-scoped.
// ---------------------------------------------------------------------------

export type ClientStatus = "active" | "paused" | "archived";

export interface Client {
  id: ID;
  workspaceId: string;
  name: string;
  slug: string;
  industry: string;
  website: string;
  contactName: string;
  contactEmail: string;
  timezone: string;
  brandColor: string;
  audience: string;
  tone: string;
  restrictedClaims: string;
  summary: string;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
}

export type KnowledgeKind =
  | "brand_fact"
  | "website"
  | "source_document"
  | "seo_research"
  | "writing_guideline"
  | "audience"
  | "past_content";

export type KnowledgeStatus = "approved" | "candidate" | "archived";

export interface KnowledgeItem {
  id: ID;
  workspaceId: string;
  clientId: ID;
  kind: KnowledgeKind;
  title: string;
  body: string;
  sourceUrl: string | null;
  status: KnowledgeStatus;
  provenance: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
}

// ---------------------------- Content planner ------------------------------

export type PlanStatus = "draft" | "active" | "archived";

export interface ContentPlan {
  id: ID;
  workspaceId: string;
  clientId: ID;
  month: string; // YYYY-MM
  title: string;
  objective: string;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
}

export type Channel = "linkedin" | "x" | "blog" | "newsletter" | "instagram";

export type PlanItemStatus = "idea" | "assigned" | "in_progress" | "review" | "scheduled" | "published";

export interface PlanItem {
  id: ID;
  workspaceId: string;
  clientId: ID;
  planId: ID;
  channel: Channel;
  title: string;
  pillar: string;
  publishDate: string; // YYYY-MM-DD
  owner: string;
  status: PlanItemStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ------------------------ Publishing (Phase 5 preview) ---------------------

export type AccountStatus = "connected" | "disconnected" | "error";

export interface ConnectedAccount {
  id: ID;
  workspaceId: string;
  clientId: ID;
  channel: Channel;
  handle: string;
  status: AccountStatus;
  scopes: string[];
  connectedAt: string | null;
}

export type PostStatus = "draft" | "in_review" | "approved" | "scheduled" | "publishing" | "published" | "failed" | "cancelled";

export interface ScheduledPost {
  id: ID;
  workspaceId: string;
  clientId: ID;
  channel: Channel;
  body: string;
  imageUrl: string | null;
  status: PostStatus;
  scheduledAt: string | null;
  timezone: string;
  externalId: string | null;
  failureReason: string | null;
  assetId?: ID | null;
  planItemId?: ID | null;
  approvedBy?: string | null;
  attempts?: number;
  lastAttemptAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ImageAssetStatus = "queued" | "ready" | "failed";

export interface ImageAsset {
  id: ID;
  workspaceId: string;
  clientId: ID;
  prompt: string;
  aspect: string;
  status: ImageAssetStatus;
  url: string | null;
  palette: string[];
  costUsd: number;
  origin?: "generated" | "uploaded";
  title?: string;
  createdAt: string;
}

export type PlanTier = "solo" | "studio" | "agency" | "enterprise";

export interface ApiKey {
  id: ID;
  workspaceId: string;
  name: string;
  prefix: string;
  keyHash: string;
  clientId: ID | null;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export type MetricSource = "manual" | "api";

export interface PerformanceSnapshot {
  id: ID;
  workspaceId: string;
  clientId: ID;
  postId: ID;
  impressions: number;
  likes: number;
  comments: number;
  clicks: number;
  source: MetricSource;
  capturedAt: string;
}
