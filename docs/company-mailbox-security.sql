begin;
alter table public.phishaware_team drop constraint if exists phishaware_team_id_check;
alter table public.phishaware_access add column if not exists company_id text not null default 'main' references public.phishaware_team(id);
alter table public.phishaware_access add column if not exists platform_admin boolean not null default false;
update public.phishaware_access set platform_admin=true where role='Administrator' and email in ('terkperkanthony101@gmail.com','missdanikisseih@gmail.com');
create index if not exists phishaware_access_company on public.phishaware_access(company_id);
create table if not exists public.phishaware_oauth_states (
 state_hash text primary key,user_id uuid not null references auth.users(id) on delete cascade,
 company_id text not null references public.phishaware_team(id), verifier_cipher text not null,
 expires_at timestamptz not null, claimed boolean not null default false
);
create table if not exists public.phishaware_mailboxes (
 user_id uuid primary key references auth.users(id) on delete cascade,
 company_id text not null references public.phishaware_team(id), email text not null,
 token_cipher text not null, connected_at timestamptz not null default now(),
 last_scan_at timestamptz, last_error text, scan_after timestamptz not null default now(),
 lease_until timestamptz, scan_page_token text, scan_since bigint, scan_cutoff bigint, status text not null default 'connected' check(status in ('connected','reconnect'))
);
create index if not exists phishaware_mailboxes_due on public.phishaware_mailboxes(scan_after) where status='connected';
create table if not exists public.phishaware_email_findings (
 user_id uuid not null references auth.users(id) on delete cascade,
 company_id text not null references public.phishaware_team(id),
 message_id text not null, subject text not null, sender text not null,
 received_at timestamptz not null, scanned_at timestamptz not null default now(),
 risk text not null check(risk in ('Low','Medium','High')), reasons jsonb not null,
 recommendation text not null, primary key(user_id,message_id)
);
create index if not exists phishaware_findings_user_date on public.phishaware_email_findings(user_id,scanned_at desc);
create table if not exists public.phishaware_rate_limits (
 bucket text primary key, window_start timestamptz not null, hits integer not null
);
create or replace function public.phishaware_take_rate(bucket_key text,max_hits integer,window_seconds integer)
returns boolean language plpgsql security invoker set search_path='' as $$
declare n integer;
begin
 insert into public.phishaware_rate_limits(bucket,window_start,hits) values(bucket_key,now(),1)
 on conflict(bucket) do update set
 hits=case when public.phishaware_rate_limits.window_start < now()-make_interval(secs=>window_seconds) then 1 else public.phishaware_rate_limits.hits+1 end,
 window_start=case when public.phishaware_rate_limits.window_start < now()-make_interval(secs=>window_seconds) then now() else public.phishaware_rate_limits.window_start end
 returning hits into n;
 return n<=max_hits;
end $$;
revoke all on function public.phishaware_take_rate(text,integer,integer) from public,anon,authenticated;
grant execute on function public.phishaware_take_rate(text,integer,integer) to service_role;
alter table public.phishaware_oauth_states enable row level security;
alter table public.phishaware_mailboxes enable row level security;
alter table public.phishaware_email_findings enable row level security;
alter table public.phishaware_rate_limits enable row level security;
revoke all on public.phishaware_oauth_states,public.phishaware_mailboxes,public.phishaware_email_findings,public.phishaware_rate_limits from anon,authenticated;
grant all on public.phishaware_oauth_states,public.phishaware_mailboxes,public.phishaware_email_findings,public.phishaware_rate_limits to service_role;
create policy server_only on public.phishaware_oauth_states for all to authenticated using(false) with check(false);
create policy server_only on public.phishaware_mailboxes for all to authenticated using(false) with check(false);
create policy server_only on public.phishaware_email_findings for all to authenticated using(false) with check(false);
create policy server_only on public.phishaware_rate_limits for all to authenticated using(false) with check(false);
create or replace function public.phishaware_store_finding(owner uuid,company text,finding jsonb)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.phishaware_mailboxes where user_id=owner and company_id=company and status='connected' for update;
 if not found then return false; end if;
 insert into public.phishaware_email_findings(user_id,company_id,message_id,subject,sender,received_at,risk,reasons,recommendation)
 values(owner,company,finding->>'message_id',finding->>'subject',finding->>'sender',(finding->>'received_at')::timestamptz,finding->>'risk',finding->'reasons',finding->>'recommendation')
 on conflict(user_id,message_id) do nothing;
 return true;
end $$;
revoke all on function public.phishaware_store_finding(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.phishaware_store_finding(uuid,text,jsonb) to service_role;
create or replace function public.phishaware_prepare_invite(target_email text,company text,employee text,inviter uuid)
returns boolean language plpgsql security invoker set search_path='' as $$
declare n integer;
begin
 insert into public.phishaware_access(email,company_id,role,employee_id,invited_by,status,updated_at)
 values(target_email,company,'Employee',employee,inviter,'sending',now())
 on conflict(email) do update set employee_id=excluded.employee_id,invited_by=excluded.invited_by,
 status=case when public.phishaware_access.status='sent' then 'sent' else 'sending' end,last_error=null,updated_at=now()
 where public.phishaware_access.company_id=excluded.company_id and public.phishaware_access.role='Employee'
 and public.phishaware_access.updated_at<now()-interval '60 seconds';
 get diagnostics n=row_count;
 return n=1;
end $$;
revoke all on function public.phishaware_prepare_invite(text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.phishaware_prepare_invite(text,text,text,uuid) to service_role;
create or replace function public.phishaware_connect_mailbox(owner uuid,company text,mailbox_email text,cipher text,oauth_state_hash text)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.phishaware_oauth_states where state_hash=oauth_state_hash and user_id=owner and company_id=company and claimed and expires_at>now() for update;
 if not found then return false; end if;
 if not exists(select 1 from public.phishaware_access where email=mailbox_email and company_id=company and status in ('approved','sent')) then return false; end if;
 insert into public.phishaware_mailboxes(user_id,company_id,email,token_cipher) values(owner,company,mailbox_email,cipher) on conflict(user_id) do nothing;
 if not found then return false; end if;
 delete from public.phishaware_oauth_states where state_hash=oauth_state_hash;
 return true;
end $$;
revoke all on function public.phishaware_connect_mailbox(uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.phishaware_connect_mailbox(uuid,text,text,text,text) to service_role;
commit;
