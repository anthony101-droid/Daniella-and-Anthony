import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
const require=createRequire(import.meta.url);
function harness(){let values=[],cursor=0;const refs=[],effects=[];let refCursor=0;const react={...React,useState:value=>{const i=cursor++;if(!(i in values))values[i]=value;return [values[i],next=>values[i]=typeof next==='function'?next(values[i]):next];},useRef:value=>{const i=refCursor++;return refs[i]??(refs[i]={current:value});},useEffect:fn=>effects.push(fn)};const window={innerHeight:800,scrollY:100,addEventListener(){},removeEventListener(){},scrollTo({top}){window.scrollY=top;}};const module={exports:{}};
 vm.runInNewContext(ts.transpileModule(readFileSync('components/mobile-scroll-handle.tsx','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{module,exports:module.exports,require:n=>n==='react'?react:require(n),window,document:{documentElement:{scrollHeight:3200},body:{}},ResizeObserver:class{observe(){}disconnect(){}},requestAnimationFrame:fn=>{fn();return 1;},cancelAnimationFrame(){},Math});
 const render=()=>{cursor=0;refCursor=0;return module.exports.default();};render();effects[0]();refs[0].current={clientHeight:448};return {window,render};}
test('scroll handle drag maps vertical movement to page position and clamps boundaries',()=>{const h=harness(),button=h.render().props.children;button.props.onPointerDown({isPrimary:true,pointerId:1,clientY:100,preventDefault(){},currentTarget:{setPointerCapture(){}}});button.props.onPointerMove({pointerId:1,clientY:300});assert.equal(h.window.scrollY,1300);button.props.onPointerMove({pointerId:1,clientY:10000});assert.equal(h.window.scrollY,2400);button.props.onPointerUp();button.props.onPointerMove({pointerId:1,clientY:100});assert.equal(h.window.scrollY,2400);});
test('scroll handle supports Home End and arrow keys',()=>{const h=harness(),button=h.render().props.children;const key=key=>button.props.onKeyDown({key,preventDefault(){}});key('End');assert.equal(h.window.scrollY,2400);key('Home');assert.equal(h.window.scrollY,0);key('ArrowDown');assert.equal(h.window.scrollY,600);});
