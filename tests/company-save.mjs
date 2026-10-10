import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const model={};
vm.runInNewContext(ts.transpileModule(readFileSync('lib/company-save.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:model});
test('saved company and employee details refresh without altering another company or access role',()=>{
 const current={companyId:'own',revision:2,role:'Administrator',workspace:{organization:'Old'},companies:[{id:'own',name:'Old',people:[{id:'staff',email:'staff@example.invalid',status:'sent'}]},{id:'other',name:'Other',people:[]}]};
 const workspace={organization:'Updated company',employees:[{id:'staff',name:'Updated name',email:'staff@example.invalid',department:'IT',active:true},{id:'old',active:false}]};
 const next=model.mergeSavedCompany(current,workspace,3),company=next.companies.find(c=>c.id==='own');
 assert.equal(next.revision,3);assert.equal(next.role,'Administrator');assert.equal(next.companyId,'own');assert.equal(next.workspace,workspace);assert.equal(company.name,'Updated company');assert.equal(company.people.length,1);assert.equal(company.people[0].name,'Updated name');assert.equal(company.people[0].status,'sent');assert.equal(next.companies.find(c=>c.id==='other'),current.companies[1]);assert.equal(current.companies[0].name,'Old');
});
test('changed employee email is not presented as already invited',()=>{const current={companyId:'own',revision:1,workspace:{},companies:[{id:'own',name:'Old',people:[{id:'staff',email:'old@example.invalid',status:'sent'}]}]};const next=model.mergeSavedCompany(current,{organization:'New',employees:[{id:'staff',email:'new@example.invalid',active:true}]},2);assert.equal(next.companies[0].people[0].status,'Not invited');});
