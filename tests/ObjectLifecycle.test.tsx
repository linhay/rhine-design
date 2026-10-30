import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ObjectLifecycle, ObjectLifecycleGallery } from '../preview/ObjectLifecycleGallery';
import { completeOriginalObservation, lifecycleObservation, originalTargets, syntheticLifecycleRead, syntheticNow, type LifecycleObservation, type LifecycleRead } from '../preview/objectLifecycleRecipe';

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
const now = syntheticNow + 1000;
const summary = () => document.querySelector('[data-lifecycle-summary]')!;
const rows = () => within(screen.getByRole('list', { name: '原目标状态' }));
const tick = (ms = 650) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });
function deferredRead() {
  const pending: { signal: AbortSignal; resolve: (value: LifecycleObservation) => void; reject: (reason: Error) => void }[] = [];
  const read = vi.fn<LifecycleRead>(signal => new Promise((resolve, reject) => { pending.push({ signal, resolve, reject }); }));
  return { read, pending };
}

it('renders the default retirement empty state without reading, storing a history card, or scheduling timers', async () => {
  vi.useFakeTimers();
  const read = vi.fn(syntheticLifecycleRead('removed'));
  const view = render(<ObjectLifecycle retainHistory={false} read={read} now={now} />);
  expect(screen.getByText('此功能已退役')).toBeInTheDocument();
  expect(document.querySelector('[data-lifecycle-card]')).toBeNull();
  expect(screen.queryByRole('button', { name: '读取状态' })).not.toBeInTheDocument();
  await tick(120000);
  view.rerender(<ObjectLifecycle retainHistory={false} read={read} now={now + 120000} />);
  expect(read).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});

it('starts the real gallery at retirement and only mounts a reading host after history is requested', async () => {
  vi.useFakeTimers(); render(<ObjectLifecycleGallery />);
  expect(screen.getByText('此功能已退役')).toBeInTheDocument();
  expect(vi.getTimerCount()).toBe(0);
  fireEvent.click(screen.getByRole('checkbox', { name: '保留对象历史' }));
  expect(screen.getByText('正在读取对象状态')).toBeInTheDocument();
  expect(summary()).toHaveTextContent(/^未知$/);
  expect(rows().getAllByText('未知', { exact: true })).toHaveLength(5);
  expect(rows().queryByText('已移除', { exact: true })).not.toBeInTheDocument();
  await tick();
  expect(summary()).toHaveTextContent(/^已结束$/);
  expect(summary().firstElementChild).toHaveClass('rhine-tone-neutral');
  expect(rows().getAllByText('已移除', { exact: true })).toHaveLength(5);
  expect(screen.queryByText('正在读取对象状态')).not.toBeInTheDocument();
  await tick(120000);
  expect(vi.getTimerCount()).toBe(0);
});

it('does not turn stopped automatic management into removal of still-present original targets', async () => {
  vi.useFakeTimers();
  render(<ObjectLifecycle retainHistory read={syntheticLifecycleRead('stopped')} now={now} />);
  await tick();
  expect(screen.getByText('自动管理：已停止')).toBeInTheDocument();
  expect(summary()).toHaveTextContent(/^仍有对象$/);
  expect(rows().getAllByText('仍存在', { exact: true })).toHaveLength(5);
  expect(rows().queryByText('已移除', { exact: true })).not.toBeInTheDocument();
});

it('does not refresh evidence by retrying or updating the synthetic service until a new observation is read', async () => {
  vi.useFakeTimers(); render(<ObjectLifecycleGallery />);
  fireEvent.click(screen.getByRole('checkbox', { name: '保留对象历史' }));
  await tick();
  expect(summary()).toHaveTextContent(/^已结束$/);
  fireEvent.click(screen.getByRole('button', { name: '推进合成时钟至过期' }));
  expect(summary()).toHaveTextContent(/^未知$/);
  expect(vi.getTimerCount()).toBe(0);
  fireEvent.click(screen.getByRole('button', { name: '读取状态' }));
  await tick();
  expect(summary()).toHaveTextContent(/^未知$/);
  expect(document.querySelector('[data-lifecycle-times]')).toHaveTextContent('上次记录：2026-10-31 06:00:00 UTC（合成）');
  expect(document.querySelector('[data-lifecycle-times]')).toHaveTextContent('有效期至：2026-10-31 06:01:00 UTC（合成）');
  fireEvent.click(screen.getByRole('button', { name: '服务提供新观测' }));
  expect(summary()).toHaveTextContent(/^未知$/);
  expect(document.querySelector('[data-lifecycle-times]')).toHaveTextContent('上次记录：2026-10-31 06:00:00 UTC（合成）');
  expect(vi.getTimerCount()).toBe(0);
  fireEvent.click(screen.getByRole('button', { name: '读取状态' }));
  await tick();
  expect(summary()).toHaveTextContent(/^已结束$/);
  expect(rows().getAllByText('已移除', { exact: true })).toHaveLength(5);
  expect(document.querySelector('[data-lifecycle-times]')).toHaveTextContent('观测时间：2026-10-31 06:01:00 UTC（合成）');
  expect(document.querySelector('[data-lifecycle-times]')).toHaveTextContent('有效期至：2026-10-31 06:02:00 UTC（合成）');
  expect(screen.queryByText('观测已过期或时钟尚未确认')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '推进合成时钟至过期' }));
  expect(summary()).toHaveTextContent(/^未知$/);
  expect(rows().getAllByText('上次记录：已移除', { exact: true })).toHaveLength(5);
  expect(document.querySelector('[data-lifecycle-times]')).toHaveTextContent('上次记录：2026-10-31 06:01:00 UTC（合成）');
  expect(vi.getTimerCount()).toBe(0);
  fireEvent.click(screen.getByRole('button', { name: '服务提供新观测' }));
  expect(summary()).toHaveTextContent(/^未知$/);
  expect(vi.getTimerCount()).toBe(0);
  fireEvent.click(screen.getByRole('button', { name: '读取状态' }));
  await tick();
  expect(summary()).toHaveTextContent(/^已结束$/);
  expect(rows().getAllByText('已移除', { exact: true })).toHaveLength(5);
  expect(document.querySelector('[data-lifecycle-times]')).toHaveTextContent('观测时间：2026-10-31 06:02:00 UTC（合成）');
  expect(document.querySelector('[data-lifecycle-times]')).toHaveTextContent('有效期至：2026-10-31 06:03:00 UTC（合成）');
  expect(screen.queryByText('观测已过期或时钟尚未确认')).not.toBeInTheDocument();
  await tick(120000);
  expect(vi.getTimerCount()).toBe(0);
});

const invalidObservations: [string, () => LifecycleObservation][] = [
  ['partial failure', () => ({ ...lifecycleObservation(true), complete: false })],
  ['missing original', () => ({ ...lifecycleObservation(true), objects: lifecycleObservation(true).objects.slice(0, 4) })],
  ['duplicate original', () => ({ ...lifecycleObservation(true), objects: ['A', 'A', 'C', 'D', 'E'].map(id => ({ id, state: 'removed' })) })],
  ['empty response', () => ({ ...lifecycleObservation(true), objects: [] })],
  ['replacement targets', () => ({ ...lifecycleObservation(true), objects: ['F', 'G', 'H', 'I', 'J', 'K'].map(id => ({ id, state: 'removed' })) })],
  ['unknown original', () => ({ ...lifecycleObservation(true), objects: originalTargets.map(id => ({ id, state: id === 'E' ? 'unknown' : 'removed' })) })],
  ['missing observation time', () => ({ ...lifecycleObservation(true), observedAt: NaN })],
  ['unbounded expiry', () => ({ ...lifecycleObservation(true), expiresAt: Infinity })],
  ['nonpositive validity', () => ({ ...lifecycleObservation(true), expiresAt: syntheticNow })],
];

it.each(invalidObservations)('rejects %s instead of replacing the last complete original snapshot', async (_label, makeObservation) => {
  const bad = makeObservation();
  expect(completeOriginalObservation(bad)).toBe(false);
  const initial = lifecycleObservation();
  const read = vi.fn<LifecycleRead>(async () => bad);
  render(<ObjectLifecycle retainHistory read={read} now={now} initial={initial} />);
  const originalTime = document.querySelector('[data-lifecycle-times]')!.textContent!.replace('观测时间', '上次记录');
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: '读取状态' })); });
  expect(read).toHaveBeenCalledTimes(1);
  expect(summary()).toHaveTextContent(/^未知$/);
  expect(screen.getByRole('alert')).toHaveTextContent('原目标观测不完整');
  expect(rows().getAllByText('上次记录：仍存在', { exact: true })).toHaveLength(5);
  expect(document.querySelector('[data-lifecycle-times]')!.textContent).toBe(originalTime);
  expect(rows().getAllByRole('listitem').map(row => row.getAttribute('data-lifecycle-object'))).toEqual([...originalTargets]);
  expect(rows().queryByText('已移除', { exact: true })).not.toBeInTheDocument();
});

// Finite numbers outside ECMAScript Date's range still make toISOString throw.
// Keep a valid ordering in every case so chronology cannot mask the range defect.
const unrenderableDates: [string, Pick<LifecycleObservation, 'observedAt' | 'expiresAt'>][] = [
  ['out-of-range observation only', { observedAt: -1e17, expiresAt: syntheticNow + 60000 }],
  ['out-of-range expiry only', { observedAt: syntheticNow, expiresAt: 1e17 }],
  ['both timestamps out of range', { observedAt: 1e17, expiresAt: 2e17 }],
];

it.each(unrenderableDates)('keeps the old snapshot and reports an invalid new read with %s', async (_label, dates) => {
  const { read, pending } = deferredRead();
  render(<ObjectLifecycle retainHistory read={read} now={now} initial={lifecycleObservation()} />);
  const originalTime = document.querySelector('[data-lifecycle-times]')!.textContent!.replace('观测时间', '上次记录');
  fireEvent.click(screen.getByRole('button', { name: '读取状态' }));
  await act(async () => pending[0].resolve({ ...lifecycleObservation(true), ...dates }));
  expect(summary()).toHaveTextContent(/^未知$/);
  expect(screen.getByRole('alert')).toHaveTextContent('原目标观测不完整');
  expect(rows().getAllByText('上次记录：仍存在', { exact: true })).toHaveLength(5);
  expect(rows().getAllByText('未知', { exact: true })).toHaveLength(5);
  expect(document.querySelector('[data-lifecycle-times]')!.textContent).toBe(originalTime);
  expect(document.querySelector('[data-lifecycle-card]')).toHaveAttribute('data-pending', 'false');
});

it.each(unrenderableDates)('discards an invalid initial snapshot with %s and safely cold-reads a valid one', async (_label, dates) => {
  const { read, pending } = deferredRead();
  expect(() => render(<ObjectLifecycle retainHistory read={read} now={now} initial={{ ...lifecycleObservation(true), ...dates }} />)).not.toThrow();
  expect(summary()).toHaveTextContent(/^未知$/);
  expect(screen.getByText('正在读取对象状态')).toBeInTheDocument();
  expect(document.querySelector('[data-lifecycle-times]')).toBeNull();
  expect(read).toHaveBeenCalledTimes(1);
  await act(async () => pending[0].resolve(lifecycleObservation()));
  expect(summary()).toHaveTextContent(/^仍有对象$/);
  expect(rows().getAllByText('仍存在', { exact: true })).toHaveLength(5);
});

it.each([
  ['minimum Date endpoint', -8640000000000000, -8639999999999000],
  ['maximum Date endpoint', 8639999999999000, 8640000000000000],
])('accepts and renders the %s without rejecting representable numeric timestamps', (_label, observedAt, expiresAt) => {
  const initial = { ...lifecycleObservation(true), observedAt, expiresAt };
  const read = vi.fn<LifecycleRead>(async () => initial);
  expect(completeOriginalObservation(initial)).toBe(true);
  expect(() => render(<ObjectLifecycle retainHistory read={read} now={observedAt} initial={initial} />)).not.toThrow();
  expect(summary()).toHaveTextContent(/^已结束$/);
  const times = document.querySelector('[data-lifecycle-times]')!;
  for (const value of [observedAt, expiresAt]) expect(times).toHaveTextContent(new Date(value).toISOString().replace('T', ' ').replace('.000Z', ' UTC（合成）'));
  expect(read).not.toHaveBeenCalled();
});

it.each(['observedAt', 'expiresAt'] as const)('requires a finite number for %s rather than coercing a Date, string, or null', field => {
  // Each impostor can construct a valid Date; it still is not an accepted timestamp number.
  for (const value of [new Date(0), '1970-01-01T00:00:00.000Z', '0', null]) {
    const initial = { ...lifecycleObservation(true), observedAt: -60000, expiresAt: 60000, [field]: value } as unknown as LifecycleObservation;
    expect(completeOriginalObservation(initial), `${field}: ${String(value)}`).toBe(false);
  }
});

it.each(['timeout', 'denied', 'partial', 'replacement'])('keeps the complete old removal record after %s, without claiming a current ended state', async scenario => {
  vi.useFakeTimers();
  const read = vi.fn(syntheticLifecycleRead(scenario));
  render(<ObjectLifecycle retainHistory read={read} now={now} initial={lifecycleObservation(true)} />);
  expect(summary()).toHaveTextContent(/^已结束$/);
  fireEvent.click(screen.getByRole('button', { name: '读取状态' }));
  expect(summary()).toHaveTextContent(/^上次记录：已结束$/);
  expect(rows().getAllByText('上次记录：已移除', { exact: true })).toHaveLength(5);
  expect(rows().getAllByText('未知', { exact: true })).toHaveLength(5);
  await tick();
  expect(summary()).toHaveTextContent(/^未知$/);
  expect(screen.getByRole('alert')).toHaveTextContent('读取未确认');
  expect(rows().getAllByText('上次记录：已移除', { exact: true })).toHaveLength(5);
  expect(rows().getAllByText('未知', { exact: true })).toHaveLength(5);
  expect(document.querySelector('[data-lifecycle-times]')).toHaveTextContent('上次记录：2026-10-31 06:00:00 UTC（合成）');
  await tick(120000);
  expect(read).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});

it('exits cold-read loading on failure and keeps unknown rather than a successful empty state', async () => {
  vi.useFakeTimers();
  render(<ObjectLifecycle retainHistory read={syntheticLifecycleRead('cold-error')} now={now} />);
  expect(screen.getByText('正在读取对象状态')).toBeInTheDocument();
  await tick();
  expect(screen.queryByText('正在读取对象状态')).not.toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent('尚无完整记录，当前状态未知');
  expect(summary()).toHaveTextContent(/^未知$/);
  expect(screen.queryByText('此功能已退役')).not.toBeInTheDocument();
  expect(document.querySelector('[data-lifecycle-times]')).toBeNull();
});

it.each([
  ['exact expiry', syntheticNow + 60000],
  ['after expiry', syntheticNow + 60001],
  ['future observation', syntheticNow - 1],
  ['invalid host clock', NaN],
  ['infinite host clock', Infinity],
])('makes removal evidence historical at %s without triggering a read', (_label, hostNow) => {
  const read = vi.fn<LifecycleRead>(async () => lifecycleObservation(true));
  const view = render(<ObjectLifecycle retainHistory read={read} now={now} initial={lifecycleObservation(true)} />);
  expect(summary()).toHaveTextContent(/^已结束$/);
  view.rerender(<ObjectLifecycle retainHistory read={read} now={hostNow} initial={lifecycleObservation(true)} />);
  expect(summary()).toHaveTextContent(/^未知$/);
  expect(rows().getAllByText('未知', { exact: true })).toHaveLength(5);
  expect(rows().getAllByText('上次记录：已移除', { exact: true })).toHaveLength(5);
  expect(screen.getByText('观测已过期或时钟尚未确认')).toBeInTheDocument();
  expect(read).not.toHaveBeenCalled();
});

it('accepts fresh evidence only after an explicit retry, retaining the old observation until then', async () => {
  const { read, pending } = deferredRead();
  render(<ObjectLifecycle retainHistory read={read} now={syntheticNow + 60000} initial={lifecycleObservation(true)} />);
  expect(summary()).toHaveTextContent(/^未知$/);
  fireEvent.click(screen.getByRole('button', { name: '读取状态' }));
  await act(async () => pending[0].reject(new Error('合成读取失败')));
  expect(screen.getByRole('alert')).toHaveTextContent('合成读取失败');
  fireEvent.click(screen.getByRole('button', { name: '读取状态' }));
  expect(rows().getAllByText('上次记录：已移除', { exact: true })).toHaveLength(5);
  await act(async () => pending[1].resolve({ ...lifecycleObservation(), observedAt: syntheticNow + 60000, expiresAt: syntheticNow + 120000 }));
  expect(summary()).toHaveTextContent(/^仍有对象$/);
  expect(rows().getAllByText('仍存在', { exact: true })).toHaveLength(5);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.queryByText('观测已过期或时钟尚未确认')).not.toBeInTheDocument();
});

it('cancels a read, hands focus back, and ignores the late result even if transport ignores abort', async () => {
  const { read, pending } = deferredRead();
  render(<ObjectLifecycle retainHistory read={read} now={now} />);
  const cancel = screen.getByRole('button', { name: '取消等待' });
  cancel.focus(); fireEvent.click(cancel);
  expect(pending[0].signal.aborted).toBe(true);
  expect(screen.getByRole('button', { name: '读取状态' })).toHaveFocus();
  expect(cancel).toBeDisabled();
  await act(async () => pending[0].resolve(lifecycleObservation(true)));
  expect(summary()).toHaveTextContent(/^未知$/);
  expect(screen.getByText('已取消等待；尚无完整记录，当前状态未知。')).toBeInTheDocument();
  expect(document.querySelector('[data-lifecycle-times]')).toBeNull();
});

it('keeps failed-read uncertainty through retry and cancellation until a complete response is accepted', async () => {
  const { read, pending } = deferredRead();
  render(<ObjectLifecycle retainHistory read={read} now={now} initial={lifecycleObservation(true)} />);
  expect(summary()).toHaveTextContent(/^已结束$/);
  fireEvent.click(screen.getByRole('button', { name: '读取状态' }));
  await act(async () => pending[0].reject(new Error('合成读取失败')));
  expect(summary()).toHaveTextContent(/^未知$/);
  fireEvent.click(screen.getByRole('button', { name: '读取状态' }));
  expect(screen.getByRole('alert')).toHaveTextContent('合成读取失败');
  fireEvent.click(screen.getByRole('button', { name: '取消等待' }));
  expect(pending[1].signal.aborted).toBe(true);
  expect(summary()).toHaveTextContent(/^未知$/);
  expect(screen.getByRole('alert')).toHaveTextContent('合成读取失败');
  expect(rows().getAllByText('上次记录：已移除', { exact: true })).toHaveLength(5);
  expect(rows().getAllByText('未知', { exact: true })).toHaveLength(5);
  await act(async () => pending[1].resolve(lifecycleObservation(true)));
  expect(summary()).toHaveTextContent(/^未知$/);
  expect(screen.getByRole('alert')).toHaveTextContent('合成读取失败');
  fireEvent.click(screen.getByRole('button', { name: '读取状态' }));
  await act(async () => pending[2].resolve({ ...lifecycleObservation(true), observedAt: syntheticNow + 500, expiresAt: syntheticNow + 60500 }));
  expect(summary()).toHaveTextContent(/^已结束$/);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(rows().getAllByText('已移除', { exact: true })).toHaveLength(5);
});

it('does not let an earlier cancelled response overwrite a newer accepted response', async () => {
  const { read, pending } = deferredRead();
  render(<ObjectLifecycle retainHistory read={read} now={now} />);
  fireEvent.click(screen.getByRole('button', { name: '取消等待' }));
  fireEvent.click(screen.getByRole('button', { name: '读取状态' }));
  await act(async () => pending[1].resolve(lifecycleObservation()));
  expect(summary()).toHaveTextContent(/^仍有对象$/);
  await act(async () => pending[0].resolve(lifecycleObservation(true)));
  expect(summary()).toHaveTextContent(/^仍有对象$/);
  expect(rows().getAllByText('仍存在', { exact: true })).toHaveLength(5);
  expect(read).toHaveBeenCalledTimes(2);
});

it('aborts on retirement and does not let a retired session restore its card or overwrite a remounted one', async () => {
  const { read, pending } = deferredRead();
  const view = render(<ObjectLifecycle retainHistory read={read} now={now} />);
  view.rerender(<ObjectLifecycle retainHistory={false} read={read} now={now} />);
  expect(pending[0].signal.aborted).toBe(true);
  expect(screen.getByText('此功能已退役')).toBeInTheDocument();
  await act(async () => pending[0].resolve(lifecycleObservation(true)));
  expect(document.querySelector('[data-lifecycle-card]')).toBeNull();
  view.rerender(<ObjectLifecycle retainHistory read={read} now={now} />);
  expect(summary()).toHaveTextContent(/^未知$/);
  await act(async () => pending[1].resolve(lifecycleObservation()));
  expect(summary()).toHaveTextContent(/^仍有对象$/);
  expect(read).toHaveBeenCalledTimes(2);
});

it('aborts on unmount and releases the synthetic response timer without scheduling a poll', async () => {
  vi.useFakeTimers();
  const read = vi.fn(syntheticLifecycleRead('removed'));
  const view = render(<ObjectLifecycle retainHistory read={read} now={now} />);
  expect(vi.getTimerCount()).toBe(1);
  const signal = read.mock.calls[0][0];
  view.unmount();
  expect(signal.aborted).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
  await tick(120000);
  expect(read).toHaveBeenCalledTimes(1);
  expect(document.querySelector('[data-lifecycle-card]')).toBeNull();
});
