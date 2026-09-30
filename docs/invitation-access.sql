create table public.phishaware_team (
 id text primary key check (id='main'),
 state jsonb not null,
 revision integer not null default 1,
 updated_at timestamptz not null default now()
);
create table public.phishaware_access (
 email text primary key,
 role text not null check(role in ('Administrator','Employee')),
 employee_id text,
 invited_by uuid references auth.users(id),
 status text not null check(status in ('approved','sending','sent','failed','revoked')),
 last_error text,
 updated_at timestamptz not null default now()
);
alter table public.phishaware_team enable row level security;
alter table public.phishaware_access enable row level security;
revoke all on public.phishaware_team, public.phishaware_access from anon, authenticated;
grant all on public.phishaware_team, public.phishaware_access to service_role;
insert into public.phishaware_access(email,role,status) values
 ('terkperkanthony101@gmail.com','Administrator','approved'),
 ('missdanikisseih@gmail.com','Administrator','approved');
insert into public.phishaware_team(id,state,revision)
select 'main',state,revision from public.phishaware_workspaces where owner_id='ed05c148-f288-463f-8551-0b39163e50e7';
-- Preserve earlier workspaces as archives, but deny direct client access.
revoke all on public.phishaware_workspaces from anon, authenticated;

create policy server_only on public.phishaware_team for all to authenticated using(false) with check(false);
create policy server_only on public.phishaware_access for all to authenticated using(false) with check(false);
