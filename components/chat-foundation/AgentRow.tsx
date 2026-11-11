import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type AgentRowStatus = 'working' | 'ready' | 'offline';

export interface AgentRowProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick'> {
  /** Identity content supplied by the host, such as an avatar and name. */
  identity: ReactNode;
  /** Short host supplied preview shown below the identity. */
  preview?: ReactNode;
  /** Status is rendered as text as well as a visual marker. */
  status?: AgentRowStatus;
  statusLabels?: Partial<Record<AgentRowStatus, string>>;
  selected?: boolean;
  onSelect?: () => void;
}

const defaultStatusLabels: Record<AgentRowStatus, string> = {
  working: '正在工作',
  ready: '准备就绪',
  offline: '离线',
};

/** A selectable Agent row. Data, routing and availability remain host owned. */
export function AgentRow({ identity, preview, status, statusLabels, selected = false, onSelect, className = '', ...props }: AgentRowProps) {
  const label = status ? (statusLabels?.[status] || defaultStatusLabels[status]) : undefined;
  return <button {...props} type="button" className={`rhine-chat-agent-row${selected ? ' is-selected' : ''} ${className}`} onClick={onSelect} aria-current={selected ? 'page' : undefined}>
    <span className="rhine-chat-agent-row__identity">{identity}</span>
    <span className="rhine-chat-agent-row__content">
      {preview != null && <span className="rhine-chat-agent-row__preview">{preview}</span>}
      {label && <span className="rhine-chat-agent-row__status">{label}</span>}
    </span>
    {status && <i aria-hidden="true" className={`rhine-chat-status rhine-chat-status--${status}`} />}
  </button>;
}
