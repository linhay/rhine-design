import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MotionGallery } from '../preview/MotionGallery';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
function clock() {
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => setTimeout(()=>callback(0),16));
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
}
it('replay cancels the old simulated completion and keeps the control focused', () => {
  clock(); render(<MotionGallery reduced={false}/>);
  const card=within(screen.getByRole('article',{name:'操作 → 结果'}));
  fireEvent.click(card.getByRole('button',{name:'播放操作 → 结果'}));
  act(()=>vi.advanceTimersByTime(400));
  const replay=card.getByRole('button',{name:'重播操作 → 结果'}); replay.focus(); fireEvent.click(replay);
  act(()=>vi.advanceTimersByTime(400));
  expect(card.queryByText('已完成 · 演示')).not.toBeInTheDocument();
  expect(replay).toHaveFocus();
  act(()=>vi.advanceTimersByTime(400));
  expect(card.getByRole('status')).toHaveTextContent('已完成 · 演示');
});
it('reset and unmount cancel pending demo timers without producing a result', () => {
  clock(); const {unmount}=render(<MotionGallery reduced={false}/>);
  const card=within(screen.getByRole('article',{name:'加载 → 内容'}));
  fireEvent.click(card.getByRole('button',{name:'播放加载 → 内容'})); act(()=>vi.advanceTimersByTime(100));
  fireEvent.click(card.getByRole('button',{name:'复位加载 → 内容'})); act(()=>vi.advanceTimersByTime(1000));
  expect(card.queryByText('研究工作区')).not.toBeInTheDocument();
  expect(card.getByRole('button',{name:'重播加载 → 内容'})).toBeDisabled();
  fireEvent.click(card.getByRole('button',{name:'播放加载 → 内容'})); act(()=>vi.advanceTimersByTime(100)); unmount();
  expect(vi.getTimerCount()).toBe(0);
});
