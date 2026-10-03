create table public.phishaware_notification_history(user_id uuid not null references auth.users(id) on delete cascade,company_id text not null references public.phishaware_team(id) on delete cascade,message_id text not null,subject text not null,sender text not null,risk text not null,reasons jsonb not null,recommendation text not null,received_at timestamptz not null,created_at timestamptz not null default now(),notification_read boolean not null default false,primary key(user_id,message_id));
create index on public.phishaware_notification_history(company_id,user_id,created_at desc);
create table public.phishaware_support(id uuid primary key default gen_random_uuid(),company_id text not null references public.phishaware_team(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,name text not null,email text not null,category text not null check(category in ('Complaint','Feedback','Help request')),target text not null check(target in ('company','platform')),subject text not null,message text not null,status text not null default 'open',created_at timestamptz not null default now(),reply text,reply_at timestamptz);
create index on public.phishaware_support(company_id,created_at desc);
create index on public.phishaware_support(user_id,created_at desc);
create table public.phishaware_support_reads(user_id uuid not null references auth.users(id) on delete cascade,support_id uuid not null references public.phishaware_support(id) on delete cascade,primary key(user_id,support_id));
create table public.phishaware_mail_outbox(id uuid primary key default gen_random_uuid(),company_id text not null references public.phishaware_team(id) on delete cascade,event_key text not null,recipient text not null,subject text not null,body text not null,status text not null default 'queued',attempts integer not null default 0,next_attempt_at timestamptz not null default now(),lease_until timestamptz,sent_at timestamptz,last_error text,unique(event_key,recipient));
create index on public.phishaware_mail_outbox(status,next_attempt_at);
alter table public.phishaware_notification_history enable row level security;
alter table public.phishaware_support enable row level security;
alter table public.phishaware_support_reads enable row level security;
alter table public.phishaware_mail_outbox enable row level security;
revoke all on public.phishaware_notification_history,public.phishaware_support,public.phishaware_support_reads,public.phishaware_mail_outbox from public,anon,authenticated;
grant all on public.phishaware_notification_history,public.phishaware_support,public.phishaware_support_reads,public.phishaware_mail_outbox to service_role;
create function public.phishaware_queue_notice(company text,event text,title text,content text,owners_only boolean default false) returns void language sql security invoker set search_path='' as $$
insert into public.phishaware_mail_outbox(company_id,event_key,recipient,subject,body)
select company,event,a.email,title,content from public.phishaware_access a where a.role='Administrator' and a.status in ('approved','sent') and (a.platform_admin or (not owners_only and a.company_id=company)) on conflict(event_key,recipient) do nothing;
$$;
create function public.phishaware_capture_customer_notice() returns trigger language plpgsql security invoker set search_path='' as $$
declare organization text; body text;
begin
 if tg_table_name='phishaware_email_findings' then
  if tg_op='INSERT' and new.risk in ('Medium','High') then
   insert into public.phishaware_notification_history(user_id,company_id,message_id,subject,sender,risk,reasons,recommendation,received_at,notification_read) values(new.user_id,new.company_id,new.message_id,new.subject,new.sender,new.risk,new.reasons,new.recommendation,new.received_at,new.notification_read) on conflict do nothing;
  elsif tg_op='UPDATE' then
   if new.notification_read or new.review_state<>'unreviewed' then update public.phishaware_notification_history set notification_read=true where user_id=new.user_id and message_id=new.message_id;end if;
   if new.review_state='reported' and old.review_state is distinct from 'reported' then
    select state->>'organization' into organization from public.phishaware_team where id=new.company_id;
    perform public.phishaware_queue_notice(new.company_id,'reported:'||new.user_id||':'||new.message_id,'PhishAware: employee reported an email', 'Organization: '||organization||E'\nRisk: '||new.risk||E'\nAn employee reported a suspicious email. Sign in to review the company alert.\nhttps://daniella-and-anthony.terkperkanthony101.workers.dev/');
   end if;
  end if;
 elsif tg_table_name='phishaware_email_alerts' then
  if new.source='automatic' then
   select state->>'organization' into organization from public.phishaware_team where id=new.company_id;
   perform public.phishaware_queue_notice(new.company_id,'automatic:'||new.user_id||':'||new.message_id,'PhishAware: High risk email alert','Organization: '||organization||E'\nA High risk email finding needs review. Sign in for details.\nhttps://daniella-and-anthony.terkperkanthony101.workers.dev/');
  end if;
 elsif tg_table_name='phishaware_support' then
  select state->>'organization' into organization from public.phishaware_team where id=new.company_id;
  perform public.phishaware_queue_notice(new.company_id,'support:'||new.id,'PhishAware: new '||lower(new.category),'Organization: '||organization||E'\nFrom: '||new.name||' <'||new.email||E'>\nA customer submitted a '||lower(new.category)||E'. Sign in to review the request.\nhttps://daniella-and-anthony.terkperkanthony101.workers.dev/',new.target='platform');
  insert into public.phishaware_audit values(gen_random_uuid()::text,new.company_id,now(),new.email,'Support','Submitted a '||lower(new.category),'server');
 end if;
 return new;
end;$$;
create trigger customer_finding_history after insert or update of notification_read,review_state on public.phishaware_email_findings for each row execute function public.phishaware_capture_customer_notice();
create trigger customer_alert_email after insert on public.phishaware_email_alerts for each row execute function public.phishaware_capture_customer_notice();
create trigger customer_support_email after insert on public.phishaware_support for each row execute function public.phishaware_capture_customer_notice();
insert into public.phishaware_notification_history(user_id,company_id,message_id,subject,sender,risk,reasons,recommendation,received_at,notification_read) select user_id,company_id,message_id,subject,sender,risk,reasons,recommendation,received_at,notification_read or review_state<>'unreviewed' from public.phishaware_email_findings where risk in ('Medium','High') on conflict do nothing;
create or replace function public.phishaware_read_notifications(owner uuid,company text,administrator boolean,notification text default null) returns void language plpgsql security invoker set search_path='' as $$ begin
if administrator then insert into public.phishaware_alert_reads(user_id,alert_id,company_id) select owner,a.id,a.company_id from public.phishaware_email_alerts a where a.company_id=company and (notification is null or a.id::text=notification) on conflict do nothing;
else update public.phishaware_notification_history set notification_read=true where user_id=owner and company_id=company and (notification is null or message_id=notification); update public.phishaware_email_findings set notification_read=true where user_id=owner and company_id=company and (notification is null or message_id=notification);end if;end;$$;
create function public.phishaware_notification_count(owner uuid,company text) returns bigint language sql security invoker set search_path='' as $$select count(*) from public.phishaware_notification_history where user_id=owner and company_id=company and not notification_read;$$;
create function public.phishaware_search_notifications(owner uuid,company text,history boolean,query text,page integer) returns setof public.phishaware_notification_history language sql security invoker set search_path='' as $$select * from public.phishaware_notification_history where user_id=owner and company_id=company and notification_read=history and (position(lower(query) in lower(subject||' '||sender||' '||recommendation))>0 or query='') order by created_at desc,message_id limit 101 offset page*100;$$;
create function public.phishaware_claim_mail(batch integer default 5) returns setof public.phishaware_mail_outbox language sql security invoker set search_path='' as $$update public.phishaware_mail_outbox set status='sending',attempts=attempts+1,lease_until=now()+interval '2 minutes' where id in (select id from public.phishaware_mail_outbox where ((status='queued' and next_attempt_at<=now()) or (status='sending' and lease_until<now())) and attempts<8 order by next_attempt_at for update skip locked limit greatest(1,least(batch,5))) returning *;$$;
revoke all on function public.phishaware_queue_notice(text,text,text,text,boolean),public.phishaware_capture_customer_notice(),public.phishaware_notification_count(uuid,text),public.phishaware_search_notifications(uuid,text,boolean,text,integer),public.phishaware_claim_mail(integer) from public,anon,authenticated;
grant execute on function public.phishaware_queue_notice(text,text,text,text,boolean),public.phishaware_capture_customer_notice(),public.phishaware_notification_count(uuid,text),public.phishaware_search_notifications(uuid,text,boolean,text,integer),public.phishaware_claim_mail(integer) to service_role;
