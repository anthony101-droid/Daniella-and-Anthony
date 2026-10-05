import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
const require=createRequire(import.meta.url);
function harness(){const navigated=[],menu=[];const module={exports:{}};vm.runInNewContext(ts.transpileModule(readFileSync('components/mobile-navigation.tsx','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{module,exports:module.exports,require:n=>n==='@/components/ui/sidebar'?{SidebarTrigger:()=>null,useSidebar:()=>({setOpenMobile:v=>menu.push(v)})}:require(n)});return {ui:module.exports,navigated,menu,onNavigate:p=>navigated.push(p)};}
test('employee tabs navigate to email and profile and expose the current page',()=>{const h=harness(),nav=h.ui.MobileNavigation({active:'settings',admin:false,count:3,onNavigate:h.onNavigate}),buttons=nav.props.children;assert.equal(buttons.length,5);buttons[1].props.onClick();buttons[4].props.onClick();assert.deepEqual(h.navigated,['email-protection','settings']);assert.deepEqual(h.menu,[false,false]);assert.equal(buttons[4].props['aria-current'],'page');assert.equal(buttons[3].props.children[0].props.children[1].props.children,3);});
test('admin More opens management menu without changing page',()=>{const h=harness(),nav=h.ui.MobileNavigation({active:'activity',admin:true,count:0,onNavigate:h.onNavigate}),buttons=nav.props.children;buttons[4].props.onClick();assert.deepEqual(h.menu,[true]);assert.deepEqual(h.navigated,[]);assert.equal(buttons[4].props['aria-current'],'page');});
test('employee quick action opens simulation inbox',()=>{const h=harness(),actions=h.ui.MobileQuickActions({admin:false,onNavigate:h.onNavigate});actions.props.children[2].props.onClick();assert.deepEqual(h.navigated,['inbox']);});
