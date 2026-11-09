import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const [pack] = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { encoding: 'utf8' }));
const files = pack.files.map(file => file.path);
for (const path of files) {
  assert(!path.split('/').some(part => part === 'node_modules' || part.startsWith('.vite') || part.startsWith('.playwright')), `Package includes development cache: ${path}`);
}
for (const path of ['review/index.ts', 'review/vite.mjs', 'review/vite.d.mts', 'review/dev-client.mjs', 'examples/review/http/catalog.tsx', 'examples/review/platform/catalog.tsx', 'examples/review/product.css']) {
  assert(files.includes(path), `Package omits review entry/example: ${path}`);
}
console.log('Review package verified: public entries/examples included, development caches excluded.');
