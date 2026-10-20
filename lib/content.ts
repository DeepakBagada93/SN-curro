// Curro marketing copy — single source of truth for site wording.
// Rules: no virality promises, no fabricated testimonials, outcomes, or logos.
// Product claims must map to something that actually ships in this repo.

export const PITCH =
  "The knowledge operating system for agencies producing LinkedIn posts, X threads, reel scripts and SEO articles they have to defend.";

export const LOOP = [
  {
    n: "01",
    title: "Build the client brain",
    body: "Brand facts, source documents, SEO research, audience notes and writing rules live in one approved knowledge base per client — with provenance on every item."
  },
  {
    n: "02",
    title: "Plan the month",
    body: "Turn approved knowledge into a dated calendar of channels and pillars. Every slot can be edited by hand or sent straight to the studio."
  },
  {
    n: "03",
    title: "Draft in the studio",
    body: "LinkedIn posts, X threads, reel scripts and SEO articles come first. Newsletters, FAQs and captions reuse the same approved knowledge. No format starts from a blank prompt."
  },
  {
    n: "04",
    title: "Check every claim",
    body: "Each draft carries a ledger: facts tied to a knowledge source, opinions labelled as opinions, and unsupported lines that block approval until they are fixed."
  },
  {
    n: "05",
    title: "Get both approvals",
    body: "Your team edits and approves, then a no-seat client review link lets the client approve or request changes. Nothing moves forward on one signature."
  },
  {
    n: "06",
    title: "Publish and learn",
    body: "Schedule to connected channels, watch scheduled → publishing → published or failed, retry failures, then record performance against the plan."
  }
];

export const PROBLEMS = [
  {
    icon: "◌",
    title: "The context lives in someone's head",
    body: "Client facts sit across onboarding calls, old decks, shared drives and one strategist's memory. Every new draft starts by re-learning the account."
  },
  {
    icon: "◇",
    title: "Every draft starts from a blank prompt",
    body: "Generic AI writes fluently about the category, not the client. So your team spends its time correcting fabrications instead of shaping the argument."
  },
  {
    icon: "⬔",
    title: "Approvals live in email threads",
    body: "Three versions, two comment trails and no clear owner. The client approves something in chat and the published copy says something else."
  },
  {
    icon: "⚠",
    title: "One unsupported claim can cost the account",
    body: "Agencies stake their reputation on every sentence. A confident statistic with no source is not a content problem — it is a commercial risk."
  }
];

export const FEATURES = [
  {
    icon: "◈",
    title: "A Knowledge Brain per client",
    body: "Approved facts, source URLs, SEO research, audience notes and writing guidelines. Drafts can only use items your team has explicitly approved."
  },
  {
    icon: "▥",
    title: "A planner that becomes the work",
    body: "Month view per client with channels, pillars, dates and owners. Generate a dated skeleton from approved knowledge, then send any slot into the studio."
  },
  {
    icon: "✎",
    title: "Four primary formats, one brain",
    body: "LinkedIn posts, X threads, reel scripts and SEO articles. Supporting formats — newsletter, FAQ and caption — reuse the same approved material without a re-brief."
  },
  {
    icon: "⬣",
    title: "A claim ledger with teeth",
    body: "Facts must cite a knowledge item. Opinions are labelled. Unsupported lines stay open and block approval until someone removes or rewrites them."
  },
  {
    icon: "◇",
    title: "Client review without seats",
    body: "Send a signed, seven-day link. The client reads the draft, sees the claims, and approves or requests changes — no login, no extra licence."
  },
  {
    icon: "▦",
    title: "A calendar that respects approval",
    body: "Schedule only after your team signs off. Track scheduled, publishing, published and failed states, retry failures, and log performance against the plan."
  }
];

export const PRIMARY_FORMATS = [
  {
    id: "linkedin_post",
    label: "LinkedIn post",
    channel: "LinkedIn",
    shape: "Hook → sourced fact → client POV → next step",
    body: "A post the account lead can defend in the comments. One argument, cited facts, no borrowed founder voice.",
    tag: "Authority"
  },
  {
    id: "x_thread",
    label: "X thread",
    channel: "X",
    shape: "1/ Hook → 3–5 numbered beats → source",
    body: "The same approved knowledge compressed into a thread. Each beat stands alone, each factual beat carries a source.",
    tag: "Distribution"
  },
  {
    id: "reel_script",
    label: "Reel script",
    channel: "Reels / Shorts",
    shape: "0–3s hook → timed beats → VO + on-screen → CTA",
    body: "A 30–45 second vertical script with voiceover, on-screen text and a production note. No unapproved number reaches the shoot.",
    tag: "Attention"
  },
  {
    id: "seo_article",
    label: "SEO article",
    channel: "Blog",
    shape: "Intent-led H1 → what we know → why it matters → next step",
    body: "A long-form section built from approved program facts and SEO research, with source links attached for the editor.",
    tag: "Search"
  }
];

export const ALSO_INCLUDED = [
  "LinkedIn, X, reel script and SEO article formats",
  "Per-client brand colour and voice",
  "Image studio with brand palettes",
  "Alt text required before scheduling",
  "Immutable draft versions",
  "Plan caps on clients, generations and images",
  "MCP tools for your own agents",
  "REST endpoints for clients and knowledge",
  "Full workspace export as JSON"
];

export const SAMPLE_ASSET = {
  client: "Northfield University",
  format: "SEO article section",
  title: "Is a part-time MBA worth it for working professionals?",
  body:
    "The part-time MBA is 36 credits delivered in the evening over 24–30 months, built for people who keep working while they study. That structure is the real decision: the question is not whether the credential is useful, but whether you can sustain the schedule.",
  angle:
    "Evening delivery is the difference between finishing and postponing — lead with the schedule, not the prestige.",
  claims: [
    {
      kind: "factual",
      text: "36 credits, evening delivery, 24–30 months.",
      note: "Northfield program page — approved knowledge",
      status: "cited"
    },
    {
      kind: "opinion",
      text: "Schedule fit matters more than programme prestige for working applicants.",
      note: "Agency interpretation — labelled, not verified",
      status: "labelled"
    },
    {
      kind: "unsupported",
      text: "Graduates earn 40% more within a year.",
      note: "No client source. Approval blocked until removed.",
      status: "blocked"
    }
  ] as Array<{ kind: string; text: string; note: string; status: "cited" | "labelled" | "blocked" }>
};

export const AUDIENCES = [
  {
    tag: "SEO agency",
    title: "Turn research into publishable client work",
    body: "Keep keyword and SERP research next to the client facts it supports. Draft articles and FAQs that your editors can defend in a client call.",
    proof: "SEO article + FAQ formats"
  },
  {
    tag: "Content studio",
    title: "One brain, every channel, fewer re-briefs",
    body: "Write the LinkedIn post, the X thread and the reel script from the same approved material — with one claim ledger across all three.",
    proof: "Four primary formats, shared knowledge"
  },
  {
    tag: "In-house team",
    title: "Institutional memory that survives turnover",
    body: "Approved knowledge outlives the person who wrote it. New team members inherit the account's facts, voice and restrictions on day one.",
    proof: "Provenance on every knowledge item"
  }
];

export const BEFORE_AFTER = [
  { before: "Client facts scattered across calls and drives", after: "One approved knowledge brain per client" },
  { before: "Blank-prompt drafts that invent details", after: "Drafts generated only from approved sources" },
  { before: "Claims checked by memory before sending", after: "Unsupported claims block approval automatically" },
  { before: "Approval buried in email and chat", after: "Agency sign-off plus a signed client review link" },
  { before: "Calendar, copy and analytics in three tools", after: "Plan, draft, approve and schedule in one workspace" }
];

export const COMPARISON = [
  {
    name: "Generic AI writers",
    price: "from $20/mo",
    row: [
      "Start from a blank prompt",
      "No per-client memory",
      "Claims left to the writer",
      "Copy only — no plan or approval"
    ]
  },
  {
    name: "SEO content tools",
    price: "from $99/mo",
    row: [
      "Start from a keyword brief",
      "Research, not client truth",
      "Editorial QA is manual",
      "Articles only"
    ]
  },
  {
    name: "Agency PM + docs",
    price: "from $10/seat",
    row: [
      "Context lives in documents",
      "No generation, no claim check",
      "Approvals in email threads",
      "Calendar disconnected from copy"
    ]
  },
  {
    name: "Curro",
    price: "$39/mo at launch",
    row: [
      "Starts from approved client knowledge",
      "One brain per client, with provenance",
      "Claim ledger blocks unsupported lines",
      "Plan → draft → approve → schedule"
    ],
    highlight: true
  }
];

export const FAQS = [
  {
    q: "Is Curro another AI writer?",
    a: "No. A writer starts from a prompt. Curro starts from a client's approved knowledge: brand facts, source documents, SEO research, audience notes and writing rules. Generation is one step in a longer loop that includes planning, claim review, client approval and scheduling."
  },
  {
    q: "Can our clients review without buying a seat?",
    a: "Yes. Every draft can be shared as a signed review link that expires after seven days. The client sees the copy, the claim ledger and the attached image, then approves or requests changes. No login and no additional licence."
  },
  {
    q: "Will Curro publish without us?",
    a: "No. An asset can only be scheduled after your team approves it. If a client review is required, it must also be approved there. Nothing publishes itself, and there is no engagement automation, DM tooling or scraping of private data."
  },
  {
    q: "What stops the AI from inventing facts?",
    a: "Generation is restricted to approved knowledge items. Factual claims must cite one, or the ledger marks them uncited. Unsupported claims stay open and block approval. It is a review discipline, not a truth guarantee — a human still signs off."
  },
  {
    q: "Which formats can it produce?",
    a: "Four primary formats: LinkedIn posts, X threads, 30–45 second reel scripts and SEO article sections. Newsletters, FAQ blocks and social captions are available as supporting formats. The same approved knowledge feeds all of them, so one research pass supports a month of channel-native work."
  },
  {
    q: "What happens when we hit a plan cap?",
    a: "Generation stops with a clear message and a number. Curro never silently overages or keeps calling a model on your account. Clients, generations and images are all capped per plan."
  },
  {
    q: "Can we bring our existing research and documents?",
    a: "Yes — add them as knowledge items with a title, kind, body and optional source URL. They enter as candidates and only become usable after your team approves them. A pass over old client decks is usually the fastest way to seed a brain."
  },
  {
    q: "Who is Curro not for?",
    a: "Teams that want unapproved volume on autopilot, or solo creators who only need one post a week. Curro is deliberately slower at the start: the value comes from building a client brain that makes every later draft cheaper to produce and easier to defend."
  }
];

export const PRICING_FAQS = [
  {
    q: "Is there a free trial?",
    a: "The beta is free to use while we finish billing. The prices on this page are launch prices, and no card is required today. When billing opens, you will choose a plan before the workspace continues."
  },
  {
    q: "What counts as a generation?",
    a: "One draft created in the studio, including regenerated drafts. Planning a month of slots costs nothing until you turn a slot into a draft. Image generation is counted separately."
  },
  {
    q: "Do client reviewers need a paid seat?",
    a: "No. Review links are intentionally seat-free. You pay for the people doing the work, not for the client who signs it off."
  },
  {
    q: "Can we change plan mid-month?",
    a: "Yes. Caps apply to the plan on the workspace, and usage is measured over a rolling 30-day window. Downgrading never deletes existing clients, knowledge or drafts."
  }
];

export const GUIDE_STEPS = [
  {
    id: "client",
    title: "Add the client",
    body: "Name, industry, audience, tone, timezone and restricted claims. Everything downstream is scoped to this account.",
    href: "/clients"
  },
  {
    id: "knowledge",
    title: "Approve the knowledge",
    body: "Add brand facts, source documents, SEO research and writing guidelines. Only approved items can enter a draft.",
    href: "/clients"
  },
  {
    id: "plan",
    title: "Plan the month",
    body: "Generate a dated skeleton from approved knowledge, then adjust channels, pillars, owners and dates.",
    href: "/planner"
  },
  {
    id: "draft",
    title: "Draft in the studio",
    body: "Choose LinkedIn, X, reel script or SEO article, then pick the sources. Resolve every unsupported claim in the ledger before approval.",
    href: "/studio"
  },
  {
    id: "publish",
    title: "Approve, review, schedule",
    body: "Approve internally, share the client link, attach alt text, then schedule once a channel is connected.",
    href: "/studio"
  }
];
