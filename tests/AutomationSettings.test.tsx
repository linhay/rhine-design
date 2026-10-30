import { act, fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AutomationSettingsGallery } from '../preview/AutomationSettingsGallery';
import { initialAutomation, syntheticAutomation, useAutomationRecipe, type AutomationSnapshot, type AutomationTransport } from '../preview/automationSettingsRecipe';

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
const tick = (ms = 650) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });
const card = (name = '自动归档') => within(document.querySelector(`[data-automation-card="${name}"]`)! as HTMLElement);

it('keeps the confirmed Switch value until save, then separates starting/running and draining/stopped', async () => {
  vi.useFakeTimers(); render(<AutomationSettingsGallery />);
  const first = card();
  fireEvent.click(first.getByRole('switch'));
  expect(first.getByRole('switch')).not.toBeChecked();
  expect(first.getByRole('switch')).toHaveAttribute('aria-readonly','true');
  expect(first.getByRole('status')).toHaveTextContent('尚未确认');
  await tick();
  expect(first.getByRole('switch')).toBeChecked();
  expect(first.getByText('运行事实：开始中')).toBeInTheDocument();
  await tick(2050);
  expect(first.getByText('运行事实：运行中')).toBeInTheDocument();
  fireEvent.click(first.getByRole('switch')); await tick();
  expect(first.getByRole('switch')).not.toBeChecked();
  expect(first.getByText('运行事实：停止收尾中')).toBeInTheDocument();
  expect(first.getByText('停用意图已保存，仍在收尾')).toBeInTheDocument();
  await tick(2050);
  expect(first.getByText('运行事实：已停止')).toBeInTheDocument();
});

it('recovers one lost write response by reading, without repeating the write or rolling back', async () => {
  vi.useFakeTimers();
  const transport = syntheticAutomation('lost');
  const write = vi.spyOn(transport,'write'), read = vi.spyOn(transport,'read');
  const { result } = renderHook(() => useAutomationRecipe(transport,initialAutomation));
  act(() => { result.current.write(true); result.current.write(true); });
  expect(write).toHaveBeenCalledTimes(1);
  await tick();
  expect(result.current.unknown).toBe(true); expect(result.current.snapshot.enabled).toBe(false);
  expect(result.current.pending).toBe('read'); expect(read).toHaveBeenCalledTimes(1);
  act(() => result.current.write(false)); expect(write).toHaveBeenCalledTimes(1);
  await tick();
  expect(result.current.unknown).toBe(false); expect(result.current.snapshot.enabled).toBe(true);
  expect(write).toHaveBeenCalledTimes(1);
});

it('retains write uncertainty after failed read and recovers only by explicit re-read', async () => {
  vi.useFakeTimers(); render(<AutomationSettingsGallery />);
  fireEvent.change(screen.getByLabelText('自动化场景'),{target:{value:'unknown'}});
  const first=card(); fireEvent.click(first.getByRole('switch'));
  await tick(1300);
  expect(first.getByText('写入结果未知')).toBeInTheDocument();
  expect(first.getByText('此卡片读取失败')).toBeInTheDocument();
  expect(first.getByRole('switch')).not.toBeChecked();
  fireEvent.click(first.getByRole('switch')); expect(first.getByText('写入结果未知')).toBeInTheDocument();
  fireEvent.click(first.getByRole('button',{name:'读取状态'})); await tick();
  expect(first.queryByText('写入结果未知')).not.toBeInTheDocument();
  expect(first.getByRole('switch')).toBeChecked();
  expect(first.getByText('执行结果待确认')).toBeInTheDocument();
  expect(first.getByText('最近执行：待确认（未提供计数）')).toBeInTheDocument();
});

it('isolates a card read failure, write wait, and cancel from the second card', async () => {
  vi.useFakeTimers(); render(<AutomationSettingsGallery />);
  fireEvent.change(screen.getByLabelText('自动化场景'),{target:{value:'read-error'}});
  const first=card(), second=card('周期整理');
  fireEvent.click(first.getByRole('button',{name:'读取状态'}));
  fireEvent.click(second.getByRole('switch')); await tick();
  expect(first.getByText('此卡片读取失败')).toBeInTheDocument();
  expect(second.getByRole('switch')).toBeChecked(); expect(second.queryByText('此卡片读取失败')).not.toBeInTheDocument();
  fireEvent.click(first.getByRole('button',{name:'读取状态'}));
  fireEvent.click(first.getByRole('button',{name:'取消等待'}));
  expect(first.getByText(/已取消等待/)).toBeInTheDocument();
  await tick(2050);
  expect(second.getByText('运行事实：运行中')).toBeInTheDocument();
});

it('does not accept stale read results even when a transport ignores abort', async () => {
  const pending: {signal:AbortSignal;resolve:(value:AutomationSnapshot)=>void}[]=[];
  const transport: AutomationTransport = { write:vi.fn(), read:signal=>new Promise(resolve=>pending.push({signal,resolve})) };
  const {result,unmount}=renderHook(()=>useAutomationRecipe(transport,initialAutomation));
  act(()=>result.current.read()); act(()=>result.current.cancel()); act(()=>result.current.read());
  expect(pending[0].signal.aborted).toBe(true);
  await act(async()=>pending[1].resolve({...initialAutomation,enabled:true,runtime:'running'}));
  await act(async()=>pending[0].resolve(initialAutomation));
  expect(result.current.snapshot.enabled).toBe(true);
  unmount(); expect(pending[1].signal.aborted).toBe(true);
});

it('canceling a pending write leaves unknown and ignores its late success until re-read', async () => {
  let resolve!: (value:AutomationSnapshot)=>void;
  const transport:AutomationTransport={write:vi.fn<AutomationTransport['write']>(()=>new Promise<AutomationSnapshot>(r=>{resolve=r;})),read:vi.fn<AutomationTransport['read']>(async()=>({...initialAutomation,enabled:true,runtime:'running'}))};
  const {result}=renderHook(()=>useAutomationRecipe(transport,initialAutomation));
  act(()=>result.current.write(true)); act(()=>result.current.cancel());
  await act(async()=>resolve({...initialAutomation,enabled:true,runtime:'running'}));
  expect(result.current.unknown).toBe(true); expect(result.current.snapshot.enabled).toBe(false);
  act(()=>result.current.write(false)); expect(transport.write).toHaveBeenCalledTimes(1);
  await act(async()=>result.current.read());
  expect(result.current.snapshot.enabled).toBe(true);expect(result.current.unknown).toBe(false);
});

it('clears request and synthetic observation timers on unmount', async () => {
  vi.useFakeTimers();
  const transport=syntheticAutomation('normal');
  const {result,unmount}=renderHook(()=>useAutomationRecipe(transport,initialAutomation));
  act(()=>result.current.write(true)); await tick();
  expect(vi.getTimerCount()).toBe(1); unmount(); expect(vi.getTimerCount()).toBe(0);
  const pending=renderHook(()=>useAutomationRecipe(transport,initialAutomation));
  act(()=>pending.result.current.read()); expect(vi.getTimerCount()).toBe(1);
  pending.unmount(); expect(vi.getTimerCount()).toBe(0);
});

it('keeps five outcomes distinct, with failures and unknown results always visible', () => {
  render(<AutomationSettingsGallery />);
  for(const [value,label] of [['updated','更新 3 项'],['unchanged','未变化'],['skipped','跳过（无适用对象）'],['failed','失败（未完成）'],['unknown','待确认（未提供计数）']]) {
    fireEvent.change(screen.getByLabelText('最近执行结果'),{target:{value}});
    expect(card().getByText(`最近执行：${label}`)).toBeInTheDocument();
    if(value==='failed') expect(card().getByRole('alert')).toHaveTextContent('最近执行失败');
    if(value==='unknown') expect(card().getByText('执行结果待确认')).toBeInTheDocument();
  }
});

it('blocks first-card writes in read-only, non-admin and unavailable states while preserving the second', async () => {
  vi.useFakeTimers(); render(<AutomationSettingsGallery />);
  for(const label of ['首卡只读','首卡管理员']) {
    fireEvent.click(screen.getByLabelText(label));
    fireEvent.click(card().getByRole('switch')); expect(card().getByRole('switch')).not.toBeChecked();
    expect(card().getByRole('switch')).toHaveAttribute('aria-readonly','true');
    fireEvent.click(screen.getByLabelText(label));
  }
  fireEvent.change(screen.getByLabelText('自动化场景'),{target:{value:'unavailable'}});
  fireEvent.click(card().getByRole('switch')); expect(card().getByText('当前不可用')).toBeInTheDocument();
  fireEvent.click(card('周期整理').getByRole('switch')); await tick();
  expect(card('周期整理').getByRole('switch')).toBeChecked(); expect(card().getByRole('switch')).not.toBeChecked();
});


it('preserves the selected synthetic outcome through a read instead of inventing unchanged', async () => {
  vi.useFakeTimers(); render(<AutomationSettingsGallery />);
  for (const outcome of ['failed','unknown']) {
    fireEvent.change(screen.getByLabelText('最近执行结果'),{target:{value:outcome}});
    fireEvent.click(card().getByRole('button',{name:'读取状态'})); await tick();
    expect(card().getByText(outcome === 'failed' ? '最近执行失败' : '执行结果待确认')).toBeInTheDocument();
    expect(card().queryByText('最近执行：未变化')).not.toBeInTheDocument();
  }
});

it.each(['starting', 'draining'] as const)('bounds observations while the transport remains %s, including explicit re-reads', async runtime => {
  vi.useFakeTimers();
  const transitional = { ...initialAutomation, enabled: runtime === 'starting', runtime };
  const transport: AutomationTransport = { read: vi.fn(async () => transitional), write: vi.fn(async () => transitional) };
  const { result, unmount } = renderHook(() => useAutomationRecipe(transport, initialAutomation));
  await act(async () => result.current.write(transitional.enabled));
  await tick(20000);
  expect(transport.write).toHaveBeenCalledTimes(1);
  expect(transport.read).toHaveBeenCalledTimes(1);
  expect(result.current.snapshot.runtime).toBe(runtime);
  expect(result.current.pending).toBe(null);
  expect(vi.getTimerCount()).toBe(0);
  await act(async () => result.current.read());
  await tick(20000);
  expect(transport.read).toHaveBeenCalledTimes(3);
  expect(vi.getTimerCount()).toBe(0);
  unmount();
});

it('cancels a scheduled observation and ignores a late automatic read without scheduling another', async () => {
  vi.useFakeTimers();
  const transitional: AutomationSnapshot = { ...initialAutomation, enabled: true, runtime: 'starting' };
  let resolve!: (value: AutomationSnapshot) => void;
  const transport: AutomationTransport = { write: vi.fn(async () => transitional), read: vi.fn(() => new Promise<AutomationSnapshot>(r => { resolve = r; })) };
  const { result, unmount } = renderHook(() => useAutomationRecipe(transport, initialAutomation));
  await act(async () => result.current.write(true));
  act(() => result.current.cancel());
  await tick(5000);
  expect(transport.read).not.toHaveBeenCalled();
  await act(async () => result.current.write(true));
  await tick(1400);
  expect(transport.read).toHaveBeenCalledTimes(1);
  act(() => result.current.cancel());
  await act(async () => resolve({ ...transitional, runtime: 'draining' }));
  await tick(5000);
  expect(result.current.snapshot.runtime).toBe('starting');
  expect(transport.read).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
  await act(async () => result.current.write(false));
  unmount();
  await tick(5000);
  expect(transport.read).toHaveBeenCalledTimes(1);
});

it('bounds recovery after a lost write response while preserving the confirmed transitional fact', async () => {
  vi.useFakeTimers();
  const transport: AutomationTransport = {
    write: vi.fn(async () => { throw new Error('response lost'); }),
    read: vi.fn(async () => ({ ...initialAutomation, enabled: true, runtime: 'starting' as const, outcome: 'unknown' as const })),
  };
  const { result } = renderHook(() => useAutomationRecipe(transport, initialAutomation));
  expect(transport.read).not.toHaveBeenCalled();
  await act(async () => result.current.write(true));
  await tick(20000);
  expect(transport.write).toHaveBeenCalledTimes(1);
  expect(transport.read).toHaveBeenCalledTimes(2);
  expect(result.current.snapshot).toMatchObject({ enabled: true, runtime: 'starting', outcome: 'unknown' });
  expect(result.current.unknown).toBe(false);
  expect(result.current.pending).toBe(null);
  expect(vi.getTimerCount()).toBe(0);
});
