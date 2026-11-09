import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ListFilterBarGallery } from '../preview/ListFilterBarGallery';

const host = (label: string) => screen.getByRole('group', { name: label }).closest('.rhine-stack') as HTMLElement;
const chooseMode = (value: string) => fireEvent.change(screen.getByLabelText('示例状态'), { target: { value } });
const clear = (root: HTMLElement) => {
  const button = within(root).getByRole('button', { name: '清除筛选' });
  button.focus();
  fireEvent.click(button);
};

afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

describe('ListFilterBar gallery host focus handoff', () => {
  it.each(['录制会话筛选', '人员会话筛选'])('hands off the removed empty action to its own search: %s', label => {
    render(<ListFilterBarGallery />);
    const root = host(label), input = within(root).getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'no-match-regression' } });
    clear(root);
    expect(input).toHaveFocus();
    expect(input).toHaveValue('');
    expect(within(root).queryByText('没有匹配的会话')).not.toBeInTheDocument();
    expect(within(root).getByText('2 条结果')).toBeInTheDocument();
  });

  it('uses the stable primary filter when there is no search', () => {
    render(<ListFilterBarGallery />);
    const root = host('部门用量筛选'), target = within(root).getByRole('combobox', { name: '平台' });
    fireEvent.change(target, { target: { value: 'OpenAI' } });
    clear(root);
    expect(target).toHaveFocus();
    expect(target).toHaveValue('all');
    expect(within(root).getByText('示例统计结果')).toBeInTheDocument();
  });

  it('hands off even when cleared results remain empty in all three hosts', () => {
    render(<ListFilterBarGallery />);
    chooseMode('empty');
    for (const label of ['录制会话筛选', '人员会话筛选', '部门用量筛选']) {
      const root = host(label);
      clear(root);
      expect(within(root).getByRole(label === '部门用量筛选' ? 'combobox' : 'searchbox', { name: label === '部门用量筛选' ? '平台' : '搜索会话' })).toHaveFocus();
      expect(within(root).getByRole('button', { name: '清除筛选' })).toBeInTheDocument();
    }
  });

  it.each(['录制会话筛选', '人员会话筛选', '部门用量筛选'])('preserves subsequent user focus after delayed results: %s', label => {
    vi.useFakeTimers();
    render(<ListFilterBarGallery />);
    chooseMode('delayed');
    const root = host(label), stats = label === '部门用量筛选';
    const target = within(root).getByRole(stats ? 'combobox' : 'searchbox', { name: stats ? '平台' : '搜索会话' });
    fireEvent.change(target, { target: { value: stats ? 'OpenAI' : 'no-match-delayed' } });
    clear(root);
    expect(target).toHaveFocus();
    expect(within(root).getByText('正在更新结果…')).toBeInTheDocument();
    const next = within(root).getByRole('combobox', { name: stats ? '排行依据' : '会话状态' });
    next.focus();
    act(() => vi.advanceTimersByTime(600));
    expect(next).toHaveFocus();
    expect(within(root).queryByText('正在更新结果…')).not.toBeInTheDocument();
    expect(within(root).getByText(stats ? '示例统计结果' : '2 条结果')).toBeInTheDocument();
  });

  it('cancels pending completion on unmount without late focus', () => {
    vi.useFakeTimers();
    const view = render(<ListFilterBarGallery />);
    chooseMode('delayed');
    const root = host('录制会话筛选');
    fireEvent.change(within(root).getByRole('searchbox'), { target: { value: 'no-match-unmount' } });
    const scheduled = vi.spyOn(globalThis, 'setTimeout');
    const cancelled = vi.spyOn(globalThis, 'clearTimeout');
    clear(root);
    const timerIndex = scheduled.mock.calls.findIndex(call => call[1] === 600);
    expect(timerIndex).toBeGreaterThanOrEqual(0);
    const timer = scheduled.mock.results[timerIndex].value;
    view.unmount();
    expect(cancelled).toHaveBeenCalledWith(timer);
    const survivor = document.createElement('button');
    document.body.append(survivor); survivor.focus();
    act(() => vi.advanceTimersByTime(1000));
    expect(survivor).toHaveFocus(); survivor.remove();
  });
});
