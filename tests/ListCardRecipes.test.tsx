import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ListCardRecipes, OwnershipLabels } from '../preview/ListCardRecipes';

afterEach(() => vi.useRealTimers());

it('keeps real result panels and permitted classifications without bulk permission', async () => {
  vi.useFakeTimers();
  render(<ListCardRecipes />);
  fireEvent.click(screen.getByLabelText('有批量权限'));
  expect(screen.queryByRole('button', { name:'批量设置' })).not.toBeInTheDocument();
  expect(screen.getAllByRole('tab')).toHaveLength(3);
  fireEvent.click(screen.getByRole('tab', { name:'API Key' }));
  const selected = screen.getByRole('tab', { name:'API Key' });
  expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby',selected.id);
  await act(async () => { vi.advanceTimersByTime(450); });
  expect(within(screen.getByRole('tabpanel')).getByText('可用额度：不提供额度')).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('可查看 API Key'));
  expect(screen.queryByRole('tab', { name:'API Key' })).not.toBeInTheDocument();
  expect(screen.getByRole('tab', { name:'全部' })).toHaveAttribute('aria-selected','true');
});

it('cleans pending synthetic reads on scope changes and unmount', () => {
  vi.useFakeTimers();
  const { unmount } = render(<ListCardRecipes />);
  expect(vi.getTimerCount()).toBe(1);
  fireEvent.click(screen.getByRole('tab', { name:'OAuth' }));
  expect(vi.getTimerCount()).toBe(1);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it('keeps full read-only labels and exposes an empty state', () => {
  const { rerender } = render(<OwnershipLabels labels={['A complete synthetic ownership label']} />);
  const region = screen.getByRole('region');
  expect(region).toHaveAttribute('tabindex','0');
  expect(region).toHaveStyle({ flexWrap:'nowrap',overflowX:'auto' });
  expect(region).toHaveTextContent('A complete synthetic ownership label');
  expect(within(region).queryByRole('button')).not.toBeInTheDocument();
  rerender(<OwnershipLabels labels={[]} />);
  expect(screen.queryByRole('region')).not.toBeInTheDocument();
  expect(screen.getByText('暂无归属分组')).toBeInTheDocument();
});


it('shows bulk actions only after the current read is ready and restores focus on removal', async () => {
  vi.useFakeTimers();
  render(<ListCardRecipes />);
  expect(screen.queryByRole('button', { name:'批量设置' })).not.toBeInTheDocument();
  await act(async () => { vi.advanceTimersByTime(450); });
  fireEvent.click(screen.getByRole('tab', { name:'全部' }));
  const bulk = screen.getByRole('button', { name:'批量设置' });
  bulk.focus();
  fireEvent.change(screen.getByLabelText('列表配方状态'), { target:{ value:'empty' } });
  expect(screen.queryByRole('button', { name:'批量设置' })).not.toBeInTheDocument();
  expect(screen.getByRole('tab', { name:'全部' })).toHaveFocus();
  for (const value of ['error','loading']) {
    fireEvent.change(screen.getByLabelText('列表配方状态'), { target:{ value } });
    await act(async () => { vi.advanceTimersByTime(450); });
    expect(screen.queryByRole('button', { name:'批量设置' })).not.toBeInTheDocument();
  }
  fireEvent.change(screen.getByLabelText('列表配方状态'), { target:{ value:'normal' } });
  expect(screen.queryByRole('button', { name:'批量设置' })).not.toBeInTheDocument();
  await act(async () => { vi.advanceTimersByTime(450); });
  expect(screen.getByRole('button', { name:'批量设置' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name:'OAuth' }));
  expect(screen.queryByRole('button', { name:'批量设置' })).not.toBeInTheDocument();
});
