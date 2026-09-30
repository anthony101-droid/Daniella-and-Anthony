create table public.phishaware_workspaces (
owner_id uuid primary key references auth.users(id) on delete cascade,
state jsonb not null check (jsonb_typeof(state) = 'object' and state->>'version' = '1'),
revision integer not null default 1,
updated_at timestamptz not null default now()
);
alter table public.phishaware_workspaces enable row level security;
grant select, insert, update on public.phishaware_workspaces to authenticated;
revoke all on public.phishaware_workspaces from anon;
create policy owner_select on public.phishaware_workspaces for select to authenticated using ((select auth.uid()) = owner_id);
create policy owner_insert on public.phishaware_workspaces for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy owner_update on public.phishaware_workspaces for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
