export type Period='Daily'|'Weekly'|'Monthly'|'Yearly';
export function reportRange(period:Period,value:string){const date=new Date(value+'T00:00:00Z');if(!Number.isFinite(date.getTime()))throw Error('Choose a valid date.');const start=new Date(date),end=new Date(date);if(period==='Weekly'){start.setUTCDate(start.getUTCDate()-((start.getUTCDay()+6)%7));end.setTime(start.getTime());end.setUTCDate(end.getUTCDate()+7);}else if(period==='Monthly'){start.setUTCDate(1);end.setTime(start.getTime());end.setUTCMonth(end.getUTCMonth()+1);}else if(period==='Yearly'){start.setUTCMonth(0,1);end.setTime(start.getTime());end.setUTCFullYear(end.getUTCFullYear()+1);}else end.setUTCDate(end.getUTCDate()+1);return {start:start.toISOString().slice(0,10),end:end.toISOString().slice(0,10)};}
export type MetricDay={day:string;scanned:number;low:number;medium:number;high:number;alerts:number;reports:number};
export function reportBuckets(period:Period,start:string,end:string,days:MetricDay[]){const buckets:MetricDay[]=[];const date=new Date(start+'T00:00:00Z');while(date.toISOString().slice(0,10)<end){buckets.push({day:date.toISOString().slice(0,10),scanned:0,low:0,medium:0,high:0,alerts:0,reports:0});if(period==='Yearly')date.setUTCMonth(date.getUTCMonth()+1);else date.setUTCDate(date.getUTCDate()+1);}for(const day of days){const key=period==='Yearly'?day.day.slice(0,7)+'-01':day.day;const b=buckets.find(b=>b.day===key);if(b)for(const k of ['scanned','low','medium','high','alerts','reports'] as const)b[k]+=day[k];}return buckets;}

export type SharedEmail={id:string;employee_email:string;subject:string;sender:string;risk:'Low'|'Medium'|'High';reasons:string[];recommendation:string;source:string;status:string;created_at:string;resolved_at:string|null;request_kind:string;review_outcome:'safe'|'action_taken'|null;review_note:string|null};
export type ReportAction={id:string;date:string;actor:string;category:string;action:string;source:string};
export function reviewLabel(email:SharedEmail){return email.review_outcome==='safe'?'Marked safe':email.review_outcome==='action_taken'?'Action taken':email.status==='resolved'?'Resolved':'Awaiting review';}
export function detailedReportRows(shared:SharedEmail[],reviewed:SharedEmail[],actions:ReportAction[]){return [
 ['Shared emails received during the period'],
 ['Shared at (UTC)','Employee email','Subject','Sender','Initial risk','Risk reasons','Recommended action','Review outcome','Administrator note','Reviewed at (UTC)'],
 ...shared.map(e=>[e.created_at,e.employee_email,e.subject,e.sender,e.risk,e.reasons.join(' | '),e.recommendation,reviewLabel(e),e.review_note??'',e.resolved_at??'']),
 ['Reviews completed during the period (including earlier submissions)'],
 ['Reviewed at (UTC)','Employee email','Subject','Initial risk','Review outcome','Administrator note'],
 ...reviewed.map(e=>[e.resolved_at??'',e.employee_email,e.subject,e.risk,reviewLabel(e),e.review_note??'']),
 ['Recorded actions during the period'],['Time (UTC)','Actor','Category','Action','Record source'],
 ...actions.map(e=>[e.date,e.actor,e.category,e.action,e.source]),
 ['Privacy and coverage','Email details include shared alert summaries only. Private mailbox messages are excluded. Aggregate scan counts include all recorded findings. Low risk is not proof of safety.']
 ];}
