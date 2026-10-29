// Node 24. Build the example from the installed immutable package, with styles imported last.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
const [tarball,destination]=process.argv.slice(2);
if(!tarball || !destination) throw Error('Provide a fixed tarball and a NEW consumer directory.');
const artifact=resolve(tarball), target=resolve(destination);
const pkg=JSON.parse(execFileSync('tar',['-xOf',artifact,'package/package.json'],{encoding:'utf8'}));
await mkdir(target);
await writeFile(resolve(target,'package.json'),JSON.stringify({name:'template-settings-consumer',version:'0.0.0',private:true,type:'module',scripts:{build:'vite build',preview:'vite preview'},dependencies:{'@linhey/rhine-design':`file:${artifact}`,react:pkg.devDependencies.react,'react-dom':pkg.devDependencies['react-dom']},devDependencies:{vite:pkg.devDependencies.vite,'@vitejs/plugin-react':pkg.devDependencies['@vitejs/plugin-react']}},null,2));
execFileSync('npm',['install'],{cwd:target,stdio:'inherit'});
const fixture=(await readFile(resolve(target,'node_modules/@linhey/rhine-design/preview/TemplateSettingsGallery.tsx'),'utf8')).replaceAll("'../components'","'@linhey/rhine-design'").replaceAll("'../components/theme'","'@linhey/rhine-design/theme'");
await writeFile(resolve(target,'TemplateSettingsGallery.tsx'),fixture);
await writeFile(resolve(target,'template-settings.css'),await readFile(resolve(target,'node_modules/@linhey/rhine-design/preview/template-settings.css')));
await writeFile(resolve(target,'main.tsx'),"import React from 'react';import {createRoot} from 'react-dom/client';import {TemplateSettingsFixture} from './TemplateSettingsGallery';import '@linhey/rhine-design/styles.css?late';createRoot(document.getElementById('root')!).render(<TemplateSettingsFixture/>);");
await writeFile(resolve(target,'index.html'),'<html><head><link rel="icon" href="data:,"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>');
await writeFile(resolve(target,'vite.config.ts'),"import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';export default defineConfig({plugins:[react()]});");
execFileSync('npm',['run','build'],{cwd:target,stdio:'inherit'});
