import type { HTMLAttributes, ReactNode } from 'react';
import { Button } from '../components';

export interface AgentInspectorFact { label: ReactNode; value: ReactNode; }
export interface AgentInspectorProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  identity: ReactNode;
  facts?: readonly AgentInspectorFact[];
  actions?: ReactNode;
  onClose?: () => void;
  closeLabel?: string;
}

/** Agent context panel; identity and facts are opaque host-provided business data. */
export function AgentInspector({ identity, facts = [], actions, onClose, closeLabel = '关闭详情', className = '', ...props }: AgentInspectorProps) {
  return <aside {...props} className={`rhine-chat-agent-inspector ${className}`} aria-label={props['aria-label'] || 'Agent 信息'}>
    <div className="rhine-chat-agent-inspector__head"><span className="rhine-chat-agent-inspector__label">Agent 详情</span>{onClose && <Button variant="quiet" aria-label={closeLabel} onClick={onClose}>×</Button>}</div>
    <div className="rhine-chat-agent-inspector__identity">{identity}</div>
    {facts.length > 0 && <dl>{facts.map((fact, index) => <div key={index}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>}
    {actions && <div className="rhine-chat-agent-inspector__actions">{actions}</div>}
  </aside>;
}
