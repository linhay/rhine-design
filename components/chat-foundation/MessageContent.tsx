import type { HTMLAttributes, ReactNode } from 'react';

export interface MessageContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  quote?: ReactNode;
}

/** Themeable message surface. Optional RichText composes read-only Markdown; the host owns source and attachments. */
export function MessageContent({ children, quote, className = '', ...props }: MessageContentProps) {
  return <div {...props} className={`rhine-chat-bubble ${className}`}>{children}{quote != null && <blockquote>{quote}</blockquote>}</div>;
}
