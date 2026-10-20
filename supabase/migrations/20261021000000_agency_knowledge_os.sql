-- Curro Agency Knowledge OS — phases 1–6
-- WRITE-ONLY in this repo: review before applying. Local beta still uses
-- data/curro.json; this migration is the Supabase cutover target.
--
-- Every row is workspace-scoped. Client-scoped rows cascade with the client.
-- Content versions and claim ledger stay append-only (select + insert).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- clients
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  slug text not null,
  industry text not null default '',
  website text not null default '',
  contact_name text not null default '',
  contact_email text not null default '',
  timezone text not null default 'UTC',
  brand_color text not null default '#1f3a5f',
  audience text not null default '',
  tone text not null default '',
  restricted_claims text not null default '',
  summary text not null default '',
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);
create trigger clients_updated_at before update on public.clients
  for each row execute function public.handle_updated_at();
create index clients_ws_status_idx on public.clients (workspace_id, status);

create table public.knowledge_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  kind text not null check (kind in ('brand_fact', 'website', 'source_document', 'seo_research', 'writing_guideline', 'audience', 'past_content')),
  title text not null check (char_length(title) between 1 and 200),
  body text not null check (char_length(body) between 1 and 20000),
  source_url text,
  status text not null default 'candidate' check (status in ('approved', 'candidate', 'archived')),
  provenance text not null default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz
);
create trigger knowledge_items_updated_at before update on public.knowledge_items
  for each row execute function public.handle_updated_at();
create index knowledge_items_client_status_idx on public.knowledge_items (client_id, status);

-- ---------------------------------------------------------------- planner
create table public.content_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  title text not null default '',
  objective text not null default '',
  status text not null default 'active' check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, month)
);
create trigger content_plans_updated_at before update on public.content_plans
  for each row execute function public.handle_updated_at();

create table public.plan_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  plan_id uuid not null references public.content_plans (id) on delete cascade,
  channel text not null check (channel in ('linkedin', 'x', 'blog', 'newsletter', 'instagram')),
  title text not null check (char_length(title) between 3 and 200),
  pillar text not null default '',
  publish_date date not null,
  owner text not null default 'Unassigned',
  status text not null default 'idea' check (status in ('idea', 'assigned', 'in_progress', 'review', 'scheduled', 'published')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger plan_items_updated_at before update on public.plan_items
  for each row execute function public.handle_updated_at();
create index plan_items_plan_date_idx on public.plan_items (plan_id, publish_date);

-- ------------------------------------------------------------ integrations
create table public.connected_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  channel text not null check (channel in ('linkedin', 'x', 'blog', 'newsletter', 'instagram')),
  handle text not null default '',
  status text not null default 'disconnected' check (status in ('connected', 'disconnected', 'error')),
  scopes text[] not null default '{}',
  connected_at timestamptz,
  unique (client_id, channel)
);

create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null default 'API key',
  prefix text not null,
  key_hash text not null unique,
  client_id uuid references public.clients (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

-- -------------------------------------------------------------- publishing
create table public.image_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  prompt text not null default '',
  aspect text not null default 'square',
  status text not null default 'queued' check (status in ('queued', 'ready', 'failed')),
  url text,
  palette text[] not null default '{}',
  cost_usd numeric(10, 4) not null default 0,
  origin text not null default 'generated' check (origin in ('generated', 'uploaded')),
  title text not null default '',
  created_at timestamptz not null default now()
);

create table public.scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  asset_id uuid references public.content_assets (id) on delete set null,
  plan_item_id uuid references public.plan_items (id) on delete set null,
  channel text not null check (channel in ('linkedin', 'x', 'blog', 'newsletter', 'instagram')),
  body text not null default '',
  image_url text,
  status text not null default 'scheduled' check (status in ('draft', 'in_review', 'approved', 'scheduled', 'publishing', 'published', 'failed', 'cancelled')),
  scheduled_at timestamptz,
  timezone text not null default 'UTC',
  external_id text,
  failure_reason text,
  approved_by text,
  attempts int not null default 0,
  last_attempt_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger scheduled_posts_updated_at before update on public.scheduled_posts
  for each row execute function public.handle_updated_at();
create index scheduled_posts_due_idx on public.scheduled_posts (status, scheduled_at);

create table public.performance_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  post_id uuid not null references public.scheduled_posts (id) on delete cascade,
  impressions int not null default 0,
  likes int not null default 0,
  comments int not null default 0,
  clicks int not null default 0,
  source text not null default 'manual' check (source in ('manual', 'api')),
  captured_at timestamptz not null default now()
);
create index performance_client_captured_idx on public.performance_snapshots (client_id, captured_at desc);

-- ------------------------------------------------------------------ billing
alter table public.workspaces
  add column if not exists plan_tier text not null default 'agency'
  check (plan_tier in ('solo', 'studio', 'agency', 'enterprise'));

-- ---------------------------------------------------------------------- RLS
alter table public.clients enable row level security;
alter table public.knowledge_items enable row level security;
alter table public.content_plans enable row level security;
alter table public.plan_items enable row level security;
alter table public.connected_accounts enable row level security;
alter table public.api_keys enable row level security;
alter table public.image_assets enable row level security;
alter table public.scheduled_posts enable row level security;
alter table public.performance_snapshots enable row level security;

create policy clients_member_all on public.clients for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
create policy knowledge_member_all on public.knowledge_items for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
create policy plans_member_all on public.content_plans for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
create policy plan_items_member_all on public.plan_items for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
create policy accounts_member_all on public.connected_accounts for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
create policy images_member_all on public.image_assets for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
create policy posts_member_all on public.scheduled_posts for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
create policy snapshots_member_all on public.performance_snapshots for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- API keys: members may create/revoke; nobody reads the hash through the API.
create policy api_keys_member_select on public.api_keys for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy api_keys_member_insert on public.api_keys for insert to authenticated
  with check (public.is_workspace_member(workspace_id));
create policy api_keys_member_update on public.api_keys for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.knowledge_items to authenticated;
grant select, insert, update, delete on public.content_plans to authenticated;
grant select, insert, update, delete on public.plan_items to authenticated;
grant select, insert, update, delete on public.connected_accounts to authenticated;
grant select, insert on public.api_keys to authenticated;
grant update (name, last_used_at, revoked_at) on public.api_keys to authenticated;
grant select, insert, update, delete on public.image_assets to authenticated;
grant select, insert, update, delete on public.scheduled_posts to authenticated;
grant select, insert, update, delete on public.performance_snapshots to authenticated;
