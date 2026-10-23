import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { StackedBar, StatusTimeline, TrendChart, type TimelineSegment } from '../components';

const context = { label: '请求', unit: '次', rangeLabel: '今天', description: '原始采样' };
const points = [{ id: 'a', label: '10:00', value: 1200 }, { id: 'b', label: '10:10', value: null }, { id: 'c', label: '10:20', value: 0 }];
const segments: TimelineSegment[] = [{ id: 'a', label: 'A', status: 'healthy', detail: { start: '10:00', end: '10:10' } }, { id: 'b', label: 'B', status: 'unknown', detail: { start: '10:10', end: '10:20' } }];

it('inspects exact chart buckets with keyboard, including unknown and zero', () => {
  const changed = vi.fn();
  render(<TrendChart {...context} points={points} onActivePointChange={changed} />);
  const chart = screen.getByRole('img');
  fireEvent.focus(chart);
  expect(chart).toHaveAccessibleDescription('10:00：1200 次');
  fireEvent.keyDown(chart, { key: 'ArrowRight' });
  expect(screen.getByText('10:10：未知')).toBeVisible();
  fireEvent.keyDown(chart, { key: 'End' });
  expect(chart).toHaveAccessibleDescription('10:20：0 次');
  fireEvent.keyDown(chart, { key: 'Home' });
  expect(changed.mock.calls.map(call => call[0])).toEqual(['a', 'b', 'c', 'a']);
});

it('keeps controlled chart inspection and preserves raw data when formatting labels', () => {
  const changed = vi.fn(), props = { ...context, points, activePointId: 'a', onActivePointChange: changed, valueFormatter: (value: number | null) => value === null ? '缺失' : value.toLocaleString('en-US') };
  const { rerender } = render(<TrendChart {...props} />);
  fireEvent.keyDown(screen.getByRole('img'), { key: 'ArrowRight' });
  expect(changed).toHaveBeenCalledWith('b');
  expect(screen.getByText('10:00：1,200 次')).toBeVisible();
  rerender(<TrendChart {...props} activePointId="b" />);
  expect(screen.getByText('10:10：缺失')).toBeVisible();
  fireEvent.click(screen.getByText('查看请求数据表'));
  expect(screen.getByRole('cell', { name: '1200' })).toBeVisible();
});

it('preserves active identity through chart reorder and handles removal', () => {
  const { rerender } = render(<TrendChart {...context} points={points} defaultActivePointId="b" />);
  rerender(<TrendChart {...context} points={[points[2], points[1], points[0]]} defaultActivePointId="b" />);
  expect(screen.getByText('10:10：未知')).toBeVisible();
  rerender(<TrendChart {...context} points={[points[0]]} defaultActivePointId="b" />);
  expect(screen.queryByText('10:10：未知')).not.toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole('img'), { key: 'Home' });
  expect(screen.getByRole('img')).toHaveAccessibleDescription('10:00：1200 次');
});

it('keeps finite chart coordinates at large finite magnitudes and zero shares invisible', () => {
  const { container, rerender } = render(<TrendChart {...context} kind="line" points={[{ id: 'a', label: 'A', value: -Number.MAX_VALUE }, { id: 'b', label: 'B', value: Number.MAX_VALUE }]} />);
  expect(container.querySelector('.rhine-chart__line')?.getAttribute('d')).not.toMatch(/NaN|Infinity/);
  rerender(<StackedBar {...context} parts={[{ id: 'zero', label: '无', value: 0 }, { id: 'one', label: '有', value: 1 }]} />);
  expect(container.querySelectorAll('.rhine-chart__stack > span')).toHaveLength(1);
  expect(screen.getByRole('list')).toHaveTextContent('无：0 次（0.0%）');
});

it('preserves timeline identity across insertion and reorder', () => {
  const { rerender } = render(<StatusTimeline label="历史" startLabel="开始" endLabel="结束" segments={segments} defaultActiveId="a" />);
  expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', 'A · 有输出·未见异常');
  rerender(<StatusTimeline label="历史" startLabel="开始" endLabel="结束" segments={[segments[1], segments[0]]} defaultActiveId="a" />);
  expect(screen.getByRole('slider')).toHaveValue('1');
  expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', 'A · 有输出·未见异常');
});

it('allocates the entire percentage bar even when positive counts sum to less than one', () => {
  const { container } = render(<StackedBar {...context} parts={[{ id: 'a', label: 'A', value: 0.1 }, { id: 'b', label: 'B', value: 0.2 }]} />);
  const weights = [...container.querySelectorAll<HTMLElement>('.rhine-chart__stack > span')].map(part => Number(part.style.flexGrow));
  expect(weights.reduce((sum, weight) => sum + weight, 0)).toBeCloseTo(1);
  expect(weights[1] / weights[0]).toBeCloseTo(2);
  expect(screen.getByRole('list')).toHaveTextContent('33.3%');
  expect(screen.getByRole('list')).toHaveTextContent('66.7%');
});

it('reports timeline controlled selection and open intent without overriding host state', async () => {
  const selected = vi.fn(), opened = vi.fn();
  const props = { label: '历史', startLabel: '开始', endLabel: '结束', segments, activeId: 'a', onActiveChange: selected, onOpenChange: opened };
  const { rerender } = render(<StatusTimeline {...props} open={false} />);
  fireEvent.focus(screen.getByRole('slider'));
  expect(opened).toHaveBeenCalledWith(true); expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('slider'), { target: { value: '1' } });
  expect(selected).toHaveBeenCalledWith('b'); expect(screen.getByRole('slider')).toHaveValue('0');
  rerender(<StatusTimeline {...props} open />);
  expect(await screen.findByRole('dialog')).toHaveTextContent('A · 有输出');
  fireEvent.keyDown(screen.getByRole('slider'), { key: 'Escape' });
  expect(opened).toHaveBeenLastCalledWith(false); expect(screen.getByRole('dialog')).toBeInTheDocument();
});

it('lets keyboard users enter and dismiss timeline details without reopening on focus return', async () => {
  render(<StatusTimeline label="历史" startLabel="开始" endLabel="结束" segments={segments} />);
  const slider = screen.getByRole('slider');
  act(() => slider.focus()); await screen.findByRole('dialog');
  fireEvent.keyDown(slider, { key: 'Enter' });
  expect(screen.getByRole('button', { name: '关闭时段详情' })).toHaveFocus();
  fireEvent.click(screen.getByRole('button', { name: '关闭时段详情' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  await waitFor(() => expect(slider).toHaveFocus());
  fireEvent.keyDown(slider, { key: 'Enter' });
  await waitFor(() => expect(screen.getByRole('button', { name: '关闭时段详情' })).toHaveFocus());
});

it('disables timeline interaction even with defaultOpen', () => {
  const opened = vi.fn();
  render(<StatusTimeline label="历史" startLabel="开始" endLabel="结束" segments={segments} disabled defaultOpen onOpenChange={opened} />);
  expect(screen.getByRole('slider')).toBeDisabled();
  fireEvent.pointerMove(screen.getByRole('slider'), { pointerType: 'mouse' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); expect(opened).not.toHaveBeenCalled();
});
