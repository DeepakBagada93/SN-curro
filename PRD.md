# ContentOS — Product Requirements Document

**Version:** 1.0  
**Status:** Research-backed, pre-build specification  
**Last updated:** 16 October 2026  
**Product:** ContentOS — the Point-of-View Engine for B2B founders

## 1. Product decision

ContentOS is **not** an AI social-media scheduler, trend scraper, or generic
writing assistant. It helps a B2B SaaS founder turn credible market signals into
a distinctive, source-backed point of view they can confidently publish.

Its core loop is:

> **Signal → Evidence → Founder angle → Claim check → Draft → Approval**

The first product outcome is a weekly **Founder Signal Brief**: up to three
high-value developments, why they matter to the founder's audience, an
evidence-backed contrarian or useful angle, and a ready-to-edit LinkedIn post.

### Positioning

For English-speaking B2B SaaS founders who know their market but lack the time
to turn it into a consistent public point of view, ContentOS is a
research-to-draft workspace that makes every factual claim traceable. Unlike
post schedulers and generic AI writers, it begins with evidence and asks the
founder to own the opinion before it writes.

## 2. The problem

Founders face an awkward content workflow:

- They see many links but do not know which developments matter to their buyers.
- A generic AI draft can sound polished while saying nothing original.
- Research, source links, opinions, and final posts live in disconnected tools.
- The cost of a wrong claim is higher than the cost of a missed post.
- Consistency fails because each post starts from a blank page.

Existing products validate demand for writing, scheduling, analytics, and
LinkedIn workflow management. Taplio begins at $39/month and bundles writing,
scheduling, and analytics; AuthoredUp focuses on LinkedIn drafting and workflow
at $19.95/month; Copy.ai's self-serve plan starts at $29/month. These are
pricing anchors, not proof that a new generic writer should be built.

Sources: [Taplio pricing](https://taplio.com/pricing),
[AuthoredUp pricing](https://authoredup.com/pricing),
[Copy.ai pricing](https://www.copy.ai/prices?content_language=English).

## 3. Target customer and non-customer

### Initial customer

A founder or founder-led marketer at an English-speaking B2B SaaS company who:

- sells expertise, a product category, or a technical point of view;
- posts on LinkedIn at least twice a month or intends to;
- can approve factual claims and has an identifiable audience;
- values quality and credibility above high-volume auto-posting.

### Not for the first release

- Influencers whose primary goal is viral entertainment.
- Agencies managing many clients.
- Teams needing a full social calendar, inbox, CRM, or analytics platform.
- Autonomous posting, engagement bots, private-data scraping, or trend claims
  that cannot be evidenced.

## 4. The differentiated workflow

### 4.1 Signal Cards

ContentOS retrieves current public sources from founder-configured market
themes. It groups duplicates and produces a small number of Signal Cards, each
with source links, publication/retrieval dates, a concise evidence summary, and
an explanation of relevance to the configured buyer.

### 4.2 Tension Map

For a selected signal, the product exposes the editorial tension rather than
immediately generating copy:

- **What changed?** A source-supported statement.
- **Why does it matter?** The likely buyer or market implication.
- **What is the common take?** A clearly marked interpretation.
- **What could the founder credibly add?** A choice of angles grounded in their
  product, experience, or approved opinions.
- **What must not be claimed?** Missing evidence, restricted topics, and
  unverifiable assertions.

The founder chooses or writes an angle. ContentOS never invents a founder's
experience, customer outcome, or contrarian belief.

### 4.3 Claim Ledger

Every generated draft contains a private Claim Ledger:

- factual claims and their source references;
- founder opinions, explicitly marked as opinion;
- unsupported or ambiguous claims requiring edit/removal;
- source freshness and retrieval timestamp.

The ledger is a review aid, not a truth guarantee. It makes the boundary between
evidence and interpretation visible.

### 4.4 Founder Signal Brief

Once per week (manual in beta; scheduled later), ContentOS assembles:

1. Three ranked signals.
2. One suggested founder angle per signal.
3. One LinkedIn draft after an angle is selected.
4. A claim ledger and source links.
5. A decision: draft, save, dismiss, or archive.

## 5. Goals and success criteria

### Beta goals

- Help a founder reach a useful, evidence-backed draft in under 15 minutes.
- Make sources and unsupported claims understandable during review.
- Produce a weekly workflow users return to without being prompted by a human.
- Establish whether users will pay for research quality and saved editorial time.

### Product metrics

- Time from selected signal to approved draft.
- Signal-to-draft conversion rate.
- Draft approval rate and median edits before approval.
- Weekly returning workspaces.
- Unsupported-claim flags per draft and resolution rate.
- Cost per completed brief and per approved draft.

### Validation guardrail

After 8 weeks of a closed beta, iterate the wedge or stop paid-product work if
fewer than 5 of 15 activated workspaces return for three weekly briefs **or**
fewer than 3 agree to pay for the workflow. This is a validation threshold, not
a forecast.

## 6. MVP scope

### P0 — closed-beta product

- Single-user workspace and email sign-in.
- Brand brief: audience, product, category, expertise, voice examples, claims to
  avoid, topics, competitors, and exclusions.
- Founder-approved Memory Cards for facts, opinions, and voice examples.
- Manual research run over selected themes using a search provider.
- Signal Cards with citations, freshness, duplicate suppression, and a concise
  relevance explanation.
- Tension Map and angle selection/editing.
- LinkedIn text-post draft generation only.
- Claim Ledger with source, opinion, and unsupported-claim states.
- Draft editor, immutable versions, approve/reject/archive, and copy/export.
- Usage caps, cost records, job history, and basic workspace deletion.

### P1 — after beta evidence

- Weekly scheduled brief and email/in-app notification.
- X post/thread adaptation from an approved LinkedIn draft.
- A simple editorial queue and calendar.
- URL/file ingestion with chunked source references.
- Founder feedback that suggests, but never silently changes, a Memory Card.
- Shareable approval links for a collaborator.

### P2 — only after retention is proven

- Argument Map: a visual graph of signals, evidence, opinions, and drafts.
- Blog/newsletter repurposing.
- Platform publishing and analytics integrations.
- Team workspaces, agencies, multi-brand controls, and billing automation.

## 7. Essential user flows

### First-use flow

1. The user signs in and creates a workspace.
2. They complete a concise Brand Brief and add 3–10 approved voice examples or
   facts.
3. They define 3–5 market themes and exclusions.
4. They run the first brief manually.
5. They save, dismiss, or open a Signal Card.

### Signal-to-draft flow

1. The user opens a Signal Card and sees citations, timestamps, relevance, and
   confidence limits.
2. They inspect the Tension Map and select/edit an angle.
3. They generate a LinkedIn draft.
4. They inspect the Claim Ledger and resolve flagged language.
5. They edit, approve, copy, or archive the final draft.

### Research-run flow

1. The server validates workspace budget and topic settings.
2. A durable job retrieves results, normalizes URLs, removes duplicates, and
   scores candidates.
3. It stores sources and Signal Cards with provenance.
4. The UI shows partial success or safe failure details; it never fabricates
   results when a provider fails.

## 8. Functional requirements

### Brand Brief and Memory Cards

- Keep confirmed facts, founder opinions, and extracted suggestions separate.
- Each Memory Card must have provenance, status, timestamps, and deletion.
- Only user-confirmed facts and opinions may be used as authoritative context.
- The user can prohibit claims, topics, competitors, and vocabulary.

### Research and Signal Cards

- Store title, canonical URL, publisher where available, published/retrieved
  timestamps, excerpt, query/run reference, and content hash.
- Explain a signal score using relevance, freshness, novelty, brand fit, and
  evidence quality. The score is a prioritization aid, never a virality score.
- Suppress duplicate URLs and recently dismissed themes.
- Label a source-derived finding as a research signal, not a platform trend,
  unless the product has authorised direct platform data.

### Generation and Claim Ledger

- Use only selected sources and relevant approved memory in generation context.
- Generate a structured draft with claim references and warning states.
- Require an explicit founder angle before generation.
- Preserve prompt template, model, source IDs, generation cost, and version.
- Never automatically publish, assert endorsement by a source, or make a
  quantitative claim without evidence.

### Security and trust

- Enforce tenant access on every server-side operation.
- Treat fetched pages and user files as untrusted data, never as instructions.
- Keep API secrets server-side; rate-limit expensive operations.
- Provide deletion for data and disclose retention of files, source snippets,
  embeddings, and logs.
- Require explicit approval for any future external action.

## 9. Commercial hypothesis

Test $29–$49/month for one founder workspace after a free, capped beta. The
price is intentionally between a generic writing subscription and specialised
LinkedIn workflow products, but it is only a test. The beta must enforce a fixed
number of briefs and draft generations until actual provider cost and weekly
value are measured.

## 10. Explicit non-goals

- No promise of virality, factual perfection, engagement growth, or publishing
  results.
- No automated DMs, follows, commenting, or audience scraping.
- No autonomous social posting in MVP.
- No full marketing analytics suite or generic chatbot.

## 11. Release criteria

A closed beta can begin only when a user can complete the P0 flow with private
data isolation, citations, a working Claim Ledger, cost caps, and clear failure
states. A public launch requires evidence from the guardrail above, a written
retention policy, and a validated price/cost model.
