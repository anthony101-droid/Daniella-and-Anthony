CREATE OR REPLACE FUNCTION public.phishaware_complete_email_review(actor uuid, actor_email text, company text, alert_id uuid, outcome text, note text)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare reviewer text; alert public.phishaware_email_alerts; reviewed timestamptz:=now();
begin
 if outcome not in ('safe','action_taken') or length(coalesce(note,''))>1000 or (outcome='action_taken' and length(trim(coalesce(note,'')))<3) then return false; end if;
 -- actor and actor_email come only from the Edge Function verified session.
 select a.email into reviewer from public.phishaware_access a
 where a.email=lower(actor_email) and a.role='Administrator' and a.status in ('approved','sent') and (a.platform_admin or a.company_id=company);
 if not found then return false; end if;
 select * into alert from public.phishaware_email_alerts where id=alert_id and company_id=company and status='open' for update;
 if not found then return false; end if;
 if outcome='safe' then
  note:=format('Your report about "%s" was reviewed by your company administrator and marked safe. Original scan: %s risk. Flagged indicators: %s. No further action is requested for this report.',
   left(coalesce(nullif(alert.subject,''),'(No subject)'),150),
   alert.risk,
   left(coalesce((select string_agg(value,'; ' order by ord) from jsonb_array_elements_text(case when jsonb_typeof(alert.reasons)='array' then alert.reasons else '[]'::jsonb end) with ordinality as reasons(value,ord)),'None recorded'),300))
   ||case when nullif(trim(note),'') is not null then E'\nAdministrator details: '||left(trim(note),300) else '' end;
 end if;
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
end;$function$;

revoke execute on function public.phishaware_complete_email_review(uuid,text,text,uuid,text,text) from public, anon, authenticated;
grant execute on function public.phishaware_complete_email_review(uuid,text,text,uuid,text,text) to service_role;
