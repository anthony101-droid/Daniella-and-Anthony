export async function readBounded(req:Request,max:number):Promise<string>{
 const declared=Number(req.headers.get('content-length'));if(declared>max)throw Error('Request too large');
 if(!req.body)return '';const reader=req.body.getReader(),chunks:Uint8Array[]=[];let total=0;
 try{while(true){const {value,done}=await reader.read();if(done)break;total+=value.length;if(total>max){await reader.cancel();throw Error('Request too large');}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(total);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}return new TextDecoder().decode(bytes);
}
