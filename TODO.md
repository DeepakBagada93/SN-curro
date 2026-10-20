# ContentOS — Build TODO

> **Confirmed:** NO · by: — · on: —
> **Scope:** Closed-beta web app for the Founder Signal Brief defined in `PRD.md`.
> **Rule:** Do not write application code until the user confirms this list and the
> implementation blueprint/sitemap. Discovery and document work may proceed.

## Phase 0 — Validate the wedge before building

- [ ] (P0) #1 Recruit 10 B2B SaaS founders who publish or want to publish on LinkedIn — ref: PRD-3
- [ ] (P0) #2 Run and record 10 problem interviews: research workflow, current tools, weekly time spent, trust concerns, and willingness to pay — ref: validation.md
- [ ] (P0) #3 Produce five concierge Founder Signal Briefs manually and measure signal save rate, draft edits, and time-to-approval — ref: PRD-4
- [ ] (P0) #4 Ask at least three qualified interviewees to join a $39/month paid pilot; record yes/no and objections — ref: PRD-9
- [ ] (P0) #5 Review the validation guardrail and explicitly decide build, iterate, or stop — ref: PRD-5

## Phase 1 — Foundation and tenant safety

- [ ] (P0) #6 Create the Next.js/TypeScript application and baseline lint, test, formatting, and CI configuration — ref: documentation.md#11-build-order
- [ ] (P0) #7 Configure Supabase project, migrations, private storage, authentication, workspace membership, and server-side authorization — ref: documentation.md#3-data-model
- [ ] (P0) #8 Implement and test RLS policies plus cross-workspace access denial for every tenant-owned table — ref: documentation.md#8-security-privacy-and-reliability
- [ ] (P0) #9 Add environment configuration, `.env.example`, secret checks, structured logging, and error monitoring — ref: documentation.md#8-security-privacy-and-reliability
- [ ] (P0) #10 Build Brand Brief settings: audience, product, expertise, voice, themes, exclusions, and restricted claims — ref: PRD-8
- [ ] (P0) #11 Build Memory Cards with confirmed/candidate status, provenance, edit, archive, and deletion controls — ref: PRD-8

## Phase 2 — Research engine and Signal Cards

- [ ] (P0) #12 Add the server-only ResearchProvider interface and Parallel Search adapter with schema validation, timeout, and bounded retry behavior — ref: documentation.md#7-provider-interfaces-and-cost-controls
- [ ] (P0) #13 Implement durable research jobs with idempotency, job states, locks, safe failure details, and partial-success handling — ref: documentation.md#5-research-pipeline
- [ ] (P0) #14 Persist normalized sources with canonical URLs, timestamps, hashes, and workspace isolation — ref: documentation.md#3-data-model
- [ ] (P0) #15 Implement deterministic duplicate suppression, dismissal windows, score components, and a plain-language relevance explanation — ref: PRD-8
- [ ] (P0) #16 Build the `/brief` page with manual research run, allowance state, loading/empty/error states, and up to three Signal Cards — ref: documentation.md#9-ui-information-architecture
- [ ] (P0) #17 Build the Signal Card detail page with evidence links, timestamps, Tension Map, save/dismiss controls, and angle composer — ref: PRD-4

## Phase 3 — Draft, Claim Ledger, and human approval

- [ ] (P0) #18 Add the server-only ModelProvider/model router with strict structured output, model metadata, cost events, timeout, and bounded retry behavior — ref: documentation.md#6-generation-and-claim-ledger
- [ ] (P0) #19 Require an explicit founder angle and approved Memory Cards before generating a LinkedIn text-post draft — ref: PRD-8
- [ ] (P0) #20 Create immutable draft versions and the Claim Ledger with factual, opinion, and unsupported states plus source links — ref: documentation.md#6-generation-and-claim-ledger
- [ ] (P0) #21 Build the three-pane draft review screen: editor, Claim Ledger, source panel, approve/reject/archive, and copy/export — ref: documentation.md#9-ui-information-architecture
- [ ] (P0) #22 Implement content-state transition rules, audit events, and tests that prevent publishing or external side effects in beta — ref: PRD-10

## Phase 4 — Cost rails, quality, and closed beta

- [ ] (P0) #23 Enforce per-run and per-workspace limits for search requests, results, excerpts, tokens, cost, and concurrency — ref: documentation.md#7-provider-interfaces-and-cost-controls
- [ ] (P0) #24 Build the usage/settings view with remaining allowance, estimated spend, retention settings, and workspace deletion request — ref: documentation.md#9-ui-information-architecture
- [ ] (P0) #25 Write unit, integration, and end-to-end tests for authorization, research jobs, provider failures, draft generation, quota exhaustion, and deletion — ref: documentation.md#10-test-and-evaluation-plan
- [ ] (P0) #26 Create a permissioned evaluation set and a release scorecard for source relevance, claim alignment, brand fit, edit burden, and cost — ref: documentation.md#10-test-and-evaluation-plan
- [ ] (P0) #27 Run a 15-workspace closed beta and measure the PRD activation, retention, draft-approval, and cost metrics for eight weeks — ref: PRD-5
- [ ] (P0) #28 Decide public-launch readiness using the validation guardrail; do not launch if it fails — ref: validation.md

## Phase 5 — Add only after beta evidence

- [ ] (P1) #29 Add weekly scheduled briefs and notification preferences if manual-brief retention is proven — ref: PRD-6
- [ ] (P1) #30 Add X post/thread adaptation only after LinkedIn draft approval is consistently strong — ref: PRD-6
- [ ] (P1) #31 Add URL/file ingestion with chunk-level provenance and user confirmation for memory suggestions — ref: PRD-6
- [ ] (P1) #32 Add a small editorial queue/calendar and reviewer share links — ref: PRD-6
- [ ] (P1) #33 Validate billing provider, entitlements, checkout, webhook idempotency, invoice support, and cancellation before charging self-serve customers — ref: PRD-9

## Phase 6 — Accounts, metering, history, export (PROPOSED, unconfirmed)

> **Confirmed:** YES · by: founder · on: 2026-10-17 · Auth: email + password.
> Blocked on: working Supabase publishable key
> (current key returns 401), Supabase secret key, OpenRouter API key.

### Accounts & workspace identity (extends #7)

- [ ] (P0) #38 Collect working Supabase keys: publishable (fix 401) + secret (server-only) + OpenRouter key for metering — ref: PRD-8
- [ ] (P0) #39 Add sign-up / sign-in / sign-out, session middleware, and auth guard on all app routes — ref: documentation.md#8-security-privacy-and-reliability
- [ ] (P0) #40 Provision workspace + owner membership + default Brand Brief transactionally on first sign-up — ref: documentation.md#3-data-model
- [ ] (P0) #41 Cut lib/store.ts from local JSON to the Supabase typed query layer with server-side membership checks — ref: documentation.md#11-build-order
- [ ] (P0) #42 Build account settings: profile, password change, sign-out everywhere, workspace deletion with cascade proof — ref: PRD-8

### AI token usage & metering (extends #23–24)

- [ ] (P0) #43 Wire the real OpenRouter ModelProvider with per-call input/output token capture — ref: documentation.md#6-generation-and-claim-ledger
- [ ] (P0) #44 Record every generation in usage_events (tokens in/out, model, cost) with per-workspace aggregates — ref: documentation.md#7-provider-interfaces-and-cost-controls
- [ ] (P1) #45 Upgrade /settings/usage: token balances, daily/monthly bars, per-draft cost table, quota-exhausted states — ref: documentation.md#9-ui-information-architecture
- [ ] (P1) #46 Enforce token + dollar caps before generation with a clear blocked message — ref: PRD-10

### History (extends #21–22)

- [ ] (P1) #47 Build workspace history timeline: runs, drafts, edits, approvals, with status filter and search — ref: documentation.md#9-ui-information-architecture
- [ ] (P1) #48 Add draft version diff view (vN vs vN-1) alongside immutable history — ref: PRD-8
- [ ] (P1) #49 Add research-run detail page: job states, warnings, sources, cost per run — ref: documentation.md#5-research-pipeline

### Export (extends #21)

- [ ] (P1) #50 Export draft as .md/.txt download plus LinkedIn-ready copy — ref: PRD-4
- [ ] (P1) #51 Export brief as a markdown pack (signals + angles + ledger summary) — ref: PRD-4
- [ ] (P1) #52 Full workspace JSON export for portability and deletion compliance — ref: documentation.md#8-security-privacy-and-reliability

## Later / deliberately deferred

- [ ] (P2) #34 Build the Argument Map only when users demonstrate that a visual relationship view improves recurring use — ref: PRD-6
- [ ] (P2) #35 Add blog/newsletter repurposing after the core weekly brief is retained — ref: PRD-6
- [ ] (P2) #36 Add approved platform publishing and analytics integrations only after security, permission, and review requirements are validated — ref: PRD-6
- [ ] (P2) #37 Add team, agency, multi-brand, and enterprise controls only after the single-founder workflow has retention — ref: PRD-3

## Completion rules

- A task becomes done only after it runs, is tested in the relevant environment,
  and has evidence recorded in the build report.
- The implementation order is the order above; do not skip ahead to Phase 5.
- Any feature that expands the PRD needs an explicit update to the PRD and this
  list before implementation.
