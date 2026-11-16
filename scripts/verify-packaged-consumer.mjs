import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { cp, mkdir, mkdtemp, readFile, readdir, realpath, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const sourceRoot=fileURLToPath(new URL('../',import.meta.url));
const output=path.resolve(process.argv[2]??path.join(sourceRoot,'.local/completion-20261116'));
await mkdir(output,{recursive:true});
const run=await mkdtemp(path.join(output,'package-'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const manifest={schema:'RhinePackagedConsumer',run,startedAt:new Date().toISOString(),pass:false,stages:[],limits:['isolated synthetic consumer, not a real product upgrade','no npm publish','browser verification is a separate stage']};
async function inventory(directory,prefix=''){const result={};for(const entry of await readdir(directory,{withFileTypes:true})){const relative=prefix+entry.name,full=path.join(directory,entry.name);if(entry.isDirectory())Object.assign(result,await inventory(full,relative+'/'));else if(entry.isFile())result[relative]=sha(await readFile(full));else throw new Error('unexpected build symlink');}return result;}
const report=async()=>writeFile(path.join(run,'manifest.json'),JSON.stringify(manifest,null,2));
function command(executable,args,cwd,label){
  try{const stdout=execFileSync(executable,args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:32*1024*1024,env:process.env});return stdout;}
  catch(error){throw Object.assign(new Error(`${label} failed: ${error.message}`),{stdout:String(error.stdout??''),stderr:String(error.stderr??'')});}
}
try{
  const declared=JSON.parse(await readFile(path.join(sourceRoot,'package.json'),'utf8')),sourceLock=JSON.parse(await readFile(path.join(sourceRoot,'package-lock.json'),'utf8'));
  assert.deepEqual(declared.dependencies,sourceLock.packages[''].dependencies,'source runtime dependency lock mismatch');
  assert.deepEqual(declared.devDependencies,sourceLock.packages[''].devDependencies,'source development dependency lock mismatch');
  manifest.stages.push('source-lock-consistency');
  const packed=JSON.parse(command('npm',['pack','--json','--ignore-scripts','--pack-destination',run],sourceRoot,'pack'))[0];
  const tarball=path.join(run,packed.filename);
  assert(path.dirname(tarball)===run);
  manifest.artifact={file:tarball,sha256:sha(await readFile(tarball)),integrity:packed.integrity,files:packed.files.length,version:packed.version};await report();
  const entries=command('/usr/bin/tar',['-tzf',tarball],sourceRoot,'inventory').split('\n').filter(Boolean);
  assert(entries.every(name=>name.startsWith('package/')&&!name.split('/').includes('..')&&!path.posix.isAbsolute(name)),'unsafe package path');
  const extracted=path.join(run,'extracted');await mkdir(extracted);command('/usr/bin/tar',['-xzf',tarball,'-C',extracted],sourceRoot,'extract');
  const consumer=await mkdtemp(path.join(await realpath(tmpdir()),'rhine-consumer-'));
  assert(!consumer.startsWith(sourceRoot),'consumer may not inherit checkout node_modules');
  const marker={goal:'web-215-completion',nonce:randomUUID(),consumer,artifact:manifest.artifact.sha256};
  await writeFile(path.join(consumer,'.rhine-consumer-owner.json'),JSON.stringify(marker));manifest.consumer={directory:consumer,marker:marker.nonce};await report();
  const pkg={name:'rhine-isolated-consumer',version:'0.0.0',private:true,type:'module',scripts:{typecheck:'tsc --noEmit',build:'vite build', 'build:root':'vite build --config vite.root.config.ts'},dependencies:{'@linhey/rhine-design':`file:${tarball}`,react:'19.3.1','react-dom':'19.3.1'},devDependencies:{'@types/react':'19.3.0','@types/react-dom':'19.3.0','@types/node':'26.6.5','@vitejs/plugin-react':'6.1.2',typescript:'5.9.3',vite:'8.3.4'}};
  for(const name of Object.keys(pkg.devDependencies))pkg.devDependencies[name]=sourceLock.packages[''].devDependencies[name];
  await writeFile(path.join(consumer,'package.json'),JSON.stringify(pkg,null,2));
  await mkdir(path.join(consumer,'src'));await cp(new URL('./consumer-fixture/main.tsx',import.meta.url),path.join(consumer,'src/main.tsx'));await cp(new URL('./consumer-fixture/style.css',import.meta.url),path.join(consumer,'src/style.css'));await cp(new URL('./consumer-fixture/root-only.tsx',import.meta.url),path.join(consumer,'src/root-only.tsx'));
  for(const [filename,entry] of [['index.html','main'],['root-only.html','root-only']])await writeFile(path.join(consumer,filename),`<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Rhine isolated packaged consumer</title></head><body><div id="root"></div><script type="module" src="/src/${entry}.tsx"></script></body></html>`);
  await writeFile(path.join(consumer,'tsconfig.json'),JSON.stringify({compilerOptions:{target:'ES2022',lib:['ES2022','DOM','DOM.Iterable'],module:'ESNext',moduleResolution:'Bundler',jsx:'react-jsx',strict:true,noEmit:true,skipLibCheck:true,resolveJsonModule:true,esModuleInterop:true,types:['vite/client','node']},include:['src','vite.config.ts','vite.root.config.ts']},null,2));
  const config="import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';export default defineConfig({base:'./',plugins:[react()],resolve:{dedupe:['react','react-dom']}});";
  await writeFile(path.join(consumer,'vite.config.ts'),config);
  await writeFile(path.join(consumer,'vite.root.config.ts'),"import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';export default defineConfig({base:'./',plugins:[react()],build:{outDir:'dist-root',rollupOptions:{input:'root-only.html'}},resolve:{dedupe:['react','react-dom']}});");
  let install;
  try{install=command('npm',['install','--offline','--ignore-scripts','--no-audit','--no-fund'],consumer,'offline install');manifest.installMode='offline';}
  catch(error){await writeFile(path.join(run,'offline-install-failure.log'),`${error.stdout}\n${error.stderr}`);install=command('npm',['install','--ignore-scripts','--no-audit','--no-fund','--registry=https://registry.npmjs.org/'],consumer,'public install');manifest.installMode='public registry after cache miss';}
  await writeFile(path.join(run,'install.log'),install);manifest.stages.push('fresh-install');await report();
  const installed=path.join(consumer,'node_modules/@linhey/rhine-design');
  const files={};
  for(const item of packed.files){const relative=item.path;assert(!path.isAbsolute(relative)&&!relative.split('/').includes('..'));const original=path.join(extracted,'package',relative),actual=path.join(installed,relative);assert((await stat(actual)).isFile(),`missing installed file ${relative}`);const expected=sha(await readFile(original)),observed=sha(await readFile(actual));assert.equal(observed,expected,`installed content differs: ${relative}`);files[relative]=observed;}
  manifest.installedFiles=files;manifest.stages.push('all-installed-files-match-tarball');
  const lock=JSON.parse(await readFile(path.join(consumer,'package-lock.json'),'utf8'));
  const binding=lock.packages['node_modules/@linhey/rhine-design'];assert.equal(binding.integrity,packed.integrity);assert(binding.resolved.startsWith('file:'),'not a fixed local tarball');
  manifest.lock={resolved:binding.resolved,integrity:binding.integrity,sha256:sha(await readFile(path.join(consumer,'package-lock.json')))};await cp(path.join(consumer,'package-lock.json'),path.join(run,'consumer-lock.json'));
  const tree=JSON.parse(command('npm',['ls','react','react-dom','--all','--json'],consumer,'peer tree'));await writeFile(path.join(run,'dependency-tree.json'),JSON.stringify(tree,null,2));
  assert.equal(JSON.parse(await readFile(path.join(consumer,'node_modules/react/package.json'),'utf8')).version,'19.3.1');
  const consumerRequire=createRequire(path.join(consumer,'package.json')),packageRequire=createRequire(path.join(installed,'package.json'));
  for(const peer of ['react','react-dom'])assert.equal(await realpath(consumerRequire.resolve(peer)),await realpath(packageRequire.resolve(peer)),`duplicate peer resolution: ${peer}`);
  manifest.stages.push('peer-identity');
  await writeFile(path.join(run,'typecheck.log'),command('npm',['run','typecheck'],consumer,'typecheck'));manifest.stages.push('public-types');await report();
  await writeFile(path.join(run,'build.log'),command('npm',['run','build'],consumer,'consumer build'));await writeFile(path.join(run,'root-build.log'),command('npm',['run','build:root'],consumer,'root-only build'));manifest.stages.push('public-entry-build','root-only-build');
  const nodeEntry=command(process.execPath,['--input-type=module','-e',"import {reviewPlugin,reviewProductionGuard} from '@linhey/rhine-design/review/vite';if(typeof reviewPlugin!=='function'||typeof reviewProductionGuard!=='function')process.exit(1);console.log('review/vite native ESM imports passed')"],consumer,'review node entry');await writeFile(path.join(run,'node-entry.log'),nodeEntry);manifest.stages.push('review-vite-node-entry');
  manifest.productionAssets={dist:await inventory(path.join(consumer,'dist')),rootOnly:await inventory(path.join(consumer,'dist-root'))};
  const css=packed.files.filter(item=>item.path.endsWith('.css'));assert(css.length>0);manifest.cssSourceFiles=css.length;
  manifest.pass=true;manifest.completedAt=new Date().toISOString();await report();
  console.log(JSON.stringify({pass:true,manifest:path.join(run,'manifest.json'),consumer,tarball,sha256:manifest.artifact.sha256,verifiedFiles:Object.keys(files).length}));
}catch(error){manifest.failure={message:error.message,stdout:error.stdout,stderr:error.stderr};await report();console.error(JSON.stringify({pass:false,manifest:path.join(run,'manifest.json'),error:error.message}));process.exitCode=1;}
