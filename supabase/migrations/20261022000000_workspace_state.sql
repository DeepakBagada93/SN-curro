-- Server-only workspace snapshot for the single-owner beta.
-- The app reads/writes this with the Postgres connection string; it is never
-- exposed through PostgREST, and RLS with no policies denies anon/auth roles.
create table if not exists public.workspace_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.workspace_state enable row level security;

revoke all on table public.workspace_state from anon, authenticated;

comment on table public.workspace_state is 'Curro beta workspace snapshot (server-only)';
