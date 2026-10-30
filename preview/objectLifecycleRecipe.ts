// Synthetic, preview-only host data. Nothing here is exported from the package API.
export const originalTargets = ['A', 'B', 'C', 'D', 'E'] as const;
export const syntheticNow = Date.parse('2026-10-31T06:00:00Z');
export interface LifecycleObservation {
  complete: boolean;
  observedAt: number;
  expiresAt: number;
  objects: { id: string; state: 'present' | 'removed' | 'unknown' }[];
}
export type LifecycleRead = (signal: AbortSignal) => Promise<LifecycleObservation>;
export function completeOriginalObservation(value: LifecycleObservation) {
  return value.complete && Number.isFinite(value.observedAt) && Number.isFinite(value.expiresAt)
    && value.expiresAt > value.observedAt && value.objects.length === originalTargets.length
    && originalTargets.every(id => value.objects.filter(row => row.id === id && row.state !== 'unknown').length === 1);
}
export function lifecycleObservation(removed = false): LifecycleObservation {
  return { complete: true, observedAt: syntheticNow, expiresAt: syntheticNow + 60000,
    objects: originalTargets.map(id => ({ id, state: removed ? 'removed' : 'present' })) };
}
export function syntheticLifecycleRead(scenario: string, serviceObservedAt: () => number = () => syntheticNow): LifecycleRead {
  return signal => new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); signal.removeEventListener('abort', abort); reject(new Error('已取消读取。')); };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      if (scenario === 'timeout' || scenario === 'cold-error') return reject(new Error('读取超时，当前状态尚未确认。'));
      if (scenario === 'denied') return reject(new Error('没有读取权限，请联系管理员确认。'));
      const value = { ...lifecycleObservation(scenario !== 'stopped'), observedAt: serviceObservedAt() };
      value.expiresAt = value.observedAt + 60000;
      if (scenario === 'partial') { value.complete = false; value.objects = value.objects.slice(0, 2); }
      if (scenario === 'replacement') value.objects = ['F', 'G', 'H', 'I', 'J', 'K'].map(id => ({ id, state: 'removed' }));
      resolve(value);
    }, 650);
    if (signal.aborted) abort(); else signal.addEventListener('abort', abort, { once: true });
  });
}
