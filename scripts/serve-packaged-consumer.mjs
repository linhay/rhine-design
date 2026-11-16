import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const manifestPath=path.resolve(process.argv[2]??'');
assert(process.argv[2],'provide the accepted consumer manifest');
const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
assert(manifest.pass&&manifest.consumer?.directory,'consumer must pass packaging/type/build checks first');
const consumer=await realpath(manifest.consumer.directory),marker=JSON.parse(await readFile(path.join(consumer,'.rhine-consumer-owner.json'),'utf8'));
assert(marker.nonce===manifest.consumer.marker&&marker.artifact===manifest.artifact.sha256,'wrong owned consumer');
const dist=await realpath(path.join(consumer,'dist')),rootOnly=await realpath(path.join(consumer,'dist-root'));
const port=Number(process.argv[3]??18498);assert(Number.isSafeInteger(port)&&port>1024&&port<65536);
const attempts=new Map(),pendingSlow=new Map();
const svg="<svg xmlns='http://www.w3.org/2000/svg' width='240' height='120'><rect width='240' height='120' fill='#dce8d5'/><path d='M24 100 120 20 216 100Z' fill='#425c4b'/></svg>";
const mimes={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};
const server=createServer(async(request,response)=>{
  try{
    const url=new URL(request.url,'http://127.0.0.1');
    response.setHeader('Cache-Control','no-store');
    if(url.pathname==='/release-image'){
      const run=url.searchParams.get('run')??'default',waiting=pendingSlow.get(run)??new Set();let released=0;
      for(const item of [...waiting])if(!item.destroyed){released++;item.end(svg);}
      response.setHeader('Content-Type','application/json');response.end(JSON.stringify({released}));return;
    }
    if(url.pathname.startsWith('/fixtures/')){
      const kind=path.basename(url.pathname,'.svg'),key=`${kind}:${url.searchParams.get('run')??'default'}`,count=(attempts.get(key)??0)+1;attempts.set(key,count);
      response.setHeader('Content-Type','image/svg+xml');
      if(kind==='slow'){
        const run=url.searchParams.get('run')??'default',waiting=pendingSlow.get(run)??new Set();waiting.add(response);pendingSlow.set(run,waiting);
        const deadline=setTimeout(()=>{if(!response.destroyed){response.statusCode=504;response.end('<svg unavailable');}},30000);deadline.unref();
        response.once('close',()=>{clearTimeout(deadline);waiting.delete(response);if(!waiting.size)pendingSlow.delete(run);});return;
      }
      if(kind==='bad'||(kind==='retry'&&count===1)){response.statusCode=503;response.end('<svg broken');return;}
      if(kind==='good'||kind==='retry'){response.end(svg);return;}
      response.statusCode=404;response.end();return;
    }
    if(url.pathname==='/health'){response.setHeader('Content-Type','application/json');response.end(JSON.stringify({artifact:manifest.artifact.sha256}));return;}
    const root=url.pathname.startsWith('/root-only/')?rootOnly:dist;
    let relative=decodeURIComponent(root===rootOnly?url.pathname.slice('/root-only/'.length):url.pathname.slice(1));
    if(!relative)relative=root===rootOnly?'root-only.html':'index.html';
    assert(!relative.split('/').includes('..')&&!path.isAbsolute(relative),'invalid request path');
    const file=await realpath(path.join(root,relative));assert(file===root||file.startsWith(root+path.sep),'path escaped owned build');assert((await stat(file)).isFile());
    response.setHeader('Content-Type',mimes[path.extname(file)]??'application/octet-stream');response.end(await readFile(file));
  }catch{response.statusCode=404;response.end('not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Owned packaged consumer http://127.0.0.1:${port}/ ; artifact ${manifest.artifact.sha256}`));
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{server.close(()=>process.exit(0));server.closeAllConnections();});
