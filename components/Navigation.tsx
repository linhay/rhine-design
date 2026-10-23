import type { HTMLAttributes, MouseEvent } from 'react';
import { Icon, type IconName } from './Actions';

export interface NavItem { id: string; label: string; href: string; icon?: IconName }
export interface NavGroup { label: string; items: readonly NavItem[] }
export interface SideNavProps extends HTMLAttributes<HTMLElement> {
  groups: readonly NavGroup[]; currentId: string;
  onNavigate?: (item: NavItem, event: MouseEvent<HTMLAnchorElement>) => void;
}
export function SideNav({ groups, currentId, onNavigate, className = '', 'aria-label': label = '主导航', ...props }: SideNavProps) {
  return <nav {...props} aria-label={label} className={`rhine-side-nav ${className}`}>
    {groups.map(group => <div className="rhine-side-nav__group" key={group.label}><p>{group.label}</p><ul>
      {group.items.map(item => <li key={item.id}><a href={item.href} aria-current={currentId === item.id ? 'page' : undefined} onClick={event => onNavigate?.(item, event)}>{item.icon && <Icon name={item.icon} size={20}/>}<span className="rhine-side-nav__label">{item.label}</span></a></li>)}
    </ul></div>)}
  </nav>;
}

export interface BreadcrumbItem { label: string; href?: string }
export interface BreadcrumbsProps { items: readonly BreadcrumbItem[]; label?: string }
export function Breadcrumbs({ items, label = '当前位置' }: BreadcrumbsProps) {
  return <nav className="rhine-breadcrumbs" aria-label={label}><ol>{items.map((item, index) => <li key={index}>
    {index > 0 && <span aria-hidden="true" className="rhine-breadcrumbs__separator">/</span>}
    {item.href ? <a href={item.href} aria-current={index === items.length - 1 ? 'page' : undefined}>{item.label}</a> : <span aria-current={index === items.length - 1 ? 'page' : undefined}>{item.label}</span>}
  </li>)}</ol></nav>;
}

export interface StepItem { id: string; label: string; description?: string }
export interface StepsProps {
  items: readonly StepItem[]; current: number; label?: string; error?: string;
  onStepChange?: (index: number) => void;
}
export function Steps({ items, current, label = '任务步骤', error, onStepChange }: StepsProps) {
  const position = Math.max(0, Math.min(current, items.length));
  return <ol className="rhine-steps" aria-label={label}>{items.map((item, index) => {
    const state = index < position ? 'complete' : index === position ? (error ? 'error' : 'current') : 'pending';
    const status = { complete: '已完成', current: '进行中', error: '需要修正', pending: '未开始' }[state];
    const content = <><span className="rhine-steps__number" aria-hidden="true">{state === 'complete' ? '✓' : String(index + 1).padStart(2, '0')}</span><span><strong>{item.label}</strong><small>{status}{item.description ? ` · ${item.description}` : ''}{state === 'error' ? ` · ${error}` : ''}</small></span></>;
    return <li key={item.id} data-state={state} aria-current={index === position ? 'step' : undefined}>
      {onStepChange && index < position ? <button type="button" onClick={() => onStepChange(index)} aria-label={`返回${item.label}`}>{content}</button> : <div>{content}</div>}
    </li>;
  })}</ol>;
}
