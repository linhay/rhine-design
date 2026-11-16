import type { HTMLAttributes, ReactNode } from 'react';
import { Button } from '../components';
import { Tooltip } from '../Overlays';

export interface WorkspaceRailItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface WorkspaceRailProps extends Omit<HTMLAttributes<HTMLElement>, 'onSelect'> {
  items: readonly WorkspaceRailItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  footer?: ReactNode;
  label?: string;
}

/** Host-owned workspace navigation with native button semantics. */
export function WorkspaceRail({ items, activeId, onSelect, footer, label = '工作区导航', className = '', ...props }: WorkspaceRailProps) {
  return <nav {...props} className={`rhine-chat-workspace-rail ${className}`} aria-label={label}>
    <div className="rhine-chat-workspace-rail__items">{items.map(item => <Tooltip key={item.id} content={item.label} side="right"><Button variant="quiet" disabled={item.disabled} title={item.disabled ? item.label : undefined} aria-current={activeId === item.id ? 'page' : undefined} aria-label={item.label} onClick={() => onSelect?.(item.id)}>
      {item.icon && <span aria-hidden="true">{item.icon}</span>}<span className="rhine-sr-only">{item.label}</span>
    </Button></Tooltip>)}</div>
    {footer && <div className="rhine-chat-workspace-rail__footer">{footer}</div>}
  </nav>;
}
