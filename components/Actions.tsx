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
  plus: 'M10 3v14M3 10h14',
  search: 'M8.5 3a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11M13 13l4 4',
  info: 'M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16M10 9v5M10 6v.5',
  external: 'M11 3h6v6M17 3 9 11M7 3H3v14h14v-4',
  check: 'm4 10 4 4 8-8',
  more: 'M4 10h.1M10 10h.1M16 10h.1',
  moreVertical: 'M10 4v.1M10 10v.1M10 16v.1',
  connection: 'M7 2v4M13 2v4M5 6h10v3a5 5 0 0 1-10 0V6M10 14v4',
  chart: 'M3 3v14h14M7 13V9M11 13V5M15 13V7',
  download: "M10 2v10m-4-4 4 4 4-4M3 13v4h14v-4",
  delete: "M3 5h14M7 5V3h6v2M5 5l1 12h8l1-12M8 8v6m4-6v6",
  edit: "m3 13 10-10 4 4L7 17H3zM11 5l4 4",
  send: "m2 3 16 7-16 7 3-7zM5 10h13",
  filter: "M2 3h16l-6 7v6l-4 2v-8z",
  sortAscending: "M4 16V3m-3 3 3-3 3 3M10 5h3m-3 5h5m-5 5h8",
  sortDescending: "M4 3v13m-3-3 3 3 3-3M10 5h8m-8 5h5m-5 5h3",
  show: "M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6M13 10a3 3 0 1 0-6 0 3 3 0 0 0 6 0",
  hide: "m2 2 16 16M4 5c-1 1-2 3-2 5 0 0 3 6 8 6 2 0 4-1 5-2M7 4c1-1 2-1 3-1 5 0 8 7 8 7l-2 3M8 8a3 3 0 0 0 4 4",
  export: "M8 3H3v14h14v-5M10 10l7-7m-6 0h6v6",
  move: "M10 1v18M1 10h18M7 4l3-3 3 3M7 16l3 3 3-3M4 7l-3 3 3 3M16 7l3 3-3 3",
  swap: "M3 6h14m-4-4 4 4-4 4M17 14H3m4-4-4 4 4 4",
  reset: "M4 7a7 7 0 1 1-1 6M4 2v5h5",
  person: "M13 6a3 3 0 1 0-6 0 3 3 0 0 0 6 0M4 18v-2a6 6 0 0 1 12 0v2",
  users: "M11 6a3 3 0 1 0-6 0 3 3 0 0 0 6 0M2 18v-2a6 6 0 0 1 12 0v2M14 3a3 3 0 0 1 0 6m2 3a5 5 0 0 1 2 4v2",
  organization: "M7 2h6v5H7zM2 13h5v5H2zM13 13h5v5h-5zM10 7v3M4 13v-3h12v3",
  tree: "M3 2v13h4M3 6h4M7 3h10v6H7zM7 12h10v6H7z",
  document: "M4 2h8l4 4v12H4zM12 2v5h4M7 10h6m-6 4h6",
  folder: "M2 5V3h6l2 2h8v12H2z",
  code: "m6 5-5 5 5 5m8-10 5 5-5 5M12 3 8 17",
  database: "M3 5a7 3 0 1 0 14 0 7 3 0 1 0-14 0M3 5v10a7 3 0 0 0 14 0V5M3 10a7 3 0 0 0 14 0",
  history: "M3 6a8 8 0 1 1-1 7M3 1v5h5M10 6v5l3 2",
  clock: "M18 10a8 8 0 1 0-16 0 8 8 0 0 0 16 0M10 5v6l4 2",
  key: "M9 7a4 4 0 1 0-8 0 4 4 0 0 0 8 0M8 10l9 8m-4-4 3-3m-1 5 3-3",
  lock: "M4 9h12v9H4zM6 9V6a4 4 0 0 1 8 0v3M10 12v3",
  shield: "M10 1 2 4v6c0 4 8 9 8 9s8-5 8-9V4zM6 10l3 3 5-6",
  warning: "m10 2 9 16H1zM10 7v5m0 3v.2",
  help: "M18 10a8 8 0 1 0-16 0 8 8 0 0 0 16 0M7 7a3 3 0 1 1 4 3c-1 .5-1 1-1 2m0 3v.1",
  question: "M18 10a8 8 0 1 0-16 0 8 8 0 0 0 16 0M7 7a3 3 0 1 1 4 3c-1 .5-1 1-1 2m0 3v.1",
  robot: "M6 8h8v8H6zM8 8V5h4v3M4 11h2m10 0h2M8 12h.1M12 12h.1M8 15h4",
  envelope: "M2 5h16v10H2zM2 6l8 6 8-6",
  save: "M3 3h11l3 3v11H3zM6 3v5h7V3M6 17v-5h8v5",
  verify: "M3 10h4l2-4 3 8 2-4h3",
} as const;
export type IconName = keyof typeof paths;
export const iconNames: readonly IconName[] = Object.freeze(Object.keys(paths) as IconName[]);
export interface IconProps { name: IconName; size?: 16 | 20; /** Omit for decoration; interactive names belong to the button. */ label?: string }
export function Icon({ name, size = 20, label }: IconProps) {
  if (!Object.hasOwn(paths, name)) throw new RangeError('Unknown icon name. Use iconNames to inspect supported names.');
  if (size !== 16 && size !== 20) throw new RangeError('Icon size must be 16 or 20.');
  if (label !== undefined && !label.trim()) throw new TypeError('A standalone icon label must be nonempty.');
  return <svg className="rhine-icon" width={size} height={size} viewBox="0 0 20 20" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false"><path d={paths[name]} /></svg>;
}
export const IconButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { label: string; icon: IconName; busy?: boolean }>(function IconButton({ label, icon, busy = false, disabled, onClick, className = '', type = 'button', ...props }, ref) {
  const unavailable = busy || disabled || props['aria-disabled'] === true || props['aria-disabled'] === 'true';
  return <button {...props} ref={ref} type={type} disabled={disabled} aria-label={label} aria-disabled={unavailable || props['aria-disabled']} aria-busy={busy || props['aria-busy']} className={`rhine-button rhine-button--quiet rhine-icon-button ${className}`} onClick={event => { if (unavailable) { event.preventDefault(); return; } onClick?.(event); }}>
    {busy ? <><span className="rhine-button__ghost"><Icon name={icon} /></span><span className="rhine-button__busy"><span className="rhine-spinner" aria-hidden="true" /></span></> : <Icon name={icon} />}
  </button>;
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
