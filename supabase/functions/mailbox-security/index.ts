import {mailReady,flushMail} from './email.ts';
import {readBounded} from './security.ts';
import {createClient} from 'npm:@supabase/supabase-js@2.117.2';
import {summarizeMessage,type GmailMessage} from './analysis.ts';
const origin='https://daniella-and-anthony.terkperkanthony101.workers.dev';
const scope='https://www.googleapis.com/auth/gmail.readonly';
const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'};
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const enc=new TextEncoder();
const b64=(a:Uint8Array)=>btoa(String.fromCharCode(...a)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const bytes=(s:string)=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const random=()=>b64(crypto.getRandomValues(new Uint8Array(32)));
const hash=async(s:string)=>b64(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s))));
function configured(){return !!(Deno.env.get('GOOGLE_CLIENT_ID')&&Deno.env.get('GOOGLE_CLIENT_SECRET')&&Deno.env.get('MAILBOX_ENCRYPTION_KEY'));}
async function key(){const value=bytes(Deno.env.get('MAILBOX_ENCRYPTION_KEY')??'');if(value.length!==32)throw Error('Email connection is not configured.');return crypto.subtle.importKey('raw',value,'AES-GCM',false,['encrypt','decrypt']);}
async function seal(value:unknown,context:string){const iv=crypto.getRandomValues(new Uint8Array(12)),cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode(context)},await key(),enc.encode(JSON.stringify(value)));return b64(iv)+'.'+b64(new Uint8Array(cipher));}
async function unseal(value:string,context:string){const [iv,cipher]=value.split('.');return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(iv),additionalData:enc.encode(context)},await key(),bytes(cipher))));}
async function googleToken(fields:Record<string,string>){const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({...fields,client_id:Deno.env.get('GOOGLE_CLIENT_ID')!,client_secret:Deno.env.get('GOOGLE_CLIENT_SECRET')!}),signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Google authorization expired or failed. Reconnect your mailbox.');return r.json();}
async function gmail(path:string,token:string){const r=await fetch('https://gmail.googleapis.com/gmail/v1/users/me/'+path,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error(r.status===401||r.status===403?'Google authorization expired or failed. Reconnect your mailbox.':'Gmail is unavailable. Try scanning again later.');return r.json();}
async function eligibility(userId:string,email:string,company:string){const {data:a,error}=await db.from('phishaware_access').select('*').eq('email',email.toLowerCase()).eq('company_id',company).maybeSingle();if(error)throw Error('Access check failed.');if(!a||!['approved','sent'].includes(a.status))throw Error('Mailbox access is not authorized.');if(a.role==='Employee'){const {data:t,error}=await db.from('phishaware_team').select('state').eq('id',company).single();if(error||!t.state.employees.some((e:{id:string;email:string;active:boolean})=>e.id===a.employee_id&&e.email.toLowerCase()===email.toLowerCase()&&e.active))throw Error('Employee access is inactive.');}return a;}
async function scan(box:{user_id:string;company_id:string;email:string;token_cipher:string;last_scan_at:string|null;scan_page_token?:string|null;scan_since?:number|null;scan_cutoff?:number|null}){
 // Atomic lease prevents concurrent cron/manual scans using the same refresh token.
 const now=new Date().toISOString();const {data:lease,error}=await db.from('phishaware_mailboxes').update({lease_until:new Date(Date.now()+240000).toISOString()}).eq('user_id',box.user_id).eq('status','connected').or('lease_until.is.null,lease_until.lt.'+now).select('user_id').maybeSingle();if(error)throw Error('Unable to start scan.');if(!lease)return {busy:true};
 try{
  await eligibility(box.user_id,box.email,box.company_id);
  const credentials=await unseal(box.token_cipher,box.user_id+':'+box.company_id);
  const tokens=await googleToken({grant_type:'refresh_token',refresh_token:credentials.refresh_token});
  if(tokens.refresh_token){const {error}=await db.from('phishaware_mailboxes').update({token_cipher:await seal({refresh_token:tokens.refresh_token},box.user_id+':'+box.company_id)}).eq('user_id',box.user_id);if(error)throw Error('Unable to update connection.');}
  // Read-only, paginated polling. Two-hour overlap protects against delivery/indexing delays.
  const started=Date.now(),since=box.scan_since??(box.last_scan_at?Math.floor(new Date(box.last_scan_at).getTime()/1000)-7200:Math.floor(Date.now()/1000)-86400),cutoff=box.scan_cutoff??Math.floor(Date.now()/1000)+1;
  let page=box.scan_page_token??'',processed=0,partial=false;
  do{
   const list=await gmail('messages?'+new URLSearchParams({q:'in:inbox after:'+since+' before:'+cutoff,maxResults:'50',...(page?{pageToken:page}:{})}),tokens.access_token);
   for(const m of list.messages??[]){
    if(Date.now()-started>60000){partial=true;break;}
    const {data:seen,error}=await db.from('phishaware_email_findings').select('message_id').eq('user_id',box.user_id).eq('message_id',m.id).maybeSingle();if(error)throw Error('Unable to read findings.');if(seen)continue;
    const message=await gmail('messages/'+encodeURIComponent(m.id)+'?format=full',tokens.access_token) as GmailMessage;
    const {error:saveError}=await db.rpc('phishaware_store_finding',{owner:box.user_id,company:box.company_id,finding:summarizeMessage(message)});if(saveError)throw Error('Unable to save findings.');processed++;
   }
   if(!partial)page=list.nextPageToken??'';
  }while(false);
  // Keep cursor unchanged on a backlog, so the next pass processes the remaining messages.
  const {error:saveError}=await db.from('phishaware_mailboxes').update({...((page||partial)?{scan_page_token:page,scan_since:since,scan_cutoff:cutoff}:{last_scan_at:new Date(cutoff*1000).toISOString(),scan_page_token:null,scan_since:null,scan_cutoff:null}),last_error:null,scan_after:new Date(Date.now()+60000).toISOString(),lease_until:null}).eq('user_id',box.user_id).eq('status','connected');if(saveError)throw Error('Unable to finish scan.');return {processed,backlog:!!page||partial};
 }catch(e){const message=e instanceof Error?e.message:'Scan failed.';await db.from('phishaware_mailboxes').update({last_error:message,lease_until:null,scan_after:new Date(Date.now()+300000).toISOString(),...(message.startsWith('Google authorization')?{status:'reconnect'}:{})}).eq('user_id',box.user_id);throw e;}
}
function reply(data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers});}
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers});if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 try{
  const raw=await readBounded(req,16000);if(raw.length>16000)return reply({error:'Request too large'},413);const input=JSON.parse(raw);
  if(input.action==='worker'){
   const secret=Deno.env.get('MAILBOX_WORKER_SECRET');if(!secret||req.headers.get('Authorization')!=='Bearer '+secret)return reply({error:'Worker authorization required'},401);
   if(!configured())return reply({error:'Google email scanning is not configured.'},503);
   const {data:boxes,error}=await db.from('phishaware_mailboxes').select('*').eq('status','connected').lte('scan_after',new Date().toISOString()).order('scan_after').limit(1);if(error)throw Error('Unable to load pending scans.');
   let scanned=0,failed=0;for(const box of boxes??[]){try{await scan(box);scanned++;}catch{failed++;}}
   await db.from('phishaware_email_findings').delete().lt('scanned_at',new Date(Date.now()-30*86400000).toISOString());
   await db.from('phishaware_oauth_states').delete().lt('expires_at',new Date().toISOString());
   await db.from('phishaware_rate_limits').delete().lt('window_start',new Date(Date.now()-86400000).toISOString());
   const delivery=await flushMail(db,3);return reply({scanned,failed,delivery});
  }
  const jwt=req.headers.get('Authorization')?.replace(/^Bearer /i,'');if(!jwt)return reply({error:'Sign in required'},401);
  const {data:{user},error}=await db.auth.getUser(jwt);if(error||!user?.email||!user.email_confirmed_at)return reply({error:'Verified sign-in required'},401);
  if(input.action==='disconnect'){
   const {data:box,error:connectionError}=await db.from('phishaware_mailboxes').select('*').eq('user_id',user.id).maybeSingle();if(connectionError)throw Error('Unable to load connection.');
   // Remove local tokens and findings even when Google revocation is unavailable.
   if(box){try{const t=await unseal(box.token_cipher,user.id+':'+box.company_id);await fetch('https://oauth2.googleapis.com/revoke',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token:t.refresh_token}),signal:AbortSignal.timeout(10000)});}catch{}}
   for(const table of ['phishaware_oauth_states','phishaware_mailboxes','phishaware_email_findings','phishaware_notification_history']){const {error}=await db.from(table).delete().eq('user_id',user.id);if(error)throw Error('Unable to remove connection data. Try again.');}return reply({disconnected:true});
  }
  const {data:a,error:accessError}=await db.from('phishaware_access').select('company_id,role,platform_admin').eq('email',user.email.toLowerCase()).maybeSingle();if(accessError||!a)return reply({error:'Invited account required'},403);
  const company=a.company_id;await eligibility(user.id,user.email,company);
  const alertCompany=typeof input.companyId==='string'?input.companyId:company;
  if(alertCompany!==company&&!a.platform_admin)return reply({error:'Company access denied'},403);
  const {data:allowed,error:rateError}=await db.rpc('phishaware_take_rate',{bucket_key:'mailbox:'+user.id,max_hits:30,window_seconds:60});if(rateError)throw Error('Unable to check request limits.');if(!allowed)return reply({error:'Too many requests. Retry in one minute.'},429);
  const {data:box,error:boxError}=await db.from('phishaware_mailboxes').select('*').eq('user_id',user.id).eq('company_id',company).maybeSingle();if(boxError)throw Error('Unable to load connection.');
  if(input.action==='notifications'){
   const page=Number(input.page??0),query=String(input.query??'');if(!Number.isInteger(page)||page<0||page>100000||query.length>100)return reply({error:'Invalid notification search'},400);
   const {data,error}=await db.rpc('phishaware_search_notifications',{owner:user.id,company,history:input.history===true,query,page});if(error)throw Error('Unable to search notification history.');return reply({items:(data??[]).slice(0,100),hasMore:(data??[]).length>100});
  }
  if(input.action==='status'){
   const {data:findings,error}=await db.from('phishaware_email_findings').select('message_id,subject,sender,received_at,scanned_at,risk,reasons,recommendation,review_state,reviewed_at,review_requested_at,notification_read,review_outcome,review_note,admin_reviewed_at').eq('user_id',user.id).eq('company_id',company).order('received_at',{ascending:false}).limit(100);if(error)throw Error('Unable to load findings.');
   const {data:alerts,error:alertsError}=a.role==='Administrator'?await db.from('phishaware_email_alerts').select('id,message_id,employee_email,subject,sender,risk,reasons,recommendation,source,status,created_at,resolved_at,request_kind,review_outcome,review_note').eq('company_id',alertCompany).order('status').order('created_at',{ascending:false}).limit(100):{data:[],error:null};
   if(alertsError)throw Error('Unable to load notifications.');
   const {data:reads,error:readsError}=a.role==='Administrator'?await db.from('phishaware_alert_reads').select('alert_id').eq('user_id',user.id).eq('company_id',alertCompany).limit(10000):{data:[],error:null};if(readsError)throw Error('Unable to load notification receipts.');const readIds=new Set((reads??[]).map((r:{alert_id:string})=>r.alert_id));
   const {data:notificationCount,error:countError}=await db.rpc('phishaware_notification_count',{owner:user.id,company});if(countError)throw Error('Unable to count notifications.');
   return reply({notificationCount:Number(notificationCount),emailAlertsConfigured:mailReady(),alerts:a.role==='Administrator'?(alerts??[]).map((r:{id:string})=>({...r,notification_read:readIds.has(r.id)})):[],configured:configured(),automaticScanning:Deno.env.get('MAILBOX_SCHEDULE_ENABLED')==='true',connection:box?{email:box.email,status:box.status,connectedAt:box.connected_at,lastScanAt:box.last_scan_at,lastError:box.last_error}:null,findings});
  }
  if(input.action==='read-notification'){
   if(input.all!==true && (a.role==='Administrator'?typeof input.alertId!=='string'||!/^[a-f0-9-]{36}$/i.test(input.alertId):typeof input.messageId!=='string'||!input.messageId||input.messageId.length>200))return reply({error:'Invalid notification'},400);
   const {error}=await db.rpc('phishaware_read_notifications',{owner:user.id,company:a.role==='Administrator'?alertCompany:company,administrator:a.role==='Administrator',notification:input.all===true?null:a.role==='Administrator'?input.alertId:input.messageId});
   if(error)throw Error('Unable to mark notifications as read.');return reply({read:true});
  }
  if(input.action==='review'){
   if(typeof input.messageId!=='string'||!input.messageId||input.messageId.length>200||!['reviewed','reported'].includes(input.decision))return reply({error:'Invalid review'},400);
   const {data:saved,error}=await db.rpc('phishaware_review_finding',{owner:user.id,company,message:input.messageId,decision:input.decision});
   if(error)throw Error('Unable to save review.');if(!saved)return reply({error:'Email finding unavailable'},404);await flushMail(db,2).catch(()=>({configured:mailReady(),sent:0,failed:0}));return reply({saved:true,emailAlertsConfigured:mailReady()});
  }
  if(input.action==='resolve-alert'){
   if(a.role!=='Administrator')return reply({error:'Administrator access required'},403);
   if(typeof input.alertId!=='string'||!/^[a-f0-9-]{36}$/i.test(input.alertId))return reply({error:'Invalid alert'},400);
   const outcome=input.outcome??'action_taken',note=typeof input.note==='string'?input.note.trim():'';
   if(!['safe','action_taken'].includes(outcome)||note.length>1000||(outcome==='action_taken'&&note.length<3))return reply({error:'Choose a review outcome and describe the action taken.'},400);
   const {data:saved,error}=await db.rpc('phishaware_complete_email_review',{actor:user.id,actor_email:user.email.toLowerCase(),company:alertCompany,alert_id:input.alertId,outcome,note});
   if(error)throw Error('Unable to complete email review.');if(!saved)return reply({error:'Open company alert unavailable or access denied'},409);return reply({resolved:true});
  }
  if(!configured())return reply({error:'Google email connection is awaiting administrator setup.'},503);
  if(input.action==='connect'){
   if(box)return reply({error:'Disconnect the existing mailbox before reconnecting.'},409);
   const state=random(),verifier=random();
   const {error}=await db.from('phishaware_oauth_states').insert({state_hash:await hash(state),user_id:user.id,company_id:company,verifier_cipher:await seal({verifier},user.id+':'+company),expires_at:new Date(Date.now()+600000).toISOString()});if(error)throw Error('Unable to start Google connection.');
   const params=new URLSearchParams({client_id:Deno.env.get('GOOGLE_CLIENT_ID')!,redirect_uri:origin+'/',response_type:'code',scope,access_type:'offline',prompt:'consent',state,code_challenge:await hash(verifier),code_challenge_method:'S256',login_hint:user.email});
   return reply({url:'https://accounts.google.com/o/oauth2/v2/auth?'+params});
  }
  if(input.action==='complete'){
   if(box)return reply({error:'A mailbox is already connected.'},409);
   if(typeof input.state!=='string'||typeof input.code!=='string'||input.state.length>200||input.code.length>4096)return reply({error:'Invalid Google callback'},400);
   const {data:s,error}=await db.from('phishaware_oauth_states').update({claimed:true}).eq('claimed',false).eq('state_hash',await hash(input.state)).eq('user_id',user.id).eq('company_id',company).gt('expires_at',new Date().toISOString()).select('*').maybeSingle();if(error||!s)return reply({error:'Connection link expired or already used. Start again.'},400);
   const {verifier}=await unseal(s.verifier_cipher,user.id+':'+company);
   const tokens=await googleToken({grant_type:'authorization_code',code:input.code,code_verifier:verifier,redirect_uri:origin+'/'});
   if(!tokens.refresh_token||!tokens.scope?.split(' ').includes(scope))throw Error('Google email read permission was not granted. Start again.');
   const profile=await gmail('profile',tokens.access_token);
   if(profile.emailAddress.toLowerCase()!==user.email.toLowerCase()){
    await fetch('https://oauth2.googleapis.com/revoke',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token:tokens.refresh_token}),signal:AbortSignal.timeout(10000)});
    return reply({error:'Connect the same Google email address as your invited PhishAware account.'},403);
   }
   const {data:saved,error:saveError}=await db.rpc('phishaware_connect_mailbox',{owner:user.id,company,mailbox_email:user.email.toLowerCase(),cipher:await seal({refresh_token:tokens.refresh_token},user.id+':'+company),oauth_state_hash:await hash(input.state)});if(saveError||!saved){await fetch('https://oauth2.googleapis.com/revoke',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token:tokens.refresh_token}),signal:AbortSignal.timeout(10000)});throw Error('Connection expired or cancelled. Start again.');}return reply({connected:true});
  }
  if(input.action==='scan'||input.action==='scan-on-open'){
   if(!box||box.status!=='connected'){if(input.action==='scan-on-open')return reply({processed:0,notConnected:true});return reply({error:'Connect your Google mailbox first.'},409);}
   if(box.last_scan_at&&Date.now()-new Date(box.last_scan_at).getTime()<60000){if(input.action==='scan-on-open')return reply({processed:0,recent:true});return reply({error:'Wait one minute before scanning again.'},429);}
   return reply(await scan(box));
  }
  return reply({error:'Unknown action'},400);
 }catch(e){if(e instanceof Error&&e.message==='Request too large')return reply({error:e.message},413);return reply({error:e instanceof Error&& !('code' in e)?e.message:'Email operation failed. Try again.'},400);}
});
