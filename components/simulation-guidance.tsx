import type {Campaign, Delivery, Employee, Template, Workspace} from '@/lib/platform';

export function SimulationSetup({workspace,onEmployees,onTemplates}:{workspace:Workspace;onEmployees:()=>void;onTemplates:()=>void}) {
 const active=workspace.employees.filter(e=>e.active).length;
 return <section className="panel simulation-setup" aria-labelledby="simulation-setup-title">
  <header className="simulation-setup-heading"><h2 id="simulation-setup-title">Run a phishing simulation</h2><p>Follow these four steps to prepare, launch, and review an employee training exercise.</p></header>
  <ol className="simulation-setup-steps" role="list">
   <li><span className="simulation-step-number" aria-hidden="true">1</span><div><h3>Choose your employees</h3><p className="simulation-company-summary"><strong>{workspace.organization}</strong><span>{active} active {active===1?'employee':'employees'}</span></p><p>Select the employees in this company who will receive the exercise.</p><button type="button" className="outline-button" onClick={onEmployees}>Manage employees</button></div></li>
   <li><span className="simulation-step-number" aria-hidden="true">2</span><div><h3>Choose a message</h3><p>Choose a training template, such as a password expiry notice or supplier invoice. Review the sender, subject, and message.</p><button type="button" className="outline-button" onClick={onTemplates}>Browse templates</button></div></li>
   <li><span className="simulation-step-number" aria-hidden="true">3</span><div><h3>Prepare and launch</h3><p>Select Create simulation, save a draft, and check the department and recipients before launch.</p><p>Employees receive a notification and message in their simulation inbox.</p></div></li>
   <li><span className="simulation-step-number" aria-hidden="true">4</span><div><h3>Review the results</h3><p>Check who opened, clicked, or reported the message in campaign details and Reports &amp; analytics.</p><p>Follow up with training, then mark the campaign complete.</p></div></li>
  </ol>
 </section>;
}

export function SimulationAudience({campaign,employees}:{campaign?:Campaign;employees:Employee[]}) {
 const recipients=employees.filter(e=>e.active&&campaign&&(campaign.department==='All departments'||e.department===campaign.department));
 return <div className="simulation-audience"><h3>Recipient preview</h3><p>{campaign?.department} · {recipients.length} active recipients</p>{recipients.length?<ul>{recipients.map(e=><li key={e.id}><strong>{e.name}</strong><span>{e.email}</span><small>{e.department}</small></li>)}</ul>:<p role="status">Add active employees in this department before launching.</p>}</div>;
}

export function SimulationFeedback({delivery,template,onTraining}:{delivery:Delivery;template?:Template;onTraining:()=>void}) {
 if(!delivery.clicked&&!delivery.reported)return null;
 return <section className="simulation-feedback" aria-label="Simulation feedback"><h3>{delivery.reported?'Your report is recorded':'This was a controlled training link'}</h3><p>{delivery.reported?'Reporting gives your team a chance to investigate an unusual request.':'No password or payment details were collected. Pause and verify unexpected requests before following links.'}</p>{template&&<><h4>Warning signs in the original template</h4><ul>{template.indicators.map(sign=><li key={sign}>{sign}</li>)}</ul><p className="muted">Your administrator may have adapted the message. Compare these signs with the message above.</p></>}<button className="outline-button" onClick={onTraining}>Review phishing awareness lessons</button></section>;
}

