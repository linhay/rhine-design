import { useId, type ButtonHTMLAttributes, type ChangeEvent, type FormEvent, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { Button } from '../components';
import { Textarea } from '../Forms';

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
  return <article className={`rhine-chat-message rhine-chat-message--${kind}${avatar != null ? ' rhine-chat-message--with-avatar' : ''} ${className}`}>
    {avatar != null && <div className="rhine-chat-message-avatar">{avatar}</div>}
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
