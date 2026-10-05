'use client';
import {useEffect} from 'react';
import {usagePayload} from '@/lib/usage-analytics';
export default function UsageAnalytics(){
 useEffect(()=>{
  const key=process.env.NEXT_PUBLIC_POSTHOG_KEY,host=process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if(process.env.NEXT_PUBLIC_USAGE_ANALYTICS_ENABLED!=='true'||!key||!host||navigator.doNotTrack==='1')return;
  // Regional PostHog ingestion hosts only. Configuration cannot redirect events elsewhere.
  if(!['https://us.i.posthog.com','https://eu.i.posthog.com'].includes(host))return;
  let distinct=crypto.randomUUID();
  const capture=(e:Event)=>{const {event,page}=((e as CustomEvent).detail??{});const payload=usagePayload(event,page);if(!payload)return;
   void fetch(host+'/capture/',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',referrerPolicy:'no-referrer',body:JSON.stringify({...payload,api_key:key,properties:{...payload.properties,distinct_id:distinct}})}).catch(()=>{});
  };
  const reset=()=>{distinct=crypto.randomUUID();};
  window.addEventListener('phishaware:usage',capture);window.addEventListener('phishaware:usage-reset',reset);
  return()=>{window.removeEventListener('phishaware:usage',capture);window.removeEventListener('phishaware:usage-reset',reset);};
 },[]);
 return null;
}
