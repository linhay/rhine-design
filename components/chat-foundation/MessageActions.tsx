import type { HTMLAttributes } from 'react';

export interface MessageActionsProps extends HTMLAttributes<HTMLDivElement> {}

/** Always-visible action seat. Callbacks and operation outcomes belong to the host. */
export function MessageActions({ children, className = '', 'aria-label': label = '消息操作', ...props }: MessageActionsProps) {
  return <div {...props} role="group" aria-label={label} className={`rhine-chat-message-actions ${className}`}>{children}</div>;
}
