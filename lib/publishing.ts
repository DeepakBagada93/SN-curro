import type { DB } from "./store";
import { audit, nowIso, uid } from "./store";
import type { PostStatus } from "./types";

export interface PublishOutcome {
  postId: string;
  status: PostStatus;
  reason?: string;
}

export interface PublishResult {
  published: number;
  failed: number;
  skipped: number;
  outcomes: PublishOutcome[];
}

function touchLinkedRecords(db: DB, postId: string): void {
  const post = db.posts.find((p) => p.id === postId);
  if (!post) return;
  const asset = post.assetId ? db.assets.find((a) => a.id === post.assetId) : undefined;
  if (asset) {
    asset.status = "published";
    asset.publishedAt = post.publishedAt ?? nowIso();
  }
  if (post.planItemId) {
    const item = db.planItems.find((p) => p.id === post.planItemId);
    if (item) {
      item.status = "published";
      item.updatedAt = nowIso();
    }
  }
}

// Local queue processor. Real X/LinkedIn publishing plugs in here — same
// scheduled → publishing → published/failed states and failure reasons.
export async function processDuePosts(db: DB, opts: { now?: string; clientId?: string; postId?: string } = {}): Promise<PublishResult> {
  const now = opts.now ?? nowIso();
  const due = db.posts.filter((p) =>
    p.status === "scheduled" &&
    (!p.scheduledAt || p.scheduledAt <= now) &&
    (!opts.clientId || p.clientId === opts.clientId) &&
    (!opts.postId || p.id === opts.postId)
  );
  const outcomes: PublishOutcome[] = [];
  let published = 0;
  let failed = 0;

  for (const post of due) {
    const account = db.accounts.find(
      (a) => a.clientId === post.clientId && a.channel === post.channel && a.status === "connected"
    );
    post.attempts = (post.attempts ?? 0) + 1;
    post.lastAttemptAt = now;
    post.updatedAt = now;

    if (!account) {
      post.status = "failed";
      post.failureReason = `No connected ${post.channel === "x" ? "X" : post.channel} account for this client. Connect the channel, then retry.`;
      failed += 1;
      outcomes.push({ postId: post.id, status: "failed", reason: post.failureReason });
      await audit(db, "post.publish_failed", "scheduled_post", post.id, "queue");
      continue;
    }

    post.status = "published";
    post.publishedAt = now;
    post.externalId = `mock_${post.channel}_${uid("ext").slice(-10)}`;
    post.failureReason = null;
    published += 1;
    outcomes.push({ postId: post.id, status: "published" });
    touchLinkedRecords(db, post.id);
    await audit(db, "post.published", "scheduled_post", post.id, "queue");
  }

  return { published, failed, skipped: db.posts.length - due.length, outcomes };
}

export async function retryPost(db: DB, postId: string): Promise<boolean> {
  const post = db.posts.find((p) => p.id === postId);
  if (!post || (post.status !== "failed" && post.status !== "cancelled")) return false;
  post.status = "scheduled";
  post.scheduledAt = nowIso();
  post.failureReason = null;
  post.updatedAt = nowIso();
  await audit(db, "post.retried", "scheduled_post", post.id);
  return true;
}

export async function cancelPost(db: DB, postId: string): Promise<boolean> {
  const post = db.posts.find((p) => p.id === postId);
  if (!post || post.status === "published" || post.status === "publishing") return false;
  post.status = "cancelled";
  post.updatedAt = nowIso();
  if (post.assetId) {
    const asset = db.assets.find((a) => a.id === post.assetId);
    if (asset && asset.status === "scheduled") {
      asset.status = "approved";
      asset.scheduledAt = null;
    }
  }
  if (post.planItemId) {
    const item = db.planItems.find((p) => p.id === post.planItemId);
    if (item) {
      item.status = "review";
      item.updatedAt = nowIso();
    }
  }
  await audit(db, "post.cancelled", "scheduled_post", post.id);
  return true;
}
