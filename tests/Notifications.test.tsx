import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NotificationGallery, NotificationWorkspace } from '../preview/NotificationGallery';
import { accessFor, syntheticTransport, type Access, type Operation, type Transport } from '../preview/notificationRecipe';

afterEach(() => { cleanup(); vi.useRealTimers(); });
const success: Transport = async () => {};
const open = (label = '编辑成员甲 · 变更提醒') => { fireEvent.click(screen.getByRole('button', { name: label })); return screen.getByRole('dialog'); };
const button = (name: string) => within(screen.getByRole('dialog')).getByRole('button', { name });
const close = () => fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '关闭对话框' }));
const flush = () => act(async () => {});
function pendingTransport() {
  const requests: { operation: Operation; signal: AbortSignal; resolve: () => void; reject: (reason: Error) => void }[] = [];
  const transport = vi.fn<Transport>((operation, signal) => operation === 'catalog' ? Promise.resolve() : new Promise((resolve, reject) => requests.push({ operation, signal, resolve, reject })));
  return { transport, requests };
}
const renderMember = (transport: Transport = success, access = accessFor('alpha')) => render(<NotificationWorkspace member="alpha" access={access} transport={transport} />);

describe('personal notification host recipe', () => {
  it('separates saved drafts, previews and confirmed enable intent', async () => {
    const { transport, requests } = pendingTransport(); renderMember(transport); open(); await flush();
    fireEvent.change(screen.getByLabelText('条件说明'), { target: { value: '仅重要变更' } });
    fireEvent.click(button('启用订阅'));
    expect(screen.getByRole('alert')).toHaveTextContent('请先保存当前草稿'); expect(requests).toHaveLength(0);
    fireEvent.click(button('查看示例')); expect(requests[0].operation).toBe('preview');
    await act(async () => requests[0].resolve());
    expect(screen.getByText('示例 · 未发送')).toBeInTheDocument();
    expect(document.querySelector('[data-notification-rule="1"]')).toHaveAttribute('data-enabled', 'false');
    fireEvent.click(button('保存停用草稿'));
    expect(screen.getByLabelText('条件说明')).toHaveAttribute('readonly');
    expect(screen.getByRole('combobox', { name: '事件对象' })).toHaveAttribute('readonly');
    await act(async () => requests[1].resolve());
    expect(screen.getByText('已保存停用草稿；尚未启用。')).toBeInTheDocument();
    const enable = button('启用订阅'); fireEvent.click(enable); fireEvent.click(enable);
    expect(requests.filter(item => item.operation === 'enable')).toHaveLength(1);
    await act(async () => requests[2].resolve());
    expect(document.querySelector('[data-notification-rule="1"]')).toHaveAttribute('data-enabled', 'true');
    expect(screen.getByText('已确认启用意图；不代表已投递或已读。')).toBeInTheDocument();
  });

  it('allows a no-channel draft but gives a field reason before enabling', async () => {
    renderMember(success, { ...accessFor('alpha'), channels: [] }); open(); await flush();
    fireEvent.click(button('保存停用草稿')); await flush();
    expect(screen.getByText('已保存停用草稿；尚未启用。')).toBeInTheDocument();
    fireEvent.click(button('启用订阅'));
    expect(screen.getByRole('combobox', { name: '接收渠道' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('没有可用接收渠道，无法启用；可保存停用草稿。')).toBeInTheDocument();
  });

  it('handles no visible candidates without inventing selection', async () => {
    renderMember(success, { objects: [], channels: ['personal'], revision: 1 }); open(); await flush();
    fireEvent.click(button('启用订阅'));
    expect(screen.getByText('启用需要至少一个当前可查看的对象。')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: '事件对象已选项' })).toBeEmptyDOMElement();
    expect(screen.queryByText('资源 A')).not.toBeInTheDocument();
  });

  it('shows audience separately and keeps a group preview generic', async () => {
    renderMember(); open(); await flush();
    fireEvent.change(screen.getByLabelText('接收渠道'), { target: { value: 'group' } });
    expect(screen.getByText('实际受众：群内所有成员可能看到；点名不是私信')).toBeInTheDocument();
    fireEvent.click(button('查看示例')); await flush();
    const preview = document.querySelector('[data-notification-preview]')!;
    expect(preview).toHaveTextContent('示例 · 未发送'); expect(preview).toHaveTextContent('登录后查看详情');
    expect(preview).not.toHaveTextContent('资源 A');
  });

  it('scrubs revoked values from tags, query, preview and saved summary while preserving other drafts', async () => {
    const access = accessFor('alpha'), view = renderMember(success, access);
    open('编辑成员甲 · 完成提醒'); await flush();
    fireEvent.change(screen.getByLabelText('事件'), { target: { value: 'changed' } });
    fireEvent.change(screen.getByLabelText('条件说明'), { target: { value: '另一草稿保留' } }); close(); await flush();
    open(); await flush(); fireEvent.change(screen.getByLabelText('条件说明'), { target: { value: '当前草稿保留' } });
    fireEvent.click(button('查看示例')); await flush();
    fireEvent.change(screen.getByRole('combobox', { name: '事件对象' }), { target: { value: '资源 A' } });
    view.rerender(<NotificationWorkspace member="alpha" access={{ ...access, objects: ['B', 'D'], revision: 2 }} transport={success} />);
    await flush();
    expect(document.body.textContent).not.toContain('资源 A');
    expect(document.body.textContent).not.toContain('合成研究资料 A');
    expect(screen.getByRole('combobox', { name: '事件对象' })).toHaveValue('');
    expect(document.querySelector('[data-notification-preview]')).toBeNull();
    expect(screen.getByRole('list', { name: '事件对象已选项' })).toHaveTextContent('资源 B');
    expect(screen.getByLabelText('条件说明')).toHaveValue('当前草稿保留');
    close(); await flush(); open('编辑成员甲 · 完成提醒'); await flush();
    expect(screen.getByLabelText('条件说明')).toHaveValue('另一草稿保留');
  });

  it.each(['objects', 'channels'] as const)('pauses on loss of all %s and does not restore selections or enable on recovery', async key => {
    let access: Access = accessFor('alpha'); const view = renderMember(success, access); open(); await flush();
    fireEvent.click(button('启用订阅')); await flush();
    expect(document.querySelector('[data-notification-rule="1"]')).toHaveAttribute('data-enabled', 'true');
    access = { ...access, [key]: [], revision: 2 };
    view.rerender(<NotificationWorkspace member="alpha" access={access} transport={success} />); await flush();
    expect(document.querySelector('[data-notification-rule="1"]')).toHaveAttribute('data-enabled', 'false');
    view.rerender(<NotificationWorkspace member="alpha" access={{ ...accessFor('alpha'), revision: 3 }} transport={success} />); await flush();
    expect(document.querySelector('[data-notification-rule="1"]')).toHaveAttribute('data-enabled', 'false');
    if (key === 'objects') expect(screen.getByRole('list', { name: '事件对象已选项' })).toBeEmptyDOMElement();
    else expect(screen.getByLabelText('接收渠道')).toHaveValue('');
    expect(screen.getByText('需要重新确认')).toBeInTheDocument();
  });

  it('keeps input on save conflicts and requires a new explicit save', async () => {
    const { transport, requests } = pendingTransport(); renderMember(transport); open(); await flush();
    fireEvent.change(screen.getByLabelText('条件说明'), { target: { value: '保留我的草稿' } }); fireEvent.click(button('保存停用草稿'));
    await act(async () => requests[0].reject(new Error('保存冲突：版本已变化')));
    expect(screen.getByRole('alert')).toHaveTextContent('保存冲突'); expect(screen.getByLabelText('条件说明')).toHaveValue('保留我的草稿');
    fireEvent.click(button('启用订阅')); expect(requests).toHaveLength(1);
    fireEvent.click(button('保存停用草稿')); await act(async () => requests[1].resolve());
    expect(screen.getByText('已保存停用草稿；尚未启用。')).toBeInTheDocument();
  });

  it('cancels pending writes and rejects an older result after the next edit', async () => {
    const { transport, requests } = pendingTransport(); renderMember(transport); open(); await flush();
    fireEvent.click(button('保存停用草稿')); fireEvent.click(button('取消等待'));
    expect(requests[0].signal.aborted).toBe(true); expect(button('保存停用草稿')).toHaveFocus();
    fireEvent.change(screen.getByLabelText('条件说明'), { target: { value: '新一轮草稿' } });
    await act(async () => requests[0].resolve());
    expect(screen.getByLabelText('条件说明')).toHaveValue('新一轮草稿'); expect(screen.queryByText('已保存停用草稿；尚未启用。')).not.toBeInTheDocument();
    fireEvent.click(button('启用订阅')); expect(screen.getByRole('alert')).toHaveTextContent('请先保存');
  });

  it('aborts on permission change and prevents a late enable response from reactivating the rule', async () => {
    const { transport, requests } = pendingTransport(), access = accessFor('alpha'); const view = renderMember(transport, access); open(); await flush(); fireEvent.click(button('启用订阅'));
    view.rerender(<NotificationWorkspace member="alpha" access={{ ...access, objects: [], revision: 2 }} transport={transport} />); await flush();
    expect(requests[0].signal.aborted).toBe(true); await act(async () => requests[0].resolve());
    expect(document.querySelector('[data-notification-rule="1"]')).toHaveAttribute('data-enabled', 'false');
    expect(document.body.textContent).not.toContain('资源 A');
  });

  it('isolates two members and admin and clears the open editor on identity switch', async () => {
    render(<NotificationGallery />); open();
    fireEvent.click(within(screen.getByRole('dialog')).getByText('合成情境控制'));
    fireEvent.change(within(screen.getByRole('dialog')).getByLabelText('切换合成身份'), { target: { value: 'beta' } }); await flush();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain('资源 A'); expect(document.body.textContent).not.toContain('成员甲 ·');
    open('编辑成员乙 · 变更提醒'); await flush();
    expect(screen.getByRole('list', { name: '事件对象已选项' })).toHaveTextContent('资源 C'); close(); await flush();
    fireEvent.change(screen.getByLabelText('当前身份'), { target: { value: 'admin' } }); await flush();
    expect(screen.getByText('管理员全局规则')).toBeInTheDocument(); expect(screen.queryByRole('tab', { name: '我的订阅' })).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain('资源 C');
  });

  it('retains unknown delivery on read failure/cancellation and never retries a delivery', async () => {
    const { transport, requests } = pendingTransport(); renderMember(transport);
    fireEvent.click(screen.getByRole('tab', { name: '通知记录' }));
    fireEvent.click(screen.getByRole('button', { name: '读取投递状态' }));
    await act(async () => requests[0].reject(new Error('失败')));
    expect(screen.getByText('投递结果未知')).toBeInTheDocument(); expect(screen.getByRole('alert')).toHaveTextContent('仍未知');
    fireEvent.click(screen.getByRole('button', { name: '读取投递状态' })); fireEvent.click(screen.getByRole('button', { name: '取消读取' }));
    await act(async () => requests[1].resolve()); expect(screen.getByText('投递结果未知')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '读取投递状态' })); await act(async () => requests[2].resolve());
    expect(screen.getByText('渠道已受理，未确认已读')).toBeInTheDocument();
    expect(requests.map(item => item.operation)).toEqual(['delivery-read', 'delivery-read', 'delivery-read']);
  });

  it('cancels closed editors and unmounted workspaces, ignoring transport that does not honor abort', async () => {
    const { transport, requests } = pendingTransport(); const view = renderMember(transport); open(); await flush();
    fireEvent.click(button('查看示例')); close(); await flush(); expect(requests[0].signal.aborted).toBe(true);
    open(); await flush(); await act(async () => requests[0].resolve()); expect(document.querySelector('[data-notification-preview]')).toBeNull();
    fireEvent.click(button('保存停用草稿')); view.unmount(); expect(requests[1].signal.aborted).toBe(true);
    await act(async () => requests[1].resolve()); expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps accepted history distinct from current uncertainty after a later read fails or is cancelled', async () => {
    const { transport, requests } = pendingTransport(); renderMember(transport);
    fireEvent.click(screen.getByRole('tab', { name: '通知记录' }));
    fireEvent.click(screen.getByRole('button', { name: '读取投递状态' })); await act(async () => requests[0].resolve());
    expect(screen.getByText('渠道已受理，未确认已读')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '读取投递状态' })); await act(async () => requests[1].reject(new Error('失败')));
    expect(screen.getByText('投递结果未知')).toBeInTheDocument(); expect(screen.getByText(/^上次确认：渠道已受理/)).toBeInTheDocument();
    expect(screen.queryByText('渠道已受理，未确认已读')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '读取投递状态' })); fireEvent.click(screen.getByRole('button', { name: '取消读取' }));
    await act(async () => requests[2].resolve()); expect(screen.getByText('投递结果未知')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('仍未知');
  });

  it('rejects stale remote search results and retains selected labels across pages', async () => {
    const searches: { signal: AbortSignal; resolve: () => void }[] = [];
    const transport: Transport = (operation, signal) => operation === 'catalog' ? new Promise(resolve => searches.push({ signal, resolve })) : Promise.resolve();
    renderMember(transport); open();
    fireEvent.change(screen.getByRole('combobox', { name: '事件对象' }), { target: { value: 'D' } });
    expect(searches[0].signal.aborted).toBe(true);
    await act(async () => searches[1].resolve());
    expect(screen.getByRole('option', { name: '资源 D' })).toBeInTheDocument();
    await act(async () => searches[0].resolve()); expect(screen.queryByRole('option', { name: '资源 A' })).not.toBeInTheDocument();
    expect(screen.getByRole('list', { name: '事件对象已选项' })).toHaveTextContent('资源 A');
    fireEvent.change(screen.getByRole('combobox', { name: '事件对象' }), { target: { value: '' } }); await act(async () => searches[2].resolve());
    fireEvent.click(screen.getByRole('button', { name: '加载更多' })); await act(async () => searches[3].resolve());
    expect(screen.getByRole('option', { name: '资源 D' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: '事件对象已选项' })).toHaveTextContent('资源 B');
  });

  it('clears synthetic timers on cancellation without starting a poll', async () => {
    vi.useFakeTimers(); const controller = new AbortController(); const response = syntheticTransport()('save', controller.signal).catch(error => error);
    expect(vi.getTimerCount()).toBe(1); controller.abort(); expect(vi.getTimerCount()).toBe(0);
    expect((await response).name).toBe('AbortError'); vi.advanceTimersByTime(120000); expect(vi.getTimerCount()).toBe(0);
  });
});
