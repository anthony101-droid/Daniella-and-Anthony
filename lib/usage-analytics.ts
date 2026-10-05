// Explicit product events only. Never send URLs, form values, mailbox content or account IDs.
export const usageEvents=['workspace_opened','workspace_page_opened','scan_requested','email_review_requested','email_reported','admin_review_completed','training_submitted','support_request_submitted'] as const;
export type UsageEvent=typeof usageEvents[number];
const pages=['overview','email-protection','campaigns','templates','employees','training','reports','activity','settings','inbox','notifications'];
export function usagePayload(event:string,page?:string){
 if(!(usageEvents as readonly string[]).includes(event))return null;
 return {event,properties:{$process_person_profile:false,$geoip_disable:true,...(event==='workspace_page_opened'&&page&&pages.includes(page)?{page}:{})}};
}
export function announceUsage(event:UsageEvent,page?:string){
 if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('phishaware:usage',{detail:{event,page}}));
}
