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
- [x] **2.4 Client Knowledge Edit & Update Lifecycle**
  - Interactive Edit Modal (`KnowledgeBrainManager`): In-place editing of title, content body, kind, source URL, tags, provenance, and status.
  - Character validation (title ≥ 3 chars, body ≥ 10 chars) with live optimistic UI reflection.
  - Server action `updateKnowledgeAction` with timestamped `knowledge.updated` audit logging.
- [x] **2.5 Permanent Fact Deletion & Clean-up**
  - Two-step safety confirmation (`Delete? Yes / No`) preventing accidental removals.
  - Instant optimistic UI removal with rollback resilience if server rejects.
  - Server action `deleteKnowledgeAction` with `knowledge.deleted` audit logging.
- [x] **2.6 Instant Zero-Latency Search & Bulk Approvals**
  - Instant client-side search across title, content body, tags, and provenance with real-time matching.
  - Fast status filter tabs (`All`, `Approved`, `Awaiting Review`, `Archived`) with live count badges.
  - One-click bulk action `✓ Approve All Candidates (N)` for rapid review of crawled facts.

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
  - Unit test suite (`vitest run`) 27/27 tests passing in <400ms.

---

## Phase 10: User Dashboard Audit & AI Task Verification
- [x] **10.1 User Dashboard Knowledge Fact Management**
  - Audited client knowledge brain on `/clients/[id]`.
  - Implemented missing Edit, Update, and Delete operations with validation schemas.
  - Replaced slow server GET roundtrips with instant client-side filtering and optimistic updates.
  - Added visual progress feedback (`Approving…`, `Archiving…`, `Restoring…`, `Saving…`, `Deleting…`).
- [x] **10.2 AI Ingestion Crawler Verification**
  - Repaired OpenRouter JSON extraction to support array payloads, markdown fences, and entity decoding.
  - Added URL auto-normalization (`https://` prefix) and robust network error reporting.
  - Verified live fact extraction on production targets (`https://saasnext.in/`).
- [x] **10.3 AI Studio & Claim Ledger Verification**
  - Verified OpenRouter prompt structure, multi-format drafting (LinkedIn, Reel scripts, X threads, Articles).
  - Added animated progress loaders (`SubmitButton`) to Studio draft generation, draft approval, and calendar creation.
  - Verified Claim Ledger citations (`[factual]`, `[opinion]`, `[unsupported]`) with automatic unsupported outcome warnings.
- [x] **10.4 30-Day Planner & Brief AI Tasks**
  - Verified deterministic draft builder from approved client knowledge only.
  - Verified parallel search / manual brief retrieval with progress feedback.

---

## Phase 11: Claude-Style Chatbot & Artifacts UI/UX Redesign
- [x] **11.1 Design Tokens & Claude Editorial Theme**
  - Defined warm, calm Claude-inspired palette (`#FBFBFA` parchment backgrounds, refined borders, Fraunces serif headings, warm terracotta accent).
  - Modernized global styles with `.claude-card`, `.claude-sidebar`, `.claude-bubble-user`, `.claude-bubble-assistant`, `.claude-artifact-panel`.
- [x] **11.2 Claude-Style Collapsible Sidebar & Shell (`components/chrome.tsx`)**
  - Replaced cluttered static sidebar with Claude-inspired collapsible rail (expanded 264px / collapsed 68px with smooth state persistence in `localStorage`).
  - Added top `+ New Draft` action button and Client Brain switcher with brand color indicators.
  - Added recent drafts session history grouped chronologically with direct links.
  - Streamlined primary workspace nav (`Studio`, `Client Brain`, `Planner`, `Calendar`, `Images`, `Analytics`).
- [x] **11.3 Claude Central Command Hub (`/studio` & `components/claude-studio-hub.tsx`)**
  - Implemented Claude-style centered greeting (*"What shall we draft for {client.name} today?"*).
  - Added approved client facts counter pill and anti-fluff shield badge.
  - Added 4 high-CTR starter prompt cards (LinkedIn Contrarian, X Thread, Kinetic Reel Script, SEO Article).
  - Added auto-resizing conversational prompt card with format picker and knowledge source selector modal.
- [x] **11.4 Two-Pane Interactive Chat + Artifacts Workspace (`components/claude-artifact-workspace.tsx` & `/studio/[id]`)**
  - **Left Pane (Conversational Thought Partner)**: Multi-turn dialogue between user and Curro AI with thinking status indicators, quick refinement pills (*Punchier Hook*, *Executive Tone*, *Cut 30%*).
  - **Right Pane (Live Interactive Artifact Panel)**: Clean tabbed artifact viewer (`Draft Content`, `Claim Ledger`, `Social Preview`, `Edit Body`).
  - Traceable Claim Ledger badges (✓ Factual, ⚠ Opinion, ✕ Unsupported) with in-place claim removal.
  - Action footer: 1-click Copy, Share Review Link, Approve Draft, and direct Calendar scheduling.
- [x] **11.5 Conversational Intent Router & Agent Action Pipeline**
  - Wired prompt input directly to `createStudioAsset` with approved client facts.
  - Connected draft refinement and version saving.
- [x] **11.6 Polish, Responsive Layout & Build Verification**
  - Tested mobile navigation with drawer menu.
  - Verified TypeScript compilation (`npx tsc --noEmit`) clean with zero errors.
  - Verified full test suite (`vitest run`): 34/34 tests passing in 358ms.
  - Verified production build (`next build`): 34/34 routes statically and dynamically optimized.

---

## Phase 12: Cashfree Payment Gateway Compliance & Legal Policy Suite
- [x] **12.1 Contact Us Page (`/contact` & `components/contact-form.tsx`)**
  - Registered Legal & Operating Address (Moti Palace Compound, Junagadh, Gujarat 362001, India).
  - Official Support Email (`support@curro.in`), Helpline (`+91 94092 11982`), and operational hours (Mon-Fri 9:00 AM - 6:00 PM IST).
  - Interactive support inquiry form with confirmation handling.
- [x] **12.2 Terms & Conditions Page (`/terms`)**
  - Complete SaaS customer agreement, eligibility, acceptable use, and client data ownership.
  - Explicit Indian Rupee (INR - ₹) billing terms and 18% GST invoice generation with ITC.
  - Designates Cashfree Payments India Private Limited as authorized payment gateway partner.
  - Governing law: Indian Law, Jurisdiction: Courts in Junagadh, Gujarat, India.
- [x] **12.3 Refunds & Cancellations Policy (`/refunds`)**
  - Self-serve cancellation instructions directly via Settings.
  - 7-Day Money-Back Guarantee for first-time subscriptions.
  - Explicit refund processing timeline (5 to 7 business days credited back to original payment source via Cashfree).
- [x] **12.4 Privacy Policy (`/privacy`)**
  - Client data isolation guarantees (zero data training on client facts).
  - PCI-DSS Level 1 tokenized billing compliance via Cashfree Payments.
  - Grievance Officer details under Indian Information Technology Act.
- [x] **12.5 Products, Services & INR Pricing Compliance (`/pricing` & `components/chrome.tsx`)**
  - Full product catalog with explicit INR pricing (₹999 Solo, ₹2,999 Studio, ₹6,999 Agency, ₹19,999 Enterprise).
  - Prominent Cashfree trust badge detailing accepted modes: UPI (GPay/PhonePe/Paytm), RuPay, Visa, Mastercard, NetBanking.
  - Instant digital software delivery terms.
  - Universal footer navigation links to all compliance policies across marketing and app views.
- [x] **12.6 Cashfree Live Production Payment Gateway Engine (`lib/cashfree.ts` & APIs)**
  - Configured live production credentials in `.env.local` (`CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_BASE_URL`).
  - Implemented `createCashfreeSubscriptionOrder` and `fetchCashfreeOrder` with live Cashfree API verification (`cf_order_id: 7268563822` test verified).
  - Implemented secure API routes `/api/cashfree/create-order` and `/api/cashfree/verify`.
  - Built interactive checkout component (`components/cashfree-checkout-button.tsx`) leveraging official Cashfree Web JS SDK v3.
  - Integrated Cashfree checkout directly on `/settings/plan` and `/pricing` with automatic paid order verification and instant workspace plan activation.

---

## Phase 13: Prompt-Driven Agentic Knowledge OS & Dynamic Artifact Canvas
- [x] **13.1 Autonomous Agent Engine (`lib/agent-engine.ts`)**
  - Implemented universal intent classification & prompt dispatcher (`classifyAgentIntent`, `executeAgentPrompt`):
    - `BUILD_BRAIN`: Ingest URL/text, extract structured facts with OpenRouter, persist to DB as candidate facts.
    - `MANAGE_BRAIN`: Search facts, filter approved/candidate/archived, update fact body, bulk approve.
    - `BRAINSTORM`: Generate contrarian angles, audience tension maps, kinetic hooks, and claim anchors.
    - `AUDIT_CONTENT`: Audit any user draft or pasted text against client's approved facts & restricted claims (0-100% score).
    - `DRAFT_CONTENT`: Author verified posts (LinkedIn, X threads, Reels, SEO articles) grounded in knowledge facts.
    - `PLAN_CONTENT`: Generate strategic multi-channel publishing schedule based on approved facts.
- [x] **13.2 Dynamic Multi-Modal Artifact Canvas (`components/dynamic-artifact-canvas.tsx`)**
  - Right-pane adaptive artifact container with 5 dedicated interactive tool modes:
    - `BrainCanvas`: Interactive knowledge cards with status tabs (`Approved`, `Candidates`, `Archived`), 1-click Approve, and Delete.
    - `BrainstormCanvas`: Tension maps, angle matrix, kinetic hooks, and 1-click "Draft from this angle" actions.
    - `AuditCanvas`: Visual claim verification score radar, sentence-level citation highlights (✓ Fact, ⚠ Stance, ✕ Hallucination), and violations alert.
    - `DraftCanvas`: Live draft reader, LinkedIn/X preview, claim ledger tabs, and 1-click copy/schedule.
    - `PlanCanvas`: Interactive 7-day/30-day publishing calendar with minute-level scheduling.
- [x] **13.3 Agent Conversational Thought Partner (`components/agent-chat-pane.tsx`)**
  - Claude-style conversation stream with user badges and Curro Agent messages.
  - Collapsible agent thinking & reasoning states ("Reading approved facts...", "Crawling target URL...", "Verifying claim citations...").
  - Contextual quick-starter chips for Ingesting URLs, Brainstorming Angles, Auditing Drafts, and Planning Roadmaps.
  - Auto-resizing command bar with model selector, knowledge count indicator, format picker, and keyboard submission (`Enter` / `Shift+Enter`).
- [x] **13.4 Unified Dashboard Workspace Overhaul (`components/prompt-agent-workspace.tsx` & `app/studio/page.tsx`)**
  - Transformed Curro's core studio into the unified Prompt-Driven Agentic Operating System.
  - Real-time client switching, dynamic mode switcher pill, and zero-latency state updates.
- [x] **13.5 Test Suite & Production Hardening**
  - Added unit tests for agent intent classification across all 5 capabilities in `tests/unit.test.ts`.
  - Verified TypeScript compilation (`npx tsc --noEmit`) with zero errors.
  - Verified full test suite (`npm test`): 37/37 tests passing in 429ms.
  - Verified production build (`next build`): 38/38 routes statically and dynamically optimized.


