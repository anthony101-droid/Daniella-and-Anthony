import type {Workspace} from './platform';
type Company={id:string;name:string;people?:{id:string;name:string;email:string;department:string;jobRole?:string;status:string}[]};
type CompanyAccess={companyId:string;workspace:Workspace;revision:number;companies?:Company[]};
export function mergeSavedCompany<T extends CompanyAccess>(current:T,workspace:Workspace,revision:number):T {
 return {...current,workspace,revision,companies:current.companies?.map(company=>company.id!==current.companyId?company:{...company,name:workspace.organization,people:workspace.employees.filter(e=>e.active).map(e=>({...e,status:company.people?.find(p=>p.id===e.id&&p.email===e.email)?.status??'Not invited'}))}).sort((a,b)=>a.name.localeCompare(b.name))};
}
