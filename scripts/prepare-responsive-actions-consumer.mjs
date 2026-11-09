// Fresh installed-tarball fixture with public CSS loaded last. Node 24.
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const [tarball,destination]=process.argv.slice(2);
if(!tarball||!destination)throw Error('Provide fixed tarball and NEW directory');
const artifact=resolve(tarball),target=resolve(destination),pkg=JSON.parse(execFileSync('tar',['-xOf',artifact,'package/package.json'],{encoding:'utf8'}));
await mkdir(target);
await writeFile(resolve(target,'package.json'),JSON.stringify({name:'responsive-actions-consumer',version:'0.0.0',private:true,type:'module',scripts:{build:'vite build'},dependencies:{'@linhey/rhine-design':`file:${artifact}`,react:pkg.devDependencies.react,'react-dom':pkg.devDependencies['react-dom']},devDependencies:{vite:pkg.devDependencies.vite,'@vitejs/plugin-react':pkg.devDependencies['@vitejs/plugin-react']}},null,2));
execFileSync('npm',['install'],{cwd:target,stdio:'inherit'});
for(const file of ['ResponsiveActionsGallery.tsx']){
 const source=await readFile(resolve(target,'node_modules/@linhey/rhine-design/preview',file),'utf8');
 await writeFile(resolve(target,file),source.replaceAll("'../components'","'@linhey/rhine-design'").replaceAll("'../components/theme'","'@linhey/rhine-design/theme'"));
}
await writeFile(resolve(target,'main.tsx'),"import React from 'react';import {createRoot} from 'react-dom/client';import {ResponsiveActionsFixture} from './ResponsiveActionsGallery';import '@linhey/rhine-design/styles.css?late';createRoot(document.getElementById('root')!).render(<ResponsiveActionsFixture/>);");
await writeFile(resolve(target,'index.html'),'<!doctype html><html lang="zh-CN"><head><link rel="icon" href="data:,"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>');
await writeFile(resolve(target,'vite.config.ts'),"import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';export default defineConfig({plugins:[react()]});");
execFileSync('npm',['run','build'],{cwd:target,stdio:'inherit'});
