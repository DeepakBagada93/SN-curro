# ContentOS — Agency Knowledge OS · Build TODO

Living implementation plan for the pivot from the Founder Signal Brief to a
client-aware AI content operating system for SEO and marketing agencies.
Source of truth: `output/idea/idea-brief.md`.

Legend: `[x]` shipped · `[~]` in progress · `[ ]` queued.

---

## Phase 1 — Multi-client foundation + Knowledge Brain (core product)

### Data model
- [x] Extend `lib/types.ts` with `Client`, `KnowledgeItem`, `ContentPlan`,
  `PlanItem`, `ConnectedAccount`, `ScheduledPost`, `ImageAsset`, and enums.
- [x] Extend `lib/store.ts` with `clients`, `knowledgeItems`, `plans`,
  `planItems`, `posts`, `accounts`, `images` arrays + safe normalization.
- [x] Seed one demo client (Northfield University) with approved knowledge so
  the workspace is not empty.
- [x] Migrate the same tables into `supabase/migrations/` for multi-tenant prod
  (`20261021000000_agency_knowledge_os.sql`, written — not yet applied).

### API + actions
- [x] `GET/POST /api/clients` with Zod validation, workspace scoping, audit.
- [x] `GET/POST /api/clients/[id]/knowledge` with kind/status validation.
- [x] Server actions: create client, add knowledge, approve/archive knowledge,
  create planner item.
- [x] Middleware guard for `/clients` and `/api/clients`.

### Knowledge Brain UI
- [x] `/clients` — client roster with knowledge counts, status, add-client form.
- [x] `/clients/[id]` — client header, knowledge stats, add-knowledge form,
  approved/candidate lists grouped by kind, approve/archive actions.
- [x] Client brand panel: industry, website, audience, tone, restricted claims.
- [x] Sidebar nav: Clients as the first item.
- [x] Per-client brand color applied to client surfaces.
- [ ] Knowledge item detail page with provenance, source link, edit history.
- [x] Search + filter by text/kind/status across the knowledge brain.
- [ ] Bulk import (URL paste, file upload, CSV) with candidate review.
- [ ] Version history for knowledge edits (append-only).

### Verification
- [x] `tsc --noEmit` clean.
- [x] `vitest` suite passes.
- [x] `next build` clean.
- [x] `/clients` and `/clients/[id]` return 200 behind auth.

---

## Phase 2 — Content Planner

- [x] Monthly plan model + `plan_items` (channel, pillar, date, owner, status).
- [x] Planner section on the client page with add-item form and date-sorted list.
- [x] Global `/planner` page with month switcher and per-client filter.
- [x] Generate a 30-day calendar from approved knowledge + client dates.
- [ ] Per-client `/clients/[id]/plan` route + board/list toggle.
- [ ] Content pillars derived from SEO research; editable.
- [ ] Task assignment to agency members and due-date reminders.
- [ ] Drag/reorder and reschedule with timezone awareness.
- [x] Link plan item → studio asset and → calendar post.

## Phase 3 — AI Content Studio

- [x] Generation pipeline that must cite approved `knowledge_items` + claims
  (OpenRouter provider + deterministic fallback, Zod-validated output).
- [x] Formats: SEO article, LinkedIn post, X thread, newsletter, FAQ, caption,
  Instagram, blog brief. Variants reuse the same knowledge sources.
- [x] Per-asset claim ledger; unsupported claims block approval.
- [x] Draft → in review → client approved → scheduled/published state machine.
- [ ] Side-by-side version diff in the editor (versions are stored + listed).
- [x] Model routing (cheap/strong) + per-plan generation and client caps.
- [ ] Prompt templates stored per client writing guideline.
- [x] Refuse to generate when no approved knowledge exists.

## Phase 4 — AI Image Studio

- [x] Brand kit per client: palette (brand color), format/aspect presets.
- [x] Image generation with per-plan monthly caps + usage ledger.
- [ ] Upload-your-own visual path (free, no model cost).
- [x] Image attached to post preview; alt text required before scheduling.
- [x] Cost guard: block generation at cap, never silently overage.

## Phase 5 — Publishing Calendar

- [~] Connected accounts model + status UI (`/integrations`); real OAuth pending.
- [ ] X and LinkedIn API access review before build (tiers, scopes, media upload,
  rate limits, commercial terms).
- [~] In-process publisher with retries, cancellation, timezone-aware schedules;
  durable queue pending.
- [x] Post status log: scheduled → publishing → published/failed + reason.
- [x] Calendar UI with per-platform preview and approval gate.
- [x] Copy/export fallback while API access is pending.
- [x] Failure reasons and manual retry.

## Phase 6 — Integrations, learning, hardening

- [x] MCP server exposing knowledge search + asset creation (`/api/mcp`).
- [~] REST endpoints for clients, knowledge and assets; revocable API keys
  authorise the MCP server. A versioned public `/api/v1` is still pending.
- [~] Manual performance snapshots + analytics; automatic ingestion pending.
- [x] Client-facing approval portal (`/review/[token]`, no seat cost).
- [ ] Workspace isolation tests (RLS + app-level checks).
- [ ] Retention, deletion, and export per client (GDPR).
- [~] Plan tiers + caps enforced in-app; Stripe billing pending.
  Solo $39, Studio $99, Agency $249, Enterprise custom.
- [x] Update marketing site, pricing page, onboarding to the agency story.
- [ ] Replace local JSON store with Supabase auth + RLS (migration written).

---

## Immediate next actions

1. Apply the Supabase migration and cut the JSON store over.
2. Finish knowledge item detail + bulk import and version history.
3. Add the version diff view and a durable publishing queue.
4. Wire real OAuth for X/LinkedIn and Stripe billing.
5. Run 10 agency interviews before enabling auto-publish.
