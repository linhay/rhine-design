// Prepare an independent consumer from the ONE frozen tarball. Node 24.
import { mkdir, readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const [tarball, destination] = process.argv.slice(2);
if (!tarball || !destination) throw Error('Provide fixed tarball and NEW directory');
const artifact = resolve(tarball), target = resolve(destination), source = process.cwd();
const pkg = JSON.parse(execFileSync('tar', ['-xOf', artifact, 'package/package.json'], { encoding: 'utf8' }));
await mkdir(target);
await writeFile(resolve(target, 'package.json'), JSON.stringify({ name: 'resident-tree-consumer', version: '0.0.0', private: true, type: 'module', scripts: { build: 'vite build' }, dependencies: { '@linhey/rhine-design': `file:${artifact}`, react: pkg.devDependencies.react, 'react-dom': pkg.devDependencies['react-dom'] }, devDependencies: { vite: pkg.devDependencies.vite, '@vitejs/plugin-react': pkg.devDependencies['@vitejs/plugin-react'] } }, null, 2));
execFileSync('npm', ['install'], { cwd: target, stdio: 'inherit' });
const installed = resolve(target, 'node_modules/@linhey/rhine-design');
const names = execFileSync('tar', ['-tzf', artifact], { encoding: 'utf8' }).trim().split('\n').filter(name => !name.endsWith('/'));
let count = 0; const hashes = {};
for (const entry of names) {
  const file = entry.replace(/^package\//, ''), packed = execFileSync('tar', ['-xOf', artifact, entry]);
  const actual = await readFile(resolve(installed, file)), original = await readFile(resolve(source, file));
  if (!packed.equals(actual) || !packed.equals(original)) throw Error(`Source/tarball/installed mismatch: ${file}`);
  hashes[file] = createHash('sha256').update(packed).digest('hex'); count++;
}
for (const file of ['ResidentTreeRecipe.tsx', 'ResidentTreeGallery.tsx', 'resident-tree.css']) {
  let content = await readFile(resolve(installed, 'preview', file), 'utf8');
  content = content.replaceAll("'../components'", "'@linhey/rhine-design'").replaceAll("'../components/theme'", "'@linhey/rhine-design/theme'");
  await writeFile(resolve(target, file), content);
}
await writeFile(resolve(target, 'main.tsx'), "import React from 'react';import {createRoot} from 'react-dom/client';import {ResidentTreeFixture} from './ResidentTreeGallery';import '@linhey/rhine-design/styles.css';createRoot(document.getElementById('root')!).render(<ResidentTreeFixture/>);");
await writeFile(resolve(target, 'index.html'), '<!doctype html><html lang="zh-CN"><head><link rel="icon" href="data:,"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>');
await writeFile(resolve(target, 'vite.config.ts'), "import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';export default defineConfig({plugins:[react()]});");
execFileSync('npm', ['run', 'build'], { cwd: target, stdio: 'inherit' });
const sha256 = createHash('sha256').update(await readFile(artifact)).digest('hex');
const digest = async folder => { const result = {}; for (const name of await readdir(folder)) { const path = resolve(folder,name); if ((await stat(path)).isDirectory()) Object.assign(result,await digest(path)); else result[relative(target,path)] = createHash('sha256').update(await readFile(path)).digest('hex'); } return result; };
await writeFile(resolve(target, 'candidate-verification.json'), JSON.stringify({ sha256, fileCount: count, files: hashes, build: await digest(resolve(target,'dist')), publicImportsOnly: true, sourceHead: execFileSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'}).trim(), status: 'PASS' }, null, 2));
console.log(JSON.stringify({ status:'PASS', sha256, matchedFiles:count }));
