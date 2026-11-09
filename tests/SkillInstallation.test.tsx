import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const source = resolve(process.env.RHINE_SKILL_SOURCE ?? 'skills/rhine-design');
const sandboxes: string[] = [];

afterEach(() => {
  for (const sandbox of sandboxes.splice(0)) rmSync(sandbox, { recursive: true, force: true });
});

function install(fromPackage: boolean) {
  const sandbox = mkdtempSync(join(tmpdir(), 'rhine-skill-'));
  sandboxes.push(sandbox);
  const target = join(sandbox, fromPackage ? '.agents/skills/rhine-design' : 'skills/rhine-design');
  if (fromPackage) {
    const packaged = join(sandbox, 'node_modules/@linhey/rhine-design/skills/rhine-design');
    cpSync(source, packaged, { recursive: true });
    // Same source and destination layout as the README's cp -R command.
    cpSync(packaged, target, { recursive: true });
  } else {
    // Only the skill directory is available: no adjacent repository docs.
    cpSync(source, target, { recursive: true });
  }
  return target;
}

function checkLinks(root: string) {
  let localLinks = 0;
  for (const file of readdirSync(root, { recursive: true, encoding: 'utf8' }).filter(file => file.endsWith('.md'))) {
    const document = join(root, file);
    const markdown = readFileSync(document, 'utf8');
    // The skill uses inline Markdown links; code-formatted package paths are not links.
    for (const [, href] of markdown.matchAll(/\[[^\]]*\]\(([^\s)]+)\)/g)) {
      if (/^https?:\/\//.test(href)) {
        const url = new URL(href);
        if (url.hostname === 'github.com' && /^\/linhay\/rhine-design\/(blob|tree)\//.test(url.pathname)) {
          const revision = url.pathname.split('/')[4];
          if (!/^(?:[a-f0-9]{40}|v?\d+\.\d+\.\d+)$/.test(revision)) throw new Error(`Floating source link: ${href}`);
        }
        continue;
      }
      const [path, fragment] = href.split('#');
      const target = path ? resolve(dirname(document), decodeURIComponent(path)) : document;
      const within = relative(root, target);
      if (isAbsolute(within) || within === '..' || within.startsWith('../')) throw new Error(`Link escapes skill: ${href}`);
      if (!existsSync(target)) throw new Error(`Missing link target: ${href}`);
      const realWithin = relative(realpathSync(root), realpathSync(target));
      if (isAbsolute(realWithin) || realWithin === '..' || realWithin.startsWith('../')) throw new Error(`Link escapes skill: ${href}`);
      if (fragment) {
        const headings = [...readFileSync(target, 'utf8').matchAll(/^#{1,6}\s+(.+)$/gm)]
          .map(([, heading]) => heading.toLowerCase().replace(/[^\p{L}\p{N}_\-\s]/gu, '').replace(/\s/g, '-'));
        if (!headings.includes(decodeURIComponent(fragment))) throw new Error(`Missing heading: ${href}`);
      }
      localLinks++;
    }
  }
  return localLinks;
}

describe('portable skill installation', () => {
  it.each([true, false])('keeps links reachable outside the repository (package copy: %s)', fromPackage => {
    expect(checkLinks(install(fromPackage))).toBeGreaterThan(0);
  });

  it.each([
    ['../../../docs/THEMING.md', 'Link escapes skill'],
    ['missing.md', 'Missing link target'],
    ['../SKILL.md#missing-heading', 'Missing heading'],
    ['https://github.com/linhay/rhine-design/blob/main/docs/THEMING.md', 'Floating source link'],
  ])('rejects an invalid installed reference: %s', (href, error) => {
    const root = install(false);
    writeFileSync(join(root, 'references/regression.md'), `[contract](${href})\n`);
    expect(() => checkLinks(root)).toThrow(error);
  });
});
