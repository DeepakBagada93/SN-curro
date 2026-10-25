"use client";

import { useState, useMemo, useTransition } from "react";
import { initials } from "@/lib/clients";

export interface ClientCardData {
  id: string;
  name: string;
  industry: string;
  summary: string;
  brandColor: string;
  status: string;
  approvedCount: number;
  candidateCount: number;
  plannedCount: number;
  nextPost: { date: string; title: string } | null;
}

export function ClientList({
  clients: initialClients,
  onDeleteClient
}: {
  clients: ClientCardData[];
  onDeleteClient?: (clientId: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [clients, setClients] = useState<ClientCardData[]>(initialClients);
  const [search, setSearch] = useState("");
  const [clientToDelete, setClientToDelete] = useState<ClientCardData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q)
    );
  }, [clients, search]);

  const confirmDelete = async () => {
    if (!clientToDelete || !onDeleteClient) return;

    const target = clientToDelete;
    setIsDeleting(true);

    // Optimistic removal
    const previous = clients;
    setClients((prev) => prev.filter((c) => c.id !== target.id));
    setClientToDelete(null);

    startTransition(async () => {
      try {
        const res = await onDeleteClient(target.id);
        if (!res.ok) throw new Error(res.error || "Failed to delete client");
        setFeedback({
          type: "success",
          message: `Client "${target.name}" and all associated assets deleted.`
        });
        setTimeout(() => setFeedback(null), 3500);
      } catch (err: unknown) {
        setClients(previous);
        const errorMsg = err instanceof Error ? err.message : "Failed to delete client";
        setFeedback({ type: "error", message: errorMsg });
      } finally {
        setIsDeleting(false);
      }
    });
  };

  return (
    <div className="space-y-4">
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

      {/* Instant Search Bar */}
      {clients.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients by name, industry, summary…"
              className="input pr-8"
              aria-label="Filter clients"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                aria-label="Clear filter"
              >
                ✕
              </button>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {clients.length} active client{clients.length === 1 ? "" : "s"}
          </span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty !py-10">
            <h3 className="h-display text-lg">
              {clients.length === 0
                ? "No clients yet."
                : `No clients found matching "${search}"`}
            </h3>
            <p className="prose-muted mt-1 text-sm">
              {clients.length === 0
                ? "Add a client below to start building its Knowledge Brain."
                : "Try searching with a different term or add a new client."}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="btn btn-outline btn-sm mt-3"
              >
                Clear search filter
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="anim-list grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="card card-hover group relative flex flex-col overflow-hidden !p-0 transition-all hover:border-accent/40"
            >
              {/* Brand Color Bar */}
              <div className="h-1.5 w-full" style={{ background: c.brandColor }} aria-hidden />

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <a
                    href={`/clients/${c.id}`}
                    className="flex min-w-0 items-center gap-3 transition hover:opacity-85"
                  >
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-sm font-bold text-white shadow-sm"
                      style={{ background: c.brandColor }}
                      aria-hidden
                    >
                      {initials(c.name)}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-lg font-semibold leading-tight hover:text-accent">
                        {c.name}
                      </h2>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.industry || "No industry set"}
                      </p>
                    </div>
                  </a>

                  {/* Actions & Status Badge */}
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`badge ${
                        c.status === "active" ? "badge-success" : "badge-muted"
                      }`}
                    >
                      {c.status}
                    </span>

                    {onDeleteClient && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setClientToDelete(c);
                        }}
                        className="rounded-lg p-1 text-xs text-muted-foreground opacity-60 transition hover:bg-destructive/10 hover:text-destructive hover:opacity-100 group-hover:opacity-100"
                        title={`Delete ${c.name}`}
                        aria-label={`Delete ${c.name}`}
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </div>

                <a href={`/clients/${c.id}`} className="mt-3 block">
                  <p className="prose-muted line-clamp-2 text-sm leading-relaxed">
                    {c.summary || "No strategy summary yet — open the brain to add brand guardrails."}
                  </p>
                </a>

                {/* Metrics */}
                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-muted/60 py-1.5">
                    <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Approved
                    </dt>
                    <dd className="font-display text-base font-semibold">
                      {c.approvedCount}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-muted/60 py-1.5">
                    <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Review
                    </dt>
                    <dd className="font-display text-base font-semibold">
                      {c.candidateCount}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-muted/60 py-1.5">
                    <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Planned
                    </dt>
                    <dd className="font-display text-base font-semibold">
                      {c.plannedCount}
                    </dd>
                  </div>
                </dl>

                {/* Next Scheduled & Direct Link */}
                <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-xs">
                  <span className="truncate text-muted-foreground">
                    {c.nextPost
                      ? `Next: ${c.nextPost.date} · ${c.nextPost.title}`
                      : "No content planned yet"}
                  </span>
                  <a
                    href={`/clients/${c.id}`}
                    className="shrink-0 font-semibold text-accent hover:underline"
                  >
                    Open brain →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Client Confirmation Modal */}
      {clientToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-client-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-destructive/10 text-xl text-destructive">
                ⚠
              </span>
              <div className="min-w-0 flex-1">
                <h3 id="delete-client-modal-title" className="h-display text-xl font-bold">
                  Delete Client &ldquo;{clientToDelete.name}&rdquo;?
                </h3>
                <p className="prose-muted mt-2 text-sm leading-relaxed">
                  Are you sure you want to permanently delete <strong>{clientToDelete.name}</strong>?
                  This will remove the client account and all associated Knowledge Brain facts,
                  monthly plans, and content drafts. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                disabled={isDeleting}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="btn btn-danger flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Deleting client…</span>
                  </>
                ) : (
                  <span>Yes, Delete Client</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
