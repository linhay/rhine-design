import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from './Actions';
import type { Tone } from './components';
import { Text } from './Typography';
import { useDismissFocus } from './focus-recovery';

export function Toast({ eventId, open, onOpenChange, title, description, tone = 'success', duration = 5000, placement = 'inline' }: {
  /** Identifies notification lifetime only; does not request another announcement. */
  eventId?: string | number; open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; tone?: Tone; duration?: number; placement?: 'inline' | 'floating';
}) {
  const anchor = useRef<HTMLSpanElement>(null), content = useRef<HTMLDivElement>(null);
  const recovery = useDismissFocus(content, { open, origin: placement === 'floating' ? anchor : content });
  const [container, setContainer] = useState<HTMLElement>();
  // Escape scrolling panels while inheriting the host theme and reduced-motion setting.
  useLayoutEffect(() => { if (placement === 'floating') setContainer((anchor.current?.closest('.rhine-theme') as HTMLElement) || document.body); }, [placement]);
  const [hover, setHover] = useState(false), [focus, setFocus] = useState(false), [hidden, setHidden] = useState(false);
  const remaining = useRef(duration), close = useRef(onOpenChange);
  close.current = onOpenChange;
  useEffect(() => { const update = () => setHidden(document.hidden); update(); document.addEventListener('visibilitychange', update); return () => document.removeEventListener('visibilitychange', update); }, []);
  // Commit the new lifetime before an old timeout can run after a render.
  useLayoutEffect(() => { remaining.current = duration; }, [eventId, open, duration, title, description, tone]);
  useEffect(() => { if (!open) { setHover(false); setFocus(false); } }, [open]);
  useLayoutEffect(() => {
    if (!open || hover || focus || hidden || document.hidden || tone === 'error' || tone === 'warning' || duration <= 0) return;
    let active = true;
    const started = Date.now(); const timer = setTimeout(() => { if (active) close.current(false); }, Math.max(0, remaining.current));
    return () => { active = false; clearTimeout(timer); remaining.current = Math.max(0, remaining.current - (Date.now() - started)); };
  }, [eventId, open, hover, focus, hidden, tone, duration, title, description]);
  const notification = <div className="rhine-toast-region" data-placement={placement} aria-label="通知">
    <div ref={content} role={tone === 'error' ? 'alert' : 'status'} aria-atomic="true" className={open ? `rhine-toast rhine-tone-${tone}` : 'rhine-sr-only'} onFocusCapture={recovery.onFocusCapture}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setFocus(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocus(false); }}>
      {open && <><div><Text as="strong" variant="label">{title}</Text>{description && <Text variant="caption">{description}</Text>}</div><IconButton label="关闭通知" icon="close" onClick={event => recovery.dismiss(event.currentTarget, () => onOpenChange(false))} /></>}
    </div>
  </div>;
  return placement === 'floating' ? <><span ref={anchor} hidden />{container && createPortal(notification, container)}</> : notification;
}
