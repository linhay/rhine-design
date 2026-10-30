import { useEffect, useRef, useState } from 'react';

// Preview-only host model. These types and transports are not public library APIs.
export type Runtime = 'starting' | 'running' | 'draining' | 'stopped' | 'unavailable';
export type Outcome = 'updated' | 'unchanged' | 'skipped' | 'failed' | 'unknown';
export interface AutomationSnapshot { enabled: boolean; runtime: Runtime; outcome: Outcome; observedAt: string }
export interface AutomationTransport {
  read: (signal: AbortSignal) => Promise<AutomationSnapshot>;
  write: (enabled: boolean, signal: AbortSignal) => Promise<AutomationSnapshot>;
}

export function useAutomationRecipe(transport: AutomationTransport, initial: AutomationSnapshot) {
  const [snapshot, setSnapshot] = useState(initial);
  const [pending, setPending] = useState<'read' | 'write' | null>(null);
  const [unknown, setUnknown] = useState(false);
  const [requested, setRequested] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const request = useRef<{ generation: number; controller?: AbortController; kind?: 'read' | 'write' }>({ generation: 0 });
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(true);
  const unknownRef = useRef(false);
  useEffect(() => { mounted.current = true; return () => {
    mounted.current = false; request.current.generation++; request.current.controller?.abort(); clearTimeout(settle.current);
  }; }, [transport]);

  const run = async (kind: 'read' | 'write', enabled?: boolean, observe = true) => {
    if (kind === 'write' && (request.current.kind || unknownRef.current)) return;
    clearTimeout(settle.current);
    request.current.controller?.abort();
    const generation = ++request.current.generation, controller = new AbortController();
    request.current = { generation, controller, kind };
    setPending(kind); setError(''); setMessage(kind === 'write' ? '正在保存启用意图，尚未确认。' : '正在读取当前事实，保留上次已确认记录。');
    if (kind === 'write') setRequested(enabled!);
    const current = () => mounted.current && generation === request.current.generation && !controller.signal.aborted;
    try {
      const next = await (kind === 'write' ? transport.write(enabled!, controller.signal) : transport.read(controller.signal));
      if (!current()) return;
      setSnapshot(next); setUnknown(false); unknownRef.current = false; setRequested(null);
      setMessage(kind === 'write' ? '启用意图已保存。' : '已回读确认当前意图与运行事实。');
      // One bounded synthetic observation; no polling or operation replay.
      if (observe && (next.runtime === 'starting' || next.runtime === 'draining')) settle.current = setTimeout(() => {
        if (current()) void run('read', undefined, false);
      }, 1400);
    } catch {
      if (!current()) return;
      if (kind === 'write') {
        setUnknown(true); unknownRef.current = true;
        setMessage('写入响应未确认，先回读，不重复写入。');
        void run('read');
        return;
      }
      setError('读取失败；保留上次记录，当前事实尚未确认。');
      setMessage('可重新读取；不会重新提交启用意图。');
    } finally {
      if (current()) { request.current.kind = undefined; setPending(null); }
    }
  };
  const cancel = () => {
    const writing = request.current.kind === 'write';
    request.current.generation++; request.current.controller?.abort(); request.current.kind = undefined;
    clearTimeout(settle.current); setPending(null);
    if (writing) { setUnknown(true); unknownRef.current = true; }
    setMessage('已取消等待；外部操作可能继续，需重新读取确认。');
  };
  return { snapshot, pending, unknown, requested, error, message, read: () => void run('read'), write: (enabled: boolean) => void run('write', enabled), cancel };
}

export const runtimeLabels: Record<Runtime, string> = { starting:'开始中', running:'运行中', draining:'停止收尾中', stopped:'已停止', unavailable:'不可用' };
export const outcomeLabels: Record<Outcome, string> = { updated:'更新 3 项', unchanged:'未变化', skipped:'跳过（无适用对象）', failed:'失败（未完成）', unknown:'待确认（未提供计数）' };
export const initialAutomation: AutomationSnapshot = { enabled:false, runtime:'stopped', outcome:'unchanged', observedAt:'2026-10-30 14:30（合成）' };

export function syntheticAutomation(scenario: string, outcome: Outcome = 'unchanged'): AutomationTransport {
  let value = { ...initialAutomation, outcome, enabled:scenario === 'draining', runtime:(scenario === 'unavailable' ? 'unavailable' : scenario === 'draining' ? 'running' : 'stopped') as Runtime };
  let settlesAt = Infinity;
  let reads = 0;
  const observed = () => {
    if (Date.now() >= settlesAt) value = { ...value, runtime:value.enabled ? 'running' : 'stopped' };
    return { ...value, observedAt:'2026-10-30 14:32（合成）' };
  };
  const delay = <T,>(signal: AbortSignal, result: () => T): Promise<T> => new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(new Error('cancelled')); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); try { resolve(result()); } catch (error) { reject(error); } }, 650);
    if (signal.aborted) abort(); else signal.addEventListener('abort', abort, { once:true });
  });
  return {
    write: (enabled, signal) => {
      // The synthetic external side may accept before its response is received.
      value = { ...value, enabled, runtime:enabled ? 'starting' : 'draining', outcome:scenario === 'unknown' ? 'unknown' : 'updated' };
      settlesAt = Date.now() + 1800;
      return delay(signal, () => { if (scenario === 'lost' || scenario === 'unknown') throw new Error('response lost'); return observed(); });
    },
    read: signal => delay(signal, () => {
      reads++;
      if (scenario === 'read-error' || (scenario === 'unknown' && reads === 1)) throw new Error('synthetic read failure');
      return observed();
    }),
  };
}
