import type { HTMLAttributes, ReactNode } from 'react';

export interface ChatPaneProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  header?: ReactNode;
  messages: ReactNode;
  composer?: ReactNode;
}

/** Composes the conversation column without reading session state or submitting drafts. */
export function ChatPane({ header, messages, composer, className = '', ...props }: ChatPaneProps) {
  return <div {...props} className={`rhine-chat-pane ${className}`}>
    {header != null && <div className="rhine-chat-shell__header">{header}</div>}
    {messages}
    {composer}
  </div>;
}
