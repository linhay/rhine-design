import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { StartupGallery } from '../preview/StartupGallery';

afterEach(() => vi.useRealTimers());

it('replay cancels stale readiness and preserves control focus; reset clears the timer', () => {
  vi.useFakeTimers();
  const { unmount } = render(<StartupGallery reduced={false} />);
  fireEvent.click(screen.getByRole('button', { name: '播放启动动画' }));
  act(() => vi.advanceTimersByTime(1000));
  const replay = screen.getByRole('button', { name: '重播启动动画' });
  replay.focus(); fireEvent.click(replay);
  act(() => vi.advanceTimersByTime(700));
  expect(screen.queryByText('连接你的工作空间')).not.toBeInTheDocument();
  expect(replay).toHaveFocus();
  fireEvent.click(screen.getByRole('button', { name: '复位启动动画' }));
  act(() => vi.advanceTimersByTime(2000));
  expect(screen.queryByText('连接你的工作空间')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '播放启动动画' }));
  unmount(); expect(vi.getTimerCount()).toBe(0);
});

it('reduced motion skips synthetic normal delay but does not turn waiting or failure into success', () => {
  vi.useFakeTimers();
  const { rerender } = render(<StartupGallery reduced={false} />);
  fireEvent.click(screen.getByRole('button', { name: '播放启动动画' }));
  rerender(<StartupGallery reduced />);
  expect(screen.getByText('连接你的工作空间')).toBeInTheDocument();
  expect(vi.getTimerCount()).toBe(0);
  fireEvent.change(screen.getByLabelText('启动场景'), { target: { value: 'waiting' } });
  fireEvent.click(screen.getByRole('button', { name: '播放启动动画' }));
  act(() => vi.advanceTimersByTime(10000));
  expect(screen.queryByText('连接你的工作空间')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '模拟就绪 · 立即进入' }));
  expect(screen.getByText('连接你的工作空间')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('启动场景'), { target: { value: 'error' } });
  fireEvent.click(screen.getByRole('button', { name: '播放启动动画' }));
  expect(screen.getByRole('alert')).toHaveTextContent('暂时无法恢复会话');
  expect(screen.queryByText('连接你的工作空间')).not.toBeInTheDocument();
});

it('keeps the same brand node when readiness arrives and makes the login preview usable immediately', () => {
  vi.useFakeTimers();
  const { container } = render(<StartupGallery reduced={false} />);
  fireEvent.click(screen.getByRole('button', { name: '播放启动动画' }));
  const logo = container.querySelector('.ds-startup-logo-anchor .rhine-logo');
  act(() => vi.advanceTimersByTime(300));
  fireEvent.click(screen.getByRole('button', { name: '模拟就绪 · 立即进入' }));
  expect(container.querySelector('.ds-startup-logo-anchor .rhine-logo')).toBe(logo);
  expect(container.querySelectorAll('.ds-startup-stage .rhine-logo')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: '在浏览器中登录' }));
  expect(screen.getByText('仅演示登录入口，不会打开授权页面。')).toBeInTheDocument();
  expect(vi.getTimerCount()).toBe(0);
});
