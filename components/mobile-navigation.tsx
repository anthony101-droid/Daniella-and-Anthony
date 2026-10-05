'use client';
import {ShieldCheck,LayoutDashboard,Users,BookOpen,Bell,UserRound,BarChart3,Menu,Inbox} from 'lucide-react';
import {SidebarTrigger,useSidebar} from '@/components/ui/sidebar';
export type MobileDestination='overview'|'email-protection'|'employees'|'reports'|'training'|'notifications'|'settings'|'inbox';
type Props={active:string;admin:boolean;organization:string;count:number;onNavigate:(page:MobileDestination)=>void};
export function MobileHeader({organization,count,onNavigate}:Pick<Props,'organization'|'count'|'onNavigate'>){
 return <header className="mobile-app-header"><button className="mobile-app-brand" onClick={()=>onNavigate('overview')} aria-label="PhishAware home"><span className="mobile-brand-mark"><ShieldCheck size={22}/></span><span><strong>PhishAware<span className="mobile-brand-dot">.</span></strong><small>{organization==='Your organization'?'Awareness workspace':organization}</small></span></button><div className="mobile-header-actions"><button className="mobile-header-alert" aria-label={`Notifications${count?`, ${count} unread`:''}`} onClick={()=>onNavigate('notifications')}><Bell size={21}/>{count>0&&<span>{count>99?'99+':count}</span>}</button><SidebarTrigger aria-label="Open workspace menu" className="mobile-menu-trigger"/></div></header>;
}
export function MobileNavigation({active,admin,count,onNavigate}:Omit<Props,'organization'>){
 const {setOpenMobile}=useSidebar();
 const items=admin?[{page:'overview',label:'Home',Icon:LayoutDashboard},{page:'email-protection',label:'Email',Icon:ShieldCheck},{page:'employees',label:'People',Icon:Users},{page:'reports',label:'Reports',Icon:BarChart3},{page:'menu',label:'More',Icon:Menu}]:[{page:'overview',label:'Home',Icon:LayoutDashboard},{page:'email-protection',label:'Email',Icon:ShieldCheck},{page:'training',label:'Learn',Icon:BookOpen},{page:'notifications',label:'Alerts',Icon:Bell},{page:'settings',label:'Profile',Icon:UserRound}];
 return <nav className="mobile-bottom-nav" aria-label="Mobile workspace navigation">{items.map(({page,label,Icon})=>{const selected=page==='menu'? !items.some(i=>i.page===active):page===active;return <button key={page} aria-current={selected?'page':undefined} className={selected?'is-active':''} onClick={()=>{if(page==='menu')setOpenMobile(true);else{setOpenMobile(false);onNavigate(page as MobileDestination);}}}><span className="mobile-nav-icon"><Icon size={21}/>{page==='notifications'&&count>0&&<i>{count>99?'99+':count}</i>}</span><span>{label}</span></button>;})}</nav>;
}
export function MobileQuickActions({admin,onNavigate}:Pick<Props,'admin'|'onNavigate'>){
 const items=admin?[{page:'email-protection',label:'Email checks',Icon:ShieldCheck},{page:'employees',label:'Employees',Icon:Users},{page:'training',label:'Training',Icon:BookOpen},{page:'reports',label:'Reports',Icon:BarChart3}]:[{page:'email-protection',label:'Email checks',Icon:ShieldCheck},{page:'training',label:'Training',Icon:BookOpen},{page:'inbox',label:'Practice',Icon:Inbox},{page:'notifications',label:'Updates',Icon:Bell}];
 return <nav className="mobile-quick-actions" aria-label="Quick actions">{items.map(({page,label,Icon})=><button key={page} onClick={()=>onNavigate(page as MobileDestination)}><span><Icon size={22}/></span>{label}</button>)}</nav>;
}
