import Image from 'next/image';

export type PageArtKind='welcome'|'protection'|'simulation'|'notifications';
const artwork:Record<PageArtKind,{src:string;alt:string}>={
 welcome:{src:'secure-workspace',alt:'Illustration of a protected email workspace'},
 protection:{src:'email-warning',alt:'Email envelope with a phishing warning'},
 simulation:{src:'phishing-practice',alt:'Illustration of a phishing message and a password request'},
 notifications:{src:'email-warning',alt:'Email warning envelope'},
};
export default function PageArt({kind}:{kind:PageArtKind}){
 const art=artwork[kind];
 return <div className={'page-art page-art-'+kind}><Image src={'/images/design/'+art.src+'.webp'} alt={art.alt} width={kind==='welcome'||kind==='simulation'?500:639} height={kind==='welcome'||kind==='simulation'?500:360} loading="lazy"/></div>;
}
