import type { HTMLAttributes, ReactNode } from 'react';
import { DayDivider } from './DayDivider';
import { MessageStatus } from './MessageStatus';
import { MessageRenderer, type MessageRenderers } from './MessageRenderer';
import type { MessageListItem } from './message-types';
export type { MessageListItem } from './message-types';

export interface MessageListProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  messages: readonly MessageListItem[];
  /** Per-kind rendering components; omitted kinds keep the default message bubble. */
  renderers?: MessageRenderers;
  daySeparators?: boolean;
  working?: ReactNode;
  loading?: ReactNode;
  error?: ReactNode;
  unknown?: ReactNode;
  empty?: ReactNode;
  label?: string;
}

/** Chronological message composition with explicit host-provided state examples. */
export function MessageList({ messages, renderers, daySeparators = true, working, loading, error, unknown, empty = '暂无消息', label = '聊天记录', className = '', ...props }: MessageListProps) {
  let previousDay: ReactNode;
  return <div {...props} className={`rhine-chat-message-list ${className}`} role="log" aria-label={label}>
    {messages.map(message => {
      const showDay = daySeparators && message.day != null && message.day !== previousDay;
      if (message.day != null) previousDay = message.day;
      return <div key={message.id} className="rhine-chat-message-list__item">
        {showDay && <DayDivider>{message.day}</DayDivider>}
        <MessageRenderer message={message} renderers={renderers} />
      </div>;
    })}
    {!messages.length && <MessageStatus state="empty">{empty}</MessageStatus>}
    {loading != null && <MessageStatus state="loading">{loading}</MessageStatus>}
    {error != null && <MessageStatus state="error">{error}</MessageStatus>}
    {unknown != null && <MessageStatus state="unknown">{unknown}</MessageStatus>}
    {working != null && <MessageStatus state="working">{working}</MessageStatus>}
  </div>;
}
