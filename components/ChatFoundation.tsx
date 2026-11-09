import { useId, type ButtonHTMLAttributes, type ChangeEvent, type FormEvent, type HTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { Button } from './components';
import { Textarea } from './Forms';

export type AgentRowStatus = 'working' | 'ready' | 'offline';

export interface AgentRowProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick'> {
  /** Identity content supplied by the host, such as an avatar and name. */
  identity: ReactNode;
  /** Short host supplied preview shown below the identity. */
  preview?: ReactNode;
  /** Status is rendered as text as well as a visual marker. */
  status?: AgentRowStatus;
  statusLabels?: Partial<Record<AgentRowStatus, string>>;
  selected?: boolean;
  onSelect?: () => void;
}

const defaultStatusLabels: Record<AgentRowStatus, string> = {
  working: '正在工作',
  ready: '准备就绪',
  offline: '离线',
};

/** A selectable Agent row. Data, routing and availability remain host owned. */
export function AgentRow({ identity, preview, status, statusLabels, selected = false, onSelect, className = '', ...props }: AgentRowProps) {
  const label = status ? (statusLabels?.[status] || defaultStatusLabels[status]) : undefined;
  return <button {...props} type="button" className={`rhine-chat-agent-row${selected ? ' is-selected' : ''} ${className}`} onClick={onSelect} aria-current={selected ? 'page' : undefined}>
    <span className="rhine-chat-agent-row__identity">{identity}</span>
    <span className="rhine-chat-agent-row__content">
      {preview != null && <span className="rhine-chat-agent-row__preview">{preview}</span>}
      {label && <span className="rhine-chat-agent-row__status">{label}</span>}
    </span>
    {status && <i aria-hidden="true" className={`rhine-chat-status rhine-chat-status--${status}`} />}
  </button>;
}

export interface MessageBubbleProps {
  author: ReactNode;
  avatar?: ReactNode;
  time?: ReactNode;
  children: ReactNode;
  kind?: 'agent' | 'person';
  quote?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/** Presents one message and leaves content rendering to the host. */
export function MessageBubble({ author, avatar, time, children, kind = 'agent', quote, actions, className = '' }: MessageBubbleProps) {
  return <article className={`rhine-chat-message rhine-chat-message--${kind} ${className}`}>
    {avatar}
    <div className="rhine-chat-message-copy">
      <div className="rhine-chat-meta"><span className="rhine-chat-meta__author">{author}</span>{time != null && <time>{time}</time>}</div>
      <div className="rhine-chat-bubble">{children}{quote != null && <blockquote>{quote}</blockquote>}</div>
      {actions && <div className="rhine-chat-message-actions" aria-label="消息操作">{actions}</div>}
    </div>
  </article>;
}

export interface ComposerProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'onSubmit'> {
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (value: string, event: FormEvent<HTMLFormElement>) => void;
  label?: string;
  submitLabel?: string;
  busy?: boolean;
  busyLabel?: string;
  attachments?: ReactNode;
  hint?: ReactNode;
  error?: string;
  actions?: ReactNode;
}

/** Controlled composer with native Enter/Shift+Enter behavior and host owned submission. */
export function Composer({ value, onChange, onSubmit, label = '消息', submitLabel = '发送消息', busy = false, busyLabel = '正在发送', attachments, hint, error, actions, onKeyDown, rows = 2, disabled, ...props }: ComposerProps) {
  const fieldId = useId();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!disabled && !busy && value.trim()) onSubmit(value, event);
  };
  return <form className="rhine-chat-composer" onSubmit={submit}>
    <Textarea {...props} id={fieldId} label={label} value={value} onChange={onChange} rows={rows} disabled={disabled || busy} error={error} onKeyDown={event => {
      if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
        event.preventDefault();
        event.currentTarget.form?.requestSubmit();
      }
      onKeyDown?.(event);
    }} />
    <div className="rhine-chat-composer__footer">
      <span className="rhine-chat-composer__hint">{error || hint}</span>
      <div className="rhine-chat-composer-actions">{attachments}{actions}<Button type="submit" aria-label={submitLabel} busy={busy} busyLabel={busyLabel} disabled={disabled || busy || !value.trim()}>↑</Button></div>
    </div>
  </form>;
}

export interface WorkspaceRailItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface WorkspaceRailProps extends Omit<HTMLAttributes<HTMLElement>, 'onSelect'> {
  items: readonly WorkspaceRailItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  footer?: ReactNode;
  label?: string;
}

/** Host-owned workspace navigation with native button semantics. */
export function WorkspaceRail({ items, activeId, onSelect, footer, label = '工作区导航', className = '', ...props }: WorkspaceRailProps) {
  return <nav {...props} className={`rhine-chat-workspace-rail ${className}`} aria-label={label}>
    <div className="rhine-chat-workspace-rail__items">{items.map(item => <button key={item.id} type="button" disabled={item.disabled} aria-current={activeId === item.id ? 'page' : undefined} aria-label={item.label} onClick={() => onSelect?.(item.id)}>
      {item.icon && <span aria-hidden="true">{item.icon}</span>}<span className="rhine-sr-only">{item.label}</span>
    </button>)}</div>
    {footer && <div className="rhine-chat-workspace-rail__footer">{footer}</div>}
  </nav>;
}

export interface AgentListItem extends Omit<AgentRowProps, 'onSelect' | 'selected'> {
  id: string;
  searchText: string;
}

export interface AgentListProps extends Omit<HTMLAttributes<HTMLElement>, 'onSelect'> {
  agents: readonly AgentListItem[];
  selectedId?: string;
  query: string;
  onQueryChange: (query: string) => void;
  onSelect?: (id: string) => void;
  empty?: ReactNode;
  label?: string;
  searchLabel?: string;
  statusLabels?: Partial<Record<AgentRowStatus, string>>;
}

/** Controlled Agent search and selection list; filtering stays local to supplied data. */
export function AgentList({ agents, selectedId, query, onQueryChange, onSelect, empty = '未找到匹配的 Agent。', label = 'Agent 列表', searchLabel = '搜索 Agent', statusLabels, className = '', ...props }: AgentListProps) {
  const visible = agents.filter(agent => agent.searchText.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <aside {...props} className={`rhine-chat-agent-list ${className}`} aria-label={label}>
    <label className="rhine-chat-agent-list__search"><span aria-hidden="true">⌕</span><span className="rhine-sr-only">{searchLabel}</span><input value={query} onChange={event => onQueryChange(event.target.value)} placeholder={searchLabel} aria-label={searchLabel} /></label>
    <nav aria-label={`${label}选择`}>{visible.length ? visible.map(agent => { const { searchText: _searchText, ...row } = agent; return <AgentRow key={agent.id} {...row} statusLabels={statusLabels} selected={agent.id === selectedId} onSelect={() => onSelect?.(agent.id)} />; }) : <span className="rhine-chat-agent-list__empty" role="status">{empty}</span>}</nav>
  </aside>;
}

export interface ChatHeaderProps extends HTMLAttributes<HTMLElement> {
  identity: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  inspectorAction?: ReactNode;
}

/** Header for the selected Agent; actions and inspector ownership stay with the host. */
export function ChatHeader({ identity, subtitle, actions, inspectorAction, className = '', ...props }: ChatHeaderProps) {
  return <header {...props} className={`rhine-chat-header ${className}`}>
    <div className="rhine-chat-header__identity">{identity}{subtitle != null && <span className="rhine-chat-header__subtitle">{subtitle}</span>}</div>
    <div className="rhine-chat-header__actions">{actions}{inspectorAction}</div>
  </header>;
}

export interface MessageListItem extends Omit<MessageBubbleProps, 'className'> {
  id: string;
  day?: ReactNode;
}

export interface MessageListProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  messages: readonly MessageListItem[];
  daySeparators?: boolean;
  working?: ReactNode;
  loading?: ReactNode;
  error?: ReactNode;
  unknown?: ReactNode;
  empty?: ReactNode;
  label?: string;
}

/** Chronological message composition with explicit host-provided state examples. */
export function MessageList({ messages, daySeparators = true, working, loading, error, unknown, empty = '暂无消息', label = '聊天记录', className = '', ...props }: MessageListProps) {
  let previousDay: ReactNode;
  return <div {...props} className={`rhine-chat-message-list ${className}`} role="log" aria-label={label}>
    {messages.map(message => {
      const showDay = daySeparators && message.day != null && message.day !== previousDay;
      previousDay = message.day;
      return <div key={message.id} className="rhine-chat-message-list__item">
        {showDay && <div className="rhine-chat-day"><span aria-hidden="true" /><span>{message.day}</span><span aria-hidden="true" /></div>}
        <MessageBubble {...message} />
      </div>;
    })}
    {!messages.length && <p className="rhine-chat-message-list__empty">{empty}</p>}
    {loading != null && <p className="rhine-chat-message-list__state" role="status">{loading}</p>}
    {error != null && <p className="rhine-chat-message-list__state rhine-chat-message-list__state--error" role="alert">{error}</p>}
    {unknown != null && <p className="rhine-chat-message-list__state">{unknown}</p>}
    {working != null && <p className="rhine-chat-message-list__working" role="status">{working}</p>}
  </div>;
}

export interface AgentInspectorFact { label: ReactNode; value: ReactNode; }
export interface AgentInspectorProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  identity: ReactNode;
  facts?: readonly AgentInspectorFact[];
  actions?: ReactNode;
  onClose?: () => void;
  closeLabel?: string;
}

/** Agent context panel; identity and facts are opaque host-provided business data. */
export function AgentInspector({ identity, facts = [], actions, onClose, closeLabel = '关闭详情', className = '', ...props }: AgentInspectorProps) {
  return <aside {...props} className={`rhine-chat-agent-inspector ${className}`} aria-label={props['aria-label'] || 'Agent 信息'}>
    <div className="rhine-chat-agent-inspector__head"><span className="rhine-chat-agent-inspector__label">AGENT 信息</span>{onClose && <Button variant="quiet" aria-label={closeLabel} onClick={onClose}>×</Button>}</div>
    <div className="rhine-chat-agent-inspector__identity">{identity}</div>
    {facts.length > 0 && <dl>{facts.map((fact, index) => <div key={index}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>}
    {actions && <div className="rhine-chat-agent-inspector__actions">{actions}</div>}
  </aside>;
}

export interface ChatShellProps extends Omit<HTMLAttributes<HTMLDivElement>, 'content'> {
  rail?: ReactNode;
  sidebar?: ReactNode;
  content: ReactNode;
  inspector?: ReactNode;
  inspectorOpen?: boolean;
}

/** Layout-only Chat shell. It owns slots and responsive placement, never navigation or data. */
export function ChatShell({ rail, sidebar, content, inspector, inspectorOpen = Boolean(inspector), className = '', ...props }: ChatShellProps) {
  return <div {...props} className={`rhine-chat-shell${inspectorOpen ? ' is-inspector-open' : ''} ${className}`} data-inspector-open={inspectorOpen || undefined}>
    {rail && <div className="rhine-chat-shell__rail">{rail}</div>}
    {sidebar && <div className="rhine-chat-shell__sidebar">{sidebar}</div>}
    <main className="rhine-chat-shell__content">{content}</main>
    {inspectorOpen && inspector && <div className="rhine-chat-shell__inspector">{inspector}</div>}
  </div>;
}
