'use client';
import {useEffect,useRef,useState,type PointerEvent,type KeyboardEvent} from 'react';
export default function MobileScrollHandle(){
 const track=useRef<HTMLDivElement>(null),drag=useRef<{pointer:number;y:number;scroll:number}|null>(null);
 const [position,setPosition]=useState(0),[available,setAvailable]=useState(false),[dragging,setDragging]=useState(false);
 useEffect(()=>{
  let frame=0;const update=()=>{frame=0;const max=document.documentElement.scrollHeight-window.innerHeight;setAvailable(max>80);setPosition(max>0?Math.max(0,Math.min(100,window.scrollY/max)):0);};
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
  const observer=new ResizeObserver(schedule);observer.observe(document.body);window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);update();
  return()=>{observer.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);window.visualViewport?.removeEventListener('resize',schedule);cancelAnimationFrame(frame);};
 },[]);
 function start(e:PointerEvent<HTMLButtonElement>){if(!e.isPrimary)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);drag.current={pointer:e.pointerId,y:e.clientY,scroll:window.scrollY};setDragging(true);}
 function move(e:PointerEvent<HTMLButtonElement>){const d=drag.current;if(!d||e.pointerId!==d.pointer)return;const travel=(track.current?.clientHeight??0)-48;if(travel<=0)return;const max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);window.scrollTo({top:Math.max(0,Math.min(max,d.scroll+(e.clientY-d.y)/travel*max)),behavior:'instant'});}
 function stop(){drag.current=null;setDragging(false);}
 function keyboard(e:KeyboardEvent<HTMLButtonElement>){const max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight),step=window.innerHeight*.75;const next=e.key==='Home'?0:e.key==='End'?max:e.key==='ArrowDown'?window.scrollY+step:e.key==='ArrowUp'?window.scrollY-step:null;if(next===null)return;e.preventDefault();window.scrollTo({top:Math.max(0,Math.min(max,next)),behavior:'instant'});}
 if(!available)return null;
 return <div className={'mobile-page-scroll '+(dragging?'dragging':'')} ref={track}><button type="button" className="mobile-scroll-thumb" aria-label="Drag to scroll page" role="slider" aria-orientation="vertical" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(position)} aria-valuetext={`${Math.round(position)}% down the page`} style={{top:`calc(${position}% - ${position/100*48}px)`}} onPointerDown={start} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop} onKeyDown={keyboard}><span/><span/><span/></button></div>;
}
