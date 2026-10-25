import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ListFilterBar, SegmentedControl, Select } from '../components';

const field = { id: 'state', label: '状态', control: <Select label="状态" defaultValue="all"><option value="all">全部</option></Select> };

describe('compact filter presentation', () => {
  it('omits redundant drawer copy while keeping pending and error feedback', async () => {
    const { rerender } = render(<ListFilterBar label="记录筛选" filters={[field]} result="120 条结果" drawerDescription={null} drawerResult={null} />);
    fireEvent.click(screen.getByRole('button', { name: '更多筛选' }));
    const dialog = await screen.findByRole('dialog', { name: '记录筛选' });
    expect(within(dialog).queryByText('更改后立即更新结果。')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('120 条结果')).not.toBeInTheDocument();
    expect(dialog).not.toHaveAttribute('aria-describedby');
    expect(document.querySelectorAll('.rhine-list-filter-bar__feedback')).toHaveLength(1);
    rerender(<ListFilterBar label="记录筛选" filters={[field]} result="120 条结果" drawerDescription={null} drawerResult={null} pending error="连接暂时不可用" />);
    expect(within(dialog).getByText('正在更新结果…')).toBeInTheDocument();
    expect(within(dialog).getByRole('alert')).toHaveTextContent('连接暂时不可用');
  });

  it('preserves legacy drawer feedback and supports distinct drawer content', async () => {
    const { rerender } = render(<ListFilterBar label="记录筛选" filters={[field]} result="120 条结果" />);
    fireEvent.click(screen.getByRole('button', { name: '更多筛选' }));
    const dialog = await screen.findByRole('dialog', { name: '记录筛选' });
    expect(within(dialog).getByText('120 条结果')).toBeInTheDocument();
    expect(dialog).toHaveAccessibleDescription('更改后立即更新结果。');
    rerender(<ListFilterBar label="记录筛选" filters={[field]} result="120 条结果" drawerDescription={<span>按需选择范围</span>} drawerResult="已选 3 项" />);
    expect(dialog).toHaveAccessibleDescription('按需选择范围');
    expect(within(dialog).getByText('已选 3 项')).toBeInTheDocument();
    expect(within(dialog).queryByText('120 条结果')).not.toBeInTheDocument();
  });

  it('full-width segments remain controlled native radios with disabled state', () => {
    const onChange = vi.fn();
    function Example() {
      const [value, setValue] = useState('today');
      return <SegmentedControl fullWidth label="时间快捷" value={value} onValueChange={next => { setValue(next); onChange(next); }} items={[
        { value: 'today', label: '今天' }, { value: 'yesterday', label: '昨天' }, { value: 'week', label: '本周', disabled: true },
      ]} />;
    }
    render(<Example />);
    expect(screen.getByRole('group', { name: '时间快捷' })).toHaveClass('rhine-segmented--full-width');
    fireEvent.click(screen.getByRole('radio', { name: '昨天' }));
    expect(screen.getByRole('radio', { name: '昨天' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '今天' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: '本周' })).toBeDisabled();
    expect(onChange).toHaveBeenCalledExactlyOnceWith('yesterday');
  });
});
