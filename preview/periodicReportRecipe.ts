import { useEffect, useRef, useState } from 'react';

// Synthetic host recipe only: not a scheduler, model client or public data API.
export const reportPeriods = {
  week: { label: '自然周 · 2026-10-19 至 2026-10-25', start: '2026-10-19', end: '2026-10-26', days: 7, plan: '每周一 09:00 汇总上一自然周', next: '2026-10-26 09:00 +08:00' },
  month: { label: '自然月 · 2026-10-01 至 2026-10-31', start: '2026-10-01', end: '2026-11-01', days: 31, plan: '每月 1 日 09:00 汇总上一自然月', next: '2026-11-01 09:00 +08:00' },
} as const;
export type Period = keyof typeof reportPeriods;
export type ReportStatus = 'idle' | 'queued' | 'generating' | 'completed' | 'failed' | 'unknown';
export type DailyReport = { date: string; state: 'missing' | 'empty' | 'recorded'; verified: number; total: number; activity?: string; source?: string };
export const sourceRecords = {
  'day-19': { date: '2026-10-19', text: '合成事项：完成报告结构讨论，记录两条可核对材料。' },
  'day-20': { date: '2026-10-20', text: '合成事项：继续报告结构讨论，八条材料中一条已核对；实现与评审尚待确认。' },
} as const;
export function dailyReports(period: Period, empty = false): DailyReport[] {
  const range = reportPeriods[period];
  const startDay = Number(range.start.slice(-2));
  return Array.from({ length: range.days }, (_, i) => {
    const date = `2026-10-${String(startDay + i).padStart(2, '0')}`;
    if (!empty && date === '2026-10-21') return { date, state: 'missing', verified: 0, total: 0 };
    const source = date === '2026-10-19' ? 'day-19' : date === '2026-10-20' ? 'day-20' : undefined;
    if (!empty && source) return { date, state: 'recorded', verified: source === 'day-19' ? 2 : 1, total: source === 'day-19' ? 2 : 8, source, activity: sourceRecords[source].text };
    return { date, state: 'empty', verified: 0, total: 0 };
  });
}
export function evidenceCoverage(days: DailyReport[]) {
  const verified = days.reduce((sum, day) => sum + day.verified, 0);
  const total = days.reduce((sum, day) => sum + day.total, 0);
  return { verified, total, percent: total ? Math.round(verified / total * 100) : null, missing: days.filter(day => day.state === 'missing').length };
}
// A model supplies IDs, never trusted URLs/HTML. The host maps authorized IDs to its own routes.
export function sourceHref(id: string, days: DailyReport[]) {
  return Object.hasOwn(sourceRecords, id) && days.some(day => day.source === id)
    ? `?fixture=periodic-report&source=${encodeURIComponent(id)}` : undefined;
}
export type ReportTransport = (operation: 'generate' | 'read', scope: string, signal: AbortSignal, generating: () => void) => Promise<ReportStatus>;
export function syntheticReportTransport(scenario: string): ReportTransport {
  const initial: ReportStatus = ['failed', 'unknown', 'queued', 'generating', 'idle'].includes(scenario) ? scenario as ReportStatus : scenario === 'response-lost' ? 'idle' : 'completed';
  const confirmed = new Map<string, ReportStatus>();
  return (operation, scope, signal, generating) => new Promise((resolve, reject) => {
    let phase: ReturnType<typeof setTimeout> | undefined;
    const cleanup = () => { clearTimeout(phase); clearTimeout(done); signal.removeEventListener('abort', abort); };
    const abort = () => { cleanup(); reject(new DOMException('Aborted', 'AbortError')); };
    if (operation === 'generate') phase = setTimeout(generating, 350);
    const done = setTimeout(() => {
      cleanup();
      if (operation === 'read' && scenario === 'read-error') reject(new Error('Synthetic read failure'));
      else if (operation === 'read') resolve(confirmed.get(scope) ?? initial);
      else {
        const outcome = scenario === 'failed' ? 'failed' : scenario === 'unknown' ? 'unknown' : 'completed';
        confirmed.set(scope, outcome);
        // The synthetic service completed, but its write response was lost. Only a read can establish that fact in the UI.
        if (scenario === 'response-lost') reject(new Error('Synthetic generation response lost'));
        else resolve(outcome);
      }
    }, operation === 'read' ? 450 : 1800);
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
  });
}

export function usePeriodicReport(scope: string, initial: ReportStatus, transport: ReportTransport) {
  const [status, setStatus] = useState(initial);
  const [summary, setSummary] = useState(initial === 'completed');
  const [pending, setPending] = useState<'read' | 'generate' | null>(null);
  const reading = pending === 'read';
  const [readError, setReadError] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [generations, setGenerations] = useState(0);
  const active = useRef<{ controller: AbortController; epoch: number } | null>(null);
  const epoch = useRef(0);
  useEffect(() => () => { epoch.current++; active.current?.controller.abort(); active.current = null; }, [scope]);
  const run = async (operation: 'read' | 'generate') => {
    if (active.current || (operation === 'generate' && (status === 'queued' || status === 'generating' || status === 'unknown'))) return;
    const controller = new AbortController(), token = ++epoch.current;
    active.current = { controller, epoch: token }; setPending(operation);
    const current = () => token === epoch.current && !controller.signal.aborted;
    if (operation === 'generate') { setGenerations(value => value + 1); setStatus('queued'); setFeedback(''); }
    else { setFeedback(''); }
    try {
      const next = await transport(operation, scope, controller.signal, () => { if (current()) setStatus('generating'); });
      if (!current()) return;
      setStatus(next); if (operation === 'read') setReadError(false);
      if (next === 'completed') setSummary(true);
      setFeedback(operation === 'read' ? '已读取现有状态，未发起生成。' : next === 'completed' ? 'AI 摘要已生成，工作完成情况仍需核对。' : '没有确认生成成功；每日资料仍可查看。');
    } catch {
      if (!current()) return;
      if (operation === 'read') setReadError(true);
      else { setStatus('unknown'); setFeedback('未收到生成确认，请刷新核对；不能重复生成。'); }
    } finally {
      if (current()) { active.current = null; setPending(null); }
    }
  };
  const cancel = () => {
    epoch.current++; active.current?.controller.abort(); active.current = null;
    if (!reading) setStatus('unknown');
    setPending(null); setFeedback('已停止本地等待；未确认服务端取消，已有资料与错误保留。');
  };
  return { status, summary, pending, reading, readError, feedback, generations, run, cancel };
}
