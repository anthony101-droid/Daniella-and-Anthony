export default function LoadingPlaceholder({label,rows=3}:{label:string;rows?:number}){
 return <div className="loading-placeholder" role="status" aria-live="polite"><span className="sr-only">{label}</span><div aria-hidden="true">{Array.from({length:rows},(_,i)=><div className="loading-placeholder-row" key={i}><span className="loading-placeholder-icon"/><div><span className="loading-placeholder-line"/><span className="loading-placeholder-line short"/></div></div>)}</div></div>;
}
