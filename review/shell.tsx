import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, ConfirmDialog, Disclosure, Drawer, Logo, Select, TextField } from '../components';
import { ThemeProvider, themes } from '../components/theme';
import { defaultWidths, parseReviewState, serializeReviewState } from './state';
import { isReviewMessage, sendReview } from './protocol';
import { appendFeedback, emptyFeedback, type ReviewFeedback } from './feedback';
import type { ReviewCatalogInfo, ReviewSelection } from './types';
import './review.css';

type Phase = 'connecting' | 'loading' | 'ready' | 'failed' | 'timed-out';
export const reviewWaitMs = 10_000;

export function ReviewShell() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [frameEpoch, setFrameEpoch] = useState(0);
  const [catalog, setCatalog] = useState<ReviewCatalogInfo>();
  const [state, setState] = useState<ReviewSelection>();
  const [query, setQuery] = useState('');
  const [log, setLog] = useState(emptyFeedback);
  const [phase, setPhase] = useState<Phase>('connecting');
  const [menu, setMenu] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const stateRef = useRef(state);
  const connected = useRef(false);
  const sequence = useRef(0);
  const pendingRequest = useRef(0);
  const feedbackSequence = useRef(0);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  stateRef.current = state;
  const record = useCallback((message: string, kind: ReviewFeedback['kind'] = 'info', scene = '画布') => {
    const entry = { id: ++feedbackSequence.current, message, kind, scene };
    setLog(previous => appendFeedback(previous, entry));
  }, []);
  const stopWaiting = useCallback(() => { clearTimeout(timeout.current); timeout.current = undefined; }, []);
  const waitFor = useCallback((next: 'connecting' | 'loading') => {
    stopWaiting(); setPhase(next);
    timeout.current = setTimeout(() => {
      setPhase('timed-out');
      record(next === 'connecting' ? '连接画布超时，请检查资源加载后重新载入画布。' : '场景初始化或清理超过 10 秒，尚未确认完成。可继续等待，或重新载入画布。', 'error', next === 'connecting' ? '画布' : stateRef.current?.scene);
    }, reviewWaitMs);
  }, [record, stopWaiting]);
  const select = useCallback((selection: ReviewSelection, reset = false) => {
    if (!connected.current || !frame.current?.contentWindow) return;
    pendingRequest.current = ++sequence.current;
    waitFor('loading');
    sendReview(frame.current.contentWindow, { type: 'select', hash: serializeReviewState(selection), requestId: pendingRequest.current, reset });
  }, [waitFor]);
  useEffect(() => {
    connected.current = false; pendingRequest.current = 0;
    waitFor('connecting');
    const receive = (event: MessageEvent) => {
      if (!isReviewMessage(event, frame.current?.contentWindow ?? null)) return;
      if (event.data.type === 'ready') {
        // Repeated hello acknowledgements must not restart a pending initialization.
        if (connected.current) return;
        connected.current = true;
        const next = event.data.catalog as ReviewCatalogInfo;
        setCatalog(next);
        const selection = parseReviewState(location.hash, next);
        history.replaceState(null, '', serializeReviewState(selection));
        setState(selection);
        document.title = `${next.title} · Rhine Review`;
      } else if (event.data.type === 'feedback' && typeof event.data.message === 'string') {
        record(event.data.message, event.data.kind === 'error' ? 'error' : 'info', typeof event.data.scene === 'string' ? event.data.scene : '画布');
      } else if ((event.data.type === 'rendered' || event.data.type === 'failed') && event.data.requestId === pendingRequest.current) {
        stopWaiting(); setPhase(event.data.type === 'rendered' ? 'ready' : 'failed');
      }
    };
    window.addEventListener('message', receive);
    const handshake = setInterval(() => {
      if (!connected.current && frame.current?.contentWindow) sendReview(frame.current.contentWindow, { type: 'hello' });
    }, 500);
    return () => { window.removeEventListener('message', receive); clearInterval(handshake); stopWaiting(); };
  }, [frameEpoch, record, stopWaiting, waitFor]);
  useEffect(() => {
    if (!catalog) return;
    const navigate = () => {
      const next = parseReviewState(location.hash, catalog);
      history.replaceState(null, '', serializeReviewState(next)); setState(next);
    };
    window.addEventListener('popstate', navigate); window.addEventListener('hashchange', navigate);
    return () => { window.removeEventListener('popstate', navigate); window.removeEventListener('hashchange', navigate); };
  }, [catalog]);
  useEffect(() => { if (state) select(state); }, [state, select]);
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const measure = () => setSize({ width: element.clientWidth, height: element.clientHeight });
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure); observer.observe(element);
    return () => observer.disconnect();
  }, [frameEpoch]);
  const update = (patch: Partial<ReviewSelection>) => {
    if (!state || !catalog) return;
    const next = parseReviewState(serializeReviewState({ ...state, ...patch }), catalog);
    history.pushState(null, '', serializeReviewState(next)); setState(next);
  };
  const reload = () => {
    // A new browsing context terminates noncooperative code; never start new setup in a stuck context.
    stopWaiting(); connected.current = false;
    record('已重新载入画布；旧会话与未保存草稿已清空，评审条件保留。', 'info', state?.scene);
    setFrameEpoch(value => value + 1);
  };
  const scene = catalog?.scenes.find(item => item.id === state?.scene);
  const matching = catalog?.scenes.filter(item => `${item.title} ${item.group ?? ''} ${item.id}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())) ?? [];
  const trouble = phase === 'failed' || phase === 'timed-out';
  const lastError = [...log.entries].reverse().find(entry => entry.kind === 'error');
  const phaseLabel = { connecting: '正在连接场景画布…', loading: '正在初始化或清理合成场景…', ready: '合成场景已就绪 · 无业务后端', failed: '场景未能完成，请查看反馈或重新载入画布。', 'timed-out': '画布响应较慢，尚未确认完成。' }[phase];
  const errorAnnouncement = log.errors > 0 ? `${log.errors} 条错误待确认${lastError ? ` · ${lastError.message}` : ''}` : trouble ? phaseLabel : '';
  return <ThemeProvider theme={state?.theme ?? 'rhine'} className="rhine-review-shell" data-rhine-motion={state?.motion === 'reduced' ? 'reduced' : undefined}>
    <header className="rhine-review-header">
      <div className="rhine-review-brand"><Logo size={28} /><div><strong>{catalog?.title ?? 'Rhine Review'}</strong><small>产品设计评审 · 合成数据</small></div></div>
      <Button id="review-menu" className="rhine-review-menu" variant="secondary" aria-expanded={menu} aria-controls="review-directory" onClick={() => setMenu(!menu)}>场景目录</Button>
      <Drawer title="评审工具" trigger={<Button variant="secondary" className="rhine-review-tools-trigger" data-phase={phase} data-error={log.errors > 0 || trouble}>
        评审工具<span className="rhine-review-tools-indicator">{log.errors > 0 ? ` · ${log.errors} 条错误` : phase === 'ready' ? (log.entries.length ? ` · ${log.entries.length} 条反馈` : '') : ` · ${{ connecting: '连接中', loading: '初始化中', failed: '失败', 'timed-out': '超时' }[phase]}`}</span>
      </Button>}>
        <div className="rhine-review-tools">
          <p role="status">{phaseLabel}</p>
          <p className="rhine-review-announcements" role="alert">{errorAnnouncement}</p>
          {state && <Disclosure title="更多设置" defaultOpen>
            <div className="rhine-review-options">
              <Select label="CSS 缩放" value={state.zoom} onChange={event => update({ zoom: Number(event.target.value) as 1 | 2 })}><option value="1">100%</option><option value="2">200%（CSS zoom）</option></Select>
              <Select label="动态偏好" value={state.motion} onChange={event => update({ motion: event.target.value as ReviewSelection['motion'] })}><option value="system">跟随系统</option>{scene?.motionControls?.includes('full') && <option value="full">完整动态</option>}<option value="reduced">减少动态</option>{scene?.motionControls?.includes('paused') && <option value="paused">暂停</option>}</Select>
              <p className="rhine-review-size" aria-label="画布尺寸">画布 {size.width} × {size.height} px · {state.zoom * 100}% CSS zoom · 等效内容宽度约 {Math.round(size.width / state.zoom)} CSS px</p>
            </div>
          </Disclosure>}
          <div className="rhine-review-recovery">
            {phase === 'failed' && state && <Button variant="secondary" onClick={() => select(state, true)}>重试场景</Button>}
            <Button variant="secondary" onClick={reload}>重新载入画布</Button>
            <p>重新载入会清空未保存草稿，并保留当前评审条件。</p>
          </div>
          <Disclosure title={`评审反馈 · ${log.entries.length} 条记录${log.errors ? ` · ${log.errors} 条错误待确认` : ''}`} defaultOpen>
            <div className="rhine-review-log">
              {log.entries.length ? <ol>{log.entries.map(entry => <li key={entry.id} data-kind={entry.kind}><strong>{catalog?.scenes.find(item => item.id === entry.scene)?.title ?? entry.scene}</strong><span>{entry.message}</span></li>)}</ol> : <p>暂无评审反馈</p>}
              {log.omittedErrors > 0 && <p>另有 {log.omittedErrors} 条较早错误未展示，仍计入待确认数量。</p>}
              <ConfirmDialog title="确认清除评审反馈" description="清除全部记录并确认待处理错误。此操作不会重置场景或草稿。" confirmLabel="确认清除" trigger={<Button variant="secondary" aria-disabled={!log.entries.length && !log.errors}>确认并清除反馈</Button>} onConfirm={() => setLog(emptyFeedback())} />
            </div>
          </Disclosure>
        </div>
      </Drawer>
      <Button variant="secondary" disabled={!state} onClick={async () => {
        try { await navigator.clipboard.writeText(location.href); record('评审链接已复制'); }
        catch { record('复制未完成，请复制浏览器地址', 'error'); }
      }}>复制链接</Button>
    </header>
    <div className="rhine-review-announcements">
      <p role="status">{phaseLabel}</p>
      <p role="alert">{errorAnnouncement}</p>
    </div>
    <div className="rhine-review-body">
      <aside id="review-directory" className="rhine-review-directory" data-open={menu} onKeyDown={event => {
        if (event.key === 'Escape' && menu) { setMenu(false); document.getElementById('review-menu')?.focus(); }
      }}>
        <TextField label="搜索场景" value={query} onChange={event => setQuery(event.target.value)} />
        <nav aria-label="评审场景">{[...new Set(matching.map(item => item.group ?? '场景'))].map(group => <section key={group}><h2>{group}</h2>{matching.filter(item => (item.group ?? '场景') === group).map(item => <a key={item.id} aria-current={item.id === scene?.id ? 'page' : undefined} href={state ? serializeReviewState({ ...state, scene: item.id, dimensions: {} }) : '#'} onClick={event => { event.preventDefault(); update({ scene: item.id, dimensions: {} }); setMenu(false); if (menu) document.getElementById('review-menu')?.focus(); }}>{item.title}</a>)}</section>)}</nav>
        {catalog && !matching.length && <p>没有匹配场景</p>}
      </aside>
      <main className="rhine-review-main">
        {state && <>
          <div className="rhine-review-controls" aria-label="评审设置">
            <Select label="界面主题" value={state.theme} onChange={event => update({ theme: event.target.value as ReviewSelection['theme'] })}>{themes.map(theme => <option key={theme.name} value={theme.name}>{theme.label}</option>)}</Select>
            <Select label="画布宽度" value={state.width} onChange={event => update({ width: event.target.value === 'fit' ? 'fit' : Number(event.target.value) })}><option value="fit">适应容器</option>{(catalog?.widths ?? defaultWidths).map(width => <option key={width} value={width}>{width} px</option>)}</Select>
            {scene?.dimensions?.map(dimension => <Select key={dimension.id} label={dimension.label} value={state.dimensions[dimension.id]} onChange={event => update({ dimensions: { ...state.dimensions, [dimension.id]: event.target.value } })}>{dimension.options.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</Select>)}
            <Button variant="secondary" onClick={() => select(state, true)}>重置场景</Button>
          </div>
        </>}
        <div className="rhine-review-viewport">
          <iframe key={frameEpoch} ref={frame} title="产品场景画布" src={new URL('canvas.html', location.href).href} sandbox="allow-scripts allow-same-origin allow-forms" referrerPolicy="no-referrer" onLoad={() => {
            if (frame.current?.contentWindow) sendReview(frame.current.contentWindow, { type: 'hello' });
          }} style={{ width: state?.width === 'fit' || !state ? '100%' : state.width }} />
        </div>
        {scene && <details className="rhine-review-notes"><summary>场景说明与验证状态</summary><p>{scene.description ?? '此场景使用产品提供的合成数据。'}</p>{scene.source && <p>源码：<code>{scene.source}</code></p>}{scene.issue && /^https:\/\//.test(scene.issue) && <a href={scene.issue} target="_blank" rel="noreferrer">关联 issue</a>}<p>{scene.validation ?? '验证状态由产品维护；可交互预览不等于生产或原生验收。'}</p></details>}
      </main>
    </div>
  </ThemeProvider>;
}
export function mountReviewShell() { createRoot(document.getElementById('root')!).render(<ReviewShell />); }
