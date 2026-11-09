import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { RemoteSelectionExample } from '../preview/RemoteSelectionGallery';

afterEach(() => vi.useRealTimers());
const tick = async (ms = 200) => { await act(async () => { vi.advanceTimersByTime(ms); }); };

it('retries the same page once, guards duplicate requests and preserves selections/results', async () => {
  vi.useFakeTimers(); render(<RemoteSelectionExample scenario="page-error"/>); await tick();
  fireEvent.focus(screen.getByRole('combobox'));
  fireEvent.click(screen.getByRole('button', { name: '加载更多' }));
  fireEvent.click(screen.getByRole('button', { name: /正在加载/ }));
  expect(screen.getAllByRole('option')).toHaveLength(5);
  await tick(); expect(screen.getAllByRole('option')).toHaveLength(5);
  fireEvent.click(screen.getByRole('button', { name: '重试' })); await tick();
  expect(screen.getAllByRole('option')).toHaveLength(10);
  expect(screen.getByText('请求记录：全部:0 → 全部:5 → 全部:5')).toBeVisible();
  expect(screen.getByText('已选 3 项')).toBeVisible();
});

it('retries the first page, keeps independent drafts and permits read-only activation', async () => {
  vi.useFakeTimers(); render(<RemoteSelectionExample scenario="first-error"/>); await tick();
  fireEvent.focus(screen.getByRole('combobox')); expect(screen.queryAllByRole('option')).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: '重试' })); await tick();
  expect(screen.getAllByRole('option')).toHaveLength(5);
  fireEvent.click(screen.getByRole('button', { name: '完成选择' }));
  fireEvent.change(screen.getByLabelText('当前对象草稿'), { target: { value: '对象一草稿' } });
  fireEvent.click(screen.getByRole('button', { name: '合成人员 2' }));
  expect(screen.getByLabelText('当前对象草稿')).toHaveValue('');
  fireEvent.change(screen.getByLabelText('当前对象草稿'), { target: { value: '对象二草稿' } });
  fireEvent.click(screen.getByLabelText('只读选择器'));
  fireEvent.click(screen.getByRole('button', { name: /^合成人员 1 ·/ }));
  expect(screen.getByLabelText('当前对象草稿')).toHaveValue('对象一草稿');
  expect(screen.getByRole('button', { name: '移除合成人员 2' })).toBeDisabled();
});

it.each(['slow', 'late'])('rejects replaced responses and cleans up %s requests on unmount', async scenario => {
  vi.useFakeTimers(); const { unmount } = render(<RemoteSelectionExample scenario={scenario}/>);
  fireEvent.change(screen.getByRole('combobox'), { target: { value: '12' } }); await tick(1000);
  expect(screen.getAllByRole('option')).toHaveLength(1);
  await tick(1000); expect(screen.getByRole('option', { name: '合成人员 12' })).toBeVisible();
  fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } }); unmount(); await tick(1);
  expect(vi.getTimerCount()).toBe(0);
});
