import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { RemoteMultiSelect } from '../components';

it('contains pagination actions, retains choices during failure and restores focus at the end', () => {
  const props = { label: '候选', query: '', onQueryChange: vi.fn(), value: [], onValueChange: vi.fn(), options: [{ value: 'a', label: '候选 A' }], hasMore: true, onLoadMore: vi.fn(), onRetry: vi.fn() };
  const { rerender } = render(<RemoteMultiSelect {...props}/>);
  expect(screen.queryByRole('button', { name: '加载更多' })).toBeNull();
  const input = screen.getByRole('combobox'); fireEvent.focus(input);
  const more = screen.getByRole('button', { name: '加载更多' });
  expect(more.closest('.rhine-combobox__list')).toBeTruthy();
  expect(more.closest('[role=listbox]')).toBeNull();
  fireEvent.keyDown(input, { key: 'Tab' }); expect(more).toHaveFocus();
  fireEvent.keyDown(more, { key: 'Tab' }); expect(screen.getByRole('button', { name: '完成选择' })).toHaveFocus();
  fireEvent.keyDown(document.activeElement!, { key: 'Tab', shiftKey: true }); expect(more).toHaveFocus();
  rerender(<RemoteMultiSelect {...props} loadingMore/>);
  expect(screen.getByRole('option')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: /正在加载/ })); expect(props.onLoadMore).not.toHaveBeenCalled();
  rerender(<RemoteMultiSelect {...props} loadMoreError="下一页失败"/>);
  expect(screen.getByRole('option')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: '重试' })); expect(props.onRetry).toHaveBeenCalledOnce();
  rerender(<RemoteMultiSelect {...props} hasMore={false}/>);
  expect(input).toHaveFocus();
  expect(screen.queryByRole('button', { name: '加载更多' })).toBeNull();
  fireEvent.keyDown(input, { key: 'Escape' }); expect(screen.queryByRole('listbox')).toBeNull();
});
