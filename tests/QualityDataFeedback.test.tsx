import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TrendChart } from '../components';
import { ListFilterBarGallery } from '../preview/ListFilterBarGallery';
import { CompactFilterBarGallery } from '../preview/CompactFilterBarGallery';

const points = [{ id: 'a', label: '09:00', value: 0 }, { id: 'b', label: '10:00', value: null }, { id: 'c', label: '11:00', value: 12 }];
const chart = { label: '请求', unit: '次', rangeLabel: '今日', description: '合成快照', points };

describe('truthful sample and chart feedback', () => {
  it('describes missing bars without claiming a line exists', () => {
    const { container } = render(<TrendChart {...chart} />);
    expect(container.querySelector('.rhine-chart__legend')).not.toHaveTextContent('折线');
    expect(container.querySelector('.rhine-chart__legend')).toHaveTextContent('缺失');
    expect(container.querySelectorAll('.rhine-chart__bar')).toHaveLength(2);
  });
  it('retains the gap explanation for an actual line', () => {
    const { container } = render(<TrendChart {...chart} kind="line" />);
    expect(container.querySelector('.rhine-chart__legend')).toHaveTextContent('折线在缺失处断开');
  });
  it('does not call a failed selected scope empty', () => {
    render(<ListFilterBarGallery />);
    fireEvent.change(screen.getByRole('combobox', { name: '示例状态' }), { target: { value: 'error' } });
    const scope = screen.getByRole('group', { name: '部门用量筛选' });
    fireEvent.change(within(scope).getByRole('combobox', { name: '平台' }), { target: { value: 'OpenAI' } });
    expect(scope).toHaveTextContent('暂不能确认当前范围结果');
    expect(scope).not.toHaveTextContent('当前范围无用量');
    expect(screen.queryByText('当前范围没有用量')).not.toBeInTheDocument();
  });
  it('still shows a confirmed empty scope when the simulated read succeeded', () => {
    render(<ListFilterBarGallery />);
    const scope = screen.getByRole('group', { name: '部门用量筛选' });
    fireEvent.change(within(scope).getByRole('combobox', { name: '平台' }), { target: { value: 'OpenAI' } });
    expect(scope).toHaveTextContent('当前范围无用量');
    expect(screen.getByText('当前范围没有用量')).toBeVisible();
  });
  it('labels retained compact results as a previous snapshot', () => {
    render(<CompactFilterBarGallery />);
    fireEvent.click(screen.getByRole('button', { name: '失败' }));
    expect(screen.getByRole('group', { name: '紧凑筛选示例' })).toHaveTextContent(/上次.*120/);
  });
});
