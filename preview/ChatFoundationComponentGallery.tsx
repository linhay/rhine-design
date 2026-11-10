import { useEffect, useMemo, useRef, useState } from 'react';
import { AgentInspector, AgentList, AgentRow, Button, ChatHeader, ChatPane, ChatShell, Composer, MessageBubble, MessageList, MessageMeta, MessageContent, MessageActions, DayDivider, MessageStatus, Text, WorkspaceRail } from '../components';
import type { MessageListItem, MessageRenderers } from '../components';
import { agents, messages, Avatar, MessageBody } from './chat-foundation-fixtures';
import { chatFoundationPages, type ChatFoundationComponentId } from './chat-foundation-navigation';
import './chat-foundation.css';

function CustomAgentMessage(message: MessageListItem) {
  return <MessageBubble {...message} author={<>{message.author} · 自定义呈现</>} />;
}
const customRenderers: MessageRenderers = { agent: CustomAgentMessage };

export function ChatFoundationComponentGallery({ componentId }: { componentId: ChatFoundationComponentId }) {
  const definition = chatFoundationPages.find(page => page.id === componentId)!;
  const root = useRef<HTMLElement>(null);
  const [selectedId, setSelectedId] = useState('chief');
  const [query, setQuery] = useState('');
  const [railId, setRailId] = useState('chat');
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [fail, setFail] = useState(false);
  const [custom, setCustom] = useState(false);
  const [busy, setBusy] = useState(false);
  const selected = agents.find(agent => agent.id === selectedId) ?? agents[0];
  useEffect(() => {
    if (!inspectorOpen) root.current?.querySelector<HTMLButtonElement>('[data-chat-demo-inspector-toggle]')?.focus();
  }, [inspectorOpen]);
  const demoMessages = useMemo(() => messages.map(message => ({
    ...message,
    avatar: <Avatar agent={{ initial: message.initial, color: message.kind === 'person' ? '#2d3543' : '#e77f61' }} />,
    children: <MessageBody text={message.body} />,
    actions: message.kind === 'agent' ? <><Button variant="quiet">复制</Button><Button variant="quiet">朗读</Button><Button variant="quiet" aria-label="更多消息操作">···</Button></> : undefined,
  })), []);
  const identity = <><Avatar agent={selected} large /><span className="rhine-chat-inspector-identity"><Text as="strong" variant="heading">{selected.name}</Text><Text variant="caption" tone="muted">{selected.role}</Text></span></>;
  const inspector = <AgentInspector className="rhine-chat-inspector" identity={identity} facts={[
    { label:'模型', value:'Claude · Sonnet' }, { label:'工作电脑', value:'本地电脑' },
    { label:'权限', value:'每次询问' }, { label:'记忆', value:'已启用' },
  ]} onClose={() => setInspectorOpen(false)} actions={<Button variant="secondary">打开设置</Button>} />;
  const toggle = <Button variant="secondary" data-chat-demo-inspector-toggle aria-expanded={inspectorOpen} onClick={() => setInspectorOpen(value => !value)}>{inspectorOpen ? '隐藏详情' : '显示详情'}</Button>;
  const header = <ChatHeader identity={identity} actions={<Button variant="quiet">模型</Button>} inspectorAction={toggle} />;
  const rail = <WorkspaceRail activeId={railId} onSelect={setRailId} items={[
    { id:'chat', label:'聊天', icon:'⌁' }, { id:'files', label:'文件', icon:'▤' }, { id:'automation', label:'自动化（不可用）', icon:'◷', disabled:true },
  ]} />;
  const list = <AgentList className="rhine-chat-agents" agents={agents.map(agent => ({
    id:agent.id, searchText:`${agent.name} ${agent.preview}`, identity:<><Avatar agent={agent} /><Text as="strong" variant="label">{agent.name}</Text></>, preview:agent.preview, status:agent.status,
  }))} selectedId={selectedId} query={query} onQueryChange={setQuery} onSelect={setSelectedId} />;

  return <section ref={root} className="rhine-chat-foundation" aria-label={`${definition.label} 组件展台`}>
    <div className="rhine-chat-foundation-intro"><Text variant="overline">CHAT FOUNDATION / COMPONENT</Text><Text as="h2" variant="title">{definition.label}</Text><Text tone="muted">{definition.description}</Text></div>
    <div className="rhine-chat-component-stage">
      {componentId === 'chat-foundation-shell' && <ChatShell className="rhine-chat-component-shell" rail={rail} sidebar={list} content={<>{header}<MessageList messages={demoMessages.slice(0, 2)} /></>} inspector={inspector} inspectorOpen={inspectorOpen} />}
      {componentId === 'chat-foundation-pane' && <ChatPane header={<ChatHeader identity={identity} />} messages={<MessageList messages={demoMessages.slice(0, 2)} />} composer={<Composer value={draft} onChange={event => setDraft(event.target.value)} onSubmit={value => { setSubmitted(value); setDraft(''); }} hint={submitted ? `本地演示：已提交“${submitted}”` : 'Enter 发送 · Shift+Enter 换行'} />} />}
      {componentId === 'chat-foundation-workspace-rail' && <div className="rhine-chat-component-rail">{rail}</div>}
      {componentId === 'chat-foundation-agent-list' && <div className="rhine-chat-component-narrow">{list}</div>}
      {componentId === 'chat-foundation-agent-row' && <div className="rhine-chat-component-narrow rhine-chat-agents">{agents.map(agent => <AgentRow key={agent.id} identity={<><Avatar agent={agent} /><Text as="strong" variant="label">{agent.name}</Text></>} preview={agent.preview} status={agent.status} selected={selectedId === agent.id} onSelect={() => setSelectedId(agent.id)} />)}</div>}
      {componentId === 'chat-foundation-header' && <>{header}{inspectorOpen && <div className="rhine-chat-component-narrow">{inspector}</div>}</>}
      {componentId === 'chat-foundation-message-list' && <MessageList messages={demoMessages} loading="正在读取历史消息" error="暂时无法读取消息" unknown="消息状态未知" working="Chief of Staff 正在准备回复" />}
      {componentId === 'chat-foundation-message-bubble' && <>{demoMessages.map(message => <MessageBubble key={message.id} {...message} />)}</>}
      {componentId === 'chat-foundation-message-meta' && <MessageMeta author="Research" time="09:51" dateTime="2026-11-10T09:51:00+08:00" />}
      {componentId === 'chat-foundation-message-content' && <MessageContent quote="适用范围仍待确认。"><MessageBody text="资料 v2 的比较结果，由宿主提供正文与引用。" /></MessageContent>}
      {componentId === 'chat-foundation-message-actions' && <MessageActions><Button variant="quiet">复制</Button><Button variant="quiet">朗读</Button><Button variant="quiet" disabled>更多操作</Button></MessageActions>}
      {componentId === 'chat-foundation-day-divider' && <><DayDivider>今天</DayDivider><DayDivider>2026 年 11 月 9 日</DayDivider></>}
      {componentId === 'chat-foundation-message-status' && <><MessageStatus state="empty">暂无消息</MessageStatus><MessageStatus state="loading">正在读取历史消息</MessageStatus><MessageStatus state="error">暂时无法读取消息</MessageStatus><MessageStatus state="unknown">消息状态未知</MessageStatus><MessageStatus state="working">Research 正在准备回复</MessageStatus></>}
      {componentId === 'chat-foundation-message-renderer' && <><Button variant="secondary" aria-pressed={custom} onClick={() => setCustom(value => !value)}>{custom ? '使用默认渲染器' : '使用自定义 Agent 渲染器'}</Button><MessageList messages={demoMessages.slice(0, 2)} renderers={custom ? customRenderers : undefined} /></>}
      {componentId === 'chat-foundation-composer' && <>
        <div className="rhine-chat-component-controls"><Button variant="secondary" aria-pressed={fail} onClick={() => { setFail(value => !value); setSendError(''); }}>{fail ? '取消模拟失败' : '模拟失败'}</Button><Button variant="secondary" aria-pressed={busy} onClick={() => setBusy(value => !value)}>{busy ? '结束忙碌' : '模拟忙碌'}</Button></div>
        <Composer value={draft} onChange={event => { setDraft(event.target.value); setSendError(''); }} busy={busy} error={sendError} hint={submitted ? `本地演示：已提交“${submitted}”` : 'Enter 发送 · Shift+Enter 换行'} onSubmit={value => { if (fail) { setSendError('演示提交失败，草稿已保留。'); return; } setSubmitted(value); setDraft(''); setSendError(''); }} placeholder="输入消息，试试 Enter 或 Shift+Enter…" />
      </>}
      {componentId === 'chat-foundation-inspector' && <div className="rhine-chat-component-narrow">{inspectorOpen ? inspector : <Button variant="secondary" data-chat-demo-inspector-toggle onClick={() => setInspectorOpen(true)}>显示详情</Button>}</div>}
    </div>
    <Text variant="caption" tone="muted">使用合成数据与本地状态；组件不连接 Agent 或消息服务。</Text>
  </section>;
}
