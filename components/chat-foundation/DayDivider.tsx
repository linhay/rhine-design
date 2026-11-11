import type { HTMLAttributes, ReactNode } from 'react';

export interface DayDividerProps extends HTMLAttributes<HTMLDivElement> { children: ReactNode; }

/** Host-formatted day label; no date parsing or timezone ownership. */
export function DayDivider({ children, className = '', ...props }: DayDividerProps) {
  return <div {...props} className={`rhine-chat-day ${className}`}><span aria-hidden="true" /><span>{children}</span><span aria-hidden="true" /></div>;
}
