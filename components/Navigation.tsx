import { useRef, type HTMLAttributes, type MouseEvent } from 'react';
import { Menu, type MenuItem } from './Overlays';
import { Icon, IconButton, type IconName } from './Actions';

export interface NavAction extends Omit<MenuItem, 'onSelect'> { onSelect: (trigger: HTMLButtonElement) => void }
export interface NavItem { id: string; label: string; href: string; disabled?: boolean; icon?: IconName; actions?: readonly NavAction[] }
export interface NavGroup { label: string; items: readonly NavItem[] }
export interface SideNavProps extends HTMLAttributes<HTMLElement> {
  groups: readonly NavGroup[]; currentId: string;
  onNavigate?: (item: NavItem, event: MouseEvent<HTMLAnchorElement>) => void;
}
export function SideNav({ groups, currentId, onNavigate, className = '', 'aria-label': label = '主导航', ...props }: SideNavProps) {
  return <nav {...props} aria-label={label} className={`rhine-side-nav ${className}`}>
    {groups.map(group => <div className="rhine-side-nav__group" key={group.label}><p>{group.label}</p><ul>
      {group.items.map(item => <SideNavRow key={item.id} item={item} current={currentId === item.id} onNavigate={onNavigate} />)}
    </ul></div>)}
  </nav>;
}

function SideNavRow({ item, current, onNavigate }: { item: NavItem; current: boolean; onNavigate?: SideNavProps['onNavigate'] }) {
  const trigger = useRef<HTMLButtonElement>(null);
  const hasActions = !!item.actions?.length;
  return <li className={hasActions ? 'rhine-side-nav__row--actions' : undefined}>
    <a href={item.href} aria-disabled={item.disabled || undefined} tabIndex={item.disabled ? -1 : undefined} aria-current={current ? 'page' : undefined} onClick={event => { if (item.disabled) { event.preventDefault(); return; } onNavigate?.(item, event); }}>{item.icon && <Icon name={item.icon} size={20}/>}<span className="rhine-side-nav__label">{item.label}</span></a>
    {hasActions && <Menu label={`${item.label}：操作`} trigger={<IconButton ref={trigger} disabled={item.disabled} label={`${item.label}：更多操作`} icon="more" />} items={item.actions!.map(action => ({ ...action, disabled: item.disabled || action.disabled, onSelect: () => { if (!item.disabled && trigger.current) action.onSelect(trigger.current); } }))} />}
  </li>;
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
