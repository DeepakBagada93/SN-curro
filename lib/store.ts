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
  return {
    profile: null,
    brandBrief: null,
    memoryCards: [],
    runs: [],
    sources: [],
    signals: [],
    angles: [],
    assets: [],
    versions: [],
    claims: [],
    usage: [],
    audit: [
      {
        id: uid("aud"),
        workspaceId: DEFAULT_WORKSPACE_ID,
        actor: "system",
        action: "workspace.initialized",
        resourceType: "workspace",
        resourceId: DEFAULT_WORKSPACE_ID,
        createdAt: t
      }
    ],
    clients: [],
    knowledgeItems: [],
    plans: [],
    planItems: [],
    accounts: [],
    posts: [],
    images: [],
    planTier: "agency",
    apiKeys: [],
    performance: []
  };
}

function normalizeDB(raw: Partial<DB>): DB {
  return {
    brandBrief: raw.brandBrief ?? null,
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
    clients: raw.clients ?? [],
    knowledgeItems: raw.knowledgeItems ?? [],
    plans: raw.plans ?? [],
    planItems: raw.planItems ?? [],
    accounts: raw.accounts ?? [],
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
