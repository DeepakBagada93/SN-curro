# MEMORY.md — Curro

## Goal
Curro (ContentOS): Founder Signal Brief — Signal → Evidence → Angle → Claim check → Draft → Approval. Closed-beta Next.js app.

## Stack (locked)
Next.js 14 App Router + TS + Tailwind + Zod. Local JSON store (`data/curro.json`,
single workspace `ws_curro_beta`) behind `lib/store.ts`; swap for Supabase+RLS per
documentation.md for multi-tenant prod. Mock server-only `ResearchProvider` /
`ModelProvider` adapters; real Parallel/OpenRouter plug in via env.

## Standing decisions
- No code before user approval: user said "build the webapp" = approval to skip Phase-0 validation gating and build P0 beta.
- No external keys in this env → deterministic mock adapters, same interfaces + Zod boundaries as real ones.
- `published` status hard-blocked in `lib/generation.ts` (beta non-goal).
- Caps: 8 briefs / 24 drafts · $5/day · $25/mo · ~$0.15/run.

## 2026-10-17 — motion pass (attention-grabbing UI/UX)
- Added motion system in globals.css (rise entrances, scroll reveals,
  marquee, counters, glow CTAs, floating orbs) + components/motion.tsx
  (Reveal, Counter) — all respect prefers-reduced-motion.
- Landing: staggered hero over drifting orange orbs, loop marquee (pauses
  on hover), animated stat counters, reveals throughout, glowing CTAs,
  floating sample-brief card. Pricing/how-it-works/request-access + brief
  and drafts grids got stagger/reveal treatment.
- Verified: tsc clean · build 20/20 · 8 routes 200.
- User: minimal design, light-only, warm off-white bg + burnt-orange accent.
  Removed dark mode entirely (tokens, toggle, provider, next-themes dep).
- Ink-warmblack secondary buttons, orange CTAs/badges/links/eyebrows.
- Lesson: never `npm run build` while dev server runs (clobbers .next) —
  restart dev cleanly after builds.
- Locked design source of truth: Path B.2 pack — CSS-var tokens, one indigo
  accent, Fraunces display + Inter body, class dark mode via next-themes.
- Added: landing /how-it-works /pricing /request-access, /drafts list,
  /getting-started checklist, copy library (lib/content.ts), app sidebar +
  marketing chrome, sitemap/robots, 404 + error states.
- Restyled all workspace pages to tokens with polished copy + empty states.
- Verified: tsc clean · 7/7 tests · build 20 routes · all 10 pages 200 ·
  live run → signals → signal page 200. (One 500 on /request-access was a
  stale dev artifact; clean restart fixed it.)
- Next: Phase-0 validation interviews; Supabase migration; real adapters.
- Did: scaffolded app shell, lib (types/store/research/generation/quotas), 6 routes
  (/brief, /signals/[id], /drafts/[id], /memory, /settings/brand, /settings/usage),
  4 API routes, 7 unit tests.
- Verified: `tsc` clean · `vitest` 7/7 pass · `next build` pass · `/brief` 200 ·
  live research run → 4 sources, 3 signals, `succeeded`.
- Decided: demo data reset (`data/curro.json` removed); seeds on first load.
- Next: run Phase-0 validation interviews (TODO #1–5, manual); Supabase migration
  (TODO #7–8); real Parallel/OpenRouter adapters (TODO #12/#18).

## 2026-10-17 — removed beta gating, proper open product
- Deleted /request-access (permanent redirect → /signup). Open signup is
  the entry; no waitlist, no closed-beta badges, no pilot language.
- Pricing reframed: Starter (Free) vs Pro ($39/mo). Copy updated across
  landing, pricing, FAQ, chrome, sitemap, robots, README.
- Free-plan quotas kept as real metering (8 briefs / 24 drafts), relabeled.
- Verified: 0 beta references in rendered HTML, redirect 308, guard intact.
- Auth UI fully working on local store: /signup /signin (validated, error
  states), HMAC cookie sessions, Edge middleware guard incl. /api/export,
  sidebar profile + sign-out, /settings/account. scrypt hashes; reset on
  Supabase cutover. Verified: crypto roundtrips, tamper rejection, guard
  307s, full cookie→page chain, export hash redaction.
- Token metering UI: input/output token rows per generation (estimated,
  labeled), usage page with balances, 14-day bars, per-draft cost table.
- History timeline (/history + /runs/[id]) with filter/search; line-level
  version diff on draft page (lib/diff.ts).
- Exports live: draft .md, brief .md pack, workspace JSON (hash redacted).
- Still backend-blocked: #38 keys, #41 store cutover, #43 live tokens.
- supabase/migrations/20261017000000_curro_core.sql: 13 tables, FK cascades,
  idempotency uniques (runs, sources), ranking indexes, updated_at triggers,
  19 RLS policies, least-privilege grants. Ledgers append-only.
- scripts/migrate.ts (idempotent via schema_migrations) + scripts/verify-rls.ts.
- RLS_VERIFY 10/10: A/B isolation on reads, cross-write denied, ledger
  UPDATE rewrites 0 rows. App still on local JSON store — cutover needs
  auth (blocked on working publishable key) + store swap.
- PG lessons: SQL-function bodies validated at CREATE (define after tables);
  no-policy UPDATE = silent 0 rows (policy violation = error); denial probes
  need savepoints to avoid poisoning test txns.

## 2026-10-21 — pivot to Agency Knowledge OS (Phase 1 shipped)
- Direction update written to `output/idea/idea-brief.md`; phased plan in
  `output/TODO.md`. Core thesis: persistent client knowledge layer is the
  product; planning/studio/images/publishing consume it. Founder Brief retained
  as the signal module, not the business.
- Data: added `Client`, `KnowledgeItem`, `ContentPlan`, `PlanItem`,
  `ConnectedAccount`, `ScheduledPost`, `ImageAsset` to lib/types; DB arrays +
  backward-compatible normalization in lib/store (pre-pivot DBs seed the demo
  client once). Demo client `cl_northfield` (Northfield University) with 9
  knowledge items and a November plan.
- API: `/api/clients` (GET/POST), `/api/clients/[id]/knowledge` (GET/POST) with
  Zod boundaries. Middleware guards `/clients` + `/api/clients`.
- UI: `/clients` roster + add client; `/clients/[id]` Knowledge Brain (search +
  kind/status filters, approve/archive/restore), planner add/status, brand
  guardrail editor, publishing gate preview. Sidebar now leads with Clients.
- Approved-only drafting rule surfaced in UI; new knowledge defaults to
  candidate unless explicitly approved.
- Verified: tsc clean · 13/13 tests · build 26 routes · /clients and
  /clients/cl_northfield 200 authed · unauth 307 · API create 201/400 as
  expected. Test data restored afterward (no fake profile left behind).
- Next: knowledge item detail + version history, `/clients/[id]/plan` month
  view, studio citing approved knowledge, then publishing queue.
