import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button, ChatCard, ChatThread, type ChatEntry, type ChatMessage, type ChatStatus } from '../components';
import { ChatGallery } from '../preview/ChatGallery';

const msg = (id: string, minute: number, member = 'A', day = '今天'): ChatMessage => ({ id, kind: 'message', day, dateTime: `2026-10-27T10:${minute}:00+08:00`, time: `10:${minute}`, member: { id: member, name: member }, content: <p>{id}</p> });
afterEach(() => vi.useRealTimers());
describe('Chat composition', () => {
  it('groups only adjacent same-member messages within five minutes and a day; events break groups', () => {
    const { container } = render(<ChatThread label="聊天" entries={[msg('a', 10), msg('b', 11), { id: 'e', kind: 'event', day: '今天', content: '事件' }, msg('c', 12), msg('d', 13, 'B'), msg('f', 20, 'B'), msg('g', 21, 'B', '明天')]} />);
    expect(container.querySelectorAll('[data-continuation=true]')).toHaveLength(1);
    expect(screen.getByRole('article', { name: 'A · 10:11' })).toHaveTextContent('b');
    expect(container.querySelectorAll('.rhine-chat-day')).toHaveLength(2);
  });
  it('preserves errors outside collapsed details and suppresses action slots in observation mode', () => {
    const content = <ChatCard title="请求" status="failed" summary="来源不可用，请稍后核对" actions={<Button>接受</Button>}><p>完整依据</p></ChatCard>;
    const entries: ChatEntry[] = [{ ...msg('a', 10), content, actions: <Button>重试</Button> }];
    const { rerender } = render(<ChatThread label="聊天" readOnly entries={entries} />);
    expect(screen.queryByRole('button', { name: '接受' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '重试' })).not.toBeInTheDocument();
    expect(screen.getByText('来源不可用，请稍后核对')).toBeVisible();
    fireEvent.click(screen.getByText('详情', { selector: 'summary' }));
    expect(screen.getByText('完整依据')).toBeVisible();
    rerender(<ChatThread label="聊天" entries={entries} />);
    expect(screen.getByRole('button', { name: '接受' })).toBeInTheDocument();
  });
  it('does not repeat a loading history request or remove the focused control', () => {
    const load = vi.fn();
    const { rerender } = render(<ChatThread label="聊天" entries={[]} hasEarlier onLoadEarlier={load} />);
    const button = screen.getByRole('button', { name: '加载更早消息' }); button.focus(); fireEvent.click(button);
    rerender(<ChatThread label="聊天" entries={[]} hasEarlier loadingEarlier onLoadEarlier={load} />);
    fireEvent.click(button); expect(load).toHaveBeenCalledTimes(1); expect(button).toHaveFocus();
    rerender(<ChatThread label="聊天" entries={[]} onLoadEarlier={load} historyError="合成失败" />);
    fireEvent.click(button); expect(load).toHaveBeenCalledTimes(1); expect(button).toHaveFocus();
    expect(screen.getByRole('alert')).toHaveTextContent('合成失败');
  });
  it('pauses on a disclosure and resumes only through the persistent follow control', () => {
    render(<ChatThread label="聊天" entries={[{ ...msg('a', 10), content: <ChatCard title="详情" status="unknown" summary="尚未确认"><p>证据</p></ChatCard> }]} />);
    fireEvent.click(screen.getByText('详情', { selector: 'summary' }));
    const follow = screen.getByRole('button', { name: '回到最新并跟随' });
    expect(follow).toHaveAttribute('aria-pressed', 'false'); follow.focus(); fireEvent.click(follow);
    expect(follow).toHaveAttribute('aria-pressed', 'true'); expect(follow).toHaveFocus();
  });
  it('announces new messages inserted before an existing stream without announcing prepended history', () => {
    const entries = [msg('a', 10), msg('stream', 15)];
    const { rerender } = render(<ChatThread label="聊天" entries={entries} />);
    fireEvent.keyDown(screen.getByRole('region', { name: '聊天' }), { key: 'PageUp' });
    rerender(<ChatThread label="聊天" entries={[msg('history', 9), ...entries]} />);
    expect(screen.getByRole('status')).not.toHaveTextContent('有新消息');
    rerender(<ChatThread label="聊天" entries={[msg('history', 9), entries[0], msg('new', 12), entries[1]]} />);
    expect(screen.getByRole('status')).toHaveTextContent('有新消息');
    fireEvent.click(screen.getByRole('button', { name: '回到最新并跟随' }));
    expect(screen.getByRole('status')).not.toHaveTextContent('有新消息');
  });
  it('keeps focus after a host action and treats unexpected runtime states as unknown', () => {
    const { unmount } = render(<ChatGallery />);
    const accept = screen.getByRole('button', { name: '接受请求' }); accept.focus(); fireEvent.click(accept);
    expect(accept).toHaveFocus(); expect(accept).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('已接受')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '拒绝请求' }));
    expect(screen.getByText('已接受')).toBeVisible(); unmount();
    render(<ChatCard title="外部状态" status={'constructor' as ChatStatus} summary="未知来源" />);
    expect(screen.getByText('状态未知')).toBeVisible();
  });
  it('uses a short visible detail label while retaining the object name for assistive technology', () => {
    const title = '河谷观察笔记：跨季节采样、长期维护与共享资料的整理方法';
    const { container } = render(<ChatCard title={title} status="partial" summary="部分结果已保留。"><p>完整依据</p></ChatCard>);
    expect(screen.getByText('详情')).toBeVisible();
    expect(container.querySelector('summary')).toHaveAttribute('aria-label', `${title} · 详情`);
    expect(screen.queryByText(`${title} · 详情`)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('详情', { selector: 'summary' }));
    expect(screen.getByText('完整依据')).toBeVisible();
  });
  it('lets read-only cards open object reading directly without a disclosure or write actions', async () => {
    render(<ChatGallery />);
    fireEvent.change(screen.getByRole('combobox', { name: '聊天场景' }), { target: { value: 'observer' } });
    const region = screen.getByRole('region', { name: '合成聊天消息' });
    const firstReading = within(region).getAllByRole('button', { name: /^阅读对象：河谷观察笔记/ })[0];
    expect(region.querySelectorAll('details')).toHaveLength(0);
    expect(within(region).queryByRole('button', { name: '接受请求' })).not.toBeInTheDocument();
    fireEvent.click(firstReading);
    expect(screen.getByRole('dialog', { name: /^河谷观察笔记/ })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '关闭对话框' }));
    await waitFor(() => expect(firstReading).toHaveFocus());
  });
  it('disconnects ResizeObserver on unmount', () => {
    const disconnect = vi.fn();
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect = disconnect; });
    const { unmount } = render(<ChatThread label="聊天" entries={[]} />); unmount();
    expect(disconnect).toHaveBeenCalledOnce(); vi.unstubAllGlobals();
  });
  it('cancels synthetic streaming without late text or success and clears timers on unmount', () => {
    vi.useFakeTimers();
    const { unmount } = render(<ChatGallery />);
    fireEvent.click(screen.getByRole('button', { name: '播放合成流式记录' }));
    act(() => vi.advanceTimersByTime(440));
    fireEvent.click(screen.getByRole('button', { name: '取消演示生成' }));
    const before = screen.getByRole('region', { name: '合成聊天消息' }).textContent;
    act(() => vi.advanceTimersByTime(6000));
    expect(screen.getByRole('region', { name: '合成聊天消息' }).textContent).toBe(before);
    expect(screen.getByText('生成已取消；保留部分内容，未确认成功。')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '加载更早消息' }));
    unmount(); expect(vi.getTimerCount()).toBe(0);
  });
});

describe('opt-in chat layout and appearance', () => {
  it('keeps standalone defaults and maps bubble presentation by stable member id only', () => {
    const entries=[msg('a',10,'agent-a'),msg('b',11,'human-b'),{id:'event',kind:'event' as const,day:'今天',content:'事件'}];
    const {container,rerender}=render(<ChatThread label="成员记录" entries={entries}/>);
    const root=container.querySelector('.rhine-chat')!;
    expect(root).toHaveAttribute('data-layout','standalone');expect(root).toHaveAttribute('data-appearance','plain');expect(root).toHaveAttribute('data-controls','full');
    const mapping={ 'agent-a':{align:'end' as const,tone:'strong' as const} };
    rerender(<ChatThread label="成员记录" entries={entries} layout="fill" appearance="bubble" controls="compact" memberAppearance={mapping} className="host-chat" style={{flex:1}} readOnly/>);
    expect(root).toHaveClass('host-chat');expect(root).toHaveAttribute('data-layout','fill');
    expect(screen.getByRole('article',{name:'agent-a · 10:10'})).toHaveAttribute('data-align','end');
    expect(screen.getByRole('article',{name:'human-b · 10:11'})).toHaveAttribute('data-align','start');
    expect(container.querySelector('.rhine-chat-event')?.closest('article')).toBeNull();
    expect(screen.getByText('只读观察')).toBeVisible();
    rerender(<ChatThread label="成员记录" entries={entries} appearance="plain" memberAppearance={mapping}/>);
    expect(screen.getByRole('article',{name:'agent-a · 10:10'})).toHaveAttribute('data-align','start');
  });
  it('preserves compact history errors, new-message state and read-only action suppression', () => {
    const content=<ChatCard title="未知记录" status="unknown" summary="运行结束，结果未确认" actions={<Button>接受</Button>}/>;
    const entries=[{...msg('a',10),content}];
    const props={label:'记录',layout:'fill' as const,appearance:'bubble' as const,controls:'compact' as const,readOnly:true,historyError:'加载失败，保留历史'};
    const {rerender}=render(<ChatThread {...props} entries={entries}/>);
    fireEvent.keyDown(screen.getByRole('region',{name:'记录'}),{key:'PageUp'});
    rerender(<ChatThread {...props} entries={[...entries,msg('b',12)]}/>);
    expect(screen.getByRole('alert')).toHaveTextContent('加载失败');expect(screen.getByRole('status')).toHaveTextContent('有新消息 · 已暂停跟随');
    expect(screen.queryByRole('button',{name:'接受'})).not.toBeInTheDocument();expect(screen.getByText('状态未知')).toBeVisible();
    fireEvent.click(screen.getByRole('button',{name:'回到最新并跟随'}));expect(screen.getByRole('status')).toHaveTextContent('跟随中');
  });
});
