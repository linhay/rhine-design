import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Combobox, DateField, DateRangePicker, NumberField, RemoteMultiSelect, TreeSelect } from '../components';

describe('date field parity', () => {
  it('reports controlled invalid dates and changed bounds without rewriting the value', () => {
    const change = vi.fn(), validation = vi.fn();
    const props = { label: '日期', value: '2026-10-24', onValueChange: change, onValidationChange: validation, name: 'date', hint: '仅日期，无时区' };
    const { rerender } = render(<DateField {...props} min="2026-10-01" max="2026-10-31" />);
    expect(validation).toHaveBeenLastCalledWith(null);
    rerender(<DateField {...props} max="2026-10-23" />);
    expect(screen.getByLabelText('日期')).toHaveAttribute('aria-invalid', 'true');
    expect(validation).toHaveBeenLastCalledWith('日期不能晚于 2026-10-23。');
    expect(screen.getByLabelText('日期')).toHaveValue('2026-10-24'); expect(change).not.toHaveBeenCalled();
    rerender(<DateField {...props} value="2026-02-30" />);
    expect(validation).toHaveBeenLastCalledWith('请输入有效日期。');
  });

  it('does not repeat validation notifications when only the callback identity changes', () => {
    const validation = vi.fn(); const props = { label: '日期', value: '2026-10-24', onValueChange: () => {}, max: '2026-10-23' };
    const { rerender } = render(<DateField {...props} onValidationChange={error => validation(error)} />);
    rerender(<DateField {...props} onValidationChange={error => validation(error)} />);
    expect(validation).toHaveBeenCalledOnce();
  });

  it('blocks invalid range presets and protects readonly fields and actions', () => {
    const change = vi.fn();
    const props = { label: '期间', value: { start: '2026-10-01', end: '2026-10-24' }, onValueChange: change, startLabel: '起始', endLabel: '截至', startName: 'from', endName: 'to', presets: [
      { label: '反向', value: { start: '2026-10-24', end: '2026-10-01' } },
      { label: '无效日期', value: { start: '2026-02-30', end: '2026-10-01' } },
      { label: '正常', value: { start: '2026-10-01', end: '2026-10-24' } },
    ] };
    const { rerender } = render(<DateRangePicker {...props} />);
    expect(screen.getByRole('button', { name: '反向' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '无效日期' })).toBeDisabled();
    expect(screen.getByLabelText('起始')).toHaveAttribute('name', 'from');
    rerender(<DateRangePicker {...props} readOnly required />);
    expect(screen.getByLabelText('截至')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('起始')).toBeRequired();
    fireEvent.change(screen.getByLabelText('起始'), { target: { value: '2026-10-03' } });
    fireEvent.click(screen.getByRole('button', { name: '正常' }));
    fireEvent.click(screen.getByRole('button', { name: '清空日期' })); expect(change).not.toHaveBeenCalled();
    rerender(<DateRangePicker {...props} clearable={false} />);
    expect(screen.queryByRole('button', { name: '清空日期' })).not.toBeInTheDocument();
  });
});

describe('number field parity', () => {
  it('does not report unchanged numeric or empty values when committing the draft', () => {
    const change = vi.fn(); const props = { label: '数量', value: 4, onValueChange: change };
    const { rerender } = render(<NumberField {...props} />); const input = screen.getByRole('spinbutton');
    fireEvent.focus(input); fireEvent.blur(input); fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.change(input, { target: { value: '4.00' } }); fireEvent.blur(input);
    expect(input).toHaveValue('4'); expect(change).not.toHaveBeenCalled();
    rerender(<NumberField {...props} value={null} />);
    fireEvent.blur(input); fireEvent.keyDown(input, { key: 'Enter' });
    expect(change).not.toHaveBeenCalled();
  });

  it('reports each changed controlled value once across Enter and subsequent blur', () => {
    const change = vi.fn();
    function Demo() {
      const [value, setValue] = useState<number | null>(4);
      return <NumberField label="数量" value={value} precision={1} onValueChange={next => { change(next); setValue(next); }} />;
    }
    render(<Demo />); const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '4.24' } }); fireEvent.keyDown(input, { key: 'Enter' }); fireEvent.blur(input);
    expect(input).toHaveValue('4.2'); expect(change.mock.calls).toEqual([[4.2]]);
    fireEvent.change(input, { target: { value: '' } }); fireEvent.blur(input); fireEvent.blur(input);
    expect(change.mock.calls).toEqual([[4.2], [null]]);
  });

  it('preserves parsed precision on ordinary commits unless precision was explicitly supplied', () => {
    const change = vi.fn(); const props = { label: '小数', value: 1e-13, onValueChange: change };
    const { rerender } = render(<NumberField {...props} />); const input = screen.getByRole('spinbutton');
    fireEvent.blur(input); expect(input).toHaveValue('1e-13'); expect(change).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: '1.23456789012345' } }); fireEvent.keyDown(input, { key: 'Enter' });
    expect(change).toHaveBeenLastCalledWith(1.23456789012345);
    rerender(<NumberField {...props} value={0.1} step={0.2} />);
    fireEvent.keyDown(input, { key: 'ArrowUp' }); expect(change).toHaveBeenLastCalledWith(0.3);
  });

  it('keeps readonly values selectable without accepting keyboard, pointer or blur changes', () => {
    const change = vi.fn(); render(<NumberField label="数量" value={4} onValueChange={change} readOnly name="quantity" hint="审核中" />);
    const input = screen.getByRole('spinbutton'); expect(input).not.toBeDisabled(); expect(input).toHaveAttribute('readonly');
    fireEvent.change(input, { target: { value: '5' } }); fireEvent.keyDown(input, { key: 'ArrowUp' }); fireEvent.keyDown(input, { key: 'Enter' }); fireEvent.blur(input);
    expect(screen.getByRole('button', { name: '增加数量' })).toBeDisabled(); expect(change).not.toHaveBeenCalled();
  });

  it('cancels an uncommitted draft with Escape and reports changed bounds without clamping', () => {
    const change = vi.fn(); const props = { label: '数量', value: 4, onValueChange: change };
    const { rerender } = render(<NumberField {...props} />); const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '-' } }); fireEvent.keyDown(input, { key: 'Escape' });
    expect(input).toHaveValue('4'); expect(change).not.toHaveBeenCalled();
    rerender(<NumberField {...props} max={3} controls={false} />);
    expect(input).toHaveValue('4'); expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByRole('button', { name: '增加数量' })).not.toBeInTheDocument(); expect(change).not.toHaveBeenCalled();
  });

  it('allows an empty negative range to be stepped into the range', () => {
    const change = vi.fn(); render(<NumberField label="偏移" value={null} onValueChange={change} min={-10} max={-1} />);
    const increase = screen.getByRole('button', { name: '增加偏移' }); expect(increase).toBeEnabled();
    fireEvent.click(increase); expect(change).toHaveBeenLastCalledWith(-1);
  });
});

describe('remote multi-select parity', () => {
  it.each([false, true])('removes a tag without reopening candidates (initially open: %s)', initiallyOpen => {
    const query = vi.fn(), submit = vi.fn(event => event.preventDefault());
    function Demo() {
      const [value, setValue] = useState([{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }]);
      return <form onSubmit={submit}><RemoteMultiSelect label="成员" query="保留查询" onQueryChange={query} value={value} onValueChange={setValue} options={[{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }]} /></form>;
    }
    render(<Demo />); const input = screen.getByRole('combobox');
    if (initiallyOpen) act(() => input.focus());
    fireEvent.click(screen.getByRole('button', { name: '移除Beta' }));
    expect(screen.queryByRole('button', { name: '移除Beta' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '移除Alpha' })).toBeVisible();
    expect(input).toHaveFocus(); expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveValue('保留查询'); expect(query).not.toHaveBeenCalled(); expect(submit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '移除Alpha' }));
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: '清空选择' })).not.toBeInTheDocument();
  });

  it.each([false, true])('Backspace retains the current candidate state (open: %s)', initiallyOpen => {
    function Demo() {
      const [value, setValue] = useState([{ value: 'a', label: 'Alpha' }]);
      return <RemoteMultiSelect label="成员" query="" onQueryChange={() => {}} value={value} onValueChange={setValue} options={[{ value: 'a', label: 'Alpha' }]} />;
    }
    render(<Demo />); const input = screen.getByRole('combobox'); act(() => input.focus());
    if (!initiallyOpen) fireEvent.keyDown(input, { key: 'Escape' });
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(screen.queryByRole('button', { name: '移除Alpha' })).not.toBeInTheDocument();
    expect(input).toHaveAttribute('aria-expanded', String(initiallyOpen)); expect(input).toHaveFocus();
  });

  it.each([false, true])('clears without opening candidates (initially open: %s) and hides empty actions', initiallyOpen => {
    const query = vi.fn(), submit = vi.fn(event => event.preventDefault());
    function Demo() {
      const [value, setValue] = useState([{ value: 'a', label: 'Alpha' }]);
      return <form onSubmit={submit}><RemoteMultiSelect label="成员" query="保留查询" onQueryChange={query} value={value} onValueChange={setValue} options={[{ value: 'a', label: 'Alpha' }]} maxVisibleTags={2} /></form>;
    }
    render(<Demo />); const input = screen.getByRole('combobox');
    if (initiallyOpen) act(() => input.focus());
    const clear = screen.getByRole('button', { name: '清空选择' }); act(() => clear.focus()); fireEvent.click(clear);
    expect(screen.getByText('已选 0 项')).toBeVisible();
    expect(screen.queryByRole('button', { name: '清空选择' })).not.toBeInTheDocument();
    expect(input).toHaveFocus(); expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input).toHaveValue('保留查询'); expect(query).not.toHaveBeenCalled(); expect(submit).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: 'ArrowDown' }); fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByRole('button', { name: '清空选择' })).toBeVisible();
  });

  it('hides clear when only locked choices remain', () => {
    render(<RemoteMultiSelect label="成员" query="" onQueryChange={() => {}} value={[{ value: 'locked', label: '固定', disabled: true }]} onValueChange={vi.fn()} options={[]} />);
    expect(screen.queryByRole('button', { name: '清空选择' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '移除固定' })).toBeDisabled();
  });

  it('keeps the list open for consecutive selection and exposes the selected list semantics', () => {
    const query = vi.fn();
    function Demo() {
      const [value, setValue] = useState([{ value: 'old', label: '旧结果' }]);
      return <RemoteMultiSelect label="成员" query="服务端搜索词" onQueryChange={query} value={value} onValueChange={setValue} options={[{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }]} name="member" />;
    }
    const { container } = render(<Demo />); const input = screen.getByRole('combobox'); fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' }); fireEvent.keyDown(input, { key: 'Enter' });
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
    expect(screen.getByRole('option', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(input, { key: 'End' }); fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByRole('button', { name: '移除Beta' })).toBeVisible();
    expect(container.querySelectorAll('input[type="hidden"][name="member"]')).toHaveLength(3);
    expect(query).not.toHaveBeenCalled();
  });

  it('toggles selected candidates with pointer and keyboard, then completes without submitting', () => {
    const submit = vi.fn(event => event.preventDefault());
    function Demo() {
      const [value, setValue] = useState([{ value: 'a', label: 'Alpha' }, { value: 'locked', label: 'Locked', disabled: true }]);
      return <form onSubmit={submit}><RemoteMultiSelect label="成员" query="查询" onQueryChange={() => {}} value={value} onValueChange={setValue} options={[{ value: 'a', label: 'Alpha' }, { value: 'locked', label: 'Locked' }, { value: 'off', label: 'Disabled', disabled: true }]} /></form>;
    }
    render(<Demo />);
    const input = screen.getByRole('combobox'); act(() => input.focus());
    fireEvent.click(screen.getByRole('option', { name: 'Alpha' }));
    expect(screen.getByRole('option', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.queryByRole('button', { name: '移除Alpha' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('option', { name: 'Locked' }));
    fireEvent.click(screen.getByRole('option', { name: 'Disabled' }));
    expect(screen.getByRole('button', { name: '移除Locked' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: '移除Disabled' })).not.toBeInTheDocument();
    fireEvent.keyDown(input, { key: 'ArrowDown' }); fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByRole('option', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(input, { key: 'ArrowDown' }); fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByRole('option', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'false');
    const done = screen.getByRole('button', { name: '完成选择' }); act(() => done.focus());
    expect(input).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(done);
    expect(input).toHaveAttribute('aria-expanded', 'false'); expect(input).toHaveFocus();
    expect(input).toHaveValue('查询'); expect(submit).not.toHaveBeenCalled();
    fireEvent.click(input); act(() => screen.getByRole('button', { name: '完成选择' }).focus());
    fireEvent.keyDown(screen.getByRole('button', { name: '完成选择' }), { key: 'Escape' });
    expect(input).toHaveAttribute('aria-expanded', 'false'); expect(input).toHaveFocus();
  });

  it('removes the last removable tag with Backspace while respecting IME and locked values', () => {
    const change = vi.fn(); render(<RemoteMultiSelect label="成员" query="" onQueryChange={() => {}} value={[{ value: 'a', label: 'Alpha' }, { value: 'locked', label: '固定', disabled: true }]} onValueChange={change} options={[]} />);
    const input = screen.getByRole('combobox'); fireEvent.focus(input); fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: 'Backspace' }); expect(change).not.toHaveBeenCalled();
    fireEvent.compositionEnd(input); fireEvent.keyDown(input, { key: 'Backspace' });
    expect(change).toHaveBeenLastCalledWith([{ value: 'locked', label: '固定', disabled: true }]);
  });

  it('restores input focus after removing a tag and supports opt-in query reset', () => {
    const change = vi.fn(), query = vi.fn(); render(<RemoteMultiSelect label="成员" query="a" onQueryChange={query} value={[{ value: 'old', label: '旧结果' }]} onValueChange={change} options={[{ value: 'a', label: 'Alpha' }]} clearQueryOnSelect closeOnSelect />);
    const remove = screen.getByRole('button', { name: '移除旧结果' }); act(() => remove.focus()); fireEvent.click(remove);
    expect(screen.getByRole('combobox')).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' }); fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });
    expect(query).toHaveBeenLastCalledWith(''); expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps the existing single Combobox close-on-selection behavior and readonly selections', () => {
    const change = vi.fn(); const props = { label: '单选', query: '', onQueryChange: vi.fn(), value: null, onValueChange: change, options: [{ value: 'a', label: 'Alpha' }] };
    const { rerender } = render(<Combobox {...props} />); const input = screen.getByRole('combobox');
    fireEvent.focus(input); fireEvent.keyDown(input, { key: 'ArrowDown' }); fireEvent.keyDown(input, { key: 'Enter' });
    expect(input).toHaveAttribute('aria-expanded', 'false'); expect(change).toHaveBeenCalledOnce();
    rerender(<Combobox {...props} readOnly />); fireEvent.focus(input); fireEvent.keyDown(input, { key: 'ArrowDown' }); fireEvent.keyDown(input, { key: 'Enter' });
    expect(input).toHaveAttribute('aria-expanded', 'false'); expect(change).toHaveBeenCalledOnce();
  });
});

describe('tree keyboard parity', () => {
  const nodes = [{ id: 'root', label: 'Group', children: [{ id: 'alpha', label: 'Alpha' }, { id: 'beta', label: 'Beta', disabled: true }] }, { id: 'other', label: 'Other', selectable: false, children: [{ id: 'gamma', label: 'Gamma' }] }];
  it('starts at a selected item and supports typeahead and sibling expansion without selecting', () => {
    const change = vi.fn(), expand = vi.fn(); render(<TreeSelect label="目录" nodes={nodes} value={['alpha']} onValueChange={change} expandedKeys={['root']} onExpandedChange={expand} />);
    const alpha = screen.getByRole('treeitem', { name: 'Alpha' }); expect(alpha).toHaveAttribute('tabindex', '0'); act(() => alpha.focus());
    fireEvent.keyDown(alpha, { key: 'b' }); expect(screen.getByRole('treeitem', { name: 'Beta' })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('treeitem', { name: 'Beta' }), { key: 'Home' });
    fireEvent.keyDown(screen.getByRole('treeitem', { name: 'Group' }), { key: '*' });
    expect(expand).toHaveBeenLastCalledWith(['root', 'other']); expect(change).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole('treeitem', { name: 'Other' }), { key: 'Enter' }); expect(change).not.toHaveBeenCalled();
  });

  it('selects only visible eligible nodes and preserves offscreen and disabled selections', () => {
    const change = vi.fn(); render(<TreeSelect label="目录" nodes={nodes} value={['offscreen', 'beta']} onValueChange={change} expandedKeys={['root']} onExpandedChange={() => {}} multiple />);
    fireEvent.keyDown(screen.getByRole('treeitem', { name: 'Group' }), { key: 'a', ctrlKey: true });
    expect(change).toHaveBeenLastCalledWith(['offscreen', 'beta', 'root', 'alpha']);
  });

  it('contains unmatched typeahead inside the focused treeitem instead of bubbling to its parents', () => {
    const outerKey = vi.fn();
    render(<div onKeyDown={outerKey}><TreeSelect label="目录" nodes={nodes} value={[]} onValueChange={() => {}} expandedKeys={['root']} onExpandedChange={() => {}} /></div>);
    const alpha = screen.getByRole('treeitem', { name: 'Alpha' }); act(() => alpha.focus());
    fireEvent.keyDown(alpha, { key: 'z' }); expect(outerKey).not.toHaveBeenCalled(); expect(alpha).toHaveFocus();
  });

  it('returns focus to the ancestor when the host collapses a focused child and protects readonly selection', () => {
    const change = vi.fn(), expand = vi.fn(); const props = { label: '目录', nodes, value: ['alpha'], onValueChange: change, onExpandedChange: expand, readOnly: true };
    const { rerender } = render(<TreeSelect {...props} expandedKeys={['root']} />); act(() => screen.getByRole('treeitem', { name: 'Alpha' }).focus());
    fireEvent.keyDown(screen.getByRole('treeitem', { name: 'Alpha' }), { key: ' ' }); expect(change).not.toHaveBeenCalled();
    rerender(<TreeSelect {...props} expandedKeys={[]} />);
    const group = screen.getByRole('treeitem', { name: 'Group' }); expect(group).toHaveFocus();
    fireEvent.keyDown(group, { key: 'ArrowRight' }); expect(expand).toHaveBeenLastCalledWith(['root']);
  });
});
