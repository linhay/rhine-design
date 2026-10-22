import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const assets = new URL('../dist/assets/', import.meta.url);
const files = await readdir(assets);
const css = (await Promise.all(files.filter(file => file.endsWith('.css')).map(file => readFile(new URL(file, assets), 'utf8')))).join('\n');
for (const required of ['--tod-bg:', '.tod-theme', '.tod-button', '.ds-startup']) {
  if (!css.includes(required)) throw new Error(`Design kit build lost required stylesheet content: ${required}`);
}
if (!files.some(file => /^logo-.*\.svg$/.test(file))) throw new Error('Design kit build lost the SVG master asset');
const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
for (const match of html.matchAll(/(?:src|href)="(\.\/assets\/[^"#]+)"/g)) {
  await readFile(new URL(join('../dist/', match[1]), import.meta.url));
}
console.log('Design kit build verified: theme, controls, startup styles and SVG asset retained');
