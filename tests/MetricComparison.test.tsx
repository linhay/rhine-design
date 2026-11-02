import { act, fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ComparisonPairDemo, MetricComparisonGallery } from '../preview/MetricComparisonGallery';
import { syntheticComparisonRead, useComparisonPair, type Read } from '../preview/metricComparisonRecipe';

afterEach(() => vi.useRealTimers());
const tick = async (ms: number) => { await act(async () => { vi.advanceTimersByTime(ms); }); };
function deferredRead() {
  const pending: {scope:string;side:string;signal:AbortSignal;resolve:(n:number)=>void;reject:()=>void}[] = [];
  const read: Read = (scope, side, signal) => new Promise((resolve,reject) => pending.push({ scope, side, signal, resolve, reject:()=>reject(new Error('synthetic')) }));
  return {read,pending};
}
describe('Metric comparison recipe', () => {
  it('distinguishes percentage points, zero denominators, unknown, incomplete periods and domain direction', () => {
    const {container}=render(<MetricComparisonGallery />);
    const example=(id:string)=>within(container.querySelector(`[data-comparison-example="${id}"]`)! as HTMLElement);
    expect(example('rate').getByText('上升 1 个百分点；相对增加 50%')).toBeVisible();
    expect(example('zero').getByText('从 0 增至 12；相对变化不适用')).toBeVisible();
    expect(example('both-zero').getByText('数量无变化；相对百分比不适用')).toBeVisible();
    expect(example('unknown').getByText('上周基准：未知')).toBeVisible();
    expect(example('incomparable').getByText(/本周仅采集 2 天/)).toBeVisible();
    expect(example('latency').getByText('延迟增加，需要关注')).toHaveClass('rhine-tone-warning');
    expect(example('throughput').getByText('同质量约束下吞吐提升')).toHaveClass('rhine-tone-success');
    expect(example('precision').getByText(/原始当前值 1,234,567/)).toBeInTheDocument();
  });
  it('does not commit a new current side with an old baseline', async () => {
    const {read,pending}=deferredRead(); const {result}=renderHook(()=>useComparisonPair(read));
    act(()=>result.current.load('south','normal'));
    await act(async()=>pending[0].resolve(240));
    expect(result.current.status).toBe('pending'); expect(result.current.pair).toMatchObject({scope:'north',current:120,baseline:100});
    await act(async()=>pending[1].resolve(200)); expect(result.current.pair).toMatchObject({scope:'south',current:240,baseline:200});
  });
  it.each(['current','baseline'])('preserves the entire prior pair when %s fails and retries both sides', async side => {
    const {read,pending}=deferredRead(); const {result}=renderHook(()=>useComparisonPair(read));
    act(()=>result.current.load('south','normal'));
    await act(async()=>{ pending.find(x=>x.side===side)!.reject(); pending.find(x=>x.side!==side)!.resolve(240); });
    expect(result.current.status).toBe('error'); expect(result.current.pair?.scope).toBe('north');
    act(()=>result.current.load('south','normal')); expect(pending).toHaveLength(4);
    await act(async()=>{pending[2].resolve(240);pending[3].resolve(200);}); expect(result.current.status).toBe('ready'); expect(result.current.pair?.scope).toBe('south');
  });
  it('ignores late success and failure from an abort-ignoring transport after a scope change', async () => {
    const {read,pending}=deferredRead(); const {result}=renderHook(()=>useComparisonPair(read));
    act(()=>result.current.load('north','out-of-order')); act(()=>result.current.load('south','normal'));
    expect(pending[0].signal.aborted).toBe(true);
    await act(async()=>{pending[2].resolve(240);pending[3].resolve(200);});
    await act(async()=>{pending[0].resolve(999);pending[1].reject();});
    expect(result.current.pair).toMatchObject({scope:'south',current:240,baseline:200}); expect(result.current.status).toBe('ready');
  });
  it('cancels both pending sides, ignores their late completion, and releases timers on unmount', async () => {
    const {read,pending}=deferredRead(); const {result,unmount}=renderHook(()=>useComparisonPair(read));
    act(()=>result.current.load('south','normal')); act(()=>result.current.cancel()); expect(pending.every(x=>x.signal.aborted)).toBe(true);
    await act(async()=>pending.forEach(x=>x.resolve(999))); expect(result.current.pair?.scope).toBe('north'); expect(result.current.status).toBe('cancelled'); unmount();
    vi.useFakeTimers(); const second=renderHook(()=>useComparisonPair(syntheticComparisonRead)); act(()=>second.result.current.load('south','normal'));
    expect(vi.getTimerCount()).toBe(2); second.unmount(); expect(vi.getTimerCount()).toBe(0); await tick(2000);
  });
  it('keeps selected scope distinct from stale snapshot through failed read and real retry', async () => {
    vi.useFakeTimers(); render(<ComparisonPairDemo />);
    fireEvent.change(screen.getByLabelText('合成读取场景'),{target:{value:'baseline-fail'}});
    fireEvent.change(screen.getByLabelText('比较工作区'),{target:{value:'south'}}); await tick(700);
    expect(screen.getByRole('alert')).toHaveTextContent('基准值读取失败');
    expect(screen.getByText(/结果范围：北区/)).toBeVisible(); expect(screen.getByText(/当前选择：南区/)).toBeVisible(); expect(screen.getByText(/陈旧快照/)).toBeVisible();
    fireEvent.change(screen.getByLabelText('合成读取场景'),{target:{value:'normal'}}); fireEvent.click(screen.getByRole('button',{name:'重新读取比较'})); await tick(700);
    expect(screen.getByText(/结果范围：南区/)).toBeVisible(); expect(screen.queryByText(/陈旧快照/)).toBeNull(); expect(screen.queryByRole('alert')).toBeNull();
  });
});
