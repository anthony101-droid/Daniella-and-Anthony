import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source=readFileSync('supabase/functions/phishaware/index.ts','utf8');
const library=ts.transpileModule(readFileSync('lib/platform.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports={};vm.runInNewContext(library,{exports,crypto:globalThis.crypto,Date,Math});
const state=exports.emptyWorkspace();state.employees=[{id:'one',email:'employee@example.invalid',name:'One',active:true},{id:'two',email:'other@example.invalid',name:'Two',active:true}];state.campaigns=[{id:'own',status:'Active',name:'Own'},{id:'other',status:'Active',name:'Other'}];state.deliveries=[{id:'d1',employeeId:'one',campaignId:'own',opened:false},{id:'d2',employeeId:'two',campaignId:'other',opened:false}];
function handler(role='Employee',status='sent',company='main'){
 let fn;const db={rpc:async()=>({data:true}),auth:{getUser:async()=>({data:{user:{id:'user',email:'employee@example.invalid',email_confirmed_at:'confirmed'}}})},from:table=>{const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:table==='phishaware_access'?{role,status,employee_id:'one',company_id:company}:null}),single:async()=>({data:{state,revision:1}})};return q;}};
 const cleaned=source.replace(/^import .*\n/gm,'').replace('const db=createClient', 'const db=createClient');
 const compiled=ts.transpileModule(cleaned,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
 vm.runInNewContext(compiled,{...exports,readBounded:async(req,max)=>{const text=await req.text();if(text.length>max)throw Error('Request too large');return text;},createClient:()=>db,Deno:{env:{get:()=>''},serve:f=>fn=f},Response,Request,Set,Date,JSON,structuredClone});return fn;
}
const request=body=>new Request('https://edge.example.invalid',{method:'POST',headers:{Authorization:'Bearer test'},body:JSON.stringify(body)});
test('uninvited accounts are denied',async()=>{const r=await handler('Employee','failed')(request({action:'load'}));assert.equal(r.status,403);});
test('employee sees only assigned records',async()=>{const r=await handler()(request({action:'load'}));assert.equal(r.status,200);const data=await r.json();assert.deepEqual(data.workspace.employees.map(e=>e.id),['one']);assert.deepEqual(data.workspace.deliveries.map(e=>e.id),['d1']);assert.deepEqual(data.workspace.campaigns.map(e=>e.id),['own']);});
test('employee cannot save administrator state',async()=>{assert.equal((await handler()(request({action:'save'}))).status,403);});
test('employee cannot send invitations',async()=>{assert.equal((await handler()(request({action:'invite',employeeIds:['two']}))).status,403);});
test('employee cannot respond to another employee delivery',async()=>{const r=await handler()(request({action:'employee',kind:'response',deliveryId:'d2',response:'clicked'}));assert.equal(r.status,400);});
test('missing user token is denied',async()=>{const r=await handler()(new Request('https://edge.example.invalid',{method:'POST',body:'{}'}));assert.equal(r.status,401);});

test('employee cannot select another company',async()=>{assert.equal((await handler()(request({action:'load',companyId:'another'}))).status,403);});
test('company administrator cannot select another company',async()=>{assert.equal((await handler('Administrator')(request({action:'load',companyId:'another'}))).status,403);});
test('company administrator cannot create another company',async()=>{assert.equal((await handler('Administrator')(request({action:'create-company'}))).status,403);});
