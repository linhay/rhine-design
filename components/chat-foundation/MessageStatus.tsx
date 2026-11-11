import type { HTMLAttributes, ReactNode } from 'react';

export type MessageStatusState = 'empty' | 'loading' | 'error' | 'unknown' | 'working';
export interface MessageStatusProps extends HTMLAttributes<HTMLParagraphElement> {
  state: MessageStatusState;
  children: ReactNode;
}

/** Explicit presentation state; never infers transport or Agent success. */
export function MessageStatus({ state, children, className = '', ...props }: MessageStatusProps) {
  const suffix = state === 'empty' ? 'empty' : state === 'working' ? 'working' : 'state';
  const role = state === 'error' ? 'alert' : state === 'loading' || state === 'working' ? 'status' : undefined;
  return <p {...props} role={role} data-state={state} className={`rhine-chat-message-list__${suffix}${state === 'error' ? ' rhine-chat-message-list__state--error' : ''} ${className}`}>{children}</p>;
}
