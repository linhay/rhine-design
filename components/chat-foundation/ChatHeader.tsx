import type { HTMLAttributes, ReactNode } from 'react';

export interface ChatHeaderProps extends HTMLAttributes<HTMLElement> {
  identity: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  inspectorAction?: ReactNode;
}

/** Header for the selected Agent; actions and inspector ownership stay with the host. */
export function ChatHeader({ identity, subtitle, actions, inspectorAction, className = '', ...props }: ChatHeaderProps) {
  return <header {...props} className={`rhine-chat-header ${className}`}>
    <div className="rhine-chat-header__identity">{identity}{subtitle != null && <span className="rhine-chat-header__subtitle">{subtitle}</span>}</div>
    <div className="rhine-chat-header__actions">{actions}{inspectorAction}</div>
  </header>;
}
