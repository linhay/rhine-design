import type { HTMLAttributes, ReactNode } from 'react';

export interface MessageMetaProps extends HTMLAttributes<HTMLDivElement> {
  author: ReactNode;
  time?: ReactNode;
  dateTime?: string;
}

/** Identity and time chrome, independent of message content and actions. */
export function MessageMeta({ author, time, dateTime, className = '', ...props }: MessageMetaProps) {
  return <div {...props} className={`rhine-chat-meta ${className}`}><span className="rhine-chat-meta__author">{author}</span>{time != null && <time dateTime={dateTime}>{time}</time>}</div>;
}
