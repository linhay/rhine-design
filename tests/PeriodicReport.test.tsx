import { act, fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { PeriodicReportGallery } from '../preview/PeriodicReportGallery';
import { dailyReports, evidenceCoverage, reportPeriods, sourceHref, syntheticReportTransport, usePeriodicReport, type ReportStatus, type ReportTransport } from '../preview/periodicReportRecipe';

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
const advance = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });
it('uses explicit calendar boundaries, counts coverage and keeps missing separate from empty', () => {
  const days = dailyReports('week');
  expect(days).toHaveLength(7); expect(days[0].date).toBe('2026-10-19'); expect(days.at(-1)?.date).toBe('2026-10-25');
  expect(reportPeriods.week.end).toBe('2026-10-26'); expect(reportPeriods.month.end).toBe('2026-11-01');
  expect(dailyReports('month')).toHaveLength(31); expect(dailyReports('month').at(-1)?.date).toBe('2026-10-31');
  expect(evidenceCoverage(days)).toEqual({ verified: 3, total: 10, percent: 30, missing: 1 });
  expect(days.filter(day => day.state === 'empty')).toHaveLength(4);
  expect(evidenceCoverage(dailyReports('week', true))).toEqual({ verified: 0, total: 0, percent: null, missing: 0 });
});
it('maps only known current-period source IDs and never turns untrusted URLs into links', () => {
  expect(sourceHref('day-19', dailyReports('week'))).toBe('?fixture=periodic-report&source=day-19');
  for (const id of ['javascript:alert(1)', 'https://example.com', 'outside-period', '__proto__']) expect(sourceHref(id, dailyReports('week'))).toBeUndefined();
  expect(sourceHref('day-19', dailyReports('week', true))).toBeUndefined();
  render(<PeriodicReportGallery />);
  fireEvent.change(screen.getByLabelText('报告合成场景'), { target: { value: 'invalid' } });
  expect(screen.getByText('部分引用未通过校验')).toBeVisible();
  expect(document.querySelector('a[href^="javascript:"]')).toBeNull();
});
it('generates explicitly, blocks rapid duplicate requests and refreshes without generating', async () => {
  vi.useFakeTimers(); render(<PeriodicReportGallery />);
  const generate = screen.getByRole('button', { name: '生成当前对象报告' }); generate.focus();
  fireEvent.click(generate); fireEvent.click(generate);
  expect(generate).toHaveFocus(); expect(generate).toHaveAttribute('aria-busy', 'true');
  expect(screen.getByText('排队中', { selector: '.rhine-badge' })).toBeInTheDocument();
  await advance(350); expect(screen.getByText('生成中', { selector: '.rhine-badge' })).toBeVisible();
  await advance(1450); expect(screen.getByText('AI 摘要已生成，工作完成情况仍需核对。')).toBeVisible();
  expect(document.querySelector('[data-report]')).toHaveAttribute('data-generation-count', '1');
  fireEvent.click(screen.getByRole('button', { name: '刷新状态' })); await advance(450);
  expect(document.querySelector('[data-report]')).toHaveAttribute('data-generation-count', '1');
  expect(screen.getByText('已读取现有状态，未发起生成。')).toBeVisible();
  expect(screen.getByText(/已核对 3 \/ 10/)).toHaveTextContent('30%');
});
it('returns cancel focus, retains errors and clears timers on unmount', async () => {
  vi.useFakeTimers(); const { unmount } = render(<PeriodicReportGallery />);
  fireEvent.click(screen.getByRole('button', { name: '生成当前对象报告' }));
  const cancel = screen.getByRole('button', { name: '停止等待' }); cancel.focus(); fireEvent.click(cancel);
  expect(screen.getByRole('button', { name: '刷新状态' })).toHaveFocus();
  expect(screen.getByRole('button', { name: '生成当前对象报告' })).toHaveAttribute('aria-disabled', 'true');
  expect(screen.getByText('生成结果待核对')).toBeVisible(); await advance(2000); expect(screen.queryByText('AI 摘要已生成，工作完成情况仍需核对。')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('报告合成场景'), { target: { value: 'read-error' } });
  fireEvent.click(screen.getByRole('button', { name: '刷新状态' })); await advance(450);
  expect(screen.getByText('状态读取失败', { selector: 'strong' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: '刷新状态' })); fireEvent.click(screen.getByRole('button', { name: '停止等待' }));
  expect(screen.getByText('状态读取失败', { selector: 'strong' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: '生成当前对象报告' })); unmount(); await advance(2000);
});
it('retains accepted summary and materials after generation failure or unknown result', async () => {
  for (const next of ['failed', 'unknown'] as const) {
    const transport = vi.fn<ReportTransport>().mockResolvedValue(next);
    const { result, unmount } = renderHook(() => usePeriodicReport('A:week', 'completed', transport));
    await act(async () => result.current.run('generate'));
    expect(result.current.status).toBe(next); expect(result.current.summary).toBe(true); unmount();
  }
  render(<PeriodicReportGallery />);
  fireEvent.change(screen.getByLabelText('报告合成场景'), { target: { value: 'failed' } });
  expect(document.querySelectorAll('[data-daily]')).toHaveLength(7);
  expect(screen.getByText('生成失败，每日资料已保留')).toBeVisible();
});
it('rejects late success, phase and errors after scope change, cancellation and unmount, even with ignored abort', async () => {
  const pending: { signal: AbortSignal; phase: () => void; resolve: (status: ReportStatus) => void; reject: () => void }[] = [];
  const transport: ReportTransport = (_op, _scope, signal, phase) => new Promise((resolve, reject) => pending.push({ signal, phase, resolve, reject: () => reject(new Error('late')) }));
  function Host({ scope }: { scope: string }) {
    const state = usePeriodicReport(scope, 'idle', transport);
    return <div><button onClick={() => void state.run('generate')}>generate</button><button onClick={state.cancel}>cancel</button><output>{scope}:{state.status}:{state.feedback}</output></div>;
  }
  const view = render(<Host key="A:week" scope="A:week" />);
  fireEvent.click(screen.getByText('generate'));
  view.rerender(<Host key="A:month" scope="A:month" />);
  expect(pending[0].signal.aborted).toBe(true);
  fireEvent.click(screen.getByText('generate'));
  view.rerender(<Host key="B:month" scope="B:month" />);
  expect(pending[1].signal.aborted).toBe(true);
  await act(async () => { pending[0].phase(); pending[0].resolve('completed'); pending[1].reject(); });
  expect(screen.getByRole('status')).toHaveTextContent('B:month:idle:');
  fireEvent.click(screen.getByText('generate')); fireEvent.click(screen.getByText('cancel'));
  await act(async () => { pending[2].phase(); pending[2].resolve('completed'); });
  expect(screen.getByRole('status')).toHaveTextContent('B:month:unknown:');
  expect(screen.getByRole('status')).not.toHaveTextContent('已生成');
  fireEvent.click(screen.getByText('generate')); expect(pending).toHaveLength(3);
  view.rerender(<Host key="C:month" scope="C:month" />);
  fireEvent.click(screen.getByText('generate')); view.unmount(); expect(pending[3].signal.aborted).toBe(true);
  await act(async () => pending[3].resolve('completed'));
});
it('switching visible period and identity removes old busy state without moving selector focus', async () => {
  vi.useFakeTimers(); render(<PeriodicReportGallery />);
  fireEvent.click(screen.getByRole('button', { name: '生成当前对象报告' }));
  const period = screen.getByLabelText('报告周期'); period.focus(); fireEvent.change(period, { target: { value: 'month' } });
  expect(period).toHaveFocus(); expect(document.querySelector('[data-report]')).toHaveAttribute('data-scope', '示例人员 A:month');
  expect(document.querySelectorAll('[data-daily]')).toHaveLength(31);
  fireEvent.click(screen.getByRole('button', { name: '生成当前对象报告' }));
  fireEvent.change(screen.getByLabelText('报告对象'), { target: { value: '示例人员 B' } }); await advance(2000);
  expect(document.querySelector('[data-report]')).toHaveAttribute('data-generation-count', '0');
  expect(screen.queryByText('AI 摘要已生成，工作完成情况仍需核对。')).not.toBeInTheDocument();
  expect(within(document.querySelector('[data-report]') as HTMLElement).getByText(/示例人员 B/)).toBeVisible();
});
it('clears synthetic phase and completion timers when aborted', async () => {
  vi.useFakeTimers(); const controller = new AbortController(), phase = vi.fn();
  const pending = syntheticReportTransport('completed')('generate', 'A:week', controller.signal, phase);
  const rejected = expect(pending).rejects.toThrow('Aborted'); controller.abort(); await rejected;
  await advance(2500); expect(phase).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
});

it('keeps observed pending tasks refreshable and blocks duplicate generation while unknown', async () => {
  vi.useFakeTimers(); render(<PeriodicReportGallery />);
  for (const scenario of ['queued', 'generating', 'unknown']) {
    fireEvent.change(screen.getByLabelText('报告合成场景'), { target: { value: scenario } });
    const generate = screen.getByRole('button', { name: '生成当前对象报告' });
    expect(generate).toHaveAttribute('aria-disabled', 'true'); expect(generate).not.toHaveAttribute('aria-busy');
    expect(screen.queryByRole('button', { name: '停止等待' })).not.toBeInTheDocument();
    const read = screen.getByRole('button', { name: '刷新状态' }); expect(read).toBeEnabled();
    fireEvent.click(read); expect(read).toHaveAttribute('aria-busy', 'true'); await advance(450);
    expect(document.querySelector('[data-report]')).toHaveAttribute('data-report-status', scenario);
    expect(document.querySelector('[data-report]')).toHaveAttribute('data-generation-count', '0');
    expect(read).toBeEnabled(); expect(read).not.toHaveAttribute('aria-busy');
    expect(screen.queryByRole('button', { name: '停止等待' })).not.toBeInTheDocument();
  }
});

it('unlocks generation only after an explicit read confirms a known settled result', async () => {
  const transport = vi.fn<ReportTransport>().mockResolvedValueOnce('unknown').mockResolvedValueOnce('completed').mockResolvedValue('completed');
  const { result } = renderHook(() => usePeriodicReport('A:week', 'unknown', transport));
  await act(async () => result.current.run('generate')); expect(transport).not.toHaveBeenCalled();
  await act(async () => result.current.run('read')); expect(result.current.status).toBe('unknown');
  await act(async () => result.current.run('generate')); expect(transport).toHaveBeenCalledTimes(1);
  await act(async () => result.current.run('read')); expect(result.current.status).toBe('completed');
  await act(async () => result.current.run('generate')); expect(result.current.generations).toBe(1);
  expect(transport.mock.calls.map(call => call[0])).toEqual(['read', 'read', 'generate']);
});

it('treats a rejected generate response as unknown and requires a settled read before another write', async () => {
  const transport = vi.fn<ReportTransport>().mockRejectedValueOnce(new Error('Response lost'))
    .mockResolvedValueOnce('unknown').mockResolvedValueOnce('completed').mockResolvedValue('completed');
  const { result } = renderHook(() => usePeriodicReport('A:week', 'completed', transport));
  await act(async () => result.current.run('generate'));
  expect(result.current.status).toBe('unknown'); expect(result.current.pending).toBeNull(); expect(result.current.summary).toBe(true);
  await act(async () => result.current.run('generate')); expect(transport).toHaveBeenCalledTimes(1);
  await act(async () => result.current.run('read')); expect(result.current.status).toBe('unknown');
  await act(async () => result.current.run('generate')); expect(transport).toHaveBeenCalledTimes(2);
  await act(async () => result.current.run('read')); expect(result.current.status).toBe('completed');
  await act(async () => result.current.run('generate')); expect(result.current.generations).toBe(2);
  expect(transport.mock.calls.map(call => call[0])).toEqual(['generate', 'read', 'read', 'generate']);
});
it('allows retry when the transport explicitly confirms failed', async () => {
  const transport = vi.fn<ReportTransport>().mockResolvedValueOnce('failed').mockResolvedValueOnce('completed');
  const { result } = renderHook(() => usePeriodicReport('A:week', 'idle', transport));
  await act(async () => result.current.run('generate')); expect(result.current.status).toBe('failed');
  await act(async () => result.current.run('generate')); expect(result.current.status).toBe('completed');
  expect(transport.mock.calls.map(call => call[0])).toEqual(['generate', 'generate']);
});
it('keeps an idle report completed through repeated read-only refreshes', async () => {
  vi.useFakeTimers(); render(<PeriodicReportGallery />);
  fireEvent.change(screen.getByLabelText('报告合成场景'), { target: { value: 'idle' } });
  fireEvent.click(screen.getByRole('button', { name: '生成当前对象报告' })); await advance(1800);
  for (let i = 0; i < 3; i++) {
    fireEvent.click(screen.getByRole('button', { name: '刷新状态' })); await advance(450);
    expect(document.querySelector('[data-report]')).toHaveAttribute('data-report-status', 'completed');
    expect(document.querySelector('[data-report]')).toHaveAttribute('data-generation-count', '1');
    expect(screen.getByRole('heading', { name: '活动摘要' })).toBeVisible();
  }
});
it('stores synthetic confirmed outcomes by scope without resetting or leaking them on reads', async () => {
  vi.useFakeTimers(); const transport = syntheticReportTransport('idle');
  const call = async (op: 'generate' | 'read', scope: string) => {
    const pending = transport(op, scope, new AbortController().signal, () => {});
    await advance(op === 'generate' ? 1800 : 450); return pending;
  };
  expect(await call('generate', 'A:week')).toBe('completed');
  expect(await call('read', 'A:month')).toBe('idle'); expect(await call('read', 'B:week')).toBe('idle');
  expect(await call('read', 'A:week')).toBe('completed'); expect(await call('read', 'A:week')).toBe('completed');
});
