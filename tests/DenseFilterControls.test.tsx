import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DateRangePicker, RemoteMultiSelect, type Choice } from '../components';

describe('compact date range', () => {
  it('keeps both native fields and range validation inside one named group', () => {
    const validation = vi.fn();
    function Example() {
      const [value, setValue] = useState({ start: '2026-10-01', end: '2026-10-24' });
      return <DateRangePicker compact label="日期范围" value={value} onValueChange={setValue} min="2026-01-01" max="2026-12-31" clearable={false} required onValidationChange={validation} />;
    }
    render(<Example />);
    const group = screen.getByRole('group', { name: '日期范围' });
    expect(group).toHaveClass('rhine-date-range--compact');
    expect(within(group).getByLabelText('开始日期')).toBeRequired();
    expect(within(group).getByLabelText('结束日期')).toHaveAttribute('type', 'date');
    fireEvent.change(screen.getByLabelText('结束日期'), { target: { value: '2026-09-30' } });
    expect(validation).toHaveBeenLastCalledWith('结束日期不能早于开始日期。');
    fireEvent.change(screen.getByLabelText('结束日期'), { target: { value: '2026-10-24' } });
    expect(validation).toHaveBeenLastCalledWith(null);
    fireEvent.change(screen.getByLabelText('开始日期'), { target: { value: '2025-12-31' } });
    expect(validation).toHaveBeenLastCalledWith('日期不能早于 2026-01-01。');
  });

  it('preserves readonly and external value replacement in compact mode', () => {
    const change = vi.fn();
    const { rerender } = render(<DateRangePicker compact label="范围" value={{ start: '2026-10-01', end: '2026-10-24' }} onValueChange={change} readOnly />);
    fireEvent.change(screen.getByLabelText('开始日期'), { target: { value: '2026-10-02' } });
    expect(change).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '清空日期' })).toBeDisabled();
    rerender(<DateRangePicker compact label="范围" value={{ start: '2026-11-01', end: '2026-11-24' }} onValueChange={change} readOnly />);
    expect(screen.getByLabelText('开始日期')).toHaveValue('2026-11-01');
  });
});

describe('bounded multi-select tags', () => {
  const choices: Choice[] = Array.from({ length: 100 }, (_, i) => ({ value: String(i), label: `合成部门 ${i + 1}`, disabled: i === 0 }));
  function Example() {
    const [value, setValue] = useState(choices.slice(0, 90));
    const [query, setQuery] = useState('');
    return <RemoteMultiSelect label="部门" query={query} onQueryChange={setQuery} options={choices} value={value} onValueChange={setValue} maxVisibleTags={2} name="department" />;
  }
  it('shows a bounded summary without dropping hidden selections and expands for removal', () => {
    render(<Example />);
    const tags = screen.getByRole('list', { name: '部门已选项' });
    expect(within(tags).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('已选 90 项')).toBeInTheDocument();
    expect(document.querySelectorAll('input[type=hidden]')).toHaveLength(90);
    fireEvent.click(screen.getByRole('button', { name: '展开已选项' }));
    expect(within(tags).getAllByRole('listitem')).toHaveLength(90);
    fireEvent.click(screen.getByRole('button', { name: '移除合成部门 90' }));
    expect(screen.getByText('已选 89 项')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: '收起已选项' }));
    expect(within(tags).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('button', { name: '移除合成部门 1' })).toBeDisabled();
  });
  it('retains hidden-item keyboard removal and locked selections when clearing', () => {
    render(<Example />);
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Backspace' });
    expect(screen.getByText('已选 89 项')).toBeInTheDocument();
    expect(document.querySelector('input[type=hidden][value="89"]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '清空选择' }));
    expect(screen.getByText('已选 1 项')).toBeInTheDocument();
    expect(document.querySelectorAll('input[type=hidden]')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: '展开已选项' })).not.toBeInTheDocument();
  });
  it('collapses a new selection after the host clears an expanded selection', () => {
    const props = { label: '部门', query: '', onQueryChange: vi.fn(), options: choices, onValueChange: vi.fn(), maxVisibleTags: 2, name: 'department' };
    const { rerender } = render(<RemoteMultiSelect {...props} value={choices.slice(0, 90)} />);
    fireEvent.click(screen.getByRole('button', { name: '展开已选项' }));
    rerender(<RemoteMultiSelect {...props} value={[]} />);
    rerender(<RemoteMultiSelect {...props} value={choices} />);
    expect(within(screen.getByRole('list', { name: '部门已选项' })).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('button', { name: '展开已选项' })).toHaveAttribute('aria-expanded', 'false');
    expect(document.querySelectorAll('input[type=hidden]')).toHaveLength(100);
  });
});
