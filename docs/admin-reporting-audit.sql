create table public.phishaware_daily_metrics(company_id text references public.phishaware_team(id) on delete cascade,day date,scanned integer not null default 0,low integer not null default 0,medium integer not null default 0,high integer not null default 0,alerts integer not null default 0,reports integer not null default 0,primary key(company_id,day));
create table public.phishaware_audit(id text primary key,company_id text not null references public.phishaware_team(id) on delete cascade,date timestamptz not null default now(),actor text not null,category text not null,action text not null,source text not null);
create index on public.phishaware_audit(company_id,date desc);
alter table public.phishaware_daily_metrics enable row level security;
alter table public.phishaware_audit enable row level security;
revoke all on public.phishaware_daily_metrics,public.phishaware_audit from public,anon,authenticated;
grant all on public.phishaware_daily_metrics,public.phishaware_audit to service_role;
alter table public.phishaware_team add column audit_actor text;
create function public.phishaware_capture_activity() returns trigger language plpgsql security invoker set search_path='' as $$
declare e jsonb; company text; who text; label text;
begin
 if tg_table_name='phishaware_team' then
  company=new.id;
  for e in select value from jsonb_array_elements(coalesce(new.state->'events','[]')) loop
   insert into public.phishaware_audit(id,company_id,date,actor,category,action,source) values(company||':workspace:'||(e->>'id'),company,(e->>'date')::timestamptz,e->>'actor',e->>'type',e->>'action','workspace') on conflict(id) do nothing;
  end loop;
  if new.audit_actor is not null then
   who=new.audit_actor;
   insert into public.phishaware_audit values(gen_random_uuid()::text,company,now(),coalesce(who,'Administrator'),'Settings',case when tg_op='INSERT' then 'Created organization workspace' else 'Saved workspace changes' end,'server');
  end if;
 elsif tg_table_name='phishaware_access' then
  company=new.company_id;
  who='Administrator';
  if tg_op='INSERT' or new.status is distinct from old.status then
   insert into public.phishaware_audit values(gen_random_uuid()::text,company,now(),coalesce(who,'Administrator'),'Invitation',case when new.status='sent' then 'Invitation sent to ' when new.status='failed' then 'Invitation failed for ' else 'Invitation prepared for ' end||new.email,'server');
  end if;
 elsif tg_table_name='phishaware_mailboxes' then
  if tg_op='DELETE' then company=old.company_id;who=old.email;label='Disconnected Google mailbox';
  else company=new.company_id;who=new.email;label=case when tg_op='INSERT' then 'Connected Google mailbox' when new.last_scan_at is distinct from old.last_scan_at then 'Completed automatic or manual mailbox scan' else 'Mailbox connection status changed' end;
   if tg_op='UPDATE' and new.last_scan_at is not distinct from old.last_scan_at and new.status is not distinct from old.status then return new; end if;
  end if;
  insert into public.phishaware_audit values(gen_random_uuid()::text,company,now(),who,'Email protection',label,'server');
 elsif tg_table_name='phishaware_email_findings' then
  insert into public.phishaware_daily_metrics(company_id,day,scanned,low,medium,high) values(new.company_id,(new.scanned_at at time zone 'UTC')::date,1,(new.risk='Low')::integer,(new.risk='Medium')::integer,(new.risk='High')::integer)
  on conflict(company_id,day) do update set scanned=phishaware_daily_metrics.scanned+1,low=phishaware_daily_metrics.low+excluded.low,medium=phishaware_daily_metrics.medium+excluded.medium,high=phishaware_daily_metrics.high+excluded.high;
 elsif tg_table_name='phishaware_email_alerts' then
  if tg_op='INSERT' then
   insert into public.phishaware_daily_metrics(company_id,day,alerts,reports) values(new.company_id,(new.created_at at time zone 'UTC')::date,1,(new.source='employee')::integer)
   on conflict(company_id,day) do update set alerts=phishaware_daily_metrics.alerts+1,reports=phishaware_daily_metrics.reports+excluded.reports;
  end if;
  insert into public.phishaware_audit values(gen_random_uuid()::text,new.company_id,now(),case when tg_op='UPDATE' then 'Company administrator' when new.source='employee' then new.employee_email else 'Email protection service' end,'Email alert',case when tg_op='INSERT' then case when new.source='employee' then 'Employee reported a suspicious email' else 'High risk email alert created' end else 'Email alert resolved' end,'server');
 end if;
 if tg_op='DELETE' then return old; else return new; end if;
end;$$;
revoke all on function public.phishaware_capture_activity() from public,anon,authenticated;
grant execute on function public.phishaware_capture_activity() to service_role;
create trigger record_workspace_audit after insert or update on public.phishaware_team for each row execute function public.phishaware_capture_activity();
create trigger record_invitation_audit after insert or update on public.phishaware_access for each row execute function public.phishaware_capture_activity();
create trigger record_mailbox_audit after insert or update or delete on public.phishaware_mailboxes for each row execute function public.phishaware_capture_activity();
create trigger record_daily_findings after insert on public.phishaware_email_findings for each row execute function public.phishaware_capture_activity();
create trigger record_alert_audit after insert or update of status on public.phishaware_email_alerts for each row execute function public.phishaware_capture_activity();
insert into public.phishaware_daily_metrics(company_id,day,scanned,low,medium,high) select company_id,(scanned_at at time zone 'UTC')::date,count(*),count(*) filter(where risk='Low'),count(*) filter(where risk='Medium'),count(*) filter(where risk='High') from public.phishaware_email_findings group by 1,2;
insert into public.phishaware_daily_metrics(company_id,day,alerts,reports) select company_id,(created_at at time zone 'UTC')::date,count(*),count(*) filter(where source='employee') from public.phishaware_email_alerts group by 1,2 on conflict(company_id,day) do update set alerts=excluded.alerts,reports=excluded.reports;
insert into public.phishaware_audit(id,company_id,date,actor,category,action,source) select t.id||':workspace:'||(e->>'id'),t.id,(e->>'date')::timestamptz,e->>'actor',e->>'type',e->>'action','workspace' from public.phishaware_team t cross join lateral jsonb_array_elements(coalesce(t.state->'events','[]')) e on conflict(id) do nothing;
