import { act, fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AsyncResourceCard, AsyncSnapshotRecipes, DiagnosticSnapshotRecipe } from '../preview/AsyncSnapshotRecipes';
import { useAsyncSnapshotRecipe, type RecipeRead, type RecipeSnapshot } from '../preview/asyncSnapshotRecipe';

const seed: RecipeSnapshot = {scope:'all',count:2,task:'failed'};
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
const flush = () => act(async () => { await Promise.resolve(); });

it('cancels and rejects late scope results even if the transport ignores the signal', async () => {
  const pending: { scope:string; signal:AbortSignal; resolve:(result:{snapshot:RecipeSnapshot})=>void }[] = [];
  const read: RecipeRead = (scope,signal) => new Promise(resolve => pending.push({scope,signal,resolve}));
  const {result,unmount} = renderHook(() => useAsyncSnapshotRecipe(read,seed));
  act(() => result.current.switchScope('oauth'));
  act(() => result.current.switchScope('key'));
  expect(pending[0].signal.aborted).toBe(true);
  expect(pending[1].signal.aborted).toBe(true);
  await act(async () => pending[2].resolve({snapshot:{scope:'key',count:1,task:'paused'}}));
  await act(async () => pending[1].resolve({snapshot:{scope:'oauth',count:99,task:'failed'}}));
  expect(result.current.snapshot).toMatchObject({scope:'key',count:1});
  unmount();
  expect(pending[2].signal.aborted).toBe(true);
});

it('stops pending reads at three attempts, exits busy, and retries within a new budget', async () => {
  vi.useFakeTimers();
  const read = vi.fn<RecipeRead>().mockResolvedValue({pending:true});
  const {result,unmount} = renderHook(() => useAsyncSnapshotRecipe(read));
  await flush();
  await act(async () => { await vi.advanceTimersByTimeAsync(500); });
  expect(read).toHaveBeenCalledTimes(3);
  expect(result.current.status).toBe('budget');
  expect(result.current.snapshot).toBeUndefined();
  expect(vi.getTimerCount()).toBe(0);
  act(() => result.current.retry()); await flush();
  expect(read).toHaveBeenCalledTimes(4);
  expect(result.current.status).toBe('loading');
  unmount(); expect(vi.getTimerCount()).toBe(0);
});

it('pauses on visibility loss, aborts pending work, and re-reads on restore', async () => {
  const visibility = vi.spyOn(document,'visibilityState','get').mockReturnValue('visible');
  const signals: AbortSignal[] = [];
  const read: RecipeRead = (_scope,signal) => { signals.push(signal); return new Promise(() => {}); };
  const renders: {visible:boolean;status:string;paused:boolean}[]=[];
  const {result,unmount} = renderHook(() => {const state=useAsyncSnapshotRecipe(read,seed);renders.push({visible:state.visible,status:state.status,paused:state.paused});return state;});
  visibility.mockReturnValue('hidden'); act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(renders.filter(state=>!state.visible).every(state=>state.status==='paused')).toBe(true);
  expect(signals[0].aborted).toBe(true); expect(result.current.status).toBe('paused');
  expect(result.current.snapshot?.task).toBe('failed');
  visibility.mockReturnValue('visible'); act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(signals).toHaveLength(2); expect(result.current.status).toBe('refreshing');
  act(() => result.current.togglePause());
  visibility.mockReturnValue('hidden'); act(() => document.dispatchEvent(new Event('visibilitychange')));
  visibility.mockReturnValue('visible'); act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(result.current.status).toBe('paused'); expect(signals).toHaveLength(2);
  act(() => result.current.togglePause()); expect(signals).toHaveLength(3);
  visibility.mockReturnValue('hidden'); act(() => document.dispatchEvent(new Event('visibilitychange')));
  act(() => result.current.switchScope('oauth'));
  visibility.mockReturnValue('visible'); act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(result.current.status).toBe('loading'); expect(signals).toHaveLength(4);
  expect(renders.filter(state=>state.visible&&!state.paused).every(state=>state.status!=='paused')).toBe(true);
  unmount(); expect(signals[3].aborted).toBe(true);
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(signals).toHaveLength(4);
});

it('keeps old summary attribution verbatim during a Tab read, without page busy or update text', async () => {
  vi.useFakeTimers(); render(<AsyncSnapshotRecipes />);
  await act(async () => { await vi.advanceTimersByTimeAsync(650); });
  const summary = document.querySelector('[data-result-summary]')!.textContent;
  fireEvent.click(screen.getByRole('tab',{name:'OAuth'}));
  expect(document.querySelector('[data-result-summary]')!.textContent).toBe(summary);
  expect(summary).toContain('全部');
  expect(screen.getByRole('button',{name:'读取现有结果'})).not.toHaveAttribute('aria-busy','true');
  expect(screen.queryByText('正在后台读取，已有快照仍可读。')).not.toBeInTheDocument();
  expect(within(screen.getByRole('tabpanel')).getByText('正在读取身份')).toBeInTheDocument();
  await act(async () => { await vi.advanceTimersByTimeAsync(650); });
  expect(document.querySelector('[data-result-summary]')!.textContent).toContain('OAuth：1');
});

it('preserves known fields on partial reads and finishes unsupported quota without loading forever', () => {
  const {rerender} = render(<AsyncResourceCard kind="key" partial fieldPending />);
  expect(screen.getByText('此接入方式不提供额度')).toBeInTheDocument();
  expect(screen.getByText('1.28 USD')).toBeInTheDocument();
  expect(screen.getByText('本周期费用尚未读取')).toBeInTheDocument();
  expect(screen.getByText('上次历史：12 次请求 · 2026-10-29')).toBeInTheDocument();
  expect(screen.getByText('历史读取失败')).toBeInTheDocument();
  rerender(<AsyncResourceCard kind="key" partial />);
  expect(screen.getByText('费用未知，未提供读数')).toBeInTheDocument();
  expect(screen.queryByText('本周期费用尚未读取')).not.toBeInTheDocument();
  rerender(<AsyncResourceCard kind="oauth" loading="5" />);
  const hidden = document.querySelector('[data-module="5"] .rhine-async-slot-content')!;
  expect(hidden).toHaveAttribute('inert'); expect(hidden).toHaveStyle({visibility:'hidden'});
});

it('keeps failed/paused task snapshots separate from read errors and awaits copy failure', async () => {
  vi.useFakeTimers(); render(<DiagnosticSnapshotRecipe />);
  fireEvent.change(screen.getByLabelText('诊断任务状态'),{target:{value:'failed'}});
  fireEvent.change(screen.getByLabelText('诊断读取状态'),{target:{value:'error'}});
  expect(screen.getByText('任务状态：')).toHaveTextContent('failed');
  expect(screen.getByText('读取失败，以下保留上次读取记录')).toBeInTheDocument();
  expect(screen.getByText('覆盖率：未知 · 未提供观测时间')).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('合成复制失败'));
  fireEvent.click(screen.getByRole('button',{name:'复制诊断命令'}));
  expect(screen.queryByText('已复制')).not.toBeInTheDocument();
  await act(async () => { await vi.advanceTimersByTimeAsync(350); });
  expect(screen.getByText('复制失败，请重试')).toBeInTheDocument();
  expect(screen.queryByText('已复制')).not.toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('诊断空路径与命令'));
  expect(screen.getByText('未提供诊断命令')).toBeInTheDocument();
  expect(screen.queryByRole('button',{name:'复制诊断命令'})).not.toBeInTheDocument();
});

it('clears card, search, mock-copy and request timers on unmount', () => {
  vi.useFakeTimers(); const {unmount} = render(<AsyncSnapshotRecipes />);
  fireEvent.click(screen.getByRole('button',{name:'更新此对象（合成）'}));
  fireEvent.click(screen.getByRole('button',{name:'演示搜索反馈'}));
  fireEvent.click(screen.getByRole('button',{name:'复制诊断命令'}));
  expect(vi.getTimerCount()).toBeGreaterThan(0);
  unmount(); expect(vi.getTimerCount()).toBe(0);
});


it('does not render the new scope as ready while an effect has yet to start its request', async () => {
  const renders: {scope:string;status:string}[]=[];
  let first=true;
  const read:RecipeRead=scope=>{if(first){first=false;return Promise.resolve({snapshot:{scope,count:2,task:'paused'}});}return new Promise(()=>{});};
  const {result}=renderHook(()=>{const state=useAsyncSnapshotRecipe(read,seed);renders.push({scope:state.scope,status:state.status});return state;});
  await flush();expect(result.current.status).toBe('ready');
  act(()=>result.current.switchScope('oauth'));
  expect(renders.filter(state=>state.scope==='oauth').every(state=>state.status==='loading')).toBe(true);
});


it('keeps a readable cached snapshot and its observation time through budget exhaustion and retry', async () => {
  vi.useFakeTimers(); const {unmount} = render(<AsyncSnapshotRecipes />);
  fireEvent.change(screen.getByLabelText('异步配方场景'), {target:{value:'cached-budget'}});
  const list = document.querySelector('[data-snapshot-list]')!;
  const summary = document.querySelector('[data-result-summary]')!.textContent;
  expect(list).toHaveAttribute('data-read-status','refreshing');
  await act(async () => { await vi.advanceTimersByTimeAsync(860); });
  expect(list).toHaveAttribute('data-read-status','budget');
  expect(screen.getByText('已达到本轮读取预算').closest('.rhine-notice')).toHaveClass('rhine-tone-neutral');
  expect(screen.getByText(/旧快照仍可读，稍后可重试更新/)).toBeInTheDocument();
  expect(document.querySelector('[data-result-summary]')!.textContent).toBe(summary);
  expect(summary).toContain('2026-10-30 14:32');
  expect(within(screen.getByRole('tabpanel')).getByText('任务已暂停')).toBeVisible();
  expect(within(screen.getByRole('tabpanel')).getByText('128.00 USD')).toBeVisible();
  expect(screen.queryByText('正在读取身份')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'重试读取'}));
  expect(list).toHaveAttribute('data-read-status','refreshing');
  expect(screen.getByRole('button',{name:'读取现有结果'})).toHaveAttribute('aria-busy','true');
  await act(async () => { await vi.advanceTimersByTimeAsync(860); });
  expect(list).toHaveAttribute('data-read-status','budget');
  expect(screen.getByRole('button',{name:'读取现有结果'})).not.toHaveAttribute('aria-busy','true');
  expect(document.querySelector('[data-result-summary]')!.textContent).toBe(summary);
  fireEvent.click(screen.getByRole('tab',{name:'OAuth'}));
  await act(async () => { await vi.advanceTimersByTimeAsync(860); });
  expect(list).toHaveAttribute('data-read-status','budget');
  expect(document.querySelector('[data-result-summary]')!.textContent).toBe(summary);
  expect(screen.getByText('已达到本轮读取预算').closest('.rhine-notice')).toHaveClass('rhine-tone-warning');
  expect(screen.queryByText(/旧快照仍可读/)).not.toBeInTheDocument();
  expect(screen.queryByText('128.00 USD')).not.toBeInTheDocument();
  expect(screen.getByText('此范围尚无可读快照；可重试读取。')).toBeInTheDocument();
  unmount(); expect(vi.getTimerCount()).toBe(0);
});

it('distinguishes cached request errors and no-snapshot budgets from cached budget information', async () => {
  vi.useFakeTimers(); render(<AsyncSnapshotRecipes />);
  fireEvent.change(screen.getByLabelText('异步配方场景'), {target:{value:'error'}});
  await act(async () => { await vi.advanceTimersByTimeAsync(650); });
  expect(screen.getByText('读取失败，保留上次快照').closest('.rhine-notice')).toHaveClass('rhine-tone-error');
  expect(screen.getByText('任务已暂停')).toBeVisible();
  fireEvent.change(screen.getByLabelText('异步配方场景'), {target:{value:'budget'}});
  await act(async () => { await vi.advanceTimersByTimeAsync(860); });
  expect(screen.getByText('已达到本轮读取预算').closest('.rhine-notice')).toHaveClass('rhine-tone-warning');
  expect(screen.getByText('尚无已确认的结果快照')).toBeInTheDocument();
  expect(screen.queryByText('128.00 USD')).not.toBeInTheDocument();
  expect(screen.queryByText('此范围没有资源')).not.toBeInTheDocument();
  expect(screen.queryByText('正在读取身份')).not.toBeInTheDocument();
});
