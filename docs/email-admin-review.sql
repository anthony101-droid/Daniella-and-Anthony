-- Employee review requests and administrator decisions. Private, server-only RPCs.
alter table public.phishaware_email_alerts add column if not exists request_kind text not null default 'report' check(request_kind in ('review','report'));
alter table public.phishaware_email_alerts add column if not exists review_outcome text check(review_outcome in ('safe','action_taken'));
alter table public.phishaware_email_alerts add column if not exists review_note text;
alter table public.phishaware_email_alerts add column if not exists resolved_by uuid references auth.users(id) on delete set null;
alter table public.phishaware_notification_history add column if not exists review_outcome text check(review_outcome in ('safe','action_taken'));
alter table public.phishaware_notification_history add column if not exists review_note text;
alter table public.phishaware_notification_history add column if not exists admin_reviewed_at timestamptz;
alter table public.phishaware_email_findings add column if not exists review_outcome text check(review_outcome in ('safe','action_taken'));
alter table public.phishaware_email_findings add column if not exists review_note text;
alter table public.phishaware_email_findings add column if not exists admin_reviewed_at timestamptz;

create or replace function public.phishaware_review_finding(owner uuid,company text,message text,decision text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare alert public.phishaware_email_alerts; previous text;
begin
 if decision not in ('reviewed','reported') then return false; end if;
 perform 1 from public.phishaware_mailboxes where user_id=owner and company_id=company for update;
 if not found then return false; end if;
 select review_state into previous from public.phishaware_email_findings where user_id=owner and company_id=company and message_id=message for update;
 if not found then return false; end if;
 select * into alert from public.phishaware_email_alerts where user_id=owner and message_id=message;
 -- A duplicate click must not reopen an administrator's completed review.
 if alert.status='resolved' then return true; end if;
 update public.phishaware_email_findings set review_state=case when previous='reported' then previous else decision end,reviewed_at=now()
 where user_id=owner and company_id=company and message_id=message;
 insert into public.phishaware_email_alerts(user_id,message_id,company_id,employee_email,subject,sender,risk,reasons,recommendation,source,request_kind)
 select f.user_id,f.message_id,f.company_id,m.email,f.subject,f.sender,f.risk,f.reasons,f.recommendation,'employee',case when decision='reviewed' then 'review' else 'report' end
 from public.phishaware_email_findings f join public.phishaware_mailboxes m on m.user_id=f.user_id and m.company_id=f.company_id
 where f.user_id=owner and f.company_id=company and f.message_id=message
 on conflict(user_id,message_id) do update set request_kind=case when excluded.request_kind='report' then 'report' else phishaware_email_alerts.request_kind end;
 if decision='reviewed' and previous='unreviewed' then
  perform public.phishaware_queue_notice(company,'review-request:'||owner||':'||message,'PhishAware: email review requested',E'An employee requested an email review. Sign in to Notifications to review the summary.\nhttps://daniella-and-anthony.terkperkanthony101.workers.dev/');
 end if;
 return true;
end;$$;

create or replace function public.phishaware_complete_email_review(actor uuid,actor_email text,company text,alert_id uuid,outcome text,note text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare reviewer text; alert public.phishaware_email_alerts; reviewed timestamptz:=now();
begin
 if outcome not in ('safe','action_taken') or length(coalesce(note,''))>1000 or (outcome='action_taken' and length(trim(coalesce(note,'')))<3) then return false; end if;
 -- actor and actor_email come only from the Edge Function verified session.
 select a.email into reviewer from public.phishaware_access a
 where a.email=lower(actor_email) and a.role='Administrator' and a.status in ('approved','sent') and (a.platform_admin or a.company_id=company);
 if not found then return false; end if;
 select * into alert from public.phishaware_email_alerts where id=alert_id and company_id=company and status='open' for update;
 if not found then return false; end if;
 update public.phishaware_email_alerts set status='resolved',resolved_at=reviewed,resolved_by=actor,review_outcome=outcome,review_note=nullif(trim(note),'') where id=alert.id;
 -- Preserve the scan rating and show the administrator decision separately.
 update public.phishaware_email_findings set notification_read=true,review_outcome=outcome,review_note=nullif(trim(note),''),admin_reviewed_at=reviewed where user_id=alert.user_id and message_id=alert.message_id and company_id=company;
 insert into public.phishaware_notification_history(user_id,company_id,message_id,subject,sender,risk,reasons,recommendation,received_at,created_at,notification_read,review_outcome,review_note,admin_reviewed_at)
 select f.user_id,f.company_id,f.message_id,f.subject,f.sender,f.risk,f.reasons,f.recommendation,f.received_at,reviewed,false,outcome,nullif(trim(note),''),reviewed
 from public.phishaware_email_findings f where f.user_id=alert.user_id and f.message_id=alert.message_id and f.company_id=company
 on conflict(user_id,message_id) do update set created_at=excluded.created_at,notification_read=false,review_outcome=excluded.review_outcome,review_note=excluded.review_note,admin_reviewed_at=excluded.admin_reviewed_at;
 insert into public.phishaware_audit(id,company_id,date,actor,category,action,source)
 values(gen_random_uuid()::text,company,reviewed,reviewer,'Email review',case when outcome='safe' then 'Reviewed email and marked safe' else 'Reviewed email and recorded action taken' end,'server');
 return true;
end;$$;
revoke all on function public.phishaware_complete_email_review(uuid,text,text,uuid,text,text),public.phishaware_review_finding(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.phishaware_complete_email_review(uuid,text,text,uuid,text,text),public.phishaware_review_finding(uuid,text,text,text) to service_role;

-- Remove the unused earlier signature, which depended on direct Auth table reads.
drop function if exists public.phishaware_complete_email_review(uuid,text,uuid,text,text);
