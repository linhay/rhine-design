import { forwardRef, useEffect, useRef, useState, type AnchorHTMLAttributes, type ButtonHTMLAttributes } from 'react';
import { Button, type ButtonProps } from './components';

const paths = {
  settings: 'M3 5h3m4 0h7M3 15h3m4 0h7M3 10h8m4 0h2M6 3h4v4H6zM11 8h4v4h-4zM6 13h4v4H6z',
  menu: 'M3 5h14M3 10h14M3 15h14',
  close: 'm5 5 10 10M15 5 5 15',
  chevronDown: 'm5 8 5 5 5-5',
  chevronLeft: 'm12 5-5 5 5 5',
  chevronRight: 'm8 5 5 5-5 5',
  copy: 'M7 7h9v10H7zM4 13H3V3h9v1',
  refresh: 'M16 7A6 6 0 1 0 16 13M16 3v4h-4',
  search: 'M8.5 3a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11M13 13l4 4',
  info: 'M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16M10 9v5M10 6v.5',
  external: 'M11 3h6v6M17 3 9 11M7 3H3v14h14v-4',
  check: 'm4 10 4 4 8-8',
  more: 'M4 10h.1M10 10h.1M16 10h.1',
  moreVertical: 'M10 4v.1M10 10v.1M10 16v.1',
  connection: 'M7 2v4M13 2v4M5 6h10v3a5 5 0 0 1-10 0V6M10 14v4',
  chart: 'M3 3v14h14M7 13V9M11 13V5M15 13V7',
} as const;
export type IconName = keyof typeof paths;
export function Icon({ name, size = 20 }: { name: IconName; size?: 16 | 20 }) {
  return <svg className="rhine-icon" width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d={paths[name]} /></svg>;
}
export const IconButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { label: string; icon: IconName }>(function IconButton({ label, icon, className = '', type = 'button', ...props }, ref) {
  return <button {...props} ref={ref} type={type} aria-label={label} className={`rhine-button rhine-button--quiet rhine-icon-button ${className}`}><Icon name={icon} /></button>;
});
export function Link({ children, className = '', target, rel, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a {...props} target={target} rel={target === '_blank' ? `${rel || ''} noopener noreferrer`.trim() : rel} className={`rhine-link ${className}`}>{children}{target === '_blank' && <><Icon name="external" size={16} /><span className="rhine-sr-only">（新窗口打开）</span></>}</a>;
}
export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement>, Pick<ButtonProps, 'variant' | 'busy' | 'busyLabel'> {
  href: string;
  disabled?: boolean;
}
export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink({ href, variant = 'primary', busy = false, busyLabel = '处理中', disabled = false, className = '', children, tabIndex, onClick, onAuxClick, ...props }, ref) {
  const unavailable = disabled || busy;
  // Removing href also prevents context-menu and modified-click navigation while unavailable.
  return <a {...props} ref={ref} href={unavailable ? undefined : href} role="link"
    tabIndex={disabled ? -1 : tabIndex ?? (busy ? 0 : undefined)} aria-disabled={unavailable || undefined}
    aria-busy={busy || undefined} data-disabled={disabled || undefined} className={`rhine-button rhine-button--${variant} rhine-button-link ${className}`}
    onClick={event => { if (unavailable) { event.preventDefault(); event.stopPropagation(); return; } onClick?.(event); }}
    onAuxClick={event => { if (unavailable) { event.preventDefault(); event.stopPropagation(); return; } onAuxClick?.(event); }}>
    <span className={busy ? 'rhine-button__ghost' : undefined} aria-hidden={busy || undefined}>{children}</span>
    {busy && <span className="rhine-button__busy"><span className="rhine-spinner" aria-hidden="true" /><span className="rhine-sr-only">{busyLabel}</span></span>}
  </a>;
});
export function CopyButton({ value, label = '复制', copy = text => navigator.clipboard.writeText(text) }: { value: string; label?: string; copy?: (value: string) => Promise<void> }) {
  const [status, setStatus] = useState<'idle' | 'busy' | 'success' | 'error'>('idle');
  const pending = useRef(false);
  const epoch = useRef(0);
  useEffect(() => { epoch.current++; pending.current = false; setStatus('idle'); return () => { epoch.current++; }; }, [value]);
  const run = async () => {
    if (pending.current) return;
    pending.current = true; const request = epoch.current; setStatus('busy');
    try { await copy(value); if (request === epoch.current) setStatus('success'); }
    catch { if (request === epoch.current) setStatus('error'); }
    finally { if (request === epoch.current) pending.current = false; }
  };
  return <span className="rhine-copy"><Button variant="secondary" busy={status === 'busy'} busyLabel="正在复制" onClick={run}><Icon name="copy" size={16} /> {label}</Button><span role={status === 'error' ? 'alert' : 'status'} className={status === 'error' ? 'rhine-text--error' : 'rhine-text--muted'}>{status === 'success' ? '已复制' : status === 'error' ? '复制失败，请重试' : ''}</span></span>;
}
