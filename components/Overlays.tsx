import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import * as DialogBase from '@radix-ui/react-dialog';
import * as AlertBase from '@radix-ui/react-alert-dialog';
import * as PopoverBase from '@radix-ui/react-popover';
import * as MenuBase from '@radix-ui/react-dropdown-menu';
import * as TooltipBase from '@radix-ui/react-tooltip';
import { Button, Notice } from './components';
import { IconButton } from './Actions';
import './drawer-placement.css';
import './dialog-settings.css';
import { useFloatingScale, useFloatingSide } from './useFloatingScale';

const dialogDismiss = new WeakMap<Element, () => void>();

// Keep portal content inside the root theme so tokens and reduced-motion overrides inherit.
function useScope() {
  const ref = useRef<HTMLSpanElement>(null);
  const [container, setContainer] = useState<HTMLElement>();
  useLayoutEffect(() => { setContainer((ref.current?.closest('.rhine-theme') as HTMLElement) || document.body); }, []);
  return { ref, container };
}
export interface DialogProps { height?: CSSProperties['height']; footer?: ReactNode; trigger: ReactElement; title: string; description: ReactNode; children: ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void; navigation?: ReactNode; sidePanel?: ReactNode | ((closeButton: ReactElement) => ReactNode); onCloseAutoFocus?: (event: Event) => void }
export function Dialog(props: DialogProps) {
  return <DialogFrame {...props}/>;
}
export function Drawer(props: Omit<DialogProps, 'sidePanel' | 'navigation'> & { side?: 'left' | 'right' }) { return <DialogFrame {...props} drawer />; }
function DialogFrame({ trigger, title, description, children, open, onOpenChange, sidePanel, navigation, onCloseAutoFocus, height, footer, drawer = false, side = 'right' }: DialogProps & { drawer?: boolean; side?: 'left' | 'right' }) {
  const { ref, container } = useScope();
  const [localOpen, setLocalOpen] = useState(false);
  const [content, setContent] = useState<HTMLDivElement | null>(null);
  const changeOpen = (next: boolean) => { setLocalOpen(next); onOpenChange?.(next); };
  useLayoutEffect(() => {
    if (!content) return;
    dialogDismiss.set(content, () => { setLocalOpen(false); onOpenChange?.(false); });
    return () => { dialogDismiss.delete(content); };
  }, [content, onOpenChange]);
  const escape = (event: KeyboardEvent) => {
    if (event.defaultPrevented || !(event.target instanceof Element)) return;
    const owner = event.target.closest('[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]');
    if (!owner || owner === content) return;
    // Radix's top layer may lag a newly focused nested dialog until its passive
    // effect runs. Redirect only that stale callback; keep Tooltip/Menu priority.
    event.preventDefault();
    dialogDismiss.get(owner)?.();
  };
  const sideNavigation = typeof sidePanel === 'function';
  const hasDescription = description != null && description !== false && description !== '';
  const settings = navigation != null && navigation !== false;
  if (settings && sidePanel) throw new Error('Dialog navigation and sidePanel are mutually exclusive.');
  const closeButton = <DialogBase.Close asChild><IconButton label={drawer ? '关闭抽屉' : '关闭对话框'} icon="close" /></DialogBase.Close>;
  const bounded = height != null || footer != null;
  const panes = <><div className="rhine-dialog__main"><div className="rhine-dialog__head"><DialogBase.Title className="rhine-text rhine-text--section">{title}</DialogBase.Title>{!sideNavigation && closeButton}</div>{hasDescription && <DialogBase.Description className="rhine-text rhine-text--body rhine-text--muted">{description}</DialogBase.Description>}<div className="rhine-dialog__body">{settings ? <div className="rhine-dialog__settings-grid"><div className="rhine-dialog__navigation">{navigation}</div><div className="rhine-dialog__settings-content">{children}</div></div> : children}</div></div>{sidePanel && <div className="rhine-dialog__side">{typeof sidePanel === 'function' ? sidePanel(closeButton) : sidePanel}</div>}</>;
  return <span className="rhine-overlay-anchor" ref={ref}><DialogBase.Root open={open ?? localOpen} onOpenChange={changeOpen}><DialogBase.Trigger asChild>{trigger}</DialogBase.Trigger><DialogBase.Portal container={container}>
    <DialogBase.Overlay className="rhine-overlay" /><DialogBase.Content ref={setContent} onEscapeKeyDown={escape} onCloseAutoFocus={onCloseAutoFocus} {...(!hasDescription ? { 'aria-describedby': undefined } : {})} data-side={drawer ? side : undefined}
      style={height == null ? undefined : { '--rhine-dialog-height': typeof height === 'number' ? `${height}px` : height } as CSSProperties}
      className={`rhine-dialog${drawer ? ' rhine-drawer' : ''}${settings ? ' rhine-dialog--settings' : ''}${sidePanel ? ' rhine-dialog--split' : ''}${sideNavigation ? ' rhine-dialog--side-navigation' : ''}${bounded ? ' rhine-dialog--bounded' : ''}`}>
      {bounded ? <div className="rhine-dialog__scroll">{panes}</div> : panes}
      {footer != null && <div className="rhine-dialog__footer">{footer}</div>}
    </DialogBase.Content>
  </DialogBase.Portal></DialogBase.Root></span>;
}
export function ConfirmDialog({ trigger, title, description, confirmLabel = '确认操作', danger = false, onConfirm }: { trigger: ReactElement; title: string; description: string; confirmLabel?: string; danger?: boolean; onConfirm: () => Promise<void> | void }) {
  const { ref, container } = useScope(); const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(false);
  const pending = useRef(false), mounted = useRef(true);
  useLayoutEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const run = async () => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(false);
    try { await onConfirm(); if (mounted.current) setOpen(false); }
    catch { if (mounted.current) setError(true); }
    finally { pending.current = false; if (mounted.current) setBusy(false); }
  };
  return <span className="rhine-overlay-anchor" ref={ref}><AlertBase.Root open={open} onOpenChange={next => { if (!pending.current) { setOpen(next); setError(false); } }}><AlertBase.Trigger asChild>{trigger}</AlertBase.Trigger><AlertBase.Portal container={container}><AlertBase.Overlay className="rhine-overlay" /><AlertBase.Content className="rhine-dialog" aria-busy={busy} onEscapeKeyDown={event => { if (busy) event.preventDefault(); }}>
    <AlertBase.Title className="rhine-text rhine-text--section">{title}</AlertBase.Title><AlertBase.Description className="rhine-text rhine-text--body rhine-text--muted">{description}</AlertBase.Description>{error && <Notice tone="error" title="操作未完成">请重试，或取消后检查。</Notice>}
    <div className="rhine-dialog__actions"><AlertBase.Cancel asChild><Button variant="secondary" disabled={busy}>取消</Button></AlertBase.Cancel><Button variant={danger ? 'danger' : 'primary'} busy={busy} onClick={run}>{confirmLabel}</Button></div>
  </AlertBase.Content></AlertBase.Portal></AlertBase.Root></span>;
}
interface OverlayControl { open?: boolean; onOpenChange?: (open: boolean) => void; side?: 'top' | 'right' | 'bottom' | 'left' }
export function Popover({ trigger, title, children, open, onOpenChange, side }: OverlayControl & { trigger: ReactElement; title: string; children: ReactNode }) {
  const { ref, container } = useScope();
  const floatingRef = useFloatingScale(undefined, 'popover');
  const floatingSide = useFloatingSide(ref, side, 300);
  return <span className="rhine-overlay-anchor" ref={ref}><PopoverBase.Root open={open} onOpenChange={onOpenChange}><PopoverBase.Trigger asChild>{trigger}</PopoverBase.Trigger><PopoverBase.Portal container={container}><PopoverBase.Content ref={floatingRef} className="rhine-popover" aria-label={title} side={floatingSide} sideOffset={8} collisionPadding={12}><div className="rhine-dialog__head"><strong>{title}</strong><PopoverBase.Close asChild><IconButton label="关闭详情" icon="close" /></PopoverBase.Close></div>{children}</PopoverBase.Content></PopoverBase.Portal></PopoverBase.Root></span>;
}
export interface MenuItem { id: string; label: string; disabled?: boolean; danger?: boolean; onSelect: () => void }
export function Menu({ trigger, label, items, open, onOpenChange, side }: OverlayControl & { trigger: ReactElement; label: string; items: MenuItem[] }) {
  const { ref, container } = useScope();
  const floatingRef = useFloatingScale(undefined, 'dropdown-menu');
  const floatingSide = useFloatingSide(ref, side, 180);
  return <span className="rhine-overlay-anchor" ref={ref}><MenuBase.Root open={open} onOpenChange={onOpenChange}><MenuBase.Trigger asChild>{trigger}</MenuBase.Trigger><MenuBase.Portal container={container}><MenuBase.Content ref={floatingRef} className="rhine-menu" aria-label={label} side={floatingSide} sideOffset={8} collisionPadding={12}>{items.map(item => <MenuBase.Item key={item.id} disabled={item.disabled} onSelect={item.onSelect} className="rhine-menu__item" data-danger={item.danger}>{item.label}</MenuBase.Item>)}</MenuBase.Content></MenuBase.Portal></MenuBase.Root></span>;
}
export function Tooltip({ children, content, open, onOpenChange, side }: OverlayControl & { children: ReactElement; content: string }) {
  const { ref, container } = useScope();
  const floatingRef = useFloatingScale(undefined, 'tooltip');
  const floatingSide = useFloatingSide(ref, side, 280);
  return <span className="rhine-overlay-anchor" ref={ref}><TooltipBase.Provider delayDuration={300}><TooltipBase.Root open={open} onOpenChange={onOpenChange}><TooltipBase.Trigger asChild>{children}</TooltipBase.Trigger><TooltipBase.Portal container={container}><TooltipBase.Content ref={floatingRef} className="rhine-tooltip" side={floatingSide} sideOffset={8} collisionPadding={12}>{content}</TooltipBase.Content></TooltipBase.Portal></TooltipBase.Root></TooltipBase.Provider></span>;
}
