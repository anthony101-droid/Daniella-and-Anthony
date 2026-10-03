import Image from 'next/image';

export type PageArtKind='welcome'|'protection'|'simulation'|'notifications';
const artwork:Record<PageArtKind,{src:string;alt:string;width:number;height:number}>={
 welcome:{src:'secure-workspace',alt:'Illustration of a protected email workspace',width:500,height:500},
 protection:{src:'protected-email',alt:'An email envelope secured by a shield, check mark, and closed padlock',width:1024,height:768},
 simulation:{src:'simulation-employee',alt:'An employee reviewing a laptop, illustrating workplace simulation practice',width:1000,height:563},
 notifications:{src:'phishing-hook',alt:'A phishing alert illustration showing a hooked email envelope above a laptop',width:1400,height:753},
};
export default function PageArt({kind}:{kind:PageArtKind}){
 const art=artwork[kind];
 return <div className={'page-art page-art-'+kind}><Image src={'/images/design/'+art.src+'.webp'} alt={art.alt} width={art.width} height={art.height} loading="lazy"/></div>;
}
