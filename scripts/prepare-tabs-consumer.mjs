// Node 24. Build a fresh synthetic consumer from a fixed tarball, using public exports.
// node scripts/prepare-tabs-consumer.mjs candidate.tgz /new/consumer
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const [tarball, destination] = process.argv.slice(2);
if (!tarball || !destination) throw new Error('Provide a fixed tarball and a new consumer directory.');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(destination);
await mkdir(target);
const source = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
await writeFile(resolve(target, 'package.json'), JSON.stringify({ name:'tabs-synthetic-consumer', version:'0.0.0', private:true, type:'module', scripts:{ build:'vite build', preview:'vite preview' }, dependencies:{ '@linhey/rhine-design':`file:${resolve(tarball)}`, react:source.devDependencies.react, 'react-dom':source.devDependencies['react-dom'] }, devDependencies:{ vite:source.devDependencies.vite, '@vitejs/plugin-react':source.devDependencies['@vitejs/plugin-react'] } }, null, 2));
await writeFile(resolve(target, 'index.html'), '<html lang="zh-CN"><head><meta charset="utf-8"><link rel="icon" href="data:,"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>');
await writeFile(resolve(target, 'main.tsx'), `import React from 'react';
import {createRoot} from 'react-dom/client';
import {ThemeProvider} from '@linhey/rhine-design/theme';
import {SummaryTabsGallery} from './SummaryTabsGallery';
import '@linhey/rhine-design/styles.css';
import './layout.css';
const theme = new URLSearchParams(location.search).get('theme') || 'rhine';
createRoot(document.getElementById('root')!).render(<ThemeProvider defaultTheme={theme}><SummaryTabsGallery /></ThemeProvider>);`);
await writeFile(resolve(target, 'vite.config.ts'), "import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';export default defineConfig({plugins:[react()]});");
await writeFile(resolve(target, 'SummaryTabsGallery.tsx'), (await readFile(resolve(root, 'preview/SummaryTabsGallery.tsx'), 'utf8')).replaceAll("'../components'", "'@linhey/rhine-design'"));
const layout = (await readFile(resolve(root, 'preview/preview.css'), 'utf8')).split('\n').filter(line => line.startsWith('.ds-tabs-layout-comparison')).join('\n');
await writeFile(resolve(target, 'layout.css'), `body {margin:0;}\n${layout}\n`);
execFileSync('npm', ['install'], {cwd:target,stdio:'inherit'});
execFileSync('npm', ['run','build'], {cwd:target,stdio:'inherit'});
