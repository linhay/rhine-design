import { useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import * as DialogBase from '@radix-ui/react-dialog';
import * as AlertBase from '@radix-ui/react-alert-dialog';
import * as PopoverBase from '@radix-ui/react-popover';
import * as MenuBase from '@radix-ui/react-dropdown-menu';
import * as TooltipBase from '@radix-ui/react-tooltip';
import { Button, Notice } from './components';
import { IconButton } from './Actions';

// Keep portal content inside the root theme so tokens and reduced-motion overrides inherit.
function useScope() {
  const ref = useRef<HTMLSpanElement>(null);
  const [container, setContainer] = useState<HTMLElement>();
  useLayoutEffect(() => { setContainer((ref.current?.closest('.rhine-theme') as HTMLElement) || document.body); }, []);
  return { ref, container };
}
export interface DialogProps { trigger: ReactElement; title: string; description: string; children: ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }
export function Dialog({ trigger, title, description, children, open, onOpenChange }: DialogProps) {
  return <DialogFrame trigger={trigger} title={title} description={description} open={open} onOpenChange={onOpenChange}>{children}</DialogFrame>;
}
export function Drawer(props: DialogProps) { return <DialogFrame {...props} drawer />; }
function DialogFrame({ trigger, title, description, children, open, onOpenChange, drawer = false }: DialogProps & { drawer?: boolean }) {
  const { ref, container } = useScope();
  return <span className="rhine-overlay-anchor" ref={ref}><DialogBase.Root open={open} onOpenChange={onOpenChange}><DialogBase.Trigger asChild>{trigger}</DialogBase.Trigger><DialogBase.Portal container={container}>
    <DialogBase.Overlay className="rhine-overlay" /><DialogBase.Content className={`rhine-dialog${drawer ? ' rhine-drawer' : ''}`}><div className="rhine-dialog__head"><DialogBase.Title className="rhine-text rhine-text--section">{title}</DialogBase.Title><DialogBase.Close asChild><IconButton label={drawer ? '关闭抽屉' : '关闭对话框'} icon="close" /></DialogBase.Close></div><DialogBase.Description className="rhine-text rhine-text--body rhine-text--muted">{description}</DialogBase.Description><div className="rhine-dialog__body">{children}</div></DialogBase.Content>
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
  return <span className="rhine-overlay-anchor" ref={ref}><PopoverBase.Root open={open} onOpenChange={onOpenChange}><PopoverBase.Trigger asChild>{trigger}</PopoverBase.Trigger><PopoverBase.Portal container={container}><PopoverBase.Content className="rhine-popover" aria-label={title} side={side} sideOffset={8} collisionPadding={12}><div className="rhine-dialog__head"><strong>{title}</strong><PopoverBase.Close asChild><IconButton label="关闭详情" icon="close" /></PopoverBase.Close></div>{children}</PopoverBase.Content></PopoverBase.Portal></PopoverBase.Root></span>;
}
export interface MenuItem { id: string; label: string; disabled?: boolean; danger?: boolean; onSelect: () => void }
export function Menu({ trigger, label, items, open, onOpenChange, side }: OverlayControl & { trigger: ReactElement; label: string; items: MenuItem[] }) {
  const { ref, container } = useScope();
  return <span className="rhine-overlay-anchor" ref={ref}><MenuBase.Root open={open} onOpenChange={onOpenChange}><MenuBase.Trigger asChild>{trigger}</MenuBase.Trigger><MenuBase.Portal container={container}><MenuBase.Content className="rhine-menu" aria-label={label} side={side} sideOffset={8} collisionPadding={12}>{items.map(item => <MenuBase.Item key={item.id} disabled={item.disabled} onSelect={item.onSelect} className="rhine-menu__item" data-danger={item.danger}>{item.label}</MenuBase.Item>)}</MenuBase.Content></MenuBase.Portal></MenuBase.Root></span>;
}
export function Tooltip({ children, content, open, onOpenChange, side }: OverlayControl & { children: ReactElement; content: string }) {
  const { ref, container } = useScope();
  return <span className="rhine-overlay-anchor" ref={ref}><TooltipBase.Provider delayDuration={300}><TooltipBase.Root open={open} onOpenChange={onOpenChange}><TooltipBase.Trigger asChild>{children}</TooltipBase.Trigger><TooltipBase.Portal container={container}><TooltipBase.Content className="rhine-tooltip" side={side} sideOffset={8} collisionPadding={12}>{content}</TooltipBase.Content></TooltipBase.Portal></TooltipBase.Root></TooltipBase.Provider></span>;
}
