'use client';
import {UserRound,Mail,Building2,ShieldCheck} from 'lucide-react';
export default function AccountSettings({email,name,company,role}:{email:string;name:string;company:string;role:string}){
 return <div className="account-settings profile-only"><section className="panel integration-panel profile-panel"><div className="protection-title"><span className="protection-icon"><UserRound size={22}/></span><div><h2>Your profile</h2><p>Your account and organization details.</p></div></div><dl className="profile-details"><div><dt><UserRound size={15}/>Name</dt><dd>{name}</dd></div><div><dt><Mail size={15}/>Email</dt><dd>{email}</dd></div><div><dt><Building2 size={15}/>Company</dt><dd>{company}</dd></div><div><dt><ShieldCheck size={15}/>Role</dt><dd><span className="profile-role">{role}</span></dd></div></dl><p className="profile-help">Contact your company administrator to correct your profile details.</p></section></div>;
}
