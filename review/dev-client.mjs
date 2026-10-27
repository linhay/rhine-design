// Style-only development client. The review server intentionally has no HMR transport.
// CSS transformed by Vite 6/8 imports these helpers even with server.hmr:false.
const styles = new Map();
export function updateStyle(id, content) {
  let style = styles.get(id);
  if (!style) { style = document.createElement('style'); style.dataset.reviewStyle = id; document.head.append(style); styles.set(id, style); }
  style.textContent = content;
}
export function removeStyle(id) { styles.get(id)?.remove(); styles.delete(id); }
export function createHotContext() {
  const noop = () => {};
  return { data: {}, accept: noop, acceptExports: noop, dispose: noop, prune: noop, decline: noop, invalidate: noop, on: noop, off: noop, send: noop };
}
export function injectQuery(url, query) {
  const [path, hash] = url.split('#');
  return `${path}${path.includes('?') ? '&' : '?'}${query}${hash === undefined ? '' : `#${hash}`}`;
}
