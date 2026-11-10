import type { ReactNode } from 'react';
import { MessageMeta } from './MessageMeta';
import { MessageContent } from './MessageContent';
import { MessageActions } from './MessageActions';

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
      <MessageMeta author={author} time={time} />
      <MessageContent quote={quote}>{children}</MessageContent>
      {actions && <MessageActions>{actions}</MessageActions>}
    </div>
  </article>;
}
