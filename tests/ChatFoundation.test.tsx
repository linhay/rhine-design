import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AgentInspector, AgentList, AgentRow, ChatHeader, ChatShell, Composer, MessageBubble, MessageList, WorkspaceRail, MessageMeta, MessageContent, MessageActions, chatSessionReducer, initialChatSessionState } from '../components';

function StatefulAgentMessage({ id, author, children }: import('../components').MessageListItem) {
  const [expanded, setExpanded] = useState(false);
  return <article aria-label={id}><MessageMeta author={author} /><MessageContent>{children}</MessageContent><MessageActions><button onClick={() => setExpanded(value => !value)}>{expanded ? '收起详情' : '展开详情'}</button></MessageActions>{expanded && <p>保留局部状态</p>}</article>;
}
const statefulRenderers = { agent: StatefulAgentMessage };

describe('Chat Foundation primitives', () => {
  it('renders Agent status as text and exposes selected state', () => {
    const onSelect = vi.fn();
    render(<AgentRow identity={<strong>Research</strong>} preview="资料已准备好" status="ready" selected onSelect={onSelect} />);
    const row = screen.getByRole('button', { name: 'Research资料已准备好准备就绪' });
    expect(row).toHaveAttribute('aria-current', 'page');
    fireEvent.click(row);
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('keeps message actions available to the host and renders quotes', () => {
    render(<MessageBubble author="Research" time="09:51" avatar={<span>R</span>} quote="来源仍未知" actions={<button type="button">复制</button>}>正文</MessageBubble>);
    expect(screen.getByText('正文').closest('article')).toHaveTextContent('Research');
    expect(screen.getByText('来源仍未知')).toBeVisible();
    expect(screen.getByRole('button', { name: '复制' })).toBeVisible();
  });

  it('submits on Enter, preserves Shift+Enter, and blocks empty drafts', () => {
    const onSubmit = vi.fn();
    render(<Composer value="hello" onChange={vi.fn()} onSubmit={onSubmit} />);
    const textarea = screen.getByRole('textbox', { name: '消息' });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: false });
    expect(onSubmit).toHaveBeenCalledOnce();
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: true });
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('does not submit while busy and exposes an error as an alert', () => {
    const onSubmit = vi.fn();
    render(<Composer value="draft" onChange={vi.fn()} onSubmit={onSubmit} busy error="提交失败，草稿仍在输入框中。" />);
    expect(screen.getByRole('alert')).toHaveTextContent('提交失败');
    fireEvent.submit(screen.getByRole('button', { name: '发送消息' }).closest('form')!);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps the shell as slots and exposes host controlled Agent filtering', () => {
    const onQueryChange = vi.fn();
    const onSelect = vi.fn();
    render(<AgentList agents={[{ id: 'a', searchText: 'Research', identity: 'Research', status: 'ready' }]} selectedId="a" query="Research" onQueryChange={onQueryChange} onSelect={onSelect} />);
    const row = screen.getByRole('button', { name: 'Research准备就绪' });
    expect(row).toHaveAttribute('aria-current', 'page');
    fireEvent.click(row);
    expect(onSelect).toHaveBeenCalledWith('a');
    fireEvent.change(screen.getByRole('textbox', { name: '搜索 Agent' }), { target: { value: 'Writer' } });
    expect(onQueryChange).toHaveBeenCalledWith('Writer');
    const close = vi.fn();
    render(<ChatShell rail={<WorkspaceRail items={[{ id: 'chat', label: '聊天', icon: '⌁' }]} activeId="chat" />} sidebar={<AgentList agents={[]} query="" onQueryChange={vi.fn()} />} content={<ChatHeader identity="Research" />} inspector={<AgentInspector identity="Research" onClose={close} />} />);
    expect(screen.getByRole('navigation', { name: '工作区导航' })).toBeVisible();
    expect(screen.getByRole('banner')).toHaveTextContent('Research');
    fireEvent.click(screen.getByRole('button', { name: '关闭详情' }));
    expect(close).toHaveBeenCalledOnce();
  });

  it('renders explicit message list states without taking ownership of data', () => {
    render(<MessageList messages={[]} loading="读取中" error="读取失败" unknown="结果未知" />);
    expect(screen.getByRole('log', { name: '聊天记录' })).toHaveTextContent('暂无消息');
    expect(screen.getByRole('status')).toHaveTextContent('读取中');
    expect(screen.getByRole('alert')).toHaveTextContent('读取失败');
    expect(screen.getByText('结果未知')).toBeVisible();
  });

  it('keeps session transitions in a pure host-owned reducer', () => {
    const next = chatSessionReducer(initialChatSessionState, { type: 'agent/select', agentId: 'research' });
    const ready = chatSessionReducer(next, { type: 'phase/set', phase: 'ready' });
    const drafted = chatSessionReducer(ready, { type: 'draft/set', draft: '继续核对' });
    expect(drafted).toEqual({
      phase: 'ready',
      selectedAgentId: 'research',
      query: '',
      draft: '继续核对',
      inspectorOpen: false,
      error: null,
    });
    expect(chatSessionReducer(drafted, { type: 'error/set', error: '结果未知' })).toMatchObject({ error: '结果未知' });
  });
});


describe('message rendering boundary', () => {
  it('preserves keyed renderer state on message updates and reordering, with default person fallback', () => {
    const a = { id:'a', author:'Research', kind:'agent' as const, children:'第一版', day:'今天' };
    const b = { id:'b', author:'你', kind:'person' as const, children:'继续核对', quote:'已知范围', day:'今天' };
    const { rerender } = render(<MessageList messages={[a, b]} renderers={statefulRenderers} />);
    fireEvent.click(screen.getByRole('button', { name:'展开详情' }));
    expect(screen.getByText('继续核对').closest('article')).toHaveClass('rhine-chat-message--person');
    expect(screen.getByText('已知范围').tagName).toBe('BLOCKQUOTE');
    rerender(<MessageList messages={[b, { ...a, children:'更新版' }]} renderers={{ ...statefulRenderers }} />);
    expect(screen.getByText('保留局部状态')).toBeVisible();
    expect(screen.getByRole('article', { name:'a' })).toHaveTextContent('更新版');
    expect(screen.getByRole('group', { name:'消息操作' })).toBeVisible();
    expect(screen.getAllByText('今天')).toHaveLength(1);
  });

  it('falls back to the default agent renderer for messages without a kind', () => {
    render(<MessageList messages={[{ id:'a', author:'Research', children:'未注册类型的默认正文', actions:<button>复制</button> }]} />);
    expect(screen.getByText('未注册类型的默认正文').closest('article')).toHaveClass('rhine-chat-message--agent');
    expect(screen.getByRole('group', { name:'消息操作' })).toHaveTextContent('复制');
  });
});
