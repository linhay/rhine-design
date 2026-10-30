import { useEffect, useRef, useState } from 'react';

// Showcase host state, deliberately not a public cache or request API.
export interface RecipeSnapshot { scope: string; count: number; observedAt?: string; task: 'paused' | 'failed'; stale?: boolean; }
export type RecipeRead = (scope: string, signal: AbortSignal, attempt: number) => Promise<{ pending: true } | { snapshot: RecipeSnapshot }>;
export type RecipeReadStatus = 'loading' | 'refreshing' | 'ready' | 'error' | 'paused' | 'budget';

export function useAsyncSnapshotRecipe(read: RecipeRead, seed?: RecipeSnapshot) {
  const [scope, setScope] = useState('all'), [snapshot, setSnapshot] = useState(seed);
  const snapshotRef = useRef(seed);
  const [status, setStatus] = useState<RecipeReadStatus>(seed ? 'refreshing' : 'loading');
  const [cause, setCause] = useState('initial'), [revision, setRevision] = useState(0);
  const [visible, setVisible] = useState(() => document.visibilityState !== 'hidden'), [paused, setPaused] = useState(false);
  const epoch = useRef(0);
  useEffect(() => {
    const changed = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', changed);
    return () => document.removeEventListener('visibilitychange', changed);
  }, []);
  useEffect(() => {
    const request = ++epoch.current;
    if (!visible || paused) { setStatus('paused'); return; }
    const controller = new AbortController();
    let alive = true, timer: ReturnType<typeof setTimeout> | undefined, attempt = 0;
    setStatus(snapshotRef.current?.scope === scope ? 'refreshing' : 'loading');
    const run = async () => {
      attempt++;
      try {
        const result = await read(scope, controller.signal, attempt);
        // Also protects transports that ignore AbortSignal and resolve out of order.
        if (!alive || controller.signal.aborted || epoch.current !== request) return;
        if ('pending' in result) {
          if (attempt >= 3) setStatus('budget');
          else timer = setTimeout(() => { void run(); }, 250);
        } else {
          snapshotRef.current = result.snapshot;
          setSnapshot(result.snapshot); setStatus('ready');
        }
      } catch {
        if (alive && !controller.signal.aborted && epoch.current === request) setStatus('error');
      }
    };
    void run();
    return () => { alive = false; controller.abort(); if (timer) clearTimeout(timer); };
  }, [scope, read, revision, visible, paused]);
  const activeStatus = status === 'paused' ? snapshotRef.current?.scope === scope ? 'refreshing' : 'loading' : status;
  return { scope, snapshot, status:!visible || paused ? 'paused' as const : activeStatus, paused, visible, cause,
    switchScope: (next: string) => { if (next === scope) return; setCause('tab'); setStatus(paused || !visible ? 'paused' : 'loading'); setScope(next); },
    retry: () => { if (paused || !visible) return; setCause('manual'); setStatus(snapshotRef.current?.scope === scope ? 'refreshing' : 'loading'); setRevision(value => value + 1); },
    togglePause: () => { setCause('resume'); setStatus(paused && visible ? snapshotRef.current?.scope === scope ? 'refreshing' : 'loading' : 'paused'); setPaused(value => !value); },
  };
}

export function syntheticRecipeRead(scenario: string): RecipeRead {
  return (scope, signal) => new Promise((resolve, reject) => {
    const cleanup = () => signal.removeEventListener('abort', abort);
    const timer = setTimeout(() => {
      cleanup();
      if (scenario === 'error' || scenario === 'no-snapshot-error') reject(new Error('Synthetic read failed'));
      else if (scenario === 'budget' || scenario === 'cached-budget') resolve({ pending: true });
      else resolve({ snapshot: { scope, count: scenario === 'empty' ? 0 : 1, observedAt: scenario === 'stale' ? '2026-10-29 14:32 上海时间' : '2026-10-30 14:35 上海时间', task: 'paused', stale:scenario === 'stale' } });
    }, scenario === 'delayed' && scope === 'oauth' ? 1200 : (scenario === 'budget' || scenario === 'cached-budget') ? 120 : 650);
    const abort = () => { clearTimeout(timer); cleanup(); reject(new DOMException('Aborted', 'AbortError')); };
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
  });
}
