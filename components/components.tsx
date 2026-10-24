import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';

export type Tone = 'neutral' | 'success' | 'warning' | 'error';
const classes = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' ');

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  busy?: boolean;
  busyLabel?: string;
}
export function Button({ variant = 'primary', busy = false, busyLabel = '处理中', disabled, className, children, onClick, type = 'button', ...props }: ButtonProps) {
  return <button {...props} type={type} disabled={disabled} aria-disabled={busy || disabled || undefined}
    aria-busy={busy || undefined} className={classes('rhine-button', `rhine-button--${variant}`, className)}
    onClick={event => { if (busy) { event.preventDefault(); return; } onClick?.(event); }}>
    <span className={busy ? 'rhine-button__ghost' : undefined}>{children}</span>
    {busy && <span className="rhine-button__busy"><span className="rhine-spinner" aria-hidden="true" /><span className="rhine-sr-only">{busyLabel}</span></span>}
  </button>;
}
export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`rhine-badge rhine-tone-${tone}`}>{children}</span>;
}
export function Surface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={classes('rhine-surface', className)} />;
}
export function SelectionCard({ label, selected, onSelectedChange, disabled = false, showIndicator = true, children }: {
  label: string; selected: boolean; onSelectedChange: (value: boolean) => void; disabled?: boolean; showIndicator?: boolean; children: ReactNode;
}) {
  return <label className="rhine-selection" data-selected={selected} data-disabled={disabled}>
    <span className="rhine-selection__heading"><strong>{label}</strong><input className={showIndicator ? undefined : 'rhine-sr-only'} type="checkbox" aria-label={label} checked={selected} disabled={disabled} onChange={event => onSelectedChange(event.target.checked)} /></span>
    <span className="rhine-selection__content">{children}</span>
  </label>;
}
export function TextField({ label, hint, error, id: providedId, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const describedBy = [props['aria-describedby'], hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ');
  return <div className={classes('rhine-field', className)}>
    <label htmlFor={id}>{label}</label>
    <input {...props} id={id} aria-invalid={error ? true : props['aria-invalid']} aria-describedby={describedBy || undefined} />
    {hint && <span id={`${id}-hint`} className="rhine-field__hint">{hint}</span>}
    {error && <span id={`${id}-error`} className="rhine-field__error" role="alert">{error}</span>}
  </div>;
}
export interface Choice { value: string; label: string; disabled?: boolean }
export interface TabItem extends Choice { content: ReactNode }
export function Tabs({ label, items, value, onValueChange }: { label: string; items: TabItem[]; value: string; onValueChange: (value: string) => void }) {
  const id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  return <div className="rhine-tabs">
    <div role="tablist" aria-label={label} className="rhine-tabs__list" onKeyDown={event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const available = items.map((item, index) => ({ ...item, index })).filter(item => !item.disabled);
      if (!available.length) return;
      event.preventDefault();
      const current = available.findIndex(item => buttons.current[item.index] === event.target);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? available.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + available.length) % available.length;
      onValueChange(available[next].value); buttons.current[available[next].index]?.focus();
    }}>
      {items.map((item, index) => <button key={item.value} ref={node => { buttons.current[index] = node; }}
        type="button" role="tab" disabled={item.disabled} id={`${id}-tab-${index}`} aria-controls={`${id}-panel-${index}`}
        aria-selected={value === item.value} tabIndex={value === item.value ? 0 : -1} onClick={() => onValueChange(item.value)}>{item.label}</button>)}
    </div>
    {items.map((item, index) => <div key={item.value} role="tabpanel" id={`${id}-panel-${index}`} aria-labelledby={`${id}-tab-${index}`}
      hidden={value !== item.value} tabIndex={0} className="rhine-tabs__panel">{item.content}</div>)}
  </div>;
}
export function SegmentedControl({ label, items, value, onValueChange }: { label: string; items: Choice[]; value: string; onValueChange: (value: string) => void }) {
  const name = useId();
  return <fieldset className="rhine-segmented"><legend className="rhine-sr-only">{label}</legend>
    {items.map(item => <label key={item.value} className="rhine-segmented__option">
      <input type="radio" name={name} value={item.value} checked={value === item.value} disabled={item.disabled} onChange={() => onValueChange(item.value)} />
      <span>{item.label}</span>
    </label>)}
  </fieldset>;
}
export function Notice({ tone = 'neutral', title, children, action }: { tone?: Tone; title: string; children?: ReactNode; action?: ReactNode }) {
  return <div className={`rhine-notice rhine-tone-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
    <div><strong>{title}</strong>{children && <div className="rhine-notice__body">{children}</div>}</div>{action}
  </div>;
}
export function Progress({ label, value, valueText }: { label: string; value: number | null; valueText?: string }) {
  const determinate = value !== null && Number.isFinite(value);
  const amount = determinate ? Math.max(0, Math.min(100, value)) : null;
  return <div className="rhine-progress">
    <div className="rhine-progress__label"><span>{label}</span><strong>{valueText ?? (amount === null ? '处理中' : `${amount}%`)}</strong></div>
    <div className="rhine-progress__track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100}
      aria-valuenow={amount ?? undefined} aria-valuetext={valueText ?? (amount === null ? '进度未知' : `${amount}%`)} data-indeterminate={amount === null}>
      <span style={amount === null ? undefined : { transform: `scaleX(${amount / 100})` }} />
    </div>
  </div>;
}
export function Skeleton({ label = '正在加载', lines = 3 }: { label?: string; lines?: number }) {
  return <div className="rhine-skeleton" role="status"><span className="rhine-sr-only">{label}</span>
    {Array.from({ length: Math.max(1, Math.min(8, Math.floor(lines) || 1)) }, (_, index) => <span aria-hidden="true" key={index} />)}
  </div>;
}
export function Disclosure({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const node = useRef<HTMLDetailsElement>(null);
  const animation = useRef<Animation | null>(null);
  const intent = useRef(defaultOpen);
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const settle = () => {
      if (!media?.matches || !animation.current || !node.current) return;
      animation.current.cancel(); animation.current = null;
      node.current.open = intent.current; setOpen(intent.current);
    };
    media?.addEventListener('change', settle);
    return () => { animation.current?.cancel(); media?.removeEventListener('change', settle); };
  }, []);
  useEffect(() => {
    if (!animation.current || !node.current) return;
    if (parseFloat(getComputedStyle(node.current).getPropertyValue('--rhine-duration-notice')) !== 0) return;
    animation.current.cancel(); animation.current = null;
    node.current.open = intent.current; setOpen(intent.current);
  });
  function toggle() {
    const el = node.current;
    if (!el) return;
    const from = el.getBoundingClientRect().height;
    animation.current?.cancel();
    intent.current = !intent.current;
    const expanded = intent.current;
    el.dataset.expanded = String(expanded);
    const summary = el.querySelector('summary')!;
    // Native details removes closed content from keyboard and accessibility navigation.
    el.open = true;
    if (!expanded && el.contains(document.activeElement)) summary.focus();
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !el.animate) { el.open = expanded; setOpen(expanded); return; }
    const style = getComputedStyle(el);
    const parsedDuration = parseFloat(style.getPropertyValue('--rhine-duration-notice'));
    const duration = Number.isFinite(parsedDuration) ? parsedDuration : 200;
    if (duration === 0) { el.open = expanded; setOpen(expanded); return; }
    const to = expanded ? el.getBoundingClientRect().height : summary.getBoundingClientRect().height + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    const next = el.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration, easing: style.getPropertyValue(expanded ? '--rhine-ease-standard' : '--rhine-ease-exit').trim() || 'ease' });
    animation.current = next;
    next.onfinish = () => {
      if (animation.current !== next) return;
      el.open = expanded; setOpen(expanded); animation.current = null;
    };
  }
  return <details ref={node} open={open} data-expanded={open} className="rhine-disclosure">
    <summary onClick={event => { event.preventDefault(); toggle(); }}>{title}<span aria-hidden="true">+</span></summary>
    <div className="rhine-disclosure__content">{children}</div>
  </details>;
}
export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="rhine-empty"><strong>{title}</strong><p>{description}</p>{action}</div>;
}
