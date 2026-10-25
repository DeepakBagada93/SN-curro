# Curro / ContentOS — Production Agency Knowledge OS Build Roadmap

> **Status:** Active Execution Roadmap — Phase 1 through 9 Deployed & Verified  
> **Source of Truth:** `output/idea/idea-brief.md` · Multi-Client Agency Knowledge Operating System  
> **Architecture:** Next.js 14 App Router · TypeScript · Tailwind CSS · OpenRouter Real AI Engine · Append-Only Audited State Store

---

## 🎯 Executive Goal
Transform Curro into an **awesome, high-value, production-ready, and user-friendly Agency Knowledge OS**. 
Eliminate synthetic mock/demo seeds, connect the live OpenRouter AI inference pipeline, enable real knowledge ingestion from client URLs, and empower marketing and SEO agencies to manage all client knowledge, month planning, claim-verified content generation, image asset branding, publishing schedules, and client approval links in one frictionless dashboard.

---

## Phase 1: Clean Slate & Production Data Engine
- [x] **1.1 Mock Data & Seed Purge**
  - Removed hardcoded demo client (`cl_northfield`), fake research runs, and synthetic mock memory cards from `lib/store.ts`.
  - Cleaned up `data/curro.json` to start with a fresh, pristine workspace state.
  - Implemented zero-data empty states with welcoming, high-converting onboarding prompts ("Add your first client").
- [x] **1.2 Real Multi-Client Data Store Architecture**
  - Validated and enforced multi-client relational integrity (`clients`, `knowledgeItems`, `plans`, `planItems`, `assets`, `versions`, `claims`, `posts`, `images`, `usage`).
  - Workspace and client-level CRUD actions with timestamped audit trails and safe deletion/archive flags.
  - Import/export tooling (full workspace backup & restore in JSON at `/api/export/workspace`).

---

## Phase 2: Knowledge Brain (`/clients` & `/clients/[id]`)
- [x] **2.1 Agency Clients Management**
  - Create / Edit / Archive agency clients with custom branding (hex brand color, company avatar, industry, primary domain).
  - Client profile cards displaying real-time metrics: approved knowledge facts, review candidates, planned assets, and brand tone.
  - Fast search, status filters (`active`, `onboarding`, `archived`), and industry sorting.
- [x] **2.2 Deep Knowledge Brain Repository**
  - Support for 6 rich knowledge categories: `brand_fact`, `website`, `source_document`, `seo_research`, `writing_guideline`, `past_content`.
  - Knowledge lifecycle management: Candidate review (`candidate` → `approved` → `archived`).
- [x] **2.3 Instant URL & Web Ingestion**
  - Built-in website metadata and content scraper (`lib/crawler.ts`): Paste any client URL or blog post to auto-extract title, meta description, and key factual sentences directly into candidate knowledge cards.
  - AI extraction via OpenRouter cheap tier or fallback heuristic parser.
  - One-click approval flow for newly extracted facts.

---

## Phase 3: Live AI Inference Engine & Prompt Pipeline
- [x] **3.1 Live OpenRouter Multi-Model Provider**
  - Connected and verified active OpenRouter models (`nvidia/nemotron-3.5-lightning:free` and `nvidia/nemotron-3.5-super-vl:free` with 1,000 free requests/day).
  - Automatic JSON output parsing, repair, and fallback resilience.
  - Real-time token usage accounting (`prompt_tokens`, `completion_tokens`, latency, and cost ledger).
- [x] **3.2 Context-Grounded Prompt Architect**
  - Injects selected client's approved facts, writing guidelines, audience context, and restricted claims into generation prompt.
  - Enforced anti-hallucination guardrail: AI is strictly prohibited from inventing statistics or unsourced customer stories.

---

## Phase 4: AI Content Studio (`/studio`)
- [x] **4.1 Multi-Channel Content Formats**
  - LinkedIn Thought Leadership (hook, whitespace pacing, actionable takeaways, discussion CTA).
  - X / Twitter Multi-Post Thread (curated hook tweet, 5-7 numbered analytical posts, conclusion).
  - SEO Long-Form Article / Pillar Section (H2/H3 structure, keyword integration, FAQ section).
  - Email Newsletter Dispatch (subject line variants, preview text, curated body, subscriber CTA).
  - Short-Form Video / Reel Script (0-3s visual hook, scene directions, narration, on-screen text).
- [x] **4.2 Real-Time Claim Ledger & Fact Verification**
  - Automated statement extractor: maps every factual assertion in the generated draft to a cited Knowledge Item ID.
  - Visual claim tags: `[Verified Fact]`, `[Founder Opinion]`, `[Needs Source / Unsupported]`.
  - Safety gate: drafts containing unsupported claims highlight in warning red and prompt the agency user to either edit or verify before client approval.
- [x] **4.3 Live Content Editor & Version Control**
  - Side-by-side split screen: Interactive draft editor on the left, interactive Claim Ledger & Knowledge Sources on the right.
  - Version history snapshots (`v1`, `v2`, `v3`) with rollback capability.
  - 1-click clipboard copy (`CopyButton`) with formatted text preview.

---

## Phase 5: Monthly Content Planner (`/planner`)
- [x] **5.1 30-Day Strategy & Editorial Calendar**
  - Visual monthly calendar grid and categorized list view.
  - Filter by Client, Channel, and Delivery Status (`idea`, `drafting`, `review`, `scheduled`, `published`).
  - Drag-and-drop or fast date rescheduling with timezone support.
- [x] **5.2 Content Pillar & Campaign Mapping**
  - Map every piece of content to an agency strategy pillar (e.g. "Product Authority", "Founder Story", "Industry Breakdown", "Customer Win").
  - "Generate in Studio" shortcut: click any planned item to jump directly into Studio with pre-filled client knowledge and channel format.

---

## Phase 6: AI Image Studio & Visual Creative (`/images`)
- [x] **6.1 Client Brand Kit & Palette Integration**
  - Auto-bind image generator prompts to client's approved brand colors and styling aesthetics.
  - Preset aspect ratios: `1:1` (LinkedIn/Instagram feed), `16:9` (Twitter/Blog banner), `9:16` (Reels/Stories).
- [x] **6.2 Creative Visual Prompter & Alt-Text Enforcement**
  - Generates high-converting branded SVG social media visuals with custom typography and palettes.
  - Automated SEO & accessibility Alt-Text generation for every visual asset before scheduling.

---

## Phase 7: Publishing Calendar & Dispatch Hub (`/calendar`)
- [x] **7.1 Comprehensive Dispatch Hub**
  - Schedule posts across LinkedIn, X, and SEO blogs with minute-level precision and timezone calculation.
  - Real-time calendar grid with status badges.
- [x] **7.2 Post Lifecycle & Dispatch Log**
  - Track post states: `Scheduled` → `Ready to Dispatch` → `Published` / `Failed`.
  - Manual 1-click dispatch mode ("Publish Now") + quick clipboard copy with platform formatting.
  - Error diagnostics and retry actions for failed dispatches.

---

## Phase 8: Client Review Portal (`/review/[token]`)
- [x] **8.1 Frictionless Client Review Links**
  - Secure, tokenized review URLs for agency clients (zero login/account required for clients).
  - Client interface displaying the draft, social platform preview, and cited facts.
  - One-click client actions: "Approve Content", "Copy text", or "Request Edits" with revision feedback notes.

---

## Phase 9: Settings, Analytics & Production Hardening
- [x] **9.1 Token Usage & Cost Analytics (`/analytics`, `/settings/usage`)**
  - Live charts of generations, token consumption, and cost estimates per client.
  - Client budget caps to prevent accidental overages.
- [x] **9.2 Model & API Integrations (`/integrations`, `/settings`)**
  - Real-time OpenRouter model switcher (toggle between Lightning/Flash and Deep reasoning).
  - Local MCP Server endpoint (`/api/mcp`) documentation and API key generation.
- [x] **9.3 Quality, Responsiveness & Verification**
  - Comprehensive TypeScript typing check (`tsc --noEmit`) clean with zero errors.
  - Unit test suite (`vitest run`) 25/25 tests passing in <400ms.
