import type { HTMLAttributes, ReactNode } from 'react';
import { AgentRow, type AgentRowProps, type AgentRowStatus } from './AgentRow';

export interface AgentListItem extends Omit<AgentRowProps, 'onSelect' | 'selected'> {
  id: string;
  searchText: string;
}

export interface AgentListProps extends Omit<HTMLAttributes<HTMLElement>, 'onSelect'> {
  agents: readonly AgentListItem[];
  selectedId?: string;
  query: string;
  onQueryChange: (query: string) => void;
  onSelect?: (id: string) => void;
  empty?: ReactNode;
  label?: string;
  searchLabel?: string;
  statusLabels?: Partial<Record<AgentRowStatus, string>>;
}

/** Controlled Agent search and selection list; filtering stays local to supplied data. */
export function AgentList({ agents, selectedId, query, onQueryChange, onSelect, empty = '未找到匹配的 Agent。', label = 'Agent 列表', searchLabel = '搜索 Agent', statusLabels, className = '', ...props }: AgentListProps) {
  const visible = agents.filter(agent => agent.searchText.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <aside {...props} className={`rhine-chat-agent-list ${className}`} aria-label={label}>
    <label className="rhine-chat-agent-list__search"><span aria-hidden="true">⌕</span><span className="rhine-sr-only">{searchLabel}</span><input value={query} onChange={event => onQueryChange(event.target.value)} placeholder={searchLabel} aria-label={searchLabel} /></label>
    <nav aria-label={`${label}选择`}>{visible.length ? visible.map(agent => { const { searchText: _searchText, ...row } = agent; return <AgentRow key={agent.id} {...row} statusLabels={statusLabels} selected={agent.id === selectedId} onSelect={() => onSelect?.(agent.id)} />; }) : <span className="rhine-chat-agent-list__empty" role="status">{empty}</span>}</nav>
  </aside>;
}
