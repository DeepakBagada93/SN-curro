import { promises as fs } from "fs";
import path from "path";
import { Pool } from "pg";
import type { BrandBrief, MemoryCard, ResearchRun, SourceResult, SignalCard, Angle, ContentAsset, ContentVersion, ClaimEntry, UsageEvent, AuditEvent, Profile, Client, KnowledgeItem, ContentPlan, PlanItem, ConnectedAccount, ScheduledPost, ImageAsset, ApiKey, PerformanceSnapshot, PlanTier } from "./types";
import { DEFAULT_WORKSPACE_ID } from "./types";

export interface DB {
  brandBrief: BrandBrief | null;
  profile: Profile | null; // local-beta owner (replaced by Supabase Auth on cutover)
  memoryCards: MemoryCard[];
  runs: ResearchRun[];
  sources: SourceResult[];
  signals: SignalCard[];
  angles: Angle[];
  assets: ContentAsset[];
  versions: ContentVersion[];
  claims: ClaimEntry[];
  usage: UsageEvent[];
  audit: AuditEvent[];
  // Agency Knowledge OS (Phase 1)
  clients: Client[];
  knowledgeItems: KnowledgeItem[];
  plans: ContentPlan[];
  planItems: PlanItem[];
  accounts: ConnectedAccount[];
  posts: ScheduledPost[];
  images: ImageAsset[];
  // Phases 4-6
  planTier: PlanTier;
  apiKeys: ApiKey[];
  performance: PerformanceSnapshot[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "curro.json");
const STATE_ROW = DEFAULT_WORKSPACE_ID;

let pool: Pool | null = null;

function databaseUrl(): string | null {
  const explicit = process.env.SUPABASE_DB_POOLER_URL ?? process.env.DATABASE_URL;
  if (!explicit) return null;
  let parsed: URL;
  try {
    parsed = new URL(explicit);
  } catch {
    return explicit;
  }
  // Vercel cannot reach Supabase's direct IPv6-only host. Route through the
  // Supavisor pooler when the env still points at db.<ref>.supabase.co.
  if (parsed.hostname.startsWith("db.") && parsed.hostname.endsWith(".supabase.co")) {
    const ref = parsed.hostname.slice(3, -".supabase.co".length);
    const region = process.env.SUPABASE_REGION ?? "ap-southeast-1";
    parsed.hostname = `aws-0-${region}.pooler.supabase.com`;
    parsed.port = "6543";
    parsed.username = `postgres.${ref}`;
  }
  parsed.searchParams.delete("sslmode");
  return parsed.toString();
}

function usePostgres(): boolean {
  return Boolean(databaseUrl()) && (process.env.VERCEL === "1" || process.env.CURRO_STORE === "postgres");
}

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl() ?? undefined,
      ssl: { rejectUnauthorized: false },
      max: 2,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000
    });
  }
  return pool;
}

async function loadPostgresDB(): Promise<DB> {
  const client = getPool();
  const found = await client.query<{ data: Partial<DB> }>("select data from public.workspace_state where id = $1", [STATE_ROW]);
  if (found.rows[0]) return normalizeDB(found.rows[0].data);
  const fresh = seed();
  await client.query(
    "insert into public.workspace_state (id, data) values ($1, $2::jsonb) on conflict (id) do nothing",
    [STATE_ROW, JSON.stringify(fresh)]
  );
  const created = await client.query<{ data: Partial<DB> }>("select data from public.workspace_state where id = $1", [STATE_ROW]);
  return normalizeDB(created.rows[0]?.data ?? fresh);
}

async function savePostgresDB(db: DB): Promise<void> {
  await getPool().query(
    "insert into public.workspace_state (id, data, updated_at) values ($1, $2::jsonb, now()) on conflict (id) do update set data = excluded.data, updated_at = now()",
    [STATE_ROW, JSON.stringify(db)]
  );
}

export function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
export function nowIso(): string {
  return new Date().toISOString();
}

function seed(): DB {
  const t = nowIso();
  const clientId = "cl_northfield";
  const planId = "plan_northfield_2026_11";
  return {
    profile: null,
    brandBrief: {
      workspaceId: DEFAULT_WORKSPACE_ID,
      audience: "B2B SaaS founders and marketing leads doing founder-led content",
      product: "Curro — research-to-draft workspace for credible LinkedIn POVs",
      category: "Founder-led marketing",
      expertise: "B2B positioning, evidence-led writing, curtailed AI hype",
      voiceExamples: ["Short sentences. No hype. Name the evidence.", "Contrarian but kind: steelman the common take, then add what we saw."],
      themes: ["founder-led marketing", "AI SDR tools", "LinkedIn organic reach"],
      exclusions: "Engagement pods, viral hacks, scraped private data",
      competitors: "Taplio, AuthoredUp",
      restrictedClaims: "No virality promises, no revenue figures without a source",
      updatedAt: t
    },
    memoryCards: [
      { id: "mem_fact_1", workspaceId: DEFAULT_WORKSPACE_ID, kind: "fact", body: "We run a weekly manual brief capped at 3 signals to keep research cost under $0.15/run.", status: "approved", provenance: "Founder note, Oct 2026", createdAt: t, approvedAt: t },
      { id: "mem_op_1", workspaceId: DEFAULT_WORKSPACE_ID, kind: "opinion", body: "Founder POV should start from evidence, not from a blank page.", status: "approved", provenance: "Founder note, Oct 2026", createdAt: t, approvedAt: t },
      { id: "mem_voice_1", workspaceId: DEFAULT_WORKSPACE_ID, kind: "voice_example", body: "Plain, direct, cites the source inline.", status: "approved", provenance: "Founder note, Oct 2026", createdAt: t, approvedAt: t },
      { id: "mem_cand_1", workspaceId: DEFAULT_WORKSPACE_ID, kind: "candidate", body: "Suggested: buyers trust contrarian takes backed by 2+ sources.", status: "candidate", provenance: "Suggested from draft #1", createdAt: t, approvedAt: null }
    ],
    runs: [], sources: [], signals: [], angles: [], assets: [], versions: [], claims: [],
    usage: [],
    audit: [{ id: uid("aud"), workspaceId: DEFAULT_WORKSPACE_ID, actor: "system", action: "workspace.seeded", resourceType: "workspace", resourceId: DEFAULT_WORKSPACE_ID, createdAt: t }],
    clients: [
      {
        id: clientId,
        workspaceId: DEFAULT_WORKSPACE_ID,
        name: "Northfield University",
        slug: "northfield-university",
        industry: "Higher education",
        website: "https://northfield.example.edu",
        contactName: "Priya Raman",
        contactEmail: "priya@northfield.example.edu",
        timezone: "America/New_York",
        brandColor: "#1f3a5f",
        audience: "Working professionals aged 28–45 considering part-time graduate programs",
        tone: "Confident, specific and warm. Short sentences. Cite program facts, never hype.",
        restrictedClaims: "No guaranteed salary outcomes, rankings, or completion-time claims unless the source is cited.",
        summary: "Own the part-time graduate conversation with admissions-date-led content.",
        status: "active",
        createdAt: t,
        updatedAt: t
      }
    ],
    knowledgeItems: [
      {
        id: "kn_nf_1", workspaceId: DEFAULT_WORKSPACE_ID, clientId, kind: "brand_fact",
        title: "Institution profile",
        body: "Northfield University is a private, accredited university founded in 1892. It offers part-time graduate programs in business, public policy and health administration to working professionals.",
        sourceUrl: "https://northfield.example.edu/about", status: "approved", provenance: "Client onboarding call, Oct 2026",
        tags: ["institution", "accreditation"], createdAt: t, updatedAt: t, approvedAt: t
      },
      {
        id: "kn_nf_2", workspaceId: DEFAULT_WORKSPACE_ID, clientId, kind: "brand_fact",
        title: "Part-time MBA format",
        body: "The part-time MBA is 36 credits, delivered in the evening and hybrid on Saturdays. Most students finish in 24–30 months while working full time.",
        sourceUrl: "https://northfield.example.edu/mba/part-time", status: "approved", provenance: "Program page, captured Oct 2026",
        tags: ["mba", "format"], createdAt: t, updatedAt: t, approvedAt: t
      },
      {
        id: "kn_nf_3", workspaceId: DEFAULT_WORKSPACE_ID, clientId, kind: "website",
        title: "Homepage positioning",
        body: "Northfield frames graduate study as 'a working professional's second runway' — practical, part-time, and tied to career transitions rather than prestige.",
        sourceUrl: "https://northfield.example.edu", status: "approved", provenance: "Website crawl, Oct 2026",
        tags: ["positioning", "homepage"], createdAt: t, updatedAt: t, approvedAt: t
      },
      {
        id: "kn_nf_4", workspaceId: DEFAULT_WORKSPACE_ID, clientId, kind: "seo_research",
        title: "Part-time MBA intent cluster",
        body: "Priority queries: 'part-time MBA near me', 'evening MBA for working professionals', 'MBA application timeline 2027'. Intent is timing and format, not rankings. Top competing pages are program pages with no admissions calendar.",
        sourceUrl: null, status: "approved", provenance: "SEO team research, Oct 2026",
        tags: ["seo", "mba", "intent"], createdAt: t, updatedAt: t, approvedAt: t
      },
      {
        id: "kn_nf_5", workspaceId: DEFAULT_WORKSPACE_ID, clientId, kind: "writing_guideline",
        title: "Voice rules",
        body: "Write to one working professional, not a market. Lead with the decision they are avoiding. Use concrete program facts. No exclamation marks. Never promise salary or career outcomes.",
        sourceUrl: null, status: "approved", provenance: "Client brand workshop, Oct 2026",
        tags: ["voice", "tone"], createdAt: t, updatedAt: t, approvedAt: t
      },
      {
        id: "kn_nf_6", workspaceId: DEFAULT_WORKSPACE_ID, clientId, kind: "audience",
        title: "Prospective graduate students",
        body: "Working professionals with 5–12 years of experience who are considering a career pivot or promotion. They worry about time, cost and whether a part-time program is taken seriously. Peak consideration: October–January.",
        sourceUrl: null, status: "approved", provenance: "Admissions interviews, Sep 2026",
        tags: ["audience", "motivation"], createdAt: t, updatedAt: t, approvedAt: t
      },
      {
        id: "kn_nf_7", workspaceId: DEFAULT_WORKSPACE_ID, clientId, kind: "source_document",
        title: "2027 admissions calendar",
        body: "Priority deadline: 1 December 2026. Standard deadline: 15 January 2027. Spring info sessions: 12 November and 4 December 2026. Application requires a resume, one essay and one recommendation.",
        sourceUrl: "https://northfield.example.edu/admissions/calendar", status: "approved", provenance: "Admissions office PDF, Oct 2026",
        tags: ["deadlines", "admissions"], createdAt: t, updatedAt: t, approvedAt: t
      },
      {
        id: "kn_nf_8", workspaceId: DEFAULT_WORKSPACE_ID, clientId, kind: "past_content",
        title: "LinkedIn post — 'The best MBA question'",
        body: "The best MBA question isn't 'will this help my career?' It's 'can I keep my job while I find out?' Northfield's part-time MBA is built around that constraint: evenings, hybrid Saturdays, 36 credits. Priority deadline 1 December.",
        sourceUrl: null, status: "approved", provenance: "Approved post, Sep 2026",
        tags: ["linkedin", "approved"], createdAt: t, updatedAt: t, approvedAt: t
      },
      {
        id: "kn_nf_9", workspaceId: DEFAULT_WORKSPACE_ID, clientId, kind: "seo_research",
        title: "Candidate: AI coursework questions",
        body: "Applicants increasingly ask how AI changes the curriculum. No approved client statement exists yet — needs confirmation from the program director before use.",
        sourceUrl: null, status: "candidate", provenance: "Sales call notes, Oct 2026",
        tags: ["ai", "curriculum"], createdAt: t, updatedAt: t, approvedAt: null
      }
    ],
    plans: [
      {
        id: planId, workspaceId: DEFAULT_WORKSPACE_ID, clientId, month: "2026-11",
        title: "November: admissions-deadline authority",
        objective: "Drive info-session signups ahead of the 1 December priority deadline.",
        status: "active", createdAt: t, updatedAt: t
      }
    ],
    planItems: [
      { id: "pi_nf_1", workspaceId: DEFAULT_WORKSPACE_ID, clientId, planId, channel: "linkedin", title: "The part-time MBA question nobody asks", pillar: "Admissions clarity", publishDate: "2026-11-03", owner: "Maya", status: "review", notes: "Uses approved post angle; check deadline claim.", createdAt: t, updatedAt: t },
      { id: "pi_nf_2", workspaceId: DEFAULT_WORKSPACE_ID, clientId, planId, channel: "blog", title: "Part-time MBA timeline: the 2027 admissions calendar", pillar: "SEO: part-time MBA", publishDate: "2026-11-06", owner: "Jon", status: "in_progress", notes: "Target 'MBA application timeline 2027'.", createdAt: t, updatedAt: t },
      { id: "pi_nf_3", workspaceId: DEFAULT_WORKSPACE_ID, clientId, planId, channel: "x", title: "Three facts about our evening MBA format", pillar: "Program facts", publishDate: "2026-11-10", owner: "Maya", status: "assigned", notes: "Short version of LinkedIn post.", createdAt: t, updatedAt: t },
      { id: "pi_nf_4", workspaceId: DEFAULT_WORKSPACE_ID, clientId, planId, channel: "linkedin", title: "What AI coursework means for working professionals", pillar: "Curriculum proof", publishDate: "2026-11-14", owner: "Unassigned", status: "idea", notes: "Blocked: no approved AI curriculum fact yet.", createdAt: t, updatedAt: t },
      { id: "pi_nf_5", workspaceId: DEFAULT_WORKSPACE_ID, clientId, planId, channel: "newsletter", title: "Priority deadline checklist", pillar: "Admissions dates", publishDate: "2026-11-20", owner: "Jon", status: "assigned", notes: "Include essay + recommendation requirements.", createdAt: t, updatedAt: t }
    ],
    accounts: [
      { id: "acct_nf_li", workspaceId: DEFAULT_WORKSPACE_ID, clientId, channel: "linkedin", handle: "@northfielduniversity", status: "connected", scopes: ["w_member_social", "r_organization_social"], connectedAt: t },
      { id: "acct_nf_x", workspaceId: DEFAULT_WORKSPACE_ID, clientId, channel: "x", handle: "@northfield", status: "connected", scopes: ["tweet.read", "tweet.write", "users.read"], connectedAt: t }
    ],
    posts: [],
    images: [],
    planTier: "agency",
    apiKeys: [],
    performance: []
  };
}

function normalizeDB(raw: Partial<DB>): DB {
  const fresh = seed();
  // Pre-pivot workspaces have no clients key — give them the demo client once.
  const prePivot = raw.clients === undefined;
  return {
    brandBrief: raw.brandBrief ?? fresh.brandBrief,
    profile: raw.profile ?? null,
    memoryCards: raw.memoryCards ?? [],
    runs: raw.runs ?? [],
    sources: raw.sources ?? [],
    signals: raw.signals ?? [],
    angles: raw.angles ?? [],
    assets: raw.assets ?? [],
    versions: raw.versions ?? [],
    claims: raw.claims ?? [],
    usage: raw.usage ?? [],
    audit: raw.audit ?? [],
    clients: raw.clients ?? (prePivot ? fresh.clients : []),
    knowledgeItems: raw.knowledgeItems ?? (prePivot ? fresh.knowledgeItems : []),
    plans: raw.plans ?? (prePivot ? fresh.plans : []),
    planItems: raw.planItems ?? (prePivot ? fresh.planItems : []),
    accounts: raw.accounts ?? (prePivot ? fresh.accounts : []),
    posts: raw.posts ?? [],
    images: raw.images ?? [],
    planTier: raw.planTier ?? "agency",
    apiKeys: raw.apiKeys ?? [],
    performance: raw.performance ?? []
  };
}

export async function loadDB(): Promise<DB> {
  if (usePostgres()) return loadPostgresDB();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return normalizeDB(JSON.parse(raw) as Partial<DB>);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const db = seed();
    await saveDB(db);
    return db;
  }
}

export async function saveDB(db: DB): Promise<void> {
  if (usePostgres()) return savePostgresDB(db);
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = DATA_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DATA_FILE);
}

export async function audit(db: DB, action: string, resourceType: string, resourceId: string, actor = "founder"): Promise<void> {
  db.audit.push({ id: uid("aud"), workspaceId: DEFAULT_WORKSPACE_ID, actor, action, resourceType, resourceId, createdAt: nowIso() });
}
