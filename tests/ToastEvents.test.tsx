import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Toast } from '../components';
import { ToastEventGallery } from '../preview/ToastEventGallery';

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));
describe('Toast event identity', () => {
  it('gives an identical new event a full lifetime near expiry, without callback/render renewal', () => {
    vi.useFakeTimers(); const close = vi.fn();
    const view = (eventId: number) => <Toast eventId={eventId} open title="完成" onOpenChange={value => close(value)} duration={1000} />;
    const { rerender } = render(view(1)); advance(999); rerender(view(2)); advance(2); expect(close).not.toHaveBeenCalled();
    rerender(view(3)); advance(800); rerender(view(3)); advance(199); expect(close).not.toHaveBeenCalled();
    advance(1); expect(close).toHaveBeenCalledExactlyOnceWith(false);
  });
  it.each(['hover', 'focus', 'hidden'] as const)('resets a new event while %s-paused and preserves remaining time for the same event', pause => {
    vi.useFakeTimers(); const close = vi.fn(); let hidden = false;
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
    const view = (eventId: number) => <Toast eventId={eventId} open title="完成" onOpenChange={close} duration={1000} />;
    const { rerender } = render(view(1)); const region = screen.getByRole('status'), button = screen.getByRole('button');
    const toggle = (value: boolean) => act(() => {
      if (pause === 'hover') (value ? fireEvent.mouseEnter : fireEvent.mouseLeave)(region);
      if (pause === 'focus') value ? button.focus() : button.blur();
      if (pause === 'hidden') { hidden = value; document.dispatchEvent(new Event('visibilitychange')); }
    });
    advance(700); toggle(true); advance(2000); rerender(view(1)); toggle(false); advance(299); expect(close).not.toHaveBeenCalled();
    toggle(true); rerender(view(2)); advance(2000); expect(close).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBe(button); expect(screen.getByRole('status')).toBe(region);
    if (pause === 'focus') expect(button).toHaveFocus();
    toggle(false); advance(999); expect(close).not.toHaveBeenCalled(); advance(1); expect(close).toHaveBeenCalledExactlyOnceWith(false);
  });
  it('updates only live-region text for a new identity and leaves a focused close button mounted', () => {
    const close = vi.fn(); const view = (eventId: string) => <Toast eventId={eventId} open title="完成" onOpenChange={close} />;
    const { rerender } = render(view('a')); const button = screen.getByRole('button'), text = screen.getByText('完成');
    act(() => button.focus()); rerender(view('a')); expect(screen.getByText('完成')).toBe(text);
    rerender(view('b')); expect(screen.getByText('完成')).not.toBe(text); expect(screen.getByRole('button')).toBe(button); expect(button).toHaveFocus();
    fireEvent.click(button); expect(close).toHaveBeenCalledWith(false);
  });
  it.each(['error', 'warning'] as const)('keeps %s events persistent and clears timers on exit', tone => {
    vi.useFakeTimers(); const close = vi.fn();
    const { rerender, unmount } = render(<Toast open eventId={1} title="完成" onOpenChange={close} duration={1000} />);
    advance(999); rerender(<Toast open eventId={2} title="检查" tone={tone} onOpenChange={close} duration={1000} />);
    advance(10000); expect(close).not.toHaveBeenCalled(); unmount(); expect(vi.getTimerCount()).toBe(0);
  });
  it('waits for every pause reason, not just the most recently cleared one', () => {
    vi.useFakeTimers(); const close = vi.fn(); render(<Toast open title="完成" onOpenChange={close} duration={1000} />);
    const region = screen.getByRole('status'), button = screen.getByRole('button');
    fireEvent.mouseEnter(region); act(() => button.focus()); fireEvent.mouseLeave(region); advance(2000); expect(close).not.toHaveBeenCalled();
    act(() => button.blur()); advance(1000); expect(close).toHaveBeenCalledExactlyOnceWith(false);
  });
  it('cleans up the real gallery delayed event when leaving', () => {
    vi.useFakeTimers(); const { unmount } = render(<ToastEventGallery />);
    fireEvent.click(screen.getByRole('button', { name: '1.5 秒后再次成功' })); expect(screen.getByRole('button', { name: '1.5 秒后再次成功' })).toBeDisabled();
    unmount(); expect(vi.getTimerCount()).toBe(0);
  });
});
