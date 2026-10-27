import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReviewShell, reviewWaitMs } from '../review/shell';
import { appendFeedback, emptyFeedback } from '../review/feedback';
import { protocol } from '../review/protocol';

const catalog = { title: '故障恢复', scenes: [{ id: 'a', title: '场景 A' }, { id: 'b', title: '场景 B' }] };
function iframe() { return screen.getByTitle('产品场景画布') as HTMLIFrameElement; }
function send(data: Record<string, unknown>, source = iframe().contentWindow!) {
  fireEvent(window, new MessageEvent('message', { origin: location.origin, source, data: { protocol, ...data } }));
}
function connect() {
  const post = vi.spyOn(iframe().contentWindow!, 'postMessage');
  send({ type: 'ready', catalog });
  return { post, request: () => post.mock.calls.filter(call => call[0].type === 'select').at(-1)![0].requestId as number };
}
beforeEach(() => { vi.useFakeTimers(); history.replaceState(null, '', '#scene=a'); });
afterEach(() => { cleanup(); vi.useRealTimers(); });
describe('review shell recovery', () => {
  it('offers recovery when the initial iframe never handshakes', () => {
    render(<ReviewShell />); const oldFrame = iframe();
    act(() => vi.advanceTimersByTime(reviewWaitMs));
    expect(screen.getByRole('alert')).toHaveTextContent('连接画布超时');
    fireEvent.click(screen.getByRole('button', { name: '重新载入画布' }));
    expect(iframe()).not.toBe(oldFrame);
    const { request } = connect(); send({ type: 'rendered', requestId: request() });
    expect(screen.getByRole('status')).toHaveTextContent('已就绪');
    expect(screen.getByRole('alert')).toHaveTextContent('连接画布超时');
  });
  it('replaces a stuck browsing context, keeps selection, ignores old acknowledgements', () => {
    render(<ReviewShell />); const { request } = connect();
    send({ type: 'rendered', requestId: request() });
    fireEvent.click(screen.getByRole('link', { name: '场景 B' }));
    const pending = request();
    send({ type: 'rendered', requestId: pending - 1 });
    act(() => vi.advanceTimersByTime(reviewWaitMs));
    expect(screen.getByRole('alert')).toHaveTextContent('初始化或清理超过');
    const oldFrame = iframe(), oldWindow = oldFrame.contentWindow!;
    fireEvent.click(screen.getByRole('button', { name: '重新载入画布' }));
    expect(oldFrame.isConnected).toBe(false); expect(location.hash).toContain('scene=b');
    send({ type: 'feedback', kind: 'error', message: 'stale error' }, oldWindow);
    expect(screen.queryByText(/stale error/)).not.toBeInTheDocument();
    const next = connect(); send({ type: 'rendered', requestId: next.request() });
    expect(screen.getByRole('status')).toHaveTextContent('已就绪');
  });
  it('retains scoped errors across ready and selection until explicit acknowledgement', () => {
    render(<ReviewShell />); const { request } = connect();
    send({ type: 'feedback', scene: 'a', kind: 'error', message: '清理失败 A' });
    send({ type: 'rendered', requestId: request() });
    fireEvent.click(screen.getByRole('link', { name: '场景 B' }));
    send({ type: 'rendered', requestId: request() });
    expect(screen.getByRole('alert')).toHaveTextContent('清理失败 A');
    fireEvent.click(screen.getByText(/评审反馈 ·/));
    expect(screen.getByText('场景 A', { selector: 'strong' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '确认并清除反馈' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('does not silently lose unacknowledged errors when bounded history overflows', () => {
    let log = emptyFeedback();
    for (let id = 0; id < 30; id++) log = appendFeedback(log, { id, kind: id < 4 ? 'error' : 'info', message: String(id), scene: 'a' });
    expect(log.entries).toHaveLength(20); expect(log.errors).toBe(4); expect(log.omittedErrors).toBe(4);
  });
});
