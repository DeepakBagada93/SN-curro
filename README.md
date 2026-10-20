# Curro — Agency Knowledge OS

**Client knowledge → monthly plan → content → approval → publishing.**

Closed-beta web app for SEO and marketing agencies (see `PRD.md`). The core
product is the **Knowledge Brain**: each client's approved facts, source
documents, SEO research and voice rules, stored once and reused across planning,
creation and publishing. The original Founder Signal Brief remains as a wedge
module.

## Agency Knowledge OS (Phase 1 — live)

- `/clients` — client roster, workspace stats, add-client.
- `/clients/[id]` — **Knowledge Brain** (approved/candidate items, source links,
  tags, approve/archive), monthly **Content Planner** items, and **Brand
  guardrails** (audience, tone, restricted claims).
- Approved knowledge only is usable for drafting; candidates stay quarantined
  until a human approves them.
- Per-client brand colour, timezone, contacts and strategy summary.

Demo client **Northfield University** seeds on first load with approved brand
facts, SEO research, admissions dates, voice rules and a November plan.

## Quick start

```bash
npm install
npm run dev   # http://localhost:3000/ — landing; app at /brief
npm test      # unit tests (URL canon, scoring, transitions, client helpers)
npm run build && npm start
```

No API keys needed: Curro ships with server-only mock adapters behind the
`ResearchProvider` / `ModelProvider` interfaces. Set `PARALLEL_API_KEY` /
`OPENROUTER_API_KEY` + `*_PROVIDER` envs (see `.env.example`) to plug real
adapters — business logic never touches provider shapes directly.

## Design source of truth

Open-source pack (`design-system.md` + `frontend-design.md` Path B.2),
minimal light theme: warm off-white background, single burnt-orange accent,
Fraunces display + Inter body, 4px spacing scale, shadcn-style radii.
Light-only by design decision — no dark mode. Token-only CSS variables;
marketing chrome + app sidebar in `components/chrome.tsx`;
copy library in `lib/content.ts`.

## Routes

| Route | Purpose |
|---|---|
| `/` | Landing: hero, problem, loop, features, sample brief, pricing teaser, FAQ |
| `/clients` | Agency roster: stats, client cards, add-client |
| `/clients/[id]` | Knowledge Brain, content planner, brand guardrails |
| `/how-it-works` | Full 6-step loop + six refusal guardrails |
| `/pricing` | Starter vs Pro plans, comparison table, guarantee |
| `/request-access` → `/signup` | Old beta gate redirects to open signup |
| `/signup` · `/signin` | Google OAuth via Supabase, plus email + password fallback |
| `/getting-started` | Live 5-step onboarding checklist |
| `/history` | Workspace timeline: runs, drafts, approvals, editorial actions (filter + search) |
| `/runs/[id]` | Run detail: states, warnings, signals, sources, cost |
| `/brief` | Manual run button, allowance, latest 3 Signal Cards |
| `/signals/[id]` | Evidence links, Tension Map, save/dismiss, angle composer |
| `/drafts` | Draft list with status filter |
| `/drafts/[id]` | Editor + Claim Ledger + sources, version diff, approve/reject/archive, markdown export |
| `/memory` | Approved vs candidate Memory Cards |
| `/settings/brand` | Brand Brief editor |
| `/settings/usage` | Token metering, 14-day bars, per-draft costs, ledger, audit, deletion request |
| `/settings/account` | Profile, workspace stats, JSON export |

## API (all server-side, workspace-scoped)

`GET/POST /api/clients` · `GET/POST /api/clients/[id]/knowledge` ·
`GET/PATCH /api/brand-brief` · `GET/POST /api/memory-cards` ·
`POST /api/research-runs` (idempotent) · `POST /api/content-assets`
(requires explicit angle + approved memory) · `GET /api/usage`.

## Auth

Two paths, one workspace session:

- **Google OAuth** via Supabase Auth and `@supabase/ssr`. The browser is sent
  to `/auth/callback`, where the PKCE code is exchanged, the local workspace
  owner is created/linked, and an HMAC session cookie is issued.
- **Email + password** remains for local development and existing beta owners
  (scrypt hash, same HMAC session). Google-only accounts store no password.

Edge-safe middleware guards every app and export route. Export endpoints:
`/api/export/draft/[id]` (.md), `/api/export/brief/[runId]` (.md pack),
`/api/export/workspace` (JSON, password hash redacted).

### Supabase + Google setup

1. **Google Cloud Console → Credentials → OAuth client (Web application)**
   - Authorized JavaScript origin: `https://curro.in`
   - Authorized redirect URI: `https://lynansdsuxvxkuhakjch.supabase.co/auth/v1/callback`
2. **Supabase Dashboard → Authentication → Providers → Google**: enable it and
   paste the Google Client ID + Client Secret.
3. **Supabase Dashboard → Authentication → URL Configuration**
   - Site URL: `https://curro.in`
   - Redirect URLs:
     - `https://curro.in/auth/callback`
     - `https://www.curro.in/auth/callback`
     - `http://localhost:3001/auth/callback`
     - `http://localhost:3000/auth/callback`
4. **Environment**: `NEXT_PUBLIC_SITE_URL=https://curro.in`,
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
5. First Google login creates the workspace owner. Later logins must use the
   same email; a different Google account is rejected until multi-user
   workspaces land.

Only one owner per beta workspace is allowed by design.

## Data

Local JSON store in `data/curro.json` (single beta workspace `ws_curro_beta`)
powers the app today. The production schema is migrated and verified:

```bash
npm run db:migrate     # apply pending supabase/migrations/* (idempotent)
npm run db:verify-rls  # 10/10: tables, RLS, cross-workspace denial
```

`supabase/migrations/20261017000000_curro_core.sql` creates all 13 tenant
tables (workspaces, members, brand briefs, memory cards, research runs,
sources, signals, angles, content assets + versions, claim ledger, usage,
audit) with FK cascades, idempotency uniques, ranking indexes, and 19 RLS
policies. Append-only ledgers (versions, claims, usage, audit) expose
SELECT+INSERT only — rewrites affect 0 rows. Every tenant table is
workspace-keyed; RLS is defence-in-depth on top of server membership checks.

## Beta rails

Caps: 8 briefs / 24 drafts · $5/day · $25/mo · ~$0.15/run. `published` state
transition is hard-blocked in `lib/generation.ts`.
