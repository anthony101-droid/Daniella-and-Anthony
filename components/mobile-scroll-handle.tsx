'use client';
import {useEffect,useRef,useState,type PointerEvent,type KeyboardEvent} from 'react';
type Drag={pointer:number;y:number;scroll:number;travel:number;max:number};
export default function MobileScrollHandle(){
 const track=useRef<HTMLDivElement>(null),thumb=useRef<HTMLButtonElement>(null),drag=useRef<Drag|null>(null);
 const [position,setPosition]=useState(0),[available,setAvailable]=useState(false),[dragging,setDragging]=useState(false);
 function begin(pointer:number,y:number){const travel=(track.current?.clientHeight??0)-(thumb.current?.clientHeight??48),max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);if(travel<=0||max<=0)return;drag.current={pointer,y,scroll:window.scrollY,travel,max};setDragging(true);}
 function moveTo(pointer:number,y:number){const d=drag.current;if(!d||pointer!==d.pointer)return;const top=Math.max(0,Math.min(d.max,d.scroll+(y-d.y)/d.travel*d.max));window.scrollTo({top,behavior:'instant'});setPosition(Math.max(0,Math.min(100,window.scrollY/d.max*100)));}
 function stop(){drag.current=null;setDragging(false);}
 useEffect(()=>{
  let frame=0;const update=()=>{frame=0;if(drag.current)return;const max=document.documentElement.scrollHeight-window.innerHeight;setAvailable(max>80);setPosition(max>0?Math.max(0,Math.min(100,window.scrollY/max*100)):0);};
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
  const observer=new ResizeObserver(schedule);observer.observe(document.body);window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);update();
  return()=>{observer.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);window.visualViewport?.removeEventListener('resize',schedule);cancelAnimationFrame(frame);};
 },[]);
 // Native non-passive touch listeners prevent iOS page panning from cancelling a drag.
 useEffect(()=>{
  const button=thumb.current;if(!button)return;
  const start=(e:TouchEvent)=>{if(e.touches.length!==1)return;const t=e.touches[0];e.preventDefault();begin(t.identifier,t.screenY);};
  const move=(e:TouchEvent)=>{if(!drag.current)return;const t=Array.from(e.touches).find(t=>t.identifier===drag.current?.pointer);if(!t)return;e.preventDefault();moveTo(t.identifier,t.screenY);};
  const end=(e:TouchEvent)=>{if(drag.current&&Array.from(e.changedTouches).some(t=>t.identifier===drag.current?.pointer))stop();};
  button.addEventListener('touchstart',start,{passive:false});window.addEventListener('touchmove',move,{passive:false});window.addEventListener('touchend',end);window.addEventListener('touchcancel',end);
  const pointerMove=(e:globalThis.PointerEvent)=>{if(e.pointerType!=='touch'&&drag.current){e.preventDefault();moveTo(e.pointerId,e.clientY);}};
  const pointerEnd=(e:globalThis.PointerEvent)=>{if(e.pointerType!=='touch'&&drag.current?.pointer===e.pointerId)stop();};
  window.addEventListener('pointermove',pointerMove,{passive:false});window.addEventListener('pointerup',pointerEnd);window.addEventListener('pointercancel',pointerEnd);
  return()=>{button.removeEventListener('touchstart',start);window.removeEventListener('touchmove',move);window.removeEventListener('touchend',end);window.removeEventListener('touchcancel',end);window.removeEventListener('pointermove',pointerMove);window.removeEventListener('pointerup',pointerEnd);window.removeEventListener('pointercancel',pointerEnd);drag.current=null;};
 },[]);
 function start(e:PointerEvent<HTMLButtonElement>){if(!e.isPrimary||e.pointerType==='touch')return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);begin(e.pointerId,e.clientY);}
 function move(e:PointerEvent<HTMLButtonElement>){if(e.pointerType!=='touch')moveTo(e.pointerId,e.clientY);}
 function end(e:PointerEvent<HTMLButtonElement>){if(e.pointerType!=='touch')stop();}
 function keyboard(e:KeyboardEvent<HTMLButtonElement>){const max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight),step=window.innerHeight*.75;const next=e.key==='Home'?0:e.key==='End'?max:e.key==='ArrowDown'?window.scrollY+step:e.key==='ArrowUp'?window.scrollY-step:null;if(next===null)return;e.preventDefault();window.scrollTo({top:Math.max(0,Math.min(max,next)),behavior:'instant'});}
 return <div hidden={!available} className={'mobile-page-scroll '+(dragging?'dragging':'')} ref={track}><button ref={thumb} type="button" className="mobile-scroll-thumb" aria-label="Drag to scroll page" role="slider" aria-orientation="vertical" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(position)} aria-valuetext={`${Math.round(position)}% down the page`} style={{top:`calc(${position}% - ${position/100*48}px)`}} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end} onKeyDown={keyboard}><span/><span/><span/></button></div>;
}
