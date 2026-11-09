import { useEffect, useRef, useState } from 'react';

// Synthetic showcase host only; not a public statistics/query API.
export type Scope = 'north' | 'south';
export type Side = 'current' | 'baseline';
export type Mode = 'normal' | 'baseline-fail' | 'current-fail' | 'out-of-order';
export type Read = (scope: Scope, side: Side, signal: AbortSignal, mode: Mode) => Promise<number>;
export const scopeNames = { north: '北区共享研究工作区', south: '南区跨区域长期验证与联合研究工作区' };
export const periods = { current: '2026-10-26 至 11-01', baseline: '2026-10-19 至 10-25' };
export type Pair = { scope: Scope; current: number; baseline: number; observedAt: string };
export const seedPair: Pair = { scope: 'north', current: 120, baseline: 100, observedAt: '2026-11-02 09:00 UTC+8' };

export const syntheticComparisonRead: Read = (scope, side, signal, mode) => new Promise((resolve, reject) => {
  const cleanup = () => signal.removeEventListener('abort', abort);
  const timer = setTimeout(() => {
    cleanup();
    if (mode === `${side}-fail`) reject(new Error('Synthetic read failed'));
    else resolve(scope === 'north' ? side === 'current' ? 120 : 100 : side === 'current' ? 240 : 200);
  }, mode === 'out-of-order' && scope === 'north' ? 1600 : side === 'current' ? 120 : 650);
  const abort = () => { clearTimeout(timer); cleanup(); reject(new DOMException('Aborted', 'AbortError')); };
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
});

export function useComparisonPair(read: Read, seed: Pair | undefined = seedPair) {
  const [scope, setScope] = useState<Scope>('north'), [pair, setPair] = useState(seed);
  const [status, setStatus] = useState<'ready' | 'pending' | 'error' | 'cancelled'>('ready');
  const [error, setError] = useState('');
  const epoch = useRef(0), controller = useRef<AbortController | undefined>(undefined);
  useEffect(() => () => { epoch.current++; controller.current?.abort(); }, []);
  const load = (next: Scope, mode: Mode) => {
    const request = ++epoch.current; controller.current?.abort();
    const active = new AbortController(); controller.current = active;
    setScope(next); setStatus('pending'); setError('');
    // Keep both observations private until the same query has settled completely.
    void Promise.allSettled([read(next, 'current', active.signal, mode), read(next, 'baseline', active.signal, mode)]).then(([current, baseline]) => {
      if (active.signal.aborted || request !== epoch.current) return;
      if (current.status === 'rejected' || baseline.status === 'rejected') {
        setError(`${current.status === 'rejected' ? '当前值' : '基准值'}读取失败，未形成新的完整比较。`); setStatus('error'); return;
      }
      setPair({ scope: next, current: current.value, baseline: baseline.value, observedAt: '2026-11-02 09:05 UTC+8' }); setStatus('ready');
    });
  };
  const cancel = () => { epoch.current++; controller.current?.abort(); setStatus('cancelled'); };
  return { scope, pair, status, error, load, cancel };
}
