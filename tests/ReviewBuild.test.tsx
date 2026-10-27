// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { build, preview } from 'vite';
import react from '@vitejs/plugin-react';
import { reviewPlugin, reviewProductionGuard } from '../review/vite.mjs';

const directories: string[] = [];
async function fixture() { const path = await mkdtemp(join(tmpdir(), 'rhine-review-test-')); directories.push(path); return path; }
afterEach(async () => { await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true }))); });
describe('review build integration', () => {
  it('emits both HTML documents with real final CSS and nested-base assets', async () => {
    const root = await fixture();
    await build({ configFile: false, root, base: '/nested/review/', logLevel: 'silent', plugins: [react(), reviewPlugin({ catalog: resolve('examples/review/http/catalog.tsx') })] });
    for (const name of ['index.html', 'canvas.html']) {
      const html = await readFile(join(root, 'dist', name), 'utf8');
      const css = html.match(/rel="stylesheet" href="\/nested\/review\/([^\"]+\.css)"/)?.[1];
      expect(css).toBeTruthy();
      expect(await readFile(join(root, 'dist', css!), 'utf8')).toContain('.rhine-review-header');
      expect(html).toContain("connect-src 'none'");
      expect(html).toMatch(/src="\/nested\/review\/assets\/.+\.js"/);
    }
    const server = await preview({ configFile: false, root, base: '/nested/review/', logLevel: 'silent', plugins: [reviewPlugin({ catalog: resolve('examples/review/http/catalog.tsx') })], preview: { host: '127.0.0.1', port: 0 } });
    try {
      const address = server.httpServer.address();
      if (!address || typeof address === 'string') throw new Error('Missing preview port');
      const response = await fetch(`http://127.0.0.1:${address.port}/nested/review/`);
      expect(response.status).toBe(200);
      expect(await response.text()).toContain('Rhine Review');
      expect((await fetch(`http://127.0.0.1:${address.port}/nested/review/api/missing`)).status).toBe(404);
    } finally { await new Promise<void>((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve())); }
  }, 20000);
  it('allows production theme directories but rejects explicit fixture paths', async () => {
    const root = await fixture();
    await mkdir(join(root, 'design')); await mkdir(join(root, 'fixtures'));
    await writeFile(join(root, 'design/theme.js'), 'export const theme = "synthetic-theme";');
    await writeFile(join(root, 'fixtures/data.js'), 'export const data = "synthetic-fixture";');
    const entry = join(root, 'entry.js');
    const options = { configFile: false as const, root, logLevel: 'silent' as const, plugins: [reviewProductionGuard({ forbidden: ['./fixtures'] })], build: { lib: { entry, formats: ['es' as const] } } };
    await writeFile(entry, 'export {theme} from "./design/theme.js";');
    await expect(build(options)).resolves.toBeTruthy();
    await writeFile(entry, 'export {data} from "./fixtures/data.js";');
    await expect(build(options)).rejects.toThrow('forbidden fixtures: fixtures/data.js');
  }, 20000);
  it('rejects accidental official runtime inclusion without a product denylist', async () => {
    const root = await fixture(); const entry = join(root, 'entry.js');
    await writeFile(entry, `export { defineReview } from ${JSON.stringify(resolve('review/index.ts'))};`);
    await expect(build({ configFile: false, root, logLevel: 'silent', plugins: [reviewProductionGuard()], build: { lib: { entry, formats: ['es'] } } })).rejects.toThrow('Production bundle imports review runtime');
  }, 20000);
  it('refuses backend proxy and project env configuration', async () => {
    const root = await fixture();
    await expect(build({ configFile: false, root, logLevel: 'silent', plugins: [reviewPlugin({ catalog: './catalog.tsx' })], server: { proxy: { '/api': 'http://synthetic.invalid' } } })).rejects.toThrow('no server/preview proxies');
  });
});
