import type {Campaign, Delivery, Employee, Template, Workspace} from '@/lib/platform';

export function SimulationSetup({workspace,onEmployees,onTemplates}:{workspace:Workspace;onEmployees:()=>void;onTemplates:()=>void}) {
 const active=workspace.employees.filter(e=>e.active).length;
 return <section className="panel simulation-setup"><h2>Set up your first exercise</h2><ol><li><strong>Choose your company and people</strong><p>{workspace.organization} · {active} active {active===1?'employee':'employees'}. Each campaign stays in this company workspace.</p><button className="text-button" onClick={onEmployees}>Manage employees</button></li><li><strong>Choose a training message</strong><p>Start with password expiry, supplier invoices, benefits, or document sharing. Review the sender, subject, and full message.</p><button className="text-button" onClick={onTemplates}>Browse templates</button></li><li><strong>Review and launch</strong><p>Create a draft, choose a department, then check the recipient list before launch. Employees receive an in-app notification and simulation message.</p></li><li><strong>Review results and follow up</strong><p>Track opened, clicked, and reported responses in campaign details and Reports &amp; analytics. Complete the campaign when your review is finished.</p></li></ol></section>;
}

export function SimulationAudience({campaign,employees}:{campaign?:Campaign;employees:Employee[]}) {
 const recipients=employees.filter(e=>e.active&&campaign&&(campaign.department==='All departments'||e.department===campaign.department));
 return <div className="simulation-audience"><h3>Recipient preview</h3><p>{campaign?.department} · {recipients.length} active recipients</p>{recipients.length?<ul>{recipients.map(e=><li key={e.id}><strong>{e.name}</strong><span>{e.email}</span><small>{e.department}</small></li>)}</ul>:<p role="status">Add active employees in this department before launching.</p>}</div>;
}

export function SimulationFeedback({delivery,template,onTraining}:{delivery:Delivery;template?:Template;onTraining:()=>void}) {
 if(!delivery.clicked&&!delivery.reported)return null;
 return <section className="simulation-feedback" aria-label="Simulation feedback"><h3>{delivery.reported?'Your report is recorded':'This was a controlled training link'}</h3><p>{delivery.reported?'Reporting gives your team a chance to investigate an unusual request.':'No password or payment details were collected. Pause and verify unexpected requests before following links.'}</p>{template&&<><h4>Warning signs in the original template</h4><ul>{template.indicators.map(sign=><li key={sign}>{sign}</li>)}</ul><p className="muted">Your administrator may have adapted the message. Compare these signs with the message above.</p></>}<button className="outline-button" onClick={onTraining}>Review phishing awareness lessons</button></section>;
}
