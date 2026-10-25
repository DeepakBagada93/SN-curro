"use client";

import { useState, useMemo } from "react";
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

export function ClientList({ clients }: { clients: ClientCardData[] }) {
  const [search, setSearch] = useState("");

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

  return (
    <div className="space-y-4">
      {clients.length > 2 && (
        <div className="relative max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients by name, industry…"
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
      )}

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty !py-10">
            <h3 className="h-display text-lg">No clients found matching &ldquo;{search}&rdquo;</h3>
            <p className="prose-muted mt-1 text-sm">Try another keyword or add a new client below.</p>
            <button
              type="button"
              onClick={() => setSearch("")}
              className="btn btn-outline btn-sm mt-3"
            >
              Clear filter
            </button>
          </div>
        </div>
      ) : (
        <div className="anim-list grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <a
              key={c.id}
              href={`/clients/${c.id}`}
              className="card card-hover flex flex-col overflow-hidden !p-0"
            >
              <div className="h-1.5 w-full" style={{ background: c.brandColor }} aria-hidden />
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-sm font-bold text-white"
                      style={{ background: c.brandColor }}
                      aria-hidden
                    >
                      {initials(c.name)}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-lg font-semibold leading-tight">
                        {c.name}
                      </h2>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.industry || "No industry set"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`badge ${
                      c.status === "active" ? "badge-success" : "badge-muted"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                <p className="prose-muted mt-3 line-clamp-2 text-sm">
                  {c.summary || "No strategy summary yet — open the client to add one."}
                </p>

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

                <p className="mt-auto pt-4 text-xs text-muted-foreground">
                  {c.nextPost
                    ? `Next: ${c.nextPost.date} · ${c.nextPost.title}`
                    : "No content planned yet · open the brain →"}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
