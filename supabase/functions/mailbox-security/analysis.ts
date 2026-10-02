export type MailPart={mimeType?:string;filename?:string;body?:{data?:string};parts?:MailPart[];headers?:{name:string;value:string}[]};
export type GmailMessage={id:string;internalDate?:string;snippet?:string;payload?:MailPart};
export type Assessment={risk:'Low'|'Medium'|'High';reasons:string[];recommendation:string};
function decode(value:string){try{return new TextDecoder().decode(Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0)));}catch{return '';}}
export function inspectMessage(message:GmailMessage):Assessment{
 let text=(message.snippet??'').slice(0,10000),parts=0;const files:string[]=[],reasons:string[]=[];
 function walk(p:MailPart,depth=0){if(depth>8||++parts>100)return;if(p.filename)files.push(p.filename.slice(0,200));if((p.mimeType==='text/plain'||p.mimeType==='text/html')&&p.body?.data&&text.length<100000)text+='\n'+decode(p.body.data.slice(0,140000)).slice(0,100000-text.length);for(const c of p.parts??[])walk(c,depth+1);}
 if(message.payload)walk(message.payload);let points=0;
 const headers=message.payload?.headers??[],header=(name:string)=>headers.find(h=>h.name.toLowerCase()===name.toLowerCase())?.value??'';
 const address=(s:string)=>s.match(/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@([a-z0-9.-]+\.[a-z]{2,})/i)?.[1]?.toLowerCase();
 const from=address(header('From')),reply=address(header('Reply-To'));
 if(from&&reply&&from!==reply){reasons.push('Reply address uses a different domain from the sender.');points+=20;}
 if(/(?:password|credentials|one[- ]time code|verification code)/i.test(text)&&/(?:enter|confirm|provide|verify|send|reset)/i.test(text)){reasons.push('The message asks for account credentials or verification.');points+=25;}
 if(/(?:urgent|immediately|within \d+ hours|suspend|expires? today|final warning)/i.test(text)){reasons.push('The message pressures you to act quickly.');points+=15;}
 if(/(?:bank details.{0,30}chang|chang.{0,30}bank details|wire transfer|gift cards|bitcoin payment)/i.test(text)){reasons.push('The message requests an unusual payment or a change of banking details.');points+=35;}
 if(files.some(f=>/\.(?:exe|scr|js|vbs|bat|cmd|ps1|msi|iso|lnk|docm|xlsm)$/i.test(f))){reasons.push('An attachment has an executable or macro-enabled extension.');points+=40;}
 if(/(?:enable macros|disable.{0,20}(?:antivirus|security))/i.test(text)){reasons.push('The message asks you to weaken security or enable active content.');points+=40;}
 const urls=Array.from(text.matchAll(/https?:\/\/[^\s<>"']+/gi)).slice(0,100).map(m=>m[0]);
 let suspect=false,short=false;
 for(const raw of urls){try{const u=new URL(raw);if(u.username||u.password||/^\d{1,3}(?:\.\d{1,3}){3}$/.test(u.hostname)||u.hostname.includes('xn--'))suspect=true;if(['bit.ly','tinyurl.com','t.co','is.gd','rb.gy'].includes(u.hostname.toLowerCase()))short=true;}catch{}}
 if(suspect){reasons.push('A link contains a raw IP address, embedded user information, or an internationalized domain requiring review.');points+=25;}
 if(short){reasons.push('A shortened link hides its final destination.');points+=15;}
 const risk=points>=50?'High':points>=20?'Medium':'Low';
 if(!reasons.length)reasons.push('No suspicious indicators detected by the current content rules. Sender authenticity, destinations, and attachment contents are not verified.');
 return {risk,reasons,recommendation:risk==='High'?'Do not follow links or open attachments. Report the message to your company security contact and verify through a known channel.':risk==='Medium'?'Pause and verify the sender through a known contact method before responding or following links.':'Confirm the message is expected. Low risk is not proof of safety. Use your normal security checks before taking action.'};
}
export function summarizeMessage(message:GmailMessage){const hs=message.payload?.headers??[],get=(n:string)=>hs.find(h=>h.name.toLowerCase()===n.toLowerCase())?.value??'';return {message_id:message.id,subject:get('Subject').slice(0,300),sender:get('From').slice(0,300),received_at:new Date(Number(message.internalDate)||Date.now()).toISOString(),...inspectMessage(message)};}
