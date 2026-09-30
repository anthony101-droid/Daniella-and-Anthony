import {createClient} from 'npm:@supabase/supabase-js@2.117.2';
import {modules,recordResponse,log,type Workspace} from './platform.ts';
const origin='https://daniella-and-anthony.terkperkanthony101.workers.dev';
const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Vary':'Origin'};
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
  const raw=await req.text();if(raw.length>2000000)return reply({error:'Request too large'},413);const input=JSON.parse(raw);
  const {data:row,error:readError}=await db.from('phishaware_team').select('*').eq('id','main').single();if(readError)throw readError;
  const w=row.state as Workspace;const employee=w.employees.find(e=>e.id===access.employee_id&&e.email.toLowerCase()===email&&e.active);
  if(!admin&&!employee)return reply({error:'Employee access is inactive. Contact your administrator.'},403);
  const view=()=>({workspace:admin?w:projection(w,employee!.id),revision:row.revision,role:access.role,employeeId:employee?.id??'',invitations:admin?undefined:undefined});
  if(input.action==='load'){const result=view();if(admin){const {data,error}=await db.from('phishaware_access').select('email,status,last_error,updated_at').eq('role','Employee');if(error)throw error;return reply({...result,invitations:data});}return reply(result);}
  if(input.action==='invite-admin'){
   if(!admin)return reply({error:'Administrator access required'},403);
   const {data:target,error}=await db.from('phishaware_access').select('email').eq('email',input.email).eq('role','Administrator').eq('status','approved').maybeSingle();
   if(error)throw error;if(!target)return reply({error:'Approved administrator required'},403);
   let result=await db.auth.admin.inviteUserByEmail(target.email,{redirectTo:origin+'/'});
   if(result.error&&/already.*registered/i.test(result.error.message)){const recovery=await db.auth.resetPasswordForEmail(target.email,{redirectTo:origin+'/'});return reply(recovery.error?{error:recovery.error.message}:{sent:true},recovery.error?400:200);}
   return reply(result.error?{error:result.error.message}:{sent:true},result.error?400:200);
  }
  if(input.action==='invite'){
   if(!admin)return reply({error:'Administrator access required'},403);
   const ids=input.employeeIds;if(!Array.isArray(ids)||ids.length<1||ids.length>20)return reply({error:'Select between 1 and 20 employees'},400);
   const outcomes=[];
   for(const id of [...new Set(ids)]){
    const e=w.employees.find(e=>e.id===id&&e.active);if(!e||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email)){outcomes.push({id,error:'Active employee with a valid email required'});continue;}
    const target=e.email.toLowerCase();const {data:prior,error:priorError}=await db.from('phishaware_access').select('*').eq('email',target).maybeSingle();if(priorError)throw priorError;
    if(prior?.role==='Administrator'){outcomes.push({id,error:'This email is an administrator'});continue;}
    if(prior&&Date.now()-new Date(prior.updated_at).getTime()<60000){outcomes.push({id,error:'Wait one minute before resending'});continue;}
    const {error:writeError}=await db.from('phishaware_access').upsert({email:target,role:'Employee',employee_id:e.id,invited_by:user.id,status:prior?.status==='sent'?'sent':'sending',last_error:null,updated_at:new Date().toISOString()});if(writeError)throw writeError;
    let {error}=await db.auth.admin.inviteUserByEmail(target,{redirectTo:origin+'/'});
    if(error&&(error.code==='email_exists'||/already.*registered/i.test(error.message))){const result=await db.auth.resetPasswordForEmail(target,{redirectTo:origin+'/'});error=result.error;}
    const {error:updateError}=await db.from('phishaware_access').update({status:error?(prior?.status==='sent'?'sent':'failed'):'sent',last_error:error?.message??null,updated_at:new Date().toISOString()}).eq('email',target);if(updateError)throw updateError;
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
  const {data:saved,error:saveError}=await db.from('phishaware_team').update({state:next,revision:row.revision+1,updated_at:new Date().toISOString()}).eq('id','main').eq('revision',row.revision).select('revision').maybeSingle();if(saveError)throw saveError;if(!saved)return reply({error:'Workspace changed. Retry after reloading.'},409);
  return reply({workspace:admin?next:projection(next,employee!.id),revision:saved.revision});
 }catch(error){return reply({error:error instanceof Error?error.message:'Request failed. Please retry.'},400);}
});
