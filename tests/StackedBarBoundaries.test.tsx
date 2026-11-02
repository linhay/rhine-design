import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { StackedBar } from '../components';

const context = { label: '合成构成', unit: '次', rangeLabel: '合成窗口', description: '互斥计数' };
it.each([
  [0, 10000, '0.0%', '100.0%'],
  [1, 9999, '0.01%', '99.99%'],
  [1, 99999, '<0.01%', '>99.99%'],
  [Number.MIN_VALUE, Number.MAX_VALUE, '<0.01%', '>99.99%'],
  [1, 2, '33.3%', '66.7%'],
  [0.04, 99.96, '0.04%', '99.96%'],
])('preserves the boundaries of %s and %s without changing plot weights', (a, b, first, second) => {
  const formatter = vi.fn((value: number | null) => `数量 ${value}`);
  const { container } = render(<StackedBar {...context} valueFormatter={formatter} parts={[{ id: 'a', label: 'A', value: a }, { id: 'b', label: 'B', value: b }]} />);
  expect(screen.getByRole('list')).toHaveTextContent(`A：数量 ${a} 次（${first}）`);
  expect(screen.getByRole('list')).toHaveTextContent(`B：数量 ${b} 次（${second}）`);
  const weights = [...container.querySelectorAll<HTMLElement>('.rhine-chart__stack > span')].map(part => Number(part.style.flexGrow));
  expect(weights).toEqual([a, b].filter(value => value > 0).map(value => value / (a + b)));
  expect(formatter).toHaveBeenCalledWith(a);
  expect(formatter).toHaveBeenCalledWith(b);
});

it.each([
  [null, 1, '总量未知，不计算占比。'],
  [NaN, 1, '总量未知，不计算占比。'],
  [Infinity, 1, '总量未知，不计算占比。'],
  [-1, 1, '包含负数，无法绘制占比。'],
  [0, 0, '已知总量为 0，无占比。'],
  [Number.MAX_VALUE, Number.MAX_VALUE, '暂无可绘制的占比。'],
])('preserves unavailable feedback for %s and %s', (a, b, message) => {
  render(<StackedBar {...context} parts={[{ id: 'a', label: 'A', value: a }, { id: 'b', label: 'B', value: b }]} />);
  expect(screen.getByRole('status')).toHaveTextContent(message);
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(screen.getByRole('list')).not.toHaveTextContent('%');
});
