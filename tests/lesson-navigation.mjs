import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
const require=createRequire(import.meta.url);
const compile=s=>ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const lib={exports:{}};vm.runInNewContext(compile(readFileSync('lib/platform.ts','utf8')),{module:lib,exports:lib.exports,require,Date,Math,crypto:globalThis.crypto});
function harness(){let state=[],cursor=0,selected=null;const module={exports:{}};const react={...React,useState:initial=>{const i=cursor++;if(!(i in state))state[i]=initial;return [state[i],value=>{state[i]=typeof value==='function'?value(state[i]):value;}];}};
 vm.runInNewContext(compile(readFileSync('components/training-library.tsx','utf8')),{module,exports:module.exports,require:n=>n==='react'?react:n==='@/lib/platform'?lib.exports:require(n),Date,console});
 const props={employeeId:'learner',completions:lib.exports.modules.map(m=>({employeeId:'learner',moduleId:m.id,score:80,attempts:1})),preview:false,onSelect:id=>selected=id,onSubmit:async()=>60};
 function open(index){state=[];cursor=0;const element=module.exports.default({...props,selectedId:lib.exports.modules[index].id});state=[];return ()=>{cursor=0;return element.type(element.props);};}
 return {open,get selected(){return selected;}};
}
function elements(node){if(!node||typeof node!=='object')return [];return [node,...React.Children.toArray(node.props?.children).flatMap(elements)];}
function text(node){if(typeof node==='string')return node;if(!node||typeof node!=='object')return '';return React.Children.toArray(node.props?.children).map(text).join('');}
function button(tree,label){return elements(tree).find(e=>e.type==='button'&&text(e)===label);}
async function submit(render){let tree=render();const groups=new Set();for(const el of elements(tree)){if(el.type==='input'&&el.props.type==='radio'&&!groups.has(el.props.name)){groups.add(el.props.name);el.props.onChange();}}tree=render();await elements(tree).find(e=>e.type==='form').props.onSubmit({preventDefault(){}});return render();}
test('after submission Next moves in lesson order, even when later lessons already passed',async()=>{const h=harness(),render=h.open(0);assert.equal(button(render(),'Previous lesson').props.disabled,true);assert.equal(button(render(),'Next lesson'),undefined);const tree=await submit(render);assert.ok(button(tree,'Next lesson'));button(tree,'Next lesson').props.onClick();assert.equal(h.selected,lib.exports.modules[1].id);});
test('Previous returns to the immediately preceding lesson',()=>{const h=harness(),render=h.open(3);button(render(),'Previous lesson').props.onClick();assert.equal(h.selected,lib.exports.modules[2].id);});
test('final submitted lesson returns to the library without wrapping around',async()=>{const h=harness(),render=h.open(lib.exports.modules.length-1);const tree=await submit(render);assert.equal(button(tree,'Next lesson'),undefined);button(tree,'Back to training library').props.onClick();assert.equal(h.selected,null);});
