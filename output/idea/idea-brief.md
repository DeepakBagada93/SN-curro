# Idea Brief — Agency Knowledge OS

**Product:** ContentOS — a client-aware AI content operating system for SEO and
marketing agencies.
**Date:** 21 October 2026
**Status:** Direction update. The original Founder Signal Brief (Section 8) is
now the wedge module inside a larger multi-client product.

---

## 1. The shift

The first version of this idea was a single-customer product: a Founder Signal
Brief that turned cited market signals into one defensible LinkedIn point of
view. The research below still holds, but the buyer is different.

Agencies do not have a "blank page" problem. They have a **context problem**.

Every month an agency re-learns the same client: what the brand stands for, which
claims are approved, what the SEO team found, which tone the client rejected last
quarter, and which posts already performed. That context lives in Drive folders,
Slack threads, old briefs, and one account manager's memory. When that person
leaves, the knowledge leaves with them.

**Core thesis:** the persistent, client-specific knowledge layer is the product.
Content planning, generation, images and publishing are workflows that consume
that knowledge. Competitors sell writing tools; ContentOS sells **client memory
with an execution layer on top**.

> Positioning: For SEO and marketing agencies managing multiple clients,
> ContentOS remembers each client's approved facts, research, voice, strategy and
> past work — then uses that context to plan, create and schedule content.
> Unlike generic AI writers and social schedulers, the client's knowledge is
> stored once, approved by a human, and reused across every deliverable.

---

## 2. Demand signals and limitations

The automated Reddit/Google Trends collection could not retrieve sources in this
environment. It is therefore not used as evidence. The next research step is ten
recorded agency interviews using the workflow questions in `validation.md`.

The available desk evidence shows a mature adjacent-tool category rather than a
blank market:

- [Taplio](https://taplio.com/pricing) starts at $39/month and sells LinkedIn
  writing, scheduling, analytics, and AI-assisted growth.
- [AuthoredUp](https://authoredup.com/pricing) charges $19.95/month for an
  individual LinkedIn workflow with drafts, snippets, and analytics.
- [Copy.ai](https://www.copy.ai/prices?content_language=English) offers
  multi-model writing/workflow access from $29/month.

**Conclusion:** demand exists for content workflow software, but a generic AI
writer/scheduler is a crowded category. The defensible wedge is not generation —
it is **approved client context reused across every deliverable**.

### Agency-specific pain (to validate in interviews)

1. Onboarding a new client takes 2–4 weeks of re-reading documents.
2. Two account managers write the same client in two different voices.
3. The client re-approves the same brand facts every month.
4. SEO research and social content are planned in separate tools.
5. Scheduling is reliable until it isn't — failed posts are found manually.
6. AI output is rejected because it lacks the client's approved claims.

---

## 3. Competitor teardown

| Competitor | Strength | Published starting price | Gap for ContentOS |
|---|---|---:|---|
| Taplio | LinkedIn-native creation, scheduling, analytics, and engagement workflow | $39/month | Single-person LinkedIn tooling; no client knowledge layer or multi-brand workspace. |
| AuthoredUp | Strong LinkedIn editing, formatting, draft workflow, and analytics | $19.95/month | No client context store, no monthly planning, no SEO workflow. |
| Copy.ai | Broad multi-model writing and workflow product | $29/month | Broad but context-thin: brand voice is a prompt, not an approved, versioned client memory. |
| Jasper | Brand voice + marketing workflows | Enterprise pricing | Heavy, expensive, campaign-centric; weak on per-client SEO research and social scheduling. |
| Google Docs + Notion + Buffer | The real incumbent: stitched tools | $0–$100/month | No shared memory, no claim checks, no single asset graph. |

**The real competitor is the stitched stack.** Agencies already pay for docs,
schedulers, and AI chat. ContentOS must replace context switching, not merely add
another tab.

---

## 4. Pricing and cost evidence

Parallel documents its Search API at $0.004–$0.009 per request and OpenRouter
charges model-dependent token prices. Both make a capped research brief
technically viable, but neither proves commercial margin until the chosen model,
brief frequency, and support load are measured.

Sources: [Parallel](https://docs.parallel.ai/introduction),
[OpenRouter](https://openrouter.ai/pricing).

Image generation is the cost risk: per-image pricing at agency volume can exceed
text costs by an order of magnitude. Mitigations are mandatory:

- per-client monthly generation caps;
- cheaper image models by default, premium on demand;
- upload-your-own-visual path that costs nothing;
- usage ledger per client, visible to the agency owner.

### Proposed pricing

| Plan | Price | Includes |
|---|---:|---|
| Solo | $39/mo | 1 client, knowledge brain, planner, studio, 30 generations/mo |
| Studio | $99/mo | 5 clients, 150 generations/mo, approvals, 2 seats, scheduling |
| Agency | $249/mo | 20 clients, 600 generations/mo, 10 seats, integrations, priority support |
| Enterprise | Custom | SSO, custom limits, dedicated onboarding, MCP/API |

Pricing must be validated with 10 agencies before billing is built. Usage-based
overage is preferable to silently throttling a client deadline.

---

## 5. Product angles considered

| # | Angle | Buyer | Effort | Reachability | Score |
|---|---|---|---|---|---:|
| 1 | Generic AI content employee | Any creator/team | High | Low | 3/10 |
| 2 | LinkedIn scheduler plus AI writer | LinkedIn creators | Medium | Medium | 4/10 |
| 3 | **Multi-client agency knowledge OS** | SEO/marketing agencies | High | Medium | **8/10** |
| 4 | Founder Signal Brief: cited market signals to owned points of view | B2B SaaS founders | Medium | Medium | 8/10 |
| 5 | Compliance-oriented claim checker for marketing teams | Regulated marketing teams | High | Low | 5/10 |

### Winner

**Multi-client agency knowledge OS**, with the Founder Signal Brief retained as
the "signal" module inside the planner. It has a recurring monthly job (plan →
create → approve → publish → learn), a clear buyer (agency owner / account
director), and a durable moat (client knowledge and approval history).

The creative mechanism that differentiates it: every generated asset cites the
knowledge items and claims it used, and cannot be scheduled until a human
approves both the text and its claim status.

---

## 6. Information architecture

Five primary surfaces, plus settings:

1. **Knowledge Brain** — the core. Client websites, brand facts, source
   documents, SEO research, writing guidelines, audience notes, past approved
   content. Every item is versioned, human-approved, and attributable.
2. **Content Planner** — monthly strategies, content pillars, campaigns,
   publishing dates, and task assignment per client.
3. **AI Content Studio** — SEO articles, LinkedIn posts, X threads, FAQs,
   captions, and repurposed variants generated from approved knowledge.
4. **AI Image Studio** — branded social graphics and campaign creative generated
   from saved colors, type and imagery guidelines; upload path always available.
5. **Publishing Calendar** — connect X and LinkedIn, review drafts, schedule with
   timezone awareness, monitor failures, and track published content.
6. **Integrations** — MCP, REST API, and external AI tools (Claude, Codex).

Cross-cutting: **Clients** (brand switcher), **Approvals**, **Usage & costs**,
**Audit history**.

---

## 7. End-to-end example

An agency manages a university's SEO and social media accounts.

- **Plan:** Generate a 30-day content calendar from the client's SEO priorities,
  admissions dates, and brand guidelines.
- **Create:** Generate a LinkedIn thought-leadership post and a shorter X version
  from the same approved source material.
- **Design:** Generate a matching visual from the client's colors and image
  guidelines.
- **Review:** The account manager edits text and image, checks factual claims,
  and sends the draft for client approval.
- **Schedule:** Pick a date and time per platform, preview the final content, and
  schedule it through the connected publishing API.
- **Learn:** Store the approved content and available performance data to inform
  future planning — without automatically treating engagement as proof that every
  claim or strategy is correct.

This workflow connects every feature around one central asset: the client's
knowledge. It also gives the agency a reason to return every month.

---

## 8. Original wedge — Founder Signal Brief (retained)

**Signal → Evidence → Founder angle → Claim check → Draft → Approval.**

Closed-beta web app already built in this repository. Up to 3 cited signals per
manual run, Tension Map + founder angle, LinkedIn draft with Claim Ledger,
approve/copy only — no auto-publishing. Caps: 8 briefs / 24 drafts · $5/day ·
$25/mo · ~$0.15/run.

Its mechanisms are promoted into the agency product:

| Founder Brief mechanism | Agency OS role |
|---|---|
| Signal Cards + sources | Knowledge Brain `seo_research` and `source_document` items |
| Tension Map + founder angle | Planner's angle field and content pillars |
| Claim Ledger | Per-asset claim review before approval |
| Manual approval | Agency + client approval states on every asset |
| No auto-publishing | Publishing only after explicit approval |

The founder brief remains a demo-able wedge and a trust story for agencies, but
it is no longer the business.

---

## 9. Data model (minimum viable)

All rows are workspace-scoped and, except workspace/member tables, client-scoped.

- `clients` — name, slug, industry, website, contacts, timezone, brand color,
  status, strategy summary.
- `knowledge_items` — client, kind (`brand_fact`, `website`, `source_document`,
  `seo_research`, `writing_guideline`, `audience`, `past_content`), title, body,
  source URL, tags, status (`candidate` / `approved` / `archived`), provenance,
  approved by/at.
- `content_plans` — client, month, objective, status.
- `plan_items` — plan, channel, title, pillar, publish date, owner, status
  (`idea` → `scheduled` → `published`).
- `assets` + `asset_versions` — text or image, platform, claim references,
  approval state.
- `claim_entries` — factual / opinion / unsupported, linked knowledge items.
- `connected_accounts` — client, channel, OAuth status, scopes, token metadata.
- `scheduled_posts` — client, channel, asset version, scheduled time, timezone,
  status, external ID, failure reason.
- `usage_events` — per client, provider, units, estimated cost.
- `audit_events` — append-only.

Hard rules: client knowledge is never deleted silently; it is archived. Append-only
ledgers (versions, claims, usage, audit) reject rewrites.

---

## 10. Implementation challenges

### X and LinkedIn publishing
Use official APIs and authorization flows. Check current access tiers, scopes,
media-upload requirements, rate limits, and commercial terms **before** committing
the publishing roadmap. Do not scrape or automate browser sessions.

### Image generation
Costs can be significant at scale. Enforce per-client caps, default to cheaper
models, expose usage, and always offer upload-your-own as a free path.

### Scheduling reliability
Use a durable background job queue (not a serverless timeout), timezone-aware
schedules, idempotency keys, retry with backoff, and a publishing status log.
Users must see `scheduled → publishing → published | failed` with a reason.

### Approvals
Generated content stays in `draft` until a user or authorized client approves it.
Approval must be explicit per asset and per claim status. No silent publishing.

### Analytics
Add deeper analytics only after publishing works reliably. Engagement is a
signal, not proof of correctness — never auto-promote a claim because a post
performed well.

---

## 11. Honest market-sizing position

No credible TAM/SAM/SOM number is included. A top-down count of "all agencies"
would be false precision. The first practical SAM is the set of SEO/marketing
agencies reachable through the founder's network, communities, and targeted
outreach. Measure response, willingness to migrate a real client, and payment
intent in the first ten interviews before adding a numeric market claim.

---

## 12. Risks and non-goals

**Risks**
- Publishing API access is the largest schedule risk; design the calendar to be
  useful in "export/copy" mode if access is delayed.
- "Another AI writer" perception; lead with the knowledge brain, not generation.
- Client data sensitivity; agencies will ask about isolation, retention, deletion,
  and who can approve.
- Trust: one hallucinated fact can lose the account. Claims must cite knowledge.

**Non-goals for now**
- Auto-publishing without approval.
- Becoming a full CRM or project-management suite.
- Performance analytics before reliable publishing.
- Generic consumer creator tooling.

---

## 13. Next research step

Ten recorded agency interviews (account director + content lead at SEO/social
agencies, 3+ clients each). Ask them to walk through one real monthly cycle and
one failed approval. Success: 6+ describe re-learning client context as a real
cost, and 3+ will migrate one live client into a prototype.
