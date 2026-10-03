import {mailReady,flushMail} from './email.ts';
import {readBounded} from './security.ts';
import {createClient} from 'npm:@supabase/supabase-js@2.117.2';
import {modules,recordResponse,log,emptyWorkspace,type Workspace} from './platform.ts';
const origin='https://daniella-and-anthony.terkperkanthony101.workers.dev';
const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Vary':'Origin','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
function reply(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers});}
function projection(w:Workspace,id:string):Workspace{const deliveries=w.deliveries.filter(d=>d.employeeId===id),ids=new Set(deliveries.map(d=>d.campaignId));return {...w,employees:w.employees.filter(e=>e.id===id),campaigns:w.campaigns.filter(c=>ids.has(c.id)),deliveries,completions:w.completions.filter(c=>c.employeeId===id),notices:w.notices.filter(n=>n.employeeId===id),events:[]};}
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 try{
  const token=req.headers.get('Authorization')?.replace(/^Bearer /i,'');if(!token)return reply({error:'Sign in required'},401);
  const {data:{user},error:authError}=await db.auth.getUser(token);if(authError||!user?.email_confirmed_at||!user.email)return reply({error:'Verified sign-in required'},401);
  const email=user.email.toLowerCase();const {data:access,error:accessError}=await db.from('phishaware_access').select('*').eq('email',email).maybeSingle();if(accessError)throw accessError;
  if(!access||!['approved','sent'].includes(access.status))return reply({error:'Your account has not been invited. Contact your administrator.'},403);
  const admin=access.role==='Administrator';
  const raw=await readBounded(req,2000000);if(raw.length>2000000)return reply({error:'Request too large'},413);const input=JSON.parse(raw);
  const companyId=typeof input.companyId==='string'?input.companyId:(access.company_id??'main');
  if(companyId!==(access.company_id??'main')&&!access.platform_admin)return reply({error:'Company access denied'},403);
  const {data:allowed,error:rateError}=await db.rpc('phishaware_take_rate',{bucket_key:'platform:'+user.id,max_hits:120,window_seconds:60});
  if(rateError)throw rateError;if(!allowed)return reply({error:'Too many requests. Retry in one minute.'},429);
  if(input.action==='create-company'){
   if(!admin||!access.platform_admin)return reply({error:'Platform administrator required'},403);
   const {data:creationAllowed,error:creationRateError}=await db.rpc('phishaware_take_rate',{bucket_key:'company-create:'+user.id,max_hits:10,window_seconds:3600});if(creationRateError)throw creationRateError;if(!creationAllowed)return reply({error:'Company creation limit reached. Retry in one hour.'},429);
   const name=String(input.name??'').trim(),target=String(input.adminEmail??'').trim().toLowerCase();
   if(name.length<2||name.length>100||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target))return reply({error:'Organization name and valid individual email required'},400);
   const {data:existing,error:existingError}=await db.from('phishaware_access').select('email').eq('email',target).maybeSingle();if(existingError)throw existingError;
   if(existing)return reply({error:'This email already belongs to a workspace. Use an email without an existing workspace.'},409);
   const personName=String(input.personName??'').trim();if(input.personName!==undefined&&(personName.length<2||personName.length>100))return reply({error:'Individual name must contain 2 to 100 characters'},400);
   const id=crypto.randomUUID(),state=emptyWorkspace();state.organization=name;
   if(personName)state.employees.push({id:crypto.randomUUID(),name:personName,email:target,department:'General',active:true,joined:new Date().toISOString()});
   const {error:companyError}=await db.from('phishaware_team').insert({id,state,revision:1,audit_actor:email});if(companyError)throw companyError;
   const {error:memberError}=personName?{error:null}:await db.from('phishaware_access').insert({email:target,company_id:id,role:'Administrator',status:'failed',invited_by:user.id});
   if(memberError){await db.from('phishaware_team').delete().eq('id',id);throw memberError;}
   return reply({companyId:id,name,adminEmail:target});
  }
  const {data:row,error:readError}=await db.from('phishaware_team').select('*').eq('id',companyId).single();if(readError)throw readError;
  const w=row.state as Workspace;const employee=w.employees.find(e=>e.id===access.employee_id&&e.email.toLowerCase()===email&&e.active);
  if(!admin&&!employee)return reply({error:'Employee access is inactive. Contact your administrator.'},403);
  const view=()=>({workspace:admin?w:projection(w,employee!.id),revision:row.revision,role:access.role,employeeId:employee?.id??'',companyId,platformAdmin:!!access.platform_admin});
  if(input.action==='load'){const result=view();if(admin){const {data,error}=await db.from('phishaware_access').select('email,status,last_error,updated_at').eq('role','Employee').eq('company_id',companyId);if(error)throw error;const {data:companies,error:companyError}=await db.from('phishaware_team').select('id,state->>organization').order('updated_at',{ascending:false});if(companyError)throw companyError;return reply({...result,invitations:data,companies:access.platform_admin?companies.map(c=>({id:c.id,name:c.organization})):[],companyAdministrators:access.platform_admin?(await db.from('phishaware_access').select('email,status').eq('company_id',companyId).eq('role','Administrator')).data:[]});}return reply(result);}
  if(input.action==='support-submit'){
   const category=String(input.category??''),target=String(input.target??''),subject=String(input.subject??'').trim(),message=String(input.message??'').trim();
   if(!['Complaint','Feedback','Help request'].includes(category)||!['company','platform'].includes(target)||subject.length<3||subject.length>160||message.length<10||message.length>4000)return reply({error:'Complete the subject and message within the allowed lengths.'},400);
   const {data:permitted,error:limitError}=await db.rpc('phishaware_take_rate',{bucket_key:'support:'+user.id,max_hits:3,window_seconds:3600});if(limitError)throw limitError;if(!permitted)return reply({error:'You have reached the hourly support request limit.'},429);
   const {data:saved,error}=await db.from('phishaware_support').insert({company_id:companyId,user_id:user.id,email,name:employee?.name??'Administrator',category,target,subject,message}).select('id').single();if(error)throw error;await flushMail(db,2).catch(()=>({configured:mailReady(),sent:0,failed:0}));return reply({id:saved.id,saved:true,emailAlertsConfigured:mailReady()});
  }
  if(input.action==='support-list'){
   let query=db.from('phishaware_support').select('id,company_id,name,email,category,target,subject,message,status,created_at,reply,reply_at');
   if(admin)query=access.platform_admin?query.or('company_id.eq.'+companyId+',target.eq.platform'):query.eq('company_id',companyId).eq('target','company');else query=query.eq('user_id',user.id).eq('company_id',companyId);
   const {data,error}=await query.order('created_at',{ascending:false}).limit(100);if(error)throw error;
   const {data:reads,error:readError}=admin?await db.from('phishaware_support_reads').select('support_id').eq('user_id',user.id).limit(10000):{data:[],error:null};if(readError)throw readError;const ids=new Set((reads??[]).map((r:{support_id:string})=>r.support_id));return reply({items:(data??[]).map((r:{id:string})=>({...r,read:ids.has(r.id)})),emailAlertsConfigured:mailReady()});
  }
  if(input.action==='support-read'||input.action==='support-reply'){
   if(!admin)return reply({error:'Administrator access required'},403);
   if(typeof input.id!=='string'||!/^[a-f0-9-]{36}$/i.test(input.id))return reply({error:'Invalid support request'},400);
   const {data:item,error}=await db.from('phishaware_support').select('id,company_id,target').eq('id',input.id).maybeSingle();if(error)throw error;if(!item||(!access.platform_admin&&(item.company_id!==companyId||item.target!=='company')))return reply({error:'Support request unavailable'},403);
   if(input.action==='support-read'){const {error}=await db.from('phishaware_support_reads').upsert({user_id:user.id,support_id:item.id});if(error)throw error;return reply({saved:true});}
   const text=String(input.reply??'').trim();if(text.length<3||text.length>4000)return reply({error:'Enter a reply of 3 to 4000 characters.'},400);const {error:updateError}=await db.from('phishaware_support').update({reply:text,reply_at:new Date().toISOString(),status:'answered'}).eq('id',item.id);if(updateError)throw updateError;return reply({saved:true});
  }
  if(input.action==='admin-metrics'){
   if(!admin)return reply({error:'Administrator access required'},403);
   if(typeof input.start!=='string'||typeof input.end!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(input.start)||!/^\d{4}-\d{2}-\d{2}$/.test(input.end)||!Number.isFinite(Date.parse(input.start))||!Number.isFinite(Date.parse(input.end))||Date.parse(input.end)<Date.parse(input.start)||Date.parse(input.end)-Date.parse(input.start)>366*86400000)return reply({error:'Select a valid report period of up to one year'},400);
   const {data,error}=await db.from('phishaware_daily_metrics').select('day,scanned,low,medium,high,alerts,reports').eq('company_id',companyId).gte('day',input.start).lt('day',input.end).order('day');if(error)throw error;
   const {data:first,error:firstError}=await db.from('phishaware_daily_metrics').select('day').eq('company_id',companyId).order('day').limit(1);if(firstError)throw firstError;
   return reply({workspace:w,days:data,coverageStart:first?.[0]?.day??null});
  }
  if(input.action==='audit'){
   if(!admin)return reply({error:'Administrator access required'},403);
   const page=Number(input.page??0);if(!Number.isInteger(page)||page<0||page>100000)return reply({error:'Invalid audit page'},400);
   const {data,error}=await db.from('phishaware_audit').select('id,date,actor,category,action,source').eq('company_id',companyId).order('date',{ascending:false}).order('id').range(page*100,page*100+100);if(error)throw error;
   return reply({events:(data??[]).slice(0,100),hasMore:(data??[]).length>100});
  }
  if(input.action==='invite-admin'){
   if(!admin)return reply({error:'Administrator access required'},403);
   const {data:inviteAllowed,error:inviteRateError}=await db.rpc('phishaware_take_rate',{bucket_key:'admin-invite:'+user.id+':'+String(input.email),max_hits:1,window_seconds:60});if(inviteRateError)throw inviteRateError;if(!inviteAllowed)return reply({error:'Wait one minute before resending.'},429);
   const {data:target,error}=await db.from('phishaware_access').select('email').eq('email',input.email).eq('role','Administrator').eq('company_id',companyId).maybeSingle();
   if(error)throw error;if(!target)return reply({error:'Approved administrator required'},403);
   let result=await db.auth.admin.inviteUserByEmail(target.email,{redirectTo:origin+'/'});
   if(result.error&&/already.*registered/i.test(result.error.message)){const recovery=await db.auth.resetPasswordForEmail(target.email,{redirectTo:origin+'/'});if(!recovery.error)await db.from('phishaware_access').update({status:'sent'}).eq('email',target.email);return reply(recovery.error?{error:recovery.error.message}:{sent:true},recovery.error?400:200);}
   if(!result.error)await db.from('phishaware_access').update({status:'sent'}).eq('email',target.email);return reply(result.error?{error:result.error.message}:{sent:true},result.error?400:200);
  }
  if(input.action==='invite'){
   if(!admin)return reply({error:'Administrator access required'},403);
   const ids=input.employeeIds;if(!Array.isArray(ids)||ids.length<1||ids.length>20)return reply({error:'Select between 1 and 20 employees'},400);
   const outcomes=[];
   for(const id of [...new Set(ids)]){
    const e=w.employees.find(e=>e.id===id&&e.active);if(!e||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email)){outcomes.push({id,error:'Active employee with a valid email required'});continue;}
    const target=e.email.toLowerCase();const {data:prior,error:priorError}=await db.from('phishaware_access').select('*').eq('email',target).maybeSingle();if(priorError)throw priorError;
    if(prior&&prior.company_id!==companyId){outcomes.push({id,error:'This email belongs to another company'});continue;}
    if(prior?.role==='Administrator'){outcomes.push({id,error:'This email is an administrator'});continue;}
    if(prior&&Date.now()-new Date(prior.updated_at).getTime()<60000){outcomes.push({id,error:'Wait one minute before resending'});continue;}
    const {data:prepared,error:writeError}=await db.rpc('phishaware_prepare_invite',{target_email:target,company:companyId,employee:e.id,inviter:user.id});if(writeError)throw writeError;if(!prepared){outcomes.push({id,error:'Invitation unavailable or recently sent. Retry in one minute.'});continue;}
    let {error}=await db.auth.admin.inviteUserByEmail(target,{redirectTo:origin+'/'});
    if(error&&(error.code==='email_exists'||/already.*registered/i.test(error.message))){const result=await db.auth.resetPasswordForEmail(target,{redirectTo:origin+'/'});error=result.error;}
    const {error:updateError}=await db.from('phishaware_access').update({status:error?(prior?.status==='sent'?'sent':'failed'):'sent',last_error:error?.message??null,updated_at:new Date().toISOString()}).eq('email',target).eq('company_id',companyId);if(updateError)throw updateError;
    outcomes.push({id,email:target,sent:!error,error:error?.message});
   }
   return reply({outcomes});
  }
  let next:Workspace;
  if(input.action==='save'){
   if(!admin)return reply({error:'Administrator access required'},403);
   if(input.revision!==row.revision)return reply({error:'Workspace changed. Reload before saving.'},409);
   next=input.workspace;
   if(!next||next.version!==1||typeof next.organization!=='string'||!['employees','campaigns','deliveries','completions','events','notices'].every(k=>Array.isArray((next as unknown as Record<string,unknown>)[k])))return reply({error:'Invalid workspace'},400);
   if(next.employees.some(e=>typeof e.email!=='string'||typeof e.id!=='string')||new Set(next.employees.map(e=>e.email.toLowerCase())).size!==next.employees.length)return reply({error:'Employee emails must be unique'},400);
  }else if(input.action==='employee'){
   if(admin)return reply({error:'Employee account required'},403);
   next=structuredClone(w);
   if(input.kind==='response'){if(!['opened','clicked','reported'].includes(input.response))return reply({error:'Invalid response'},400);recordResponse(next,input.deliveryId,employee!.id,input.response);}
   else if(input.kind==='notice'){const n=next.notices.find(n=>n.id===input.noticeId&&n.employeeId===employee!.id);if(!n)return reply({error:'Notice unavailable'},403);n.read=true;}
   else if(input.kind==='quiz'){
    const module=modules.find(m=>m.id===input.moduleId);if(!module||!Array.isArray(input.answers)||input.answers.length!==module.questions.length||input.answers.some((a:unknown)=>!Number.isInteger(a)))return reply({error:'Complete all quiz answers'},400);
    const score=Math.round(module.questions.filter((q,i)=>q.answer===input.answers[i]).length/module.questions.length*100);
    const c=next.completions.find(c=>c.employeeId===employee!.id&&c.moduleId===module.id);if(c){c.score=Math.max(c.score,score);c.attempts++;c.date=new Date().toISOString();}else next.completions.push({employeeId:employee!.id,moduleId:module.id,score,attempts:1,date:new Date().toISOString()});log(next,employee!.name,`Submitted ${module.title}: ${score}%`,'Training');
   }else return reply({error:'Invalid employee action'},400);
  }else return reply({error:'Unknown action'},400);
  const {data:saved,error:saveError}=await db.from('phishaware_team').update({state:next,audit_actor:email,revision:row.revision+1,updated_at:new Date().toISOString()}).eq('id',companyId).eq('revision',row.revision).select('revision').maybeSingle();if(saveError)throw saveError;if(!saved)return reply({error:'Workspace changed. Retry after reloading.'},409);
  return reply({workspace:admin?next:projection(next,employee!.id),revision:saved.revision});
 }catch(error){if(error instanceof Error&&error.message==='Request too large')return reply({error:error.message},413);return reply({error:error instanceof Error&&!('code' in error)?error.message:'Request failed. Please retry.'},400);}
});
