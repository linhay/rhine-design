import { useEffect, useRef } from 'react';
import { SideNav, type NavItem } from './Navigation';
import { Select } from './Select';
import './settings-navigation.css';

export interface SettingsNavigationItem { id: string; label: string; disabled?: boolean }
export interface SettingsNavigationProps {
  items: readonly SettingsNavigationItem[];
  currentId: string;
  onNavigate: (item: SettingsNavigationItem) => void;
  disabled?: boolean;
  label?: string;
}
/** Place in Dialog.navigation. The Dialog's content box owns the 560px breakpoint. */
export function SettingsNavigation({ items, currentId, onNavigate, disabled = false, label = '设置栏目' }: SettingsNavigationProps) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current, dialog = element?.closest('.rhine-dialog--settings');
    if (!element || !dialog || typeof ResizeObserver === 'undefined') return;
    let ownedFocus: Element | null = null;
    let focusFrame = 0;
    const rememberFocus = (event: FocusEvent) => {
      ownedFocus = event.target instanceof Element && element.contains(event.target) ? event.target : null;
      cancelAnimationFrame(focusFrame);
      if (ownedFocus) focusFrame = requestAnimationFrame(transferFocus);
    };
    const releaseOnPointer = (event: PointerEvent) => {
      if (!(event.target instanceof Node) || !element.contains(event.target)) ownedFocus = null;
    };
    const releaseOnBlur = () => { ownedFocus = null; };
    document.addEventListener('focusin', rememberFocus, true);
    document.addEventListener('pointerdown', releaseOnPointer, true);
    window.addEventListener('blur', releaseOnBlur);
    const transferFocus = () => {
      const active = document.activeElement;
      const hiddenOwner = ownedFocus?.isConnected && !ownedFocus.getClientRects().length;
      const ownsFocus = active && (element.contains(active) || (active === document.body && hiddenOwner));
      if (!ownsFocus || (active !== document.body && active.getClientRects().length)) return;
      // Query current separately: querySelectorAll unions use DOM order, not selector priority.
      const current = element.querySelector<HTMLElement>('a[aria-current]:not([aria-disabled])');
      const select = element.querySelector<HTMLElement>('select:not(:disabled)');
      const first = element.querySelector<HTMLElement>('a:not([aria-disabled])');
      [current, select, first].find(control => control?.getClientRects().length)?.focus();
    };
    const observer = new ResizeObserver(transferFocus);
    observer.observe(dialog);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('focusin', rememberFocus, true);
      document.removeEventListener('pointerdown', releaseOnPointer, true);
      window.removeEventListener('blur', releaseOnBlur);
    };
  }, []);
  const navigate = (id: string) => {
    const item = items.find(option => option.id === id);
    if (item && !disabled && !item.disabled) onNavigate(item);
  };
  const links: NavItem[] = items.map(item => ({ ...item, href: '#', disabled: disabled || item.disabled }));
  return <div ref={root} className="rhine-settings-navigation">
    <SideNav className="rhine-settings-navigation__side" aria-label={label} groups={[{label:'',items:links}]} currentId={currentId}
      onNavigate={(item,event) => { event.preventDefault(); navigate(item.id); }} />
    <Select className="rhine-settings-navigation__select" label={label} value={currentId} disabled={disabled || !items.length}
      onChange={event => navigate(event.target.value)}>
      {!items.some(item=>item.id===currentId) && <option value={currentId} disabled>请选择栏目</option>}
      {items.map(item=><option key={item.id} value={item.id} disabled={item.disabled}>{item.label}</option>)}
    </Select>
  </div>;
}
