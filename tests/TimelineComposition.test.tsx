import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { StatusTimeline, StatusTimelineList, TimelineLegend, type TimelineComposition, type TimelineCompositionSegment } from '../components';

const props = { label: '构成', startLabel: '开始', endLabel: '结束', mode: 'composition' as const };
const data: TimelineComposition = { total: 100, coverage: 'complete', counts: { direct: 60, retried: 20, failed: 10, unknown: 10 } };
const segment = (composition = data, id = 'a'): TimelineCompositionSegment => ({ id, label: `时段 ${id}`, composition });

it('shares custom status names across the summary, slider, detail and legend without legacy semantics', async () => {
  const statusLabels = { healthy: '低于5%', unknown: '证据不足' };
  render(<><StatusTimeline compact label="风险" startLabel="开始" endLabel="结束" statusLabels={statusLabels} segments={[{ id: 'a', label: 'A', status: 'healthy' }]} /><TimelineLegend statusLabels={statusLabels} /></>);
  const slider = screen.getByRole('slider');
  expect(slider).toHaveAttribute('aria-valuetext', 'A · 低于5%');
  act(() => slider.focus());
  expect(await screen.findByRole('dialog')).toHaveTextContent('A · 低于5%');
  expect(screen.getByRole('list')).toHaveTextContent('低于5%');
  expect(document.body).not.toHaveTextContent('未见异常');
  expect(document.body).not.toHaveTextContent('未知 / 无数据');
});

it('renders exact bottom-to-top proportions and the same counts in keyboard, pointer and accessible details', async () => {
  const { container } = render(<StatusTimeline {...props} segments={[segment()]} />);
  const parts = [...container.querySelectorAll<HTMLElement>('[data-outcome]')];
  expect(parts.map(part => part.dataset.outcome)).toEqual(['direct', 'retried', 'failed', 'unknown']);
  expect(parts.map(part => part.style.height)).toEqual(['60%', '20%', '10%', '10%']);
  const slider = screen.getByRole('slider');
  for (const text of ['请求总数 100 次', '直接成功 60 次（60%）', '重试后成功 20 次（20%）', '最终失败 10 次（10%）', '结果未知 10 次（10%）']) expect(slider.getAttribute('aria-valuetext')).toContain(text);
  act(() => slider.focus());
  let dialog = await screen.findByRole('dialog');
  expect(dialog).toHaveTextContent('60 次（60%）');
  fireEvent.keyDown(slider, { key: 'Enter' });
  expect(within(dialog).getByRole('button')).toHaveFocus();
  fireEvent.keyDown(within(dialog).getByRole('button'), { key: 'Escape' });
  await waitFor(() => expect(slider).toHaveFocus());
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.pointerDown(slider, { pointerType: 'touch' });
  dialog = await screen.findByRole('dialog');
  expect(dialog).toHaveTextContent('60 次（60%）');
});

it.each([
  ['negative', { ...data, counts: { ...data.counts, failed: -1 } }, '数据无效'],
  ['fraction', { ...data, counts: { ...data.counts, failed: 0.5 } }, '数据无效'],
  ['nonfinite', { ...data, total: Infinity }, '数据无效'],
  ['unsafe', { ...data, total: Number.MAX_SAFE_INTEGER + 1 }, '数据无效'],
  ['sum', { ...data, total: 101 }, '数据无效'],
  ['partial', { ...data, coverage: 'partial' as const, reason: '等待采集' }, '采集不完整；等待采集'],
  ['missing', { ...data, coverage: 'missing' as const }, '缺失采集'],
])('keeps %s evidence entirely unknown instead of normalizing incomplete data', (_, composition, reason) => {
  const { container } = render(<StatusTimeline {...props} segments={[segment(composition)]} />);
  expect(container.querySelectorAll('[data-outcome]')).toHaveLength(1);
  expect(container.querySelector('[data-outcome=unknown]')).toHaveStyle({ height: '100%' });
  const value = screen.getByRole('slider').getAttribute('aria-valuetext');
  expect(value).toContain(reason);
  expect(value).toContain('请求总数 未知');
  expect(value).not.toContain('100%');
});

it('distinguishes zero requests, complete unknown results and an empty timeline', () => {
  const { rerender, container } = render(<StatusTimeline {...props} segments={[segment({ total: 0, coverage: 'complete', counts: { direct: 0, retried: 0, failed: 0, unknown: 0 } })]} />);
  expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toContain('无请求，占比不适用');
  expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toContain('直接成功 0 次');
  expect(container.querySelector('[data-outcome=unknown]')).toHaveStyle({ height: '100%' });
  rerender(<StatusTimeline {...props} segments={[segment({ ...data, counts: { direct: 0, retried: 0, failed: 0, unknown: 100 } })]} />);
  expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toContain('结果未知 100 次（100%）');
  rerender(<StatusTimeline {...props} segments={[]} />);
  expect(screen.getByRole('slider')).toBeDisabled();
  expect(screen.getByText('暂无记录')).toBeVisible();
});

it('does not inflate zero or tiny shares or average bucket percentages', () => {
  const { container } = render(<StatusTimeline {...props} segments={[
    segment({ total: 100000, coverage: 'complete', counts: { direct: 99999, retried: 0, failed: 1, unknown: 0 } }, 'tiny'),
    segment({ total: 100, coverage: 'complete', counts: { direct: 1, retried: 0, failed: 99, unknown: 0 } }, 'weighted'),
  ]} defaultActiveId="tiny" />);
  expect(container.querySelector('[data-outcome=failed]')).toHaveStyle({ height: '0.001%' });
  expect(container.querySelector('[data-outcome=retried]')).toHaveStyle({ height: '0%' });
  expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toContain('最终失败 1 次（<0.01%）');
  fireEvent.change(screen.getByRole('slider'), { target: { value: '1' } });
  expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toContain('直接成功 1 次（1%）');
});

it('updates open detail and preserves selected identity across replacement and reorder', async () => {
  const { rerender } = render(<StatusTimeline {...props} segments={[segment(), segment(data, 'b')]} defaultActiveId="a" />);
  act(() => screen.getByRole('slider').focus());
  await screen.findByRole('dialog');
  rerender(<StatusTimeline {...props} segments={[segment(data, 'b'), segment({ ...data, counts: { direct: 50, retried: 30, failed: 20, unknown: 0 } })]} defaultActiveId="a" />);
  expect(screen.getByRole('slider')).toHaveValue('1');
  expect(screen.getByRole('dialog')).toHaveTextContent('50 次（50%）');
  rerender(<StatusTimeline {...props} segments={[]} />);
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});

it('passes composition and status labels through lists and separates composition legend semantics', () => {
  render(<><StatusTimelineList label="列表" items={[{ id: 'a', title: 'A', timeline: { ...props, segments: [segment()] } }, { id: 'b', title: 'B', timeline: { segments: [{ id: 'b', label: 'B', status: 'healthy' }], statusLabels: { healthy: '低风险' }, startLabel: '开始', endLabel: '结束' } }]} /><TimelineLegend mode="composition" /></>);
  expect(screen.getByRole('slider', { name: 'B 历史时段' }).getAttribute('aria-valuetext')).toContain('低风险');
  expect(screen.getByRole('list', { name: '请求结果图例' })).toHaveTextContent('直接成功重试后成功最终失败结果未知');
  expect(screen.getByRole('list', { name: '请求结果图例' }).children).toHaveLength(4);
});
