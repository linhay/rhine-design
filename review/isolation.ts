export type ReviewHttpHandler = (request: Request) => Response | undefined | Promise<Response | undefined>;
export class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(String(key)) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(String(key)); }
  setItem(key: string, value: string) { this.values.set(String(key), String(value)); }
}
export function createMockFetch(getHandler: () => ReviewHttpHandler | undefined, getSignal: () => AbortSignal, report: (message: string) => void): typeof fetch {
  return async (input, init) => {
    const url = typeof input === 'string' ? new URL(input, location.href).href : input;
    const request = new Request(url, init);
    const signal = AbortSignal.any([request.signal, getSignal()]);
    signal.throwIfAborted();
    const scoped = new Request(request, { signal, credentials: 'omit' });
    const handler = getHandler();
    // Race cancellation even if a product handler ignores its signal or never resolves.
    return new Promise<Response>((resolve, reject) => {
      const abort = () => reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
      signal.addEventListener('abort', abort, { once: true });
      Promise.resolve().then(() => { signal.throwIfAborted(); return handler?.(scoped); }).then(response => {
        signal.throwIfAborted();
        if (!response) {
          const message = `未实现模拟请求：${scoped.method} ${new URL(scoped.url).pathname}`;
          report(message);
          throw new Error(message);
        }
        resolve(response);
      }).catch(reject).finally(() => signal.removeEventListener('abort', abort));
    });
  };
}
/** Defense in depth for trusted synthetic product code; not an untrusted-code sandbox. */
export function installIsolation(report: (message: string) => void) {
  const storage = [new MemoryStorage(), new MemoryStorage()];
  Object.defineProperty(window, 'localStorage', { configurable: true, value: storage[0] });
  Object.defineProperty(window, 'sessionStorage', { configurable: true, value: storage[1] });
  Object.defineProperty(document, 'cookie', { configurable: true, get: () => '', set: () => { report('预览不写入会话 Cookie'); } });
  const blocked = (name: string) => { const message = `预览未实现操作：${name}`; report(message); throw new Error(message); };
  for (const name of ['XMLHttpRequest', 'WebSocket', 'EventSource', 'Worker', 'SharedWorker'] as const) {
    Object.defineProperty(window, name, { configurable: true, value: function () { return blocked(name); } });
  }
  Object.defineProperty(window, 'indexedDB', { configurable: true, get: () => blocked('IndexedDB') });
  Object.defineProperty(window, 'caches', { configurable: true, get: () => blocked('CacheStorage') });
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, get: () => blocked('ServiceWorker') });
  Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: () => { report('预览不发送 Beacon'); return false; } });
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => blocked('Clipboard'), readText: async () => blocked('Clipboard') } });
  window.open = () => { report('预览不打开外部窗口'); return null; };
  document.addEventListener('click', event => {
    const link = (event.target as Element)?.closest?.('a');
    if (!link || event.defaultPrevented) return;
    const url = new URL(link.href);
    const localHash = url.origin === location.origin && url.pathname === location.pathname && url.search === location.search && Boolean(url.hash);
    if (link.hasAttribute('download') || link.target || !localHash) {
      event.preventDefault(); report('预览不执行下载或整页跳转；产品路由需使用 SPA 导航适配');
    }
  });
  document.addEventListener('submit', event => {
    if (!event.defaultPrevented) { event.preventDefault(); report('预览表单需要产品 onSubmit 模拟适配'); }
  });
  return { reset: () => storage.forEach(item => item.clear()) };
}
