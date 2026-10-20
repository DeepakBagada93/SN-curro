-- Curro core schema — closed beta (TODO #7, #8)
-- Convention: every tenant-owned table carries workspace_id. RLS is defence
-- in depth on top of server-side membership checks, never the only control.
-- Conventions: append-only ledgers (content_versions, claim_ledger_entries,
-- audit_events, usage_events) get SELECT+INSERT policies only — corrections
-- create new records; history is never rewritten.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- helpers
-- NOTE: is_workspace_member() is defined after the tables (SQL-language
-- function bodies are validated at creation time, so members must exist).
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- --------------------------------------------------------------- tenants
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  owner_user_id uuid not null,
  plan text not null default 'beta' check (plan in ('beta', 'pilot', 'team')),
  created_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null,
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index workspace_members_user_idx on public.workspace_members (user_id);

-- ----------------------------------------------------------- brand/memory
create table public.brand_briefs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces (id) on delete cascade,
  audience text not null default '',
  product text not null default '',
  category text not null default '',
  expertise text not null default '',
  voice_examples text[] not null default '{}',
  themes text[] not null default '{}',
  exclusions text not null default '',
  competitors text not null default '',
  restricted_claims text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger brand_briefs_updated_at
  before update on public.brand_briefs
  for each row execute function public.handle_updated_at();

create table public.memory_cards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  kind text not null check (kind in ('fact', 'opinion', 'voice_example', 'candidate')),
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'candidate'
    check (status in ('approved', 'candidate', 'archived')),
  provenance_json jsonb not null default '{}',
  created_at timestamptz not null default now(),
  approved_at timestamptz
);
create index memory_cards_ws_status_idx
  on public.memory_cards (workspace_id, status);

-- ---------------------------------------------------------------- research
create table public.research_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  status text not null default 'queued'
    check (status in ('queued', 'planning', 'retrieving', 'normalizing',
      'deduplicating', 'scoring', 'succeeded', 'partial', 'failed', 'cancelled')),
  trigger text not null default 'manual' check (trigger in ('manual', 'scheduled')),
  idempotency_key text not null,
  budget_snapshot jsonb not null default '{}',
  usage_json jsonb not null default '{}',
  warnings text[] not null default '{}',
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  unique (workspace_id, idempotency_key)
);
create index research_runs_ws_status_created_idx
  on public.research_runs (workspace_id, status, created_at desc);

create table public.source_results (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  run_id uuid references public.research_runs (id) on delete set null,
  title text not null default '',
  canonical_url text not null default '',
  publisher text not null default '',
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  excerpt text not null default '',
  query text not null default '',
  content_hash text not null default ''
);
create unique index source_results_ws_canonical_uidx
  on public.source_results (workspace_id, canonical_url)
  where canonical_url <> '';
create index source_results_ws_run_idx
  on public.source_results (workspace_id, run_id);

create table public.signal_cards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  research_run_id uuid references public.research_runs (id) on delete set null,
  title text not null default '',
  why_now text not null default '',
  relevance text not null default '',
  score_json jsonb not null default '{}',
  source_ids uuid[] not null default '{}',
  status text not null default 'new'
    check (status in ('new', 'saved', 'dismissed', 'drafted', 'archived')),
  suppression_key text not null default '',
  dismissed_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger signal_cards_updated_at
  before update on public.signal_cards
  for each row execute function public.handle_updated_at();
create index signal_cards_ws_status_created_idx
  on public.signal_cards (workspace_id, status, created_at desc);

create table public.angles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  signal_card_id uuid not null references public.signal_cards (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  origin text not null default 'founder' check (origin in ('suggested', 'founder')),
  approved_by text,
  created_at timestamptz not null default now()
);
create index angles_ws_signal_idx
  on public.angles (workspace_id, signal_card_id);

-- ------------------------------------------------------------------ drafts
create table public.content_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  signal_card_id uuid references public.signal_cards (id) on delete set null,
  angle_id uuid references public.angles (id) on delete set null,
  platform text not null default 'linkedin' check (platform = 'linkedin'),
  status text not null default 'draft'
    check (status in ('draft', 'in_review', 'approved', 'rejected', 'archived')),
  current_version integer not null default 1 check (current_version >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger content_assets_updated_at
  before update on public.content_assets
  for each row execute function public.handle_updated_at();
create index content_assets_ws_status_created_idx
  on public.content_assets (workspace_id, status, created_at desc);

-- Append-only: SELECT + INSERT policies only (see RLS section below).
create table public.content_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  content_asset_id uuid not null references public.content_assets (id) on delete cascade,
  version integer not null check (version >= 1),
  body text not null check (char_length(body) between 1 and 5000),
  model_metadata_json jsonb not null default '{}',
  source_ids_json jsonb not null default '[]',
  prompt_template text not null default 'linkedin-v1',
  est_cost_usd numeric(10, 4) not null default 0,
  created_at timestamptz not null default now(),
  unique (content_asset_id, version)
);
create index content_versions_asset_idx
  on public.content_versions (content_asset_id, version desc);

-- Append-only: SELECT + INSERT policies only.
create table public.claim_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  content_version_id uuid not null references public.content_versions (id) on delete cascade,
  claim text not null check (char_length(claim) between 1 and 500),
  kind text not null check (kind in ('factual', 'opinion', 'unsupported')),
  source_ids_json jsonb not null default '[]',
  review_note text,
  review_status text not null default 'open'
    check (review_status in ('open', 'resolved', 'removed')),
  created_at timestamptz not null default now()
);
create index claim_ledger_entries_version_idx
  on public.claim_ledger_entries (content_version_id);

-- ------------------------------------------------------------ usage/audit
-- Append-only: SELECT + INSERT policies only.
create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  run_id uuid references public.research_runs (id) on delete set null,
  provider text not null default '',
  unit text not null default '',
  quantity numeric(14, 4) not null default 0,
  estimated_cost numeric(10, 4) not null default 0,
  created_at timestamptz not null default now()
);
create index usage_events_ws_created_idx
  on public.usage_events (workspace_id, created_at desc);

-- Append-only: SELECT + INSERT policies only.
create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  actor_user_id uuid,
  action text not null default '',
  resource_type text not null default '',
  resource_id text not null default '',
  created_at timestamptz not null default now()
);
create index audit_events_ws_created_idx
  on public.audit_events (workspace_id, created_at desc);

-- =================================================================== RLS
-- Defence in depth: every tenant table enforces workspace membership.
-- Server code always checks membership too; RLS alone is never trusted.

-- Membership helper (defined here: SQL bodies need the table to exist).
create or replace function public.is_workspace_member(_workspace_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = _workspace_id
      and m.user_id = auth.uid()
  );
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.brand_briefs enable row level security;
alter table public.memory_cards enable row level security;
alter table public.research_runs enable row level security;
alter table public.source_results enable row level security;
alter table public.signal_cards enable row level security;
alter table public.angles enable row level security;
alter table public.content_assets enable row level security;
alter table public.content_versions enable row level security;
alter table public.claim_ledger_entries enable row level security;
alter table public.usage_events enable row level security;
alter table public.audit_events enable row level security;

-- Workspaces: members read their own; any signed-in user may create one.
create policy workspaces_member_select on public.workspaces
  for select to authenticated using (public.is_workspace_member(id));
create policy workspaces_create on public.workspaces
  for insert to authenticated with check (owner_user_id = auth.uid());

-- Membership: members read the roster; anyone may add themselves (bootstrap).
create policy members_select on public.workspace_members
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy members_self_join on public.workspace_members
  for insert to authenticated with check (user_id = auth.uid());

-- Standard tenant tables: full row access for members, nothing for others.
create policy brand_briefs_member_all on public.brand_briefs
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy memory_cards_member_all on public.memory_cards
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy research_runs_member_all on public.research_runs
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy source_results_member_all on public.source_results
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy signal_cards_member_all on public.signal_cards
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy angles_member_all on public.angles
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy content_assets_member_all on public.content_assets
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- Append-only ledgers: members may read and append, never rewrite.
create policy content_versions_member_select on public.content_versions
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy content_versions_member_insert on public.content_versions
  for insert to authenticated with check (public.is_workspace_member(workspace_id));

create policy claim_ledger_member_select on public.claim_ledger_entries
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy claim_ledger_member_insert on public.claim_ledger_entries
  for insert to authenticated with check (public.is_workspace_member(workspace_id));

create policy usage_events_member_select on public.usage_events
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy usage_events_member_insert on public.usage_events
  for insert to authenticated with check (public.is_workspace_member(workspace_id));

create policy audit_events_member_select on public.audit_events
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy audit_events_member_insert on public.audit_events
  for insert to authenticated with check (public.is_workspace_member(workspace_id));

-- Least privilege: explicit grants per table (service_role / postgres bypass
-- RLS and are used by server-side admin code only).
grant execute on function public.is_workspace_member(uuid) to authenticated;

grant select, insert, update, delete on public.workspaces to authenticated;
grant select, insert on public.workspace_members to authenticated;
grant select, insert, update, delete on public.brand_briefs to authenticated;
grant select, insert, update, delete on public.memory_cards to authenticated;
grant select, insert, update, delete on public.research_runs to authenticated;
grant select, insert, update, delete on public.source_results to authenticated;
grant select, insert, update, delete on public.signal_cards to authenticated;
grant select, insert, update, delete on public.angles to authenticated;
grant select, insert, update, delete on public.content_assets to authenticated;
grant select, insert on public.content_versions to authenticated;
grant select, insert on public.claim_ledger_entries to authenticated;
grant select, insert on public.usage_events to authenticated;
grant select, insert on public.audit_events to authenticated;

-- Backstop for future tables created by later migrations.
alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to authenticated;
