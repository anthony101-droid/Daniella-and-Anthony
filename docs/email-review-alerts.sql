alter table public.phishaware_email_findings add column if not exists review_state text not null default 'unreviewed' check(review_state in ('unreviewed','reviewed','reported'));
alter table public.phishaware_email_findings add column if not exists reviewed_at timestamptz;
create table if not exists public.phishaware_email_alerts(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null,
 message_id text not null,
 company_id text not null references public.phishaware_team(id),
 employee_email text not null,
 subject text not null, sender text not null,
 risk text not null check(risk in ('Low','Medium','High')),
 reasons jsonb not null, recommendation text not null,
 source text not null check(source in ('automatic','employee')),
 status text not null default 'open' check(status in ('open','resolved')),
 created_at timestamptz not null default now(),resolved_at timestamptz,
 unique(user_id,message_id),
 foreign key(user_id,message_id) references public.phishaware_email_findings(user_id,message_id) on delete cascade
);
create index if not exists phishaware_email_alerts_company on public.phishaware_email_alerts(company_id,status,created_at desc);
alter table public.phishaware_email_alerts enable row level security;
revoke all on public.phishaware_email_alerts from public,anon,authenticated;
grant all on public.phishaware_email_alerts to service_role;
create or replace function public.phishaware_store_finding(owner uuid,company text,finding jsonb)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.phishaware_mailboxes where user_id=owner and company_id=company and status='connected' for update;
 if not found then return false; end if;
 insert into public.phishaware_email_findings(user_id,company_id,message_id,subject,sender,received_at,risk,reasons,recommendation)
 values(owner,company,finding->>'message_id',finding->>'subject',finding->>'sender',(finding->>'received_at')::timestamptz,finding->>'risk',finding->'reasons',finding->>'recommendation')
 on conflict(user_id,message_id) do nothing;
 if finding->>'risk'='High' then
  insert into public.phishaware_email_alerts(user_id,message_id,company_id,employee_email,subject,sender,risk,reasons,recommendation,source)
  select f.user_id,f.message_id,f.company_id,m.email,f.subject,f.sender,f.risk,f.reasons,f.recommendation,'automatic'
  from public.phishaware_email_findings f join public.phishaware_mailboxes m on m.user_id=f.user_id and m.company_id=f.company_id
  where f.user_id=owner and f.message_id=finding->>'message_id' and f.company_id=company and f.risk='High'
  on conflict(user_id,message_id) do nothing;
 end if;
 return true;
end $$;
create or replace function public.phishaware_review_finding(owner uuid,company text,message text,decision text)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 if decision not in ('reviewed','reported') then return false; end if;
 perform 1 from public.phishaware_mailboxes where user_id=owner and company_id=company for update;
 if not found then return false; end if;
 update public.phishaware_email_findings set review_state=decision,reviewed_at=now()
 where user_id=owner and company_id=company and message_id=message;
 if not found then return false; end if;
 if decision='reported' then
  insert into public.phishaware_email_alerts(user_id,message_id,company_id,employee_email,subject,sender,risk,reasons,recommendation,source)
  select f.user_id,f.message_id,f.company_id,m.email,f.subject,f.sender,f.risk,f.reasons,f.recommendation,'employee'
  from public.phishaware_email_findings f join public.phishaware_mailboxes m on m.user_id=f.user_id and m.company_id=f.company_id
  where f.user_id=owner and f.company_id=company and f.message_id=message
  on conflict(user_id,message_id) do nothing;
 end if;
 return true;
end $$;
revoke all on function public.phishaware_store_finding(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.phishaware_store_finding(uuid,text,jsonb) to service_role;
revoke all on function public.phishaware_review_finding(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.phishaware_review_finding(uuid,text,text,text) to service_role;

-- Include existing High risk summaries in the administrator alert queue.
insert into public.phishaware_email_alerts(user_id,message_id,company_id,employee_email,subject,sender,risk,reasons,recommendation,source)
select f.user_id,f.message_id,f.company_id,m.email,f.subject,f.sender,f.risk,f.reasons,f.recommendation,'automatic'
from public.phishaware_email_findings f join public.phishaware_mailboxes m on m.user_id=f.user_id and m.company_id=f.company_id
where f.risk='High' and f.scanned_at>now()-interval '30 days' and m.status='connected'
on conflict(user_id,message_id) do nothing;
