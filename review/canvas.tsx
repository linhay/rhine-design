import { Component, useEffect, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { ThemeProvider } from '../components/theme';
import { Notice } from '../components';
import { defineReview, catalogInfo, parseReviewState, serializeReviewState } from './state';
import { createMockFetch, installIsolation, type ReviewHttpHandler } from './isolation';
import { ReviewLifecycle } from './lifecycle';
import { isReviewMessage, sendReview } from './protocol';
import type { ReviewCatalog, ReviewEnvironment, ReviewScene, ReviewSelection, ReviewSession } from './types';
import './review.css';

class RenderBoundary extends Component<{ children: ReactNode; report(message: string): void }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  componentDidCatch(error: Error) { this.props.report(`场景渲染失败：${error.message}`); }
  render() { return this.state.error ? <p role="alert">场景渲染失败，请查看评审反馈并重置。</p> : this.props.children; }
}

export async function mountReviewCanvas(loadCatalog: () => Promise<{ default: ReviewCatalog }>) {
  let state: ReviewSelection | undefined;
  let requestId = 0;
  const report = (message: string, kind = 'info', scene = state?.scene) => sendReview(parent, { type: 'feedback', message, kind, scene });
  const failed = () => sendReview(parent, { type: 'failed', requestId });
  const isolation = installIsolation(message => report(message, 'error'));
  // The handler slot is changed only by the currently active setup context.
  let http: ReviewHttpHandler | undefined;
  let requestSignal = AbortSignal.abort();
  window.fetch = createMockFetch(() => http, () => requestSignal, message => report(message, 'error'));
  const root = createRoot(document.getElementById('root')!);
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let session: ReviewSession | undefined;
  let scene: ReviewScene | undefined;
  let renderGeneration = 0;
  const environment = (): ReviewEnvironment => ({
    theme: state!.theme, motion: state!.motion,
    reducedMotion: state!.motion === 'reduced' || (state!.motion === 'system' && media.matches),
    paused: state!.motion === 'paused',
  });
  const render = () => {
    if (!session || !scene || !state) return;
    const env = environment();
    document.documentElement.style.zoom = String(state.zoom);
    document.documentElement.dataset.rhineMotion = env.reducedMotion ? 'reduced' : env.paused ? 'paused' : 'full';
    const committedRequest = requestId;
    const renderedScene = scene.id;
    const content = <RenderBoundary key={renderGeneration} report={message => { report(message, 'error', renderedScene); failed(); }}>
      <SceneContent session={session} environment={env} committed={() => sendReview(parent, { type: 'rendered', requestId: committedRequest })} />
    </RenderBoundary>;
    root.render(scene.themeRoot === 'host' ? content : <ThemeProvider theme={env.theme} data-rhine-motion={env.reducedMotion ? 'reduced' : env.paused ? 'paused' : 'full'}>{content}</ThemeProvider>);
  };
  let catalog: ReviewCatalog;
  try { catalog = defineReview((await loadCatalog()).default); }
  catch (error) { report(`场景目录加载失败：${String(error)}`, 'error'); failed(); root.render(<Notice title="场景目录加载失败" />); return; }
  const info = catalogInfo(catalog);
  const lifecycle = new ReviewLifecycle({
    clear() {
      session = undefined; scene = undefined; renderGeneration++;
      flushSync(() => root.render(null));
    },
    context(signal, selected) {
      isolation.reset();
      requestSignal = signal;
      http = undefined;
      return {
        mockHttp(next) { signal.throwIfAborted(); http = next; },
        report(message, kind) { if (!signal.aborted) report(message, kind, selected.id); },
      };
    },
    ready(next, selected) { session = next; scene = selected; render(); },
    error(error, selected) { report(`场景生命周期失败：${String(error)}`, 'error', selected); },
    failed,
  });
  const ready = () => sendReview(parent, { type: 'ready', catalog: info });
  let selectionKey = '';
  const receive = (event: MessageEvent) => {
    if (!isReviewMessage(event, parent)) return;
    if (event.data.type === 'hello') { ready(); return; }
    if (event.data.type !== 'select' || typeof event.data.hash !== 'string' || !Number.isSafeInteger(event.data.requestId)) return;
    requestId = event.data.requestId;
    state = parseReviewState(event.data.hash, info);
    const selection = state;
    // Canonicalizing in both documents prevents unsupported values from crossing the boundary.
    const key = JSON.stringify([state.scene, state.dimensions]);
    if (key !== selectionKey || event.data.reset === true) {
      selectionKey = key;
      report('正在初始化合成场景…');
      void lifecycle.select(catalog.scenes.find(s => s.id === selection.scene)!, selection.dimensions, event.data.reset ? 'reset' : 'select');
    } else render();
    sendReview(parent, { type: 'state', hash: serializeReviewState(state) });
  };
  window.addEventListener('message', receive);
  media.addEventListener('change', render);
  const rejection = (event: PromiseRejectionEvent) => { if (event.reason?.name !== 'AbortError') report(`异步操作失败：${String(event.reason)}`, 'error'); };
  window.addEventListener('unhandledrejection', rejection);
  window.addEventListener('pagehide', () => {
    window.removeEventListener('message', receive);
    media.removeEventListener('change', render);
    window.removeEventListener('unhandledrejection', rejection);
    void lifecycle.dispose();
  }, { once: true });
  ready();
}
function SceneContent({ session, environment, committed }: { session: ReviewSession; environment: ReviewEnvironment; committed(): void }) {
  useEffect(committed, [committed]);
  return session.render(environment);
}
