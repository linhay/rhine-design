import { readFileSync } from 'node:fs';

const index = readFileSync(new URL('../components/index.ts', import.meta.url), 'utf8');
const catalog = readFileSync(new URL('../components/CATALOG.md', import.meta.url), 'utf8');

const exports = [];
for (const block of index.matchAll(/export \{([^}]+)\}/g)) {
  for (const part of block[1].split(',')) {
    const name = part.trim().replace(/^type\s+/, '');
    if (!part.trim() || part.trim().startsWith('type ')) continue;
    exports.push(name.split(/\s+as\s+/)[0].trim());
  }
}

const rows = [...catalog.matchAll(/^\| `([A-Za-z][A-Za-z0-9]*)` \|/gm)].map(match => match[1]);
const expected = new Map();
for (const name of exports) expected.set(name, (expected.get(name) ?? 0) + 1);
const actual = new Map();
for (const name of rows) actual.set(name, (actual.get(name) ?? 0) + 1);

const missing = [...expected.keys()].filter(name => actual.get(name) !== 1);
const unexpected = [...actual.keys()].filter(name => !expected.has(name));
const duplicatedExports = [...expected.entries()].filter(([, count]) => count !== 1).map(([name]) => name);

if (missing.length || unexpected.length || duplicatedExports.length) {
  console.error(JSON.stringify({ missing, unexpected, duplicatedExports }, null, 2));
  process.exit(1);
}

console.log(`component catalog matches ${exports.length} value exports`);
