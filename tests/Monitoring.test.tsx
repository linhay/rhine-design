import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import { StackedBar, StatusTimeline, TrendChart } from '../components';
import { ThemeProvider } from '../components/theme';

it('exposes the same structured evidence for focus and pointer, preserving zero and unknown', async () => {
  render(<ThemeProvider><StatusTimeline compact label="历史" startLabel="开始" endLabel="结束" segments={[{ id: 'a', label: '时段A', status: 'unknown', detail: { start: '10:00 UTC+8', end: '10:10 UTC+8', reason: '采集不全', counts: [{ id: 'zero', label: '失败', value: 0 }, { id: 'missing', label: '输出', value: null }], methodology: '最终结果' } }]} /></ThemeProvider>);
  const slider = screen.getByRole('slider'); fireEvent.focus(slider);
  expect(await screen.findByRole('dialog', { name: '历史时段详情' })).toHaveTextContent('10:00 UTC+8');
  expect(screen.getByText('0')).toBeVisible(); expect(screen.getByText('未知')).toBeVisible(); expect(screen.getByText('统计口径：最终结果')).toBeVisible();
  fireEvent.keyDown(slider, { key: 'Escape' }); await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  fireEvent.pointerDown(slider, { pointerType: 'touch' }); expect(await screen.findByRole('dialog')).toHaveTextContent('采集不全');
  fireEvent.click(screen.getByRole('button', { name: '关闭时段详情' })); await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

it('breaks line paths at missing points and supplies exact text data instead of interpolated zero', () => {
  const { container } = render(<TrendChart kind="line" label="资源" unit="%" rangeLabel="今天" description="原始采样" points={[{ id: 'a', label: '10:00', value: 3 }, { id: 'b', label: '10:10', value: null }, { id: 'c', label: '10:20', value: 0 }, { id: 'd', label: '10:30', value: 5 }]} />);
  expect(container.querySelector('.rhine-chart__line')?.getAttribute('d')?.match(/M/g)).toHaveLength(2);
  expect(container.querySelectorAll('.rhine-chart__point')).toHaveLength(3);
  fireEvent.click(screen.getByText('查看资源数据表'));
  expect(screen.getByText('未知')).toBeVisible(); expect(screen.getByRole('cell', { name: '0' })).toBeVisible();
  expect(screen.getByRole('img')).toHaveAccessibleName(/1 个未知值/);
});

it('does not calculate shares with unknown or negative counts', () => {
  const props = { label: '分布', unit: '次', rangeLabel: '今天', description: '按宿主分类' };
  const { rerender } = render(<StackedBar {...props} parts={[{ id: 'a', label: '完成', value: 10 }, { id: 'b', label: '失败', value: null }]} />);
  expect(screen.getByRole('status')).toHaveTextContent('总量未知'); expect(screen.queryByRole('img')).not.toBeInTheDocument(); expect(screen.getByRole('list')).not.toHaveTextContent('%');
  rerender(<StackedBar {...props} parts={[{ id: 'a', label: '完成', value: 0 }, { id: 'b', label: '失败', value: -1 }]} />);
  expect(screen.getByRole('status')).toHaveTextContent('负数'); expect(screen.queryByRole('img')).not.toBeInTheDocument();
  rerender(<StackedBar {...props} parts={[{ id: 'a', label: '完成', value: 3 }, { id: 'b', label: '失败', value: 1 }]} />);
  expect(screen.getByRole('list')).toHaveTextContent('75.0%'); expect(screen.getByRole('list')).toHaveTextContent('25.0%');
});

it('retains chart data on error and marks stale data explicitly', () => {
  render(<TrendChart label="请求" unit="次" rangeLabel="今天" description="说明" points={[{ id: 'a', label: '10:00', value: 2 }]} stale="20 分钟前" error="读取失败" />);
  expect(screen.getByRole('alert')).toHaveTextContent('读取失败'); expect(screen.getByRole('status')).toHaveTextContent('20 分钟前'); expect(screen.getByRole('img')).toBeInTheDocument();
});
