import type { DB } from "./store";
import { BETA_ALLOWANCE } from "./types";

export const LIMITS = {
  runMaxQueries: Number(process.env.RUN_MAX_QUERIES ?? 4),
  runMaxResults: Number(process.env.RUN_MAX_RESULTS ?? 12),
  runMaxCostUsd: 0.15,
  dailyCapUsd: Number(process.env.WORKSPACE_DAILY_CAP_USD ?? 5),
  monthlyCapUsd: Number(process.env.WORKSPACE_MONTHLY_CAP_USD ?? 25),
  maxConcurrentRuns: 1
};

export function estimateSearchCost(queries: number): number {
  return Math.round(queries * 0.007 * 1000) / 1000; // $0.007/query working assumption
}
export function estimateDraftCost(chars: number): number {
  return Math.round((chars / 1000) * 0.004 * 1000) / 1000;
}

// Token estimates (~4 chars/token) until live provider capture (TODO #43).
// Rows are marked estimated:true so the usage page can label them honestly.
export function estimateTokens(chars: number): number {
  return Math.max(1, Math.round(chars / 4));
}
const MOCK_IN_USD_PER_1K = 0.0015;
const MOCK_OUT_USD_PER_1K = 0.002;
export function tokenCostUsd(tokensIn: number, tokensOut: number): number {
  return Math.round(((tokensIn / 1000) * MOCK_IN_USD_PER_1K + (tokensOut / 1000) * MOCK_OUT_USD_PER_1K) * 10000) / 10000;
}

function spentSince(db: DB, sinceIso: string): number {
  return db.usage.filter((u) => u.createdAt >= sinceIso).reduce((a, u) => a + u.estimatedCost, 0);
}

export function quotaCheck(db: DB): { ok: boolean; reason?: string; remainingBriefs: number; remainingDrafts: number } {
  const runsUsed = db.runs.length;
  const draftsUsed = db.versions.length;
  const remainingBriefs = Math.max(0, BETA_ALLOWANCE.briefs - runsUsed);
  const remainingDrafts = Math.max(0, BETA_ALLOWANCE.drafts - draftsUsed);
  const dayAgo = new Date(Date.now() - 864e5).toISOString();
  const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString();
  if (spentSince(db, dayAgo) >= LIMITS.dailyCapUsd) return { ok: false, reason: "Daily spend cap reached.", remainingBriefs, remainingDrafts };
  if (spentSince(db, monthAgo) >= LIMITS.monthlyCapUsd) return { ok: false, reason: "Monthly spend cap reached.", remainingBriefs, remainingDrafts };
  if (remainingBriefs <= 0) return { ok: false, reason: "Free-plan brief allowance exhausted (8 briefs).", remainingBriefs, remainingDrafts };
  const active = db.runs.some((r) => ["queued", "planning", "retrieving", "normalizing", "deduplicating", "scoring"].includes(r.status));
  if (active) return { ok: false, reason: "A research run is already in progress.", remainingBriefs, remainingDrafts };
  return { ok: true, remainingBriefs, remainingDrafts };
}
