import { NextResponse } from "next/server";
import { loadDB } from "@/lib/store";
import { quotaCheck, LIMITS } from "@/lib/quotas";
import { BETA_ALLOWANCE } from "@/lib/types";

export async function GET() {
  const db = await loadDB();
  const spent = db.usage.reduce((a, u) => a + u.estimatedCost, 0);
  const q = quotaCheck(db);
  return NextResponse.json({
    allowance: BETA_ALLOWANCE,
    used: { briefs: db.runs.length, drafts: db.versions.length, estSpendUsd: Math.round(spent * 1000) / 1000 },
    remaining: { briefs: q.remainingBriefs, drafts: q.remainingDrafts },
    caps: { dailyUsd: LIMITS.dailyCapUsd, monthlyUsd: LIMITS.monthlyCapUsd, perRunUsd: LIMITS.runMaxCostUsd },
    usage: db.usage.slice(-50)
  });
}
