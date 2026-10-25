"use client";

import { useState, useTransition, useMemo } from "react";
import type { KnowledgeItem, KnowledgeKind, KnowledgeStatus } from "@/lib/types";
import {
  KNOWLEDGE_KINDS,
  KNOWLEDGE_KIND_ICONS,
  KNOWLEDGE_KIND_LABELS
} from "@/lib/clients";

const STATUS_BADGE: Record<KnowledgeStatus, string> = {
  approved: "badge-success",
  candidate: "badge-warning",
  archived: "badge-muted"
};

export function KnowledgeBrainManager({
  initialItems,
  clientId,
  onUpdateStatus,
  onApproveAll
}: {
  initialItems: KnowledgeItem[];
  clientId: string;
  onUpdateStatus: (
    clientId: string,
    itemId: string,
    status: KnowledgeStatus
  ) => Promise<{ ok: boolean; error?: string }>;
  onApproveAll?: (
    clientId: string
  ) => Promise<{ ok: boolean; count: number; error?: string }>;
}) {
  const [items, setItems] = useState<KnowledgeItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<string>("");
  const [statusTab, setStatusTab] = useState<"all" | KnowledgeStatus>("all");
  const [pendingMap, setPendingMap] = useState<Record<string, KnowledgeStatus | null>>({});
  const [bulkApproving, setBulkApproving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [, startTransition] = useTransition();

  // Counts
  const counts = useMemo(() => {
    let approved = 0;
    let candidate = 0;
    let archived = 0;
    for (const item of items) {
      if (item.status === "approved") approved++;
      else if (item.status === "candidate") candidate++;
      else if (item.status === "archived") archived++;
    }
    return {
      total: items.length,
      approved,
      candidate,
      archived
    };
  }, [items]);

  // Instant filtered list
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      // Status tab filter
      if (statusTab !== "all" && item.status !== statusTab) {
        return false;
      }
      // Kind filter
      if (kindFilter && item.kind !== kindFilter) {
        return false;
      }
      // Search query filter
      if (q) {
        const text = `${item.title} ${item.body} ${item.tags.join(" ")} ${item.provenance}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [items, searchQuery, kindFilter, statusTab]);

  const handleStatusChange = async (item: KnowledgeItem, newStatus: KnowledgeStatus) => {
    const originalStatus = item.status;
    const now = new Date().toISOString();

    // 1. Optimistic instant UI update
    setPendingMap((prev) => ({ ...prev, [item.id]: newStatus }));
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              status: newStatus,
              updatedAt: now,
              approvedAt: newStatus === "approved" ? now : i.approvedAt
            }
          : i
      )
    );

    // 2. Background server execution
    startTransition(async () => {
      try {
        const res = await onUpdateStatus(clientId, item.id, newStatus);
        if (!res.ok) {
          throw new Error(res.error || "Update failed");
        }
        setFeedback({
          type: "success",
          message:
            newStatus === "approved"
              ? `✓ Approved: "${item.title.slice(0, 40)}"`
              : newStatus === "archived"
                ? `Archived: "${item.title.slice(0, 40)}"`
                : `Restored to review: "${item.title.slice(0, 40)}"`
        });
        setTimeout(() => setFeedback(null), 3000);
      } catch (err: unknown) {
        // Rollback on failure
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: originalStatus } : i
          )
        );
        const errorMsg = err instanceof Error ? err.message : "Action failed";
        setFeedback({ type: "error", message: `Failed to update status: ${errorMsg}` });
      } finally {
        setPendingMap((prev) => {
          const next = { ...prev };
          delete next[item.id];
          return next;
        });
      }
    });
  };

  const handleApproveAllCandidates = async () => {
    if (!onApproveAll || counts.candidate === 0 || bulkApproving) return;

    const previousItems = items;
    const now = new Date().toISOString();

    setBulkApproving(true);
    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.status === "candidate"
          ? { ...i, status: "approved", updatedAt: now, approvedAt: now }
          : i
      )
    );

    startTransition(async () => {
      try {
        const res = await onApproveAll(clientId);
        if (!res.ok) throw new Error(res.error || "Bulk approve failed");
        setFeedback({
          type: "success",
          message: `✨ Approved all ${res.count} candidate facts!`
        });
        setTimeout(() => setFeedback(null), 3500);
      } catch (err: unknown) {
        setItems(previousItems);
        const errorMsg = err instanceof Error ? err.message : "Bulk approve failed";
        setFeedback({ type: "error", message: errorMsg });
      } finally {
        setBulkApproving(false);
      }
    });
  };

  return (
    <section id="knowledge" className="space-y-4">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all ${
            feedback.type === "success"
              ? "border border-success/30 bg-success/10 text-success"
              : "border border-destructive/30 bg-destructive/10 text-destructive"
          }`}
          role="status"
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100"
            aria-label="Dismiss message"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Control Card */}
      <div className="card !p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Knowledge Brain</p>
            <h2 className="h-display text-2xl">What the agency knows</h2>
          </div>
          <div className="flex items-center gap-2">
            {counts.candidate > 0 && onApproveAll && (
              <button
                type="button"
                onClick={handleApproveAllCandidates}
                disabled={bulkApproving}
                className="btn btn-accent btn-sm flex items-center gap-1.5"
              >
                {bulkApproving ? (
                  <>
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Approving…</span>
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    <span>Approve All Candidates ({counts.candidate})</span>
                  </>
                )}
              </button>
            )}
            <span className="text-xs text-muted-foreground">
              {filtered.length} of {items.length} items
            </span>
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-b border-border pb-3">
          <button
            type="button"
            onClick={() => setStatusTab("all")}
            className={`btn btn-sm !h-8 !px-3 text-xs ${
              statusTab === "all" ? "btn-accent" : "btn-outline"
            }`}
          >
            All ({counts.total})
          </button>
          <button
            type="button"
            onClick={() => setStatusTab("approved")}
            className={`btn btn-sm !h-8 !px-3 text-xs ${
              statusTab === "approved" ? "btn-accent" : "btn-outline"
            }`}
          >
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            Approved ({counts.approved})
          </button>
          <button
            type="button"
            onClick={() => setStatusTab("candidate")}
            className={`btn btn-sm !h-8 !px-3 text-xs ${
              statusTab === "candidate" ? "btn-accent" : "btn-outline"
            }`}
          >
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
            Awaiting Review ({counts.candidate})
          </button>
          <button
            type="button"
            onClick={() => setStatusTab("archived")}
            className={`btn btn-sm !h-8 !px-3 text-xs ${
              statusTab === "archived" ? "btn-accent" : "btn-outline"
            }`}
          >
            Archived ({counts.archived})
          </button>
        </div>

        {/* Live Search & Kind Filter */}
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Instant search facts, research, tags…"
              className="input pr-8"
              aria-label="Search knowledge facts"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value)}
            className="input sm:!w-44"
            aria-label="Filter by kind"
          >
            <option value="">All kinds</option>
            {KNOWLEDGE_KINDS.map((k) => (
              <option key={k} value={k}>
                {KNOWLEDGE_KIND_LABELS[k]}
              </option>
            ))}
          </select>

          {(searchQuery || kindFilter || statusTab !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setKindFilter("");
                setStatusTab("all");
              }}
              className="btn btn-outline text-xs"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      <p className="alert alert-warning">
        Only <strong>approved</strong> knowledge may be used for drafting. Candidates stay
        quarantined until an agency reviewer verifies them.
      </p>

      {/* Item List */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty !py-10">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-2xl" aria-hidden>
              ❖
            </div>
            <h3 className="h-display mt-4 text-lg">
              {items.length === 0
                ? "The brain is empty."
                : searchQuery
                  ? `No facts found matching "${searchQuery}"`
                  : `No items in ${statusTab === "all" ? "this view" : statusTab}.`}
            </h3>
            <p className="prose-muted mt-1 max-w-md text-sm">
              {items.length === 0
                ? "Use the AI Web Ingestion tool on the right to crawl client pages, or add facts manually."
                : "Try adjusting your search query or switching tabs."}
            </p>
            {(searchQuery || kindFilter || statusTab !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setKindFilter("");
                  setStatusTab("all");
                }}
                className="btn btn-outline btn-sm mt-4"
              >
                Show all knowledge items
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="anim-list space-y-3">
          {filtered.map((item) => {
            const isPendingThis = pendingMap[item.id] !== undefined;
            const targetStatus = pendingMap[item.id];

            return (
              <article
                key={item.id}
                className={`rounded-xl border bg-card p-4 transition-all ${
                  item.status === "candidate"
                    ? "border-amber-500/30 bg-amber-500/[0.02]"
                    : "border-border"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {KNOWLEDGE_KIND_ICONS[item.kind]} {KNOWLEDGE_KIND_LABELS[item.kind]}
                    </p>
                    <h3 className="mt-0.5 font-display text-lg font-semibold leading-snug">
                      {item.title}
                    </h3>
                  </div>
                  <span className={`badge ${STATUS_BADGE[item.status]}`}>
                    {item.status}
                  </span>
                </div>

                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground leading-relaxed">
                  {item.body}
                </p>

                {item.sourceUrl && (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block break-all text-xs font-semibold text-accent hover:underline"
                  >
                    Source ↗ {item.sourceUrl.replace(/^https?:\/\//, "")}
                  </a>
                )}

                {item.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        onClick={() => setSearchQuery(tag)}
                        className="badge badge-muted cursor-pointer hover:bg-accent/20 transition-colors"
                        title={`Filter by #${tag}`}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5">
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {item.provenance} · {item.updatedAt.slice(0, 10)}
                    {item.approvedAt ? ` · approved ${item.approvedAt.slice(0, 10)}` : ""}
                  </p>

                  <div className="flex items-center gap-1.5">
                    {item.status !== "approved" && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(item, "approved")}
                        disabled={isPendingThis}
                        className="btn btn-accent btn-sm !px-2.5 !py-1 text-xs"
                      >
                        {isPendingThis && targetStatus === "approved" ? (
                          <>
                            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            <span>Approving…</span>
                          </>
                        ) : (
                          <span>✓ Approve</span>
                        )}
                      </button>
                    )}

                    {item.status !== "archived" && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(item, "archived")}
                        disabled={isPendingThis}
                        className="btn btn-outline btn-sm !px-2.5 !py-1 text-xs"
                      >
                        {isPendingThis && targetStatus === "archived" ? (
                          <>
                            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            <span>Archiving…</span>
                          </>
                        ) : (
                          <span>Archive</span>
                        )}
                      </button>
                    )}

                    {item.status === "archived" && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(item, "candidate")}
                        disabled={isPendingThis}
                        className="btn btn-outline btn-sm !px-2.5 !py-1 text-xs"
                      >
                        {isPendingThis && targetStatus === "candidate" ? (
                          <>
                            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            <span>Restoring…</span>
                          </>
                        ) : (
                          <span>Restore</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
