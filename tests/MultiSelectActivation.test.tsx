import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { RemoteMultiSelect } from '../components';

it('activates a selected tag independently from selection, removal and the dropdown', () => {
  const value = [{ value: 'a', label: '成员 A' }, { value: 'b', label: '成员 B' }];
  const activate = vi.fn(), change = vi.fn();
  const props = { label: '成员', query: '', onQueryChange: vi.fn(), value, options: value, onValueChange: change, onActivateValue: activate, activeValue: 'a' };
  const { rerender } = render(<RemoteMultiSelect {...props} />);
  expect(screen.getByRole('button', { name: '成员 A' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: '成员 B' }));
  expect(activate).toHaveBeenLastCalledWith(value[1]);
  expect(change).not.toHaveBeenCalled();
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '移除成员 B' }));
  expect(change).toHaveBeenLastCalledWith([value[0]]);
  expect(activate).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  rerender(<RemoteMultiSelect {...props} readOnly />);
  fireEvent.click(screen.getByRole('button', { name: '成员 B' }));
  expect(activate).toHaveBeenCalledTimes(2);
  expect(screen.getByRole('button', { name: '移除成员 B' })).toBeDisabled();
  rerender(<RemoteMultiSelect {...props} disabled />);
  expect(screen.getByRole('button', { name: '成员 B' })).toBeDisabled();
});

it('keeps locked activation disabled, exposes folded items and never activates on clear or deselect', () => {
  const value = [{ value: 'a', label: '合成锁定对象', disabled: true }, { value: 'b', label: '合成跨团队长名称对象' }, { value: 'c', label: '合成对象 C' }];
  const activate = vi.fn(), change = vi.fn();
  const props = { label: '对象', query: '', onQueryChange: vi.fn(), value, options: value, onValueChange: change, onActivateValue: activate, maxVisibleTags: 1 };
  const { rerender } = render(<RemoteMultiSelect {...props}/>);
  expect(screen.getByRole('button', { name: value[0].label })).toBeDisabled();
  expect(screen.queryByRole('button', { name: value[1].label })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '展开已选项' }));
  fireEvent.click(screen.getByRole('button', { name: value[1].label }));
  expect(activate).toHaveBeenCalledOnce(); expect(change).not.toHaveBeenCalled();
  fireEvent.focus(screen.getByRole('combobox'));
  fireEvent.click(screen.getByRole('option', { name: value[2].label }));
  expect(change).toHaveBeenLastCalledWith(value.slice(0, 2)); expect(activate).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole('button', { name: '清空选择' }));
  expect(change).toHaveBeenLastCalledWith([value[0]]); expect(activate).toHaveBeenCalledOnce();
  rerender(<RemoteMultiSelect {...props} onActivateValue={undefined}/>);
  expect(screen.queryByRole('button', { name: value[1].label })).toBeNull();
});
