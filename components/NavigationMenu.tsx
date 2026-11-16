import { useRef, type MouseEvent } from 'react';

export interface NavigationMenuItem { id: string; label: string; href: string; disabled?: boolean; children?: readonly NavigationMenuItem[] }
export interface NavigationMenuProps {
  label: string; items: readonly NavigationMenuItem[]; currentId: string;
  orientation?: 'horizontal' | 'vertical';
  onNavigate?: (item: NavigationMenuItem, event: MouseEvent<HTMLAnchorElement>) => void;
}
/** Native navigation links, deliberately distinct from the existing command Menu. */
export function NavigationMenu({ label, items, currentId, orientation = 'horizontal', onNavigate }: NavigationMenuProps) {
  const root = useRef<HTMLElement>(null);
  const render = (nodes: readonly NavigationMenuItem[], ancestorDisabled = false) => <ul>{nodes.map(item => {
    const disabled = ancestorDisabled || item.disabled;
    return <li key={item.id}><a data-rhine-navigation-item href={disabled ? undefined : item.href} role={disabled ? 'link' : undefined} aria-current={currentId === item.id ? 'page' : undefined} aria-disabled={disabled || undefined} tabIndex={disabled ? -1 : undefined} onClick={event => { if (disabled) { event.preventDefault(); return; } onNavigate?.(item, event); }}>{item.label}</a>{!!item.children?.length && render(item.children, disabled)}</li>;
  })}</ul>;
  return <nav ref={root} className="rhine-navigation-menu" data-orientation={orientation} aria-label={label} onKeyDown={event => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    const backward = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft', forward = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
    if (!['Home', 'End', backward, forward].includes(event.key)) return;
    const links = [...(root.current?.querySelectorAll<HTMLAnchorElement>('[data-rhine-navigation-item][href]') ?? [])];
    if (!links.length) return;
    event.preventDefault();
    const index = links.indexOf(document.activeElement as HTMLAnchorElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1 : (index + (event.key === forward ? 1 : -1) + links.length) % links.length;
    links[next]?.focus();
  }}>{render(items)}</nav>;
}
