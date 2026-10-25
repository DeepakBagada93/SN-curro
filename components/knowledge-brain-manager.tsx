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
  onApproveAll,
  onUpdateItem,
  onDeleteItem
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
  onUpdateItem?: (
    clientId: string,
    itemId: string,
    input: {
      kind?: KnowledgeKind;
      title: string;
      body: string;
      sourceUrl?: string | null;
      tags?: string[];
      provenance?: string;
      status?: KnowledgeStatus;
    }
  ) => Promise<{ ok: boolean; item?: KnowledgeItem; error?: string }>;
  onDeleteItem?: (
    clientId: string,
    itemId: string
  ) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [items, setItems] = useState<KnowledgeItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<string>("");
  const [statusTab, setStatusTab] = useState<"all" | KnowledgeStatus>("all");
  const [pendingMap, setPendingMap] = useState<Record<string, string | null>>({});
  const [bulkApproving, setBulkApproving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    body: "",
    kind: "brand_fact" as KnowledgeKind,
    sourceUrl: "",
    tags: "",
    provenance: "",
    status: "candidate" as KnowledgeStatus
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      if (statusTab !== "all" && item.status !== statusTab) return false;
      if (kindFilter && item.kind !== kindFilter) return false;
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

    startTransition(async () => {
      try {
        const res = await onUpdateStatus(clientId, item.id, newStatus);
        if (!res.ok) throw new Error(res.error || "Update failed");
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
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: originalStatus } : i))
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

  const openEditModal = (item: KnowledgeItem) => {
    setEditingItem(item);
    setEditForm({
      title: item.title,
      body: item.body,
      kind: item.kind,
      sourceUrl: item.sourceUrl || "",
      tags: item.tags.join(", "),
      provenance: item.provenance || "Agency entry",
      status: item.status
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !onUpdateItem) return;

    const cleanTitle = editForm.title.trim();
    const cleanBody = editForm.body.trim();
    if (cleanTitle.length < 3) {
      setFeedback({ type: "error", message: "Title must be at least 3 characters." });
      return;
    }
    if (cleanBody.length < 10) {
      setFeedback({ type: "error", message: "Content must be at least 10 characters." });
      return;
    }

    const parsedTags = editForm.tags
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean)
      .slice(0, 8);

    const now = new Date().toISOString();
    const updatedDraft: KnowledgeItem = {
      ...editingItem,
      title: cleanTitle,
      body: cleanBody,
      kind: editForm.kind,
      sourceUrl: editForm.sourceUrl.trim() || null,
      tags: parsedTags,
      provenance: editForm.provenance.trim() || "Agency entry",
      status: editForm.status,
      updatedAt: now,
      approvedAt: editForm.status === "approved" ? editingItem.approvedAt || now : null
    };

    setIsSavingEdit(true);
    // Optimistic update
    const previous = items;
    setItems((prev) => prev.map((i) => (i.id === editingItem.id ? updatedDraft : i)));

    try {
      const res = await onUpdateItem(clientId, editingItem.id, {
        title: cleanTitle,
        body: cleanBody,
        kind: editForm.kind,
        sourceUrl: editForm.sourceUrl.trim() || null,
        tags: parsedTags,
        provenance: editForm.provenance.trim() || "Agency entry",
        status: editForm.status
      });

      if (!res.ok) throw new Error(res.error || "Update failed");

      setFeedback({ type: "success", message: `Updated "${cleanTitle.slice(0, 35)}"` });
      setTimeout(() => setFeedback(null), 3000);
      setEditingItem(null);
    } catch (err: unknown) {
      setItems(previous);
      const msg = err instanceof Error ? err.message : "Failed to save edits";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!onDeleteItem) return;
    const target = items.find((i) => i.id === itemId);
    if (!target) return;

    setDeletingId(null);
    setPendingMap((prev) => ({ ...prev, [itemId]: "deleting" }));

    // Optimistic removal
    const previous = items;
    setItems((prev) => prev.filter((i) => i.id !== itemId));

    try {
      const res = await onDeleteItem(clientId, itemId);
      if (!res.ok) throw new Error(res.error || "Delete failed");
      setFeedback({ type: "success", message: `Deleted fact: "${target.title.slice(0, 35)}"` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      setItems(previous);
      const msg = err instanceof Error ? err.message : "Failed to delete fact";
      setFeedback({ type: "error", message: msg });
    } finally {
      setPendingMap((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    }
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
            const targetAction = pendingMap[item.id];
            const isConfirmingDelete = deletingId === item.id;

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
                  <div className="flex items-center gap-2">
                    <span className={`badge ${STATUS_BADGE[item.status]}`}>
                      {item.status}
                    </span>
                  </div>
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

                {/* Card Actions Footer */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5">
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {item.provenance} · {item.updatedAt.slice(0, 10)}
                    {item.approvedAt ? ` · approved ${item.approvedAt.slice(0, 10)}` : ""}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Approve Button */}
                    {item.status !== "approved" && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(item, "approved")}
                        disabled={isPendingThis}
                        className="btn btn-accent btn-sm !px-2.5 !py-1 text-xs"
                      >
                        {isPendingThis && targetAction === "approved" ? (
                          <>
                            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            <span>Approving…</span>
                          </>
                        ) : (
                          <span>✓ Approve</span>
                        )}
                      </button>
                    )}

                    {/* Edit Button */}
                    {onUpdateItem && (
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        disabled={isPendingThis}
                        className="btn btn-outline btn-sm !px-2.5 !py-1 text-xs"
                        title="Edit fact details"
                      >
                        ✎ Edit
                      </button>
                    )}

                    {/* Archive Button */}
                    {item.status !== "archived" && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(item, "archived")}
                        disabled={isPendingThis}
                        className="btn btn-outline btn-sm !px-2.5 !py-1 text-xs"
                      >
                        {isPendingThis && targetAction === "archived" ? (
                          <>
                            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            <span>Archiving…</span>
                          </>
                        ) : (
                          <span>Archive</span>
                        )}
                      </button>
                    )}

                    {/* Restore Button */}
                    {item.status === "archived" && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(item, "candidate")}
                        disabled={isPendingThis}
                        className="btn btn-outline btn-sm !px-2.5 !py-1 text-xs"
                      >
                        {isPendingThis && targetAction === "candidate" ? (
                          <>
                            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            <span>Restoring…</span>
                          </>
                        ) : (
                          <span>Restore</span>
                        )}
                      </button>
                    )}

                    {/* Delete Action with Confirmation */}
                    {onDeleteItem && (
                      <>
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1 rounded-lg border border-destructive/40 bg-destructive/10 p-0.5">
                            <span className="px-1 text-[11px] font-medium text-destructive">
                              Delete?
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="rounded bg-destructive px-1.5 py-0.5 text-[11px] font-bold text-white hover:opacity-90"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(null)}
                              className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeletingId(item.id)}
                            disabled={isPendingThis}
                            className="btn btn-ghost btn-sm !px-2 !py-1 text-xs text-muted-foreground hover:text-destructive"
                            title="Delete fact permanently"
                          >
                            {isPendingThis && targetAction === "deleting" ? (
                              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
                            ) : (
                              <span>🗑</span>
                            )}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Edit Knowledge Modal */}
      {editingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
        >
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <p className="eyebrow">Edit fact</p>
                <h3 id="edit-modal-title" className="h-display text-xl font-bold">
                  Update Knowledge Item
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3.5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="edit-kind">
                    Kind
                  </label>
                  <select
                    id="edit-kind"
                    className="input"
                    value={editForm.kind}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, kind: e.target.value as KnowledgeKind }))
                    }
                  >
                    {KNOWLEDGE_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {KNOWLEDGE_KIND_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label" htmlFor="edit-status">
                    Status
                  </label>
                  <select
                    id="edit-status"
                    className="input"
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        status: e.target.value as KnowledgeStatus
                      }))
                    }
                  >
                    <option value="candidate">Candidate (Needs Review)</option>
                    <option value="approved">Approved (Verified)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label" htmlFor="edit-title">
                  Title
                </label>
                <input
                  id="edit-title"
                  type="text"
                  className="input"
                  value={editForm.title}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                  minLength={3}
                  maxLength={160}
                />
              </div>

              <div>
                <label className="label" htmlFor="edit-body">
                  Content / Fact Statement
                </label>
                <textarea
                  id="edit-body"
                  className="input min-h-[120px]"
                  value={editForm.body}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, body: e.target.value }))}
                  required
                  minLength={10}
                  maxLength={5000}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="edit-source">
                    Source URL (optional)
                  </label>
                  <input
                    id="edit-source"
                    type="text"
                    className="input"
                    placeholder="https://client.com/page"
                    value={editForm.sourceUrl}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, sourceUrl: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="label" htmlFor="edit-tags">
                    Tags (comma separated)
                  </label>
                  <input
                    id="edit-tags"
                    type="text"
                    className="input"
                    placeholder="pricing, ai, features"
                    value={editForm.tags}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, tags: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="edit-prov">
                  Provenance
                </label>
                <input
                  id="edit-prov"
                  type="text"
                  className="input"
                  value={editForm.provenance}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, provenance: e.target.value }))
                  }
                  maxLength={160}
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="btn btn-accent flex items-center gap-1.5"
                >
                  {isSavingEdit ? (
                    <>
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Saving changes…</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
