create table public.phishaware_course_certificates(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 company_id text not null references public.phishaware_team(id) on delete cascade,employee_id text not null,
 course_id text not null,course_title text not null,employee_name text not null,company_name text not null,
 issued_at timestamptz not null default now(),module_ids text[] not null,
 unique(user_id,company_id,course_id)
);
alter table public.phishaware_course_certificates enable row level security;
revoke all on public.phishaware_course_certificates from public,anon,authenticated;
grant all on public.phishaware_course_certificates to service_role;
create index on public.phishaware_course_certificates(company_id,issued_at desc);
create function public.phishaware_award_course(owner uuid,company text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare a public.phishaware_access;w jsonb;e jsonb;verified_email text;certificate public.phishaware_course_certificates;
required_modules text[]:=array['senders','links','report','finance','accounts','mobile','sharing','protection'];new_id uuid;
begin
 select email into verified_email from auth.users where id=owner;
 select * into a from public.phishaware_access where email=lower(verified_email);
 if a.role is distinct from 'Employee' or a.status not in ('approved','sent') or a.company_id is distinct from company then return null;end if;
 select state into w from public.phishaware_team where id=company;
 select item into e from jsonb_array_elements(w->'employees') item where item->>'id'=a.employee_id and lower(item->>'email')=lower(verified_email) and item->>'active'='true';
 if e is null then return null;end if;
 select * into certificate from public.phishaware_course_certificates where user_id=owner and company_id=company and course_id='employee-awareness-v1';
 if certificate.id is null then
  if exists(select 1 from unnest(required_modules) required where not exists(select 1 from jsonb_array_elements(w->'completions') c where c->>'employeeId'=a.employee_id and c->>'moduleId'=required and (case when jsonb_typeof(c->'score')='number' then (c->>'score')::numeric else 0 end) between 80 and 100)) then return null;end if;
  insert into public.phishaware_course_certificates(user_id,company_id,employee_id,course_id,course_title,employee_name,company_name,module_ids)
   values(owner,company,a.employee_id,'employee-awareness-v1','Employee Phishing Awareness',e->>'name',w->>'organization',required_modules)
   on conflict(user_id,company_id,course_id) do nothing returning id into new_id;
  if new_id is not null then insert into public.phishaware_audit values(gen_random_uuid()::text,company,now(),verified_email,'Training','Issued PhishAware course completion record','server');end if;
  select * into certificate from public.phishaware_course_certificates where user_id=owner and company_id=company and course_id='employee-awareness-v1';
 end if;
 return jsonb_build_object('id',certificate.id,'courseTitle',certificate.course_title,'employeeName',certificate.employee_name,'companyName',certificate.company_name,'issuedAt',certificate.issued_at,'moduleIds',certificate.module_ids);
end;$$;
revoke all on function public.phishaware_award_course(uuid,text) from public,anon,authenticated;
grant execute on function public.phishaware_award_course(uuid,text) to service_role;
