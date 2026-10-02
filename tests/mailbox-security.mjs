import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {webcrypto} from 'node:crypto';
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const library={exports:{},TextDecoder,Uint8Array,atob,URL,Date};vm.runInNewContext(compile(readFileSync('supabase/functions/mailbox-security/analysis.ts','utf8')),library);
const assess=text=>library.exports.inspectMessage({id:'one',snippet:text});
test('credential urgency yields medium risk with verification advice',()=>{const x=assess('Urgent: confirm your password immediately');assert.equal(x.risk,'Medium');assert.match(x.recommendation,/verify/);});
test('security bypass and executable yield high risk',()=>{const x=library.exports.inspectMessage({id:'one',snippet:'Disable your antivirus',payload:{filename:'update.exe'}});assert.equal(x.risk,'High');assert.match(x.recommendation,/Do not/);});
test('benign text is low risk without promising safety',()=>{const x=assess('Meeting at 10am tomorrow');assert.equal(x.risk,'Low');assert.match(x.recommendation,/not proof/);});
test('HTML credential request and IP link are assessed without visiting URLs',()=>{const data=btoa('<a href="https://192.0.2.1/login">Enter your password</a>');assert.equal(library.exports.inspectMessage({id:'one',payload:{mimeType:'text/html',body:{data}}}).risk,'High');});
test('reply-to mismatch alone requires review',()=>{const x=library.exports.inspectMessage({id:'one',payload:{headers:[{name:'From',value:'Chief <chief@example.com>'},{name:'Reply-To',value:'other@example.net'}]}});assert.equal(x.risk,'Medium');});
test('malformed MIME and links do not crash scanner',()=>{assert.doesNotThrow(()=>library.exports.inspectMessage({id:'one',payload:{mimeType:'text/html',body:{data:'%%%'}}}));});
function harness({status='sent',configured=true,mailbox=null}={}){
 const records=[],queries=[];let handler;
 const env={SUPABASE_URL:'',SUPABASE_SERVICE_ROLE_KEY:'',...(configured?{GOOGLE_CLIENT_ID:'client',GOOGLE_CLIENT_SECRET:'secret',MAILBOX_ENCRYPTION_KEY:btoa(String.fromCharCode(...new Uint8Array(32)))}:{})};
 const db={auth:{getUser:async()=>({data:{user:{id:'user-one',email:'employee@example.com',email_confirmed_at:'yes'}}})},rpc:async()=>({data:true}),from:table=>{const q={select:()=>q,eq:(k,v)=>{queries.push([table,k,v]);return q;},gt:()=>q,order:()=>q,limit:async()=>({data:[]}),delete:()=>q,update:()=>q,insert:async r=>{records.push(r);return {error:null};},maybeSingle:async()=>({data:table==='phishaware_access'?{company_id:'main',status,role:'Administrator'}:mailbox})};return q;}};
 const source=readFileSync('supabase/functions/mailbox-security/index.ts','utf8').replace(/^import .*\n/gm,'');const ctx={...library.exports,readBounded:async(req,max)=>{const text=await req.text();if(text.length>max)throw Error('Request too large');return text;},createClient:()=>db,crypto:webcrypto,TextEncoder,TextDecoder,Uint8Array,atob,btoa,URL,URLSearchParams,Response,Request,AbortSignal,Date,JSON,console,Deno:{env:{get:k=>env[k]},serve:f=>handler=f},fetch:()=>{throw Error('Unexpected network access');}};
 vm.runInNewContext(compile(source),ctx);return {handler,ctx,records,queries};
}
const req=body=>new Request('https://edge.invalid',{method:'POST',headers:{Authorization:'Bearer userjwt'},body:JSON.stringify(body)});
test('unauthenticated worker cannot access inboxes',async()=>{assert.equal((await harness().handler(req({action:'worker'}))).status,401);});
test('revoked accounts cannot access scanning',async()=>{assert.equal((await harness({status:'revoked'}).handler(req({action:'status'}))).status,400);});
test('scan without connection is rejected',async()=>{assert.equal((await harness().handler(req({action:'scan'}))).status,409);});
test('Google setup is required before OAuth starts',async()=>{assert.equal((await harness({configured:false}).handler(req({action:'connect'}))).status,503);});
test('OAuth callback requires an unexpired, unused state bound to user and company',async()=>{const h=harness(),r=await h.handler(req({action:'complete',code:'stolen',state:'random'}));assert.equal(r.status,400);assert.ok(h.queries.some(q=>q[0]==='phishaware_oauth_states'&&q[1]==='user_id'&&q[2]==='user-one'));assert.ok(h.queries.some(q=>q[0]==='phishaware_oauth_states'&&q[1]==='company_id'&&q[2]==='main'));});
test('connection URL requests only read-only Gmail with state and PKCE',async()=>{const h=harness(),r=await h.handler(req({action:'connect'}));assert.equal(r.status,200);const u=new URL((await r.json()).url);assert.equal(u.searchParams.get('scope'),'https://www.googleapis.com/auth/gmail.readonly');assert.equal(u.searchParams.get('code_challenge_method'),'S256');assert.equal(h.records.length,1);assert.notEqual(h.records[0].state_hash,u.searchParams.get('state'));});
test('status query is bound to owner and never returns encrypted tokens',async()=>{const h=harness({mailbox:{email:'employee@example.com',status:'connected',token_cipher:'private'}});const r=await h.handler(req({action:'status'}));assert.equal(r.status,200);assert.ok(h.queries.some(q=>q[0]==='phishaware_email_findings'&&q[1]==='user_id'&&q[2]==='user-one'));assert.doesNotMatch(await r.text(),/private|token_cipher/);});
test('AES-GCM detects tampering and rejects a different tenant context',async()=>{const {ctx}=harness();const cipher=await ctx.seal({refresh_token:'test'},'owner:company-one');assert.deepEqual(JSON.parse(JSON.stringify(await ctx.unseal(cipher,'owner:company-one'))),{refresh_token:'test'});await assert.rejects(()=>ctx.unseal(cipher,'owner:company-two'));});

test('message summaries preserve subject and sender without storing body',()=>{const s=library.exports.summarizeMessage({id:'one',snippet:'Private message body',payload:{headers:[{name:'Subject',value:'Meeting'},{name:'From',value:'person@example.com'}]}});assert.equal(s.subject,'Meeting');assert.equal(s.sender,'person@example.com');assert.equal(s.snippet,undefined);});
const readerLib={exports:{},TextDecoder,Uint8Array};vm.runInNewContext(compile(readFileSync('supabase/functions/mailbox-security/security.ts','utf8')),readerLib);
test('bounded reader rejects oversized chunked requests without content-length',async()=>{await assert.rejects(()=>readerLib.exports.readBounded(new Request('https://edge.invalid',{method:'POST',body:'123456789'}),4),/Request too large/);});
test('bounded reader accepts a valid UTF-8 request',async()=>{assert.equal(await readerLib.exports.readBounded(new Request('https://edge.invalid',{method:'POST',body:'{"a":1}'}),20),'{"a":1}');});

test('revoked users still have access to disconnect their own mailbox',async()=>{assert.equal((await harness({status:'revoked'}).handler(req({action:'disconnect'}))).status,200);});
