// @ts-check
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
const directory = dirname(fileURLToPath(import.meta.url));
const ids = { shell: '\0rhine-review:shell', canvas: '\0rhine-review:canvas' };
const csp = "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' blob:; connect-src 'none'; frame-src 'self'; worker-src 'none'; object-src 'none'; form-action 'none'; base-uri 'self'";
/** @param {string} script @param {string[]} styles */
function html(script, styles = []) {
    return `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${csp}"><link rel="icon" href="data:,"><title>Rhine Review</title>${styles.map(style => `<link rel="stylesheet" href="${style}">`).join('')}</head><body><div id="root"></div><script type="module" src="${script}"></script></body></html>`;
}
/** Use in a dedicated config, never merge a production config containing secrets/proxies. */
/** @param {import('./vite.mjs').ReviewViteOptions} options @returns {import('vite').Plugin} */
export function reviewPlugin(options) {
    /** @type {import('vite').ResolvedConfig} */
    let config;
    return {
        name: 'rhine-review',
        enforce: 'pre',
        config(userConfig) {
            const root = userConfig.root ?? process.cwd();
            return {
                appType: 'mpa', envDir: false, publicDir: false, envPrefix: 'RHINE_REVIEW_PUBLIC_',
                server: { hmr: false },
                cacheDir: resolve(root, 'node_modules/.vite-review'),
                optimizeDeps: { entries: [resolve(directory, 'shell.tsx'), resolve(directory, 'canvas.tsx'), resolve(root, options.catalog)] },
                resolve: { dedupe: ['react', 'react-dom'] },
                define: options.routerBase ? { 'import.meta.env.BASE_URL': JSON.stringify(options.routerBase) } : {},
                build: { cssCodeSplit: false, rollupOptions: { input: { review: ids.shell, canvas: ids.canvas } } },
            };
        },
        configResolved(resolved) {
            config = resolved;
            if (resolved.envDir !== false || resolved.publicDir !== '' || Object.keys(resolved.server.proxy ?? {}).length || Object.keys(resolved.preview.proxy ?? {}).length) {
                throw new Error('Review requires envDir:false, publicDir:false and no server/preview proxies.');
            }
            if (resolved.build.outDir === '.' || resolve(resolved.root, resolved.build.outDir) === resolved.root)
                throw new Error('Review output must use a separate directory.');
        },
        resolveId(id) { if (Object.values(ids).includes(id))
            return id; },
        load(id) {
            if (id === ids.shell)
                return `import {mountReviewShell} from ${JSON.stringify(resolve(directory, 'shell.tsx'))}; mountReviewShell();`;
            if (id === ids.canvas)
                return `import {mountReviewCanvas} from ${JSON.stringify(resolve(directory, 'canvas.tsx'))}; mountReviewCanvas(() => import(${JSON.stringify(resolve(config.root, options.catalog))}));`;
        },
        configureServer(server) {
            server.middlewares.use(async (request, response, next) => {
                const requested = (request.url ?? '/').split('?')[0];
                const pathname = config.base !== './' && requested.startsWith(config.base) ? `/${requested.slice(config.base.length)}` : requested;
                if (pathname === '/@vite/client') {
                    response.setHeader('Content-Type', 'text/javascript');
                    response.end(readFileSync(resolve(directory, 'dev-client.mjs'), 'utf8'));
                    return;
                }
                if (!['/', '/index.html', '/canvas.html'].includes(pathname)) {
                    next();
                    return;
                }
                const entry = pathname === '/canvas.html' ? ids.canvas : ids.shell;
                try {
                    let document = await server.transformIndexHtml(pathname, html(`/@id/${entry.replace('\0', '__x00__')}`));
                    document = document.replace(/<script type="module" src="[^\"]*\/@vite\/client"><\/script>/g, '');
                    response.statusCode = 200;
                    response.setHeader('Content-Type', 'text/html');
                    response.end(document);
                }
                catch (error) {
                    next(error);
                }
            });
        },
        generateBundle: { order: 'post', handler(_options, bundle) {
                const assetBase = config.base === './' || config.base === '' ? './' : config.base;
                const styles = Object.values(bundle).filter(asset => asset.type === 'asset' && asset.fileName.endsWith('.css')).map(asset => `${assetBase}${asset.fileName}`);
                for (const [name, entryId] of Object.entries(ids)) {
                    const entry = Object.values(bundle).find(asset => asset.type === 'chunk' && asset.isEntry && asset.facadeModuleId === entryId);
                    if (!entry)
                        this.error(`Missing review entry: ${name}`);
                    this.emitFile({ type: 'asset', fileName: name === 'shell' ? 'index.html' : 'canvas.html', source: html(`${assetBase}${entry.fileName}`, styles) });
                }
            } },
    };
}
/** Add to the actual production build. A build fails if fixtures or review code are imported. */
/** @param {{forbidden?: readonly string[]}} options @returns {import('vite').Plugin} */
export function reviewProductionGuard(options = {}) {
    /** @type {string} */
    let root;
    return {
        name: 'rhine-review-production-guard', apply: 'build',
        configResolved(config) { root = config.root; },
        generateBundle(_options, bundle) {
            const forbidden = [directory, ...(options.forbidden ?? []).map(path => resolve(root, path))].map(path => path.replaceAll('\\', '/'));
            for (const chunk of Object.values(bundle)) {
                if (chunk.type !== 'chunk')
                    continue;
                for (const module of Object.keys(chunk.modules)) {
                    const normalized = module.replaceAll('\\', '/').split('?')[0];
                    if (normalized.includes('rhine-review:') || forbidden.some(path => normalized === path || normalized.startsWith(`${path}/`)))
                        this.error(`Production bundle imports review runtime or forbidden fixtures: ${relative(root, normalized)}`);
                }
            }
        },
    };
}
