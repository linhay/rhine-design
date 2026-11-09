import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button, Popover } from '../components';
import { ThemeProvider } from '../components/theme';
import { TrayUsageGallery } from '../preview/TrayUsageGallery';

afterEach(() => vi.useRealTimers());
function demo() { return render(<ThemeProvider><TrayUsageGallery /></ThemeProvider>); }
const account = () => screen.getByRole('combobox', { name: 'Agent A 当前账号' });
const panel = () => screen.getByRole('dialog', { name: '账号与用量概览' });

describe('headerless Popover and synthetic usage host', () => {
  it('preserves the accessible name and default header compatibility', () => {
    const { rerender } = render(<ThemeProvider><Popover title="详情名称" trigger={<Button>详情</Button>} open>内容</Popover></ThemeProvider>);
    expect(screen.getByRole('button', { name: '关闭详情' })).toBeVisible();
    rerender(<ThemeProvider><Popover title="详情名称" showHeader={false} trigger={<Button>详情</Button>} open>内容</Popover></ThemeProvider>);
    expect(screen.getByRole('dialog', { name: '详情名称' })).toBeVisible();
    expect(screen.queryByRole('button', { name: '关闭详情' })).toBeNull();
    expect(screen.queryByText('详情名称')).toBeNull();
  });
  it('keeps committed account and unrelated data while pending, locks duplicates, and retries a failure', () => {
    demo(); vi.useFakeTimers();
    fireEvent.click(screen.getByLabelText('首次切换失败'));
    const other = screen.getByTestId('other-agent').textContent, summary = screen.getByTestId('usage-summary').textContent;
    fireEvent.change(account(), { target: { value: 'b' } });
    fireEvent.change(account(), { target: { value: 'b' } });
    expect(account()).toBeDisabled(); expect(account()).toHaveValue('a');
    expect(screen.getByTestId('current-account')).toHaveTextContent('研究账号 A');
    expect(screen.getByTestId('request-count')).toHaveTextContent('1');
    act(() => vi.advanceTimersByTime(1200));
    expect(account()).toHaveValue('a'); expect(account()).not.toBeDisabled();
    expect(within(panel()).getByRole('alert')).toHaveTextContent('切换失败');
    fireEvent.click(screen.getByRole('button', { name: '重试切换' }));
    act(() => vi.advanceTimersByTime(1200));
    expect(account()).toHaveValue('b');
    expect(screen.getByTestId('request-count')).toHaveTextContent('2');
    expect(screen.getByTestId('other-agent').textContent).toBe(other);
    expect(screen.getByTestId('usage-summary').textContent).toBe(summary);
  });
  it('blocks unavailable directories and cancels a late result on logout/reset', () => {
    demo(); vi.useFakeTimers();
    for (const state of ['loading', 'stale', 'connecting', 'unmatched']) {
      fireEvent.change(screen.getByLabelText('用量场景'), { target: { value: state } });
      expect(account()).toBeDisabled();
      fireEvent.change(account(), { target: { value: 'b' } });
      expect(screen.getByTestId('request-count')).toHaveTextContent('0');
    }
    fireEvent.change(screen.getByLabelText('用量场景'), { target: { value: 'normal' } });
    fireEvent.change(account(), { target: { value: 'b' } });
    fireEvent.change(screen.getByLabelText('用量场景'), { target: { value: 'signed-out' } });
    act(() => vi.advanceTimersByTime(1200));
    expect(within(panel()).queryByText(/研究账号|协作账号|1.28|128/)).toBeNull();
    expect(screen.queryByTestId('usage-summary')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '重置托盘示例' }));
    expect(account()).toHaveValue('a');
    fireEvent.change(account(), { target: { value: 'b' } });
    fireEvent.click(screen.getByRole('button', { name: '重置托盘示例' }));
    act(() => vi.advanceTimersByTime(1200));
    expect(account()).toHaveValue('a'); expect(screen.getByTestId('request-count')).toHaveTextContent('0');
  });
  it('keeps unknown quota distinct from zero and stale cache explicitly marked', () => {
    demo();
    fireEvent.change(screen.getByLabelText('用量场景'), { target: { value: 'unknown' } });
    expect(within(panel()).getByText('未知')).toBeVisible();
    expect(within(panel()).queryByRole('progressbar')).toBeNull();
    fireEvent.change(screen.getByLabelText('用量场景'), { target: { value: 'stale' } });
    expect(within(panel()).getByText('上次数据 · 目录已过期')).toBeVisible();
    expect(screen.getByTestId('usage-summary')).toHaveTextContent('上次更新');
  });
});
