import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { expect, it, vi } from 'vitest';
import { Combobox, RemoteMultiSelect, type ComboboxProps } from '../components';
const options = [{ value: 'a', label: '12.4.0' }, { value: 'locked', label: '不可用', disabled: true }, { value: 'b', label: '12.4.0-alpha.11' }];
const base: ComboboxProps = { label: '版本', query: 'bad', onQueryChange: () => {}, value: null, onValueChange: () => {}, options };
it('adds independent validation descriptions and allows corrective keyboard and pointer selection', () => {
  const select = vi.fn();
  const view = render(<Combobox {...base} id="version" hint="合成提示" validationError="格式不正确" onValueChange={select} />);
  const input = screen.getByRole('combobox');
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input).toHaveAccessibleDescription('3 个候选项 合成提示 格式不正确');
  expect(screen.getByRole('alert')).toHaveTextContent('格式不正确');
  act(() => input.focus()); fireEvent.keyDown(input, { key: 'End' }); fireEvent.keyDown(input, { key: 'Enter' });
  expect(select).toHaveBeenLastCalledWith(options[2]);
  fireEvent.click(input); fireEvent.click(screen.getByRole('option', { name: '12.4.0' }));
  expect(select).toHaveBeenLastCalledWith(options[0]);
  view.rerender(<Combobox {...base} id="version" />);
  expect(input).not.toHaveAttribute('aria-invalid'); expect(input).toHaveAccessibleDescription('3 个候选项');
  expect(screen.queryByRole('alert')).toBeNull();
});
it('keeps fetch error semantics and manual input when validation and fetch errors coexist', () => {
  const select = vi.fn(), change = vi.fn();
  render(<Combobox {...base} error="读取失败" validationError="格式不正确" statusDisplay="compact" onValueChange={select} onQueryChange={change} />);
  const input = screen.getByRole('combobox'); act(() => input.focus());
  expect(input).toHaveAccessibleDescription('读取失败 格式不正确'); expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByRole('status')).not.toHaveClass('rhine-sr-only'); expect(screen.queryAllByRole('option')).toHaveLength(0);
  fireEvent.keyDown(input, { key: 'End' }); fireEvent.keyDown(input, { key: 'Enter' }); expect(select).not.toHaveBeenCalled();
  fireEvent.change(input, { target: { value: '19.0.0' } }); expect(change).toHaveBeenCalledWith('19.0.0');
});
it('keeps routine status announced with optional compact display, and fetch errors visible during retry', () => {
  const view = render(<Combobox {...base} />), status = screen.getByRole('status');
  expect(status).not.toHaveClass('rhine-sr-only');
  view.rerender(<Combobox {...base} statusDisplay="compact" />); expect(status).toHaveClass('rhine-sr-only');
  view.rerender(<Combobox {...base} statusDisplay="compact" loading error="读取失败" />);
  expect(status).not.toHaveClass('rhine-sr-only'); expect(status).toHaveTextContent('读取失败');
  act(() => screen.getByRole('combobox').focus()); expect(screen.getByRole('listbox')).toHaveTextContent('正在读取…');
  view.rerender(<Combobox {...base} statusDisplay="compact" loading />); expect(status).toHaveClass('rhine-sr-only'); expect(status).toHaveTextContent('正在读取候选项');
  view.rerender(<Combobox {...base} statusDisplay="compact" options={[]} />); expect(status).toHaveTextContent('暂无匹配结果'); expect(screen.getByRole('listbox')).toHaveTextContent('暂无匹配结果');
});
it('preserves IME, disabled/readOnly and loading guards with validation', () => {
  const change = vi.fn(), select = vi.fn();
  const view = render(<Combobox {...base} validationError="格式不正确" onQueryChange={change} onValueChange={select} />);
  const input = screen.getByRole('combobox'); act(() => input.focus());
  fireEvent.compositionStart(input); fireEvent.change(input, { target: { value: '合成' } });
  fireEvent.keyDown(input, { key: 'End', isComposing: true }); fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 });
  expect(change).not.toHaveBeenCalled(); expect(select).not.toHaveBeenCalled();
  fireEvent.compositionEnd(input, { data: '合成' }); expect(change).toHaveBeenCalledWith('合成');
  for (const guard of [{ loading: true }, { disabled: true }, { readOnly: true }]) {
    view.rerender(<Combobox {...base} validationError="格式不正确" onValueChange={select} {...guard} />);
    fireEvent.click(input); fireEvent.keyDown(input, { key: 'End' }); fireEvent.keyDown(input, { key: 'Enter' });
    expect(select).not.toHaveBeenCalled();
  }
});
it('passes optional feedback to multi-select without blocking correction or changing completion', () => {
  function Host() { const [value, setValue] = useState<typeof options>([]); return <RemoteMultiSelect {...base} value={value} onValueChange={setValue} validationError="至少选择一项" statusDisplay="compact" />; }
  render(<Host />); const input = screen.getByRole('combobox'); act(() => input.focus());
  fireEvent.keyDown(input, { key: 'End' }); fireEvent.keyDown(input, { key: 'Enter' });
  expect(within(screen.getByRole('list', { name: '版本已选项' })).getByText(options[2].label)).toBeVisible();
  expect(input).toHaveAttribute('aria-expanded', 'true'); fireEvent.click(screen.getByRole('button', { name: '完成选择' }));
  expect(input).toHaveAttribute('aria-expanded', 'false'); expect(input).toHaveFocus();
  expect(screen.getByRole('status')).toHaveClass('rhine-sr-only');
});
