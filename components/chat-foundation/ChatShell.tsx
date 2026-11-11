import type { HTMLAttributes, ReactNode } from 'react';

/** Host-supplied composition points; no global registry or runtime dependency. */
export interface ChatShellSlots {
  rail?: ReactNode;
  sidebar?: ReactNode;
  content: ReactNode;
  inspector?: ReactNode;
}

export type ChatShellSlotName = keyof ChatShellSlots;

export interface ChatShellProps extends Omit<HTMLAttributes<HTMLDivElement>, 'content'>, ChatShellSlots {
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
