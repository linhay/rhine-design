import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CompactAccountExample, CompactAccountGallery, CompactSubscriptionExample } from '../preview/CompactAccountGallery';

const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
afterEach(() => {
  vi.restoreAllMocks();
  if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard);
  else Reflect.deleteProperty(navigator, 'clipboard');
});
function demo(content: React.ReactNode) { return render(<div className="rhine-theme">{content}</div>); }

describe('compact account composition', () => {
  it('preserves valid zero, unknown values and distinct expiry meanings', () => {
    const view = demo(<CompactAccountExample state="zero" />);
    expect(screen.getByRole('progressbar', { name: '7D 剩余' })).toHaveAttribute('aria-valuenow', '0');
    expect(within(screen.getByTestId('compact-account-facts')).getAllByText('0')).toHaveLength(4);
    expect(within(screen.getByTestId('compact-account-facts')).getAllByText('$0.00')).toHaveLength(2);
    view.rerender(<div className="rhine-theme"><CompactAccountExample state="unknown" /></div>);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText('7D 剩余 — · 额度暂不可用')).toBeVisible();
    expect(screen.getByText('历史记录不完整，仅展示已确认的时段。')).toBeVisible();
    expect(within(screen.getByTestId('compact-account-facts')).getAllByText('—')).toHaveLength(5);
    view.rerender(<div className="rhine-theme"><CompactAccountExample state="long" /></div>);
    expect(screen.getByText('到期')).toBeVisible();
    expect(screen.getByText('订阅到期')).toBeVisible();
    expect(screen.getByText('$12,345.67 / $24,691.34')).toBeVisible();
    expect(screen.getByText('$123,456.78 / $246,913.56')).toBeVisible();
  });

  it('uses the shared timeline with inspectable evidence and compact custom legend', async () => {
    demo(<CompactAccountExample />);
    expect(screen.getByRole('list', { name: '资源用量与异常记录' })).toBeInTheDocument();
    const slider = screen.getByRole('slider', { name: '用量与异常记录 历史时段' });
    act(() => slider.focus());
    const details = await screen.findByRole('dialog', { name: '用量与异常记录 历史时段时段详情' });
    expect(within(details).getByText(/按 15 分钟聚合的合成记录/)).toBeVisible();
    const legend = screen.getByRole('list', { name: '历史状态图例' });
    for (const label of ['有输出', '已恢复', '待确认', '失败', '未知']) expect(within(legend).getByText(label)).toBeVisible();
  });

  it('exposes long, narrow and scaled review settings without changing business values', () => {
    demo(<CompactAccountGallery />);
    fireEvent.change(screen.getByLabelText('账号读数'), { target: { value: 'long' } });
    fireEvent.change(screen.getByLabelText('样机宽度'), { target: { value: '400' } });
    fireEvent.change(screen.getByLabelText('内容缩放'), { target: { value: '2' } });
    expect(screen.getByTestId('compact-stage')).toHaveStyle({ width: '400px' });
    expect(screen.getByText('$123,456.78 / $246,913.56')).toBeVisible();
    fireEvent.click(screen.getByLabelText('包含历史链接'));
    expect(screen.getByText('历史链接（1）')).toBeVisible();
  });
});

describe('compact credential actions composition', () => {
  it('shows a native download action and no redundant empty history or repeated state', () => {
    demo(<CompactSubscriptionExample />);
    const download = screen.getByRole('link', { name: '下载文件' });
    expect(download.tagName).toBe('A');
    expect(download).toHaveAttribute('download', 'rhine-demo.json');
    expect(download).toHaveClass('rhine-button');
    expect(download.getAttribute('href')).toMatch(/^data:application\/json/);
    expect(screen.queryByText(/历史链接/)).not.toBeInTheDocument();
    expect(screen.queryByText('当前链接')).not.toBeInTheDocument();
    expect(screen.queryByText('已生成')).not.toBeInTheDocument();
    expect(screen.getByText('链接可下载凭证，请勿分享。')).toBeVisible();
    expect(screen.getByText('重置或撤销后，旧链接失效。')).toBeVisible();
  });

  it('copies only the synthetic address and leaves it available after clipboard failure', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    demo(<CompactSubscriptionExample />);
    fireEvent.click(screen.getByRole('button', { name: '复制链接' }));
    await screen.findByText('已复制演示链接。');
    expect(writeText).toHaveBeenCalledWith('https://example.invalid/subscriptions/demo/1');
    writeText.mockRejectedValueOnce(new Error('clipboard unavailable'));
    fireEvent.click(screen.getByRole('button', { name: '复制链接' }));
    await screen.findByRole('alert');
    expect(screen.getByLabelText('订阅链接')).toHaveValue('https://example.invalid/subscriptions/demo/1');
    expect(screen.getByRole('button', { name: '复制链接' })).toBeEnabled();
  });

  it('keeps history collapsed, then resets, revokes and explicitly regenerates a link', async () => {
    demo(<CompactSubscriptionExample showHistory />);
    const previous = screen.getByText('https://example.invalid/subscriptions/demo/retired-1');
    expect(previous).not.toBeVisible();
    fireEvent.click(screen.getByText('历史链接（1）'));
    await waitFor(() => expect(previous).toBeVisible());
    fireEvent.click(screen.getByRole('button', { name: '重置链接' }));
    expect(screen.getByLabelText('订阅链接')).toHaveValue('https://example.invalid/subscriptions/demo/2');
    expect(screen.getByText('历史链接（2）')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '撤销链接' }));
    expect(screen.getByText('尚未生成订阅链接')).toBeVisible();
    expect(screen.queryByRole('link', { name: '下载文件' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '撤销链接' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '获取订阅链接' }));
    expect(screen.getByLabelText('订阅链接')).toHaveValue('https://example.invalid/subscriptions/demo/3');
  });

  it('blocks loading actions and does not generate from an error or no-link state', () => {
    const view = demo(<CompactSubscriptionExample initialState="loading" />);
    expect(screen.getByRole('status')).toHaveTextContent('正在读取订阅链接');
    expect(screen.getByRole('button', { name: '复制链接' })).toBeDisabled();
    expect(screen.getByText('下载文件').closest('a')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryByLabelText('订阅链接')).not.toBeInTheDocument();
    view.rerender(<div className="rhine-theme"><CompactSubscriptionExample key="error" initialState="error" /></div>);
    expect(screen.getByRole('alert')).toHaveTextContent('订阅链接读取失败');
    expect(screen.queryByLabelText('订阅链接')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '重试' }));
    expect(screen.getByLabelText('订阅链接')).toHaveValue('https://example.invalid/subscriptions/demo/1');
    view.rerender(<div className="rhine-theme"><CompactSubscriptionExample key="empty" initialState="no-link" /></div>);
    expect(screen.getByRole('button', { name: '获取订阅链接' })).toBeEnabled();
    expect(screen.queryByLabelText('订阅链接')).not.toBeInTheDocument();
    expect(screen.queryByText(/历史链接/)).not.toBeInTheDocument();
  });
});
