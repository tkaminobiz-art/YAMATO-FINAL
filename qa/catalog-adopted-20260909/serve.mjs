// Loopback-only verification server with the byte-range behavior expected from the production CDN.
import http from 'node:http';
import {stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
const root=resolve(process.argv[2]||'public'),port=Number(process.argv[3]||8927);
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp4':'video/mp4','.woff2':'font/woff2'};
http.createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(path==='/api/instagram'){ const upstream=await fetch('https://yamato-final.vercel.app/api/instagram',{signal:AbortSignal.timeout(28000),headers:{Accept:'application/json'}}); const body=await upstream.arrayBuffer(); res.writeHead(upstream.status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(Buffer.from(body));return;}
  if(path.endsWith('/'))path+='index.html';
  const file=resolve(root,'.'+path);
  if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  const info=await stat(file);
  if(!info.isFile())throw Error('not file');
  const headers={'Content-Type':types[extname(file)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-cache'};
  let start=0,end=info.size-1,status=200;
  if(req.headers.range){
   const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
   if(!match||(!match[1]&&!match[2])){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;}
   if(match[1]){start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
   else start=Math.max(0,info.size-Number(match[2]));
   if(start>end||start>=info.size){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;}
   status=206;headers['Content-Range']=`bytes ${start}-${end}/${info.size}`;
  }
  headers['Content-Length']=end-start+1;res.writeHead(status,headers);
  if(req.method==='HEAD')res.end();else createReadStream(file,{start,end}).pipe(res);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(JSON.stringify({root,port,range:true})));
