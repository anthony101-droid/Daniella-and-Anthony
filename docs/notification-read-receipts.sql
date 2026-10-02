alter table public.phishaware_email_findings add column if not exists notification_read boolean not null default false;
create table if not exists public.phishaware_alert_reads (
 user_id uuid not null references auth.users(id) on delete cascade,
 alert_id uuid not null references public.phishaware_email_alerts(id) on delete cascade,
 company_id text not null references public.phishaware_team(id) on delete cascade,
 read_at timestamptz not null default now(),
 primary key(user_id,alert_id)
);
alter table public.phishaware_alert_reads enable row level security;
revoke all on public.phishaware_alert_reads from public,anon,authenticated;
grant all on public.phishaware_alert_reads to service_role;
create or replace function public.phishaware_read_notifications(owner uuid,company text,administrator boolean,notification text default null) returns void language plpgsql security invoker set search_path='' as $$
begin
 if administrator then
  insert into public.phishaware_alert_reads(user_id,alert_id,company_id)
  select owner,a.id,a.company_id from public.phishaware_email_alerts a where a.company_id=company and (notification is null or a.id::text=notification)
  on conflict(user_id,alert_id) do nothing;
 else
  update public.phishaware_email_findings f set notification_read=true where f.user_id=owner and f.company_id=company and (notification is null or f.message_id=notification);
 end if;
end;
$$;
revoke all on function public.phishaware_read_notifications(uuid,text,boolean,text) from public,anon,authenticated;
grant execute on function public.phishaware_read_notifications(uuid,text,boolean,text) to service_role;
