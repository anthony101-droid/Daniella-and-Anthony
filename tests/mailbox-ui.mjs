import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url),module={exports:{}},loadingModule={exports:{}};
vm.runInNewContext(ts.transpileModule(readFileSync('components/loading-placeholder.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{module:loadingModule,exports:loadingModule.exports,require});
vm.runInNewContext(ts.transpileModule(readFileSync('components/mailbox-security.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{module,exports:module.exports,require:n=>n==='@/lib/supabase'?{supabase:{}}:n==='./loading-placeholder'?loadingModule.exports:require(n),Date,console});
const finding={message_id:'example',subject:'Review this request',sender:'sender@example.invalid',received_at:'2026-10-03T20:00:00Z',risk:'Medium',reasons:['Verify the sender'],recommendation:'Use a known contact method',notification_read:false,review_state:'unreviewed'};
const model=(findings=[finding],alerts=[])=>({status:{connection:{status:'connected',email:'employee@example.invalid',lastScanAt:null},automaticScanning:true,findings,alerts},busy:false,error:'',message:'',run:async()=>{},load:async()=>{}});
test('employee mailbox shows Google accents and distinct review, report and Gmail actions',()=>{const html=renderToStaticMarkup(React.createElement(module.exports.default,{model:model()}));assert.match(html,/google-colour-bar/);assert.match(html,/Save for review/);assert.match(html,/Report issue/);assert.match(html,/Open Gmail/);});
test('administrator decision is displayed separately from original risk rating',()=>{const html=renderToStaticMarkup(React.createElement(module.exports.default,{model:model([{...finding,review_outcome:'safe',review_note:'Sender verified',admin_reviewed_at:'2026-10-03T20:01:00Z'}])}));assert.match(html,/Medium risk/);assert.match(html,/Marked safe by your administrator/);assert.match(html,/Sender verified/);});
test('read but unresolved requests keep administrator decision controls',()=>{const alert={...finding,id:'example-alert',employee_email:'employee@example.invalid',source:'employee',request_kind:'review',status:'open',created_at:finding.received_at,notification_read:true};const html=renderToStaticMarkup(React.createElement(module.exports.EmailNotifications,{model:model([], [alert]),admin:true}));assert.match(html,/Review requested/);assert.match(html,/Mark safe/);assert.match(html,/Action taken/);assert.match(html,/Review note for the employee/);});

test('first email opens its content panel automatically while other emails stay collapsed',()=>{const html=renderToStaticMarkup(React.createElement(module.exports.default,{model:model([finding,{...finding,message_id:'other'}])}));assert.equal((html.match(/Loading email from your Google mailbox/g)||[]).length,1);assert.match(html,/Hide email content/);assert.match(html,/View email content/);});
