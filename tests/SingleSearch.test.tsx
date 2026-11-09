import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TextField } from '../components';
import { SingleSearchGallery } from '../preview/SingleSearchGallery';

afterEach(() => vi.useRealTimers());
describe('single search contract', () => {
  it('hides only the label visually, retains native props and rejects an empty name', () => {
    const { rerender } = render(<TextField label="搜索" labelVisibility="hidden" aria-label=" " type="search" name="q" required />);
    const input = screen.getByRole('searchbox', { name: '搜索' });
    expect(input).toBeRequired(); expect(input).toHaveAttribute('name', 'q');
    expect(screen.getByText('搜索')).toHaveClass('rhine-sr-only');
    expect(input).not.toHaveAttribute('labelVisibility');
    rerender(<TextField label="搜索" hint="提示" error="失败" disabled />);
    expect(screen.getByLabelText('搜索')).toHaveAccessibleDescription('提示 失败');
    expect(screen.getByText('搜索')).not.toHaveClass('rhine-sr-only');
    expect(() => render(<TextField label=" " labelVisibility="hidden" />)).toThrow('non-empty label');
  });
  it('debounces committed composition and clears without moving focus or accepting stale results', () => {
    vi.useFakeTimers(); render(<SingleSearchGallery />);
    const input = screen.getByRole('searchbox'); input.focus();
    fireEvent.compositionStart(input); fireEvent.change(input, { target: { value: '中文' } });
    act(() => vi.advanceTimersByTime(1000)); expect(screen.getByRole('status')).toBeEmptyDOMElement();
    fireEvent.keyDown(input, { key: 'Escape', isComposing: true }); expect(input).toHaveValue('中文');
    fireEvent.compositionEnd(input); act(() => vi.advanceTimersByTime(250)); expect(screen.getByRole('status')).toHaveTextContent('正在搜索');
    fireEvent.keyDown(input, { key: 'Escape' }); act(() => vi.advanceTimersByTime(1000));
    expect(input).toHaveValue(''); expect(input).toHaveFocus(); expect(screen.getByRole('status')).toBeEmptyDOMElement();
    fireEvent.change(input, { target: { value: '旧查询' } }); act(() => vi.advanceTimersByTime(250));
    fireEvent.change(input, { target: { value: '新查询' } }); act(() => vi.advanceTimersByTime(750));
    expect(screen.getByRole('status')).toHaveTextContent('新查询'); expect(screen.getByRole('status')).not.toHaveTextContent('旧查询');
  });
  it('announces errors and cancels pending work on disabling or unmount', () => {
    vi.useFakeTimers(); const { unmount } = render(<SingleSearchGallery />);
    fireEvent.change(screen.getByLabelText('搜索场景'), { target: { value: 'error' } });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '合成' } }); act(() => vi.advanceTimersByTime(750));
    expect(screen.getByRole('searchbox')).toHaveAccessibleDescription('搜索失败，请修改查询后重试。');
    expect(screen.getByRole('searchbox')).toHaveAttribute('aria-invalid', 'true');
    fireEvent.change(screen.getByLabelText('搜索场景'), { target: { value: 'disabled' } });
    expect(screen.getByRole('searchbox')).toBeDisabled(); expect(screen.getByRole('status')).toBeEmptyDOMElement();
    unmount(); expect(vi.getTimerCount()).toBe(0);
  });
});
