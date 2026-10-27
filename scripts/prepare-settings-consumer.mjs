// Node 24. Creates a NEW isolated Vite consumer; never modifies an installed package.
// node scripts/prepare-settings-consumer.mjs candidate.tgz /new/consumer [--late-css]
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const [tarball, destination, order] = process.argv.slice(2);
if (!tarball || !destination) throw new Error('Provide a fixed tarball and a new consumer directory.');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(destination);
await mkdir(target); // Existing candidates are immutable; use a fresh directory.
const sourcePackage = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
await writeFile(resolve(target, 'package.json'), JSON.stringify({name:'settings-dialog-synthetic-consumer',version:'0.0.0',private:true,type:'module',scripts:{build:'vite build',preview:'vite preview'},dependencies:{'@linhey/rhine-design':`file:${resolve(tarball)}`,react:sourcePackage.devDependencies.react,'react-dom':sourcePackage.devDependencies['react-dom']},devDependencies:{vite:sourcePackage.devDependencies.vite,'@vitejs/plugin-react':sourcePackage.devDependencies['@vitejs/plugin-react']}}, null, 2));
await writeFile(resolve(target, 'index.html'), '<html><head><link rel="icon" href="data:,"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>');
await writeFile(resolve(target, 'main.tsx'), `import React from 'react';\nimport {createRoot} from 'react-dom/client';\nimport {SettingsDialogFixture} from './SettingsDialogGallery';\n${order === '--late-css' ? "import '@linhey/rhine-design/styles.css?late';" : ''}\ncreateRoot(document.getElementById('root')!).render(<SettingsDialogFixture/>);`);
await writeFile(resolve(target, 'vite.config.ts'), "import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';export default defineConfig({plugins:[react()]});");
const fixture = (await readFile(resolve(root, 'preview/SettingsDialogGallery.tsx'), 'utf8')).replaceAll("'../components'", "'@linhey/rhine-design'").replaceAll("'../components/theme'", "'@linhey/rhine-design/theme'");
await writeFile(resolve(target, 'SettingsDialogGallery.tsx'), fixture);
await writeFile(resolve(target, 'settings-dialog-gallery.css'), await readFile(resolve(root, 'preview/settings-dialog-gallery.css')));
execFileSync('npm', ['install'], {cwd:target,stdio:'inherit'});
execFileSync('npm', ['run','build'], {cwd:target,stdio:'inherit'});
